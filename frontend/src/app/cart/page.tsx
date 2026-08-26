'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { PageHeader } from '@/components/PageHeader';
import { PlusIcon, MinusIcon, TrashIcon } from '@/components/Icons';
import { createOrder, ApiError } from '@/lib/api';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();
  const { token, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [payingId, setPayingId] = useState<string | null>(null);

  const handlePay = async (plantId: string, quantity: number, itemId: string) => {
    if (!isAuthenticated || !token) {
      showToast('Войдите, чтобы оплатить заказ', 'info');
      return;
    }

    setPayingId(itemId);
    try {
      const order = await createOrder(plantId, quantity, token);
      if (order.paymentUrl) {
        window.location.href = order.paymentUrl;
      } else {
        showToast('Не удалось получить ссылку на оплату', 'error');
      }
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось создать заказ', 'error');
    } finally {
      setPayingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="animate-fade-in px-4 py-4">
        <PageHeader title="Корзина" fallbackHref="/" />
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 mb-6">Добавьте растения из каталога</p>
          <Link href="/catalog" className="btn-primary inline-block">
            Перейти в каталог
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-4">
      <PageHeader title="Корзина" fallbackHref="/" className="mb-1" />
      <p className="text-xs text-gray-500 mb-4">
        Каждый товар оплачивается отдельной ссылкой — продавцы разные
      </p>

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="card p-3 flex gap-3">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
              <img
                src={item.plant.images[0]}
                alt={item.plant.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{item.plant.name}</h3>
              <p className="text-green-700 font-bold text-sm mt-1">
                {(item.plant.price * item.quantity).toLocaleString('ru-RU')} ₽
              </p>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Уменьшить количество"
                >
                  <MinusIcon size={14} />
                </button>
                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                  aria-label="Увеличить количество"
                >
                  <PlusIcon size={14} />
                </button>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  aria-label="Удалить из корзины"
                >
                  <TrashIcon size={16} />
                </button>
                <Button
                  size="sm"
                  className="ml-auto"
                  isLoading={payingId === item.id}
                  onClick={() => handlePay(item.plantId, item.quantity, item.id)}
                >
                  Оплатить
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Итого в корзине</span>
          <span className="text-xl font-bold text-green-700">
            {totalPrice.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>
    </div>
  );
}
