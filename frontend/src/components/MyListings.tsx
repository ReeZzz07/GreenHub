'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';
import { fetchMyListings, deleteListing, ApiError, type Listing, type ListingStatus } from '@/lib/api';
import { TrashIcon } from './Icons';

const STATUS_LABELS: Record<ListingStatus, { label: string; className: string }> = {
  PENDING_MODERATION: { label: 'На модерации', className: 'badge-warning' },
  PUBLISHED: { label: 'Опубликовано', className: 'badge-success' },
  REJECTED: { label: 'Отклонено', className: 'bg-red-100 text-red-800' },
  SOLD: { label: 'Продано', className: 'badge-info' },
};

export function MyListings() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[] | null>(null);

  const load = () => {
    if (!token) return;
    fetchMyListings(token)
      .then(setListings)
      .catch(() => setListings([]));
  };

  useEffect(load, [token]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await deleteListing(id, token);
      showToast('Объявление удалено', 'success');
      load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось удалить', 'error');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Мои объявления</h2>
        <Link href="/listings/new" className="text-green-600 text-sm font-medium hover:text-green-700">
          + Новое
        </Link>
      </div>

      {listings === null ? (
        <p className="text-sm text-gray-400">Загрузка...</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-gray-500">Пока нет объявлений</p>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => {
            const status = STATUS_LABELS[listing.status];
            return (
              <div key={listing.id} className="card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{listing.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${status.className} text-xs`}>{status.label}</span>
                    <span className="text-sm text-green-700 font-semibold">
                      {listing.price.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  {listing.status === 'REJECTED' && listing.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">{listing.rejectionReason}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(listing.id)}
                  className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors flex-shrink-0"
                  aria-label="Удалить объявление"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
