const APP_CACHE = 'mask-app-v2';
const MODEL_CACHE = 'mask-model-v2';
const APP_SHELL = ['./', './manifest.webmanifest', './icons/icon-192.svg', './icons/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => ![APP_CACHE, MODEL_CACHE].includes(key))
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestURL = new URL(event.request.url);

  if (requestURL.origin === self.location.origin) {
    event.respondWith(networkFirst(event.request, APP_CACHE));
    return;
  }

  if (
    requestURL.hostname.includes('huggingface.co') ||
    requestURL.hostname.includes('cdn-lfs.huggingface.co')
  ) {
    event.respondWith(cacheFirst(event.request, MODEL_CACHE));
  }
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') {
    cache.put(request, response.clone());
  }

  return response;
}

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    if (request.mode === 'navigate') {
      const fallback = await cache.match('./');
      if (fallback) {
        return fallback;
      }
    }

    return new Response('Offline and not cached', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}
