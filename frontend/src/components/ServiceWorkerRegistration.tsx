'use client';

import { useEffect } from 'react';

// Регистрируем только в проде: в dev-режиме кэш service worker'а конфликтует
// с hot-reload и может показывать устаревшую версию страницы.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Отсутствие офлайн-кэша не критично для работы приложения — молча игнорируем
    });
  }, []);

  return null;
}
