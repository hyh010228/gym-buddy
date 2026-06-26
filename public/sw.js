const CACHE_NAME = 'gym-buddy-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// Install — precache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — Cache-First for static, Network-First for API
self.addEventListener('fetch', (e) => {
  // let Vite dev server (localhost) bypass SW
  const url = new URL(e.request.url);
  if (url.hostname === 'localhost') return;

  // Cache-First for static assets
  if (
    e.request.destination === 'script' ||
    e.request.destination === 'style' ||
    e.request.destination === 'font' ||
    e.request.destination === 'image' ||
    e.request.destination === 'manifest'
  ) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request))
    );
    return;
  }
  // else: regular fetch
});

// SW update notification
self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});