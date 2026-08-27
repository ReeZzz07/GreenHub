'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { fetchMyOrders, type Order, type OrderStatus } from '@/lib/api';

const STATUS_LABELS: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: 'Ожидает оплаты', className: 'badge-warning' },
  PAID: { label: 'Оплачено', className: 'badge-success' },
  CANCELLED: { label: 'Отменено', className: 'bg-red-100 text-red-800' },
  EXPIRED: { label: 'Истекло', className: 'bg-gray-100 text-gray-500' },
};

export default function OrdersPage() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchMyOrders(token)
      .then(setOrders)
      .catch(() => setOrders([]));
  }, [token]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Войдите, чтобы увидеть заказы</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-4 lg:max-w-3xl lg:mx-auto">
      <PageHeader title="Мои заказы" fallbackHref="/profile" />

      {orders === null ? (
        <LoadingSpinner text="Загрузка заказов..." />
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Заказов пока нет</p>
          <Link href="/catalog" className="btn-primary inline-block">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-3 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {orders.map((order) => {
            const status = STATUS_LABELS[order.status];
            return (
              <Link key={order.id} href={`/orders/${order.id}`} className="block">
                <div className="card p-3 flex items-center gap-3 hover:shadow-lg transition-shadow">
                  <div className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
                    {order.listing.images[0] && (
                      <Image
                        src={order.listing.images[0]}
                        alt={order.listing.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate">{order.listing.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`badge ${status.className} text-xs`}>{status.label}</span>
                      <span className="text-sm text-green-700 font-semibold">
                        {order.amount.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
