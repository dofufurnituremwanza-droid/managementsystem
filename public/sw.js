// DOFU MANAGEMENT SYSTEM - Service Worker for PWA & Offline Support
const CACHE_NAME = 'dofu-pwa-v1';

const STATIC_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.svg',
  '/robots.txt'
];

// Installation: pre-cache application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL).catch((err) => {
        console.warn('PWA shell pre-cache note:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activation: clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate for app assets, bypass non-GET and cloud data
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Do not intercept Firebase or external API endpoints
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('firebase') ||
    url.origin.includes('identitytoolkit')
  ) {
    return;
  }

  // Same-origin navigation & asset requests
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const resClone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(req, resClone);
              });
            }
            return networkRes;
          })
          .catch(() => {
            // Offline fallback for navigation requests
            if (req.mode === 'navigate') {
              return caches.match('/index.html') || cached;
            }
            return cached;
          });

        return cached || fetchPromise;
      })
    );
  }
});
