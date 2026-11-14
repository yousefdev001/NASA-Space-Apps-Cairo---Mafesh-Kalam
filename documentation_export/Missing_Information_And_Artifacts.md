# Missing Information, Artifacts & Verification Boundaries
**Project:** AuraMed Healthcare AI — NASA Space Apps Challenge 2026  
**Auditor Methodology:** Scientific Gap Analysis & Compliance Checklist

This document details all technical data, experimental artifacts, visual assets, and external integrations that are currently missing, unverified, or outside the inspection scope of the local repository. It serves as an actionable punch list for the hackathon team prior to final project submission.

---

## 1. External Codebases & Unverified System Integrations

### 1.1 Flutter Mobile / Tablet Client
* **Status:** **Integration Not Verified from Current Workspace.**
* **What Exists:**
  - `docs/flutter_integration/auramed_api_service.dart`: Ready-to-use Dart API client wrapper.
  - `docs/flutter_integration/FLUTTER_INTEGRATION_PROMPT.md`: Complete prompt instructions for external mobile engineering.
  - `docs/FRONTEND_INTEGRATION_GUIDE.md`: Full Arabic/English API documentation with payload examples.
* **What is Missing:**
  - The actual Flutter project repository (`pubspec.yaml`, `lib/main.dart`, UI widgets, screens, and APK/IPA build outputs).
  - Screenshots of the application running on physical iOS/Android hardware or emulators.
  - End-to-end integration logs captured from a live mobile device connecting over the Cloudflare Tunnel.

### 1.2 Web Application / Frontend (React / Next.js)
* **Status:** **Integration Not Verified from Current Workspace.**
* **What Exists:**
  - `static/index.html`: A standalone client-side HTML/JavaScript testing studio (136.9 KB) served directly by FastAPI at `http://127.0.0.1:8000/`.
* **What is Missing:**
  - External production React / Next.js dashboard repository if one is being developed separately by team members.
  - User authentication and session management in external web frontends.

### 1.3 Main Backend (Laravel / Node.js / Python)
* **Status:** **Unverified / Architectural Proposal Only.**
* **What Exists:**
  - References in `AGENTS.md` and `docs/ARCHITECTURE.md` proposing an "External Main Backend".
* **What is Missing:**
  - No code, repository, routes, or database migrations for an external backend exist in this workspace.
  - The AuraMed Client Gateway (`services/orchestrator/main.py`) currently serves as the direct client-facing backend.

---

## 2. Experimental Graphics & Visual Artifacts

While all quantitative evaluation metrics are empirically preserved in `models/space_hazards_ml/models/metrics.json` and `docs/reports/EVALUATION_REPORT.md`, visual publication plots have not been rendered into PNG/PDF format:

1. **Confusion Matrix Heatmap Graphic:**
   - *Status:* `[PLACEHOLDER: Plotted PNG missing]`
   - *Data Available:* Exact matrix values documented in `metrics.json` (Nominal: 386/17/0, Moderate: 16/154/6, Critical: 0/7/114).
   - *Action Needed:* Generate a formatted graphic using `seaborn.heatmap`.
2. **Receiver Operating Characteristic (ROC) & Precision-Recall (PR) Curves:**
   - *Status:* `[PLACEHOLDER: Plotted curve charts missing]`
   - *Data Available:* Class-level precision/recall/F1 metrics in `metrics.json`.
   - *Action Needed:* Run holdout evaluation script to plot multi-class One-vs-Rest ROC curves.
3. **Hazard Risk Feature Importance Plot:**
   - *Status:* `[PLACEHOLDER: Plotted horizontal bar chart missing]`
   - *Data Available:* Numeric importances in `models/space_hazards_ml/models/feature_importance.json`.
   - *Action Needed:* Plot top-ranked features (`radiation_cumulative_mSv`, `distance_million_km`, `muscle_mass_loss_pct`).
4. **End-to-End Live Video Demonstration:**
   - *Status:* `[PLACEHOLDER: Demonstration video recording missing]`
   - *Action Needed:* Record a 90–120 second video demonstrating:
     - Booting the system via `start.bat`.
     - Simulating an acute SpO2 drop (85%) in the testing interface.
     - Demonstrating instant retrieval of JSC-48031 Rev K checklists.
     - Showing the Cloudflare HTTPS Tunnel connection.

---

## 3. Scientific & Clinical Validation Boundaries

1. **Absence of Human Spaceflight Ground Truth Telemetry:**
   - *Finding:* All machine learning training was performed on 3,500 synthetic records generated via `generate_dataset.py`.
   - *Limitation:* The project does **NOT** use classified or restricted real in-flight physiological telemetry from NASA astronaut bio-harnesses.
   - *Future Work:* Validate model weights against publicly available NASA GeneLab data, NASA Life Sciences Data Archive (LSDA), or bed-rest analog studies (e.g., :envihab, HERA).
2. **Cross-Encoder Reranking Dynamic Deployment:**
   - *Finding:* `services/rag_service/retrieval/reranker.py` contains working logic for cross-encoder reranking, but is disabled by default (`self.enabled = False`) to prevent CPU bottlenecks on the development workstation.
   - *Action Needed:* Benchmark latency vs. accuracy on a dedicated GPU cluster to determine if reranking justifies the latency trade-off.
3. **Incremental Document Ingestion UI:**
   - *Finding:* Document chunking and ChromaDB ingestion was completed as a batch preprocessing step.
   - *Limitation:* There is no user-facing admin portal to drag and drop a new PDF and trigger automatic vectorization without running backend scripts.

---

## 4. Git Repository History Boundary

* **Finding:** Command `git status` reports `On branch master` with `No commits yet`.
* **Explanation:** All files in the repository currently reside as untracked working-tree files because a formal `git commit` has not yet been executed in this local git directory.
* **Recommendation:** Execute an initial baseline commit to establish a permanent Git SHA hash reference for project provenance:
  ```bash
  git add .
  git commit -m "Initial commit: AuraMed NASA Space Apps 2026 Core Platform"
  ```
