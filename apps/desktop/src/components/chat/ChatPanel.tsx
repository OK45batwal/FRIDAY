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
          onSelectPrompt={(prompt) => onTriggerPrompt(prompt, 'general')}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: '768px', margin: '0 auto', width: '100%' }}>
      {messages.map((m, index) => {
        let previousUserPrompt: string | undefined = undefined;
        if (m.role === 'assistant' && index > 0) {
          const prevMsg = messages[index - 1];
          if (prevMsg.role === 'user') {
            previousUserPrompt = prevMsg.content;
          }
        }
        return (
          <MessageItem
            key={m.id}
            message={m}
            previousUserMessage={previousUserPrompt}
            onSpeak={onSpeak}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
