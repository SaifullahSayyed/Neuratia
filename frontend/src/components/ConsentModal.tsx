import React, { useState } from "react";
import { useLang } from "../contexts/LangContext";

interface ConsentModalProps {
  onConsent: (age: number, education: string) => void;
  onCancel: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ onConsent, onCancel }) => {
  const { t } = useLang();
  const [agreed, setAgreed] = useState(false);
  const [age, setAge] = useState<number>(60);
  const [education, setEducation] = useState<string>("secondary");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreed) {
      onConsent(age, education);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 max-w-lg w-full rounded-2xl p-6 space-y-5 shadow-2xl text-slate-200">
        <div className="border-b border-white/10 pb-3">
          <h2 className="text-xl font-bold text-white font-['Space_Grotesk']">{t("consentTitle")}</h2>
          <p className="text-slate-400 text-xs mt-1">
            Required prior to beginning speech, gaze, or cognitive screening modules.
          </p>
        </div>

        {/* Non-Diagnostic Disclaimer Banner */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <span>⚠️</span> NON-DIAGNOSTIC RESEARCH PROTOTYPE
          </div>
          <p className="text-amber-200/70 text-[11px] leading-relaxed">
            Neuratia is an early cognitive-decline screening research tool. It does <strong>not</strong> provide medical diagnoses, treatment advice, or replace clinical evaluations by a physician.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Demographic inputs for normed scoring */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Age (Years)</label>
              <input
                type="number"
                min={18}
                max={120}
                required
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">Used for WAIS-IV normed scoring</span>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Education Level</label>
              <select
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                className="w-full bg-slate-800/80 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
              >
                <option value="primary">Primary / Schooling</option>
                <option value="secondary">Secondary / High School</option>
                <option value="undergraduate">Undergraduate / College</option>
                <option value="postgraduate">Postgraduate / Master's / PhD</option>
              </select>
              <span className="text-[10px] text-slate-500 mt-0.5 block">MoCA demographic baseline adjustment</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/40 border border-white/5 space-y-2 text-[11px] text-slate-300">
            <div className="font-semibold text-white">Data Collection Disclosures (DPDP Act 2023):</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-400">
              <li><strong>Audio:</strong> Short speech clip recorded for acoustic & pause feature extraction.</li>
              <li><strong>Gaze:</strong> Eye fixation coordinates & antisaccade metrics extracted <em>in-browser</em> (zero video sent to server).</li>
              <li><strong>Storage:</strong> Data linked to your account ID via Postgres Row Level Security.</li>
            </ul>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 rounded border-white/10 bg-slate-800 text-violet-600 focus:ring-0"
            />
            <span className="text-slate-300 text-xs leading-relaxed">
              I understand Neuratia is a screening aid only, and I consent to the temporary capture of my audio and numeric gaze metrics for cognitive feature processing.
            </span>
          </label>

          <div className="flex items-center gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-lg border border-white/10 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!agreed}
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium disabled:opacity-40 transition-all shadow-lg shadow-violet-600/30"
            >
              Begin Assessment Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
