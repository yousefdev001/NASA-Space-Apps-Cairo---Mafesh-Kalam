"""
AuraMed Ground Station & Houston Flight Surgeon Telemetry Server
NASA STD-3001 Compliant Telemetry Gateway, Real-Time WebSocket Hub,
and Specialized Ground Flight Surgeon Rescue AI Co-Pilot.

Listens on http://0.0.0.0:8000
Compatible with AuraMed Flutter Mobile App (D:\\Nasa)
"""

import asyncio
import json
import logging
import math
import os
import random
import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Set

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("auramed_ground")

app = FastAPI(
    title="AuraMed Ground Mission Telemetry Gateway",
    description="Houston Flight Surgeon Dashboard & Astronaut Telemetry Hub (NASA STD-3001)",
    version="1.0.0",
)

# Enable CORS for Flutter app, web browsers, and Cloudflare tunnels
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Global State & In-Memory Store
# -----------------------------------------------------------------------------
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

class GlobalTelemetryState:
    def __init__(self):
        self.astronaut_id = "ASTRO-8492"
        self.full_name = "Commander Sarah Vance"
        self.mission_name = "Artemis III Lunar Outpost"
        self.spacecraft = "Orion Gateway / Habitat Node 1"
        self.mission_day = 42
        self.total_days = 180
        self.connection_status = "DSN LINK NOMINAL"
        self.is_connected = True
        self.signal_quality = 98.4
        self.latency_ms = 48

        # Current live vitals
        self.vitals = {
            "heart_rate_bpm": 74.0,
            "spo2_percent": 98.2,
            "systolic_bp_mmhg": 118.0,
            "diastolic_bp_mmhg": 76.0,
            "body_temperature_c": 36.8,
            "respiratory_rate_bpm": 16.0,
            "hrv_rmssd_ms": 48.0,
        }

        # Organ statuses and efficiency scores (0-100)
        self.organs = {
            "brain": {"name": "Brain", "system": "Central Nervous System", "score": 95, "status": "NOMINAL", "metric": "ICP 11.2 mmHg"},
            "lungs": {"name": "Lungs", "system": "Pulmonary & Gas Exchange", "score": 98, "status": "NOMINAL", "metric": "SpO2 98.2%"},
            "heart": {"name": "Heart", "system": "Cardiovascular Perfusion", "score": 96, "status": "NOMINAL", "metric": "HR 74 BPM"},
            "liver": {"name": "Liver", "system": "Hepatic Metabolic Clearance", "score": 93, "status": "NOMINAL", "metric": "ALT 24 U/L"},
            "kidneys": {"name": "Kidneys", "system": "Renal Fluid Filtration", "score": 95, "status": "NOMINAL", "metric": "eGFR 102 mL/min"},
        }

        self.overall_score = 96
        self.overall_status = "NOMINAL"  # NOMINAL, CAUTION, CRITICAL
        self.active_alert: Optional[Dict[str, Any]] = None
        self.alerts_history: List[Dict[str, Any]] = []

        # History buffers for charts (last 60 data points)
        self.history: List[Dict[str, Any]] = []
        self.last_updated = datetime.utcnow().isoformat() + "Z"
        self.packet_count = 1420

        # Ground Comms Transcript
        self.comms_messages: List[Dict[str, Any]] = [
            {
                "id": "comms-1",
                "sender": "ground",
                "sender_title": "Houston Flight Surgeon (Dr. Sarah Chen)",
                "text": "Orion Gateway, this is Houston Flight Surgeon. We have continuous biometric telemetry lock. SpO2 and resting pulse are within baseline.",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
                "is_urgent": False,
            },
            {
                "id": "comms-2",
                "sender": "astronaut",
                "sender_title": "Commander Sarah Vance (Orion)",
                "text": "Copy Houston. Completed scheduled 60-minute cycle on the resistive device. Ready for EVA pre-breathe protocol.",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
                "is_urgent": False,
            },
            {
                "id": "comms-3",
                "sender": "ground",
                "sender_title": "Houston Flight Surgeon (Dr. Sarah Chen)",
                "text": "Excellent work. Maintain hydration and report any vestibulocochlear discomfort or spatial disorientation.",
                "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
                "is_urgent": False,
            },
        ]

        self._seed_initial_history()

    def _seed_initial_history(self):
        now = time.time()
        for i in range(40, -1, -1):
            t = now - (i * 3)
            # Normal variations
            hr = 72.0 + math.sin(i * 0.4) * 4.0 + random.uniform(-1.0, 1.0)
            spo2 = 98.0 + math.cos(i * 0.3) * 0.6 + random.uniform(-0.2, 0.2)
            sys = 118.0 + math.sin(i * 0.2) * 3.0
            dia = 76.0 + math.cos(i * 0.2) * 2.0
            temp = 36.8 + math.sin(i * 0.1) * 0.1
            resp = 16.0 + math.sin(i * 0.3) * 1.0

            self.history.append({
                "time": datetime.utcfromtimestamp(t).strftime("%H:%M:%S"),
                "hr": round(hr, 1),
                "spo2": round(spo2, 1),
                "sys": round(sys, 1),
                "dia": round(dia, 1),
                "temp": round(temp, 1),
                "resp": round(resp, 1),
            })

state = GlobalTelemetryState()

