import React, { useState } from 'react';
import { Mic, MicOff, Send, Sparkles, Zap } from 'lucide-react';
import { VoiceVisualizer } from '../voice/VoiceVisualizer';

interface FloatingInputDockProps {
  isListening: boolean;
  isSpeaking?: boolean;
  isHandsFree?: boolean;
  audioLevel?: number;
  selectedAgent?: string;
  onToggleVoice: () => void;
  onToggleHandsFree?: () => void;
  onSendMessage: (text: string, inputType: 'text' | 'voice', agentMode?: string) => void;
  onSelectAgent?: (agentId: string) => void;
}

export const FloatingInputDock: React.FC<FloatingInputDockProps> = ({
  isListening,
  isSpeaking = false,
  isHandsFree = false,
  audioLevel = 0,
  selectedAgent = 'general',
  onToggleVoice,
  onToggleHandsFree,
  onSendMessage
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text', selectedAgent);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '860px', margin: '0 auto', padding: '0 12px' }}>
      {/* Live Acoustic Audio Orb Visualizer */}
      <VoiceVisualizer
        isListening={isListening}
        isSpeaking={isSpeaking}
        audioLevel={audioLevel}
      />

      {/* Main Universal Cyber Command Dock */}
      <div
        className="input-dock"
        style={{
          border: isListening ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
          boxShadow: isListening ? '0 0 25px rgba(244, 63, 94, 0.3)' : 'var(--card-shadow)',
          padding: '10px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
          {/* Neural AI Icon */}
          <div style={{ color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', opacity: 0.9 }}>
            <Sparkles size={18} />
          </div>

          {/* Main Input Text Area */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? "Listening (Zero-Click VAD)..."
                : "Ask FRIDAY anything, generate code, solve calculus, or control your OS..."
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit',
              minWidth: 0
            }}
          />

          {/* Right Controls: Hands-Free Toggle, STT Mic & Send */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {/* Hands-Free Mode Toggle */}
            {onToggleHandsFree && (
              <button
                type="button"
                onClick={onToggleHandsFree}
                className="btn-action-icon"
                style={{
                  color: isHandsFree ? '#ffffff' : 'var(--text-muted)',
                  background: isHandsFree ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isHandsFree ? 'var(--accent-emerald)' : 'var(--border-subtle)'}`,
                  borderRadius: '9999px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  gap: '4px',
                  cursor: 'pointer'
                }}
                title={isHandsFree ? "Hands-Free Auto Turn-Taking Active" : "Enable Hands-Free Continuous Voice Mode"}
              >
                <Zap size={12} color={isHandsFree ? '#ffffff' : 'var(--text-muted)'} />
                <span className="dock-btn-label">{isHandsFree ? 'Hands-Free' : 'Hands-Free'}</span>
              </button>
            )}

            {/* Talk Button */}
            <button
              type="button"
              onClick={onToggleVoice}
              className={`btn-talk ${isListening ? 'listening' : ''}`}
              style={{ padding: '7px 14px' }}
              title={isListening ? "Listening (Click to Stop)" : "Click to Speak"}
            >
              {isListening ? (
                <>
                  <MicOff size={14} />
                  <span>LISTENING</span>
                </>
              ) : (
                <>
                  <Mic size={14} />
                  <span>TALK</span>
                </>
              )}
            </button>

            {text.trim() && (
              <button
                type="submit"
                style={{
                  background: 'var(--accent-rose)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(244, 63, 94, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

