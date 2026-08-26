'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ArrowLeftIcon, UserIcon, CameraIcon, LoaderIcon } from '@/components/Icons';
import { updateProfile, changePassword, requestEmailChange, uploadAvatar, ApiError } from '@/lib/api';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export default function EditProfilePage() {
  const { user, token, isLoading: authLoading, refreshUser } = useAuth();
  const { showToast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!user || !token) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Нужно войти</h1>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти к входу
        </Link>
      </div>
    );
  }

  const handleAvatarChange = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Допустимы только JPG и PNG', 'error');
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      showToast('Файл больше 5 МБ', 'error');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file, token);
      await refreshUser();
      showToast('Фото профиля обновлено', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось загрузить фото', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      await updateProfile(user.id, { name, phone: phone || undefined }, token);
      await refreshUser();
      showToast('Данные сохранены', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось сохранить данные', 'error');
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, token);
      showToast('Пароль изменён', 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось изменить пароль', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingEmail(true);
    try {
      await requestEmailChange(newEmail, token);
      await refreshUser();
      setNewEmail('');
      showToast('Новый email отправлен на модерацию', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось отправить запрос', 'error');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const isPending = user.verificationStatus === 'PENDING_MODERATION';

  return (
    <div className="animate-fade-in px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeftIcon size={20} className="text-gray-600" />
        </Link>
        <h1 className="text-xl font-bold text-gray-800">Редактирование профиля</h1>
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <UserIcon size={44} className="text-green-600" />
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={isUploadingAvatar}
            className="absolute bottom-0 right-0 p-2 bg-green-700 hover:bg-green-800 rounded-full text-white shadow-lg transition-colors disabled:opacity-50"
            aria-label="Изменить фото профиля"
          >
            {isUploadingAvatar ? <LoaderIcon size={16} /> : <CameraIcon size={16} />}
          </button>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={(e) => handleAvatarChange(e.target.files)}
        />
      </div>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Основная информация</h2>
        <form onSubmit={handleSaveInfo} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
          <input
            type="tel"
            placeholder="Телефон (необязательно)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-field"
          />
          <Button type="submit" fullWidth size="sm" isLoading={isSavingInfo}>
            Сохранить
          </Button>
        </form>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Смена пароля</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            required
            placeholder="Текущий пароль"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            required
            minLength={8}
            placeholder="Новый пароль (минимум 8 символов)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
          />
          <Button type="submit" fullWidth size="sm" isLoading={isSavingPassword}>
            Изменить пароль
          </Button>
        </form>
      </section>

      <section className="card p-4 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Email</h2>
        <p className="text-sm text-gray-500 mb-3">Текущий: {user.email}</p>

        {isPending && user.pendingEmail && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
            Новый email <strong>{user.pendingEmail}</strong> отправлен на проверку модератору.
          </div>
        )}

        {!isPending && user.rejectionReason && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            Предыдущий запрос отклонён: {user.rejectionReason}
          </div>
        )}

        {!isPending && (
          <form onSubmit={handleRequestEmailChange} className="space-y-3">
            <input
              type="email"
              required
              placeholder="Новый email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="input-field"
            />
            <Button type="submit" fullWidth size="sm" isLoading={isSavingEmail}>
              Отправить на проверку
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
