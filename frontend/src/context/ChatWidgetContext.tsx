'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';
import { createChatSocket } from '@/lib/socket';
import { fetchConversation, fetchConversationMessages, type ChatMessage, type Conversation } from '@/lib/api';

export interface ChatWindow {
  conversationId: string;
  minimized: boolean;
  isLoading: boolean;
  hasUnread: boolean;
  conversation: Conversation | null;
  messages: ChatMessage[];
}

interface ChatWidgetContextType {
  windows: ChatWindow[];
  openConversation: (conversationId: string) => void;
  minimizeConversation: (conversationId: string) => void;
  closeConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
}

const ChatWidgetContext = createContext<ChatWidgetContextType | undefined>(undefined);

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const { markConversationRead } = useNotifications();
  const [windows, setWindows] = useState<ChatWindow[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const windowsRef = useRef<ChatWindow[]>([]);
  const userIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setWindows([]);
      return;
    }

    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      windowsRef.current.forEach((w) => socket.emit('joinConversation', { conversationId: w.conversationId }));
    });

    socket.on('newMessage', (message: ChatMessage) => {
      const existing = windowsRef.current.find((w) => w.conversationId === message.conversationId);
      const isOwn = message.senderId === userIdRef.current;

      if (existing) {
        setWindows((prev) =>
          prev.map((w) => {
            if (w.conversationId !== message.conversationId) return w;
            const alreadyHas = w.messages.some((m) => m.id === message.id);
            return {
              ...w,
              messages: alreadyHas ? w.messages : [...w.messages, message],
              hasUnread: w.hasUnread || (w.minimized && !isOwn),
            };
          }),
        );
        if (!existing.minimized && !isOwn) {
          markConversationRead(message.conversationId);
        }
        return;
      }

      if (isOwn) return;

      const conversationId = message.conversationId;
      setWindows((prev) => [
        ...prev,
        {
          conversationId,
          minimized: true,
          isLoading: true,
          hasUnread: true,
          conversation: null,
          messages: [message],
        },
      ]);

      if (token) {
        fetchConversation(conversationId, token)
          .then((conversation) => {
            setWindows((prev) =>
              prev.map((w) => (w.conversationId === conversationId ? { ...w, conversation, isLoading: false } : w)),
            );
          })
          .catch(() => {
            setWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
          });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, markConversationRead]);

  const openConversation = useCallback(
    (conversationId: string) => {
      const existing = windowsRef.current.find((w) => w.conversationId === conversationId);

      if (existing) {
        setWindows((prev) =>
          prev.map((w) => (w.conversationId === conversationId ? { ...w, minimized: false, hasUnread: false } : w)),
        );
      } else {
        setWindows((prev) => [
          ...prev,
          {
            conversationId,
            minimized: false,
            isLoading: true,
            hasUnread: false,
            conversation: null,
            messages: [],
          },
        ]);

        if (token) {
          Promise.all([fetchConversation(conversationId, token), fetchConversationMessages(conversationId, token)])
            .then(([conversation, messages]) => {
              setWindows((prev) =>
                prev.map((w) => (w.conversationId === conversationId ? { ...w, conversation, messages, isLoading: false } : w)),
              );
            })
            .catch(() => {
              setWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
            });
        }
      }

      socketRef.current?.emit('joinConversation', { conversationId });
      markConversationRead(conversationId);
    },
    [token, markConversationRead],
  );

  const minimizeConversation = useCallback((conversationId: string) => {
    setWindows((prev) => prev.map((w) => (w.conversationId === conversationId ? { ...w, minimized: true } : w)));
  }, []);

  const closeConversation = useCallback((conversationId: string) => {
    setWindows((prev) => prev.filter((w) => w.conversationId !== conversationId));
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit('sendMessage', { conversationId, content });
  }, []);

  return (
    <ChatWidgetContext.Provider
      value={{ windows, openConversation, minimizeConversation, closeConversation, sendMessage }}
    >
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  const context = useContext(ChatWidgetContext);
  if (context === undefined) {
    throw new Error('useChatWidget must be used within a ChatWidgetProvider');
  }
  return context;
}