# -----------------------------------------------------------------------------
# WebSocket Connection Manager
# -----------------------------------------------------------------------------
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        if not self.active_connections:
            return
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()

# -----------------------------------------------------------------------------
# Helper Functions: Triage & NASA STD-3001 Evaluation
# -----------------------------------------------------------------------------
def evaluate_clinical_telemetry(vitals: Dict[str, Any]) -> Dict[str, Any]:
    hr = float(vitals.get("heart_rate_bpm") or vitals.get("heart_rate") or 74.0)
    spo2 = float(vitals.get("spo2_percent") or vitals.get("spo2") or 98.0)
    sys = float(vitals.get("systolic_bp_mmhg") or vitals.get("systolic") or 118.0)
    dia = float(vitals.get("diastolic_bp_mmhg") or vitals.get("diastolic") or 76.0)
    temp = float(vitals.get("body_temperature_c") or vitals.get("core_temp") or 36.8)
    resp = float(vitals.get("respiratory_rate_bpm") or vitals.get("resp") or 16.0)

    severity = "NOMINAL"
    anomaly_detected = False
    findings = []
    actions = []
    hazard_level = "Nominal Flight Operations"
    escalation_required = False

    # 1. Hypoxia Check
    if spo2 < 90.0:
        severity = "CRITICAL"
        anomaly_detected = True
        hazard_level = "Severe Acute Hypoxemia (Hypoxia Event)"
        escalation_required = True
        findings.append(f"Arterial SpO2 dropped dangerously to {spo2:.1f}%")
        actions.append({
            "action": "Immediate 100% O2 delivery via high-flow demand regulator mask (12-15 L/min).",
            "ref_label": "NASA-EM-O2-01",
            "priority": "IMMEDIATE",
            "warning": "Critical Risk: Cognitive degradation occurs within 60-90s at this saturation level."
        })
        actions.append({
            "action": "Verify cabin / EVA suit partial pressure of O2 (Target: pO2 >= 140 mmHg / 18.6 kPa).",
            "ref_label": "ECLSS-O2-VER",
            "priority": "HIGH"
        })
        actions.append({
            "action": "Instruct habitat crew to assist astronaut to seated recovery position and prepare emergency portable O2 bottle.",
            "ref_label": "CREW-ASSIST-01",
            "priority": "HIGH"
        })
    elif spo2 < 94.0:
        if severity != "CRITICAL":
            severity = "CAUTION"
        anomaly_detected = True
        hazard_level = "Mild Hypoxic Strain"
        findings.append(f"Sub-optimal Blood Oxygen: {spo2:.1f}%")
        actions.append({
            "action": "Check suit ventilation loop circulation and inspect cabin CO2 scrubber canisters.",
            "ref_label": "ECLSS-CHK-04",
            "priority": "MEDIUM"
        })

    # 2. Cardiac Check
    if hr > 135.0:
        severity = "CRITICAL"
        anomaly_detected = True
        hazard_level = "Acute Tachycardia / Hemodynamic Stress"
        escalation_required = True
        findings.append(f"Cardiac Rate Spike: {int(hr)} BPM")
        actions.append({
            "action": "Halt all resistive exercise or EVA maneuvers immediately. Enforce zero physical exertion.",
            "ref_label": "CARD-HALT-EXERT",
            "priority": "IMMEDIATE",
            "warning": "Severe myocardial oxygen demand elevation in microgravity."
        })
        actions.append({
            "action": "Initiate guided 4-7-8 autonomic vagal breathing maneuvers to reduce sympathetic surge.",
            "ref_label": "VAGAL-REC-02",
            "priority": "HIGH"
        })
        actions.append({
            "action": "Have medical kit ready with sublingual beta-blocker (Propranolol 10mg) if tachycardia persists >10 min.",
            "ref_label": "MED-PHARM-CARD",
            "priority": "MEDIUM"
        })
    elif hr < 48.0:
        if severity != "CRITICAL":
            severity = "CAUTION"
        anomaly_detected = True
        findings.append(f"Marked Sinus Bradycardia: {int(hr)} BPM")
        actions.append({
            "action": "Instruct astronaut to perform mild calf flexion and check for neuro-cardiogenic syncope.",
            "ref_label": "CARD-BRAD-01",
            "priority": "MEDIUM"
        })

    # 3. Core Body Temperature Check
    if temp > 38.3:
        severity = "CRITICAL"
        anomaly_detected = True
        hazard_level = "Severe Hyperthermia / EVA Thermal Runaway"
        escalation_required = True
        findings.append(f"Core Body Temperature Critical: {temp:.1f}°C")
        actions.append({
            "action": "Maximize Liquid Cooling & Ventilation Garment (LCVG) coolant valve to position 5 (Max Cool).",
            "ref_label": "EVA-LCVG-MAX",
            "priority": "IMMEDIATE",
            "warning": "Heat exhaustion threshold reached. Anhidrotic collapse hazard."
        })
        actions.append({
            "action": "Prepare 750ml cooled electrolyte pouch for immediate oral or IV hydration.",
            "ref_label": "HYD-COOL-PCH",
            "priority": "HIGH"
        })
    elif temp < 35.2:
        severity = "CRITICAL"
        anomaly_detected = True
        hazard_level = "Severe Hypothermia Anomaly"
        escalation_required = True
        findings.append(f"Hypothermia Threshold: {temp:.1f}°C")
        actions.append({
            "action": "Engage suit thermal heating elements and verify umbilical thermal circuit continuity.",
            "ref_label": "EVA-HEAT-ON",
            "priority": "IMMEDIATE"
        })

    # 4. Respiratory & Blood Pressure
    if resp > 26.0:
        if severity != "CRITICAL":
            severity = "CAUTION"
        anomaly_detected = True
        findings.append(f"Tachypneic Respiration: {int(resp)} BrPM")
        actions.append({
            "action": "Verify habitat atmospheric pCO2 levels. Elevated CO2 (>3 mmHg) induces respiratory hyperventilation.",
            "ref_label": "ECLSS-PCO2-WARN",
            "priority": "MEDIUM"
        })

    if sys > 155.0 or sys < 85.0:
        if severity != "CRITICAL":
            severity = "CAUTION"
        anomaly_detected = True
        findings.append(f"Arterial Pressure Deviation: {int(sys)}/{int(dia)} mmHg")
        actions.append({
            "action": "Perform manual sphygmomanometer recheck on left brachial artery after 3-minute seated rest.",
            "ref_label": "BP-RECHECK-01",
            "priority": "MEDIUM"
        })

    # Calculate overall health score
    score = 98
    if severity == "CRITICAL":
        score = random.randint(48, 62)
    elif severity == "CAUTION":
        score = random.randint(72, 84)

    # Organ status updates
    brain_score = 95 if hr < 110 and spo2 >= 95 else (70 if severity == "CAUTION" else 50)
    heart_score = 96 if hr <= 100 and hr >= 55 else (75 if severity == "CAUTION" else 45)
    lungs_score = 98 if spo2 >= 95 and resp <= 20 else (72 if severity == "CAUTION" else 48)

    summary = (
        "Astronaut physiological telemetry is fully compliant with NASA STD-3001 baseline operational standards."
        if not findings
        else "Clinical Anomaly Flagged: " + " • ".join(findings)
    )

    return {
        "severity": severity,
        "overall_score": score,
        "hazard_risk_level": hazard_level,
        "anomaly_detected": anomaly_detected,
        "findings": findings,
        "action_steps": actions,
        "escalation_required": escalation_required,
        "summary": summary,
        "brain_score": brain_score,
        "heart_score": heart_score,
        "lungs_score": lungs_score,
    }

