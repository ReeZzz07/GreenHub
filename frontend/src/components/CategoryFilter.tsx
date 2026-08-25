import React from 'react';
import { plantCategories } from '../types';

interface CategoryFilterProps {
  selectedCategory?: string;
  onCategorySelect: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategorySelect,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onCategorySelect('')}
        className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 ${
          selectedCategory === '' || selectedCategory === undefined
            ? 'gradient-nature text-white shadow-md'
            : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
        }`}
      >
        Все
      </button>
      {plantCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
            selectedCategory === category.id
              ? 'gradient-nature text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-green-50 border border-gray-200'
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );
};
