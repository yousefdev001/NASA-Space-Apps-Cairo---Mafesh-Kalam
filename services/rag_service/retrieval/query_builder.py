"""Deterministic Query Synthesis for Medical Protocol Retrieval.

Translates clinical hypotheses, rule-based physiological deviations,
and standard NASA spaceflight operational keywords into an optimized hybrid search query.
"""

from shared.contracts.ml_contract import MLPredictRequest
from shared.rules.severity_engine import SeverityAssessment


def build_retrieval_query(
    vitals: MLPredictRequest,
    assessment: SeverityAssessment
) -> str:
    """Build a deterministic hybrid search query from vitals and clinical assessment.

    Parameters:
    ----------
    vitals: MLPredictRequest
        Validated telemetry readings.
    assessment: SeverityAssessment
        Clinical severity assessment containing condition hypotheses and triggered rules.

    Returns:
    -------
    str:
        Synthesized query string for dense vector and sparse lexical retrieval.
    """
    terms = []

    # 1. Primary Clinical Hypotheses
    for hyp in assessment.condition_hypotheses:
        # Avoid generic degraded token polluting procedural search
        if hyp != "telemetry_monitoring_degraded":
            clean_hyp = hyp.replace("_", " ")
            if clean_hyp not in terms:
                terms.append(clean_hyp)

    # 2. Explicit Physiological Deviations
    for rule in assessment.triggered_rules:
        metric_clean = rule.metric.replace("_", " ")
        # e.g., "spo2 percent 86.5" or "heart rate bpm 142.0"
        rule_term = f"{metric_clean} {rule.value}"
        if rule_term not in terms:
            terms.append(rule_term)

    # 3. Standard NASA Spaceflight Operational Procedure Anchor Keywords
    terms.append("emergency medical procedure checklist action steps")

    return " ".join(terms)
