const CACHE_NAME = "eventos-pwa-v2";
const DYNAMIC_CACHE = "eventos-dynamic-v2";

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

// Fetch Event - Network First with Cache Fallback for API data & Stale-While-Revalidate for Assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.protocol.startsWith("chrome-extension")) return;

  // 1. API Calls Strategy (Network First -> Fallback to Cache)
  if (url.pathname.includes("/api/") || url.pathname.includes("/auth/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log("[PWA ServiceWorker] Network failed, serving API data from cache:", request.url);
          return caches.match(request);
        })
    );
    return;
  }

  // 2. Static Assets & HTML Pages Strategy (Cache First -> Network Fallback)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh version in background (Stale-While-Revalidate)
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Fallback to root html for page navigations when offline
          if (request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/dashboard") || caches.match("/");
          }
        });
    })
  );
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
