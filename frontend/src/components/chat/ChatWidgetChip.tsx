'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatWidget, type ChatWindow } from '@/context/ChatWidgetContext';
import { XIcon } from '@/components/Icons';

export const ChatWidgetChip: React.FC<{ win: ChatWindow }> = ({ win }) => {
  const { user } = useAuth();
  const { openConversation, closeConversation } = useChatWidget();

  const counterpart = win.conversation
    ? win.conversation.buyerId === user?.id
      ? win.conversation.seller
      : win.conversation.buyer
    : null;
  const label = counterpart?.name ?? '…';

  return (
    <div className="relative flex-shrink-0 group">
      <button
        onClick={() => openConversation(win.conversationId)}
        className="w-14 h-14 rounded-full bg-white shadow-[0_6px_16px_rgba(19,32,21,0.18)] border border-gray-100 flex items-center justify-center text-sm font-bold text-green-700 hover:shadow-lg transition-shadow"
        aria-label={`Открыть чат: ${label}`}
        title={label}
      >
        {label.charAt(0).toUpperCase()}
        {win.hasUnread && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white" />
        )}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          closeConversation(win.conversationId);
        }}
        className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Закрыть чат"
      >
        <XIcon size={11} />
      </button>
    </div>
  );
};
