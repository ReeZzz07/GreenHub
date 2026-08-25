import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, GridIcon, CameraIcon, ShoppingCartIcon, UserIcon, LeafIcon } from './Icons';
import { useCart } from '../context/CartContext';

const navItems = [
  { path: '/', icon: HomeIcon, label: 'Главная' },
  { path: '/catalog', icon: GridIcon, label: 'Каталог' },
  { path: '/recognize', icon: CameraIcon, label: 'Распознать' },
  { path: '/cart', icon: ShoppingCartIcon, label: 'Корзина' },
  { path: '/profile', icon: UserIcon, label: 'Профиль' },
];

export const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { totalCount } = useCart();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-green-100 bg-white/95 backdrop-blur-lg z-40 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const hasBadge = item.path === '/cart' && totalCount > 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
                isActive
                  ? 'text-green-700 scale-105'
                  : 'text-gray-400 hover:text-green-600'
              }`}
            >
              <div className="relative">
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-fade-in">
                    {totalCount > 9 ? '9+' : totalCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 font-medium transition-opacity duration-300 ${
                isActive ? 'opacity-100' : 'opacity-70'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-8 h-1 bg-green-600 rounded-full animate-fade-in" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const Header: React.FC<{ title?: string; showBack?: boolean }> = ({ 
  title = 'GreenHub', 
  showBack = false 
}) => {
  return (
    <header className="sticky top-0 z-40 gradient-nature text-white shadow-lg">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => window.history.back()}
              className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Назад"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
          <LeafIcon size={28} className="text-white" />
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-white/20 rounded-full transition-colors" aria-label="Уведомления">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
