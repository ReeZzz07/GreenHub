'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { ListingForm } from '@/components/ListingForm';
import { UserRole } from '@/types';

const SELLER_ROLES: UserRole[] = [UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN];

export default function NewListingPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Загрузка..." />}>
      <NewListingGuard />
    </Suspense>
  );
}

function NewListingGuard() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const canSell = !!user && SELLER_ROLES.includes(user.role);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated || !canSell) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Доступно только продавцам</h1>
        <p className="text-sm text-gray-500 mb-6">
          Чтобы разместить объявление, войдите как продавец (физ. лицо или юр. лицо).
        </p>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-xl lg:max-w-2xl md:mx-auto">
      <PageHeader title="Новое объявление" fallbackHref="/listings/mine" className="mb-6" />
      <ListingForm mode="create" />
    </div>
  );
}
