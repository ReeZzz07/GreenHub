'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { fetchConversations, type Conversation } from '@/lib/api';

export default function ChatsPage() {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchConversations(token)
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [token]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы увидеть чаты</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-4 lg:max-w-2xl lg:mx-auto">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Чаты</h1>

      {conversations === null ? (
        <LoadingSpinner text="Загрузка чатов..." />
      ) : conversations.length === 0 ? (
        <p className="text-center text-gray-500 py-12">
          Пока нет ни одного чата. Напишите продавцу со страницы товара.
        </p>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const isBuyer = conversation.buyerId === user?.id;
            const counterpart = isBuyer ? conversation.seller : conversation.buyer;
            const lastMessage = conversation.messages?.[0];

            return (
              <Link key={conversation.id} href={`/chats/${conversation.id}`} className="block">
                <div className="card p-3 flex gap-3 hover:shadow-lg transition-shadow">
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
                    {conversation.listing.images[0] && (
                      <Image
                        src={conversation.listing.images[0]}
                        alt={conversation.listing.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 truncate">{counterpart.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{conversation.listing.title}</p>
                    <p className="text-sm text-gray-600 truncate mt-1">
                      {lastMessage ? lastMessage.content : 'Нет сообщений'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
