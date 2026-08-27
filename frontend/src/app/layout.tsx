import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Unbounded } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin', 'cyrillic-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic-ext'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GreenHub - Маркетплейс растений',
  description: 'GreenHub - маркетплейс растений с AI-распознаванием',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#16a34a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${jakarta.variable} ${unbounded.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
