'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plant } from '@/types/models';
import { HeartIcon, ChatIcon } from './Icons';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from './Toast';
import { createConversation, ApiError } from '@/lib/api';

export const PlantActions: React.FC<{ plant: Plant }> = ({ plant }) => {
  const { addToCart } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const router = useRouter();
  const [isMessaging, setIsMessaging] = React.useState(false);
  const favorite = isFavorite(plant.id);

  const isOwnListing = isAuthenticated && user?.id === plant.sellerId;

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      showToast('Войдите, чтобы добавлять в избранное', 'info');
      return;
    }
    toggleFavorite(plant.id);
  };

  const handleMessageSeller = async () => {
    if (!isAuthenticated || !token) {
      showToast('Войдите, чтобы написать продавцу', 'info');
      router.push('/profile');
      return;
    }

    setIsMessaging(true);
    try {
      const conversation = await createConversation(plant.id, token);
      router.push(`/chats/${conversation.id}`);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось открыть чат', 'error');
    } finally {
      setIsMessaging(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          addToCart(plant, 1);
          showToast('Добавлено в корзину', 'success');
        }}
        disabled={!plant.inStock}
        className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        В корзину
      </button>
      {!isOwnListing && (
        <button
          onClick={handleMessageSeller}
          disabled={isMessaging}
          className="p-3 rounded-xl border-2 border-gray-200 hover:border-green-300 transition-colors disabled:opacity-50"
          aria-label="Написать продавцу"
        >
          <ChatIcon size={22} className="text-gray-500" />
        </button>
      )}
      <button
        onClick={handleFavoriteToggle}
        className="p-3 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-colors"
        aria-label={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      >
        <HeartIcon size={22} filled={favorite} className={favorite ? 'text-red-500' : 'text-gray-500'} />
      </button>
    </div>
  );
};
