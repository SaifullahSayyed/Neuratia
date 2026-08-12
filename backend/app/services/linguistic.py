"""
Linguistic Feature Extractor
Extracts lexical diversity (TTR), filler word frequency, and pause metrics.
"""

import re
from typing import Any

FILLER_WORDS = {"um", "uh", "er", "ah", "like", "you know", "hmm", "well"}


class LinguisticFeatureExtractor:
    def extract_features(
        self, transcript: str, segments: list[dict[str, Any]] | None = None
    ) -> dict[str, Any]:
        """Extracts TTR, filler word rate, and silence gap metrics from transcript text."""
        if not transcript or not transcript.strip():
            return {
                "word_count": 0,
                "unique_words": 0,
                "type_token_ratio": 0.0,
                "filler_word_count": 0,
                "filler_word_rate": 0.0,
                "silence_gap_count": 0,
            }

        # Tokenization & normalization
        words = re.findall(r"\b\w+\b", transcript.lower())
        word_count = len(words)
        unique_words = len(set(words)) if word_count > 0 else 0
        ttr = round(unique_words / word_count, 4) if word_count > 0 else 0.0

        # Filler word count
        fillers_found = [w for w in words if w in FILLER_WORDS]
        filler_count = len(fillers_found)
        filler_rate = round(filler_count / word_count, 4) if word_count > 0 else 0.0

        # Silence gap estimation from segment timestamps if available
        silence_gaps = 0
        if segments:
            for i in range(1, len(segments)):
                prev_end = segments[i - 1].get("end", 0)
                curr_start = segments[i].get("start", 0)
                if (curr_start - prev_end) > 0.6:  # Gaps > 600ms count as hesitation pauses
                    silence_gaps += 1

        return {
            "word_count": word_count,
            "unique_words": unique_words,
            "type_token_ratio": ttr,
            "filler_word_count": filler_count,
            "filler_word_rate": filler_rate,
            "silence_gap_count": silence_gaps,
        }
