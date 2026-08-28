'use client';

import Image from 'next/image';
import type { Category } from '@/lib/api';
import { findCategoryIconPreset } from '@/lib/category-icon-presets';

interface CategoryIconProps {
  category: Pick<Category, 'icon' | 'iconType'>;
  size?: number;
  className?: string;
}

// Единая точка рендера иконки категории — умеет отрисовать все три способа её задать
// (emoji-текст, пресет из встроенного набора line-иконок, загруженная картинка).
export function CategoryIcon({ category, size = 24, className = '' }: CategoryIconProps) {
  if (!category.icon) return null;

  if (category.iconType === 'UPLOAD') {
    return (
      <span className={`relative inline-block flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <Image src={category.icon} alt="" fill sizes={`${size}px`} className="object-contain" />
      </span>
    );
  }

  if (category.iconType === 'PRESET') {
    const preset = findCategoryIconPreset(category.icon);
    if (!preset) return null;
    const { Icon } = preset;
    return <Icon size={size} className={className} />;
  }

  return (
    <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
      {category.icon}
    </span>
  );
}
