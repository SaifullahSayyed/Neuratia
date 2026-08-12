import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export const LoginPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"patient" | "doctor">("patient");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });
        if (error) throw error;
        if (data.user) {
          alert("Account created successfully! You may now sign in.");
          setIsSignUp(false);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#080c14] text-slate-200">
      {/* Glow background */}
      <div
        className="pointer-events-none absolute h-[380px] w-[380px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)" }}
      />

      <div className="relative w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Neuratia<span className="text-violet-400">Detect</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isSignUp ? "Create a screening account" : "Sign in to access your screening portal"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-white/10 mb-6 text-sm font-medium">
          <button
            type="button"
            className={`flex-1 pb-2 text-center border-b-2 transition-all ${
              !isSignUp ? "border-violet-400 text-white font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setIsSignUp(false)}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-center border-b-2 transition-all ${
              isSignUp ? "border-violet-400 text-white font-semibold" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setIsSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 text-sm">
          {isSignUp && (
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-lg bg-slate-800/60 border border-white/10 px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full rounded-lg bg-slate-800/60 border border-white/10 px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg bg-slate-800/60 border border-white/10 px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {isSignUp && (
            <div>
              <label className="block text-slate-300 text-xs font-medium mb-1">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole("patient")}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    role === "patient"
                      ? "border-violet-500 bg-violet-500/20 text-white"
                      : "border-white/10 bg-slate-800/40 text-slate-400"
                  }`}
                >
                  Patient / Individual
                </button>
                <button
                  type="button"
                  onClick={() => setRole("doctor")}
                  className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                    role === "doctor"
                      ? "border-violet-500 bg-violet-500/20 text-white"
                      : "border-white/10 bg-slate-800/40 text-slate-400"
                  }`}
                >
                  Doctor / Clinician
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium shadow-lg shadow-violet-600/30 transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <span className="relative bg-slate-900 px-3 text-xs text-slate-500">OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-2.5 rounded-lg border border-white/10 bg-slate-800/40 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.4 0 15.2s.7 5.5 1.9 7.9l3.7-2.9c-.6-1.7-1-3.5-1-5.4z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Mandatory Non-Diagnostic Disclaimer */}
        <div className="mt-6 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed">
          ⚠️ <strong>Screening Aid Only:</strong> Neuratia is a non-diagnostic research prototype.
          It does not provide medical diagnoses or replace clinical evaluations.
        </div>
      </div>
    </div>
  );
};
