'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/Button';
import { UserIcon } from '@/components/Icons';

export default function ProfilePage() {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
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
      <h1 className="text-xl font-bold text-gray-800 mb-6">Вход</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
        />
        <Button type="submit" fullWidth isLoading={isLoading}>
          Войти
        </Button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        Авторизация пока не подключена к бэкенду — используется временная заглушка
      </p>
    </div>
  );
}
