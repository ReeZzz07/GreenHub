'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';
import {
  fetchMyListings,
  deleteListing,
  updateListingAvailability,
  ApiError,
  type Listing,
  type ListingStatus,
} from '@/lib/api';
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
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleAvailability = async (id: string, action: 'mark_sold' | 'relist') => {
    if (!token) return;
    setProcessingId(id);
    try {
      await updateListingAvailability(id, action, token);
      showToast(action === 'mark_sold' ? 'Объявление помечено проданным' : 'Объявление снова в продаже', 'success');
      load();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось изменить статус', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-end mb-3">
        <Link href="/listings/new" className="text-blue-600 text-sm font-medium hover:text-blue-700">
          + Новое
        </Link>
      </div>

      {listings === null ? (
        <p className="text-sm text-gray-400">Загрузка...</p>
      ) : listings.length === 0 ? (
        <p className="text-sm text-gray-500">Пока нет объявлений</p>
      ) : (
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {listings.map((listing) => {
            const status = STATUS_LABELS[listing.status];
            return (
              <div key={listing.id} className="card p-3">
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

                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Редактировать
                  </Link>

                  {listing.status === 'PUBLISHED' && (
                    <button
                      onClick={() => handleAvailability(listing.id, 'mark_sold')}
                      disabled={processingId === listing.id}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      Пометить проданным
                    </button>
                  )}
                  {listing.status === 'SOLD' && (
                    <button
                      onClick={() => handleAvailability(listing.id, 'relist')}
                      disabled={processingId === listing.id}
                      className="text-xs font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                    >
                      Вернуть в продажу
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="ml-auto p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors flex-shrink-0"
                    aria-label="Удалить объявление"
                  >
                    <TrashIcon size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
