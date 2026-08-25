'use client';

import React from 'react';
import { Plant } from '@/types/models';
import { HeartIcon } from './Icons';
import { useCart } from '@/context/CartContext';
import { useToast } from './Toast';

export const PlantActions: React.FC<{ plant: Plant }> = ({ plant }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [isFavorite, setIsFavorite] = React.useState(false);

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
      <button
        onClick={() => setIsFavorite(!isFavorite)}
        className="p-3 rounded-xl border-2 border-gray-200 hover:border-red-300 transition-colors"
        aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
      >
        <HeartIcon size={22} filled={isFavorite} className={isFavorite ? 'text-red-500' : 'text-gray-500'} />
      </button>
    </div>
  );
};
