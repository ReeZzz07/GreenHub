import type React from 'react';
import { LeafIcon, DropletIcon, SunIcon, HomeIcon } from '@/components/Icons';
import {
  TreeIcon,
  CactusIcon,
  FlowerIcon,
  GrassIcon,
  PotIcon,
  BranchIcon,
  BouquetIcon,
  SproutIcon,
} from '@/components/CategoryIcons';

export interface CategoryIconPreset {
  id: string;
  label: string;
  Icon: React.FC<{ className?: string; size?: number }>;
}

// id хранится в Category.icon, когда iconType === 'PRESET' — держите id стабильными, чтобы не отвязать
// уже выбранные иконки существующих категорий при доработке набора.
export const CATEGORY_ICON_PRESETS: CategoryIconPreset[] = [
  { id: 'tree', label: 'Дерево', Icon: TreeIcon },
  { id: 'pot', label: 'Горшок', Icon: PotIcon },
  { id: 'cactus', label: 'Кактус', Icon: CactusIcon },
  { id: 'flower', label: 'Цветок', Icon: FlowerIcon },
  { id: 'bouquet', label: 'Букет', Icon: BouquetIcon },
  { id: 'grass', label: 'Трава', Icon: GrassIcon },
  { id: 'leaf', label: 'Лист', Icon: LeafIcon },
  { id: 'sprout', label: 'Росток', Icon: SproutIcon },
  { id: 'branch', label: 'Ветка', Icon: BranchIcon },
  { id: 'droplet', label: 'Полив', Icon: DropletIcon },
  { id: 'sun', label: 'Солнце', Icon: SunIcon },
  { id: 'home', label: 'Дом', Icon: HomeIcon },
];

export function findCategoryIconPreset(id: string | null | undefined) {
  return CATEGORY_ICON_PRESETS.find((preset) => preset.id === id);
}
