// Service Worker for caching and offline functionality
const CACHE_NAME = 'zakupka-app-v3';
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    'https://unpkg.com/lucide@latest/dist/umd/lucide.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

async function precache() {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
}

self.addEventListener('install', (event) => {
    event.waitUntil(precache());
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        await Promise.all(
            cacheNames
                .filter((cacheName) => cacheName !== CACHE_NAME)
                .map((cacheName) => caches.delete(cacheName))
        );
        await self.clients.claim();
    })());
});

async function networkFirst(request) {
    try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        throw error;
    }
}

async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
}

self.addEventListener('fetch', (event) => {
    const { request } = event;

    if (request.method !== 'GET') {
        return;
    }

    if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }

    const requestUrl = new URL(request.url);
    if (requestUrl.origin === self.location.origin) {
        event.respondWith(cacheFirst(request));
    }
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
