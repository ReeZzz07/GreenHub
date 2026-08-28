'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SellerListings } from './SellerListings';
import { SellerReviews } from '../SellerReviews';
import type { Review } from '@/lib/api';
import { Plant } from '@/types/models';

type TabId = 'listings' | 'reviews';

interface SellerTabsProps {
  sellerId: string;
  initialItems: Plant[];
  initialTotal: number;
  reviews: Review[];
  reviewsCount: number;
}

function SellerTabsInner({ sellerId, initialItems, initialTotal, reviews, reviewsCount }: SellerTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabId>(searchParams.get('tab') === 'reviews' ? 'reviews' : 'listings');

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
    // Пишем выбор вкладки в URL (без скролла и без записи в историю) — так на неё можно дать прямую ссылку,
    // например из уведомления о новом отзыве.
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'listings') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  return (
    <div>
      <div className="sticky top-16 z-30 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 mb-4">
        <div className="flex gap-1 px-4 lg:max-w-3xl lg:mx-auto">
          <button
            onClick={() => selectTab('listings')}
            className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'listings'
                ? 'text-gray-800 border-green-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Объявления
          </button>
          <button
            onClick={() => selectTab('reviews')}
            className={`px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'text-gray-800 border-green-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
          >
            Отзывы{reviewsCount > 0 && ` (${reviewsCount})`}
          </button>
        </div>
      </div>

      {activeTab === 'listings' ? (
        <SellerListings sellerId={sellerId} initialItems={initialItems} initialTotal={initialTotal} />
      ) : (
        <div className="px-4 pb-6 lg:max-w-3xl lg:mx-auto">
          <SellerReviews sellerId={sellerId} reviews={reviews} />
        </div>
      )}
    </div>
  );
}

export function SellerTabs(props: SellerTabsProps) {
  return (
    <Suspense fallback={null}>
      <SellerTabsInner {...props} />
    </Suspense>
  );
}
