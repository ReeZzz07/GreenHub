import Link from 'next/link';
import Image from 'next/image';
import { SearchIcon, CameraIcon } from '@/components/Icons';
import { HomeCategoryShortcuts } from '@/components/HomeCategoryShortcuts';
import { HomeIcon } from '@/components/HomeIcon';
import { fetchListings, fetchCategories, fetchHomeContent } from '@/lib/api';
import { listingToPlant } from '@/lib/listing-adapter';
import { DEFAULT_HOME_CONTENT } from '@/lib/default-home-content';

// Список объявлений меняется постоянно — рендерим на каждый запрос, не кэшируем на билд-тайм
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [page, categories, content] = await Promise.all([
    fetchListings({ limit: 8, sortBy: 'newest' }).catch(() => null),
    fetchCategories().catch(() => []),
    fetchHomeContent().catch(() => DEFAULT_HOME_CONTENT),
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
                {content.heroBanner.title}
              </h2>
            </div>
            <span className="relative inline-flex items-center gap-1 text-white text-sm font-semibold">
              {content.heroBanner.ctaText} →
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
                {content.recognizeBanner.badgeText}
              </span>
              <h2 className="font-display text-white font-bold text-xl leading-tight">
                {content.recognizeBanner.title}
              </h2>
              <p className="text-gray-300 text-xs mt-1.5">{content.recognizeBanner.description}</p>
            </div>
            <span className="relative inline-flex items-center gap-1 text-white text-sm font-semibold">
              {content.recognizeBanner.ctaText} →
            </span>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-6">
        <div className="card p-6">
          <h2 className="font-display text-base font-bold text-gray-900 mb-4">{content.featuresTitle}</h2>
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#DCFCE7] flex items-center justify-center flex-shrink-0">
                <HomeIcon icon={content.features[0].icon} iconType={content.features[0].iconType} size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{content.features[0].title}</h3>
                <p className="text-sm text-gray-600">{content.features[0].description}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] flex items-center justify-center flex-shrink-0">
                <HomeIcon icon={content.features[1].icon} iconType={content.features[1].iconType} size={20} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{content.features[1].title}</h3>
                <p className="text-sm text-gray-600">{content.features[1].description}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E0E7FF] flex items-center justify-center flex-shrink-0">
                <HomeIcon icon={content.features[2].icon} iconType={content.features[2].iconType} size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{content.features[2].title}</h3>
                <p className="text-sm text-gray-600">{content.features[2].description}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 pb-6">
        <h2 className="font-display text-base font-bold text-gray-900 mb-4">{content.howItWorksTitle}</h2>
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
          <div className="card p-4 flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-display font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">{content.steps[0].title}</h3>
              <p className="text-xs text-gray-500 mt-1">{content.steps[0].description}</p>
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
              <h3 className="font-semibold text-gray-800 text-sm">{content.steps[1].title}</h3>
              <p className="text-xs text-gray-500 mt-1">{content.steps[1].description}</p>
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
              <h3 className="font-semibold text-gray-800 text-sm">{content.steps[2].title}</h3>
              <p className="text-xs text-gray-500 mt-1">{content.steps[2].description}</p>
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
            <h2 className="font-display text-lg font-bold text-gray-900">{content.newArrivalsTitle}</h2>
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
            <h2 className="font-display text-white font-bold text-lg">{content.closingCta.title}</h2>
            <p className="text-green-50 text-sm mt-1">{content.closingCta.description}</p>
          </div>
          <Link
            href="/listings/new"
            className="relative inline-block bg-white text-green-800 font-semibold text-sm rounded-2xl px-5 py-2.5 mt-4 md:mt-0 flex-shrink-0"
          >
            {content.closingCta.buttonText}
          </Link>
        </div>
      </section>
    </div>
  );
}
