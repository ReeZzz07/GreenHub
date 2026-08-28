'use client';

import Image from 'next/image';
import type { HomeContentIconType } from '@/lib/api';
import { findHomeIconPreset } from '@/lib/home-icon-presets';

interface HomeIconProps {
  icon?: string | null;
  iconType?: HomeContentIconType | null;
  size?: number;
  className?: string;
}

// Единая точка рендера иконки карточки на главной — emoji-текст, пресет из встроенного набора
// или загруженная картинка (см. CategoryIcon — тот же принцип, но свой набор пресетов).
export function HomeIcon({ icon, iconType, size = 20, className = '' }: HomeIconProps) {
  if (!icon) return null;

  if (iconType === 'UPLOAD') {
    return (
      <span className={`relative inline-block flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
        <Image src={icon} alt="" fill sizes={`${size}px`} className="object-contain" />
      </span>
    );
  }

  if (iconType === 'PRESET') {
    const preset = findHomeIconPreset(icon);
    if (!preset) return null;
    const { Icon } = preset;
    return <Icon size={size} className={className} />;
  }

  return (
    <span className={className} style={{ fontSize: size * 0.8, lineHeight: 1 }}>
      {icon}
    </span>
  );
}
