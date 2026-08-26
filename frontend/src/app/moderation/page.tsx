'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import {
  fetchModerationQueue,
  moderateListing,
  fetchVerificationQueue,
  moderateVerification,
  ApiError,
  type Listing,
  type ApiUser,
} from '@/lib/api';
import { UserRole } from '@/types';

const MODERATOR_ROLES: UserRole[] = [UserRole.MODERATOR, UserRole.ADMIN];

export default function ModerationPage() {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [queue, setQueue] = useState<Listing[] | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Listing | null>(null);
  const [reason, setReason] = useState('');

  const [userQueue, setUserQueue] = useState<ApiUser[] | null>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [rejectUserTarget, setRejectUserTarget] = useState<ApiUser | null>(null);
  const [userReason, setUserReason] = useState('');

  const canModerate = !!user && MODERATOR_ROLES.includes(user.role);

  const load = () => {
    if (!token) return;
    fetchModerationQueue(token)
      .then(setQueue)
      .catch(() => setQueue([]));
    fetchVerificationQueue(token)
      .then(setUserQueue)
      .catch(() => setUserQueue([]));
  };

  useEffect(() => {
    if (canModerate) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canModerate, token]);

  const handleApproveUser = async (target: ApiUser) => {
    if (!token) return;
    setProcessingUserId(target.id);
    try {
      await moderateVerification(target.id, { action: 'approve' }, token);
      showToast(`Email для «${target.name}» подтверждён`, 'success');
      setUserQueue((prev) => prev?.filter((item) => item.id !== target.id) ?? null);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось одобрить', 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  const openRejectUser = (target: ApiUser) => {
    setRejectUserTarget(target);
    setUserReason('');
  };

  const confirmRejectUser = async () => {
    if (!token || !rejectUserTarget) return;
    setProcessingUserId(rejectUserTarget.id);
    try {
      await moderateVerification(rejectUserTarget.id, { action: 'reject', reason: userReason }, token);
      showToast(`Запрос «${rejectUserTarget.name}» отклонён`, 'success');
      setUserQueue((prev) => prev?.filter((item) => item.id !== rejectUserTarget.id) ?? null);
      setRejectUserTarget(null);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось отклонить', 'error');
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleApprove = async (listing: Listing) => {
    if (!token) return;
    setProcessingId(listing.id);
    try {
      await moderateListing(listing.id, { action: 'approve' }, token);
      showToast(`«${listing.title}» опубликовано`, 'success');
      setQueue((prev) => prev?.filter((item) => item.id !== listing.id) ?? null);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось одобрить', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const openReject = (listing: Listing) => {
    setRejectTarget(listing);
    setReason('');
  };

  const confirmReject = async () => {
    if (!token || !rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await moderateListing(rejectTarget.id, { action: 'reject', reason }, token);
      showToast(`«${rejectTarget.title}» отклонено`, 'success');
      setQueue((prev) => prev?.filter((item) => item.id !== rejectTarget.id) ?? null);
      setRejectTarget(null);
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось отклонить', 'error');
    } finally {
      setProcessingId(null);
    }
  };

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

  return (
    <div className="animate-fade-in px-4 py-4 lg:max-w-4xl lg:mx-auto">
      <PageHeader title="Модерация объявлений" fallbackHref="/profile" />

      {userQueue === null ? (
        <LoadingSpinner text="Загрузка очереди..." />
      ) : userQueue.length > 0 ? (
        <div className="mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Смена email на проверке</h2>
          <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {userQueue.map((target) => (
            <div key={target.id} className="card p-4">
              <p className="font-semibold text-gray-800">{target.name}</p>
              <p className="text-sm text-gray-500">
                {target.email} → <span className="text-gray-800">{target.pendingEmail}</span>
              </p>
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  fullWidth
                  onClick={() => handleApproveUser(target)}
                  isLoading={processingUserId === target.id}
                >
                  Одобрить
                </Button>
                <Button
                  size="sm"
                  fullWidth
                  variant="danger"
                  onClick={() => openRejectUser(target)}
                  disabled={processingUserId === target.id}
                >
                  Отклонить
                </Button>
              </div>
            </div>
          ))}
          </div>
        </div>
      ) : null}

      {queue === null ? (
        <LoadingSpinner text="Загрузка очереди..." />
      ) : queue.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Очередь пуста</p>
      ) : (
        <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
          {queue.map((listing) => (
            <div key={listing.id} className="card p-4">
              <Link href={`/moderation/${listing.id}`} className="flex gap-3">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
                  {listing.images[0] && (
                    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 truncate">{listing.title}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    {listing.category.name} · от {listing.seller.name}
                  </p>
                  <p className="text-green-700 font-bold text-sm mt-1">
                    {listing.price.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </Link>

              <p className="text-sm text-gray-600 mt-3 line-clamp-3">{listing.description}</p>

              <Link
                href={`/moderation/${listing.id}`}
                className="text-green-600 text-sm font-medium hover:text-green-700 inline-block mt-2"
              >
                Открыть карточку →
              </Link>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  fullWidth
                  onClick={() => handleApprove(listing)}
                  isLoading={processingId === listing.id}
                >
                  Одобрить
                </Button>
                <Button
                  size="sm"
                  fullWidth
                  variant="danger"
                  onClick={() => openReject(listing)}
                  disabled={processingId === listing.id}
                >
                  Отклонить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Причина отклонения">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">«{rejectTarget?.title}»</p>
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
            isLoading={processingId === rejectTarget?.id}
            disabled={reason.trim().length < 3}
          >
            Отклонить объявление
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!rejectUserTarget} onClose={() => setRejectUserTarget(null)} title="Причина отклонения">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{rejectUserTarget?.name} — {rejectUserTarget?.pendingEmail}</p>
          <textarea
            required
            minLength={3}
            rows={3}
            placeholder="Например: email уже используется, подозрительный домен..."
            value={userReason}
            onChange={(e) => setUserReason(e.target.value)}
            className="input-field"
          />
          <Button
            fullWidth
            variant="danger"
            onClick={confirmRejectUser}
            isLoading={processingUserId === rejectUserTarget?.id}
            disabled={userReason.trim().length < 3}
          >
            Отклонить запрос
          </Button>
        </div>
      </Modal>
    </div>
  );
}
