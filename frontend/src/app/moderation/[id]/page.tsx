'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { ImageGallery } from '@/components/ImageGallery';
import {
  fetchListingForReview,
  moderateListing,
  ApiError,
  type Listing,
  type ListingStatus,
} from '@/lib/api';
import { UserRole } from '@/types';
import { LISTING_REJECTION_REASONS } from '@/lib/rejection-reasons';

const MODERATOR_ROLES: UserRole[] = [UserRole.MODERATOR, UserRole.ADMIN];

const STATUS_LABELS: Record<ListingStatus, { label: string; className: string }> = {
  PENDING_MODERATION: { label: 'На модерации', className: 'badge-warning' },
  PUBLISHED: { label: 'Опубликовано', className: 'badge-success' },
  REJECTED: { label: 'Отклонено', className: 'bg-red-100 text-red-800' },
  SOLD: { label: 'Продано', className: 'badge-info' },
};

export default function ModerationListingReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [listing, setListing] = useState<Listing | null | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [reason, setReason] = useState('');

  const canModerate = !!user && MODERATOR_ROLES.includes(user.role);

  useEffect(() => {
    if (!canModerate || !token) return;
    fetchListingForReview(id, token)
      .then(setListing)
      .catch(() => setListing(null));
  }, [canModerate, token, id]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated || !canModerate) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Доступно только модераторам</h1>
        <p className="text-sm text-gray-500 mb-6">
          Войдите под учётной записью модератора или администратора.
        </p>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!token || !listing) return;
    setIsProcessing(true);
    try {
      const updated = await moderateListing(listing.id, { action: 'approve' }, token);
      setListing(updated);
      showToast(`«${listing.title}» опубликовано`, 'success');
      router.push('/moderation');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось одобрить', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!token || !listing) return;
    setIsProcessing(true);
    try {
      await moderateListing(listing.id, { action: 'reject', reason }, token);
      showToast(`«${listing.title}» отклонено`, 'success');
      router.push('/moderation');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось отклонить', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (listing === undefined) {
    return <LoadingSpinner text="Загрузка объявления..." />;
  }

  if (listing === null) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Объявление не найдено</h1>
        <Link href="/moderation" className="btn-primary inline-block">
          Вернуться к очереди
        </Link>
      </div>
    );
  }

  const status = STATUS_LABELS[listing.status];

  return (
    <div className="animate-fade-in pb-24 md:max-w-xl lg:max-w-2xl md:mx-auto">
      <PageHeader title="Проверка объявления" fallbackHref="/moderation" className="p-4" />

      <ImageGallery images={listing.images} alt={listing.title} variant="card" />

      <div className="p-4">
        <span className={`badge ${status.className} mb-2`}>{status.label}</span>

        <h2 className="text-2xl font-bold text-gray-800">{listing.title}</h2>
        {listing.latinName && <p className="text-sm text-gray-500 italic mb-2">{listing.latinName}</p>}

        <p className="text-2xl font-bold text-green-700 mb-4 mt-2">
          {listing.price.toLocaleString('ru-RU')} ₽ <span className="text-sm text-gray-400 font-normal">× {listing.quantity} шт.</span>
        </p>

        <p className="text-gray-600 mb-6 whitespace-pre-line">{listing.description}</p>

        {listing.careInstructions.length > 0 && (
          <div className="card p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Уход</h3>
            <ul className="space-y-2">
              {listing.careInstructions.map((instruction) => (
                <li key={instruction} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {instruction}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="card p-4 mb-6 space-y-1 text-sm text-gray-600">
          <p>Категория: <span className="text-gray-800">{listing.category.name}</span></p>
          <p>Продавец: <span className="text-gray-800">{listing.seller.name}</span></p>
          <p>Просмотров: <span className="text-gray-800">{listing.views}</span></p>
          {listing.lightRequirements && <p>Освещение: <span className="text-gray-800">{listing.lightRequirements}</span></p>}
          {listing.waterRequirements && <p>Полив: <span className="text-gray-800">{listing.waterRequirements}</span></p>}
        </div>

        {listing.category.requiresPhytosanitaryCertificate && (
          <div
            className={`card p-4 mb-6 ${
              listing.certificateUrl ? 'border border-green-200' : 'border border-red-200'
            }`}
          >
            <h3 className="font-semibold text-gray-800 mb-2">Фитосанитарный сертификат</h3>
            {listing.certificateUrl ? (
              <a
                href={listing.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Открыть файл для проверки →
              </a>
            ) : (
              <p className="text-sm text-red-600">
                Категория требует сертификат, но продавец его не приложил
              </p>
            )}
          </div>
        )}

        {listing.status === 'REJECTED' && listing.rejectionReason && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            Причина отклонения: {listing.rejectionReason}
          </div>
        )}

        {listing.status === 'PENDING_MODERATION' && (
          <div className="flex gap-2">
            <Button fullWidth onClick={handleApprove} isLoading={isProcessing}>
              Одобрить
            </Button>
            <Button
              fullWidth
              variant="danger"
              onClick={() => {
                setReason('');
                setIsRejectOpen(true);
              }}
              disabled={isProcessing}
            >
              Отклонить
            </Button>
          </div>
        )}
      </div>

      <Modal isOpen={isRejectOpen} onClose={() => setIsRejectOpen(false)} title="Причина отклонения">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">«{listing.title}»</p>
          <div className="flex flex-wrap gap-2">
            {LISTING_REJECTION_REASONS.map((template) => (
              <button
                key={template}
                type="button"
                onClick={() => setReason(template)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  reason === template
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-red-300'
                }`}
              >
                {template}
              </button>
            ))}
          </div>
          <textarea
            required
            minLength={3}
            rows={3}
            placeholder="Например: некачественное фото, неверная категория..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="input-field"
          />
          <Button
            fullWidth
            variant="danger"
            onClick={confirmReject}
            isLoading={isProcessing}
            disabled={reason.trim().length < 3}
          >
            Отклонить объявление
          </Button>
        </div>
      </Modal>
    </div>
  );
}
