'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ToastProvider } from '@/components/Toast';
import { Header, BottomNavigation } from '@/components/Navigation';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gray-50 pb-20 md:pb-6">
              <Header />
              <main className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto">{children}</main>
              <BottomNavigation />
            </div>
          </ToastProvider>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
