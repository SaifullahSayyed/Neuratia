import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { ReportViewer } from "./ReportViewer";

interface FusionReportPanelProps {
  sessionId: string;
  speechScore?: number;
  gazeScore?: number;
  cognitiveScore?: number;
}

interface ModalityContribution {
  speech?: number;
  gaze?: number;
  cognitive?: number;
}

interface FusionResult {
  composite_score: number;
  risk_band: "low" | "moderate" | "high";
  risk_label: string;
  modality_contributions: ModalityContribution;
  weights_applied: ModalityContribution;
  missing_modalities: string[];
  is_demo_mode: boolean;
  score_label: string;
  citations: string[];
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const BAND_STYLES = {
  low: {
    ring: "ring-emerald-500/40",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
    bar: "bg-emerald-500",
    emoji: "🟢",
  },
  moderate: {
    ring: "ring-amber-500/40",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
    bar: "bg-amber-500",
    emoji: "🟡",
  },
  high: {
    ring: "ring-rose-500/40",
    bg: "bg-rose-500/10",
    text: "text-rose-300",
    bar: "bg-rose-500",
    emoji: "🔴",
  },
};

const MODALITY_LABELS: Record<string, string> = {
  speech: "Speech / Linguistic",
  gaze: "Gaze / Oculomotor",
  cognitive: "Cognitive Games",
};

export const FusionReportPanel: React.FC<FusionReportPanelProps> = ({
  sessionId,
  speechScore,
  gazeScore,
  cognitiveScore,
}) => {
  const { token } = useAuth();
  const [result, setResult] = useState<FusionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFuse = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/sessions/fuse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          speech_score: speechScore ?? null,
          gaze_score: gazeScore ?? null,
          cognitive_score: cognitiveScore ?? null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.result);
      } else {
        setError(data.detail ?? "Fusion failed.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const compositePercent = result ? Math.round(result.composite_score * 100) : 0;
  const styles = result ? BAND_STYLES[result.risk_band] : null;

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-5 text-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
            Multimodal Fusion Report
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Literature-weighted composite of all modality sub-scores
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 font-mono">
          Phase 5
        </span>
      </div>

      {/* Inputs Summary */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        {[
          { key: "speech", label: "Speech", score: speechScore },
          { key: "gaze", label: "Gaze", score: gazeScore },
          { key: "cognitive", label: "Cognitive", score: cognitiveScore },
        ].map(({ key, label, score }) => (
          <div
            key={key}
            className={`rounded-xl py-3 border ${
              score !== undefined
                ? "bg-violet-500/10 border-violet-500/30"
                : "bg-slate-800/40 border-white/5 opacity-50"
            }`}
          >
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              {label}
            </div>
            <div className="text-base font-bold text-white mt-1">
              {score !== undefined ? `${Math.round(score * 100)}%` : "—"}
            </div>
          </div>
        ))}
      </div>

      {/* Fuse Button */}
      {!result && (
        <button
          id="btn-generate-fusion-report"
          onClick={handleFuse}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 transition-all duration-200"
        >
          {loading ? "Computing Fusion Score…" : "Generate Fusion Report ✦"}
        </button>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          ⚠ {error}
        </div>
      )}

      {/* Fusion Result */}
      {result && styles && (
        <div className="space-y-5">
          {/* Demo Banner */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px]">
            🔬 <strong>Research Prototype:</strong> {result.score_label}
          </div>

          {/* Composite Score Ring */}
          <div className={`flex items-center gap-5 p-4 rounded-2xl ring-1 ${styles.ring} ${styles.bg}`}>
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ffffff0d" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  strokeWidth="3"
                  stroke={result.risk_band === "high" ? "#f43f5e" : result.risk_band === "moderate" ? "#f59e0b" : "#10b981"}
                  strokeDasharray={`${compositePercent} ${100 - compositePercent}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white">{compositePercent}%</span>
              </div>
            </div>
            <div>
              <div className={`text-base font-bold ${styles.text}`}>
                {styles.emoji} {result.risk_label}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 leading-relaxed max-w-[220px]">
                Composite risk signal derived from{" "}
                <strong className="text-slate-300">
                  {3 - result.missing_modalities.length}/3
                </strong>{" "}
                modalities.
              </div>
              {result.missing_modalities.length > 0 && (
                <div className="text-[10px] text-amber-400 mt-1">
                  Missing: {result.missing_modalities.join(", ")} (weight redistributed)
                </div>
              )}
            </div>
          </div>

          {/* Per-Modality Contribution Bars */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-3">
              SHAP-style Modality Contributions
            </div>
            <div className="space-y-2">
              {(["speech", "gaze", "cognitive"] as const).map((mod) => {
                const contribution = result.modality_contributions[mod];
                const weight = result.weights_applied[mod];
                if (contribution === undefined || weight === undefined) return null;
                const pct = Math.round(contribution * 100);
                return (
                  <div key={mod}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">{MODALITY_LABELS[mod]}</span>
                      <span className="text-slate-400 font-mono">
                        {pct}% &nbsp;
                        <span className="text-slate-500 text-[10px]">
                          (w={Math.round(weight * 100)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${styles.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Citations */}
          <div className="pt-3 border-t border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-1.5">
              Weight Justification (Literature)
            </div>
            <ul className="text-[10px] text-slate-400 space-y-0.5 list-disc pl-4">
              {result.citations.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Non-Diagnostic Disclaimer */}
          <p className="text-[10px] text-slate-500 leading-relaxed border-t border-white/5 pt-3">
            ⚠ This score is generated by a research prototype and is not a clinical
            diagnostic tool. It does not constitute medical advice or a clinical
            diagnosis. Always consult a qualified neurologist or clinician.
          </p>

          {/* AI Report Generation (Phase 6) */}
          <ReportViewer
            sessionId={sessionId}
            fusionResult={result as unknown as Record<string, unknown>}
          />

          <button
            onClick={() => setResult(null)}
            className="text-[11px] text-slate-400 hover:text-violet-300 underline"
          >
            Recalculate ↩
          </button>
        </div>
      )}
    </div>
  );
};
