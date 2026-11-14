# Master Prompt: AuraMed Flutter App Integration
**Project:** Healthcare AI Decision Support System — NASA Space Apps Challenge 2026

---

## Instructions for the Flutter Developer / AI Agent

You are tasked with integrating the Flutter mobile/tablet application with the **AuraMed Healthcare AI System**.
The AI backend (ML Anomaly Detection + NASA RAG Retrieval + Ollama/Groq Reasoning) runs on an external host and exposes an HTTPS API through a secure Cloudflare Tunnel.

### 1. Connection & Credentials
Add `http` package to `pubspec.yaml`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
```

Use the pre-built service located in:
`docs/flutter_integration/auramed_api_service.dart`

Configure your base settings:
- **Base URL:** The public HTTPS Cloudflare Tunnel URL (e.g. `https://xxxx.trycloudflare.com`)
- **API Key Header:** `X-API-Key: auramed-secret-key-2026`
- **Request Timeout:** Minimum 45 seconds to accommodate local LLM inference.

---

### 2. Core Screens & Workflows to Implement

#### Screen 1: Astronaut Telemetry & Vital Signs Monitor
- Display live vital gauges/cards:
  - Heart Rate (`heart_rate_bpm`)
  - Blood Oxygen Saturation (`spo2_percent`)
  - Body Temperature (`body_temperature_c`)
  - Respiratory Rate (`respiratory_rate_bpm`)
  - Blood Pressure (`systolic_bp_mmhg` / `diastolic_bp_mmhg`)
  - Heart Rate Variability (`hrv_rmssd_ms`)
- Provide an **"Evaluate Patient (تقييم الحالة)"** button that calls `AuraMedApiService.assessAstronaut(...)`.

#### Screen 2: Triage Assessment & NASA Checklist Procedures
When the assessment response arrives:
1. **Severity Badge:**
   - `Normal` -> Green badge
   - `Warning` -> Amber/Yellow badge
   - `Critical` -> Pulsing Red badge
2. **ML Multi-Hazard Insights:**
   - Display `ml_assessment.anomaly_detected` and `ml_assessment.hazard_risk_level`.
3. **Clinical Guidance Summary:**
   - Display `summary` at the top in a prominent card.
4. **Interactive Action Steps (NASA Checklist):**
   - Render `action_steps` as an interactive checklist (checkboxes for the astronaut/flight surgeon to mark completed steps).
   - Display the source citation badge: `ref_label` (e.g., *JSC-48031 Medical Checklist Rev K PCN-4, p.226*).
   - If `warning` is present on a step, highlight it with a red warning alert box.
5. **Flight Surgeon Escalation:**
   - If `escalation.required == true`, show a high-visibility emergency banner:
     *"EMERGENCY: Immediate Flight Surgeon consultation required - Reason: ${escalation.reason}"*

#### Screen 3: NASA Medical Protocol Chat
- Simple chat interface where the user can ask clinical questions (e.g., *"ما هو بروتوكول التعامل مع انخفاض الأكسجين الحاد؟"*).
- Calls `AuraMedApiService.chatConsultation(query)`.
- Displays the response with protocol citations.

#### Screen 4: App Bar Status Indicator
- Call `AuraMedApiService.checkHealth()` periodically (or on app resume).
- Show a green dot when connected to the AuraMed Node, or a red warning dot when unreachable.

---

### 3. Safety & Resilience Rules
- **No Diagnostic Override:** Never alter or downgrade the `severity` level returned from the server.
- **Connection Loss Handling:** If the network drops or timeout occurs, present a friendly *"Edge AI Node Offline"* dialogue with a Retry button rather than crashing.
