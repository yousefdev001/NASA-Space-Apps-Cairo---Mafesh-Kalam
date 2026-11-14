"""Deterministic Clinical Severity Engine for AuraMed.

Implements mathematical boundary evaluations on physiological metrics.
Guarantees invariant severity precedence: Rules >= ML >= Normal.
No machine learning model or LLM output is permitted to downgrade severity.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

from shared.constants import (
    BP_DIA_CRITICAL_HIGH,
    BP_DIA_CRITICAL_LOW,
    BP_DIA_WARNING_HIGH,
    BP_DIA_WARNING_LOW,
    BP_SYS_CRITICAL_HIGH,
    BP_SYS_CRITICAL_LOW,
    BP_SYS_WARNING_HIGH,
    BP_SYS_WARNING_LOW,
    HR_CRITICAL_HIGH,
    HR_CRITICAL_LOW,
    HR_WARNING_HIGH,
    HR_WARNING_LOW,
    RR_CRITICAL_HIGH,
    RR_CRITICAL_LOW,
    RR_WARNING_HIGH,
    RR_WARNING_LOW,
    SPO2_CRITICAL_THRESHOLD,
    SPO2_WARNING_THRESHOLD,
    TEMP_CRITICAL_HIGH,
    TEMP_CRITICAL_LOW,
    TEMP_WARNING_HIGH,
    TEMP_WARNING_LOW,
    SeverityLevel,
)
from shared.contracts.ml_contract import MLPredictRequest
from shared.contracts.rag_contract import MLResultPayload


class RuleFlag(BaseModel):
    """Details of an individual triggered physiological rule violation."""
    rule_name: str = Field(..., description="Unique rule code")
    metric: str = Field(..., description="Name of the physiological metric")
    value: float = Field(..., description="Observed metric value")
    threshold: float = Field(..., description="Threshold boundary value")
    severity_level: SeverityLevel = Field(..., description="Severity level triggered by rule")
    condition_hypothesis: str = Field(..., description="Clinical condition hypothesis suggested by rule")


class SeverityAssessment(BaseModel):
    """Consolidated deterministic clinical assessment outcome."""
    severity: SeverityLevel = Field(..., description="Overall enforced severity level")
    triggered_rules: List[RuleFlag] = Field(
        default_factory=list, description="All individual rule violations detected"
    )
    condition_hypotheses: List[str] = Field(
        default_factory=list, description="Unique clinical condition hypotheses derived"
    )


def assess_vitals(
    vitals: MLPredictRequest,
    ml_result: Optional[MLResultPayload] = None
) -> SeverityAssessment:
    """Evaluate physiological vitals deterministically and combine with ML anomaly output.

    Parameters:
    ----------
    vitals: MLPredictRequest
        Validated telemetry reading containing real-time and rolling metrics.
    ml_result: Optional[MLResultPayload]
        Output from ML anomaly microservice, or None if service is offline/degraded.

    Returns:
    -------
    SeverityAssessment:
        Enforced clinical severity level, all triggered rule flags, and hypotheses.
    """
    triggered_rules: List[RuleFlag] = []

    # 1. SpO2 Evaluation
    if vitals.spo2_percent <= SPO2_CRITICAL_THRESHOLD:
        triggered_rules.append(RuleFlag(
            rule_name="SPO2_CRITICAL",
            metric="spo2_percent",
            value=vitals.spo2_percent,
            threshold=SPO2_CRITICAL_THRESHOLD,
            severity_level=SeverityLevel.CRITICAL,
            condition_hypothesis="hypoxia_suspected"
        ))
    elif vitals.spo2_percent <= SPO2_WARNING_THRESHOLD:
        triggered_rules.append(RuleFlag(
            rule_name="SPO2_WARNING",
            metric="spo2_percent",
            value=vitals.spo2_percent,
            threshold=SPO2_WARNING_THRESHOLD,
            severity_level=SeverityLevel.WARNING,
            condition_hypothesis="hypoxia_suspected"
        ))

    # 2. Heart Rate Evaluation
    if vitals.heart_rate_bpm >= HR_CRITICAL_HIGH or vitals.heart_rate_bpm <= HR_CRITICAL_LOW:
        hyp = "tachycardia" if vitals.heart_rate_bpm >= HR_CRITICAL_HIGH else "bradycardia"
        threshold = HR_CRITICAL_HIGH if hyp == "tachycardia" else HR_CRITICAL_LOW
        triggered_rules.append(RuleFlag(
            rule_name="HR_CRITICAL",
            metric="heart_rate_bpm",
            value=vitals.heart_rate_bpm,
            threshold=threshold,
            severity_level=SeverityLevel.CRITICAL,
            condition_hypothesis=hyp
        ))
    elif vitals.heart_rate_bpm > HR_WARNING_HIGH or vitals.heart_rate_bpm < HR_WARNING_LOW:
        hyp = "tachycardia" if vitals.heart_rate_bpm > HR_WARNING_HIGH else "bradycardia"
        threshold = HR_WARNING_HIGH if hyp == "tachycardia" else HR_WARNING_LOW
        triggered_rules.append(RuleFlag(
            rule_name="HR_WARNING",
            metric="heart_rate_bpm",
            value=vitals.heart_rate_bpm,
            threshold=threshold,
            severity_level=SeverityLevel.WARNING,
            condition_hypothesis=hyp
        ))

    # 3. Respiratory Rate Evaluation
    if vitals.respiratory_rate_bpm >= RR_CRITICAL_HIGH or vitals.respiratory_rate_bpm <= RR_CRITICAL_LOW:
        threshold = RR_CRITICAL_HIGH if vitals.respiratory_rate_bpm >= RR_CRITICAL_HIGH else RR_CRITICAL_LOW
        triggered_rules.append(RuleFlag(
            rule_name="RR_CRITICAL",
            metric="respiratory_rate_bpm",
            value=vitals.respiratory_rate_bpm,
            threshold=threshold,
            severity_level=SeverityLevel.CRITICAL,
            condition_hypothesis="respiratory_distress"
        ))
    elif vitals.respiratory_rate_bpm > RR_WARNING_HIGH or vitals.respiratory_rate_bpm < RR_WARNING_LOW:
        threshold = RR_WARNING_HIGH if vitals.respiratory_rate_bpm > RR_WARNING_HIGH else RR_WARNING_LOW
        triggered_rules.append(RuleFlag(
            rule_name="RR_WARNING",
            metric="respiratory_rate_bpm",
            value=vitals.respiratory_rate_bpm,
            threshold=threshold,
            severity_level=SeverityLevel.WARNING,
            condition_hypothesis="respiratory_distress"
        ))

    # 4. Systolic Blood Pressure Evaluation
    if vitals.systolic_bp_mmhg >= BP_SYS_CRITICAL_HIGH or vitals.systolic_bp_mmhg <= BP_SYS_CRITICAL_LOW:
        hyp = "hypertension" if vitals.systolic_bp_mmhg >= BP_SYS_CRITICAL_HIGH else "hypotension"
        threshold = BP_SYS_CRITICAL_HIGH if hyp == "hypertension" else BP_SYS_CRITICAL_LOW
        triggered_rules.append(RuleFlag(
            rule_name="BP_SYS_CRITICAL",
            metric="systolic_bp_mmhg",
            value=vitals.systolic_bp_mmhg,
            threshold=threshold,
            severity_level=SeverityLevel.CRITICAL,
            condition_hypothesis=hyp
        ))
    elif vitals.systolic_bp_mmhg > BP_SYS_WARNING_HIGH or vitals.systolic_bp_mmhg < BP_SYS_WARNING_LOW:
        hyp = "hypertension" if vitals.systolic_bp_mmhg > BP_SYS_WARNING_HIGH else "hypotension"
        threshold = BP_SYS_WARNING_HIGH if hyp == "hypertension" else BP_SYS_WARNING_LOW
        triggered_rules.append(RuleFlag(
            rule_name="BP_SYS_WARNING",
            metric="systolic_bp_mmhg",
            value=vitals.systolic_bp_mmhg,
            threshold=threshold,
            severity_level=SeverityLevel.WARNING,
            condition_hypothesis=hyp
        ))

    # 5. Diastolic Blood Pressure Evaluation
    if vitals.diastolic_bp_mmhg >= BP_DIA_CRITICAL_HIGH or vitals.diastolic_bp_mmhg <= BP_DIA_CRITICAL_LOW:
        hyp = "hypertension" if vitals.diastolic_bp_mmhg >= BP_DIA_CRITICAL_HIGH else "hypotension"
        threshold = BP_DIA_CRITICAL_HIGH if hyp == "hypertension" else BP_DIA_CRITICAL_LOW
        triggered_rules.append(RuleFlag(
            rule_name="BP_DIA_CRITICAL",
            metric="diastolic_bp_mmhg",
            value=vitals.diastolic_bp_mmhg,
            threshold=threshold,
            severity_level=SeverityLevel.CRITICAL,
            condition_hypothesis=hyp
        ))
    elif vitals.diastolic_bp_mmhg > BP_DIA_WARNING_HIGH or vitals.diastolic_bp_mmhg < BP_DIA_WARNING_LOW:
        hyp = "hypertension" if vitals.diastolic_bp_mmhg > BP_DIA_WARNING_HIGH else "hypotension"
        threshold = BP_DIA_WARNING_HIGH if hyp == "hypertension" else BP_DIA_WARNING_LOW
        triggered_rules.append(RuleFlag(
            rule_name="BP_DIA_WARNING",
            metric="diastolic_bp_mmhg",
            value=vitals.diastolic_bp_mmhg,
            threshold=threshold,
            severity_level=SeverityLevel.WARNING,
            condition_hypothesis=hyp
        ))

    # 6. Core Body Temperature Evaluation
    if vitals.body_temperature_c >= TEMP_CRITICAL_HIGH or vitals.body_temperature_c <= TEMP_CRITICAL_LOW:
        hyp = "fever_hyperthermia" if vitals.body_temperature_c >= TEMP_CRITICAL_HIGH else "hypothermia"
        threshold = TEMP_CRITICAL_HIGH if hyp == "fever_hyperthermia" else TEMP_CRITICAL_LOW
        triggered_rules.append(RuleFlag(
            rule_name="TEMP_CRITICAL",
            metric="body_temperature_c",
            value=vitals.body_temperature_c,
            threshold=threshold,
            severity_level=SeverityLevel.CRITICAL,
            condition_hypothesis=hyp
        ))
    elif vitals.body_temperature_c > TEMP_WARNING_HIGH or vitals.body_temperature_c < TEMP_WARNING_LOW:
        hyp = "fever_hyperthermia" if vitals.body_temperature_c > TEMP_WARNING_HIGH else "hypothermia"
        threshold = TEMP_WARNING_HIGH if hyp == "fever_hyperthermia" else TEMP_WARNING_LOW
        triggered_rules.append(RuleFlag(
            rule_name="TEMP_WARNING",
            metric="body_temperature_c",
            value=vitals.body_temperature_c,
            threshold=threshold,
            severity_level=SeverityLevel.WARNING,
            condition_hypothesis=hyp
        ))

    # Derive unique condition hypotheses in deterministic order
    condition_hyps: List[str] = []
    for rule in triggered_rules:
        if rule.condition_hypothesis not in condition_hyps:
            condition_hyps.append(rule.condition_hypothesis)

    # Severity Precedence: Critical Rules >= Warning Rules >= ML Anomaly >= Degraded ML >= Normal
    has_critical_rule = any(r.severity_level == SeverityLevel.CRITICAL for r in triggered_rules)
    has_warning_rule = any(r.severity_level == SeverityLevel.WARNING for r in triggered_rules)

    if has_critical_rule:
        final_severity = SeverityLevel.CRITICAL
    elif has_warning_rule:
        final_severity = SeverityLevel.WARNING
    elif ml_result is not None and ml_result.anomaly_label == 1:
        final_severity = SeverityLevel.WARNING
        if not condition_hyps:
            condition_hyps.append("unknown_physiological_anomaly")
    elif ml_result is None:
        # ML service degraded or offline -> caution elevation to Warning
        final_severity = SeverityLevel.WARNING
        condition_hyps.append("telemetry_monitoring_degraded")
    else:
        final_severity = SeverityLevel.NORMAL

    return SeverityAssessment(
        severity=final_severity,
        triggered_rules=triggered_rules,
        condition_hypotheses=condition_hyps,
    )
