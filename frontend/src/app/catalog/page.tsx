'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SearchBar } from '@/components/SearchBar';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PlantCard } from '@/components/PlantCard';
import { mockPlants } from '@/data/mockPlants';

export default function CatalogPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const filteredPlants = useMemo(() => {
    return mockPlants.filter((plant) => {
      const matchesCategory = !category || plant.category === category;
      const matchesQuery =
        !query ||
        plant.name.toLowerCase().includes(query.toLowerCase()) ||
        plant.latinName.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="animate-fade-in px-4 py-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Каталог</h1>

      <div className="mb-4">
        <SearchBar value={query} onChange={setQuery} onClear={() => setQuery('')} />
      </div>

      <div className="mb-6">
        <CategoryFilter selectedCategory={category} onCategorySelect={setCategory} />
      </div>

      {filteredPlants.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Ничего не найдено</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredPlants.map((plant) => (
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
