const CACHE_NAME = 'wakit-mpa-demo-v1';
const urlsToCache = [
  './',
  './index.html',
  './about.html',
  '../../wakit/assets/icons/icon-192.png',
  '../../wakit/assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
