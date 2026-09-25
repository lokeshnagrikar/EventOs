const CACHE_NAME = "eventos-pwa-v3";
const DYNAMIC_CACHE = "eventos-dynamic-v3";

const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/events",
  "/bookings",
  "/manifest.json"
];

// Install Event - Pre-cache critical App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log("[PWA ServiceWorker] Pre-caching static App Shell");
      for (const asset of STATIC_ASSETS) {
        try {
          const res = await fetch(asset, { cache: "no-cache" });
          if (res.ok) {
            await cache.put(asset, res);
          }
        } catch (e) {
          console.warn("[PWA ServiceWorker] Asset pre-cache skipped:", asset);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log("[PWA ServiceWorker] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests and same-origin requests
  if (request.method !== "GET") return;
  if (url.protocol.startsWith("chrome-extension")) return;
  if (url.origin !== self.location.origin) return;

  // 2. Never intercept backend API or auth calls - let browser handle directly
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // 3. Navigation requests (HTML pages) - Network first, fallback to cache, then offline response
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const appShell = (await caches.match("/dashboard")) || (await caches.match("/"));
        if (appShell) return appShell;
        return new Response(
          "<!DOCTYPE html><html><body style='font-family:sans-serif;text-align:center;padding:50px;background:#09090b;color:#fff;'><h2>You are offline</h2><p>EventOS will reconnect automatically once network is restored.</p></body></html>",
          {
            status: 503,
            headers: { "Content-Type": "text/html" },
          }
        );
      })
    );
    return;
  }

  // 4. Same-origin Static Assets & Media (Stale-While-Revalidate)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/logo/") ||
    url.pathname.startsWith("/founder-profile/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|css|js)$/i);

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
            const responseToCache = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }
});

// Background Sync Event (Sync offline check-ins & mutations)
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-offline-checkins") {
    console.log("[PWA ServiceWorker] Triggering background sync for offline check-ins...");
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_OFFLINE_SYNC" });
        });
      })
    );
  }
});
