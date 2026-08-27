'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useChatWidget, type ChatWindow } from '@/context/ChatWidgetContext';
import { MinusIcon, XIcon, LoaderIcon } from '@/components/Icons';

export const ChatWidgetPanel: React.FC<{ win: ChatWindow }> = ({ win }) => {
  const { user } = useAuth();
  const { minimizeConversation, closeConversation, sendMessage } = useChatWidget();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [win.messages]);

  const counterpart = win.conversation
    ? win.conversation.buyerId === user?.id
      ? win.conversation.seller
      : win.conversation.buyer
    : null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    sendMessage(win.conversationId, content);
    setInput('');
  };

  return (
    <div className="w-80 h-[26rem] bg-white rounded-t-2xl shadow-[0_10px_30px_rgba(19,32,21,0.2)] flex flex-col overflow-hidden flex-shrink-0">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-green-50 to-green-100 flex-shrink-0 overflow-hidden">
          {win.conversation?.listing.images[0] && (
            <Image src={win.conversation.listing.images[0]} alt="" fill sizes="32px" className="object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{counterpart?.name ?? 'Чат'}</p>
          {win.conversation && <p className="text-[11px] text-gray-500 truncate">{win.conversation.listing.title}</p>}
        </div>
        <button
          onClick={() => minimizeConversation(win.conversationId)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Свернуть"
        >
          <MinusIcon size={16} />
        </button>
        <button
          onClick={() => closeConversation(win.conversationId)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          aria-label="Закрыть"
        >
          <XIcon size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
        {win.isLoading ? (
          <div className="h-full flex items-center justify-center">
            <LoaderIcon size={20} className="text-gray-300" />
          </div>
        ) : win.messages.length === 0 ? (
          <p className="text-center text-gray-400 text-xs py-8">Напишите первое сообщение</p>
        ) : (
          win.messages.map((message) => {
            const isOwn = message.senderId === user?.id;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                    isOwn ? 'bg-green-700 text-white' : 'bg-white text-gray-800 border border-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-2.5 py-2 border-t border-gray-100 flex-shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сообщение..."
          className="input-field flex-1 text-sm py-2"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="btn-primary px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
      </form>
    </div>
  );
};
