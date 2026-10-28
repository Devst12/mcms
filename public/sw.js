const CACHE_NAME = "dudh-hisab-v2";
const APP_SHELL = ["/entry", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      const page = await cache.match("/entry");
      if (page) {
        const html = await page.clone().text();
        const assets = [...html.matchAll(/(?:src|href)="([^\"]*\/_next\/static\/[^\"]+)"/g)]
          .map((match) => match[1]);
        await Promise.all(assets.map(async (asset) => {
          try { await cache.add(asset); } catch {}
        }));
      }
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith("dudh-hisab-") && key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) || (await cache.match("/entry")) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || ["/manifest.json", "/icon.svg"].includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
