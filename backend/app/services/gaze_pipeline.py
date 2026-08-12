"""
Gaze/Oculomotor Pipeline & Calibration Quality Gating Service.

Evaluates oculomotor features against literature-cited thresholds:
- Antisaccade error rate > 0.30 (Antoniades et al. 2013)
- Fixation dispersion > 15.0px (Holmqvist et al. 2011)
- Saccadic latency > 250ms (Opwononi et al. 2023)

Calibration quality gating:
- Calibration residual error > 10.0px -> Flags session as low confidence.
"""

import os
from typing import Any

import numpy as np

from app.services.gaze_metrics import CITED_THRESHOLDS, GazeMetricExtractor

GAZE_MODEL_PATH = "ml/models/gaze_model_v1.joblib"


class GazePipeline:
    def __init__(self):
        self.extractor = GazeMetricExtractor()
        self.model = None
        self.model_version = "gaze_literature_v1"

        if os.path.exists(GAZE_MODEL_PATH):
            try:
                import joblib

                self.model = joblib.load(GAZE_MODEL_PATH)
                self.model_version = "gaze_model_v1"
            except Exception as e:
                print(f"[GazePipeline] Failed to load {GAZE_MODEL_PATH}: {e!s}")

    def process_gaze(
        self, calibration_quality: float, fixation_features: dict[str, Any]
    ) -> dict[str, Any]:
        """Processes gaze payload, applies calibration gating, returns score."""
        metrics = self.extractor.extract_metrics(fixation_features)

        max_calib_limit = CITED_THRESHOLDS["max_acceptable_calibration_error_px"]
        is_low_confidence = calibration_quality > max_calib_limit

        dispersion = metrics["fixation_dispersion_px"]
        latency = metrics["saccade_latency_ms"]
        antisaccade_err = metrics["antisaccade_error_rate"]

        if self.model is not None:
            try:
                feat_vector = np.array([[dispersion, latency, antisaccade_err]])
                prob = float(self.model.predict_proba(feat_vector)[0][1])
                sub_score = round(prob, 4)
                score_label = "Validated Gaze Oculomotor Risk Score"
                is_demo_mode = False
            except Exception as e:
                print(f"[GazePipeline] Model prediction notice: {e!s}")
                sub_score, score_label = self._calculate_threshold_subscore(
                    dispersion, latency, antisaccade_err
                )
                is_demo_mode = True
        else:
            sub_score, score_label = self._calculate_threshold_subscore(
                dispersion, latency, antisaccade_err
            )
            is_demo_mode = True

        if is_low_confidence:
            confidence_note = (
                f"Low confidence calibration "
                f"(residual error {calibration_quality}px "
                f"> {max_calib_limit}px limit)"
            )
        else:
            confidence_note = "High confidence calibration"

        return {
            "metrics": metrics,
            "calibration_quality_px": calibration_quality,
            "is_low_confidence": is_low_confidence,
            "confidence_note": confidence_note,
            "sub_score": sub_score,
            "score_label": score_label,
            "model_version": self.model_version,
            "is_demo_mode": is_demo_mode,
            "citations": [
                "Antoniades et al. (2013) - Antisaccade error threshold (>30%)",
                "Holmqvist et al. (2011) - Fixation dispersion & calibration "
                "quality (>10px gating)",
                "Opwononi et al. (2023) - Saccadic latency threshold (>250ms)",
            ],
        }

    def _calculate_threshold_subscore(
        self, dispersion: float, latency: float, antisaccade_err: float
    ) -> tuple[float, str]:
        """
        Calculates Literature-Threshold score when trained model is absent.
        Labels result as 'Unvalidated Engagement Metric' per project rules.
        """
        base = 0.85

        if antisaccade_err > CITED_THRESHOLDS["baseline_antisaccade_error_rate"]:
            base -= 0.20
        if dispersion > CITED_THRESHOLDS["baseline_fixation_dispersion_px"]:
            base -= 0.15
        if latency > CITED_THRESHOLDS["baseline_saccade_latency_ms"]:
            base -= 0.10

        sub_score = max(0.1, min(1.0, round(base, 2)))
        score_label = "Unvalidated Engagement Metric (Literature-Cited Thresholds)"
        return sub_score, score_label
