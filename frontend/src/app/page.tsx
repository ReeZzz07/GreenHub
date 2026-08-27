import Link from 'next/link';
import Image from 'next/image';
import { SearchIcon, CameraIcon } from '@/components/Icons';
import { HomeCategoryShortcuts } from '@/components/HomeCategoryShortcuts';
import { fetchListings, fetchCategories } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';

// Список объявлений меняется постоянно — рендерим на каждый запрос, не кэшируем на билд-тайм
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [page, categories] = await Promise.all([
    fetchListings({ limit: 8, sortBy: 'newest' }).catch(() => null),
    fetchCategories().catch(() => []),
  ]);
  const plants = (page?.items ?? []).map(listingToPlant);
  const totalCount = page?.total ?? 0;

  return (
    <div className="animate-fade-in">
      {/* Search entry point */}
      <section className="px-4 pt-5 pb-4">
        <Link
          href="/catalog"
          className="flex items-center gap-2.5 bg-[var(--color-surface)] rounded-2xl px-4 py-3.5"
        >
          <SearchIcon size={16} className="text-gray-400" />
          <span className="text-sm text-gray-400 flex-1">Что ищем сегодня?</span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <CameraIcon size={13} className="text-white" />
          </div>
        </Link>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="pl-4 pr-2 pb-5">
          <HomeCategoryShortcuts categories={categories} />
        </section>
      )}

      {/* Promo banners */}
      <section className="px-4 pb-6">
        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
          <Link
            href="/catalog"
            className="relative block rounded-[22px] overflow-hidden px-5 py-5 gradient-nature min-h-[152px] flex flex-col justify-between"
          >
            <div className="absolute inset-0 opacity-15 leaf-pattern"></div>
            <div className="absolute -right-6 -bottom-8 opacity-20">
              <svg width="140" height="140" viewBox="0 0 64 64">
                <path d="M32 58C15 51 9 30 20 9C41 17 53 34 45 53C41 58 36 59 32 58Z" fill="#ffffff"></path>
              </svg>
            </div>
            <div className="relative">
              <span className="inline-block bg-white/20 text-white text-[11px] font-semibold rounded-full px-3 py-1 mb-3">
                {totalCount} объявлений · {categories.length} категорий
              </span>
              <h2 className="font-display text-white font-bold text-xl leading-tight">
                Растения от продавцов напрямую
              </h2>
            </div>
            <span className="relative inline-flex items-center gap-1 text-white text-sm font-semibold">
              Смотреть каталог →
            </span>
          </Link>

          <Link
            href="/recognize"
            className="relative block rounded-[22px] overflow-hidden px-5 py-5 bg-gray-900 min-h-[152px] flex flex-col justify-between"
          >
            <div className="absolute -right-8 -bottom-8 opacity-20">
              <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </div>
            <div className="relative">
              <span className="inline-block bg-white/15 text-white text-[11px] font-semibold rounded-full px-3 py-1 mb-3">
                AI-распознавание
              </span>
              <h2 className="font-display text-white font-bold text-xl leading-tight">
                Не знаете это растение?
              </h2>
              <p className="text-gray-300 text-xs mt-1.5">Сфотографируйте — AI определит вид за секунды</p>
            </div>
            <span className="relative inline-flex items-center gap-1 text-white text-sm font-semibold">
              Распознать →
            </span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-6">
        <div className="card p-6">
          <h2 className="font-display text-base font-bold text-gray-900 mb-4">Почему GreenHub?</h2>
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">AI-распознавание</h3>
                <p className="text-sm text-gray-600">Определите название растения по фото за секунды</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Удобная оплата</h3>
                <p className="text-sm text-gray-600">Оплачивайте заказами через платежные ссылки</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E0E7FF] flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Проверенные продавцы</h3>
                <p className="text-sm text-gray-600">Только качественные растения от надежных поставщиков</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-6">
        <h2 className="font-display text-base font-bold text-gray-900 mb-4">Как это работает</h2>
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
          <div className="card p-4 flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Найдите растение</h3>
              <p className="text-xs text-gray-500 mt-1">В каталоге или сфотографируйте — AI подскажет вид</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Напишите продавцу</h3>
              <p className="text-xs text-gray-500 mt-1">Уточните детали напрямую в чате внутри платформы</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Купите напрямую</h3>
              <p className="text-xs text-gray-500 mt-1">Оплата по безопасной ссылке, без посредников</p>
            </div>
          </div>
        </div>
      </section>

      {plants.length === 0 ? (
        <section className="px-4 py-12 text-center">
          <p className="text-gray-500 mb-4">Пока нет опубликованных объявлений</p>
          <Link href="/listings/new" className="btn-primary inline-block">
            Разместить первое объявление
          </Link>
        </section>
      ) : (
        <section className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-gray-900">Новые поступления</h2>
            <Link href="/catalog" className="text-green-700 text-sm font-semibold hover:text-green-800">
              Все →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {plants.map((plant) => (
              <Link key={plant.id} href={`/plant/${plant.id}`} className="block">
                <div className="card">
                  <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 relative">
                    {plant.images[0] && (
                      <Image
                        src={plant.images[0]}
                        alt={plant.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                        className="object-cover"
                      />
                    )}
                    {!plant.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white/90 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                          Нет в наличии
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-800 text-sm truncate">{plant.name}</h3>
                    <p className="font-display text-gray-900 font-bold text-sm mt-2">
                      {plant.price.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Closing CTA for sellers */}
      <section className="px-4 pt-2 pb-8">
        <div className="relative rounded-[22px] overflow-hidden px-6 py-6 gradient-nature text-center md:text-left md:flex md:items-center md:justify-between md:gap-6">
          <div className="absolute inset-0 opacity-15 leaf-pattern"></div>
          <div className="relative">
            <h2 className="font-display text-white font-bold text-lg">Продаёте растения?</h2>
            <p className="text-green-50 text-sm mt-1">
              Разместите объявление бесплатно — оно появится в каталоге сразу после проверки
            </p>
          </div>
          <Link
            href="/listings/new"
            className="relative inline-block bg-white text-green-800 font-semibold text-sm rounded-2xl px-5 py-2.5 mt-4 md:mt-0 flex-shrink-0"
          >
            Разместить объявление
          </Link>
        </div>
      </section>
    </div>
  );
}
