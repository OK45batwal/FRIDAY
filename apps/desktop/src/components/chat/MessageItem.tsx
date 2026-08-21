import React from 'react';
import { Volume2, User, Bot, Mic } from 'lucide-react';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  onSpeak: (text: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSpeak }) => {
  const isUser = message.role === 'user';
  const isVoice = message.input_type === 'voice';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '12px',
        margin: '12px 0',
        alignItems: 'flex-start'
      }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: isUser ? 'rgba(59, 130, 246, 0.25)' : 'rgba(0, 240, 255, 0.25)',
          border: isUser ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(0, 240, 255, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: isUser ? '#3b82f6' : '#00f0ff',
          flexShrink: 0
        }}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div
        style={{
          maxWidth: '75%',
          background: isUser ? 'rgba(30, 41, 59, 0.75)' : 'rgba(15, 23, 42, 0.85)',
          border: isUser ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(0, 240, 255, 0.25)',
          borderRadius: '14px',
          padding: '12px 16px',
          color: '#f8fafc',
          boxShadow: isUser ? '0 4px 14px rgba(59, 130, 246, 0.12)' : '0 4px 14px rgba(0, 240, 255, 0.12)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif', color: isUser ? '#3b82f6' : '#00f0ff' }}>
            {isUser ? 'YOU' : 'FRIDAY'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isVoice && (
              <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Mic size={11} /> Voice
              </span>
            )}
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
          {message.content}
        </div>

        {!isUser && (
          <button
            onClick={() => onSpeak(message.content)}
            style={{
              marginTop: '8px',
              background: 'transparent',
              border: 'none',
              color: '#00f0ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 600
            }}
          >
            <Volume2 size={13} />
            <span>PLAY VOICE</span>
          </button>
        )}
      </div>
    </div>
  );
};
