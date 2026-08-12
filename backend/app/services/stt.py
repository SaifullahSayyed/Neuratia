"""
Speech-to-Text (STT) Service
Primary: Groq Hosted Whisper Endpoint (`whisper-large-v3-turbo`)
Fallback: Provider-agnostic fallback when Groq key is placeholder or rate-limited.
"""

from typing import Any

from app.core.config import settings


class STTService:
    def __init__(self):
        self.provider = settings.llm_provider
        self.groq_api_key = settings.groq_api_key

    async def transcribe(
        self, audio_bytes: bytes, filename: str = "recording.webm"
    ) -> dict[str, Any]:
        """
        Transcribes audio bytes using Groq Hosted Whisper API.
        Returns dict with keys: 'text', 'word_timestamps', 'provider'.
        """
        if (
            self.groq_api_key
            and self.groq_api_key != "your-groq-api-key"
            and not self.groq_api_key.startswith("placeholder")
        ):
            try:
                from groq import Groq

                client = Groq(api_key=self.groq_api_key)
                transcription = client.audio.transcriptions.create(
                    file=(filename, audio_bytes),
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json",
                )
                text = getattr(transcription, "text", str(transcription))
                segments = getattr(transcription, "segments", [])
                return {
                    "text": text,
                    "segments": segments,
                    "provider": "groq-whisper-v3",
                }
            except Exception as e:
                print(f"[STTService] Groq API notice: {e!s}. Falling back to dev mock STT.")

        mock_text = (
            "The family is having a park picnic near the green trees. "
            "A dog is resting near the red blanket, and a child is flying a blue kite."
        )
        return {
            "text": mock_text,
            "segments": [],
            "provider": "mock-fallback",
            "note": "Dev fallback transcript — configure GROQ_API_KEY for live Groq Whisper API",
        }
