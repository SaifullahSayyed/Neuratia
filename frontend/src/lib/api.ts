
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
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
