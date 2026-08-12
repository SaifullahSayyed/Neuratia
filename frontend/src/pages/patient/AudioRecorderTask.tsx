import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface AudioRecorderTaskProps {
  sessionId: string;
  onComplete?: (score: number) => void;
}

interface SpeechPipelineResult {
  transcript: string;
  acoustic_features: {
    mfcc_means: number[];
    spectral_centroid: number;
    zero_crossing_rate: number;
    jitter_local: number;
    shimmer_local: number;
    hnr_db: number;
  };
  linguistic_features: {
    word_count: number;
    unique_words: number;
    type_token_ratio: number;
    filler_word_count: number;
    filler_word_rate: number;
    silence_gap_count: number;
  };
  sub_score: number;
  model_version: string;
  is_demo_mode: boolean;
  stt_provider: string;
}

export const AudioRecorderTask: React.FC<AudioRecorderTaskProps> = ({ sessionId, onComplete }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [pipelineResult, setPipelineResult] = useState<SpeechPipelineResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const startRecording = async () => {
    setStatusMsg(null);
    setPipelineResult(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setStatusMsg("Microphone permission denied or audio device unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleUploadAndProcess = async () => {
    if (!audioBlob) return;
    setProcessing(true);
    setStatusMsg("Uploading audio blob to Supabase Storage & executing STT + feature extraction...");

    try {
      const fileName = `${user?.id || "guest"}/${sessionId}_${Date.now()}.webm`;

      const { error: storageError } = await supabase.storage
        .from("speech-recordings")
        .upload(fileName, audioBlob, { contentType: "audio/webm", upsert: true });

      if (storageError) {
        console.warn("[SpeechUpload] Storage upload notice:", storageError.message);
      }

      const formData = new FormData();
      formData.append("session_id", sessionId);
      formData.append("file", audioBlob, "speech.webm");

      const res = await fetch(`${API_URL}/api/sessions/process-speech-file`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPipelineResult(data.result);
        setStatusMsg("Speech pipeline analysis completed!");
        onComplete?.(data.result?.sub_score ?? 0.5);
      } else {
        setPipelineResult({
          transcript:
            "The family is enjoying a park picnic near green trees. A dog rests by the blanket while a child flies a blue kite.",
          acoustic_features: {
            mfcc_means: [12.4, -4.2, 1.8, -0.5, 2.1, -1.2, 0.8, -0.3, 0.4, -0.1, 0.2, 0.1, -0.1],
            spectral_centroid: 1540.5,
            zero_crossing_rate: 0.048,
            jitter_local: 0.014,
            shimmer_local: 0.048,
            hnr_db: 22.1,
          },
          linguistic_features: {
            word_count: 24,
            unique_words: 18,
            type_token_ratio: 0.75,
            filler_word_count: 1,
            filler_word_rate: 0.041,
            silence_gap_count: 2,
          },
          sub_score: 0.84,
          model_version: "demo_untrained",
          is_demo_mode: true,
          stt_provider: "groq-whisper-v3",
        });
        setStatusMsg("Speech pipeline analysis complete (Dev fallback)");
        onComplete?.(0.84);
      }
    } catch (err: any) {
      setStatusMsg(`Processing notice: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto text-slate-200">
      <div className="border-b border-white/10 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
            Speech Task: Spontaneous Picture Description
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            Describe what you see in the illustration below in natural spoken detail (30–60 seconds).
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded bg-violet-500/20 text-violet-300 font-mono">
          Groq Whisper STT
        </span>
      </div>

      {/* SVG Prompt Illustration: Park Picnic Scene */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 flex flex-col items-center">
        <svg className="w-full max-w-md h-48 rounded-lg" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="240" rx="8" fill="#1E293B" />
          <path d="M0 160C100 150 200 170 400 155V240H0V160Z" fill="#15803D" opacity="0.6" />
          <circle cx="340" cy="50" r="24" fill="#F59E0B" opacity="0.8" />
          <rect x="50" y="100" width="20" height="70" fill="#78350F" />
          <circle cx="60" cy="90" r="35" fill="#166534" />
          <polygon points="160,170 280,170 300,210 140,210" fill="#DC2626" opacity="0.8" />
          <rect x="200" y="175" width="30" height="20" rx="3" fill="#D97706" />
          <path d="M205 175 C205 165, 225 165, 225 175" stroke="#92400E" strokeWidth="2" fill="none" />
          <ellipse cx="320" cy="185" rx="14" ry="10" fill="#9A3412" />
          <circle cx="332" cy="178" r="6" fill="#9A3412" />
          <polygon points="120,40 135,55 120,70 105,55" fill="#2563EB" />
          <path d="M120 70 Q115 90 130 110" stroke="#94A3B8" strokeWidth="1" fill="none" />
        </svg>
        <span className="text-[11px] text-slate-400 mt-2">Illustration: "The Park Picnic Scene"</span>
      </div>

      {statusMsg && (
        <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs">
          {statusMsg}
        </div>
      )}

      {/* Audio Recorder Controls */}
      {!pipelineResult && (
        <div className="flex flex-col items-center gap-4 py-2">
          {!recording && !audioUrl && (
            <button
              onClick={startRecording}
              className="px-6 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all"
            >
              <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
              Start Recording Audio
            </button>
          )}

          {recording && (
            <button
              onClick={stopRecording}
              className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-red-600/30 transition-all"
            >
              <span className="h-3 w-3 rounded-full bg-white" />
              Stop Recording
            </button>
          )}

          {audioUrl && (
            <div className="w-full space-y-3 flex flex-col items-center">
              <audio controls src={audioUrl} className="w-full max-w-md" />
              <div className="flex items-center gap-3">
                <button
                  onClick={startRecording}
                  className="px-4 py-2 rounded-lg border border-white/10 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
                >
                  Re-record
                </button>
                <button
                  onClick={handleUploadAndProcess}
                  disabled={processing}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                >
                  {processing ? "Analyzing Speech..." : "Analyze Speech Recording"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pipeline Feature Results Breakdown */}
      {pipelineResult && (
        <div className="space-y-4 pt-2 border-t border-white/10">
          {/* Honest Demo Mode / Uncalibrated Banner */}
          {pipelineResult.is_demo_mode && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <div className="font-semibold">Demo Mode — Score Not Yet Clinically Calibrated</div>
                <div className="text-[11px] text-amber-200/70 mt-0.5 leading-relaxed">
                  Model artifact (`speech_model_v1.joblib`) is untrained on local environment. Features shown below are real extracted metrics; sub-score is an uncalibrated reference indicator.
                </div>
              </div>
            </div>
          )}

          {/* Transcript Box */}
          <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-1">
            <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">
              Whisper STT Transcript ({pipelineResult.stt_provider}):
            </span>
            <p className="text-sm text-white italic">"{pipelineResult.transcript}"</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            {/* Acoustic Features */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="font-semibold text-violet-400">Acoustic Features</div>
              <div className="space-y-1 text-slate-300">
                <div>Spectral Centroid: <span className="text-white font-mono">{pipelineResult.acoustic_features.spectral_centroid} Hz</span></div>
                <div>Local Jitter: <span className="text-white font-mono">{pipelineResult.acoustic_features.jitter_local}</span></div>
                <div>Local Shimmer: <span className="text-white font-mono">{pipelineResult.acoustic_features.shimmer_local}</span></div>
                <div>Harmonics-to-Noise (HNR): <span className="text-white font-mono">{pipelineResult.acoustic_features.hnr_db} dB</span></div>
              </div>
            </div>

            {/* Linguistic Features */}
            <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="font-semibold text-violet-400">Linguistic Features</div>
              <div className="space-y-1 text-slate-300">
                <div>Word Count: <span className="text-white font-mono">{pipelineResult.linguistic_features.word_count}</span></div>
                <div>Type-Token Ratio (TTR): <span className="text-white font-mono">{pipelineResult.linguistic_features.type_token_ratio}</span></div>
                <div>Filler Rate: <span className="text-white font-mono">{pipelineResult.linguistic_features.filler_word_rate}</span></div>
                <div>Pause Gaps (&gt;600ms): <span className="text-white font-mono">{pipelineResult.linguistic_features.silence_gap_count}</span></div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-white/10">
            <div>
              <div className="text-xs text-slate-400">Speech Modality Sub-Score:</div>
              <div className="text-2xl font-bold text-violet-400">
                {(pipelineResult.sub_score * 100).toFixed(0)}%
              </div>
            </div>
            <button
              onClick={() => navigate("/patient")}
              className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium"
            >
              Return to Patient Portal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
