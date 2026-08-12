import { useEffect, useState } from "react";
import { checkHealth } from "../lib/api";

type Status = "checking" | "online" | "waking" | "offline";

export function HealthDot() {
  const [status, setStatus] = useState<Status>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      // First attempt — show "checking"
      const ok = await checkHealth();
      if (cancelled) return;

      if (ok) {
        setStatus("online");
        return;
      }

      // First miss — Render may be cold-starting (can take up to 60s)
      setStatus("waking");
      setAttempt(1);

      // Retry every 5s for up to 75s (15 attempts)
      for (let i = 1; i <= 15; i++) {
        await new Promise((r) => setTimeout(r, 5000));
        if (cancelled) return;
        const retryOk = await checkHealth();
        if (cancelled) return;
        if (retryOk) {
          setStatus("online");
          setAttempt(0);
          return;
        }
        setAttempt(i + 1);
      }

      // Exhausted retries
      setStatus("offline");
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, []);

  const dotColor: Record<Status, string> = {
    checking: "bg-yellow-400 animate-pulse",
    waking: "bg-amber-400 animate-pulse",
    online: "bg-emerald-400",
    offline: "bg-red-500",
  };

  const label: Record<Status, string> = {
    checking: "Connecting to server…",
    waking: `Waking up server… (${attempt * 5}s elapsed, up to 60s on first load)`,
    online: "Server online",
    offline: "Server unreachable — check your connection or Render dashboard",
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${dotColor[status]}`} />
      <span className="text-slate-400">{label[status]}</span>
    </div>
  );
}
