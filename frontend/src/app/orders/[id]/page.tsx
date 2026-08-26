'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { fetchOrder, ApiError, type Order } from '@/lib/api';

const STATUS_TEXT: Record<Order['status'], string> = {
  PENDING: 'Ожидает оплаты',
  PAID: 'Оплачено',
  CANCELLED: 'Отменено',
  EXPIRED: 'Истекло',
};

const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 3000;

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
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы увидеть заказ</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!order) {
    return <LoadingSpinner text="Загрузка заказа..." />;
  }

  return (
    <div className="animate-fade-in px-4 py-6 text-center">
      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-50 to-green-100 mx-auto mb-4 overflow-hidden">
        {order.listing.images[0] && (
          <img src={order.listing.images[0]} alt={order.listing.title} className="w-full h-full object-cover" />
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

      <div className="flex flex-col gap-2">
        <Link href="/orders" className="btn-secondary block">
          Мои заказы
        </Link>
        <Link href="/catalog" className="text-green-600 text-sm font-medium">
          Продолжить покупки
        </Link>
      </div>
    </div>
  );
}
