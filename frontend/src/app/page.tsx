import Link from 'next/link';
import { SearchIcon, CameraIcon } from '@/components/Icons';
import { HomeCategoryShortcuts } from '@/components/HomeCategoryShortcuts';
import { fetchListings, fetchCategories } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';

// Список объявлений меняется постоянно — рендерим на каждый запрос, не кэшируем на билд-тайм
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [page, categories] = await Promise.all([
    fetchListings({ limit: 7, sortBy: 'newest' }).catch(() => null),
    fetchCategories().catch(() => []),
  ]);
  const plants = (page?.items ?? []).map(listingToPlant);
  const gridPlants = plants.slice(0, 4);
  const listPlants = plants.slice(4, 7);

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

      {/* AI recognition promo */}
      <section className="px-4 pb-6">
        <Link
          href="/recognize"
          className="relative block rounded-[22px] overflow-hidden px-5 py-4 gradient-nature lg:max-w-xl"
        >
          <div className="absolute inset-0 opacity-15 leaf-pattern"></div>
          <div className="relative flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-white font-bold text-base">Не знаете это растение?</h2>
              <p className="text-green-50 text-xs mt-1">AI определит вид по фото за секунды</p>
            </div>
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <CameraIcon size={20} className="text-white" />
            </div>
          </div>
        </Link>
      </section>

      {plants.length === 0 ? (
        <section className="px-4 py-12 text-center">
          <p className="text-gray-500 mb-4">Пока нет опубликованных объявлений</p>
          <Link href="/listings/new" className="btn-primary inline-block">
            Разместить первое объявление
          </Link>
        </section>
      ) : (
        <>
          {/* New Listings */}
          <section className="px-4 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-gray-900">Новые поступления</h2>
              <Link href="/catalog" className="text-green-700 text-sm font-semibold hover:text-green-800">
                Все →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gridPlants.map((plant) => (
                <Link key={plant.id} href={`/plant/${plant.id}`} className="block">
                  <div className="card">
                    <div className="aspect-square bg-gradient-to-br from-green-50 to-green-100 relative">
                      {plant.images[0] && (
                        <img
                          src={plant.images[0]}
                          alt={plant.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
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

          {listPlants.length > 0 && (
            <section className="px-4 py-4">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-4">Ещё объявления</h2>
              <div className="space-y-3 lg:max-w-2xl">
                {listPlants.map((plant) => (
                  <Link key={plant.id} href={`/plant/${plant.id}`} className="block">
                    <div className="card p-3 flex gap-3">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
                        {plant.images[0] && (
                          <img
                            src={plant.images[0]}
                            alt={plant.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">{plant.name}</h3>
                        {plant.latinName && (
                          <p className="text-xs text-gray-500 italic truncate">{plant.latinName}</p>
                        )}
                        <span className="font-display text-gray-900 font-bold text-sm mt-2 block">
                          {plant.price.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}

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
    </div>
  );
}
