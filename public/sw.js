const CACHE_NAME = 'graphlet-cache-v1';

// We intercept all requests and try to serve them from the cache first.
// If the request is not in the cache, we fetch it from the network and add it to the cache.
// Since Graphlet is an SPA, all sub-routes should fallback to index.html if not found in cache.

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Pre-cache core assets. We can't easily auto-glob here like workbox, 
            // but caching index.html and root paths ensures offline start.
            // Other assets will be cached dynamically as they are requested.
            return cache.addAll([
                '/',
                '/index.html',
                '/favicon.ico',
                '/favicon.png',
                '/manifest.webmanifest'
            ]);
        })
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Claim the clients immediately so the current page starts using the new SW right away
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Ignore browser extensions and non-http requests
    if (!event.request.url.startsWith('http')) return;

    // For API requests (if any), network first, then cache
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, resClone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // Determine if it's a navigation request (like refreshing the page)
    const isNavigate = event.request.mode === 'navigate' ||
        (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'));

    if (isNavigate) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    const resClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, resClone);
                    });
                    return response;
                })
                .catch(() => {
                    // If network fails (offline), return the cached root page
                    return caches.match('/') || caches.match('/index.html');
                })
        );
        return;
    }

    // For all other static assets (js, css, images) -> Cache First, Network Fallback
    event.respondWith(
        caches.match(event.request).then((response) => {
            // Return from cache if found
            if (response) {
                return response;
            }

            // Otherwise fetch from network
            return fetch(event.request)
                .then((networkResponse) => {
                    // Cache the newly fetched asset
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const resClone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, resClone);
                        });
                    }
                    return networkResponse;
                })
                .catch(error => {
                    console.error('Fetch failed:', error);
                    // Optionally return a fallback placeholder image for images if offline
                    throw error;
                });
        })
    );
});
