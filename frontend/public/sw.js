// Cache version — bump this on every deploy to invalidate stale shell
const CACHE_NAME = "neuratia-v3";

// Only precache true static assets (NOT index.html — that must always be fresh)
const PRECACHE_URLS = [
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
];

// Install: precache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
//   - Navigation (HTML page requests) → NETWORK FIRST — never serve stale index.html
//   - Hashed JS/CSS assets (/assets/*) → CACHE FIRST (safe: hash changes when content changes)
//   - API calls → NETWORK FIRST with offline fallback
//   - Icons/manifest → CACHE FIRST
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // ── 1. API & Supabase → network only (no caching) ──────────────
  if (
    url.pathname.startsWith("/api/") ||
    url.hostname.includes("onrender.com") ||
    url.hostname.includes("supabase.co")
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: "offline" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        })
      )
    );
    return;
  }

  // ── 2. HTML navigation → ALWAYS network first ───────────────────
  // This prevents serving stale index.html after a new deployment
  if (
    event.request.mode === "navigate" ||
    event.request.headers.get("accept")?.includes("text/html")
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match("/index.html").then(
          (cached) =>
            cached ||
            new Response("Offline — please reconnect to load the app.", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
        )
      )
    );
    return;
  }

  // ── 3. Hashed assets (/assets/index-XXXX.js) → cache first ─────
  // Safe because filenames change with content (Vite content hash)
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── 4. Icons / manifest → cache first ──────────────────────────
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
