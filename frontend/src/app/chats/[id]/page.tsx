'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BackButton } from '@/components/PageHeader';
import {
  fetchConversation,
  fetchConversationMessages,
  type ChatMessage,
  type Conversation,
} from '@/lib/api';
import { createChatSocket } from '@/lib/socket';

export default function ChatThreadPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([fetchConversation(id, token), fetchConversationMessages(id, token)])
      .then(([conv, msgs]) => {
        setConversation(conv);
        setMessages(msgs);
      })
      .finally(() => setIsLoading(false));
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    const socket = createChatSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinConversation', { conversationId: id });
    });

    socket.on('newMessage', (message: ChatMessage) => {
      if (message.conversationId !== id) return;
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
    });

    return () => {
      socket.disconnect();
    };
  }, [id, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || !socketRef.current) return;
    socketRef.current.emit('sendMessage', { conversationId: id, content });
    setInput('');
  };

  if (authLoading || isLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы открыть чат</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  const counterpart = conversation
    ? conversation.buyerId === user?.id
      ? conversation.seller
      : conversation.buyer
    : null;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-8.5rem)] md:h-[calc(100vh-4.5rem)] lg:max-w-2xl lg:mx-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <BackButton fallbackHref="/chats" />
        <div className="min-w-0">
          <h1 className="font-semibold text-gray-800 truncate">{counterpart?.name ?? 'Чат'}</h1>
          {conversation && <p className="text-xs text-gray-500 truncate">{conversation.listing.title}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">Напишите первое сообщение</p>
        ) : (
          messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    isOwn ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сообщение..."
          className="input-field flex-1"
        />
        <button type="submit" className="btn-primary px-4 py-3" disabled={!input.trim()}>
          →
        </button>
      </form>
    </div>
  );
}
