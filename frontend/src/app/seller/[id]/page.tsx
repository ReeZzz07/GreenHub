import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BackButton } from '@/components/PageHeader';
import { SimilarListings } from '@/components/SimilarListings';
import { SellerReviews } from '@/components/SellerReviews';
import { UserIcon, StarIcon } from '@/components/Icons';
import { fetchSellerSummary, fetchSellerReviews, fetchListings, ApiError } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';

const ROLE_LABELS: Record<string, string> = {
  SELLER_INDIVIDUAL: 'Частный продавец',
  SELLER_BUSINESS: 'Питомник / компания',
  ADMIN: 'Администрация',
  BUYER: 'Покупатель',
  MODERATOR: 'Модератор',
};

interface SellerPageProps {
  params: Promise<{ id: string }>;
}

async function getSeller(id: string) {
  try {
    return await fetchSellerSummary(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
}

export async function generateMetadata({ params }: SellerPageProps): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSeller(id);
  if (!seller) return { title: 'Продавец не найден — GreenHub' };
  return { title: `${seller.name} — продавец на GreenHub` };
}

export default async function SellerPage({ params }: SellerPageProps) {
  const { id } = await params;
  const seller = await getSeller(id);

  if (!seller) {
    notFound();
  }

  const [listingsPage, reviews] = await Promise.all([
    fetchListings({ sellerId: id, limit: 20 }).catch(() => ({ items: [], total: 0, page: 1, limit: 20 })),
    fetchSellerReviews(id).catch(() => []),
  ]);
  const plants = listingsPage.items.map(listingToPlant);
  const memberSinceYear = new Date(seller.createdAt).getFullYear();
  const maxBreakdown = Math.max(1, ...seller.breakdown.map((b) => b.count));

  return (
    <div className="animate-fade-in py-4">
      <div className="px-4">
        <BackButton fallbackHref="/catalog" className="mb-4" />
      </div>

      <div className="flex flex-col items-center text-center mb-6 px-4 lg:max-w-md lg:mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3 overflow-hidden">
          {seller.avatarUrl ? (
            <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" />
          ) : (
            <UserIcon size={40} className="text-green-600" />
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-800">{seller.name}</h1>
        <p className="text-sm text-gray-500">{ROLE_LABELS[seller.role] ?? seller.role}</p>
        <p className="text-xs text-gray-400 mt-1">На GreenHub с {memberSinceYear} года</p>

        {seller.reviewsCount > 0 && (
          <div className="flex items-center gap-1 mt-2">
            <StarIcon size={16} filled className="text-amber-400" />
            <span className="font-semibold text-gray-800">{seller.avgRating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({seller.reviewsCount})</span>
          </div>
        )}
      </div>

      {seller.reviewsCount > 0 && (
        <div className="card p-4 mb-6 mx-4 lg:max-w-md lg:mx-auto space-y-1.5">
          {seller.breakdown.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-3">{star}</span>
              <StarIcon size={12} filled className="text-amber-400" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full"
                  style={{ width: `${(count / maxBreakdown) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right">{count}</span>
            </div>
          ))}
        </div>
      )}

      <SimilarListings plants={plants} title="Объявления продавца" />

      <div className="px-4 lg:max-w-3xl lg:mx-auto">
        <h2 className="font-semibold text-gray-800 mb-3">Отзывы</h2>
        <SellerReviews sellerId={seller.id} reviews={reviews} />
      </div>
    </div>
  );
}