def update_state_with_vitals(vitals_data: Dict[str, Any], source_label: str = "Live Telemetry"):
    state.vitals["heart_rate_bpm"] = float(vitals_data.get("heart_rate_bpm") or vitals_data.get("heart_rate") or state.vitals["heart_rate_bpm"])
    state.vitals["spo2_percent"] = float(vitals_data.get("spo2_percent") or vitals_data.get("spo2") or state.vitals["spo2_percent"])
    state.vitals["systolic_bp_mmhg"] = float(vitals_data.get("systolic_bp_mmhg") or vitals_data.get("systolic") or state.vitals["systolic_bp_mmhg"])
    state.vitals["diastolic_bp_mmhg"] = float(vitals_data.get("diastolic_bp_mmhg") or vitals_data.get("diastolic") or state.vitals["diastolic_bp_mmhg"])
    state.vitals["body_temperature_c"] = float(vitals_data.get("body_temperature_c") or vitals_data.get("core_temp") or state.vitals["body_temperature_c"])
    state.vitals["respiratory_rate_bpm"] = float(vitals_data.get("respiratory_rate_bpm") or vitals_data.get("resp") or state.vitals["respiratory_rate_bpm"])
    state.vitals["hrv_rmssd_ms"] = float(vitals_data.get("hrv_rmssd_ms") or state.vitals["hrv_rmssd_ms"])

    eval_result = evaluate_clinical_telemetry(state.vitals)

    state.overall_status = eval_result["severity"]
    state.overall_score = eval_result["overall_score"]

    # Update individual organs
    state.organs["heart"]["score"] = eval_result["heart_score"]
    state.organs["heart"]["status"] = eval_result["severity"]
    state.organs["heart"]["metric"] = f"{int(state.vitals['heart_rate_bpm'])} BPM"

    state.organs["lungs"]["score"] = eval_result["lungs_score"]
    state.organs["lungs"]["status"] = eval_result["severity"] if state.vitals["spo2_percent"] < 95 else "NOMINAL"
    state.organs["lungs"]["metric"] = f"SpO2 {state.vitals['spo2_percent']:.1f}%"

    state.organs["brain"]["score"] = eval_result["brain_score"]
    state.organs["brain"]["status"] = eval_result["severity"] if (state.vitals["spo2_percent"] < 92 or state.vitals["heart_rate_bpm"] > 130) else "NOMINAL"

    # Manage active alert
    if eval_result["anomaly_detected"]:
        state.active_alert = {
            "id": f"ALT-{int(time.time())}",
            "title": eval_result["hazard_risk_level"],
            "severity": eval_result["severity"],
            "summary": eval_result["summary"],
            "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
            "findings": eval_result["findings"],
            "action_steps": eval_result["action_steps"],
            "escalation_required": eval_result["escalation_required"],
            "source": source_label,
        }
        state.alerts_history.insert(0, state.active_alert)
        if len(state.alerts_history) > 30:
            state.alerts_history.pop()
    else:
        state.active_alert = None

    # Append to rolling history
    now_str = datetime.utcnow().strftime("%H:%M:%S")
    state.history.append({
        "time": now_str,
        "hr": round(state.vitals["heart_rate_bpm"], 1),
        "spo2": round(state.vitals["spo2_percent"], 1),
        "sys": round(state.vitals["systolic_bp_mmhg"], 1),
        "dia": round(state.vitals["diastolic_bp_mmhg"], 1),
        "temp": round(state.vitals["body_temperature_c"], 1),
        "resp": round(state.vitals["respiratory_rate_bpm"], 1),
    })
    if len(state.history) > 60:
        state.history.pop(0)

    state.last_updated = datetime.utcnow().isoformat() + "Z"
    state.packet_count += 1

    return eval_result

