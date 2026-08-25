'use client';

import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/Button';
import { PlusIcon, MinusIcon, TrashIcon } from '@/components/Icons';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Корзина пуста</h1>
        <p className="text-sm text-gray-500 mb-6">Добавьте растения из каталога</p>
        <Link href="/catalog" className="btn-primary inline-block">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-4">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Корзина</h1>

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
                {item.plant.price.toLocaleString('ru-RU')} ₽
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
                  className="ml-auto p-1.5 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                  aria-label="Удалить из корзины"
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-gray-600">Итого</span>
          <span className="text-xl font-bold text-green-700">
            {totalPrice.toLocaleString('ru-RU')} ₽
          </span>
        </div>
        <Button fullWidth disabled>
          Оплатить (скоро)
        </Button>
        <p className="text-xs text-gray-400 text-center mt-2">
          Генерация платёжных ссылок ещё не подключена
        </p>
      </div>
    </div>
  );
}
