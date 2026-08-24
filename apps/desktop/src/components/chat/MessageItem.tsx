import React, { useState } from 'react';
import { Volume2, User, Sparkles, Mic, Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SmartCard } from './SmartCard';
import { api } from '../../services/api';
import type { Message } from '../../types';

interface MessageItemProps {
  message: Message;
  onSpeak: (text: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onSpeak }) => {
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

    // Feedback references the stored message by id. Optimistic temp ids from the
    // streaming path (asst_/user_ prefixes) are not real rows yet, so there is
    // nothing on the server to rate.
    if (!message.id || message.id.startsWith('asst_') || message.id.startsWith('user_')) {
      setFeedbackNotice("Still saving — try again in a moment.");
      setTimeout(() => setFeedbackNotice(null), 3000);
      return;
    }

    setFeedbackState(type);
    try {
      await api.sendFeedback(message.id, type);
      if (type === 'like') {
        setFeedbackNotice("Learned! Policy updated.");
      } else {
        setFeedbackNotice("Noted. Adjusted behavior.");
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
        margin: '18px 0',
        alignItems: 'flex-start'
      }}
    >
      {/* Avatar Icon */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '12px',
          background: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(244, 63, 94, 0.15)',
          border: isUser ? '1px solid var(--border-subtle)' : '1px solid rgba(244, 63, 94, 0.4)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: isUser ? 'var(--text-primary)' : 'var(--accent-rose)',
          boxShadow: isUser ? 'none' : '0 0 16px rgba(244, 63, 94, 0.2)',
          flexShrink: 0
        }}
      >
        {isUser ? <User size={18} /> : <Sparkles size={18} />}
      </div>

      {/* Message Bubble Container */}
      <div
        className="glass-panel"
        style={{
          maxWidth: '84%',
          background: isUser ? 'var(--bg-card-hover)' : 'var(--bg-card)',
          border: isUser ? '1px solid var(--border-subtle)' : '1px solid rgba(244, 63, 94, 0.25)',
          borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
          padding: '16px 20px',
          color: 'var(--text-primary)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        {/* Bubble Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, fontFamily: 'var(--font-display)', color: isUser ? 'var(--text-primary)' : 'var(--accent-rose)', letterSpacing: '0.6px' }}>
              {isUser ? 'YOU' : 'FRIDAY'}
            </span>
            {isPlayingAudio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <div className="audio-bar" style={{ background: 'var(--accent-emerald)', height: '12px', animation: 'wave 0.8s infinite' }} />
                <div className="audio-bar" style={{ background: 'var(--accent-emerald)', height: '16px', animation: 'wave 1s infinite 0.2s' }} />
                <div className="audio-bar" style={{ background: 'var(--accent-emerald)', height: '10px', animation: 'wave 0.7s infinite 0.4s' }} />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isVoice && (
              <span style={{ fontSize: '10px', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 700, background: 'rgba(244, 63, 94, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                <Mic size={11} /> Voice
              </span>
            )}
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
        </div>

        {/* Message Content */}
        <div style={{ fontSize: '14px', lineHeight: '1.65', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
          {message.content ? (
            message.content
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', fontSize: '13px', padding: '4px 0' }}>
              <span className="audio-bar" style={{ background: 'var(--accent-rose)', height: '8px', animation: 'wave 0.6s infinite alternate' }} />
              <span className="audio-bar" style={{ background: 'var(--accent-rose)', height: '14px', animation: 'wave 0.6s 0.2s infinite alternate' }} />
              <span className="audio-bar" style={{ background: 'var(--accent-rose)', height: '8px', animation: 'wave 0.6s 0.4s infinite alternate' }} />
              <span style={{ color: 'var(--text-secondary)', fontSize: '12px', marginLeft: '6px' }}>FRIDAY is reasoning...</span>
            </div>
          )}
        </div>

        {/* Smart Response Card */}
        {!isUser && message.content && message.content.length > 5 && <SmartCard content={message.content} />}

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isUser && (
              <button
                onClick={handleSpeak}
                className="btn-action-icon"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isPlayingAudio ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  gap: '5px',
                  background: isPlayingAudio ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.1)',
                  padding: '5px 10px',
                  borderRadius: '6px'
                }}
              >
                <Volume2 size={13} />
                <span>{isPlayingAudio ? 'SPEAKING...' : 'SPEAK'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="btn-action-icon"
              style={{ fontSize: '11px', gap: '4px', color: 'var(--text-secondary)' }}
              title="Copy message to clipboard"
            >
              {copied ? <Check size={13} color="var(--accent-emerald)" /> : <Copy size={13} />}
              <span style={{ color: copied ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>

          {/* Continuous Learning Reinforcement Feedback Buttons */}
          {!isUser && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {feedbackNotice && (
                <span style={{ fontSize: '10px', color: feedbackState === 'like' ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontWeight: 600, marginRight: '4px' }}>
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
                  color: feedbackState === 'like' ? 'var(--accent-emerald)' : 'var(--text-muted)'
                }}
                title="Good response"
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
                  color: feedbackState === 'dislike' ? 'var(--accent-rose)' : 'var(--text-muted)'
                }}
                title="Improve response"
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
