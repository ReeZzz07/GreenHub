'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlantCard } from '@/components/PlantCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { fetchCategories, fetchListings, type Category } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';
import { Plant } from '@/types/models';

export default function CatalogPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    const timeout = setTimeout(() => {
      fetchListings({ category: category || undefined, search: query || undefined })
        .then((page) => setPlants(page.items.map(listingToPlant)))
        .catch(() => setPlants([]))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, category]);

  return (
    <div className="animate-fade-in px-4 py-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Каталог</h1>

      <div className="mb-4">
        <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
      </div>

      <div className="mb-6">
        <CategoryFilter categories={categories} selectedCategory={category} onCategorySelect={setCategory} />
      </div>

      {isLoading ? (
        <LoadingSpinner text="Загружаем объявления..." />
      ) : plants.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Ничего не найдено</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
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
