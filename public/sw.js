self.addEventListener('install', (e) => {
  console.log('[SW] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  console.log('[SW] Activate');
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Basic fetch handler to satisfy PWA requirements
  e.respondWith(fetch(e.request));
});
