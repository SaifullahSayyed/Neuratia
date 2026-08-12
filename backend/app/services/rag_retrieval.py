"""
RAG Retrieval Module — TF-IDF Keyword Retrieval over Static Corpus

Indexes the reference corpus from docs/reference-corpus/corpus.md into
TF-IDF vectors and retrieves the top-k most relevant chunks given a
query string derived from the patient's risk profile.

Uses only stdlib + numpy — no paid vector DB required (100% free-tier).
"""

from __future__ import annotations

import math
import re
from pathlib import Path

CORPUS_PATH = Path(__file__).parents[4] / "docs" / "reference-corpus" / "corpus.md"

# Fallback inline corpus if file is not found (e.g. in unit tests)
FALLBACK_CHUNKS = [
    (
        "Speech biomarkers",
        "Reduced type-token ratio and increased filler word frequency are associated "
        "with elevated cognitive decline risk. Fraser et al. (2016) AUC 0.82.",
    ),
    (
        "Gaze / Oculomotor",
        "Antisaccade error rates above 30% indicate inhibitory control impairment. "
        "Fixation dispersion > 15px and saccadic latency > 250ms are MCI markers.",
    ),
    (
        "Cognitive / Working Memory",
        "Digit span below 25th percentile for age and education warrants clinical "
        "evaluation. WAIS-IV Monaco et al. (2013) normative reference.",
    ),
    (
        "Clinical Risk Framing",
        "A positive screening result does not constitute a diagnosis. AAN guidelines "
        "recommend physician review of all abnormal cognitive screening results.",
    ),
]


def _parse_corpus(path: Path) -> list[tuple[str, str]]:
    """Parse corpus.md into (topic, content) tuples."""
    text = path.read_text(encoding="utf-8")
    chunks: list[tuple[str, str]] = []
    sections = re.split(r"---\n+", text)
    for section in sections:
        lines = [ln.strip() for ln in section.strip().splitlines() if ln.strip()]
        if not lines:
            continue
        topic_line = next((ln for ln in lines if "Topic:" in ln), lines[0])
        topic = re.sub(r"\*\*.*?Topic:.*?\|.*?\*\*", "", topic_line).strip("# *|")
        content_lines = [
            ln for ln in lines
            if not ln.startswith("##") and not ln.startswith("**") and ln
        ]
        content = " ".join(content_lines)
        if content:
            chunks.append((topic.strip(), content))
    return chunks if chunks else FALLBACK_CHUNKS


def _tokenize(text: str) -> list[str]:
    return re.findall(r"[a-z]+", text.lower())


def _tfidf_score(query_tokens: list[str], doc_tokens: list[str]) -> float:
    """Simple TF-IDF cosine similarity between query and document."""
    doc_freq: dict[str, int] = {}
    for t in doc_tokens:
        doc_freq[t] = doc_freq.get(t, 0) + 1
    total = len(doc_tokens) or 1

    score = 0.0
    for t in set(query_tokens):
        tf = doc_freq.get(t, 0) / total
        if tf > 0:
            score += tf * math.log(1 + query_tokens.count(t))
    return score


class RAGRetriever:
    def __init__(self) -> None:
        try:
            self._chunks = _parse_corpus(CORPUS_PATH)
        except Exception:
            self._chunks = FALLBACK_CHUNKS

    def retrieve(self, query: str, top_k: int = 3) -> list[dict[str, str]]:
        """Returns top_k corpus chunks most relevant to the query."""
        q_tokens = _tokenize(query)
        scored = [
            (topic, content, _tfidf_score(q_tokens, _tokenize(content)))
            for topic, content in self._chunks
        ]
        scored.sort(key=lambda x: x[2], reverse=True)
        return [
            {"topic": t, "content": c, "score": round(s, 4)}
            for t, c, s in scored[:top_k]
        ]
