import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../contexts/LangContext";
import { HealthDot } from "../../components/HealthDot";
import { ConsentModal } from "../../components/ConsentModal";
import { CognitiveGamesTask } from "./CognitiveGamesTask";
import { AudioRecorderTask } from "./AudioRecorderTask";
import { GazeTrackerTask } from "./GazeTrackerTask";
import { FusionReportPanel } from "../../components/FusionReportPanel";
import { API_URL } from "../../lib/api";

type ActiveView = "dashboard" | "cognitive" | "speech" | "gaze";


// ── Progress stepper ──────────────────────────────────────────
const ProgressStepper: React.FC<{
  speech?: number;
  gaze?: number;
  cognitive?: number;
}> = ({ speech, gaze, cognitive }) => {
  const steps = [
    { key: "speech", label: "Speech", icon: "🎙️", done: speech !== undefined },
    { key: "gaze", label: "Gaze", icon: "👁️", done: gaze !== undefined },
    { key: "cognitive", label: "Cognitive", icon: "🧠", done: cognitive !== undefined },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="flex items-center gap-2 py-3 px-4 bg-slate-900/60 rounded-xl border border-white/8">
      <div className="flex items-center gap-1 flex-1">
        {steps.map((step, i) => (
          <React.Fragment key={step.key}>
            <div className={`flex flex-col items-center gap-1 flex-shrink-0`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-500 ${
                  step.done
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-600/40 scale-110"
                    : "bg-slate-800 text-slate-500 border border-white/8"
                }`}
              >
                {step.done ? "✓" : step.icon}
              </div>
              <span className={`text-[9px] font-medium ${step.done ? "text-violet-300" : "text-slate-500"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-all duration-700 ${
                steps[i].done && steps[i + 1].done ? "bg-violet-500" : steps[i].done ? "bg-violet-500/50" : "bg-slate-800"
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="ml-2 text-right flex-shrink-0">
        <div className="text-base font-extrabold text-white">{doneCount}/3</div>
        <div className="text-[10px] text-slate-500">done</div>
      </div>
    </div>
  );
};

// ── Score reveal badge ────────────────────────────────────────
const ScoreBadge: React.FC<{ score?: number; label: string }> = ({ score, label }) => {
  if (score === undefined) return null;
  const pct = Math.round(score * 100);
  const color = pct >= 65 ? "text-emerald-300" : pct >= 45 ? "text-amber-300" : "text-rose-300";
  return (
    <div className={`text-[10px] px-2 py-0.5 rounded-full bg-slate-800/60 border border-white/10 font-mono ${color} animate-fade-in`}>
      {label}: {pct}%
    </div>
  );
};

// ── Task card ─────────────────────────────────────────────────
const TaskCard: React.FC<{
  icon: string;
  title: string;
  desc: string;
  btnLabel: string;
  score?: number;
  scoreLabel: string;
  onClick: () => void;
}> = ({ icon, title, desc, btnLabel, score, scoreLabel, onClick }) => (
  <div className="glass-card glass-card-hover grad-border p-5 space-y-3 flex flex-col justify-between">
    <div className="space-y-2">
      <div className="text-3xl">{icon}</div>
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
      {score !== undefined && <ScoreBadge score={score} label={scoreLabel} />}
    </div>
    <button
      onClick={onClick}
      className={`w-full py-2.5 rounded-xl text-white text-xs font-semibold transition-all duration-200 shadow-md ${
        score !== undefined
          ? "bg-emerald-600/70 hover:bg-emerald-600 shadow-emerald-600/20"
          : "bg-violet-600 hover:bg-violet-500 shadow-violet-600/30 hover:scale-[1.02] active:scale-95"
      }`}
    >
      {score !== undefined ? "✓ Redo" : btnLabel}
    </button>
  </div>
);

// ── Main component ────────────────────────────────────────────
export const PatientDashboard: React.FC = () => {
  const { user, profile, signOut, token } = useAuth();
  const { t, lang, setLang } = useLang();
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [showConsent, setShowConsent] = useState(false);
  const [targetViewAfterConsent, setTargetViewAfterConsent] = useState<ActiveView>("cognitive");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<{ age: number; education: string }>({
    age: 60,
    education: "secondary",
  });
  const [speechScore, setSpeechScore] = useState<number | undefined>(undefined);
  const [gazeScore, setGazeScore] = useState<number | undefined>(undefined);
  const [cognitiveScore, setCognitiveScore] = useState<number | undefined>(undefined);
  const [mobileTab, setMobileTab] = useState<"tasks" | "report">("tasks");

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
        body: JSON.stringify({ consent_given: true, age, education_level: education }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session?.id || `sess-${Date.now()}`);
      } else {
        setSessionId(`sess-${Date.now()}`);
      }
    } catch {
      setSessionId(`sess-${Date.now()}`);
    }

    setActiveView(targetViewAfterConsent);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col mobile-pb">
      {/* Consent modal */}
      {showConsent && (
        <ConsentModal onConsent={handleConsentGiven} onCancel={() => setShowConsent(false)} />
      )}

      {/* Header */}
      <header className="px-4 md:px-6 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView("dashboard")}
            className="text-lg md:text-xl font-bold tracking-tight text-white font-['Space_Grotesk'] min-h-0"
          >
            Neuratia<span className="text-violet-400">Detect</span>
          </button>
          <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            {t("patientPortal")}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Language picker */}
          <div className="flex items-center rounded-lg overflow-hidden border border-white/10 text-[11px] font-medium">
            {(["en", "hi", "ur"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2 py-1 min-h-0 transition-colors ${lang === l ? "bg-violet-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"}`}
              >
                {t(l === "en" ? "langEn" : l === "hi" ? "langHi" : "langUr")}
              </button>
            ))}
          </div>

          <HealthDot />
          {activeView !== "dashboard" && (
            <button
              onClick={() => setActiveView("dashboard")}
              className="hidden sm:flex px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              {t("dashboard")}
            </button>
          )}
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/60 text-xs hover:bg-slate-700 text-slate-300 transition-all"
          >
            {t("signOut")}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-5">
        {activeView === "dashboard" && (
          <>
            {/* Welcome card */}
            <div className="glass-card p-5 animate-slide-up">
              <h2 className="text-xl md:text-2xl font-bold text-white font-['Space_Grotesk']">
                {t("welcomePatient")} {profile?.full_name || user?.email || "Patient"}
              </h2>
              <p className="text-slate-400 text-sm mt-1">{t("completeModules")}</p>

              {/* Session status */}
              {sessionId ? (
                <div className="mt-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <strong>{t("activeSession")}</strong> <span className="font-mono opacity-70">{sessionId.slice(0, 20)}…</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 text-[10px]">{t("consentSigned")}</span>
                    {(speechScore !== undefined || gazeScore !== undefined || cognitiveScore !== undefined) && (
                      <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-200 text-[10px]">
                        {[speechScore, gazeScore, cognitiveScore].filter((s) => s !== undefined).length}/3 {t("modalitiesDone")}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-xs text-violet-300">
                  {t("startSession")}
                </div>
              )}
            </div>

            {/* Progress stepper */}
            {sessionId && (
              <ProgressStepper speech={speechScore} gaze={gazeScore} cognitive={cognitiveScore} />
            )}

            {/* Task cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TaskCard
                icon="🎙️"
                title={t("speechTitle")}
                desc={t("speechDesc")}
                btnLabel={t("startSpeech")}
                score={speechScore}
                scoreLabel="Speech"
                onClick={() => handleStartTaskClick("speech")}
              />
              <TaskCard
                icon="👁️"
                title={t("gazeTitle")}
                desc={t("gazeDesc")}
                btnLabel={t("startGaze")}
                score={gazeScore}
                scoreLabel="Gaze"
                onClick={() => handleStartTaskClick("gaze")}
              />
              <TaskCard
                icon="🧠"
                title={t("cognitiveTitle")}
                desc={t("cognitiveDesc")}
                btnLabel={t("startCognitive")}
                score={cognitiveScore}
                scoreLabel="Cognitive"
                onClick={() => handleStartTaskClick("cognitive")}
              />
            </div>

            {/* Fusion Report */}
            {sessionId && (
              <div className="animate-slide-up delay-200">
                <FusionReportPanel
                  sessionId={sessionId}
                  speechScore={speechScore}
                  gazeScore={gazeScore}
                  cognitiveScore={cognitiveScore}
                />
              </div>
            )}
          </>
        )}

        {activeView === "cognitive" && (
          <CognitiveGamesTask
            sessionId={sessionId || "mock-session-123"}
            age={demographics.age}
            education={demographics.education}
            onComplete={(score) => { setCognitiveScore(score); setActiveView("dashboard"); }}
          />
        )}

        {activeView === "speech" && (
          <AudioRecorderTask
            sessionId={sessionId || "mock-session-123"}
            onComplete={(score) => { setSpeechScore(score); setActiveView("dashboard"); }}
          />
        )}

        {activeView === "gaze" && (
          <GazeTrackerTask
            sessionId={sessionId || "mock-session-123"}
            onComplete={(score) => { setGazeScore(score); setActiveView("dashboard"); }}
          />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        <div className="flex w-full">
          {[
            { id: "tasks", icon: "🏠", label: t("dashboard") },
            { id: "report", icon: "📊", label: "Report" },
          ].map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => {
                setMobileTab(id as "tasks" | "report");
                if (id === "tasks") setActiveView("dashboard");
              }}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-0 transition-colors ${
                mobileTab === id ? "text-violet-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
