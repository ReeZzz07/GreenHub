'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, GridIcon, CameraIcon, ChatIcon, ShoppingCartIcon, UserIcon, LeafIcon } from './Icons';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { path: '/', icon: HomeIcon, label: 'Главная' },
  { path: '/catalog', icon: GridIcon, label: 'Каталог' },
  { path: '/recognize', icon: CameraIcon, label: 'Распознать' },
  { path: '/chats', icon: ChatIcon, label: 'Чаты' },
  { path: '/profile', icon: UserIcon, label: 'Профиль' },
];

export const BottomNavigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[26px] shadow-[0_-4px_18px_rgba(19,32,21,0.08)] z-40 safe-area-bottom md:hidden">
      <div className="flex justify-around items-end px-2 pt-2.5 pb-3.5 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);

          if (item.path === '/recognize') {
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center -mt-7"
                aria-label={item.label}
              >
                <div
                  className={`w-[50px] h-[50px] rounded-full flex items-center justify-center border-4 border-white shadow-[0_6px_16px_rgba(22,163,74,0.4)] transition-transform ${
                    isActive ? 'scale-105' : ''
                  }`}
                  style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                >
                  <Icon size={21} className="text-white" />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
                isActive ? 'bg-green-50 text-green-700' : 'text-gray-400 hover:text-green-600'
              }`}
            >
              <Icon size={19} />
              <span className={`text-[9.5px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const Header: React.FC = () => {
  const { totalCount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const firstName = user?.name?.split(' ')[0];
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? null;

  return (
    <header className="sticky top-0 z-40 bg-white rounded-b-[26px] shadow-[0_4px_18px_rgba(19,32,21,0.05)]">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto">
        <Link href={isAuthenticated ? '/profile' : '/'} className="flex items-center gap-2.5 min-w-0">
          {isAuthenticated && initial ? (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              {initial}
            </div>
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              <LeafIcon size={18} className="text-white" />
            </div>
          )}
          <div className="min-w-0">
            {isAuthenticated && firstName ? (
              <>
                <div className="text-[11px] text-gray-400 leading-none">Привет,</div>
                <div className="text-sm font-bold text-gray-900 leading-tight truncate">{firstName} 👋</div>
              </>
            ) : (
              <div className="text-base font-display font-bold text-gray-900 tracking-tight">GreenHub</div>
            )}
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-50 hover:text-green-700'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="w-9 h-9 rounded-full bg-[var(--color-surface)] hover:bg-green-100 flex items-center justify-center transition-colors"
            aria-label="Уведомления"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#132015" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
          <Link
            href="/cart"
            className="relative w-9 h-9 rounded-full bg-gray-900 hover:bg-black flex items-center justify-center transition-colors"
            aria-label="Корзина"
          >
            <ShoppingCartIcon size={16} className="text-white" />
            {totalCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center animate-fade-in">
                {totalCount > 9 ? '9+' : totalCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
