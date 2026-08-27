'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { UserIcon, HeartIcon, CheckIcon } from '@/components/Icons';
import { UserRole } from '@/types';
import { ApiError, fetchModerationQueue } from '@/lib/api';

const SELLER_ROLES: UserRole[] = [UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN];
const MODERATOR_ROLES: UserRole[] = [UserRole.MODERATOR, UserRole.ADMIN];

const REGISTER_ROLES: { value: UserRole; label: string }[] = [
  { value: UserRole.BUYER, label: 'Покупатель' },
  { value: UserRole.SELLER_INDIVIDUAL, label: 'Продавец (физ. лицо)' },
  { value: UserRole.SELLER_BUSINESS, label: 'Продавец / питомник (юр. лицо)' },
];

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { user, token, isAuthenticated, login, register, logout, isLoading } = useAuth();
  const { count: favoritesCount } = useFavorites();
  const { showToast } = useToast();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<'login' | 'register'>(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);
  const [consent, setConsent] = useState(false);

  const canModerate = !!user && MODERATOR_ROLES.includes(user.role);
  const [pendingListingsCount, setPendingListingsCount] = useState(0);

  useEffect(() => {
    if (!canModerate || !token) return;
    fetchModerationQueue(token)
      .then((queue) => setPendingListingsCount(queue.length))
      .catch(() => setPendingListingsCount(0));
  }, [canModerate, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name, role, phone: phone || undefined, consentToDataProcessing: consent });
        showToast('Регистрация прошла успешно', 'success');
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось выполнить запрос';
      showToast(message, 'error');
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="animate-fade-in px-4 py-6 md:max-w-md md:mx-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3 overflow-hidden">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} fill sizes="80px" className="object-cover" />
            ) : (
              <UserIcon size={40} className="text-green-600" />
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>

          {user.verificationStatus === 'PENDING_MODERATION' && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 mt-2">
              Смена email на проверке
            </p>
          )}
          {user.verificationStatus !== 'PENDING_MODERATION' && user.rejectionReason && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1 mt-2">
              Запрос на смену email отклонён
            </p>
          )}
        </div>

        <Link href="/profile/edit" className="btn-secondary block text-center mb-3">
          Настройки профиля
        </Link>

        <Link href="/orders" className="btn-secondary block text-center mb-3">
          Мои заказы
        </Link>

        <Link href="/favorites" className="btn-secondary flex items-center justify-center gap-2 mb-6">
          <span className="relative">
            <HeartIcon size={20} />
            {favoritesCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {favoritesCount > 9 ? '9+' : favoritesCount}
              </span>
            )}
          </span>
          Избранное
        </Link>

        {canModerate && (
          <Link href="/moderation" className="btn-secondary flex items-center justify-center gap-2 mb-6">
            <span className="relative">
              <CheckIcon size={20} />
              {pendingListingsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {pendingListingsCount > 9 ? '9+' : pendingListingsCount}
                </span>
              )}
            </span>
            Модерация объявлений
          </Link>
        )}

        {user.role === UserRole.ADMIN && (
          <Link href="/admin/settings" className="btn-secondary block text-center mb-6">
            Настройки интеграций
          </Link>
        )}

        {SELLER_ROLES.includes(user.role) && (
          <Link href="/listings/mine" className="btn-secondary block text-center mb-6">
            Мои объявления
          </Link>
        )}

        <Button fullWidth variant="ghost" onClick={logout}>
          Выйти
        </Button>

        <div className="flex items-center justify-center gap-3 mt-6 text-xs text-gray-400">
          <Link href="/legal/terms" className="hover:text-gray-600">Соглашение</Link>
          <span>·</span>
          <Link href="/legal/privacy" className="hover:text-gray-600">Конфиденциальность</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-md md:mx-auto">
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors ${
            mode === 'login' ? 'gradient-nature text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Вход
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors ${
            mode === 'register' ? 'gradient-nature text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Регистрация
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'register' && (
          <input
            type="text"
            required
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
        )}

        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
        />
        <input
          type="password"
          required
          minLength={8}
          placeholder="Пароль (минимум 8 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />

        {mode === 'register' && (
          <>
            <input
              type="tel"
              placeholder="Телефон (необязательно)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="input-field"
            >
              {REGISTER_ROLES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="flex items-start gap-2.5 text-xs text-gray-600 px-1">
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 flex-shrink-0"
              />
              <span>
                Я согласен с{' '}
                <Link href="/legal/terms" className="text-green-700 underline hover:text-green-800">
                  пользовательским соглашением
                </Link>{' '}
                и даю согласие на{' '}
                <Link href="/legal/privacy" className="text-green-700 underline hover:text-green-800">
                  обработку персональных данных
                </Link>
              </span>
            </label>
          </>
        )}

        <Button type="submit" fullWidth isLoading={isLoading} disabled={mode === 'register' && !consent}>
          {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </Button>
      </form>
    </div>
  );
}
