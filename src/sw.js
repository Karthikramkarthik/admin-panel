const CACHE_NAME = 'stock-manager-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/assets/logo.jpg'
];

// Install Event - cache static app shell assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static app shell assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - dynamic caching strategies
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Bypass service worker for Vite HMR dev server assets
  if (
    requestUrl.hostname === 'localhost' ||
    requestUrl.hostname === '127.0.0.1' ||
    requestUrl.pathname.includes('/@vite/') ||
    requestUrl.pathname.startsWith('/@') ||
    requestUrl.pathname.includes('__vite_ping') ||
    requestUrl.searchParams.has('t')
  ) {
    return; // Let the browser fetch directly from network
  }

  // API Requests: Network-first strategy (always fetch fresh data, cache as backup)
  if (requestUrl.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache the successful GET response
          if (response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to return from cache
          return caches.match(event.request);
        })
    );
  } else {
    // Static Assets: Cache-first falling back to network strategy
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then(response => {
            // Cache newly fetched static resources
            if (response.status === 200 && event.request.method === 'GET') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          });
        })
    );
  }
});
