'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlantCard } from '@/components/PlantCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
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

export default function CatalogPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
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
        .then((page) => setPlants(page.items.map(listingToPlant)))
        .catch(() => setPlants([]))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, category, sortBy, minPrice, maxPrice]);

  return (
    <div className="animate-fade-in px-4 py-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Каталог</h1>

      <div className="flex gap-2 mb-4 lg:max-w-xl">
        <div className="flex-1">
          <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
        </div>
        <button
          onClick={() => setIsFiltersOpen((prev) => !prev)}
          className={`flex-shrink-0 p-3 rounded-xl border-2 transition-colors relative ${
            isFiltersOpen || sortBy !== 'newest' || hasPriceFilter
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-500'
          }`}
          aria-label="Фильтры"
        >
          <FilterIcon size={20} />
          {(sortBy !== 'newest' || hasPriceFilter) && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-green-600" />
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

      <div className="mb-6">
        <CategoryFilter categories={categories} selectedCategory={category} onCategorySelect={setCategory} />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Загружаем объявления..." />
      ) : plants.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Ничего не найдено</p>
      ) : (
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
