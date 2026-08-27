'use client';

import { ShareIcon } from './Icons';
import { useToast } from './Toast';

interface ShareButtonProps {
  title: string;
  className?: string;
}

export function ShareButton({ title, className = '' }: ShareButtonProps) {
  const { showToast } = useToast();

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // пользователь закрыл системный диалог — ничего не делаем
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Ссылка скопирована', 'success');
    } catch {
      showToast('Не удалось скопировать ссылку', 'error');
    }
  };

  return (
    <button onClick={handleShare} className={className} aria-label="Поделиться">
      <ShareIcon size={18} />
    </button>
  );
}