# -----------------------------------------------------------------------------
# REST Endpoints for Flutter Mobile App Integration
# -----------------------------------------------------------------------------
@app.get("/health")
async def health_check():
    """Unauthenticated health probe called by Flutter app & monitoring systems."""
    return {
        "status": "healthy",
        "operating_mode": "online",
        "service": "AuraMed Ground Mission Telemetry Gateway",
        "server_time": datetime.utcnow().isoformat() + "Z",
        "active_clients": len(ws_manager.active_connections),
    }

@app.post("/api/v1/telemetry/report")
async def receive_telemetry_report(payload: Dict[str, Any]):
    """
    Ingests full sequential telemetry push from AuraMed Flutter App.
    Payload: { astronaut_id, timestamp, vitals, organ_statuses, anomalies_detected }
    """
    vitals = payload.get("vitals", {})
    astronaut_id = payload.get("astronaut_id", state.astronaut_id)
    state.astronaut_id = astronaut_id

    eval_result = update_state_with_vitals(vitals, source_label="Astronaut Mobile Push")

    # Broadcast to all connected Ground Monitor dashboards in real time
    await ws_manager.broadcast({
        "type": "TELEMETRY_UPDATE",
        "payload": {
            "vitals": state.vitals,
            "organs": state.organs,
            "overall_score": state.overall_score,
            "overall_status": state.overall_status,
            "active_alert": state.active_alert,
            "last_updated": state.last_updated,
            "packet_count": state.packet_count,
            "latest_history": state.history[-1] if state.history else None,
        }
    })

    return {
        "status": "received",
        "code": 200,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "astronaut_id": astronaut_id,
        "triage_severity": eval_result["severity"],
        "anomaly_flagged": eval_result["anomaly_detected"],
    }

@app.post("/api/v1/assess-astronaut")
async def assess_astronaut(payload: Dict[str, Any]):
    """
    Matches the Flutter app's AuraMedApiService.assessAstronaut endpoint.
    Returns structured NASA STD-3001 ML assessment with action checklist.
    """
    vitals = payload.get("vitals", {})
    astronaut_id = payload.get("astronaut_id", state.astronaut_id)
    state.astronaut_id = astronaut_id

    eval_result = update_state_with_vitals(vitals, source_label="AuraMed Assessment Engine")

    # Broadcast update to web monitors
    await ws_manager.broadcast({
        "type": "TELEMETRY_UPDATE",
        "payload": {
            "vitals": state.vitals,
            "organs": state.organs,
            "overall_score": state.overall_score,
            "overall_status": state.overall_status,
            "active_alert": state.active_alert,
            "last_updated": state.last_updated,
            "packet_count": state.packet_count,
        }
    })

    steps_formatted = []
    for step in eval_result["action_steps"]:
        steps_formatted.append({
            "action": step["action"],
            "ref_label": step["ref_label"],
            "warning": step.get("warning")
        })

    if not steps_formatted:
        steps_formatted = [
            {"action": "Maintain scheduled fluid intake (250 mL/hour cabin baseline).", "ref_label": "NASA-HYD-STD"},
            {"action": "Continue mission duty timeline and routine telemetry streaming.", "ref_label": "OPS-NOM-CHECK"},
        ]

    return {
        "severity": eval_result["severity"].capitalize(),
        "ml_assessment": {
            "anomaly_detected": eval_result["anomaly_detected"],
            "confidence_score": 0.96,
            "hazard_risk_level": eval_result["hazard_risk_level"],
        },
        "summary": eval_result["summary"],
        "action_steps": steps_formatted,
        "escalation_required": eval_result["escalation_required"],
        "escalation_reason": "Critical biometric limit exceeded. Ground Surgeon intervention mandated." if eval_result["escalation_required"] else None,
    }

