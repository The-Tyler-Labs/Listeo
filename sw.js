// MyCinebox service worker — version 2026-06-29-v1.7.12-trailers-series
const CACHE_NAME = 'mycinebox-cache-2026-06-29-v1-7-12-trailers-series';
const APP_SHELL = [
  '/MyCinebox/',
  '/MyCinebox/index.html',
  '/MyCinebox/manifest.json',
  '/MyCinebox/icon-192.png',
  '/MyCinebox/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(APP_SHELL.map(url => cache.add(url)))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE_NAME)
        .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // TMDB ne doit pas passer par le cache du service worker :
  // la requête reste directement contrôlée par l'écran de recherche.
  if (url.hostname === 'api.themoviedb.org') return;

  // Fichiers de l'application : réseau d'abord, cache en secours.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then(cached => cached || caches.match('/MyCinebox/')))
    );
    return;
  }

  // Ressources externes : on ne bloque jamais l'application si elles échouent.
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
