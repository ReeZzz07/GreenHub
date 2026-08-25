import React from 'react';
import { Plant } from '../types/models';
import { StarIcon, HeartIcon } from './Icons';
import { useCart } from '../context/CartContext';

interface PlantCardProps {
  plant: Plant;
  onClick?: () => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({ plant, onClick }) => {
  const { addToCart } = useCart();
  const [isFavorite, setIsFavorite] = React.useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(plant, 1);
  };

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div 
      className="card card-hover cursor-pointer group animate-fade-in"
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
          className="absolute top-3 right-3 p-2 glass rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
        >
          <HeartIcon size={20} filled={isFavorite} className={isFavorite ? 'text-red-500' : 'text-gray-600'} />
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
      
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-green-700 transition-colors">
              {plant.name}
            </h3>
            <p className="text-xs text-gray-500 italic truncate">{plant.latinName}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 mb-3">
          <StarIcon size={14} filled className="text-amber-400" />
          <span className="text-sm font-medium text-gray-700">{plant.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({plant.reviewsCount})</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-green-700">
              {plant.price.toLocaleString('ru-RU')} ₽
            </span>
            {plant.sellerName && (
              <span className="text-xs text-gray-500">от {plant.sellerName}</span>
            )}
          </div>
          
          <button
            onClick={handleAddToCart}
            disabled={!plant.inStock}
            className="btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Добавить в корзину"
          >
            В корзину
          </button>
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
