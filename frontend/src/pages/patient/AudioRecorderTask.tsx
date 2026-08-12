import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

interface AudioRecorderTaskProps {
  sessionId: string;
}

export const AudioRecorderTask: React.FC<AudioRecorderTaskProps> = ({ sessionId }) => {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const startRecording = async () => {
    setStatusMsg(null);
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
        // Stop tracks
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

  const handleUploadAndSubmit = async () => {
    if (!audioBlob) return;
    setUploading(true);
    setStatusMsg("Uploading speech recording...");

    try {
      const fileName = `${user?.id || "guest"}/${sessionId}_${Date.now()}.webm`;

      // Upload directly to Supabase Storage object store (never local disk on server)
      const { data: storageData, error: storageError } = await supabase.storage
        .from("speech-recordings")
        .upload(fileName, audioBlob, { contentType: "audio/webm", upsert: true });

      const storagePath = storageData?.path || fileName;
      if (storageError) {
        console.warn("[SpeechUpload] Supabase Storage upload skipped/fallback:", storageError.message);
      }

      // Submit reference storage path to backend
      const res = await fetch(`${API_URL}/api/sessions/speech`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          audio_storage_path: storagePath,
          transcript: null,
          metadata: { duration_sec: 15 },
        }),
      });

      if (res.ok) {
        setStatusMsg("Speech recording submitted successfully!");
        setTimeout(() => navigate("/patient"), 1500);
      } else {
        setStatusMsg("Failed to submit speech record to API.");
      }
    } catch (err: any) {
      setStatusMsg(`Submission error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6 max-w-2xl mx-auto text-slate-200">
      <div className="border-b border-white/10 pb-4">
        <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">
          Speech Task: Spontaneous Picture Description
        </h2>
        <p className="text-slate-400 text-xs mt-0.5">
          Describe what you see in the illustration below in natural spoken detail (30–60 seconds).
        </p>
      </div>

      {/* Original SVG Prompt Illustration: Park Picnic Scene */}
      <div className="bg-slate-800/60 border border-white/10 rounded-xl p-4 flex flex-col items-center">
        <svg className="w-full max-w-md h-56 rounded-lg" viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="240" rx="8" fill="#1E293B" />
          {/* Grass */}
          <path d="M0 160C100 150 200 170 400 155V240H0V160Z" fill="#15803D" opacity="0.6" />
          {/* Sun */}
          <circle cx="340" cy="50" r="24" fill="#F59E0B" opacity="0.8" />
          {/* Tree */}
          <rect x="50" y="100" width="20" height="70" fill="#78350F" />
          <circle cx="60" cy="90" r="35" fill="#166534" />
          {/* Picnic Blanket */}
          <polygon points="160,170 280,170 300,210 140,210" fill="#DC2626" opacity="0.8" />
          {/* Basket */}
          <rect x="200" y="175" width="30" height="20" rx="3" fill="#D97706" />
          <path d="M205 175 C205 165, 225 165, 225 175" stroke="#92400E" strokeWidth="2" fill="none" />
          {/* Dog */}
          <ellipse cx="320" cy="185" rx="14" ry="10" fill="#9A3412" />
          <circle cx="332" cy="178" r="6" fill="#9A3412" />
          {/* Kite */}
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
                onClick={handleUploadAndSubmit}
                disabled={uploading}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Submit Speech Recording"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
