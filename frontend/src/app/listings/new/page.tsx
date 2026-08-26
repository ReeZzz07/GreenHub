'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import {
  fetchCategories,
  createListing,
  generateDescription,
  ApiError,
  type Category,
} from '@/lib/api';
import { ImageUploader } from '@/components/ImageUploader';
import { UserRole } from '@/types';

const SELLER_ROLES: UserRole[] = [UserRole.SELLER_INDIVIDUAL, UserRole.SELLER_BUSINESS, UserRole.ADMIN];

export default function NewListingPage() {
  return (
    <Suspense fallback={<LoadingSpinner text="Загрузка..." />}>
      <NewListingForm />
    </Suspense>
  );
}

function NewListingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(searchParams.get('title') ?? '');
  const [latinName, setLatinName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [description, setDescription] = useState('');
  const [lightRequirements, setLightRequirements] = useState('');
  const [waterRequirements, setWaterRequirements] = useState('');
  const [careInstructions, setCareInstructions] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        if (list.length > 0) setCategoryId(list[0].id);
      })
      .catch(() => setCategories([]));
  }, []);

  const canSell = !!user && SELLER_ROLES.includes(user.role);

  const handleGenerateDescription = async () => {
    if (!token) return;
    const categoryName = categories.find((c) => c.id === categoryId)?.name;
    if (!title || !categoryName) {
      showToast('Укажите название и категорию перед генерацией описания', 'info');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateDescription(
        {
          title,
          categoryName,
          lightRequirements: lightRequirements || undefined,
          waterRequirements: waterRequirements || undefined,
          careInstructions: careInstructions
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
        token,
      );
      setDescription(result.description);
      if (result.flagged) {
        showToast(`Проверьте текст перед отправкой: ${result.flagReasons.join(', ')}`, 'warning');
      } else {
        showToast('Описание сгенерировано', 'success');
      }
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось сгенерировать описание', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    try {
      const listing = await createListing(
        {
          title,
          latinName: latinName || undefined,
          description,
          price: Number(price),
          quantity: Number(quantity) || 1,
          categoryId,
          images,
          lightRequirements: lightRequirements || undefined,
          waterRequirements: waterRequirements || undefined,
          careInstructions: careInstructions
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        },
        token,
      );
      showToast('Объявление отправлено на модерацию', 'success');
      router.push(`/profile`);
      void listing;
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось создать объявление';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner text="Загрузка..." />;
  }

  if (!isAuthenticated || !canSell) {
    return (
      <div className="animate-fade-in px-4 py-12 text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Доступно только продавцам</h1>
        <p className="text-sm text-gray-500 mb-6">
          Чтобы разместить объявление, войдите как продавец (физ. лицо или юр. лицо).
        </p>
        <Link href="/profile" className="btn-primary inline-block">
          Перейти в профиль
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 py-6">
      <h1 className="text-xl font-bold text-gray-800 mb-6">Новое объявление</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          required
          placeholder="Название (например, Монстера Делициоза)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Латинское название (необязательно)"
          value={latinName}
          onChange={(e) => setLatinName(e.target.value)}
          className="input-field"
        />

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="input-field">
          {categories.length === 0 && <option value="">Загрузка категорий...</option>}
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            required
            min={1}
            placeholder="Цена, ₽"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input-field"
          />
          <input
            type="number"
            min={0}
            placeholder="Количество"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="input-field"
          />
        </div>

        <input
          type="text"
          placeholder="Освещение, например «Яркий рассеянный свет» (необязательно)"
          value={lightRequirements}
          onChange={(e) => setLightRequirements(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Полив, например «2-3 раза в неделю» (необязательно)"
          value={waterRequirements}
          onChange={(e) => setWaterRequirements(e.target.value)}
          className="input-field"
        />
        <input
          type="text"
          placeholder="Советы по уходу через запятую (необязательно)"
          value={careInstructions}
          onChange={(e) => setCareInstructions(e.target.value)}
          className="input-field"
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm text-gray-700">Описание</label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              isLoading={isGenerating}
              onClick={handleGenerateDescription}
            >
              Сгенерировать с ИИ
            </Button>
          </div>
          <textarea
            required
            minLength={10}
            rows={5}
            placeholder="Описание (или нажмите «Сгенерировать с ИИ» выше)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
          />
        </div>

        <ImageUploader images={images} onChange={setImages} />

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Отправить на модерацию
        </Button>
      </form>
    </div>
  );
}
