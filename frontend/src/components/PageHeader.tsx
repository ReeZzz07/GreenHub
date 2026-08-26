'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from './Icons';

interface BackButtonProps {
  fallbackHref: string;
  className?: string;
}

// history.back() возвращает туда, откуда реально пришёл пользователь (с сохранением скролла и т.п.),
// но если открыть страницу напрямую (шаринг, push-уведомление) — истории может не быть, тогда fallbackHref
export function BackButton({ fallbackHref, className = '' }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors ${className}`}
      aria-label="Назад"
    >
      <ArrowLeftIcon size={20} className="text-gray-600" />
    </button>
  );
}

interface PageHeaderProps {
  title: string;
  fallbackHref: string;
  className?: string;
}

// className задаёт отступы/паддинги целиком (по умолчанию mb-4) — не смешивайте со своим mb-*/p-*,
// одноимённые Tailwind-утилиты конфликтуют по порядку в собранном CSS, а не по порядку в строке классов
export function PageHeader({ title, fallbackHref, className = 'mb-4' }: PageHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <BackButton fallbackHref={fallbackHref} />
      <h1 className="text-lg font-bold text-gray-800">{title}</h1>
    </div>
  );
}
