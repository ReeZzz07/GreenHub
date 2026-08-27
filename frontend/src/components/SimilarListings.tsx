'use client';

import { useRouter } from 'next/navigation';
import { PlantCard } from './PlantCard';
import { Plant } from '@/types/models';

interface SimilarListingsProps {
  plants: Plant[];
  title?: string;
}

export function SimilarListings({ plants, title = 'Похожие объявления' }: SimilarListingsProps) {
  const router = useRouter();

  if (plants.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <h2 className="font-display font-bold text-gray-900 mb-3">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {plants.map((plant) => (
          <PlantCard key={plant.id} plant={plant} onClick={() => router.push(`/plant/${plant.id}`)} />
        ))}
      </div>
    </div>
  );
}
