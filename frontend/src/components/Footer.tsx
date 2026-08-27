import Link from 'next/link';
import { LeafIcon } from './Icons';

export function Footer() {
  return (
    <footer className="mt-8 border-t border-black/5 bg-white">
      <div className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto px-4 py-8 md:grid md:grid-cols-4 md:gap-8">
        <div className="mb-6 md:mb-0 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              <LeafIcon size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-gray-900">GreenHub</span>
          </div>
          <p className="text-xs text-gray-500 max-w-xs">
            Маркетплейс растений: покупайте и продавайте комнатные, садовые растения и суккуленты
            напрямую у продавцов, с AI-распознаванием по фото.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:contents">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Платформа</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/catalog" className="text-gray-600 hover:text-green-700">Каталог</Link></li>
              <li><Link href="/recognize" className="text-gray-600 hover:text-green-700">AI-распознавание</Link></li>
              <li><Link href="/listings/new" className="text-gray-600 hover:text-green-700">Разместить объявление</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Документы</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="text-gray-600 hover:text-green-700">Пользовательское соглашение</Link></li>
              <li><Link href="/legal/privacy" className="text-gray-600 hover:text-green-700">Конфиденциальность</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-black/5">
        <div className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto px-4 py-4 text-xs text-gray-400 text-center md:text-left">
          © {new Date().getFullYear()} GreenHub. Все права защищены.
        </div>
      </div>
    </footer>
  );
}
