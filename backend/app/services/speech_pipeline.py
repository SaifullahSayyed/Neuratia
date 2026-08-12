"""
Speech Modality Fusion Pipeline & Model Artifact Loader.
Fuses STT, acoustic, and linguistic feature extractors.
Checks for trained `speech_model_v1.joblib` artifact; falls back to honest demo mode if absent.
"""

import os
from typing import Any

import numpy as np

from app.services.acoustic import AcousticFeatureExtractor
from app.services.linguistic import LinguisticFeatureExtractor
from app.services.stt import STTService

MODEL_PATH = "ml/models/speech_model_v1.joblib"


class SpeechPipeline:
    def __init__(self):
        self.stt_service = STTService()
        self.acoustic_extractor = AcousticFeatureExtractor()
        self.linguistic_extractor = LinguisticFeatureExtractor()
        self.model = None
        self.model_version = "demo_untrained"

        if os.path.exists(MODEL_PATH):
            try:
                import joblib

                self.model = joblib.load(MODEL_PATH)
                self.model_version = "speech_model_v1"
            except Exception as e:
                print(f"[SpeechPipeline] Failed to load {MODEL_PATH}: {e!s}")

    async def process_audio(
        self, audio_bytes: bytes, filename: str = "recording.webm"
    ) -> dict[str, Any]:
        """
        Executes STT -> Acoustic Extraction -> Linguistic Extraction -> Model Prediction.
        """
        stt_result = await self.stt_service.transcribe(audio_bytes, filename)
        transcript = stt_result.get("text", "")
        segments = stt_result.get("segments", [])

        acoustic_features = self.acoustic_extractor.extract_features(audio_bytes)

        linguistic_features = self.linguistic_extractor.extract_features(transcript, segments)

        if self.model is not None:
            try:
                mfcc_means = acoustic_features.get("mfcc_means", [0.0] * 13)
                jitter = acoustic_features.get("jitter_local", 0.012)
                shimmer = acoustic_features.get("shimmer_local", 0.045)
                hnr = acoustic_features.get("hnr_db", 21.4)
                ttr = linguistic_features.get("type_token_ratio", 0.6)
                silence_ratio = min(
                    0.5, linguistic_features.get("silence_gap_count", 0) * 0.05
                )
                filler_rate = linguistic_features.get("filler_word_rate", 0.02)

                feat_vector = np.hstack(
                    [mfcc_means, [jitter, shimmer, hnr, ttr, silence_ratio, filler_rate]]
                ).reshape(1, -1)

                prob = self.model.predict_proba(feat_vector)[0][1]
                sub_score = round(float(prob), 4)
                is_demo_mode = False
            except Exception as e:
                print(f"[SpeechPipeline] Prediction error: {e!s}. Falling back to rule scoring.")
                sub_score = self._calculate_rule_subscore(acoustic_features, linguistic_features)
                is_demo_mode = True
        else:
            sub_score = self._calculate_rule_subscore(acoustic_features, linguistic_features)
            is_demo_mode = True

        return {
            "transcript": transcript,
            "acoustic_features": acoustic_features,
            "linguistic_features": linguistic_features,
            "sub_score": sub_score,
            "model_version": self.model_version,
            "is_demo_mode": is_demo_mode,
            "stt_provider": stt_result.get("provider", "unknown"),
        }

    def _calculate_rule_subscore(
        self, acoustic: dict[str, Any], linguistic: dict[str, Any]
    ) -> float:
        """Fallback rule-based sub-score calculation for demo mode (0.0 to 1.0)."""
        ttr = linguistic.get("type_token_ratio", 0.6)
        jitter = acoustic.get("jitter_local", 0.012)
        shimmer = acoustic.get("shimmer_local", 0.045)

        base = 0.85
        if ttr < 0.45:
            base -= 0.20
        if jitter > 0.02:
            base -= 0.15
        if shimmer > 0.06:
            base -= 0.10

        return max(0.1, min(1.0, round(base, 2)))
