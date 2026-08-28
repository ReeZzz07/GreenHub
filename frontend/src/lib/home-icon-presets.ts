import type React from 'react';
import { StarIcon, CheckIcon, ChatIcon, PackageIcon, CameraIcon, HeartIcon, DropletIcon, LeafIcon } from '@/components/Icons';
import { WalletIcon, ShieldIcon } from '@/components/HomeFeatureIcons';

export interface HomeIconPreset {
  id: string;
  label: string;
  Icon: React.FC<{ className?: string; size?: number }>;
}

// id хранится в HomePageContent.content.features[].icon, когда iconType === 'PRESET' — держите id стабильными.
export const HOME_ICON_PRESETS: HomeIconPreset[] = [
  { id: 'droplet', label: 'Полив', Icon: DropletIcon },
  { id: 'wallet', label: 'Оплата', Icon: WalletIcon },
  { id: 'star', label: 'Рейтинг', Icon: StarIcon },
  { id: 'shield', label: 'Гарантия', Icon: ShieldIcon },
  { id: 'check', label: 'Качество', Icon: CheckIcon },
  { id: 'chat', label: 'Чат', Icon: ChatIcon },
  { id: 'package', label: 'Доставка', Icon: PackageIcon },
  { id: 'camera', label: 'AI-фото', Icon: CameraIcon },
  { id: 'heart', label: 'Избранное', Icon: HeartIcon },
  { id: 'leaf', label: 'Растение', Icon: LeafIcon },
];

export function findHomeIconPreset(id: string | null | undefined) {
  return HOME_ICON_PRESETS.find((preset) => preset.id === id);
}
