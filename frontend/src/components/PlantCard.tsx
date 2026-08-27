'use client';

import React from 'react';
import { Plant } from '@/types/models';
import { StarIcon, HeartIcon, PlusIcon, MinusIcon } from './Icons';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';

interface PlantCardProps {
  plant: Plant;
  onClick?: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onClick }) => {
  const { items, addToCart, updateQuantity } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const favorite = isFavorite(plant.id);
  const cartItem = items.find((item) => item.plantId === plant.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(plant, 1);
  };

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    if (!cartItem) return;
    updateQuantity(cartItem.id, cartItem.quantity + delta);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Войдите, чтобы добавлять в избранное', 'info');
      return;
    }
    toggleFavorite(plant.id);
  };

  return (
    <div
      className="card relative cursor-pointer group animate-fade-in"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
        <img
          src={plant.images[0] || '/placeholder-plant.jpg'}
          alt={plant.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <button
          onClick={handleFavoriteToggle}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <HeartIcon size={16} filled={favorite} className={favorite ? 'text-red-500' : 'text-gray-500'} />
        </button>
        {!plant.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-semibold text-sm">
              Нет в наличии
            </span>
          </div>
        )}
        {plant.aiGenerated && (
          <div className="absolute top-3 left-3 badge badge-info">
            AI Generated
          </div>
        )}
      </div>

      <div className="relative">
        {cartItem ? (
          <div
            className="absolute -top-4 right-3 flex items-center gap-1 rounded-full px-1.5 py-1.5 shadow-[0_4px_10px_rgba(22,163,74,0.4)]"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => handleQuantityChange(e, -1)}
              className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Уменьшить количество"
            >
              <MinusIcon size={13} />
            </button>
            <span className="w-4 text-center text-xs font-bold text-white">
              {cartItem.quantity}
            </span>
            <button
              onClick={(e) => handleQuantityChange(e, 1)}
              className="w-6 h-6 flex items-center justify-center text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Увеличить количество"
            >
              <PlusIcon size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!plant.inStock}
            className="absolute -top-4 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-[0_4px_10px_rgba(22,163,74,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            aria-label="Добавить в корзину"
          >
            <PlusIcon size={16} />
          </button>
        )}
      </div>

      <div className="p-4 pt-6">
        <div className="flex-1 min-w-0 mb-1.5">
          <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-green-700 transition-colors">
            {plant.name}
          </h3>
          <p className="text-[11px] text-gray-500 italic truncate">{plant.latinName}</p>
        </div>

        {plant.reviewsCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            <StarIcon size={12} filled className="text-amber-400" />
            <span className="text-xs font-medium text-gray-700">{plant.rating.toFixed(1)}</span>
            <span className="text-[11px] text-gray-400">({plant.reviewsCount})</span>
          </div>
        )}

        <div className="flex flex-col">
          <span className="font-display text-base font-bold text-gray-900">
            {plant.price.toLocaleString('ru-RU')} ₽
          </span>
          {plant.sellerName && (
            <span className="text-[11px] text-gray-500 truncate">от {plant.sellerName}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export const PlantCardSkeleton: React.FC = () => (
  <div className="card animate-pulse">
    <div className="aspect-square bg-gray-200" />
    <div className="p-4 space-y-3">
      <div className="h-5 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="flex items-center gap-2">
        <div className="h-4 bg-gray-200 rounded w-16" />
        <div className="h-4 bg-gray-200 rounded w-12" />
      </div>
      <div className="flex justify-between items-center">
        <div className="h-6 bg-gray-200 rounded w-20" />
        <div className="h-9 bg-gray-200 rounded w-24" />
      </div>
    </div>
  </div>
);
