import Link from 'next/link';
import { LeafIcon } from '@/components/Icons';

export default function NotFound() {
  return (
    <div className="animate-fade-in px-4 py-16 text-center md:max-w-md md:mx-auto">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
      >
        <LeafIcon size={30} className="text-white" />
      </div>
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Страница не найдена</h1>
      <p className="text-sm text-gray-500 mb-6">
        Такой страницы не существует — возможно, объявление уже сняли с публикации или ссылка устарела.
      </p>
      <Link href="/" className="btn-primary inline-block">
        На главную
      </Link>
    </div>
  );
}
