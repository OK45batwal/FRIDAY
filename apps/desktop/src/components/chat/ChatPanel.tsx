import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import { SuggestionChips } from './SuggestionChips';
import type { Message } from '../../types';
import { Sparkles } from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  onSpeak: (text: string) => void;
  onSelectSuggestion: (text: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSpeak, onSelectSuggestion }) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        {messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: '12px', textAlign: 'center' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '50%', boxShadow: '0 0 24px rgba(239, 68, 68, 0.3)' }}>
              <Sparkles size={36} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}>
              Hi, how can I help you today?
            </h2>
            <p style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '420px', lineHeight: '1.5' }}>
              Speak or type a command. You can check the weather, launch apps, inspect system diagnostics, or ask any question.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <MessageItem key={m.id} message={m} onSpeak={onSpeak} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Google Assistant Suggestion Chips */}
      <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
        <SuggestionChips onSelectChip={onSelectSuggestion} />
      </div>
    </div>
  );
};
