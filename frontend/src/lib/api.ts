const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://neuratia-backend.onrender.com";

export { API_URL };

export async function checkHealth(timeoutMs = 10000): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
