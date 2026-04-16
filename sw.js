const CACHE_NAME = 'alpha-calc-v1';
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
    "./assets/images/logo-196x96.png",
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

// Fetch resources - STALE WHILE REVALIDATE
self.addEventListener('fetch', e => {
    e.respondWith(
        caches.match(e.request).then(cachedRes => {
            const fetchPromise = fetch(e.request).then(res => {
                // Only cache successful responses
                if (res && res.status === 200) {
                    const cache = caches.open(CACHE_NAME);
                    cache.then(c => c.put(e.request, res.clone()));
                }
                return res;
            }).catch(err => {
                console.error('Fetch failed for', e.request.url, err);
                // Return cached version if fetch fails
                return cachedRes || new Response('Offline - resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });

            // Return cached version immediately, fetch fresh in background
            return cachedRes || fetchPromise;
        })
    );
});
