import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import { WelcomeHero } from '../home/WelcomeHero';
import type { Message } from '../../types';

interface ChatPanelProps {
  messages: Message[];
  selectedAgent?: string;
  onSpeak: (text: string) => void;
  onSelectAgent?: (agentId: string) => void;
  onTriggerPrompt: (prompt: string, agentId?: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSpeak,
  onTriggerPrompt
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <WelcomeHero
          onTriggerPrompt={(prompt) => onTriggerPrompt(prompt, 'general')}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', maxWidth: '860px', margin: '0 auto', width: '100%' }}>
      {messages.map((m) => {
        return (
          <MessageItem
            key={m.id}
            message={m}
            onSpeak={onSpeak}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
