import { HealthDot } from "./components/HealthDot";
import "./index.css";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          {/* Wordmark */}
          <span
            className="text-xl font-semibold tracking-tight text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Cogni<span className="text-violet-400">Detect</span>
          </span>
          <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-300 uppercase tracking-widest">
            Research Prototype
          </span>
        </div>
        <HealthDot />
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-8">

        {/* Glow blob */}
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center gap-5 max-w-xl">
          <h1
            className="text-5xl font-bold tracking-tight text-white leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Early cognitive screening,{" "}
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)" }}>
              powered by AI
            </span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed">
            CogniDetect combines speech analysis, gaze tracking, and cognitive
            mini-games into a risk-flag report you can take to your doctor.
          </p>

          {/* Disclaimer — always visible, non-dismissable */}
          <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-left">
            <p className="text-amber-300 text-sm font-medium">
              ⚠️ Screening aid only — not a medical diagnosis
            </p>
            <p className="text-amber-200/60 text-xs mt-1 leading-relaxed">
              This tool is a research prototype and does not replace assessment by a
              qualified clinician. All scores are informational indicators only.
            </p>
          </div>

          {/* Phase progress cards */}
          <div className="grid grid-cols-3 gap-3 w-full mt-2">
            {[
              { phase: "0", label: "Scaffolding", status: "done" },
              { phase: "1", label: "Auth & Schema", status: "next" },
              { phase: "2", label: "Capture UI", status: "pending" },
            ].map(({ phase, label, status }) => (
              <div
                key={phase}
                className={`rounded-xl border p-4 text-left transition-all ${
                  status === "done"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : status === "next"
                    ? "border-violet-500/30 bg-violet-500/5"
                    : "border-white/5 bg-white/2"
                }`}
              >
                <div className={`text-xs font-semibold mb-1 ${
                  status === "done" ? "text-emerald-400" :
                  status === "next" ? "text-violet-400" : "text-slate-500"
                }`}>
                  {status === "done" ? "✓ Complete" : status === "next" ? "→ Next" : "○ Pending"}
                </div>
                <div className="text-white text-sm font-medium">Phase {phase}</div>
                <div className="text-slate-400 text-xs">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="px-8 py-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-600">
        <span>CogniDetect · NEC 2026 · IIT Bombay</span>
        <span>Built on free-tier infrastructure · Not for clinical use</span>
      </footer>
    </div>
  );
}
