import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LangProvider, useLang } from "./contexts/LangContext";
import { LoginPage } from "./pages/LoginPage";
import { PatientDashboard } from "./pages/patient/PatientDashboard";
import { DoctorDashboard } from "./pages/doctor/DoctorDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { HealthDot } from "./components/HealthDot";

// ── Language picker pill ──────────────────────────────────────
const LangPicker: React.FC = () => {
  const { lang, setLang, t } = useLang();
  return (
    <div className="flex items-center rounded-lg overflow-hidden border border-white/10 text-[11px] font-medium flex-shrink-0">
      {(["en", "hi", "ur"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2 py-1 min-h-0 transition-colors ${
            lang === l ? "bg-violet-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"
          }`}
        >
          {t(l === "en" ? "langEn" : l === "hi" ? "langHi" : "langUr")}
        </button>
      ))}
    </div>
  );
};

// ── Protected Route ───────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, loading } = useAuth();
  const { t } = useLang();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 text-sm">
        {t("authenticating")}
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

// ── Landing / Role redirect ───────────────────────────────────
const RoleRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();
  const { t } = useLang();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-slate-400 text-sm">{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (role === "doctor") return <Navigate to="/doctor" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/patient" replace />;

  // ── Unauthenticated landing ───────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-200">
      {/* Header */}
      <header className="flex items-center justify-between px-5 md:px-8 py-4 border-b border-white/5 sticky top-0 z-40 bg-[#080c14]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tracking-tight text-white font-['Space_Grotesk']">
            Neuratia<span className="text-violet-400">Detect</span>
          </span>
          <span className="hidden sm:inline rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-300 uppercase tracking-widest">
            Research Prototype
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LangPicker />
          <HealthDot />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-5 text-center gap-10 py-12 relative overflow-hidden">
        {/* Animated background glow */}
        <div
          className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full animate-pulse-glow"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
        />

        {/* Floating brain icon */}
        <div className="animate-float relative z-10">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{
              background: "radial-gradient(circle at 40% 35%, rgba(124,58,237,0.3), rgba(8,12,20,0.8))",
              boxShadow: "0 0 60px rgba(124,58,237,0.25), inset 0 0 30px rgba(124,58,237,0.1)",
              border: "1px solid rgba(124,58,237,0.4)",
            }}
          >
            🧠
          </div>
        </div>

        {/* Hero text */}
        <div className="relative flex flex-col items-center gap-5 max-w-2xl animate-slide-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight font-['Space_Grotesk']">
            {t("heroTitle")}{" "}
            <span className="shimmer-text">{t("heroTitleHighlight")}</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
            {t("heroSubtitle")}
          </p>

          {/* Warning card */}
          <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-left">
            <p className="text-amber-300 text-sm font-medium">{t("warningTitle")}</p>
            <p className="text-amber-200/60 text-xs mt-1 leading-relaxed">{t("warningBody")}</p>
          </div>

          {/* CTA */}
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold shadow-lg shadow-violet-600/40 transition-all text-sm mt-1 hover:scale-105 active:scale-95"
            style={{ transition: "all 0.2s" }}
          >
            {t("signIn")} →
          </a>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 flex flex-wrap justify-center gap-4 animate-slide-up delay-300">
          {[
            { value: t("stat1Value"), label: t("stat1Label") },
            { value: t("stat2Value"), label: t("stat2Label") },
            { value: t("stat3Value"), label: t("stat3Label") },
            { value: t("stat4Value"), label: t("stat4Label") },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center px-5 py-3 rounded-xl border border-white/8 bg-slate-900/50 min-w-[80px]"
            >
              <span className="text-xl font-extrabold text-white font-['Space_Grotesk']">{value}</span>
              <span className="text-[11px] text-slate-400 mt-0.5">{label}</span>
            </div>
          ))}
        </div>

        {/* Research strip */}
        <div className="relative z-10 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] text-slate-600 animate-slide-up delay-500 max-w-2xl">
          {[
            "Luz et al. 2021 — ADReSSo",
            "Fraser et al. 2016 — Speech features",
            "Holmqvist et al. 2011 — Oculomotor markers",
            "India DPDP Act 2023 compliant",
          ].map((cite) => (
            <span key={cite} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-violet-500/50 inline-block flex-shrink-0" />
              {cite}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
};

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/patient/*"
              element={
                <ProtectedRoute allowedRoles={["patient"]}>
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/*"
              element={
                <ProtectedRoute allowedRoles={["doctor"]}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
