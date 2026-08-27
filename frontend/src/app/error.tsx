'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="animate-fade-in px-4 py-16 text-center md:max-w-md md:mx-auto">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      </div>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Что-то пошло не так</h1>
      <p className="text-sm text-gray-500 mb-6">
        Произошла непредвиденная ошибка. Попробуйте обновить страницу — мы уже знаем о проблеме.
      </p>
      <button onClick={reset} className="btn-primary">
        Попробовать снова
      </button>
    </div>
  );
}
