import Link from 'next/link';
import { categoryColor } from '@/lib/category-colors';
import type { CategoryOption } from './CategoryFilter';

export function HomeCategoryShortcuts({ categories }: { categories: CategoryOption[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((category, index) => {
        const color = categoryColor(index);
        return (
          <Link
            key={category.id}
            href={`/catalog?category=${category.slug}`}
            className="flex-shrink-0 flex flex-col items-center gap-1.5"
          >
            <div
              className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-xl"
              style={{ backgroundColor: color.bg }}
            >
              {category.icon}
            </div>
            <span className="text-[10.5px] text-gray-500 whitespace-nowrap">{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
