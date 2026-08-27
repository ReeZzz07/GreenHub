'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { BackButton } from '@/components/PageHeader';
import { StarIcon } from '@/components/Icons';
import { fetchOrder, createReview, ApiError, type Order, type Review } from '@/lib/api';

const STATUS_TEXT: Record<Order['status'], string> = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачено',
  CANCELLED: 'Отменено',
  EXPIRED: 'Истекло',
};

const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 3000;

function ReviewForm({ orderId, onSubmitted }: { orderId: string; onSubmitted: (review: Review) => void }) {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!token || rating === 0) return;
    setIsSubmitting(true);
    try {
      const review = await createReview(orderId, { rating, comment: comment || undefined }, token);
      onSubmitted(review);
      showToast('Спасибо за отзыв!', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось отправить отзыв', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="font-semibold text-gray-800 mb-3">Оцените продавца</p>
      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} звёзд`}>
            <StarIcon size={28} filled={star <= rating} className={star <= rating ? 'text-amber-400' : 'text-gray-300'} />
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        placeholder="Комментарий (необязательно)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="input-field mb-3"
      />
      <Button fullWidth isLoading={isSubmitting} disabled={rating === 0} onClick={handleSubmit}>
        Отправить отзыв
      </Button>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchOrder(id, token);
        if (cancelled) return;
        setOrder(data);

        // Вебхук от ЮKassa может прийти чуть позже редиректа — опрашиваем статус несколько раз
        if (data.status === 'PENDING' && attemptsRef.current < POLL_ATTEMPTS) {
          attemptsRef.current += 1;
          setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Не удалось загрузить заказ');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы увидеть заказ</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!order) {
    return <LoadingSpinner text="Загрузка заказа..." />;
  }

  return (
    <div className="animate-fade-in px-4 py-4 md:max-w-md md:mx-auto">
      <BackButton fallbackHref="/orders" className="mb-2" />

      <div className="text-center py-2">
        <div className="relative w-20 h-20 rounded-xl bg-gradient-to-br from-green-50 to-green-100 mx-auto mb-4 overflow-hidden">
          {order.listing.images[0] && (
            <Image src={order.listing.images[0]} alt={order.listing.title} fill sizes="80px" className="object-cover" />
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-1">{order.listing.title}</h1>
        <p className="text-2xl font-bold text-green-700 mb-4">{order.amount.toLocaleString('ru-RU')} ₽</p>

        <div
          className={`inline-block px-4 py-2 rounded-full font-semibold mb-6 ${
            order.status === 'PAID'
              ? 'bg-green-100 text-green-800'
              : order.status === 'PENDING'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {STATUS_TEXT[order.status]}
        </div>

        {order.status === 'PENDING' && (
          <p className="text-sm text-gray-500 mb-6">
            Ждём подтверждения от ЮKassa — статус обновится автоматически
          </p>
        )}

        {order.status === 'PAID' && (
          <div className="text-left mb-6">
            {order.review ? (
              <div className="card p-4">
                <p className="font-semibold text-gray-800 mb-2">Ваш отзыв</p>
                <div className="flex gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon
                      key={star}
                      size={16}
                      filled={star <= order.review!.rating}
                      className="text-amber-400"
                    />
                  ))}
                </div>
                {order.review.comment && <p className="text-sm text-gray-600">{order.review.comment}</p>}
                {order.review.sellerReply && (
                  <div className="mt-3 p-3 rounded-xl bg-gray-50 text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-1">Ответ продавца</p>
                    {order.review.sellerReply}
                  </div>
                )}
              </div>
            ) : (
              <ReviewForm orderId={order.id} onSubmitted={(review) => setOrder({ ...order, review })} />
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Link href="/orders" className="btn-secondary block">
            Мои заказы
          </Link>
          <Link href="/catalog" className="text-blue-600 text-sm font-medium">
            Продолжить покупки
          </Link>
        </div>
      </div>
    </div>
  );
}
