import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { PlantActions } from '@/components/PlantActions';
import { BackButton } from '@/components/PageHeader';
import { ImageGallery } from '@/components/ImageGallery';
import { SimilarListings } from '@/components/SimilarListings';
import { ShareButton } from '@/components/ShareButton';
import { EyeIcon, StarIcon } from '@/components/Icons';
import { fetchListing, fetchSimilarListings, fetchSellerSummary, fetchCategories, ApiError } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';

function formatDate(date: Date) {
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface PlantDetailPageProps {
  params: Promise<{ id: string }>;
}

async function getPlant(id: string) {
  try {
    return listingToPlant(await fetchListing(id));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
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

  const [similarListings, seller, categories] = await Promise.all([
    fetchSimilarListings(id)
      .then((listings) => listings.map(listingToPlant))
      .catch(() => []),
    fetchSellerSummary(plant.sellerId).catch(() => undefined),
    fetchCategories().catch(() => []),
  ]);

  const category = categories.find((c) => c.slug === plant.category);

  return (
    <div className="animate-fade-in pt-4">
      <div className="px-4 mb-3 flex items-center justify-between gap-2">
        <BackButton fallbackHref="/catalog" />
        <ShareButton title={plant.name} className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors" />
      </div>

      <div className="px-4 mb-4 flex items-center gap-1.5 text-xs text-gray-400 overflow-x-auto whitespace-nowrap">
        <Link href="/catalog" className="hover:text-blue-600 transition-colors">Каталог</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/catalog?category=${category.slug}`} className="hover:text-blue-600 transition-colors">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-500 truncate">{plant.name}</span>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-2 lg:items-start">
        <div className="lg:sticky lg:top-20">
          <ImageGallery
            images={plant.images}
            alt={plant.name}
            variant="card"
            overlay={
              !plant.inStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-semibold text-sm">
                    Нет в наличии
                  </span>
                </div>
              )
            }
          />
        </div>

        <div className="p-4">
          <h1 className="font-display text-2xl font-bold text-gray-900">{plant.name}</h1>
          {plant.latinName && <p className="text-sm text-gray-500 italic mb-2">{plant.latinName}</p>}

          <div className="flex items-center justify-between mb-1 mt-2">
            <p className="font-display text-2xl font-bold text-gray-900">{plant.price.toLocaleString('ru-RU')} ₽</p>
            <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
              <EyeIcon size={14} />
              {plant.views}
            </span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Опубликовано {formatDate(plant.createdAt)}</p>

          <p className="text-gray-600 mb-6">{plant.description}</p>

          <div className="card p-4 mb-6">
            <h2 className="font-display font-semibold text-gray-900 mb-3">Характеристики</h2>
            <dl className="space-y-2 text-sm">
              {category && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Категория</dt>
                  <dd className="text-gray-700 font-medium text-right">{category.name}</dd>
                </div>
              )}
              {plant.lightRequirements && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Освещение</dt>
                  <dd className="text-gray-700 font-medium text-right">{plant.lightRequirements}</dd>
                </div>
              )}
              {plant.waterRequirements && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-gray-500">Полив</dt>
                  <dd className="text-gray-700 font-medium text-right">{plant.waterRequirements}</dd>
                </div>
              )}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-gray-500">Наличие</dt>
                <dd className="text-gray-700 font-medium text-right">
                  {plant.inStock ? `В наличии: ${plant.quantity} шт.` : 'Нет в наличии'}
                </dd>
              </div>
            </dl>
          </div>

          {plant.careInstructions && plant.careInstructions.length > 0 && (
            <div className="card p-4 mb-6">
              <h2 className="font-display font-semibold text-gray-900 mb-3">Уход</h2>
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

          {plant.deliveryInfo && (
            <div className="card p-4 mb-6">
              <h2 className="font-display font-semibold text-gray-900 mb-3">Доставка</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line">{plant.deliveryInfo}</p>
            </div>
          )}

          {plant.videos && plant.videos.length > 0 && (
            <div className="mb-6">
              <h2 className="font-display font-semibold text-gray-900 mb-3">Видео</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {plant.videos.map((url) => (
                  <video
                    key={url}
                    src={url}
                    className="w-40 h-40 rounded-2xl object-cover flex-shrink-0 bg-gray-900"
                    autoPlay
                    muted
                    loop
                    playsInline
                    controls
                  />
                ))}
              </div>
            </div>
          )}

          <Link
            href={`/seller/${plant.sellerId}`}
            className="flex items-center justify-between mb-6 p-3 rounded-2xl bg-[var(--color-surface)] hover:bg-green-50 transition-colors"
          >
            <span className="text-sm text-gray-700">Продавец: <span className="font-medium">{plant.sellerName}</span></span>
            {seller && seller.reviewsCount > 0 && (
              <span className="flex items-center gap-1 text-sm text-gray-600 flex-shrink-0">
                <StarIcon size={14} filled className="text-amber-400" />
                {seller.avgRating.toFixed(1)}
                <span className="text-xs text-gray-400">({seller.reviewsCount})</span>
              </span>
            )}
          </Link>

          <PlantActions plant={plant} />
        </div>
      </div>

      <SimilarListings plants={similarListings} />
    </div>
  );
}
