import { Plant } from '@/types/models';
import { Listing } from './api';

// Переходное решение: пока нет системы отзывов/рейтингов на бэкенде,
// адаптируем Listing к существующему типу Plant, оставляя rating/reviewsCount нулевыми.
export function listingToPlant(listing: Listing): Plant {
  return {
    id: listing.id,
    name: listing.title,
    latinName: listing.latinName ?? '',
    description: listing.description,
    price: listing.price,
    images: listing.images,
    videos: listing.videos,
    category: listing.category.slug,
    sellerId: listing.sellerId,
    sellerName: listing.seller.name,
    inStock: listing.quantity > 0,
    quantity: listing.quantity,
    rating: 0,
    reviewsCount: 0,
    views: listing.views,
    aiGenerated: false,
    careInstructions: listing.careInstructions,
    lightRequirements: listing.lightRequirements ?? undefined,
    waterRequirements: listing.waterRequirements ?? undefined,
    deliveryInfo: listing.deliveryInfo ?? undefined,
    createdAt: new Date(listing.createdAt),
  };
}
