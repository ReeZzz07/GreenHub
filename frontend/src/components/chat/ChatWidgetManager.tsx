'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { ChatWidgetPanel } from './ChatWidgetPanel';
import { ChatWidgetChip } from './ChatWidgetChip';

// Только десктоп/планшет: на мобильном чат остаётся полноэкранной страницей — там плавающему окну негде развернуться.
export const ChatWidgetManager: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { windows } = useChatWidget();

  if (!isAuthenticated || windows.length === 0) return null;

  const open = windows.filter((w) => !w.minimized);
  const minimized = windows.filter((w) => w.minimized);

  return (
    <div className="hidden md:flex fixed bottom-0 right-4 z-40 items-end gap-3">
      {minimized.length > 0 && (
        <div className="flex items-end gap-2 pb-1">
          {minimized.map((w) => (
            <ChatWidgetChip key={w.conversationId} win={w} />
          ))}
        </div>
      )}
      {open.map((w) => (
        <ChatWidgetPanel key={w.conversationId} win={w} />
      ))}
    </div>
  );
};
