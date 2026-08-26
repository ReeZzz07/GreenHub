'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { ListingForm } from '@/components/ListingForm';
import { fetchMyListings, type Listing } from '@/lib/api';

export default function EditListingPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Загрузка..." />}>
      <EditListingGuard />
    </Suspense>
  );
}

function EditListingGuard() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [listing, setListing] = useState<Listing | null | undefined>(undefined);

  useEffect(() => {
    if (!token) return;
    fetchMyListings(token)
      .then((listings) => setListing(listings.find((item) => item.id === id) ?? null))
      .catch(() => setListing(null));
  }, [token, id]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы редактировать объявление</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  if (listing === undefined) {
    return <LoadingSpinner text="Загрузка объявления..." />;
  }

  if (listing === null) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Объявление не найдено</h1>
        <p className="text-sm text-gray-500 mb-6">Либо оно не существует, либо принадлежит другому продавцу.</p>
        <Link href="/listings/mine" className="btn-primary inline-block">
          Мои объявления
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-6">
      <PageHeader title="Редактирование объявления" fallbackHref="/listings/mine" className="mb-6" />
      <ListingForm mode="edit" listingId={listing.id} initial={listing} />
    </div>
  );
}
