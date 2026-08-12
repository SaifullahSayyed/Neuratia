import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { HealthDot } from "../../components/HealthDot";

export const PatientDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Neuratia<span className="text-violet-400">Detect</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Patient Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <HealthDot />
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/60 text-xs hover:bg-slate-700 text-slate-300 transition-all"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
            Welcome, {profile?.full_name || user?.email || "Patient"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Complete the 3 assessment modules below to generate your screening summary.
          </p>

          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            ⚠️ <strong>Screening Aid Only:</strong> Results are intended to support discussions with a healthcare professional, not replace diagnosis.
          </div>
        </div>

        {/* 3 Capture Cards (Phase 2 preview) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="text-3xl">🎙️</div>
            <h3 className="font-semibold text-white">1. Speech Analysis</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Record a short spontaneous speech clip describing a scenario. Analyzes acoustic & linguistic metrics.
            </p>
            <span className="inline-block px-2 py-1 rounded text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
              Coming in Phase 2
            </span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="text-3xl">👁️</div>
            <h3 className="font-semibold text-white">2. Gaze Tracking</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Follow-the-dot and antisaccade oculomotor tasks powered by browser-side MediaPipe landmarking.
            </p>
            <span className="inline-block px-2 py-1 rounded text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
              Coming in Phase 2
            </span>
          </div>

          <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="text-3xl">🧠</div>
            <h3 className="font-semibold text-white">3. Cognitive Mini-Games</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Digit span & sequence memory games, normalized against age and education baseline norms.
            </p>
            <span className="inline-block px-2 py-1 rounded text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 font-medium">
              Coming in Phase 2
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};