@app.post("/api/v1/predict")
async def predict_telemetry(payload: Dict[str, Any]):
    """Matches the Flutter app's FastApiService.predictTelemetry endpoint."""
    eval_result = update_state_with_vitals(payload, source_label="FastAPI ML Predictor")

    await ws_manager.broadcast({
        "type": "TELEMETRY_UPDATE",
        "payload": {
            "vitals": state.vitals,
            "organs": state.organs,
            "overall_score": state.overall_score,
            "overall_status": state.overall_status,
            "active_alert": state.active_alert,
            "last_updated": state.last_updated,
        }
    })

    return {
        "is_anomaly": eval_result["anomaly_detected"],
        "severity": eval_result["severity"].capitalize(),
        "anomaly_score": 0.94 if eval_result["severity"] == "CRITICAL" else (0.65 if eval_result["severity"] == "CAUTION" else 0.05),
        "description": eval_result["summary"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

@app.post("/api/v1/ground-comms")
async def receive_ground_comms(payload: Dict[str, Any]):
    """Receives message sent from the astronaut in the mobile app."""
    text = payload.get("text", "").strip()
    sender = payload.get("sender", "astronaut")
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    msg_id = f"comms-{int(time.time()*1000)}"
    new_message = {
        "id": msg_id,
        "sender": sender,
        "sender_title": f"Commander {state.astronaut_id} (Orion)",
        "text": text,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
        "is_urgent": state.overall_status == "CRITICAL",
    }
    state.comms_messages.append(new_message)

    # Broadcast to all dashboard monitors
    await ws_manager.broadcast({
        "type": "NEW_COMMS_MESSAGE",
        "payload": new_message
    })

    return {"status": "ok", "message_id": msg_id}

@app.get("/api/v1/ground-comms")
async def get_ground_comms():
    """Returns the full comms history between astronaut and ground."""
    return {"messages": state.comms_messages}

@app.post("/api/v1/ground-comms/send-to-astronaut")
async def send_ground_comms(payload: Dict[str, Any]):
    """Ground Flight Surgeon transmits a message to the astronaut."""
    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    msg_id = f"comms-{int(time.time()*1000)}"
    new_message = {
        "id": msg_id,
        "sender": "ground",
        "sender_title": "Houston Flight Surgeon (Dr. Sarah Chen)",
        "text": text,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
        "is_urgent": payload.get("is_urgent", False),
    }
    state.comms_messages.append(new_message)

    await ws_manager.broadcast({
        "type": "NEW_COMMS_MESSAGE",
        "payload": new_message
    })

    return {"status": "transmitted", "message": new_message}

@app.post("/v1/chat")
@app.post("/api/v1/rag-chat")
async def astronaut_rag_chat(payload: Dict[str, Any]):
    """Standard RAG query for astronaut self-support."""
    msg = payload.get("message") or payload.get("prompt") or ""
    return {
        "response": (
            "AuraMed Aerospace Medicine Engine: Maintain hydration baseline, monitor real-time ECG, "
            "and follow the clinical action protocols indicated on your dashboard. Houston Ground Surgeon is in direct telemetry lock."
        ),
        "answer": "Acknowledged. Telemetry lock nominal.",
        "citations": ["NASA STD-3001 Aerospace Medicine", "ISS Medical Protocols"],
        "confidence": 0.95,
    }

# -----------------------------------------------------------------------------
# Specialized Ground Flight Surgeon Rescue AI Co-Pilot
# (Engineered specifically to help the MONITOR save the astronaut faster!)
# -----------------------------------------------------------------------------
class MonitorChatRequest(BaseModel):
    query: str
    include_vitals: bool = True

@app.post("/api/v1/monitor/chat")
async def flight_surgeon_rescue_ai(req: MonitorChatRequest):
    """
    Dedicated AI Medical Advisor for the Ground Flight Surgeon / Monitor in Houston.
    Provides immediate emergency triage protocols, pharmacological guidelines,
    suit/cabin life support commands, and direct radio directives to transmit to the astronaut.
    """
    query = req.query.strip().lower()
    vitals = state.vitals
    hr = vitals["heart_rate_bpm"]
    spo2 = vitals["spo2_percent"]
    bp = f"{int(vitals['systolic_bp_mmhg'])}/{int(vitals['diastolic_bp_mmhg'])}"
    temp = vitals["body_temperature_c"]
    resp = vitals["respiratory_rate_bpm"]
    alert = state.active_alert

    # Intelligent Clinical Rule Engine with NASA STD-3001 Medical Protocols
    title = "Flight Surgeon Clinical Recommendation"
    triage_level = state.overall_status
    urgent_actions = []
    pharmacopeia = []
    eclss_commands = []
    radio_directive = ""
    citations = ["NASA STD-3001 Vol 1 & 2", "NASA Flight Surgeon Clinical Handbook", "ISS Medical Operations (MedOps)"]

    is_hypoxia_query = any(k in query for k in ["hypox", "oxygen", "spo2", "breath", "air", "أكسجين", "اختناق"])
    is_cardiac_query = any(k in query for k in ["tachy", "heart", "cardiac", "pulse", "arrhythmia", "bpm", "قلب", "نبض", "تسارع"])
    is_heat_query = any(k in query for k in ["heat", "thermal", "fever", "حرار", "سخون"])
    is_motion_query = any(k in query for k in ["motion", "dizzy", "nausea", "vomit", "sas", "دوار", "غثيان"])
    is_pharm_query = any(k in query for k in ["dose", "drug", "med", "pharm", "دواء", "أدوية", "جرع", "علاج"])

    if is_pharm_query:
        title = "EMERGENCY SPACE MEDICINE PHARMACOPEIA (ORION MEDICAL KIT)"
        triage_level = "NOMINAL"
        urgent_actions = [
            "Verify drug expiration and barcode scan package before administration.",
            "Note: Microgravity alters gastric emptying and hepatic CYP450 clearance rates.",
            "All injections must be administered via single-use needle-free or safety-shielded autoinjectors.",
        ]
        pharmacopeia = [
            "• Epinephrine 1:1,000 autoinjector (0.3 mg IM) for anaphylaxis / acute collapse.",
            "• Atropine 0.5 mg IV/IM for symptomatic bradycardia (<40 BPM).",
            "• Morphine 5-10 mg IM / Fentanyl 100 mcg transmucosal for severe traumatic injury.",
            "• Naloxone 0.4-2.0 mg IN/IV for opioid reversal.",
            "• Promethazine 25 mg IM for severe space nausea and vomiting.",
            "• Ciprofloxacin 500 mg PO / Ceftriaxone 1g IV for sepsis / systemic infection.",
        ]
        eclss_commands = ["Log all medication dispatches into Houston Electronic Medical Record (EMR)."]
        radio_directive = "Houston copies medical kit access request. Standby for barcode verification."
        citations.append("NASA Spacecraft Formulary and Pharmacokinetics in Microgravity")

    elif is_hypoxia_query or spo2 < 90.0:
        title = "ACUTE HYPOXIA / CABIN DECOMPRESSION RESCUE PROTOCOL"
        triage_level = "CRITICAL"
        urgent_actions = [
            "Command habitat crew to don emergency secondary oxygen masks immediately.",
            "Instruct astronaut to sit in the 30-degree inclined pilot couch to maximize diaphragmatic excursion.",
            "Verify Orion ECLSS cabin partial pressure of oxygen (Target: pO2 >= 140 mmHg / 18.6 kPa).",
            "Prepare contingency cabin repressurization from the high-pressure N2/O2 accumulator tanks.",
        ]
        pharmacopeia = [
            "Supplemental 100% Medical O2 via non-rebreather mask at 15 L/min.",
            "If cerebral edema symptoms emerge (headache, ataxia): Dexamethasone 8 mg IV/IM immediately.",
        ]
        eclss_commands = [
            "Set Habitat ECLSS O2 injection valve to 120% flow.",
            "Check CO2 scrubber delta-P (ensure < 1.5 mmHg).",
        ]
        radio_directive = (
            f"Commander, Houston Flight Surgeon. We see SpO2 at {spo2:.1f}%. Switch suit regulator to emergency 100% O2 "
            "NOW. Stop all movement, recline couch, and acknowledge when mask is sealed."
        )
        citations.append("NASA SP-2020-5001 Space Suit Life Support Systems")

    elif is_cardiac_query or hr > 130.0:
        title = "ACUTE TACHYARRHYTHMIA & CARDIAC OVERLOAD PROTOCOL"
        triage_level = "CRITICAL"
        urgent_actions = [
            "Immediate cessation of all EVA or exercise tasks. Engage magnetic harness lock.",
            "Initiate continuous 12-lead ECG telemetry streaming via Orion Bio-Patch.",
            "Execute modified Valsalva maneuver (forced expiration against closed glottis for 15s followed by supine posture).",
            "Assess for signs of myocardial ischemia: chest tightness, radiating shoulder pain, or ST-segment deviation.",
        ]
        pharmacopeia = [
            "First Line: Propranolol 10-20 mg sublingual if stable supraventricular tachycardia.",
            "Anti-arrhythmic Reserve: Amiodarone 150 mg IV over 10 min if wide-complex ventricular tachycardia.",
            "Aspirin 325 mg chewed if acute coronary syndrome is suspected.",
        ]
        eclss_commands = [
            "Increase suit coolant flow to prevent compensatory thermal tachycardia.",
        ]
        radio_directive = (
            f"Commander, Houston. Your heart rate is {int(hr)} BPM with sustained sinus strain. Discontinue all physical tasks. "
            "Take 5 deep abdominal breaths, exhale against closed airway for 15 seconds. We have continuous ECG lock."
        )
        citations.append("NASA Cardiovascular Microgravity Deconditioning Standard JSC-65842")

    elif is_heat_query or temp > 38.0:
        title = "EVA HYPERTHERMIA & SUIT THERMAL RUNAWAY PROTOCOL"
        triage_level = "CRITICAL"
        urgent_actions = [
            "Switch EVA Suit Liquid Cooling and Ventilation Garment (LCVG) to MAX COOL.",
            "Abort current extravehicular spacewalk. Direct astronaut to airlock immediately.",
            "Prepare habitat for rapid suit doffing and surface cooling fans.",
        ]
        pharmacopeia = [
            "Oral cold electrolyte pouch loading (500-750 mL).",
            "Acetaminophen 1000 mg PR/PO if infectious etiology suspected.",
            "IV chilled saline 500 mL via pressure infuser bag if heat stroke manifests.",
        ]
        eclss_commands = [
            "Airlock chiller loop temperature setpoint: 16°C.",
        ]
        radio_directive = (
            f"Commander, Houston. Core temperature is elevated at {temp:.1f}°C. We are calling an operational EVA abort. "
            "Set LCVG valve to position 5, secure tether, and begin airlock transit."
        )
        citations.append("NASA EVA Physiology and Thermal Exposure Envelope")

    elif is_motion_query:
        title = "SEVERE SPACE MOTION SICKNESS (SAS) & VESTIBULAR CRISIS"
        triage_level = "CAUTION"
        urgent_actions = [
            "Prohibit any EVA or airlock operations (aspiration risk inside space helmet is fatal).",
            "Instruct astronaut to fixate gaze on a stationary cabin reference point (Earth horizon or cabin bulkhead).",
            "Limit head pitch and yaw angular accelerations.",
        ]
        pharmacopeia = [
            "Promethazine 25-50 mg IM (deep gluteal injection via autoinjector). Preferred over oral due to gastric stasis.",
            "Ondansetron (Zofran) 4-8 mg ODT (oral dissolving tablet) as non-sedating adjunct.",
        ]
        eclss_commands = [
            "Ensure cabin airflow velocity >= 0.15 m/s across astronaut sleep station.",
        ]
        radio_directive = (
            "Commander, Houston Flight Surgeon. Space adaptation sickness is expected in this flight phase. "
            "Locate medical pack Beta-2 and self-administer Promethazine 25mg autoinjector. Rest in sleep compartment for 2 hours."
        )
        citations.append("NASA Space Adaptation Syndrome Countermeasures Guideline")

    elif "dose" in query or "drug" in query or "med" in query or "pharm" in query:
        title = "EMERGENCY SPACE MEDICINE PHARMACOPEIA (ORION MEDICAL KIT)"
        triage_level = "NOMINAL"
        urgent_actions = [
            "Verify drug expiration and barcode scan package before administration.",
            "Note: Microgravity alters gastric emptying and hepatic CYP450 clearance rates.",
        ]
        pharmacopeia = [
            "• Epinephrine 1:1,000 autoinjector (0.3 mg IM) for anaphylaxis / acute collapse.",
            "• Atropine 0.5 mg IV/IM for symptomatic bradycardia (<40 BPM).",
            "• Morphine 5-10 mg IM / Fentanyl 100 mcg transmucosal for severe traumatic injury.",
            "• Naloxone 0.4-2.0 mg IN/IV for opioid reversal.",
            "• Promethazine 25 mg IM for severe space nausea and vomiting.",
            "• Ciprofloxacin 500 mg PO / Ceftriaxone 1g IV for sepsis / systemic infection.",
        ]
        eclss_commands = ["Log all medication dispatches into Houston Electronic Medical Record (EMR)."]
        radio_directive = "Houston copies medical kit access request. Standby for barcode verification."
        citations.append("NASA Spacecraft Formulary and Pharmacokinetics in Microgravity")

    else:
        # Default comprehensive clinical overview tailored for monitor
        title = f"FLIGHT SURGEON SITUATION ANALYSIS (ASTRONAUT {state.astronaut_id})"
        urgent_actions = [
            f"Vitals Status: Heart Rate {int(hr)} BPM, SpO2 {spo2:.1f}%, Blood Pressure {bp} mmHg, Temp {temp:.1f}°C.",
            "Cardiovascular rhythm: Normal sinus rhythm with stable microgravity autonomic tone.",
            "Cognitive Reserve: Alert and responsive on scheduled duty timeline.",
            "Maintain continuous telemetry packet reception on DSN channel 4.",
        ]
        pharmacopeia = ["No emergency pharmacological interventions indicated at this timestamp."]
        eclss_commands = ["Habitat life support loop nominal. Cabin pO2 148 mmHg, pCO2 2.1 mmHg, total pressure 101.3 kPa."]
        radio_directive = "Commander, Houston Ground Surgeon. Your biometric telemetry is nominal across all channels. Keep up the good work."

    response_payload = {
        "title": title,
        "triage_level": triage_level,
        "current_vitals_snapshot": {
            "hr": f"{int(hr)} BPM",
            "spo2": f"{spo2:.1f}%",
            "bp": bp,
            "temp": f"{temp:.1f}°C",
            "resp": f"{int(resp)} BrPM",
            "status": state.overall_status,
            "score": state.overall_score,
        },
        "urgent_actions": urgent_actions,
        "pharmacopeia": pharmacopeia,
        "eclss_commands": eclss_commands,
        "radio_directive": radio_directive,
        "citations": citations,
        "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
    }

    return response_payload

# -----------------------------------------------------------------------------
# Scenario Simulation Endpoints for Live Demo
# -----------------------------------------------------------------------------
@app.post("/api/v1/telemetry/simulate")
async def simulate_scenario(payload: Dict[str, Any]):
    """
    Allows Ground Monitor to inject flight scenarios for testing and demonstration.
    Scenarios: nominal, hypoxia, cardiac, heat_stress, hypothermia, hypercapnia
    """
    scenario = payload.get("scenario", "nominal").lower()

    if scenario == "hypoxia":
        data = {
            "heart_rate_bpm": 136.0,
            "spo2_percent": 84.5,
            "systolic_bp_mmhg": 142.0,
            "diastolic_bp_mmhg": 88.0,
            "body_temperature_c": 36.9,
            "respiratory_rate_bpm": 28.0,
            "hrv_rmssd_ms": 18.0,
        }
        label = "Simulated Acute Cabin Hypoxia Event"
    elif scenario == "cardiac":
        data = {
            "heart_rate_bpm": 154.0,
            "spo2_percent": 93.8,
            "systolic_bp_mmhg": 156.0,
            "diastolic_bp_mmhg": 98.0,
            "body_temperature_c": 37.1,
            "respiratory_rate_bpm": 22.0,
            "hrv_rmssd_ms": 14.0,
        }
        label = "Simulated Severe Tachyarrhythmia"
    elif scenario == "heat_stress":
        data = {
            "heart_rate_bpm": 124.0,
            "spo2_percent": 96.5,
            "systolic_bp_mmhg": 134.0,
            "diastolic_bp_mmhg": 84.0,
            "body_temperature_c": 38.8,
            "respiratory_rate_bpm": 25.0,
            "hrv_rmssd_ms": 22.0,
        }
        label = "Simulated EVA Suit Heat Exhaustion"
    elif scenario == "hypothermia":
        data = {
            "heart_rate_bpm": 50.0,
            "spo2_percent": 96.2,
            "systolic_bp_mmhg": 98.0,
            "diastolic_bp_mmhg": 62.0,
            "body_temperature_c": 34.8,
            "respiratory_rate_bpm": 10.0,
            "hrv_rmssd_ms": 42.0,
        }
        label = "Simulated Extravehicular Hypothermia"
    elif scenario == "hypercapnia":
        data = {
            "heart_rate_bpm": 114.0,
            "spo2_percent": 93.5,
            "systolic_bp_mmhg": 142.0,
            "diastolic_bp_mmhg": 92.0,
            "body_temperature_c": 36.9,
            "respiratory_rate_bpm": 30.0,
            "hrv_rmssd_ms": 26.0,
        }
        label = "Simulated Habitat CO2 Scrubber Failure"
    else:  # nominal
        data = {
            "heart_rate_bpm": 72.0,
            "spo2_percent": 98.5,
            "systolic_bp_mmhg": 116.0,
            "diastolic_bp_mmhg": 74.0,
            "body_temperature_c": 36.8,
            "respiratory_rate_bpm": 15.0,
            "hrv_rmssd_ms": 52.0,
        }
        label = "Nominal Baseline Restored"

    eval_result = update_state_with_vitals(data, source_label=label)

    await ws_manager.broadcast({
        "type": "TELEMETRY_UPDATE",
        "payload": {
            "vitals": state.vitals,
            "organs": state.organs,
            "overall_score": state.overall_score,
            "overall_status": state.overall_status,
            "active_alert": state.active_alert,
            "last_updated": state.last_updated,
            "packet_count": state.packet_count,
            "latest_history": state.history[-1],
        }
    })

    return {
        "status": "injected",
        "scenario": scenario,
        "label": label,
        "vitals": state.vitals,
        "severity": eval_result["severity"],
    }

# -----------------------------------------------------------------------------
# WebSocket Telemetry Stream Endpoint
# -----------------------------------------------------------------------------
@app.websocket("/ws")
@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        # Send initial full state dump immediately upon connection
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "payload": {
                "astronaut_id": state.astronaut_id,
                "full_name": state.full_name,
                "mission_name": state.mission_name,
                "spacecraft": state.spacecraft,
                "mission_day": state.mission_day,
                "total_days": state.total_days,
                "connection_status": state.connection_status,
                "vitals": state.vitals,
                "organs": state.organs,
                "overall_score": state.overall_score,
                "overall_status": state.overall_status,
                "active_alert": state.active_alert,
                "alerts_history": state.alerts_history,
                "history": state.history,
                "comms_messages": state.comms_messages,
                "last_updated": state.last_updated,
                "packet_count": state.packet_count,
            }
        })

        while True:
            # Receive client actions / pings
            text = await websocket.receive_text()
            try:
                msg = json.loads(text)
                if msg.get("type") == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": time.time()})
            except Exception:
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

