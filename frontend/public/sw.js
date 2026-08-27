// Простой service worker без сборочных инструментов (без workbox/next-pwa): кэширует
// статику и посещённые страницы во время работы, чтобы каталог/просмотренные объявления
// открывались офлайн. Список файлов для precache не хардкодим — имена чанков Next.js
// хэшируются на каждой сборке, поэтому кэшируем "на лету" по мере посещения (runtime caching).
const CACHE_NAME = 'greenhub-v1';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API-запросы всегда идут в сеть — кэшировать динамические данные нельзя
  if (url.pathname.startsWith('/api/')) return;

  // Неизменяемые хэшированные ассеты Next.js — можно кэшировать агрессивно
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/image')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Переходы между страницами — сначала сеть (свежий контент), офлайн-кэш как запасной вариант
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline ?? Response.error();
  }
}
