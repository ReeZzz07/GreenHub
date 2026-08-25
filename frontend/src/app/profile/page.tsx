'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { UserIcon } from '@/components/Icons';
import { UserRole } from '@/types';
import { ApiError } from '@/lib/api';

const REGISTER_ROLES: { value: UserRole; label: string }[] = [
  { value: UserRole.BUYER, label: 'Покупатель' },
  { value: UserRole.SELLER_INDIVIDUAL, label: 'Продавец (физ. лицо)' },
  { value: UserRole.SELLER_BUSINESS, label: 'Продавец / питомник (юр. лицо)' },
];

export default function ProfilePage() {
  const { user, isAuthenticated, login, register, logout, isLoading } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BUYER);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, name, role, phone: phone || undefined });
        showToast('Регистрация прошла успешно', 'success');
      }
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось выполнить запрос';
      showToast(message, 'error');
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="animate-fade-in px-4 py-6">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-3">
            <UserIcon size={40} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>

        <Button fullWidth variant="ghost" onClick={logout}>
          Выйти
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-6">
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
          </>
        )}

        <Button type="submit" fullWidth isLoading={isLoading}>
          {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </Button>
      </form>
    </div>
  );
}
