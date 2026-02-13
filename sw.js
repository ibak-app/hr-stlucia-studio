// Service Worker — Talent by St. Lucia Studio
var CACHE_NAME = 'talent-sl-v1';
var OFFLINE_URL = '/index.html';

var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/signup.html',
  '/login.html',
  '/dashboard.html',
  '/profile.html',
  '/success.html',
  '/privacy.html',
  '/terms.html',
  '/assets/css/style.css',
  '/assets/js/app.js',
  '/assets/js/supabase.js',
  '/assets/js/auth.js',
  '/assets/icons/favicon.svg'
];

// Install: cache shell
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate: clear old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch: network first, cache fallback
self.addEventListener('fetch', function(event) {
  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Skip Supabase API calls
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful responses
      if (response.ok) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Serve from cache
      return caches.match(event.request).then(function(cached) {
        if (cached) return cached;

        // For navigation requests, serve the offline page
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }

        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
