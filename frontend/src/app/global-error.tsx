'use client';

import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ fontFamily: 'system-ui, sans-serif', background: '#f5faf5', margin: 0 }}>
        <div style={{ padding: '64px 16px', textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#132015', marginBottom: 8 }}>
            Приложение временно недоступно
          </h1>
          <p style={{ fontSize: 14, color: '#6b7a6d', marginBottom: 24 }}>
            Произошла критическая ошибка. Попробуйте перезагрузить страницу.
          </p>
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '12px 24px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Попробовать снова
          </button>
        </div>
      </body>
    </html>
  );
}
