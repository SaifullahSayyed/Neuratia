import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import { HealthDot } from "../../components/HealthDot";

export const DoctorDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col">
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Neuratia<span className="text-violet-400">Detect</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Clinician Portal
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

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
            Clinician Portal — Dr. {profile?.full_name || user?.email || "Doctor"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Review approved patient session histories and ground-truth RAG explanation reports.
          </p>
        </div>

        <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-white">Linked Patients</h3>
          <p className="text-slate-400 text-xs">
            Patients must link their account to your Clinician ID and be approved by an administrator before session data becomes visible.
          </p>
          <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-xl text-xs">
            No linked patient records found. Admin approval is required for doctor-patient connections.
          </div>
        </div>
      </main>
    </div>
  );
};
