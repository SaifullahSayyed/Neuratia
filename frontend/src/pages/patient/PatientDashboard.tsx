import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { HealthDot } from "../../components/HealthDot";
import { ConsentModal } from "../../components/ConsentModal";
import { CognitiveGamesTask } from "./CognitiveGamesTask";
import { AudioRecorderTask } from "./AudioRecorderTask";
import { GazeTrackerTask } from "./GazeTrackerTask";

type ActiveView = "dashboard" | "cognitive" | "speech" | "gaze";

export const PatientDashboard: React.FC = () => {
  const { user, profile, signOut, token } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [showConsent, setShowConsent] = useState(false);
  const [targetViewAfterConsent, setTargetViewAfterConsent] = useState<ActiveView>("cognitive");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<{ age: number; education: string }>({
    age: 60,
    education: "secondary",
  });

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleStartTaskClick = (view: ActiveView) => {
    if (!sessionId) {
      setTargetViewAfterConsent(view);
      setShowConsent(true);
    } else {
      setActiveView(view);
    }
  };

  const handleConsentGiven = async (age: number, education: string) => {
    setShowConsent(false);
    setDemographics({ age, education });

    try {
      const res = await fetch(`${API_URL}/api/sessions/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          consent_given: true,
          age,
          education_level: education,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newSessionId = data.session?.id || "mock-session-123";
        setSessionId(newSessionId);
        setActiveView(targetViewAfterConsent);
      }
    } catch {
      setSessionId("mock-session-123");
      setActiveView(targetViewAfterConsent);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col">
      {/* Consent Modal */}
      {showConsent && (
        <ConsentModal
          onConsent={handleConsentGiven}
          onCancel={() => setShowConsent(false)}
        />
      )}

      {/* Top Header */}
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView("dashboard")}
            className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk'] text-left"
          >
            Neuratia<span className="text-violet-400">Detect</span>
          </button>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            Patient Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <HealthDot />
          {activeView !== "dashboard" && (
            <button
              onClick={() => setActiveView("dashboard")}
              className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Dashboard
            </button>
          )}
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
        {activeView === "dashboard" && (
          <>
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold text-white font-['Space_Grotesk']">
                Welcome, {profile?.full_name || user?.email || "Patient"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Complete all 3 assessment modules below to generate your screening report.
              </p>

              {sessionId ? (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
                  <div>
                    <strong>Active Session:</strong> {sessionId}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200">
                    Consent Signed
                  </span>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300 flex items-center justify-between">
                  <div>
                    Click any task below to review informed consent & start your screening session.
                  </div>
                </div>
              )}
            </div>

            {/* 3 Interactive Capture Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Speech Analysis */}
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-violet-500/40 transition-all">
                <div className="space-y-2">
                  <div className="text-3xl">🎙️</div>
                  <h3 className="font-semibold text-white">1. Speech Analysis</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Record spontaneous speech describing a picture prompt. Acoustic & pause feature extraction.
                  </p>
                </div>
                <button
                  onClick={() => handleStartTaskClick("speech")}
                  className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-md shadow-violet-600/20"
                >
                  Start Speech Task
                </button>
              </div>

              {/* Card 2: Gaze Tracking */}
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-violet-500/40 transition-all">
                <div className="space-y-2">
                  <div className="text-3xl">👁️</div>
                  <h3 className="font-semibold text-white">2. Gaze Tracking</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    9-point calibration, smooth pursuit, & antisaccade tasks powered by browser MediaPipe WASM.
                  </p>
                </div>
                <button
                  onClick={() => handleStartTaskClick("gaze")}
                  className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-md shadow-violet-600/20"
                >
                  Start Gaze Task
                </button>
              </div>

              {/* Card 3: Cognitive Mini-Games */}
              <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 space-y-3 flex flex-col justify-between hover:border-violet-500/40 transition-all">
                <div className="space-y-2">
                  <div className="text-3xl">🧠</div>
                  <h3 className="font-semibold text-white">3. Cognitive Games</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Digit span memory task normalized against age and education baseline norms.
                  </p>
                </div>
                <button
                  onClick={() => handleStartTaskClick("cognitive")}
                  className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-md shadow-violet-600/20"
                >
                  Start Cognitive Games
                </button>
              </div>
            </div>
          </>
        )}

        {activeView === "cognitive" && (
          <CognitiveGamesTask
            sessionId={sessionId || "mock-session-123"}
            age={demographics.age}
            education={demographics.education}
          />
        )}

        {activeView === "speech" && (
          <AudioRecorderTask sessionId={sessionId || "mock-session-123"} />
        )}

        {activeView === "gaze" && (
          <GazeTrackerTask sessionId={sessionId || "mock-session-123"} />
        )}
      </main>
    </div>
  );
};
