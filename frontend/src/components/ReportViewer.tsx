import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ReportViewerProps {
  sessionId: string;
  fusionResult: Record<string, unknown>;
}

interface ReportResult {
  report_text: string;
  rag_chunks_used: { topic: string; content: string }[];
  model: string;
  is_demo_mode: boolean;
  disclaimer: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Renders markdown-ish text: bold, headers, bullets — no external library needed. */
function renderReportText(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return (
        <h3 key={i} className="text-sm font-bold text-white mt-4 mb-1 font-['Space_Grotesk']">
          {line.replace("## ", "")}
        </h3>
      );
    }
    if (line.startsWith("### ")) {
      return (
        <h4 key={i} className="text-xs font-semibold text-violet-300 mt-3 mb-0.5 uppercase tracking-wide">
          {line.replace("### ", "")}
        </h4>
      );
    }
    if (line.startsWith("- ") || line.startsWith("* ")) {
      return (
        <li key={i} className="text-xs text-slate-300 leading-relaxed ml-4 list-disc">
          {line.replace(/^[-*]\s/, "")}
        </li>
      );
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return (
        <p key={i} className="text-xs font-semibold text-slate-200 mt-2">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    }
    if (line.trim() === "---") {
      return <hr key={i} className="border-white/10 my-3" />;
    }
    if (line.trim() === "") {
      return <div key={i} className="h-1.5" />;
    }
    // Inline bold: **text**
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-xs text-slate-300 leading-relaxed">
        {parts.map((part, j) =>
          part.startsWith("**") ? (
            <strong key={j} className="text-slate-100 font-semibold">
              {part.replace(/\*\*/g, "")}
            </strong>
          ) : (
            part
          )
        )}
      </p>
    );
  });
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  sessionId,
  fusionResult,
}) => {
  const { token } = useAuth();
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRag, setShowRag] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/sessions/generate-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ session_id: sessionId, fusion_result: fusionResult }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.result);
      } else {
        setError(data.detail ?? "Report generation failed.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-5 text-slate-200">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
            AI Clinical Summary Report
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            RAG-augmented Gemini 1.5 Flash — evidence from peer-reviewed literature
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono">
          Phase 6 · LLM + RAG
        </span>
      </div>

      {!report && (
        <>
          <div className="p-4 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-400 space-y-1.5">
            <p>
              <span className="text-slate-300 font-medium">What this generates:</span> A
              structured clinical summary referencing peer-reviewed literature, tailored to
              this session's multimodal risk score.
            </p>
            <p>
              <span className="text-slate-300 font-medium">Model:</span> Google Gemini 1.5
              Flash (free tier via AI Studio). Falls back to a structured template when API
              key is not configured.
            </p>
          </div>

          <button
            id="btn-generate-ai-report"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-fuchsia-600/25 transition-all duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Report…
              </span>
            ) : (
              "Generate AI Clinical Report ✦"
            )}
          </button>
        </>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          ⚠ {error}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          {/* Demo / Live badge */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
              report.is_demo_mode
                ? "bg-amber-500/20 text-amber-300"
                : "bg-emerald-500/20 text-emerald-300"
            }`}>
              {report.is_demo_mode
                ? `Template Fallback (${report.model})`
                : `Gemini 1.5 Flash — Live`}
            </span>
            <span className="text-[10px] text-slate-500">
              {report.rag_chunks_used.length} RAG context chunk
              {report.rag_chunks_used.length !== 1 ? "s" : ""} retrieved
            </span>
          </div>

          {/* Report Body */}
          <div className="bg-slate-950/60 rounded-xl border border-white/5 p-5 space-y-1 max-h-[480px] overflow-y-auto custom-scrollbar">
            {renderReportText(report.report_text)}
          </div>

          {/* RAG Context Accordion */}
          <div className="border border-white/5 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowRag((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] text-slate-400 hover:text-slate-200 bg-slate-800/40 transition-colors"
            >
              <span className="font-semibold uppercase tracking-wide">
                📚 Retrieved Literature Context ({report.rag_chunks_used.length} chunks)
              </span>
              <span>{showRag ? "▲" : "▼"}</span>
            </button>
            {showRag && (
              <div className="divide-y divide-white/5">
                {report.rag_chunks_used.map((chunk, i) => (
                  <div key={i} className="px-4 py-3 space-y-1">
                    <div className="text-[10px] font-semibold text-violet-300 uppercase">
                      {chunk.topic}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-4">
                      {chunk.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setReport(null)}
            className="text-[11px] text-slate-400 hover:text-violet-300 underline"
          >
            Regenerate Report ↩
          </button>
        </div>
      )}
    </div>
  );
};
