'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { EyeIcon, HeartIcon, PackageIcon } from '@/components/Icons';
import { fetchListingAnalytics, ApiError, type ListingAnalytics } from '@/lib/api';

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function ListingAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<ListingAnalytics | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    fetchListingAnalytics(id, token)
      .then(setAnalytics)
      .catch(() => setAnalytics(null));
  }, [token, id]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы посмотреть аналитику</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  if (analytics === undefined) {
    return <LoadingSpinner text="Загрузка аналитики..." />;
  }

  if (analytics === null) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Аналитика недоступна</h1>
        <p className="text-sm text-gray-500 mb-6">Либо объявление не найдено, либо оно принадлежит другому продавцу.</p>
        <Link href="/listings/mine" className="btn-primary inline-block">
          Мои объявления
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-xl lg:max-w-2xl md:mx-auto">
      <PageHeader title="Аналитика объявления" fallbackHref="/listings/mine" className="mb-6" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<EyeIcon size={18} />} label="Просмотры за 7 дней" value={analytics.views7d} />
        <StatCard icon={<EyeIcon size={18} />} label="Просмотры за 30 дней" value={analytics.views30d} />
        <StatCard icon={<HeartIcon size={18} />} label="В избранном" value={analytics.favoritesCount} />
        <StatCard icon={<PackageIcon size={18} />} label="Переходов по оплате" value={analytics.paymentClicks} />
      </div>
    </div>
  );
}
