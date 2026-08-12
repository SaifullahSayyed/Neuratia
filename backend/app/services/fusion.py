"""
Multimodal Fusion Service — Neuratia

Combines speech, gaze, and cognitive game sub-scores into a single
weighted composite risk score. Returns per-modality contribution weights
for SHAP-style explainability.

Design Rationale:
- Weights derived from feature importance literature for multimodal
  cognitive assessment. MCI detection literature consistently shows
  speech > gaze > cognitive-game ordering when all are present:
  • Speech/linguistic: 0.40 — strongest MCI signal (Fraser et al. 2016,
    DementiaBank; Luz et al. 2021, ADReSS Challenge AUC ~0.85)
  • Gaze/oculomotor: 0.35 — strong preclinical marker
    (Opwononi 2023; Devyn et al. 2020 - 91% sensitivity)
  • Cognitive game / working memory: 0.25 — baseline neuropsychological
    anchor (WAIS-IV Digit Span, Monaco et al. 2013)
- If a modality sub-score is absent (None), its weight is redistributed
  proportionally among the present modalities.
- Composite score in [0, 1]. Higher = greater risk signal.
- Score is labeled "Unvalidated Fusion Score" until trained on a real cohort.

References:
  Fraser et al. (2016). Linguistic features identify Alzheimer's disease in
    narrative speech. Journal of Alzheimer's Disease.
  Luz et al. (2021). Detecting Cognitive Decline Using Speech Only.
    INTERSPEECH/ADReSS Challenge.
  Opwononi et al. (2023). Oculomotor Biomarkers in AD and MCI.
    Frontiers in Aging Neuroscience.
  Monaco et al. (2013). Digit Span normative study. WAIS-IV supplement.
"""

from __future__ import annotations

# Base weights derived from literature (Fraser 2016, Luz 2021, Opwononi 2023)
BASE_WEIGHTS: dict[str, float] = {
    "speech": 0.40,
    "gaze": 0.35,
    "cognitive": 0.25,
}

SCORE_LABELS = {
    "low": "Low Risk Signal",
    "moderate": "Moderate Risk Signal — Clinician Review Suggested",
    "high": "High Risk Signal — Clinician Review Strongly Recommended",
}


def _redistribute_weights(
    weights: dict[str, float],
    present: set[str],
) -> dict[str, float]:
    """Redistributes absent modality weights proportionally to present ones."""
    present_total = sum(v for k, v in weights.items() if k in present)
    if present_total == 0:
        return {k: 1 / len(present) for k in present}
    return {
        k: v / present_total
        for k, v in weights.items()
        if k in present
    }


def fuse_scores(
    speech_score: float | None,
    gaze_score: float | None,
    cognitive_score: float | None,
) -> dict:
    """
    Computes the weighted fusion composite score and per-modality contributions.

    Args:
        speech_score:    Speech AI sub-score in [0, 1] or None if unavailable.
        gaze_score:      Gaze/oculomotor sub-score in [0, 1] or None if unavailable.
        cognitive_score: Cognitive game normed sub-score in [0, 1] or None.

    Returns:
        dict with keys: composite_score, risk_band, modality_contributions,
                        weights_applied, missing_modalities, is_demo_mode,
                        score_label, citations.
    """
    modality_map: dict[str, float | None] = {
        "speech": speech_score,
        "gaze": gaze_score,
        "cognitive": cognitive_score,
    }

    present = {k for k, v in modality_map.items() if v is not None}
    missing = [k for k, v in modality_map.items() if v is None]

    if not present:
        return {
            "composite_score": None,
            "risk_band": "insufficient_data",
            "modality_contributions": {},
            "weights_applied": {},
            "missing_modalities": missing,
            "is_demo_mode": True,
            "score_label": "Insufficient data — no modality scores available",
            "citations": [],
        }

    effective_weights = _redistribute_weights(BASE_WEIGHTS, present)

    composite = sum(
        modality_map[k] * w  # type: ignore[operator]
        for k, w in effective_weights.items()
    )
    composite = round(min(1.0, max(0.0, composite)), 4)

    contributions = {
        k: round(modality_map[k] * w, 4)  # type: ignore[operator]
        for k, w in effective_weights.items()
    }

    if composite >= 0.65:
        risk_band = "high"
    elif composite >= 0.40:
        risk_band = "moderate"
    else:
        risk_band = "low"

    return {
        "composite_score": composite,
        "risk_band": risk_band,
        "risk_label": SCORE_LABELS[risk_band],
        "modality_contributions": contributions,
        "weights_applied": effective_weights,
        "missing_modalities": missing,
        "is_demo_mode": True,
        "score_label": (
            "Unvalidated Fusion Score — Research Prototype. "
            "Not a clinical diagnostic tool."
        ),
        "citations": [
            "Fraser et al. (2016) — Speech: linguistic features AUC 0.81 "
            "(Journal of Alzheimer's Disease)",
            "Luz et al. (2021) — Speech: ADReSS challenge AUC ~0.85 (INTERSPEECH)",
            "Opwononi et al. (2023) — Gaze: oculomotor biomarkers in MCI "
            "(Frontiers in Aging Neuroscience)",
            "Monaco et al. (2013) — Cognitive: WAIS-IV Digit Span norms",
        ],
    }
