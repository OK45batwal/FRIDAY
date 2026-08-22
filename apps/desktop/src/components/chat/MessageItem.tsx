import React, { useState } from 'react';
import { Volume2, User, Sparkles, Mic, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SmartCard } from './SmartCard';
import { api } from '../../services/api';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  previousUserMessage?: string;
  onSpeak: (text: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, previousUserMessage, onSpeak }) => {
  const [copied, setCopied] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'like' | 'dislike' | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const isUser = message.role === 'user';
  const isVoice = message.input_type === 'voice';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (feedbackState === type) return;
    setFeedbackState(type);

    const promptText = previousUserMessage || "User Query";
    try {
      await api.sendFeedback(promptText, message.content, type);
      if (type === 'like') {
        setFeedbackNotice("Reward saved! FRIDAY 1.0 learned this.");
      } else {
        setFeedbackNotice("Loss noted. Policy updated to improve.");
      }
      setTimeout(() => setFeedbackNotice(null), 3000);
    } catch (e) {
      console.error("Feedback error:", e);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: '12px',
        margin: '14px 0',
        alignItems: 'flex-start'
      }}
    >
      {/* Avatar Icon */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: isUser ? 'rgba(255, 255, 255, 0.12)' : 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(225, 29, 72, 0.15) 100%)',
          border: isUser ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(244, 63, 94, 0.45)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: isUser ? '#ffffff' : '#f43f5e',
          boxShadow: isUser ? '0 0 14px rgba(255, 255, 255, 0.1)' : '0 0 14px rgba(244, 63, 94, 0.25)',
          flexShrink: 0
        }}
      >
        {isUser ? <User size={16} /> : <Sparkles size={16} />}
      </div>

      {/* Bubble Container */}
      <div
        style={{
          maxWidth: '82%',
          background: isUser ? 'rgba(255, 255, 255, 0.07)' : 'rgba(20, 21, 29, 0.9)',
          border: isUser ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          padding: '14px 18px',
          color: '#ffffff',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
        }}
      >
        {/* Bubble Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-display)', color: isUser ? '#ffffff' : '#f43f5e', letterSpacing: '0.4px' }}>
            {isUser ? 'YOU' : 'FRIDAY 1.0'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isVoice && (
              <span style={{ fontSize: '10px', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <Mic size={11} /> Voice
              </span>
            )}
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div style={{ fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: '#f8fafc' }}>
          {message.content}
        </div>

        {/* Smart Response Card */}
        {!isUser && <SmartCard content={message.content} />}

        {/* Footer Actions & Continuous Learning Reinforcement Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '10px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isUser && (
              <button
                onClick={() => onSpeak(message.content)}
                className="btn-action-icon"
                style={{ fontSize: '11px', fontWeight: 600, color: '#f43f5e', gap: '4px' }}
              >
                <Volume2 size={13} />
                <span>SPEAK</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="btn-action-icon"
              style={{ fontSize: '11px', gap: '4px' }}
              title="Copy message to clipboard"
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span style={{ color: copied ? '#10b981' : '#94a3b8' }}>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          {/* Continuous Learning Reward / Loss Feedback Buttons */}
          {!isUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {feedbackNotice && (
                <span style={{ fontSize: '10px', color: feedbackState === 'like' ? '#10b981' : '#f43f5e', fontWeight: 600, marginRight: '4px' }}>
                  {feedbackNotice}
                </span>
              )}
              <button
                onClick={() => handleFeedback('like')}
                className="btn-action-icon"
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  background: feedbackState === 'like' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: feedbackState === 'like' ? '#10b981' : '#64748b'
                }}
                title="Reward FRIDAY 1.0 (Learns this answer style)"
              >
                <ThumbsUp size={12} />
              </button>
              <button
                onClick={() => handleFeedback('dislike')}
                className="btn-action-icon"
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  background: feedbackState === 'dislike' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                  color: feedbackState === 'dislike' ? '#f43f5e' : '#64748b'
                }}
                title="Penalize (Improves policy for next time)"
              >
                <ThumbsDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
