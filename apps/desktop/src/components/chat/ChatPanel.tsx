import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '../../types';
import { MessageSquare } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  onSpeak: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSpeak }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '6px' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', gap: '8px' }}>
            <MessageSquare size={32} color="#00f0ff" style={{ opacity: 0.4 }} />
            <span style={{ fontSize: '14px', fontFamily: 'Space Grotesk, sans-serif' }}>
              How can I assist you today, Omkar?
            </span>
          </div>
        ) : (
          messages.map((m) => (
            <MessageItem key={m.id} message={m} onSpeak={onSpeak} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
