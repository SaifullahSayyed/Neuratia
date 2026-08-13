import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { HealthDot } from "../../components/HealthDot";
import { useLang } from "../../contexts/LangContext";

// ── Demo patient data ─────────────────────────────────────────
interface Session {
  date: string;
  speech: number;
  gaze: number;
  cognitive: number;
  composite: number;
  band: "low" | "moderate" | "high";
}

interface Patient {
  id: string;
  name: string;
  age: number;
  sessions: Session[];
  avatar: string;
}

const DEMO_PATIENTS: Patient[] = [
  {
    id: "p1",
    name: "Ananya Sharma",
    age: 68,
    avatar: "AS",
    sessions: [
      { date: "22 Jul", speech: 0.72, gaze: 0.65, cognitive: 0.78, composite: 0.71, band: "low" },
      { date: "29 Jul", speech: 0.68, gaze: 0.60, cognitive: 0.74, composite: 0.67, band: "low" },
      { date: "05 Aug", speech: 0.61, gaze: 0.55, cognitive: 0.68, composite: 0.61, band: "moderate" },
      { date: "08 Aug", speech: 0.58, gaze: 0.52, cognitive: 0.65, composite: 0.58, band: "moderate" },
      { date: "11 Aug", speech: 0.55, gaze: 0.48, cognitive: 0.60, composite: 0.54, band: "moderate" },
      { date: "13 Aug", speech: 0.51, gaze: 0.44, cognitive: 0.56, composite: 0.50, band: "moderate" },
    ],
  },
  {
    id: "p2",
    name: "Rajesh Patel",
    age: 72,
    avatar: "RP",
    sessions: [
      { date: "01 Aug", speech: 0.45, gaze: 0.38, cognitive: 0.50, composite: 0.44, band: "moderate" },
      { date: "04 Aug", speech: 0.42, gaze: 0.35, cognitive: 0.47, composite: 0.41, band: "moderate" },
      { date: "07 Aug", speech: 0.38, gaze: 0.31, cognitive: 0.42, composite: 0.37, band: "high" },
      { date: "10 Aug", speech: 0.35, gaze: 0.29, cognitive: 0.39, composite: 0.34, band: "high" },
      { date: "12 Aug", speech: 0.33, gaze: 0.27, cognitive: 0.37, composite: 0.32, band: "high" },
      { date: "13 Aug", speech: 0.31, gaze: 0.25, cognitive: 0.35, composite: 0.30, band: "high" },
    ],
  },
  {
    id: "p3",
    name: "Priya Mehta",
    age: 65,
    avatar: "PM",
    sessions: [
      { date: "05 Aug", speech: 0.82, gaze: 0.79, cognitive: 0.85, composite: 0.82, band: "low" },
      { date: "08 Aug", speech: 0.84, gaze: 0.80, cognitive: 0.87, composite: 0.83, band: "low" },
      { date: "11 Aug", speech: 0.83, gaze: 0.81, cognitive: 0.86, composite: 0.83, band: "low" },
      { date: "13 Aug", speech: 0.85, gaze: 0.82, cognitive: 0.88, composite: 0.85, band: "low" },
    ],
  },
  {
    id: "p4",
    name: "Mohammed Ansari",
    age: 70,
    avatar: "MA",
    sessions: [
      { date: "10 Aug", speech: 0.62, gaze: 0.58, cognitive: 0.65, composite: 0.62, band: "moderate" },
      { date: "12 Aug", speech: 0.59, gaze: 0.55, cognitive: 0.63, composite: 0.59, band: "moderate" },
      { date: "13 Aug", speech: 0.57, gaze: 0.53, cognitive: 0.61, composite: 0.57, band: "moderate" },
    ],
  },
];

const BAND_COLOR: Record<string, string> = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#f43f5e",
};

const BAND_BG: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  moderate: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

