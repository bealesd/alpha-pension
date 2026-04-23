const CACHE_NAME = 'alpha-calc-v1.1';
const assets = [
    './',
    './index.html',
    './index.css',
    './scripts/added-pension.js',
    './scripts/alpha-added-pension-by-periodical-contribution-factors-for-npa.js',
    './scripts/alpha-added-pension-revaluation-factors-by-years.js',
    './scripts/early-payment-reduction-factors-for-npa.js',
    './scripts/pension-calculator-ui.js',
    './scripts/regular-pension.js',
    './scripts/total-pension.js',
    "./assets/images/logo-48x48.png",
    "./assets/images/logo-72x72.png",
    "./assets/images/logo-96x96.png",
    "./assets/images/logo-144x144.png",
    "./assets/images/logo-192x192.png",
    "./assets/images/logo-512x512.png",
    './manifest.json'
];

// Install service worker
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(assets).catch(err => {
                console.error('Cache addAll failed:', err);
            });
        })
    );
    // Force service worker to activate immediately
    self.skipWaiting();
});

// Remove old cache
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    // Take control of all clients immediately
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cachedRes => {
            // 1. Create the network request
            const fetchPromise = fetch(e.request).then(networkRes => {
                // Check if we received a valid response to cache
                if (networkRes && networkRes.status === 200 && networkRes.type === 'basic') {
                    const responseToCache = networkRes.clone(); // CLONE IMMEDIATELY

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return networkRes;
            }).catch(err => {
                console.error('Fetch failed:', err);
                // Fallback is handled below
            });

            // 2. Return the cached version if we have it (Stale), 
            // otherwise wait for the network (Revalidate)
            return cachedRes || fetchPromise;
        })
    );
});
