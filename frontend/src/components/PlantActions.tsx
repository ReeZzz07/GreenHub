'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plant } from '@/types/models';
import { HeartIcon, ChatIcon, PlusIcon, MinusIcon } from './Icons';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from './Toast';
import { createConversation, ApiError } from '@/lib/api';

export const PlantActions: React.FC<{ plant: Plant }> = ({ plant }) => {
  const { items, addToCart, updateQuantity } = useCart();
  const { user, token, isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const router = useRouter();
  const [isMessaging, setIsMessaging] = React.useState(false);
  const favorite = isFavorite(plant.id);
  const cartItem = items.find((item) => item.plantId === plant.id);

  const isOwnListing = isAuthenticated && user?.id === plant.sellerId;

  const handleQuantityChange = (delta: number) => {
    if (!cartItem) return;
    updateQuantity(cartItem.id, cartItem.quantity + delta);
  };

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
      {cartItem ? (
        <div className="flex-1 flex items-center justify-between bg-green-700 rounded-xl px-2 py-2">
          <button
            onClick={() => handleQuantityChange(-1)}
            className="p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Уменьшить количество"
          >
            <MinusIcon size={18} />
          </button>
          <span className="font-semibold text-white">{cartItem.quantity}</span>
          <button
            onClick={() => handleQuantityChange(1)}
            className="p-2.5 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Увеличить количество"
          >
            <PlusIcon size={18} />
          </button>
        </div>
      ) : (
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
      )}
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
