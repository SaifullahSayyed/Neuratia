import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { PatientDashboard } from "./pages/patient/PatientDashboard";
import { DoctorDashboard } from "./pages/doctor/DoctorDashboard";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { HealthDot } from "./components/HealthDot";

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RoleRedirect: React.FC = () => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 text-sm">
        Loading Neuratia portal...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-200">
        <header className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold tracking-tight text-white font-['Space_Grotesk']">
              Neuratia<span className="text-violet-400">Detect</span>
            </span>
            <span className="rounded-full bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 text-[10px] font-medium text-violet-300 uppercase tracking-widest">
              Research Prototype
            </span>
          </div>
          <HealthDot />
        </header>

        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-8">
          <div
            className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
          />

          <div className="relative flex flex-col items-center gap-5 max-w-xl">
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight font-['Space_Grotesk']">
              Early cognitive screening,{" "}
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)" }}
              >
                powered by AI
              </span>
            </h1>

            <p className="text-slate-400 text-lg leading-relaxed">
              Neuratia combines spontaneous speech analysis, client-side gaze tracking, and cognitive mini-games into a risk-flag report for clinicians.
            </p>

            <div className="w-full rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 text-left">
              <p className="text-amber-300 text-sm font-medium">
                ⚠️ Screening aid only — not a medical diagnosis
              </p>
              <p className="text-amber-200/60 text-xs mt-1 leading-relaxed">
                Research prototype. All scores are informational indicators only.
              </p>
            </div>

            <a
              href="/login"
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-lg shadow-violet-600/30 transition-all text-sm mt-2"
            >
              Sign In to Screening Portal
            </a>
          </div>
        </main>
      </div>
    );
  }

  if (role === "doctor") return <Navigate to="/doctor" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <Navigate to="/patient" replace />;
};

export default function App() {
  return (
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
  );
}
