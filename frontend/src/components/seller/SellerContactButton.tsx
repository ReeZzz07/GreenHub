'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { useToast } from '../Toast';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { ChatIcon } from '../Icons';
import { createConversation, ApiError } from '@/lib/api';

interface SellerListingLite {
  id: string;
  title: string;
  images: string[];
}

interface SellerContactButtonProps {
  sellerId: string;
  listings: SellerListingLite[];
}

// Чат в GreenHub всегда привязан к конкретному объявлению (нельзя написать продавцу "вообще"),
// поэтому при нескольких товарах сперва просим выбрать, к какому из них относится вопрос.
export function SellerContactButton({ sellerId, listings }: SellerContactButtonProps) {
  const { user, isAuthenticated, token } = useAuth();
  const { openConversation } = useChatWidget();
  const isDesktop = useIsDesktop();
  const { showToast } = useToast();
  const router = useRouter();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMessaging, setIsMessaging] = useState(false);

  const startConversation = async (listingId: string) => {
    if (!isAuthenticated || !token) {
      showToast('Войдите, чтобы написать продавцу', 'info');
      router.push('/profile');
      return;
    }

    setIsMessaging(true);
    try {
      const conversation = await createConversation(listingId, token);
      setIsPickerOpen(false);
      if (isDesktop) {
        openConversation(conversation.id);
      } else {
        router.push(`/chats/${conversation.id}`);
      }
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Не удалось открыть чат', 'error');
    } finally {
      setIsMessaging(false);
    }
  };

  const handleClick = () => {
    if (listings.length === 0) return;
    if (listings.length === 1) {
      startConversation(listings[0].id);
    } else {
      setIsPickerOpen(true);
    }
  };

  if (user?.id === sellerId) return null;

  return (
    <>
      <Button
        variant="info"
        size="sm"
        onClick={handleClick}
        disabled={listings.length === 0}
        isLoading={isMessaging && listings.length === 1}
        title={listings.length === 0 ? 'У продавца пока нет активных объявлений' : undefined}
      >
        <ChatIcon size={16} />
        Написать продавцу
      </Button>

      <Modal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} title="По какому товару вопрос?" size="sm">
        <div className="space-y-1">
          {listings.map((listing) => (
            <button
              key={listing.id}
              onClick={() => startConversation(listing.id)}
              disabled={isMessaging}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
                {listing.images[0] && (
                  <Image src={listing.images[0]} alt="" fill sizes="44px" className="object-cover" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-800 truncate">{listing.title}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}
