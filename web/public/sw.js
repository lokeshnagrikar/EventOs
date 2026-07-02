const CACHE_NAME = "eventos-cache-v1";
const ASSETS = [
  "/",
  "/manifest.json"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  
  // Skip caching API calls or web socket connections
  if (e.request.url.includes("/api/") || e.request.url.includes("webpack") || e.request.url.startsWith("chrome-extension")) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).catch((err) => {
        const acceptHeader = e.request.headers.get("accept");
        if (acceptHeader && acceptHeader.includes("text/html")) {
          return caches.match("/");
        }
        throw err;
      });
    })
  );
});
