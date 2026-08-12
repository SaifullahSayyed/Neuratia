/**
 * API client — base URL always comes from the VITE_API_URL env var.
 * In dev: http://localhost:8000
 * In prod: https://your-render-service.onrender.com
 *
 * NEVER hardcode a URL here — this was the #1 deployment bug in the previous CogniDetect version.
 */

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error(
    "[CogniDetect] VITE_API_URL is not set. " +
    "Copy .env.example to .env and fill in the values."
  );
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(8000), // 8s — accounts for Render cold-start
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