// ── SVG Line Chart ────────────────────────────────────────────
const LineChart: React.FC<{ sessions: Session[] }> = ({ sessions }) => {
  const W = 320; const H = 120; const PAD = 20;
  const chartW = W - PAD * 2; const chartH = H - PAD * 2;

  const points = (key: keyof Session) =>
    sessions.map((s, i) => {
      const x = PAD + (i / (sessions.length - 1)) * chartW;
      const y = PAD + (1 - (s[key] as number)) * chartH;
      return `${x},${y}`;
    }).join(" ");

  const area = (key: keyof Session) => {
    const pts = sessions.map((s, i) => [
      PAD + (i / (sessions.length - 1)) * chartW,
      PAD + (1 - (s[key] as number)) * chartH,
    ]);
    const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
    return `${d} L ${pts[pts.length-1][0]} ${H - PAD} L ${PAD} ${H - PAD} Z`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28" aria-label="Risk score trend chart">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(v => (
        <line key={v}
          x1={PAD} y1={PAD + (1 - v) * chartH}
          x2={W - PAD} y2={PAD + (1 - v) * chartH}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1"
        />
      ))}

      {/* Area fill — composite */}
      <path d={area("composite")} fill="rgba(124,58,237,0.10)" />

      {/* Lines */}
      <polyline points={points("speech")} fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points={points("gaze")} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points={points("cognitive")} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points={points("composite")} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots on composite */}
      {sessions.map((s, i) => {
        const x = PAD + (i / Math.max(1, sessions.length - 1)) * chartW;
        const y = PAD + (1 - s.composite) * chartH;
        return <circle key={i} cx={x} cy={y} r="3" fill={BAND_COLOR[s.band]} stroke="#080c14" strokeWidth="1.5" />;
      })}

      {/* X labels */}
      {sessions.map((s, i) => {
        const x = PAD + (i / Math.max(1, sessions.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={H - 3} textAnchor="middle" fontSize="7" fill="rgba(148,163,184,0.6)">{s.date}</text>
        );
      })}

      {/* Legend */}
      {[
        { color: "#a78bfa", label: "Composite" },
        { color: "#60a5fa", label: "Speech" },
        { color: "#34d399", label: "Gaze" },
        { color: "#f59e0b", label: "Cognitive" },
      ].map(({ color, label }, i) => (
        <g key={label} transform={`translate(${PAD + i * 74}, 7)`}>
          <line x1="0" y1="4" x2="10" y2="4" stroke={color} strokeWidth="2" />
          <text x="13" y="7" fontSize="7" fill="rgba(148,163,184,0.8)">{label}</text>
        </g>
      ))}
    </svg>
  );
};

