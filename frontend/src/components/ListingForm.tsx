'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';
import { Button } from './Button';
import { ImageUploader } from './ImageUploader';
import { Select } from './Select';
import {
  fetchCategories,
  createListing,
  updateListing,
  generateDescription,
  ApiError,
  type Category,
  type Listing,
} from '@/lib/api';

interface ListingFormProps {
  mode: 'create' | 'edit';
  listingId?: string;
  initial?: Listing;
}

export function ListingForm({ mode, listingId, initial }: ListingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(initial?.title ?? searchParams.get('title') ?? '');
  const [latinName, setLatinName] = useState(initial?.latinName ?? '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '1');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [lightRequirements, setLightRequirements] = useState(initial?.lightRequirements ?? '');
  const [waterRequirements, setWaterRequirements] = useState(initial?.waterRequirements ?? '');
  const [careInstructions, setCareInstructions] = useState(initial?.careInstructions.join(', ') ?? '');
  const [deliveryInfo, setDeliveryInfo] = useState(initial?.deliveryInfo ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        if (list.length > 0 && !categoryId) setCategoryId(list[0].id);
      })
      .catch(() => setCategories([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    const payload = {
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
      deliveryInfo: deliveryInfo || undefined,
    };

    setIsSubmitting(true);
    try {
      if (mode === 'edit' && listingId) {
        const wasLive = initial?.status === 'PUBLISHED' || initial?.status === 'REJECTED';
        await updateListing(listingId, payload, token);
        showToast(
          wasLive ? 'Изменения сохранены, объявление отправлено на повторную модерацию' : 'Изменения сохранены',
          'success',
        );
      } else {
        await createListing(payload, token);
        showToast('Объявление отправлено на модерацию', 'success');
      }
      router.push('/listings/mine');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Не удалось сохранить объявление';
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

      <Select
        value={categoryId}
        onChange={setCategoryId}
        options={categories.map((cat) => ({ value: cat.id, label: cat.name }))}
        placeholder="Загрузка категорий..."
        disabled={categories.length === 0}
      />

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
      <textarea
        rows={2}
        placeholder="Доставка: регионы и способы, например «СДЭК по России, самовывоз из Москвы, встреча у метро» (необязательно)"
        value={deliveryInfo}
        onChange={(e) => setDeliveryInfo(e.target.value)}
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
        {mode === 'edit' ? 'Сохранить изменения' : 'Отправить на модерацию'}
      </Button>
    </form>
  );
}
