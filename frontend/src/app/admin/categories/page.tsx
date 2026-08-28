'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PageHeader } from '@/components/PageHeader';
import { CategoryIcon } from '@/components/CategoryIcon';
import { PlusIcon, TrashIcon, LoaderIcon } from '@/components/Icons';
import { slugify } from '@/lib/slugify';
import { CATEGORY_ICON_PRESETS } from '@/lib/category-icon-presets';
import { UserRole } from '@/types';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  uploadCategoryIcon,
  ApiError,
  type Category,
  type CategoryIconType,
} from '@/lib/api';

interface FormState {
  id: string | null;
  name: string;
  slug: string;
  slugTouched: boolean;
  iconType: CategoryIconType;
  icon: string;
  parentId: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  name: '',
  slug: '',
  slugTouched: false,
  iconType: 'EMOJI',
  icon: '',
  parentId: '',
};

const ICON_TYPE_LABELS: Record<CategoryIconType, string> = {
  EMOJI: 'Emoji',
  PRESET: 'Из набора',
  UPLOAD: 'Своя картинка',
};

export default function AdminCategoriesPage() {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<Category[] | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const loadCategories = () => {
    fetchCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadCategories();
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

  const openCreateForm = (parentId?: string) => {
    setForm({ ...EMPTY_FORM, parentId: parentId ?? '' });
  };

  const openEditForm = (category: Category) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      slugTouched: true,
      iconType: category.iconType,
      icon: category.icon ?? '',
      parentId: category.parentId ?? '',
    });
  };

  const handleNameChange = (name: string) => {
    setForm((prev) =>
      prev
        ? { ...prev, name, slug: prev.slugTouched ? prev.slug : slugify(name) }
        : prev,
    );
  };

  const handleIconTypeChange = (iconType: CategoryIconType) => {
    setForm((prev) => (prev ? { ...prev, iconType, icon: '' } : prev));
  };

  const handleIconFileChange = async (file: File | null) => {
    if (!file || !token) return;
    setIsUploadingIcon(true);
    try {
      const { url } = await uploadCategoryIcon(file, token);
      setForm((prev) => (prev ? { ...prev, icon: url } : prev));
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось загрузить иконку', 'error');
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !token) return;

    setIsSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon.trim() || undefined,
      iconType: form.iconType,
      parentId: form.parentId || undefined,
    };

    try {
      if (form.id) {
        await updateCategory(form.id, payload, token);
        showToast('Категория обновлена', 'success');
      } else {
        await createCategory(payload, token);
        showToast('Категория добавлена', 'success');
      }
      setForm(null);
      loadCategories();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось сохранить категорию', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deleteTarget.id, token);
      showToast('Категория удалена', 'success');
      setDeleteTarget(null);
      loadCategories();
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось удалить категорию', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const rootCategories = categories?.filter((c) => !c.parentId) ?? [];

  return (
    <div className="animate-fade-in px-4 py-6 md:max-w-2xl md:mx-auto">
      <PageHeader title="Категории каталога" fallbackHref="/profile" className="mb-2" />
      <p className="text-sm text-gray-500 mb-6">
        Категории верхнего уровня показываются фильтром в каталоге. У каждой можно завести подкатегории.
      </p>

      <Button size="sm" className="mb-4" onClick={() => openCreateForm()}>
        <PlusIcon size={16} />
        Добавить категорию
      </Button>

      {categories === null ? (
        <LoadingSpinner text="Загрузка категорий..." />
      ) : rootCategories.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">Категорий пока нет</p>
      ) : (
        <div className="space-y-3">
          {rootCategories.map((category) => (
            <div key={category.id} className="card p-4">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-gray-700">
                  {category.icon ? <CategoryIcon category={category} size={22} /> : <span className="text-xl">📁</span>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{category.name}</p>
                  <p className="text-xs text-gray-400 truncate">/{category.slug}</p>
                </div>
                <button
                  onClick={() => openEditForm(category)}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 px-2"
                >
                  Изменить
                </button>
                <button
                  onClick={() => setDeleteTarget(category)}
                  className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  aria-label="Удалить категорию"
                >
                  <TrashIcon size={16} />
                </button>
              </div>

              {(category.children ?? []).length > 0 && (
                <div className="mt-3 ml-4 pl-3 border-l-2 border-gray-100 space-y-2">
                  {category.children!.map((child) => (
                    <div key={child.id} className="flex items-center gap-3">
                      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-600">
                        {child.icon ? <CategoryIcon category={child} size={18} /> : <span className="text-base">📁</span>}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{child.name}</p>
                        <p className="text-xs text-gray-400 truncate">/{child.slug}</p>
                      </div>
                      <button
                        onClick={() => openEditForm(child)}
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 px-2"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => setDeleteTarget(child)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        aria-label="Удалить подкатегорию"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => openCreateForm(category.id)}
                className="mt-3 ml-4 text-xs font-medium text-green-700 hover:text-green-800"
              >
                + Подкатегория
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={form !== null} onClose={() => setForm(null)} title={form?.id ? 'Редактировать категорию' : 'Новая категория'} size="sm">
        {form && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Название</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input-field"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 mb-1 block">Slug (для ссылок и фильтров)</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, slug: e.target.value, slugTouched: true } : prev))}
                className="input-field"
              />
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-1 block">Иконка</label>
              <div className="flex gap-1 mb-2">
                {(Object.keys(ICON_TYPE_LABELS) as CategoryIconType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleIconTypeChange(type)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      form.iconType === type ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {ICON_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>

              {form.iconType === 'EMOJI' && (
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm((prev) => (prev ? { ...prev, icon: e.target.value } : prev))}
                  placeholder="🌿"
                  className="input-field"
                />
              )}

              {form.iconType === 'PRESET' && (
                <div className="grid grid-cols-6 gap-2">
                  {CATEGORY_ICON_PRESETS.map((preset) => {
                    const PresetIcon = preset.Icon;
                    const selected = form.icon === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        onClick={() => setForm((prev) => (prev ? { ...prev, icon: preset.id } : prev))}
                        className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-colors ${
                          selected
                            ? 'border-green-600 bg-green-50 text-green-700'
                            : 'border-gray-100 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <PresetIcon size={20} />
                      </button>
                    );
                  })}
                </div>
              )}

              {form.iconType === 'UPLOAD' && (
                <div className="flex items-center gap-3">
                  {form.icon && (
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                      <Image src={form.icon} alt="" fill sizes="48px" className="object-contain" />
                    </div>
                  )}
                  <label className="btn-secondary text-sm cursor-pointer px-3 py-2 inline-flex items-center gap-2">
                    {isUploadingIcon && <LoaderIcon size={14} />}
                    {isUploadingIcon ? 'Загрузка...' : form.icon ? 'Заменить файл' : 'Загрузить файл'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      disabled={isUploadingIcon}
                      onChange={(e) => handleIconFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-700 mb-1 block">Родительская категория</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, parentId: e.target.value } : prev))}
                className="input-field"
              >
                <option value="">Нет — категория верхнего уровня</option>
                {rootCategories
                  .filter((c) => c.id !== form.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <Button type="submit" fullWidth isLoading={isSaving} disabled={isUploadingIcon}>
              {form.id ? 'Сохранить' : 'Добавить'}
            </Button>
          </form>
        )}
      </Modal>

      <Modal isOpen={deleteTarget !== null} onClose={() => setDeleteTarget(null)} title="Удалить категорию?" size="sm">
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Категория «{deleteTarget.name}» будет удалена без возможности восстановления. Если в ней есть
              объявления или подкатегории, удаление не выполнится.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
                Удалить
              </Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
