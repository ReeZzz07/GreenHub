import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Иконки под тематику "особенностей сайта" (оплата, гарантия и т.п.) — тот же line-стиль, что и остальные
// иконки приложения. Используются как пресеты для карточек блока "Почему GreenHub?" на главной.

export const WalletIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"></path>
    <path d="M21 12h-4a2 2 0 0 0 0 4h4"></path>
    <path d="M3 7l3-3h9"></path>
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"></path>
    <polyline points="9 12 11 14 15 10"></polyline>
  </svg>
);
