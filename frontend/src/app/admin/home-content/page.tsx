'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { LoaderIcon } from '@/components/Icons';
import { HOME_ICON_PRESETS } from '@/lib/home-icon-presets';
import { UserRole } from '@/types';
import {
  fetchHomeContent,
  updateHomeContent,
  uploadHomeContentIcon,
  ApiError,
  type HomePageContent,
  type HomeContentFeatureItem,
  type HomeContentIconType,
} from '@/lib/api';
import { DEFAULT_HOME_CONTENT } from '@/lib/default-home-content';

const ICON_TYPE_LABELS: Record<HomeContentIconType, string> = {
  EMOJI: 'Emoji',
  PRESET: 'Из набора',
  UPLOAD: 'Своя картинка',
};

function FeatureIconPicker({
  feature,
  onChange,
  token,
}: {
  feature: HomeContentFeatureItem;
  onChange: (patch: Partial<HomeContentFeatureItem>) => void;
  token: string | null;
}) {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const iconType = feature.iconType ?? 'EMOJI';

  const handleFileChange = async (file: File | null) => {
    if (!file || !token) return;
    setIsUploading(true);
    try {
      const { url } = await uploadHomeContentIcon(file, token);
      onChange({ icon: url });
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось загрузить иконку', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">Иконка</label>
      <div className="flex gap-1 mb-2">
        {(Object.keys(ICON_TYPE_LABELS) as HomeContentIconType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange({ iconType: type, icon: '' })}
            className={`flex-1 py-1 rounded-lg text-[11px] font-medium transition-colors ${
              iconType === type ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {ICON_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {iconType === 'EMOJI' && (
        <input
          className="input-field"
          placeholder="🌿"
          value={feature.icon ?? ''}
          onChange={(e) => onChange({ icon: e.target.value })}
        />
      )}

      {iconType === 'PRESET' && (
        <div className="grid grid-cols-6 gap-1.5">
          {HOME_ICON_PRESETS.map((preset) => {
            const PresetIcon = preset.Icon;
            const selected = feature.icon === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.label}
                onClick={() => onChange({ icon: preset.id })}
                className={`aspect-square rounded-lg flex items-center justify-center border-2 transition-colors ${
                  selected
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-100 text-gray-500 hover:border-gray-300'
                }`}
              >
                <PresetIcon size={16} />
              </button>
            );
          })}
        </div>
      )}

      {iconType === 'UPLOAD' && (
        <div className="flex items-center gap-2">
          {feature.icon && (
            <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
              <Image src={feature.icon} alt="" fill sizes="36px" className="object-contain" />
            </div>
          )}
          <label className="btn-secondary text-xs cursor-pointer px-2.5 py-1.5 inline-flex items-center gap-1.5">
            {isUploading && <LoaderIcon size={12} />}
            {isUploading ? 'Загрузка...' : feature.icon ? 'Заменить' : 'Загрузить'}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default function AdminHomeContentPage() {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [content, setContent] = useState<HomePageContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!isAdmin) return;
    fetchHomeContent()
      .then(setContent)
      .catch(() => setContent(DEFAULT_HOME_CONTENT));
  }, [isAdmin]);

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

  if (!content) {
    return <LoadingSpinner text="Загрузка контента..." />;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSaving(true);
    try {
      const saved = await updateHomeContent(content, token);
      setContent(saved);
      showToast('Главная страница обновлена', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось сохранить', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFeature = (index: number, patch: Partial<HomeContentFeatureItem>) => {
    setContent((prev) => {
      if (!prev) return prev;
      const features = [...prev.features];
      features[index] = { ...features[index], ...patch };
      return { ...prev, features };
    });
  };

  const updateStep = (index: number, field: 'title' | 'description', value: string) => {
    setContent((prev) => {
      if (!prev) return prev;
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, steps };
    });
  };

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-2xl md:mx-auto">
      <PageHeader title="Контент главной страницы" fallbackHref="/profile" className="mb-2" />
      <p className="text-sm text-gray-500 mb-6">
        Тексты баннеров и блоков на главной странице. Изменения видны сразу всем посетителям сайта.
      </p>

      <form onSubmit={handleSave} className="space-y-4">
        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-1">Баннер каталога</h2>
          <p className="text-xs text-gray-500 mb-3">Счётчик объявлений и категорий считается автоматически</p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Заголовок</label>
              <input
                className="input-field"
                value={content.heroBanner.title}
                onChange={(e) =>
                  setContent({ ...content, heroBanner: { ...content.heroBanner, title: e.target.value } })
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Текст кнопки</label>
              <input
                className="input-field"
                value={content.heroBanner.ctaText}
                onChange={(e) =>
                  setContent({ ...content, heroBanner: { ...content.heroBanner, ctaText: e.target.value } })
                }
              />
            </div>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Баннер AI-распознавания</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Бейдж</label>
              <input
                className="input-field"
                value={content.recognizeBanner.badgeText}
                onChange={(e) =>
                  setContent({
                    ...content,
                    recognizeBanner: { ...content.recognizeBanner, badgeText: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Заголовок</label>
              <input
                className="input-field"
                value={content.recognizeBanner.title}
                onChange={(e) =>
                  setContent({ ...content, recognizeBanner: { ...content.recognizeBanner, title: e.target.value } })
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Описание</label>
              <input
                className="input-field"
                value={content.recognizeBanner.description}
                onChange={(e) =>
                  setContent({
                    ...content,
                    recognizeBanner: { ...content.recognizeBanner, description: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Текст кнопки</label>
              <input
                className="input-field"
                value={content.recognizeBanner.ctaText}
                onChange={(e) =>
                  setContent({ ...content, recognizeBanner: { ...content.recognizeBanner, ctaText: e.target.value } })
                }
              />
            </div>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Блок «Почему GreenHub?»</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Заголовок блока</label>
              <input
                className="input-field"
                value={content.featuresTitle}
                onChange={(e) => setContent({ ...content, featuresTitle: e.target.value })}
              />
            </div>
            {content.features.map((feature, i) => (
              <div key={i} className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-400">Карточка {i + 1}</p>
                <input
                  className="input-field"
                  placeholder="Заголовок"
                  value={feature.title}
                  onChange={(e) => updateFeature(i, { title: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Описание"
                  value={feature.description}
                  onChange={(e) => updateFeature(i, { description: e.target.value })}
                />
                <FeatureIconPicker feature={feature} onChange={(patch) => updateFeature(i, patch)} token={token} />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Блок «Как это работает»</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Заголовок блока</label>
              <input
                className="input-field"
                value={content.howItWorksTitle}
                onChange={(e) => setContent({ ...content, howItWorksTitle: e.target.value })}
              />
            </div>
            {content.steps.map((step, i) => (
              <div key={i} className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-xs font-medium text-gray-400">Шаг {i + 1}</p>
                <input
                  className="input-field"
                  placeholder="Заголовок"
                  value={step.title}
                  onChange={(e) => updateStep(i, 'title', e.target.value)}
                />
                <input
                  className="input-field"
                  placeholder="Описание"
                  value={step.description}
                  onChange={(e) => updateStep(i, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Секция объявлений</h2>
          <div>
            <label className="text-sm text-gray-700 mb-1 block">Заголовок «Новые поступления»</label>
            <input
              className="input-field"
              value={content.newArrivalsTitle}
              onChange={(e) => setContent({ ...content, newArrivalsTitle: e.target.value })}
            />
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Призыв продавать</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Заголовок</label>
              <input
                className="input-field"
                value={content.closingCta.title}
                onChange={(e) => setContent({ ...content, closingCta: { ...content.closingCta, title: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Описание</label>
              <input
                className="input-field"
                value={content.closingCta.description}
                onChange={(e) =>
                  setContent({ ...content, closingCta: { ...content.closingCta, description: e.target.value } })
                }
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Текст кнопки</label>
              <input
                className="input-field"
                value={content.closingCta.buttonText}
                onChange={(e) =>
                  setContent({ ...content, closingCta: { ...content.closingCta, buttonText: e.target.value } })
                }
              />
            </div>
          </div>
        </section>

        <Button type="submit" fullWidth isLoading={isSaving}>
          Сохранить изменения
        </Button>
      </form>
    </div>
  );
}
