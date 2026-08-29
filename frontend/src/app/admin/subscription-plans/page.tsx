'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { PlusIcon, TrashIcon } from '@/components/Icons';
import { UserRole } from '@/types';
import {
  fetchAllSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  ApiError,
  type SubscriptionPlan,
} from '@/lib/api';

interface FormState {
  id: string | null;
  name: string;
  price: string;
  durationDays: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { id: null, name: '', price: '', durationDays: '30', isActive: true };

export default function AdminSubscriptionPlansPage() {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const loadPlans = () => {
    if (!token) return;
    fetchAllSubscriptionPlans(token)
      .then(setPlans)
      .catch(() => setPlans([]));
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, token]);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center md:max-w-md md:mx-auto">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Доступно только администратору</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  const openCreateForm = () => setForm(EMPTY_FORM);

  const openEditForm = (plan: SubscriptionPlan) => {
    setForm({
      id: plan.id,
      name: plan.name,
      price: String(plan.price),
      durationDays: String(plan.durationDays),
      isActive: plan.isActive,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !token) return;

    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      isActive: form.isActive,
    };

    try {
      if (form.id) {
        await updateSubscriptionPlan(form.id, payload, token);
        showToast('Тариф обновлён', 'success');
      } else {
        await createSubscriptionPlan(payload, token);
        showToast('Тариф добавлен', 'success');
      }
      setForm(null);
      loadPlans();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось сохранить тариф', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      await deleteSubscriptionPlan(deleteTarget.id, token);
      showToast('Тариф удалён', 'success');
      setDeleteTarget(null);
      loadPlans();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось удалить тариф', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-xl md:mx-auto">
      <PageHeader title="Тарифы подписки" fallbackHref="/profile" className="mb-2" />
      <p className="text-sm text-gray-500 mb-6">
        Тарифы для продавцов-юрлиц (питомников). Продавец выбирает тариф в своём кабинете и оплачивает по ссылке ЮKassa.
      </p>

      <Button size="sm" className="mb-4" onClick={openCreateForm}>
        <PlusIcon size={16} />
        Добавить тариф
      </Button>

      {plans === null ? (
        <LoadingSpinner text="Загрузка тарифов..." />
      ) : plans.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Тарифов пока нет</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} className="card p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 truncate">{plan.name}</p>
                  {!plan.isActive && <span className="badge bg-gray-100 text-gray-500 text-xs">Неактивен</span>}
                </div>
                <p className="text-xs text-gray-400">
                  {plan.price.toLocaleString('ru-RU')} ₽ / {plan.durationDays} дн.
                </p>
              </div>
              <button
                onClick={() => openEditForm(plan)}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2"
              >
                Изменить
              </button>
              <button
                onClick={() => setDeleteTarget(plan)}
                className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                aria-label="Удалить тариф"
              >
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={form !== null} onClose={() => setForm(null)} title={form?.id ? 'Редактировать тариф' : 'Новый тариф'} size="sm">
        {form && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Название</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                className="input-field"
                autoFocus
                placeholder="Например, «Питомник Стандарт»"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Цена, ₽</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((prev) => (prev ? { ...prev, price: e.target.value } : prev))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-sm text-gray-700 mb-1 block">Срок, дн.</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.durationDays}
                  onChange={(e) => setForm((prev) => (prev ? { ...prev, durationDays: e.target.value } : prev))}
                  className="input-field"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, isActive: e.target.checked } : prev))}
              />
              Тариф активен (виден продавцам)
            </label>
            <Button type="submit" fullWidth isLoading={isSaving}>
              {form.id ? 'Сохранить' : 'Добавить'}
            </Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Удалить тариф?" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Тариф «{deleteTarget.name}» будет удалён без возможности восстановления. Если по нему уже есть
              оформленные подписки, удаление не выполнится — деактивируйте тариф вместо удаления.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
                Удалить
              </Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
