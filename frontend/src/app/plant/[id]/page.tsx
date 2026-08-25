import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { StarIcon } from '@/components/Icons';
import { PlantActions } from '@/components/PlantActions';
import { mockPlants } from '@/data/mockPlants';

interface PlantDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getPlant(id: string) {
  return mockPlants.find((p) => p.id === id);
}

export async function generateMetadata({ params }: PlantDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const plant = await getPlant(id);
  if (!plant) return { title: 'Растение не найдено — GreenHub' };
  return {
    title: `${plant.name} — GreenHub`,
    description: plant.description,
  };
}

export default async function PlantDetailPage({ params }: PlantDetailPageProps) {
  const { id } = await params;
  const plant = await getPlant(id);

  if (!plant) {
    notFound();
  }

  return (
    <div className="animate-fade-in">
      <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 relative">
        <img src={plant.images[0]} alt={plant.name} className="w-full h-full object-cover" />
        {!plant.inStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-semibold text-sm">
              Нет в наличии
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-800">{plant.name}</h1>
        <p className="text-sm text-gray-500 italic mb-2">{plant.latinName}</p>

        <div className="flex items-center gap-1 mb-4">
          <StarIcon size={16} filled className="text-amber-400" />
          <span className="text-sm font-medium text-gray-700">{plant.rating.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({plant.reviewsCount} отзывов)</span>
        </div>

        <p className="text-2xl font-bold text-green-700 mb-4">
          {plant.price.toLocaleString('ru-RU')} ₽
        </p>

        <p className="text-gray-600 mb-6">{plant.description}</p>

        {plant.careInstructions && plant.careInstructions.length > 0 && (
          <div className="card p-4 mb-6">
            <h2 className="font-semibold text-gray-800 mb-3">Уход</h2>
            <ul className="space-y-2">
              {plant.careInstructions.map((instruction) => (
                <li key={instruction} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">Продавец: {plant.sellerName}</p>

        <PlantActions plant={plant} />
      </div>
    </div>
  );
}
