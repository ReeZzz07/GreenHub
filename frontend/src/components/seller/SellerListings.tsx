'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PlantCard, PlantCardSkeleton } from '../PlantCard';
import { SearchBar } from '../SearchBar';
import { Select } from '../Select';
import { fetchListings } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';
import { Plant } from '@/types/models';

type SortBy = 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'newest', label: 'Сначала новые' },
  { value: 'price_asc', label: 'Сначала дешевле' },
  { value: 'price_desc', label: 'Сначала дороже' },
];

const PAGE_SIZE = 12;

interface SellerListingsProps {
  sellerId: string;
  initialItems: Plant[];
  initialTotal: number;
}

export function SellerListings({ sellerId, initialItems, initialTotal }: SellerListingsProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [items, setItems] = useState(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isFirstRender = useRef(true);

  // Начальные данные уже пришли с сервера — пропускаем самый первый эффект, чтобы не дублировать запрос
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsLoading(true);
    setPage(1);
    const timeout = setTimeout(() => {
      fetchListings({ sellerId, search: query || undefined, sortBy, limit: PAGE_SIZE, page: 1 })
        .then((res) => {
          setItems(res.items.map(listingToPlant));
          setTotal(res.total);
        })
        .catch(() => {
          setItems([]);
          setTotal(0);
        })
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, sortBy, sellerId]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setIsLoadingMore(true);
    fetchListings({ sellerId, search: query || undefined, sortBy, limit: PAGE_SIZE, page: nextPage })
      .then((res) => {
        setItems((prev) => [...prev, ...res.items.map(listingToPlant)]);
        setPage(nextPage);
      })
      .finally(() => setIsLoadingMore(false));
  };

  const hasMore = items.length < total;

  return (
    <div className="px-4 pb-6 lg:max-w-3xl lg:mx-auto">
      <h2 className="font-display font-bold text-gray-900 mb-3">Объявления{total > 0 && ` (${total})`}</h2>

      {initialTotal > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} placeholder="Поиск по товарам продавца" />
          </div>
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value as SortBy)}
            options={SORT_OPTIONS}
            className="w-44 flex-shrink-0"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <PlantCardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500 py-6 text-center">
          {query ? 'По запросу ничего не найдено' : 'У продавца пока нет активных объявлений'}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((plant) => (
              <PlantCard key={plant.id} plant={plant} onClick={() => router.push(`/plant/${plant.id}`)} />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="btn-secondary w-full mt-4 disabled:opacity-50"
            >
              {isLoadingMore ? 'Загружаем...' : 'Показать ещё'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