// ── SVG Bar Chart (per modality, last session) ────────────────
const BarChart: React.FC<{ session: Session }> = ({ session }) => {
  const bars = [
    { label: "Speech", value: session.speech, color: "#60a5fa" },
    { label: "Gaze", value: session.gaze, color: "#34d399" },
    { label: "Cognitive", value: session.cognitive, color: "#f59e0b" },
    { label: "Composite", value: session.composite, color: "#a78bfa" },
  ];
  const W = 320; const H = 100; const PAD_X = 52; const PAD_Y = 14;
  const chartW = W - PAD_X - 10; const chartH = H - PAD_Y - 20;
  const barW = chartW / bars.length;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-24" aria-label="Modality breakdown bar chart">
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1.0].map(v => (
        <g key={v}>
          <line x1={PAD_X} y1={PAD_Y + (1 - v) * chartH} x2={W - 10} y2={PAD_Y + (1 - v) * chartH}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <text x={PAD_X - 4} y={PAD_Y + (1 - v) * chartH + 3} textAnchor="end" fontSize="7"
            fill="rgba(148,163,184,0.5)">{Math.round(v * 100)}%</text>
        </g>
      ))}

      {bars.map(({ label, value, color }, i) => {
        const barH = value * chartH;
        const x = PAD_X + i * barW + barW * 0.2;
        const bw = barW * 0.6;
        const y = PAD_Y + chartH - barH;
        return (
          <g key={label}>
            <rect x={x} y={y} width={bw} height={barH}
              fill={color} opacity="0.25" rx="3" />
            <rect x={x} y={y} width={bw} height={4}
              fill={color} rx="2" />
            <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize="7.5" fill="rgba(148,163,184,0.7)">{label}</text>
            <text x={x + bw / 2} y={y - 3} textAnchor="middle" fontSize="7.5" fill={color} fontWeight="600">
              {Math.round(value * 100)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────
export const DoctorDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { t, lang, setLang } = useLang();
  const [selectedPatient, setSelectedPatient] = useState<Patient>(DEMO_PATIENTS[0]);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  const latestSession = selectedPatient.sessions[selectedPatient.sessions.length - 1];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col mobile-pb">
      {/* Header */}
      <header className="px-4 md:px-6 py-3 border-b border-white/10 flex items-center justify-between bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <span className="text-lg md:text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Neuratia<span className="text-violet-400">Detect</span>
          </span>
          <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {t("clinicianPortal")}
          </span>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Language picker */}
          <div className="flex items-center rounded-lg overflow-hidden border border-white/10 text-[11px] font-medium">
            {(["en", "hi", "ur"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-2 py-1 min-h-0 transition-colors ${lang === l ? "bg-violet-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"}`}>
                {t(l === "en" ? "langEn" : l === "hi" ? "langHi" : "langUr")}
              </button>
            ))}
          </div>
          <HealthDot />
          <button onClick={signOut}
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-800/60 text-xs hover:bg-slate-700 text-slate-300 transition-all">
            {t("signOut")}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row gap-0">
        {/* ── Patient sidebar ── */}
        <aside className="md:w-72 lg:w-80 border-r border-white/8 bg-slate-950/40 flex flex-col">
          {/* Doctor greeting */}
          <div className="p-4 border-b border-white/8">
            <p className="text-[11px] text-slate-500 uppercase font-semibold tracking-wider mb-1">Clinician</p>
            <h2 className="text-base font-bold text-white font-['Space_Grotesk']">
              Dr. {profile?.full_name || user?.email?.split("@")[0] || "Doctor"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{t("linkedPatients")}</p>
          </div>

          {/* Patient list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {DEMO_PATIENTS.map((p) => {
              const last = p.sessions[p.sessions.length - 1];
              const isActive = selectedPatient.id === p.id;
              return (
                <button key={p.id} onClick={() => { setSelectedPatient(p); setExpandedSession(null); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all min-h-0 flex items-center gap-3 ${
                    isActive
                      ? "bg-violet-600/20 border-violet-500/50"
                      : "bg-slate-900/40 border-white/6 hover:border-white/15"
                  }`}>
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    last.band === "low" ? "bg-emerald-500/20 text-emerald-300"
                    : last.band === "moderate" ? "bg-amber-500/20 text-amber-300"
                    : "bg-rose-500/20 text-rose-300"
                  }`}>
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-white truncate">{p.name}</span>
                      <span className={`flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full border font-semibold uppercase ${BAND_BG[last.band]}`}>
                        {last.band}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500">{t("patientAge")} {p.age}</span>
                      <span className="text-[11px] text-slate-600">·</span>
                      <span className="text-[11px] text-slate-500">{p.sessions.length} {t("sessions")}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">{t("lastSession")}: {last.date}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── Patient detail panel ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 animate-fade-in">
          {/* Patient header */}
          <div className="glass-card p-5 flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
              latestSession.band === "low" ? "bg-emerald-500/20 text-emerald-300"
              : latestSession.band === "moderate" ? "bg-amber-500/20 text-amber-300"
              : "bg-rose-500/20 text-rose-300"
            }`}>
              {selectedPatient.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">{selectedPatient.name}</h2>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-slate-400">{t("patientAge")} {selectedPatient.age}</span>
                <span className="text-slate-600">·</span>
                <span className="text-sm text-slate-400">{selectedPatient.sessions.length} {t("sessions")}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wide ${BAND_BG[latestSession.band]}`}>
                  {latestSession.band} risk
                </span>
              </div>
            </div>
            {/* Composite score badge */}
            <div className="text-right hidden sm:block">
              <div className="text-3xl font-extrabold text-white">{Math.round(latestSession.composite * 100)}%</div>
              <div className="text-[11px] text-slate-400">Composite</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Line chart */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 inline-block"></span>
                {t("riskTrend")}
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">Last {selectedPatient.sessions.length} sessions</p>
              <LineChart sessions={selectedPatient.sessions} />
            </div>

            {/* Bar chart */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                {t("modalityBreakdown")}
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">Latest session — {latestSession.date}</p>
              <BarChart session={latestSession} />
            </div>
          </div>

          {/* Sparkline summary cards */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Speech", value: latestSession.speech, color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/20", icon: "🎙️" },
              { label: "Gaze", value: latestSession.gaze, color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "👁️" },
              { label: "Cognitive", value: latestSession.cognitive, color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20", icon: "🧠" },
            ].map(({ label, value, color, bg, icon }) => (
              <div key={label} className={`rounded-xl border p-3 ${bg}`}>
                <div className="text-base mb-1">{icon}</div>
                <div className={`text-xl font-extrabold ${color}`}>{Math.round(value * 100)}%</div>
                <div className="text-[11px] text-slate-400">{label}</div>
              </div>
            ))}
          </div>

          {/* Session history table */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white mb-3">{t("sessionHistory")}</h3>
            <div className="space-y-2">
              {[...selectedPatient.sessions].reverse().map((s, i) => {
                const idx = selectedPatient.sessions.length - 1 - i;
                const isExpanded = expandedSession === idx;
                return (
                  <div key={idx} className="rounded-xl border border-white/6 overflow-hidden">
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : idx)}
                      className="w-full flex items-center justify-between px-4 py-3 min-h-0 bg-slate-900/30 hover:bg-slate-800/40 transition-colors text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">{s.date}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase font-semibold ${BAND_BG[s.band]}`}>
                          {s.band}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="hidden sm:inline">
                          🎙 {Math.round(s.speech * 100)}% · 👁 {Math.round(s.gaze * 100)}% · 🧠 {Math.round(s.cognitive * 100)}%
                        </span>
                        <span className="font-bold text-white">{Math.round(s.composite * 100)}%</span>
                        <span className={`text-slate-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▾</span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-3 bg-slate-900/50 border-t border-white/5 animate-slide-up">
                        <div className="grid grid-cols-4 gap-3 mb-3">
                          {[
                            { label: "Speech", value: s.speech, color: "#60a5fa" },
                            { label: "Gaze", value: s.gaze, color: "#34d399" },
                            { label: "Cognitive", value: s.cognitive, color: "#f59e0b" },
                            { label: "Composite", value: s.composite, color: "#a78bfa" },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="text-center">
                              <div className="text-base font-bold" style={{ color }}>{Math.round(value * 100)}%</div>
                              <div className="text-[10px] text-slate-500">{label}</div>
                              <div className="h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full rounded-full animate-bar-grow" style={{ width: `${value * 100}%`, background: color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 p-2 rounded-lg bg-slate-800/60 text-[11px] text-slate-400">
                            ℹ Demo session — RAG report would appear here when backend is connected.
                          </div>
                          <button className="px-3 py-1.5 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs hover:bg-violet-600/50 transition-colors min-h-0">
                            {t("viewReport")}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-[10px] text-slate-600 text-center pb-2">
            ⚠ All data shown is for demonstration. Neuratia is a research prototype — not a clinical diagnostic tool. Scores require neurologist interpretation.
          </p>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        <div className="flex w-full">
          {[
            { icon: "🏥", label: "Patients" },
            { icon: "📊", label: "Charts" },
            { icon: "📋", label: "Reports" },
            { icon: "⚙️", label: "Settings" },
          ].map(({ icon, label }) => (
            <button key={label} className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-0 text-slate-500 hover:text-violet-300 transition-colors">
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
