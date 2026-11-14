# Phase 02: Data Discovery and Model Discovery Report
**Project:** Healthcare AI System (AuraMed) — NASA Space Apps Challenge 2026  
**Auditor:** Senior AI & Data Infrastructure Architect  
**Date:** 2026-11-13  
**Status:** Completed  

---

## 1. Executive Summary
In Phase 02, we completed the full cataloging, physical migration, cryptographic hashing, and content extractability analysis of the NASA medical documents, as well as the deep inspection of the machine learning model contract and physiological features.

---

## 2. NASA Source Documents Discovery & Verification

All 8 PDF documents were relocated from the workspace root into `data/raw/` and registered in `data/sources.yaml`.

### A. Document Inventory Table

| Document ID | Filename | Pages | Size (MB) | Text Coverage | Evidence Tier | Primary Role |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NASA-CKLIST-REVK` | `Medical Checklist Rev K PCN-4.pdf` | 227 | 2.73 MB | **95.6%** | **Tier 1** | Primary operational checklist for action steps |
| `NASA-CKLIST-REVH` | `Medical Checklist Rev H.pdf` | 203 | 1.50 MB | **97.5%** | **Tier 1** | Historical checklist baseline |
| `NASA-CKLIST-177788`| `177788main_MedicalCklist.pdf` | 217 | 2.20 MB | **97.2%** | **Tier 1** | Generic operational procedures |
| `NASA-STD-3001-REVC`| `nasa-std-3001-vol-1-rev-c-signature.pdf` | 87 | 1.75 MB | **98.9%** | **Tier 2** | Ratified crew health care standard |
| `NASA-STD-3001-VOL1A`| `NASA-STD-3001-VOL-1A-Chg1-1.pdf` | 83 | 0.95 MB | **100.0%** | **Tier 2** | Supporting medical standard |
| `NASA-TM-2019-220299`| `20190027540.pdf` | 40 | 1.50 MB | **97.5%** | **Tier 3** | Exploration medical condition taxonomy |
| `NASA-TM-2017-219290`| `20170004345.pdf` | 12 | 0.13 MB | **100.0%** | **Tier 3** | Level of care definitions |
| `NASA-EXMC-EVIDENCE` | `20170004604.pdf` | 79 | 0.53 MB | **100.0%** | **Tier 3** | Clinical risk & pathophysiology context |

**Total Corpus:** 948 pages across 8 documents (~11.3 MB total).

### B. Critical Discovery Findings on Data Extraction
1. **Direct Digital Text:** Across all 948 pages, text coverage ranges from **95.6% to 100%**. All documents contain native digital text streams.
2. **Zero OCR Requirement:** Because the text is digitally embedded and extractable via PyMuPDF (`fitz`), expensive and noisy OCR engines (Tesseract / OCRmyPDF) are **not** needed for the core corpus.
3. **Evidence Tier Boundaries (Safety Non-Negotiables):**
   - **Tier 1:** 647 pages across the 3 Medical Checklists. Only procedures extracted from these documents may produce step-by-step guidance.
   - **Tier 2 & 3:** 301 pages across standards and evidence reports. These provide acceptable vital bounds, levels of care, and medical condition names, but **must never** independently output imperative clinical steps.

---

## 3. Machine Learning Model Discovery & Data Contract

Inspected from `ml_integration_guide.md` and `تصميم نظام الـ RAG الطبي — NASA Space Apps 2026.md`:

### A. Input Feature Schema (17 Features Total)
The ML model expects an exact 17-feature JSON payload:

1. **Real-Time Vitals (7 Features):**
   - `heart_rate_bpm` (Float): Heart rate (bpm)
   - `hrv_rmssd_ms` (Float): Heart rate variability RMSSD (ms)
   - `spo2_percent` (Float): Blood oxygen saturation (%)
   - `body_temperature_c` (Float): Body temperature (°C)
   - `respiratory_rate_bpm` (Float): Respiration rate (breaths/min)
   - `systolic_bp_mmhg` (Float): Systolic blood pressure (mmHg)
   - `diastolic_bp_mmhg` (Float): Diastolic blood pressure (mmHg)

2. **Rolling 60-Minute Window Statistics (10 Features):**
   - `heart_rate_bpm_rolling_mean_60min` & `heart_rate_bpm_rolling_std_60min`
   - `hrv_rmssd_ms_rolling_mean_60min` & `hrv_rmssd_ms_rolling_std_60min`
   - `spo2_percent_rolling_mean_60min` & `spo2_percent_rolling_std_60min`
   - `body_temperature_c_rolling_mean_60min` & `body_temperature_c_rolling_std_60min`
   - `respiratory_rate_bpm_rolling_mean_60min` & `respiratory_rate_bpm_rolling_std_60min`
   *(Note: Blood pressure does not have rolling features).*

### B. Model Output Schema
```json
{
  "anomaly_label": 1,
  "confidence_score": 0.942
}
```
- `anomaly_label`: `0` (Normal/Stable) | `1` (Anomaly detected).
- `confidence_score`: Float between `0.0` and `1.0`.

### C. System Safety Separation
- **The ML Model is strictly an Anomaly Detector**, NOT a diagnostic classifier.
- It does **not** output disease names, severity levels, or treatment steps.
- **Severity Determination:** Handled deterministically by rule-based gates in `shared/`:
  - `Normal`: `anomaly_label == 0` and no rule triggered.
  - `Warning`: `anomaly_label == 1` or warning-level vital threshold triggered.
  - `Critical`: Critical-level vital threshold triggered (e.g. SpO2 < 88%), regardless of ML label.
  - Rules can ONLY escalate severity, never downgrade it. LLMs can NEVER override severity.
