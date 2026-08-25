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
            <div className="min-h-screen bg-gray-50 pb-20">
              <Header />
              <main className="max-w-lg mx-auto">{children}</main>
              <BottomNavigation />
            </div>
          </ToastProvider>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
