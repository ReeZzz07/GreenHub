'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { ChatWidgetProvider } from '@/context/ChatWidgetContext';
import { ToastProvider } from '@/components/Toast';
import { Header, BottomNavigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { ChatWidgetManager } from '@/components/chat/ChatWidgetManager';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <ChatWidgetProvider>
          <FavoritesProvider>
            <CartProvider>
              <ToastProvider>
                <ServiceWorkerRegistration />
                <div className="min-h-screen bg-gray-50 pb-20 md:pb-6 flex flex-col">
                  <Header />
                  <main className="max-w-lg md:max-w-3xl lg:max-w-6xl mx-auto w-full flex-1">{children}</main>
                  <Footer />
                  <BottomNavigation />
                </div>
                <ChatWidgetManager />
              </ToastProvider>
            </CartProvider>
          </FavoritesProvider>
        </ChatWidgetProvider>
      </NotificationsProvider>
    </AuthProvider>
  );
}
