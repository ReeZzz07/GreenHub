'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { MyListings } from '@/components/MyListings';
import { PageHeader } from '@/components/PageHeader';
import { UserRole } from '@/types';

const SELLER_ROLES: UserRole[] = [UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN];

export default function MyListingsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated || !user || !SELLER_ROLES.includes(user.role)) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Доступно только продавцам</h1>
        <p className="text-sm text-gray-500 mb-6">
          Войдите под учётной записью продавца, чтобы управлять своими объявлениями.
        </p>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-4 lg:max-w-4xl lg:mx-auto">
      <PageHeader title="Мои объявления" fallbackHref="/profile" />

      <MyListings />
    </div>
  );
}
