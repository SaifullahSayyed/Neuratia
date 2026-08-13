import { useCallback, useEffect, useRef, useState } from "react";
import { checkHealth } from "../lib/api";

type Status = "checking" | "online" | "waking" | "offline";

const MAX_WAIT_S = 90;        // Give Render free tier up to 90s to wake
const POLL_INTERVAL_MS = 6000; // Re-check every 6 seconds
const WAKE_TIMEOUT_MS = 55000; // Single request timeout while waking

export function HealthDot() {
  const [status, setStatus] = useState<Status>("checking");
  const [elapsed, setElapsed] = useState(0);
  const cancelledRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPoll = useCallback(async () => {
    cancelledRef.current = false;
    setStatus("checking");
    setElapsed(0);

    // --- First quick check (10s timeout) ---
    const ok = await checkHealth(10000);
    if (cancelledRef.current) return;

    if (ok) {
      setStatus("online");
      return;
    }

    // --- Server is sleeping — enter waking mode ---
    setStatus("waking");
    let secondsElapsed = 0;

    // Kick off a long-lived wake request (Render needs a real HTTP call to spin up)
    fetch(`${import.meta.env.VITE_API_URL || "https://neuratia-backend.onrender.com"}/api/health`, {
      signal: AbortSignal.timeout(WAKE_TIMEOUT_MS),
    }).catch(() => {});  // Fire-and-forget, just to wake the dyno

    // Countdown timer
    timerRef.current = setInterval(() => {
      secondsElapsed += 1;
      setElapsed(secondsElapsed);
    }, 1000);

    // Poll loop
    while (secondsElapsed < MAX_WAIT_S) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      if (cancelledRef.current) break;

      const retryOk = await checkHealth(8000);
      if (cancelledRef.current) break;

      if (retryOk) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStatus("online");
        setElapsed(0);
        return;
      }
    }

    if (timerRef.current) clearInterval(timerRef.current);
    if (!cancelledRef.current) setStatus("offline");
  }, []);

  useEffect(() => {
    startPoll();
    return () => {
      cancelledRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startPoll]);

  // Keep-alive: re-ping every 13 minutes so Render never sleeps during a session
  useEffect(() => {
    const keepAlive = setInterval(() => {
      if (status === "online") {
        checkHealth(5000).then((ok) => {
          if (!ok) setStatus("waking");
        });
      }
    }, 13 * 60 * 1000);
    return () => clearInterval(keepAlive);
  }, [status]);

  // ── Render ────────────────────────────────────────────────────
  if (status === "online") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
        <span className="text-emerald-400 text-xs font-medium hidden sm:inline">API Online</span>
      </div>
    );
  }

  if (status === "checking") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-slate-400 text-xs hidden sm:inline">Connecting…</span>
      </div>
    );
  }

  if (status === "waking") {
    const pct = Math.min(100, Math.round((elapsed / MAX_WAIT_S) * 100));
    return (
      <div className="flex items-center gap-2">
        {/* Spinning dot */}
        <span className="relative inline-block h-2.5 w-2.5 flex-shrink-0">
          <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-60" />
          <span className="relative inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
        </span>
        {/* Progress pill */}
        <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-3 py-1">
          {/* Mini progress bar */}
          <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-1000"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-amber-300 text-[11px] font-medium whitespace-nowrap">
            Waking server… {elapsed}s
          </span>
        </div>
        {/* Mobile: just the seconds */}
        <span className="sm:hidden text-amber-300 text-xs">{elapsed}s</span>
      </div>
    );
  }

  // Offline state — show retry button
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 flex-shrink-0" />
      <span className="text-rose-400 text-xs hidden sm:inline">Server offline</span>
      <button
        onClick={startPoll}
        className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] hover:bg-rose-500/25 transition-colors min-h-0 whitespace-nowrap"
      >
        Retry ↻
      </button>
    </div>
  );
}
