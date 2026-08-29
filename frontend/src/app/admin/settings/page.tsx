'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import {
  fetchSettingsStatus,
  updateSettings,
  ApiError,
  type SettingKey,
  type SettingsStatus,
} from '@/lib/api';
import { UserRole } from '@/types';

function StatusBadge({ configured }: { configured: boolean }) {
  return (
    <span className={`badge text-xs ${configured ? 'badge-success' : 'bg-gray-100 text-gray-500'}`}>
      {configured ? 'Настроено' : 'Не настроено'}
    </span>
  );
}

interface FieldConfig {
  key: SettingKey;
  label: string;
  placeholder: string;
  type: 'text' | 'password';
}

const YOOKASSA_FIELDS: FieldConfig[] = [
  { key: 'YOOKASSA_SHOP_ID', label: 'Shop ID', placeholder: 'например, 123456', type: 'text' },
  { key: 'YOOKASSA_SECRET_KEY', label: 'Секретный ключ', placeholder: 'live_...', type: 'password' },
];

const PLANT_ID_FIELDS: FieldConfig[] = [
  { key: 'PLANT_ID_API_KEY', label: 'API-ключ Plant.id', placeholder: 'вставьте ключ', type: 'password' },
];

const LLM_FIELDS: FieldConfig[] = [
  { key: 'LLM_API_KEY', label: 'API-ключ', placeholder: 'вставьте ключ', type: 'password' },
  {
    key: 'LLM_API_URL',
    label: 'API URL (OpenAI-совместимый)',
    placeholder: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    type: 'text',
  },
  { key: 'LLM_MODEL', label: 'Модель', placeholder: 'qwen-plus', type: 'text' },
];

const SMTP_FIELDS: FieldConfig[] = [
  { key: 'SMTP_HOST', label: 'Хост', placeholder: 'smtp.yandex.ru', type: 'text' },
  { key: 'SMTP_PORT', label: 'Порт', placeholder: '587', type: 'text' },
  { key: 'SMTP_USER', label: 'Пользователь', placeholder: 'no-reply@greenhub.ru', type: 'text' },
  { key: 'SMTP_PASSWORD', label: 'Пароль', placeholder: 'вставьте пароль', type: 'password' },
  { key: 'SMTP_FROM', label: 'Отправитель', placeholder: 'GreenHub <no-reply@greenhub.ru>', type: 'text' },
  { key: 'SMTP_SECURE', label: 'TLS (true/false)', placeholder: 'false', type: 'text' },
];

const TELEGRAM_FIELDS: FieldConfig[] = [
  { key: 'TELEGRAM_BOT_TOKEN', label: 'Токен бота', placeholder: '123456:AAExample...', type: 'password' },
  { key: 'TELEGRAM_CHAT_ID', label: 'ID чата для алертов', placeholder: '-1001234567890', type: 'text' },
];

export default function AdminSettingsPage() {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [values, setValues] = useState<Partial<Record<SettingKey, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!token || !isAdmin) return;
    fetchSettingsStatus(token)
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [token, isAdmin]);

  const handleChange = (key: SettingKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    const nonEmpty = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v && v.trim().length > 0),
    );
    if (Object.keys(nonEmpty).length === 0) {
      showToast('Нечего сохранять — заполните хотя бы одно поле', 'info');
      return;
    }

    setIsSaving(true);
    try {
      const newStatus = await updateSettings(nonEmpty, token);
      setStatus(newStatus);
      setValues({});
      showToast('Настройки сохранены', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось сохранить', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const renderFieldGroup = (title: string, description: string, fields: FieldConfig[]) => (
    <div className="card p-4 mb-4">
      <h2 className="font-semibold text-gray-800 mb-1">{title}</h2>
      <p className="text-xs text-gray-500 mb-4">{description}</p>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm text-gray-700">{field.label}</label>
              {status && <StatusBadge configured={status[field.key]} />}
            </div>
            <input
              type={field.type}
              placeholder={field.placeholder}
              value={values[field.key] ?? ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="input-field"
              autoComplete="off"
            />
          </div>
        ))}
      </div>
    </div>
  );

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

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-xl lg:max-w-2xl md:mx-auto">
      <PageHeader title="Настройки интеграций" fallbackHref="/profile" className="mb-2" />
      <p className="text-sm text-gray-500 mb-6">
        Ключи хранятся в базе данных и нигде не отображаются повторно — только статус.
        Оставьте поле пустым, чтобы не менять текущее значение.
      </p>

      <form onSubmit={handleSave}>
        {renderFieldGroup(
          'ЮKassa',
          'Генерация платёжных ссылок для заказов',
          YOOKASSA_FIELDS,
        )}
        {renderFieldGroup(
          'Plant.id',
          'AI-распознавание растений по фото',
          PLANT_ID_FIELDS,
        )}
        {renderFieldGroup(
          'LLM (Qwen или совместимый)',
          'Генерация описаний объявлений',
          LLM_FIELDS,
        )}
        {renderFieldGroup(
          'SMTP / Почта',
          'Email-уведомления о заказах, модерации, сообщениях и отзывах',
          SMTP_FIELDS,
        )}
        {renderFieldGroup(
          'Telegram-алерты',
          'Уведомления об ошибках сервера (5xx) в Telegram-чат',
          TELEGRAM_FIELDS,
        )}

        <Button type="submit" fullWidth isLoading={isSaving}>
          Сохранить изменения
        </Button>
      </form>
    </div>
  );
}
