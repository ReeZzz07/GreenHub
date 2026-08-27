'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlantCard, PlantCardSkeleton } from '@/components/PlantCard';
import { FilterIcon } from '@/components/Icons';
import { fetchCategories, fetchListings, type Category } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';
import { Plant } from '@/types/models';

type SortBy = 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
];

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: 'До 1 000 ₽', max: 1000 },
  { label: '1 000–3 000 ₽', min: 1000, max: 3000 },
  { label: '3 000–5 000 ₽', min: 3000, max: 5000 },
  { label: 'От 5 000 ₽', min: 5000 },
];

export default function CatalogPage() {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogContent />
    </Suspense>
  );
}

function CatalogSkeleton() {
  return (
    <div className="animate-fade-in px-4 py-4">
      <h1 className="font-display text-xl font-bold text-gray-900 mb-4">Каталог</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <PlantCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      fetchListings({
        category: category || undefined,
        search: query || undefined,
        sortBy,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      })
        .then((page) => {
          setPlants(page.items.map(listingToPlant));
          setTotal(page.total);
        })
        .catch(() => {
          setPlants([]);
          setTotal(0);
        })
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, category, sortBy, minPrice, maxPrice]);

  const isPricePreset = (preset: { min?: number; max?: number }) =>
    minPrice === String(preset.min ?? '') && maxPrice === String(preset.max ?? '');

  const applyPricePreset = (preset: { min?: number; max?: number }) => {
    if (isPricePreset(preset)) {
      setMinPrice('');
      setMaxPrice('');
    } else {
      setMinPrice(preset.min !== undefined ? String(preset.min) : '');
      setMaxPrice(preset.max !== undefined ? String(preset.max) : '');
    }
  };

  return (
    <div className="animate-fade-in px-4 py-4">
      <h1 className="font-display text-xl font-bold text-gray-900 mb-4">Каталог</h1>

      <div className="flex gap-2 mb-4 lg:max-w-xl">
        <div className="flex-1">
          <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
        </div>
        <button
          onClick={() => setIsFiltersOpen((prev) => !prev)}
          className={`flex-shrink-0 p-3 rounded-2xl transition-colors relative ${
            isFiltersOpen || sortBy !== 'newest' || hasPriceFilter
              ? 'bg-green-600 text-white'
              : 'bg-[var(--color-surface)] text-gray-500'
          }`}
          aria-label="Фильтры"
        >
          <FilterIcon size={20} />
          {(sortBy !== 'newest' || hasPriceFilter) && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-[var(--color-background)]" />
          )}
        </button>
      </div>

      {isFiltersOpen && (
        <div className="card p-4 mb-4 space-y-3 animate-fade-in lg:max-w-xl">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Сортировка</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="input-field"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Цена, ₽</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {PRICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => applyPricePreset(preset)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    isPricePreset(preset)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                placeholder="От"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="input-field"
              />
              <input
                type="number"
                min={0}
                placeholder="До"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {(sortBy !== 'newest' || hasPriceFilter) && (
            <button
              onClick={() => {
                setSortBy('newest');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Сбросить фильтры
            </button>
          )}
        </div>
      )}

      <div className="mb-4">
        <CategoryFilter categories={categories} selectedCategory={category} onCategorySelect={setCategory} />
      </div>

      {!isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {total === 0 ? 'Ничего не найдено' : `Найдено объявлений: ${total}`}
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PlantCardSkeleton key={i} />
          ))}
        </div>
      ) : plants.length === 0 ? null : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {plants.map((plant) => (
            <PlantCard
              key={plant.id}
              plant={plant}
              onClick={() => router.push(`/plant/${plant.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
