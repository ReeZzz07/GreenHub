'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/types/models';
import { UserRole } from '@/types';
import {
  UserIcon,
  HeartIcon,
  PackageIcon,
  CheckIcon,
  SettingsIcon,
  LogOutIcon,
  ChevronDownIcon,
} from './Icons';
import { useFavorites } from '@/context/FavoritesContext';

const SELLER_ROLES: UserRole[] = [UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN];
const MODERATOR_ROLES: UserRole[] = [UserRole.MODERATOR, UserRole.ADMIN];

interface ProfileMenuProps {
  user: User;
  onLogout: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const firstName = user.name?.split(' ')[0];
  const initial = user.name?.trim()?.[0]?.toUpperCase() ?? null;
  const canModerate = MODERATOR_ROLES.includes(user.role);
  const isSeller = SELLER_ROLES.includes(user.role);
  const { count: favoritesCount } = useFavorites();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const openNow = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    setIsOpen(true);
  };

  const closeSoon = () => {
    closeTimeout.current = setTimeout(() => setIsOpen(false), 150);
  };

  const menuItemClass =
    'flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors';

  return (
    <div ref={rootRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full hover:bg-[var(--color-surface)] transition-colors"
        aria-label="Профиль"
        aria-expanded={isOpen}
      >
        {initial ? (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            {initial}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] flex items-center justify-center flex-shrink-0">
            <UserIcon size={15} className="text-[#132015]" />
          </div>
        )}
        <span className="hidden md:flex items-center gap-1 min-w-0">
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[100px]">{firstName}</span>
          <ChevronDownIcon size={14} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_10px_30px_rgba(19,32,21,0.15)] overflow-hidden animate-fade-in z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <div className="py-1.5">
            <Link href="/profile" className={menuItemClass}>
              <UserIcon size={17} className="text-gray-400" />
              Профиль
            </Link>
            <Link href="/orders" className={menuItemClass}>
              <PackageIcon size={17} className="text-gray-400" />
              Мои заказы
            </Link>
            <Link href="/favorites" className={menuItemClass}>
              <HeartIcon size={17} className="text-gray-400" />
              <span className="flex-1">Избранное</span>
              {favoritesCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
                  {favoritesCount > 9 ? '9+' : favoritesCount}
                </span>
              )}
            </Link>
            {isSeller && (
              <Link href="/listings/mine" className={menuItemClass}>
                <PackageIcon size={17} className="text-gray-400" />
                Мои объявления
              </Link>
            )}
            {canModerate && (
              <Link href="/moderation" className={menuItemClass}>
                <CheckIcon size={17} className="text-gray-400" />
                Модерация объявлений
              </Link>
            )}
            {user.role === UserRole.ADMIN && (
              <Link href="/admin/settings" className={menuItemClass}>
                <SettingsIcon size={17} className="text-gray-400" />
                Настройки интеграций
              </Link>
            )}
          </div>

          <div className="py-1.5 border-t border-gray-100">
            <Link href="/profile/edit" className={menuItemClass}>
              <SettingsIcon size={17} className="text-gray-400" />
              Настройки профиля
            </Link>
            <button onClick={onLogout} className={`${menuItemClass} w-full text-left hover:!bg-red-50 hover:!text-red-600`}>
              <LogOutIcon size={17} className="text-gray-400" />
              Выйти
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
