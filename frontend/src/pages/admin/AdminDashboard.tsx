import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { HealthDot } from "../../components/HealthDot";

interface PendingLink {
  doctor_id: string;
  patient_id: string;
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const { user, profile, signOut, token } = useAuth();
  const [links, setLinks] = useState<PendingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchPendingLinks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/pending-links`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.pending_links || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPendingLinks();
    }
  }, [token]);

  const handleApprove = async (doctorId: string, patientId: string, approve: boolean) => {
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/approve-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctor_id: doctorId, patient_id: patientId, approve }),
      });
      if (res.ok) {
        setStatusMsg(`Link ${approve ? "approved" : "rejected"} successfully.`);
        fetchPendingLinks();
      } else {
        const err = await res.json();
        setStatusMsg(`Action failed: ${err.detail}`);
      }
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-200 flex flex-col">
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk']">
            Neuratia<span className="text-violet-400">Detect</span>
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Admin Console
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
            Administrator Console — {profile?.full_name || user?.email || "Admin"}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage system-wide permissions and approve doctor-patient relationships.
          </p>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs">
            {statusMsg}
          </div>
        )}

        <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Pending Doctor-Patient Links</h3>
            <button
              onClick={fetchPendingLinks}
              className="px-3 py-1 text-xs rounded border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-center text-slate-400 text-xs">Loading pending link requests...</div>
          ) : links.length === 0 ? (
            <div className="p-6 text-center text-slate-500 border border-dashed border-white/10 rounded-xl text-xs">
              No pending link approval requests found.
            </div>
          ) : (
            <div className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden">
              {links.map((link) => (
                <div key={`${link.doctor_id}-${link.patient_id}`} className="p-4 flex items-center justify-between text-xs bg-slate-800/30">
                  <div>
                    <div className="text-white font-medium">Doctor ID: {link.doctor_id}</div>
                    <div className="text-slate-400">Patient ID: {link.patient_id}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">Requested: {new Date(link.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(link.doctor_id, link.patient_id, true)}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleApprove(link.doctor_id, link.patient_id, false)}
                      className="px-3 py-1.5 rounded bg-rose-600/80 hover:bg-rose-500 text-white font-medium"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
