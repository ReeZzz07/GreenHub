'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { PlantCard } from '@/components/PlantCard';
import { fetchFavorites } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';
import { Plant } from '@/types/models';

export default function FavoritesPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { isFavorite } = useFavorites();
  const [allPlants, setAllPlants] = useState<Plant[] | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchFavorites(token)
      .then((listings) => setAllPlants(listings.map(listingToPlant)))
      .catch(() => setAllPlants([]));
  }, [token]);

  // фильтруем по живому состоянию контекста, чтобы снятие с избранного сразу убирало карточку без перезагрузки
  const plants = allPlants?.filter((plant) => isFavorite(plant.id)) ?? null;

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы увидеть избранное</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-4">
      <PageHeader title="Избранное" fallbackHref="/profile" />

      {plants === null ? (
        <LoadingSpinner text="Загрузка избранного..." />
      ) : plants.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Пока ничего не добавлено</p>
          <Link href="/catalog" className="btn-primary inline-block">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plants.map((plant) => (
            <PlantCard key={plant.id} plant={plant} onClick={() => router.push(`/plant/${plant.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
