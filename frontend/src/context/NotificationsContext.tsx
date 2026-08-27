'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markNotificationRead,
  markAllNotificationsRead,
  markConversationNotificationsRead,
  type AppNotification,
} from '@/lib/api';

const POLL_INTERVAL_MS = 30_000;

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  markConversationRead: (conversationId: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!token) return;
    setIsLoading(true);
    Promise.all([fetchNotifications(token), fetchUnreadNotificationsCount(token)])
      .then(([list, { count }]) => {
        setNotifications(list);
        setUnreadCount(count);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    // Без сокет-пуша — опрашиваем бэкенд время от времени, чтобы бейдж не завис
    const interval = setInterval(() => {
      fetchUnreadNotificationsCount(token)
        .then(({ count }) => setUnreadCount(count))
        .catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      if (!token) return;
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationRead(id, token);
      } catch {
        refresh();
      }
    },
    [token, refresh],
  );

  const markAllRead = useCallback(async () => {
    if (!token) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(token);
    } catch {
      refresh();
    }
  }, [token, refresh]);

  const markConversationRead = useCallback(
    async (conversationId: string) => {
      if (!token) return;
      const link = `/chats/${conversationId}`;
      let clearedCount = 0;
      setNotifications((prev) =>
        prev.map((n) => {
          if (n.type === 'NEW_MESSAGE' && n.link === link && !n.isRead) {
            clearedCount += 1;
            return { ...n, isRead: true };
          }
          return n;
        }),
      );
      if (clearedCount > 0) setUnreadCount((prev) => Math.max(0, prev - clearedCount));
      try {
        await markConversationNotificationsRead(conversationId, token);
      } catch {
        refresh();
      }
    },
    [token, refresh],
  );

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, isLoading, refresh, markRead, markAllRead, markConversationRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
