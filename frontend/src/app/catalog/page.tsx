'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { Select } from '@/components/Select';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlantCard, PlantCardSkeleton } from '@/components/PlantCard';
import { EmptyCatalogIllustration } from '@/components/EmptyCatalogIllustration';
import { FilterIcon } from '@/components/Icons';
import {
  fetchCategories,
  fetchListings,
  type Category,
  type PlantType,
  type LifeCycle,
  type LightNeed,
  type RootSystemType,
} from '@/lib/api';
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

const PLANT_TYPE_OPTIONS: { value: PlantType; label: string }[] = [
  { value: 'CONIFEROUS', label: 'Хвойное' },
  { value: 'DECIDUOUS', label: 'Лиственное' },
];
const LIFE_CYCLE_OPTIONS: { value: LifeCycle; label: string }[] = [
  { value: 'PERENNIAL', label: 'Многолетнее' },
  { value: 'ANNUAL', label: 'Однолетнее' },
];
const LIGHT_NEED_OPTIONS: { value: LightNeed; label: string }[] = [
  { value: 'SUN_LOVING', label: 'Светолюбивое' },
  { value: 'SHADE_TOLERANT', label: 'Теневыносливое' },
];
const ROOT_SYSTEM_OPTIONS: { value: RootSystemType; label: string }[] = [
  { value: 'CLOSED', label: 'ЗКС' },
  { value: 'OPEN', label: 'ОКС' },
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
  const [plantType, setPlantType] = useState<PlantType | ''>('');
  const [lifeCycle, setLifeCycle] = useState<LifeCycle | ''>('');
  const [lightNeed, setLightNeed] = useState<LightNeed | ''>('');
  const [safeForPets, setSafeForPets] = useState(false);
  const [rootSystemType, setRootSystemType] = useState<RootSystemType | ''>('');
  const [minHeight, setMinHeight] = useState('');
  const [maxHeight, setMaxHeight] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Plant[]>([]);

  const hasPriceFilter = minPrice !== '' || maxPrice !== '';
  const hasAttributeFilter =
    plantType !== '' ||
    lifeCycle !== '' ||
    lightNeed !== '' ||
    safeForPets ||
    rootSystemType !== '' ||
    minHeight !== '' ||
    maxHeight !== '';

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
        plantType: plantType || undefined,
        lifeCycle: lifeCycle || undefined,
        lightNeed: lightNeed || undefined,
        toxicToPets: safeForPets ? false : undefined,
        rootSystemType: rootSystemType || undefined,
        minHeight: minHeight ? Number(minHeight) : undefined,
        maxHeight: maxHeight ? Number(maxHeight) : undefined,
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
  }, [
    query,
    category,
    sortBy,
    minPrice,
    maxPrice,
    plantType,
    lifeCycle,
    lightNeed,
    safeForPets,
    rootSystemType,
    minHeight,
    maxHeight,
  ]);

  // Когда по запросу ничего не нашлось — подсказываем похожие растения (по категории,
  // если она выбрана, иначе просто новые поступления), чтобы страница не была тупиком
  useEffect(() => {
    if (isLoading || plants.length > 0) {
      setSuggestions([]);
      return;
    }
    fetchListings({ category: category || undefined, sortBy: 'newest', limit: 8 })
      .then((page) => setSuggestions(page.items.map(listingToPlant)))
      .catch(() => setSuggestions([]));
  }, [isLoading, plants.length, category]);

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
            isFiltersOpen || sortBy !== 'newest' || hasPriceFilter || hasAttributeFilter
              ? 'bg-green-600 text-white'
              : 'bg-[var(--color-surface)] text-gray-500'
          }`}
          aria-label="Фильтры"
        >
          <FilterIcon size={20} />
          {(sortBy !== 'newest' || hasPriceFilter || hasAttributeFilter) && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-orange-500 ring-2 ring-[var(--color-background)]" />
          )}
        </button>
      </div>

      {isFiltersOpen && (
        <div className="card p-4 mb-4 space-y-3 animate-fade-in lg:max-w-xl">
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Сортировка</label>
            <Select value={sortBy} onChange={(value) => setSortBy(value as SortBy)} options={SORT_OPTIONS} />
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

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Тип растения</label>
            <div className="flex gap-2 flex-wrap">
              {PLANT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPlantType((prev) => (prev === option.value ? '' : option.value))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    plantType === option.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Цикл жизни</label>
            <div className="flex gap-2 flex-wrap">
              {LIFE_CYCLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLifeCycle((prev) => (prev === option.value ? '' : option.value))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    lifeCycle === option.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Отношение к свету</label>
            <div className="flex gap-2 flex-wrap">
              {LIGHT_NEED_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLightNeed((prev) => (prev === option.value ? '' : option.value))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    lightNeed === option.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Корневая система</label>
            <div className="flex gap-2 flex-wrap">
              {ROOT_SYSTEM_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRootSystemType((prev) => (prev === option.value ? '' : option.value))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    rootSystemType === option.value
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={() => setSafeForPets((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                safeForPets
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
              }`}
            >
              Не токсично для животных
            </button>
          </div>

          <div>
            <label className="text-sm text-gray-700 mb-1 block">Высота, см</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                placeholder="От"
                value={minHeight}
                onChange={(e) => setMinHeight(e.target.value)}
                className="input-field"
              />
              <input
                type="number"
                min={0}
                placeholder="До"
                value={maxHeight}
                onChange={(e) => setMaxHeight(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          {(sortBy !== 'newest' || hasPriceFilter || hasAttributeFilter) && (
            <button
              onClick={() => {
                setSortBy('newest');
                setMinPrice('');
                setMaxPrice('');
                setPlantType('');
                setLifeCycle('');
                setLightNeed('');
                setSafeForPets(false);
                setRootSystemType('');
                setMinHeight('');
                setMaxHeight('');
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

      {!isLoading && total > 0 && (
        <p className="text-sm text-gray-500 mb-4">Найдено объявлений: {total}</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <PlantCardSkeleton key={i} />
          ))}
        </div>
      ) : plants.length === 0 ? (
        <div>
          <div className="text-center py-8 px-4">
            <EmptyCatalogIllustration />
            <h2 className="font-display text-xl font-bold text-gray-900 mb-2 mt-2">Пока ничего не нашли</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
              Такого растения в каталоге пока нет — но продавцы добавляют новые объявления каждый день. Загляните позже или посмотрите, что есть прямо сейчас.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setCategory('');
                setSortBy('newest');
                setMinPrice('');
                setMaxPrice('');
                setPlantType('');
                setLifeCycle('');
                setLightNeed('');
                setSafeForPets(false);
                setRootSystemType('');
                setMinHeight('');
                setMaxHeight('');
              }}
              className="btn-primary inline-block"
            >
              Смотреть весь каталог
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="font-display text-lg font-bold text-gray-900 mb-4">Может быть, вам понравится</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {suggestions.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => router.push(`/plant/${plant.id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
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