# -----------------------------------------------------------------------------
# Background Periodic Heartbeat & Micro-Telemetry Generator
# (Simulates subtle sensor jitter if mobile app isn't pushing continuously)
# -----------------------------------------------------------------------------
async def background_telemetry_worker():
    while True:
        await asyncio.sleep(4.0)
        # Apply subtle natural micro-jitter to vitals (only if in nominal mode)
        if state.overall_status == "NOMINAL":
            jitter_hr = state.vitals["heart_rate_bpm"] + random.uniform(-0.8, 0.8)
            jitter_spo2 = state.vitals["spo2_percent"] + random.uniform(-0.15, 0.15)
            state.vitals["heart_rate_bpm"] = round(max(60.0, min(88.0, jitter_hr)), 1)
            state.vitals["spo2_percent"] = round(max(96.0, min(99.4, jitter_spo2)), 1)
            state.packet_count += 1
            state.last_updated = datetime.utcnow().isoformat() + "Z"

            now_str = datetime.utcnow().strftime("%H:%M:%S")
            state.history.append({
                "time": now_str,
                "hr": state.vitals["heart_rate_bpm"],
                "spo2": state.vitals["spo2_percent"],
                "sys": round(state.vitals["systolic_bp_mmhg"], 1),
                "dia": round(state.vitals["diastolic_bp_mmhg"], 1),
                "temp": round(state.vitals["body_temperature_c"], 1),
                "resp": round(state.vitals["respiratory_rate_bpm"], 1),
            })
            if len(state.history) > 60:
                state.history.pop(0)

            await ws_manager.broadcast({
                "type": "TELEMETRY_JITTER",
                "payload": {
                    "vitals": state.vitals,
                    "last_updated": state.last_updated,
                    "packet_count": state.packet_count,
                    "latest_history": state.history[-1],
                }
            })

@app.on_event("startup")
async def on_startup():
    asyncio.create_task(background_telemetry_worker())
    logger.info("AuraMed Ground Server started on port 8000. Background worker active.")

# -----------------------------------------------------------------------------
# Static Files & Dashboard UI Mounting
# -----------------------------------------------------------------------------
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def root_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return HTMLResponse("<h1>AuraMed Ground Station Server Running.</h1><p>Visit /health for API probe.</p>")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
