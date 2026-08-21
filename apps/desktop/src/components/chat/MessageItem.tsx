import React from 'react';
import { Volume2, User, Sparkles, Mic } from 'lucide-react';
import { SmartCard } from './SmartCard';
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
      {/* Avatar Icon */}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: isUser ? 'rgba(255, 255, 255, 0.15)' : 'rgba(239, 68, 68, 0.2)',
          border: isUser ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid rgba(239, 68, 68, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: isUser ? '#ffffff' : '#ef4444',
          boxShadow: isUser ? '0 0 12px rgba(255, 255, 255, 0.2)' : '0 0 12px rgba(239, 68, 68, 0.3)',
          flexShrink: 0
        }}
      >
        {isUser ? <User size={18} /> : <Sparkles size={18} />}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '78%',
          background: isUser ? 'rgba(255, 255, 255, 0.08)' : 'rgba(26, 16, 20, 0.85)',
          border: isUser ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          padding: '14px 18px',
          color: '#ffffff',
          boxShadow: isUser ? '0 4px 20px rgba(0, 0, 0, 0.3)' : '0 4px 20px rgba(239, 68, 68, 0.12)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'Orbitron, sans-serif', color: isUser ? '#ffffff' : '#ef4444' }}>
            {isUser ? 'YOU' : 'FRIDAY ASSISTANT'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isVoice && (
              <span style={{ fontSize: '10px', color: '#ff2a5f', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <Mic size={11} /> Voice
              </span>
            )}
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
              {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#f8fafc' }}>
          {message.content}
        </div>

        {/* Embedded Google Assistant Smart Card */}
        {!isUser && <SmartCard content={message.content} />}

        {!isUser && (
          <button
            onClick={() => onSpeak(message.content)}
            style={{
              marginTop: '10px',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 600,
              padding: '2px 0'
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
