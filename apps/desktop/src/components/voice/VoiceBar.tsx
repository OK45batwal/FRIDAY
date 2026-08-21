import React, { useState } from 'react';
import { Mic, MicOff, Send, Square, Volume2, VolumeX } from 'lucide-react';
import type { AssistantState } from '../../types';


interface VoiceBarProps {
  state: AssistantState;
  isListening: boolean;
  isSpeaking: boolean;
  autoSpeak: boolean;
  onToggleVoice: () => void;
  onStopSpeaking: () => void;
  onToggleAutoSpeak: () => void;
  onSendMessage: (text: string, inputType: 'text' | 'voice') => void;
}

export const VoiceBar: React.FC<VoiceBarProps> = ({
  state,
  isListening,
  isSpeaking,
  autoSpeak,
  onToggleVoice,
  onStopSpeaking,
  onToggleAutoSpeak,
  onSendMessage
}) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text');
    setText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {/* Google Assistant-style Voice Button */}
        <button
          type="button"
          onClick={onToggleVoice}
          style={{
            padding: '14px 20px',
            borderRadius: '9999px',
            border: isListening ? '1px solid #ff2a5f' : '1px solid rgba(255, 255, 255, 0.25)',
            background: isListening
              ? 'linear-gradient(135deg, #ef4444 0%, #ff2a5f 100%)'
              : 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '12px',
            boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
            transition: 'all 0.2s ease'
          }}
          title={isListening ? "Stop Voice Listening" : "Tap to Speak"}
        >
          {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          <span>{isListening ? 'LISTENING' : 'SPEAK'}</span>
        </button>

        {/* Input Bar */}
        <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask FRIDAY anything (e.g. 'What's the weather?', 'Open Spotify', 'System status')..."
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '9999px',
              background: 'rgba(22, 14, 18, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'Space Grotesk, sans-serif',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.3)'
            }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || state === 'THINKING'}
          style={{
            padding: '14px 22px',
            borderRadius: '9999px',
            background: text.trim()
              ? 'linear-gradient(135deg, #ef4444 0%, #ff2a5f 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: '#ffffff',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '12px',
            boxShadow: text.trim() ? '0 0 16px rgba(239, 68, 68, 0.4)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <span>SEND</span>
          <Send size={15} />
        </button>

        {/* Stop Speaking button */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            style={{
              padding: '14px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.3)',
              border: '1px solid #ef4444',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            title="Stop Assistant Voice"
          >
            <Square size={16} />
          </button>
        )}

        {/* Auto-speak Toggle */}
        <button
          type="button"
          onClick={onToggleAutoSpeak}
          style={{
            padding: '14px',
            borderRadius: '9999px',
            background: autoSpeak ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: autoSpeak ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: autoSpeak ? '#ffffff' : '#64748b',
            cursor: 'pointer'
          }}
          title={autoSpeak ? "Spoken Voice Responses Enabled" : "Voice Responses Muted"}
        >
          {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </form>
    </div>
  );
};
