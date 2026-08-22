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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [feedbackState, setFeedbackState] = useState<'like' | 'dislike' | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const isUser = message.role === 'user';
  const isVoice = message.input_type === 'voice';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSpeak = () => {
    setIsPlayingAudio(true);
    onSpeak(message.content);
    setTimeout(() => setIsPlayingAudio(false), 4500);
  };

  const handleFeedback = async (type: 'like' | 'dislike') => {
    if (feedbackState === type) return;
    setFeedbackState(type);

    const promptText = previousUserMessage || "User Query";
    try {
      await api.sendFeedback(promptText, message.content, type);
      if (type === 'like') {
        setFeedbackNotice("Reward registered! FRIDAY learned this.");
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
        gap: '14px',
        margin: '16px 0',
        alignItems: 'flex-start'
      }}
    >
      {/* Tesla Avatar Icon */}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: isUser ? 'rgba(255, 255, 255, 0.12)' : 'linear-gradient(135deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.18) 100%)',
          border: isUser ? '1px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(244, 63, 94, 0.55)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: isUser ? '#ffffff' : '#f43f5e',
          boxShadow: isUser ? '0 0 16px rgba(255, 255, 255, 0.12)' : '0 0 18px rgba(244, 63, 94, 0.3)',
          flexShrink: 0
        }}
      >
        {isUser ? <User size={18} /> : <Sparkles size={18} />}
      </div>

      {/* Tesla Glass Bubble Container */}
      <div
        style={{
          maxWidth: '84%',
          background: isUser ? 'rgba(255, 255, 255, 0.06)' : 'rgba(14, 16, 23, 0.95)',
          border: isUser ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(244, 63, 94, 0.2)',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          padding: '16px 20px',
          color: '#ffffff',
          boxShadow: isUser ? '0 6px 24px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Bubble Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-display)', color: isUser ? '#ffffff' : '#f43f5e', letterSpacing: '0.6px' }}>
              {isUser ? 'YOU' : 'FRIDAY ASSISTANT'}
            </span>
            {isPlayingAudio && (
              <div className="audio-wave-container" title="Audio streaming active">
                <div className="audio-bar" />
                <div className="audio-bar" />
                <div className="audio-bar" />
                <div className="audio-bar" />
                <div className="audio-bar" />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isVoice && (
              <span style={{ fontSize: '10px', color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, background: 'rgba(244, 63, 94, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                <Mic size={11} /> Voice
              </span>
            )}
            <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
              {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div style={{ fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap', color: '#f8fafc' }}>
          {message.content ? (
            message.content
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f43f5e', fontSize: '13px', padding: '4px 0' }}>
              <span className="audio-bar" style={{ height: '8px', animation: 'wave-bar 0.6s infinite alternate' }} />
              <span className="audio-bar" style={{ height: '12px', animation: 'wave-bar 0.6s 0.2s infinite alternate' }} />
              <span className="audio-bar" style={{ height: '8px', animation: 'wave-bar 0.6s 0.4s infinite alternate' }} />
              <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px' }}>FRIDAY is thinking...</span>
            </div>
          )}
        </div>

        {/* Smart Response Card */}
        {!isUser && <SmartCard content={message.content} />}

        {/* Footer Actions & Continuous Learning Reinforcement Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isUser && (
              <button
                onClick={handleSpeak}
                className="btn-action-icon"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isPlayingAudio ? '#10b981' : '#f43f5e',
                  gap: '5px',
                  background: isPlayingAudio ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.1)',
                  padding: '5px 10px',
                  borderRadius: '6px'
                }}
              >
                <Volume2 size={13} />
                <span>{isPlayingAudio ? 'PLAYING...' : 'SPEAK VOICE'}</span>
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
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: feedbackState === 'like' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                  color: feedbackState === 'like' ? '#10b981' : '#64748b'
                }}
                title="Reward FRIDAY (Learns this answer style)"
              >
                <ThumbsUp size={13} />
              </button>
              <button
                onClick={() => handleFeedback('dislike')}
                className="btn-action-icon"
                style={{
                  padding: '5px 8px',
                  borderRadius: '6px',
                  background: feedbackState === 'dislike' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                  color: feedbackState === 'dislike' ? '#f43f5e' : '#64748b'
                }}
                title="Penalize (Improves policy for next time)"
              >
                <ThumbsDown size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
