# AuraMed Healthcare AI — API Integration Guide
**NASA Space Apps Challenge 2026**  
**Audience:** Web & Mobile Frontend Engineering Teams  

> 💡 **ملاحظة بالعربية:** يتوفر دليل تكامل شامل ومفصل باللغة العربية مع نماذج كود فلاتر ورياكت جاهزة في الملف:  
> [`docs/FRONTEND_INTEGRATION_GUIDE.md`](file:///e:/Projects/AuraMed/docs/FRONTEND_INTEGRATION_GUIDE.md)

---

## 1. Overview & Service Endpoints

AuraMed exposes a high-performance, asynchronous REST API. For Web and Mobile clients, **Port 8000 (Client Gateway)** is the primary entry point providing unified telemetry assessment.

| Service | Port | Base URL | Interactive Docs (Swagger) |
| :--- | :---: | :--- | :--- |
| **Unified Client Gateway** (Recommended) | `8000` | `http://localhost:8000` | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **ML Microservice** (Standalone) | `8001` | `http://localhost:8001` | [http://localhost:8001/docs](http://localhost:8001/docs) |
| **RAG Decision Support** (Standalone) | `8002` | `http://localhost:8002` | [http://localhost:8002/docs](http://localhost:8002/docs) |

> **Note:** CORS is enabled on all origins (`*`) with credentials support for local development across Web (React, Next.js, Vue) and Mobile (Flutter, React Native, Swift).

---

## 2. Primary Unified Endpoint: `POST /api/v1/assess-astronaut`

Evaluates 17 astronaut physiological vitals through the ML multi-hazard detector, assesses deterministic severity rules, retrieves relevant NASA Tier 1 checklist procedures, generates clinical guidance via **Groq Cloud (`openai/gpt-oss-120b`)** (with zero-delay fallback to local **Ollama `medgemma:latest`** upon network loss), and applies 6-stage clinical safety guardrails.

### Request Headers
```http
Content-Type: application/json
Accept: application/json
```

### Request Body (JSON)
```json
{
  "request_id": "REQ-MOB-2026-001",
  "astronaut_id": "ASTRO-01",
  "vitals": {
    "request_id": "REQ-MOB-2026-001",
    "astronaut_id": "ASTRO-01",
    "heart_rate_bpm": 128.0,
    "hrv_rmssd_ms": 28.5,
    "spo2_percent": 85.5,
    "body_temperature_c": 37.3,
    "respiratory_rate_bpm": 24.0,
    "systolic_bp_mmhg": 115.0,
    "diastolic_bp_mmhg": 74.0,
    "heart_rate_bpm_rolling_mean_60min": 76.0,
    "heart_rate_bpm_rolling_std_60min": 3.8,
    "hrv_rmssd_ms_rolling_mean_60min": 49.0,
    "hrv_rmssd_ms_rolling_std_60min": 4.1,
    "spo2_percent_rolling_mean_60min": 97.8,
    "spo2_percent_rolling_std_60min": 1.2,
    "body_temperature_c_rolling_mean_60min": 36.8,
    "body_temperature_c_rolling_std_60min": 0.2,
    "respiratory_rate_bpm_rolling_mean_60min": 15.0,
    "respiratory_rate_bpm_rolling_std_60min": 1.1
  }
}
```

### Complete Response Body (JSON)
```json
{
  "request_id": "REQ-MOB-2026-001",
  "astronaut_id": "ASTRO-01",
  "status": "ok",
  "operating_mode": "online",
  "active_provider": "cloud",
  "severity": "Critical",
  "condition_hypotheses": [
    "hypoxia_suspected",
    "tachycardia_moderate"
  ],
  "ml_assessment": {
    "anomaly_detected": true,
    "anomaly_label": 1,
    "confidence_score": 0.98,
    "hazard_risk_level": "Critical_Risk",
    "predicted_degradation_score": 68.4
  },
  "summary": "CRITICAL PROTOCOL ESCALATION: Immediate consultation with NASA Flight Surgeon required. Begin emergency supportive stabilization. Crew member exhibiting acute oxygen desaturation (SpO2: 85.5%) with compensatory tachycardia.",
  "action_steps": [
    {
      "n": 1,
      "action": "Don Quick-Don Mask immediately and verify positive pressure seal.",
      "source_chunk_id": "chk_revk_oxygen_p226_01",
      "ref_label": "JSC-48031 Medical Checklist Rev K PCN-4, p.226",
      "warning": "Ensure oxygen supply valve is set to Emergency 15 L/min flow rate."
    },
    {
      "n": 2,
      "action": "Connect Quick Disconnect to Shuttle/Station oxygen port LEH O2 8.",
      "source_chunk_id": "chk_revk_oxygen_p226_02",
      "ref_label": "JSC-48031 Medical Checklist Rev K PCN-4, p.226",
      "warning": null
    },
    {
      "n": 3,
      "action": "Verify chest rises symmetrically with ventilatory support.",
      "source_chunk_id": "chk_revk_oxygen_p227_01",
      "ref_label": "JSC-48031 Medical Checklist Rev K PCN-4, p.227",
      "warning": null
    }
  ],
  "escalation": {
    "required": true,
    "reason": "SpO2 dropped below critical threshold (<= 88.0%)",
    "target": "Flight Surgeon"
  },
  "protocol_references": [
    "JSC-48031 Medical Checklist Rev K PCN-4, p.226",
    "NASA-STD-3001 Vol 1A, p.42"
  ],
  "total_latency_ms": 1120.45
}
```

---

## 3. Telemetry Field Dictionary (17 Metrics)

| Metric | Unit | Normal Range | Critical Threshold |
| :--- | :---: | :---: | :---: |
| `heart_rate_bpm` | bpm | 60.0 – 100.0 | $> 130.0$ or $< 40.0$ |
| `hrv_rmssd_ms` | ms | 20.0 – 80.0 | $< 10.0$ |
| `spo2_percent` | % | 95.0 – 100.0 | $\le 88.0\%$ |
| `body_temperature_c` | °C | 36.5 – 37.5 | $> 38.5$ or $< 35.0$ |
| `respiratory_rate_bpm` | breaths/min | 12.0 – 18.0 | $> 24.0$ or $< 8.0$ |
| `systolic_bp_mmhg` | mmHg | 90.0 – 120.0 | $> 160.0$ or $< 80.0$ |
| `diastolic_bp_mmhg` | mmHg | 60.0 – 80.0 | $> 100.0$ or $< 50.0$ |
| `*_rolling_mean_60min` | *same* | Rolling 60-min mean | Identifies slow baseline drift |
| `*_rolling_std_60min` | *same* | Rolling 60-min standard deviation | Detects sudden instability |

---

## 4. Code Snippets for Client Developers

### A. Mobile (Flutter / Dart)
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> assessAstronaut(Map<String, dynamic> vitalsData) async {
  final url = Uri.parse('http://localhost:8000/api/v1/assess-astronaut');
  
  final payload = {
    'request_id': 'REQ-${DateTime.now().millisecondsSinceEpoch}',
    'astronaut_id': 'ASTRO-01',
    'vitals': vitalsData,
  };

  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(payload),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    throw Exception('AuraMed API Error: ${response.statusCode} - ${response.body}');
  }
}
```

### B. Web (JavaScript / TypeScript with Axios / Fetch)
```typescript
import axios from 'axios';

export interface AstronautAssessment {
  severity: 'Normal' | 'Warning' | 'Critical';
  operating_mode: 'online' | 'offline' | 'degraded';
  ml_assessment: {
    anomaly_detected: boolean;
    confidence_score: number;
    hazard_risk_level: string;
    predicted_degradation_score: number;
  };
  summary: string;
  action_steps: Array<{
    n: number;
    action: string;
    ref_label: string;
    source_chunk_id: string;
    warning?: string;
  }>;
  escalation: {
    required: boolean;
    reason: string;
    target: 'Flight Surgeon' | 'Crew Medical Officer' | 'None';
  };
}

export async function checkAstronautTelemetry(vitalsPayload: any): Promise<AstronautAssessment> {
  const response = await axios.post<AstronautAssessment>(
    'http://localhost:8000/api/v1/assess-astronaut',
    {
      request_id: `REQ-WEB-${Date.now()}`,
      astronaut_id: 'ASTRO-01',
      vitals: vitalsPayload,
    }
  );
  return response.data;
}
```

### C. Terminal Testing (cURL)
```bash
curl -X POST "http://localhost:8000/api/v1/assess-astronaut" \
  -H "Content-Type: application/json" \
  -d '{
    "request_id": "CURL-TEST-01",
    "astronaut_id": "ASTRO-01",
    "vitals": {
      "request_id": "CURL-TEST-01",
      "astronaut_id": "ASTRO-01",
      "heart_rate_bpm": 128.0,
      "hrv_rmssd_ms": 28.5,
      "spo2_percent": 85.5,
      "body_temperature_c": 37.3,
      "respiratory_rate_bpm": 24.0,
      "systolic_bp_mmhg": 115.0,
      "diastolic_bp_mmhg": 74.0,
      "heart_rate_bpm_rolling_mean_60min": 76.0,
      "heart_rate_bpm_rolling_std_60min": 3.8,
      "hrv_rmssd_ms_rolling_mean_60min": 49.0,
      "hrv_rmssd_ms_rolling_std_60min": 4.1,
      "spo2_percent_rolling_mean_60min": 97.8,
      "spo2_percent_rolling_std_60min": 1.2,
      "body_temperature_c_rolling_mean_60min": 36.8,
      "body_temperature_c_rolling_std_60min": 0.2,
      "respiratory_rate_bpm_rolling_mean_60min": 15.0,
      "respiratory_rate_bpm_rolling_std_60min": 1.1
    }
  }'
```

---

## 5. Starting the Services

To run all backend microservices concurrently with one command:
```powershell
.\.venv\Scripts\python.exe scripts/start_all_services.py
```
This automatically boots:
- Port 8000: Client Gateway
- Port 8001: NASA ML Service
- Port 8002: RAG Decision Support Service
