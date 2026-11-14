"""AuraMed Constants & Enums.

Defines clinical severity levels, physiological threshold boundaries,
retrieval hyperparameters, and safety escalation clauses.
"""

from enum import Enum


class SeverityLevel(str, Enum):
    """Clinical severity levels for decision support."""
    NORMAL = "Normal"
    WARNING = "Warning"
    CRITICAL = "Critical"


# --- Deterministic Physiological Thresholds ---
# SpO2 (% saturation)
SPO2_CRITICAL_THRESHOLD = 88.0
SPO2_WARNING_THRESHOLD = 92.0

# Heart Rate (BPM)
HR_CRITICAL_HIGH = 130.0
HR_CRITICAL_LOW = 40.0
HR_WARNING_HIGH = 100.0
HR_WARNING_LOW = 50.0

# Respiratory Rate (breaths/min)
RR_CRITICAL_HIGH = 28.0
RR_CRITICAL_LOW = 8.0
RR_WARNING_HIGH = 20.0
RR_WARNING_LOW = 10.0

# Blood Pressure - Systolic (mmHg)
BP_SYS_CRITICAL_HIGH = 180.0
BP_SYS_CRITICAL_LOW = 80.0
BP_SYS_WARNING_HIGH = 140.0
BP_SYS_WARNING_LOW = 90.0

# Blood Pressure - Diastolic (mmHg)
BP_DIA_CRITICAL_HIGH = 120.0
BP_DIA_CRITICAL_LOW = 50.0
BP_DIA_WARNING_HIGH = 90.0
BP_DIA_WARNING_LOW = 60.0

# Core Body Temperature (Celsius)
TEMP_CRITICAL_HIGH = 39.5
TEMP_CRITICAL_LOW = 34.5
TEMP_WARNING_HIGH = 38.0
TEMP_WARNING_LOW = 35.5

# --- Retrieval Pipeline Constants ---
DENSE_TOP_K = 30
BM25_TOP_K = 30
RRF_K = 60
RERANK_TOP_K = 20
FINAL_TOP_K = 5
TAU_PROC = 0.50
TAU_FAITH = 0.80

# --- Safety Clauses ---
FLIGHT_SURGEON_ESCALATION_CLAUSE = (
    "CRITICAL PROTOCOL ESCALATION: Immediate consultation with NASA Flight Surgeon required. "
    "Begin emergency supportive stabilization as prescribed in checklist."
)

# --- Voice Mode & Gemini Audio Constants ---
DEFAULT_VOICE_MODEL = "gemini-3.5-transcribe-live"
DEFAULT_TTS_MODEL = "gemini-3.8-flash-tts"
DEFAULT_TTS_VOICE = "Kore"
DEFAULT_SILENCE_TIMEOUT_MS = 500  # 0.5s silence before turn finalization

NASA_MEDICAL_CUSTOM_VOCABULARY = [
    "SpO2",
    "SOMS",
    "CHECS",
    "CMRS",
    "tachycardia",
    "hypoxia",
    "cyanosis",
    "arrhythmia",
    "PEA",
    "asystole",
    "microgravity",
    "cephalic fluid shift",
    "defibrillator",
    "intubation",
    "resuscitator",
    "Rev K PCN-4",
    "JSC-48031",
]
