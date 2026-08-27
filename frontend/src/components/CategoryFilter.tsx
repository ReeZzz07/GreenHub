'use client';

import React from 'react';
import { categoryColor } from '@/lib/category-colors';

export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
}

interface CategoryFilterProps {
  categories: CategoryOption[];
  selectedCategory?: string;
  onCategorySelect: (categorySlug: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  const isAllSelected = selectedCategory === '' || selectedCategory === undefined;

  return (
    <div className="flex gap-3 overflow-x-auto px-1.5 py-1.5 -mx-1.5 scrollbar-hide">
      <button
        onClick={() => onCategorySelect('')}
        className="flex-shrink-0 flex flex-col items-center gap-1.5"
      >
        <div
          className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${
            isAllSelected ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[var(--color-background)]' : ''
          }`}
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <span className="text-white text-base font-bold">✺</span>
        </div>
        <span className={`text-[10.5px] ${isAllSelected ? 'font-bold text-gray-900' : 'text-gray-500'}`}>Все</span>
      </button>

      {categories.map((category, index) => {
        const isSelected = selectedCategory === category.slug;
        const color = categoryColor(index);
        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.slug)}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
          >
            <div
              className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl transition-all duration-300 ${
                isSelected ? 'ring-2 ring-green-500 ring-offset-2 ring-offset-[var(--color-background)]' : ''
              }`}
              style={{ backgroundColor: color.bg }}
            >
              {category.icon}
            </div>
            <span className={`text-[10.5px] whitespace-nowrap ${isSelected ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};
