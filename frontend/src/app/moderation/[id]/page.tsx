'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeftIcon, XIcon } from '@/components/Icons';
import {
  fetchListingForReview,
  moderateListing,
  ApiError,
  type Listing,
  type ListingStatus,
} from '@/lib/api';
import { UserRole } from '@/types';

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
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const canModerate = !!user && MODERATOR_ROLES.includes(user.role);

  useEffect(() => {
    if (!canModerate || !token) return;
    fetchListingForReview(id, token)
      .then((data) => {
        setListing(data);
        setActiveImage(0);
      })
      .catch(() => setListing(null));
  }, [canModerate, token, id]);

  useEffect(() => {
    if (!isLightboxOpen || !listing) return;
    const total = listing.images.length;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') setActiveImage((prev) => (prev - 1 + total) % total);
      if (e.key === 'ArrowRight') setActiveImage((prev) => (prev + 1) % total);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isLightboxOpen, listing]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated || !canModerate) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
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
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Объявление не найдено</h1>
        <Link href="/moderation" className="btn-primary inline-block">
          Вернуться к очереди
        </Link>
      </div>
    );
  }

  const status = STATUS_LABELS[listing.status];

  return (
    <div className="animate-fade-in pb-24">
      <div className="flex items-center gap-3 p-4">
        <Link href="/moderation" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeftIcon size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Проверка объявления</h1>
      </div>

      <div className="px-4">
        <div
          className="aspect-square bg-gradient-to-br from-green-50 to-green-100 relative rounded-2xl overflow-hidden cursor-zoom-in group"
          onClick={() => setIsLightboxOpen(true)}
        >
          {listing.images[activeImage] && (
            <img
              src={listing.images[activeImage]}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          )}
        </div>
      </div>

      {listing.images.length > 1 && (
        <div className="flex gap-2 p-4 overflow-x-auto">
          {listing.images.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImage(index)}
              className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                index === activeImage
                  ? 'ring-2 ring-green-600 ring-offset-2'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img src={url} alt={listing.title} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {isLightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              aria-label="Закрыть"
            >
              <XIcon size={24} />
            </button>

            {listing.images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                  aria-label="Предыдущее фото"
                >
                  <ArrowLeftIcon size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImage((prev) => (prev + 1) % listing.images.length);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
                  aria-label="Следующее фото"
                >
                  <ArrowLeftIcon size={24} className="rotate-180" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm z-10">
                  {activeImage + 1} / {listing.images.length}
                </div>
              </>
            )}

            {listing.images[activeImage] && (
              <img
                src={listing.images[activeImage]}
                alt={listing.title}
                onClick={(e) => e.stopPropagation()}
                className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </div>,
          document.body,
        )}

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
          {listing.lightRequirements && <p>Освещение: <span className="text-gray-800">{listing.lightRequirements}</span></p>}
          {listing.waterRequirements && <p>Полив: <span className="text-gray-800">{listing.waterRequirements}</span></p>}
        </div>

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
