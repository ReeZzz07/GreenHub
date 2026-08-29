'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { UserRole } from '@/types';
import {
  fetchSubscriptionPlans,
  fetchMySubscription,
  subscribeToPlan,
  ApiError,
  type SubscriptionPlan,
  type Subscription,
} from '@/lib/api';

const STATUS_LABELS: Record<Subscription['status'], { label: string; className: string }> = {
  PENDING: { label: 'Ожидает оплаты', className: 'badge-warning' },
  ACTIVE: { label: 'Активна', className: 'badge-success' },
  EXPIRED: { label: 'Истекла', className: 'bg-gray-100 text-gray-500' },
  CANCELLED: { label: 'Отменена', className: 'bg-red-100 text-red-800' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function SubscriptionPage() {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null | undefined>(undefined);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const isBusinessSeller = user?.role === UserRole.SELLER_BUSINESS;

  const load = () => {
    if (!token) return;
    fetchSubscriptionPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
    fetchMySubscription(token)
      .then(setSubscription)
      .catch(() => setSubscription(null));
  };

  useEffect(load, [token]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated || !isBusinessSeller) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Доступно только продавцам-юрлицам</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  const handleSubscribe = async (planId: string) => {
    if (!token) return;
    setSubscribingId(planId);
    try {
      const created = await subscribeToPlan(planId, token);
      if (created.paymentUrl) {
        window.location.href = created.paymentUrl;
      } else {
        showToast('Не удалось получить ссылку на оплату', 'error');
      }
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось оформить подписку', 'error');
    } finally {
      setSubscribingId(null);
    }
  };

  const activeStatus = subscription ? STATUS_LABELS[subscription.status] : null;

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-xl md:mx-auto">
      <PageHeader title="Подписка" fallbackHref="/profile" className="mb-6" />

      {subscription === undefined ? (
        <LoadingSpinner text="Загрузка..." />
      ) : (
        subscription &&
        activeStatus && (
          <div className="card p-4 mb-6">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-800">{subscription.plan.name}</p>
              <span className={`badge ${activeStatus.className} text-xs`}>{activeStatus.label}</span>
            </div>
            {subscription.status === 'ACTIVE' && subscription.expiresAt && (
              <p className="text-sm text-gray-500">Действует до {formatDate(subscription.expiresAt)}</p>
            )}
            {subscription.status === 'PENDING' && subscription.paymentUrl && (
              <a href={subscription.paymentUrl} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Завершить оплату →
              </a>
            )}
          </div>
        )
      )}

      <h2 className="font-display font-semibold text-gray-900 mb-3">Тарифы</h2>

      {plans === null ? (
        <LoadingSpinner text="Загрузка тарифов..." />
      ) : plans.length === 0 ? (
        <p className="text-sm text-gray-500">Тарифы пока не настроены администратором</p>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <div key={plan.id} className="card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{plan.name}</p>
                <p className="text-sm text-gray-500">
                  {plan.price.toLocaleString('ru-RU')} ₽ / {plan.durationDays} дн.
                </p>
              </div>
              <Button
                size="sm"
                isLoading={subscribingId === plan.id}
                onClick={() => handleSubscribe(plan.id)}
              >
                Оформить
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
