/* WAKIT service worker.
 * Served from the site ROOT (copied to dist/service-worker.js by webpack) so its
 * scope is "/" — it can cache the app shell (/app/*), the engine (/wakit/*) and the
 * web pages (/, /board/, ...) alike.
 *
 * Strategy:
 *  - navigations  → network-first, fall back to cache (offline app launch after first online visit)
 *  - GET assets   → stale-while-revalidate (wakit.js/css, views, app-shared.css, icons cache on use)
 * Bump CACHE to invalidate everything on the next activate.
 */
const CACHE = 'wakit-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // same-origin only

  // Page navigations: try network, fall back to cached page (offline).
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch (_) {
        const cached = await caches.match(req);
        return cached || (await caches.match('./')) || Response.error();
      }
    })());
    return;
  }

  // Assets: serve cache immediately, refresh in the background.
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          caches.open(CACHE).then((c) => c.put(req, res.clone()));
        }
        return res;
      })
      .catch(() => cached);
    return cached || network;
  })());
});
