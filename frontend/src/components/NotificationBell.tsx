'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useNotifications } from '@/context/NotificationsContext';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { ChatIcon, CheckIcon, PackageIcon, StarIcon } from './Icons';
import type { AppNotification, NotificationType } from '@/lib/api';

const CHAT_LINK_PATTERN = /^\/chats\/([^/]+)$/;

const TYPE_ICON: Record<NotificationType, { icon: React.FC<{ size?: number; className?: string }>; className: string }> = {
  NEW_MESSAGE: { icon: ChatIcon, className: 'bg-blue-50 text-blue-600' },
  LISTING_APPROVED: { icon: CheckIcon, className: 'bg-green-50 text-green-600' },
  LISTING_REJECTED: { icon: CheckIcon, className: 'bg-red-50 text-red-600' },
  ORDER_PAID: { icon: PackageIcon, className: 'bg-orange-50 text-orange-600' },
  ORDER_CANCELLED: { icon: PackageIcon, className: 'bg-gray-100 text-gray-500' },
  NEW_REVIEW: { icon: StarIcon, className: 'bg-amber-50 text-amber-600' },
  REVIEW_REPLY: { icon: StarIcon, className: 'bg-amber-50 text-amber-600' },
};

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} дн назад`;
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { openConversation } = useChatWidget();
  const isDesktop = useIsDesktop();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

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

  const handleItemClick = (notification: AppNotification) => {
    if (!notification.isRead) markRead(notification.id);
    setIsOpen(false);

    const chatMatch = notification.type === 'NEW_MESSAGE' && notification.link?.match(CHAT_LINK_PATTERN);
    if (chatMatch && isDesktop) {
      openConversation(chatMatch[1]);
      return;
    }

    if (notification.link) router.push(notification.link);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative w-9 h-9 rounded-full bg-[var(--color-surface)] hover:bg-green-100 flex items-center justify-center transition-colors"
        aria-label="Уведомления"
        aria-expanded={isOpen}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#132015" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center animate-fade-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-[0_10px_30px_rgba(19,32,21,0.15)] overflow-hidden animate-fade-in z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Уведомления</p>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()} className="text-xs font-medium text-green-700 hover:text-green-800">
                Прочитать всё
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 px-4">Пока нет уведомлений</p>
            ) : (
              notifications.map((notification) => {
                const { icon: Icon, className } = TYPE_ICON[notification.type];
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleItemClick(notification)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-green-50/50' : ''
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${!notification.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{formatRelativeTime(notification.createdAt)}</p>
                    </div>
                    {!notification.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
