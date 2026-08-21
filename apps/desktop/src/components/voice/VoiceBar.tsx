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
        {/* Push-to-talk Button */}
        <button
          type="button"
          onClick={onToggleVoice}
          style={{
            padding: '14px 18px',
            borderRadius: '12px',
            border: isListening ? '1px solid #10b981' : '1px solid rgba(0, 240, 255, 0.4)',
            background: isListening ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0, 240, 255, 0.1)',
            color: isListening ? '#10b981' : '#00f0ff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '12px',
            boxShadow: isListening ? '0 0 16px rgba(16, 185, 129, 0.4)' : 'none'
          }}
          title={isListening ? "Stop Listening" : "Push to Talk"}
        >
          {isListening ? <Mic size={18} /> : <MicOff size={18} />}
          <span>{isListening ? 'LISTENING' : 'VOICE'}</span>
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Command FRIDAY (type or speak)..."
          style={{
            flex: 1,
            padding: '14px 18px',
            borderRadius: '12px',
            background: 'rgba(10, 15, 30, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'Space Grotesk, sans-serif'
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!text.trim() || state === 'THINKING'}
          style={{
            padding: '14px 20px',
            borderRadius: '12px',
            background: text.trim() ? 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            color: text.trim() ? '#000000' : 'rgba(255, 255, 255, 0.3)',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '12px',
            boxShadow: text.trim() ? '0 0 16px rgba(0, 240, 255, 0.4)' : 'none'
          }}
        >
          <span>SEND</span>
          <Send size={16} />
        </button>

        {/* Stop Speaking button if active */}
        {isSpeaking && (
          <button
            type="button"
            onClick={onStopSpeaking}
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid #ef4444',
              color: '#ef4444',
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
            borderRadius: '12px',
            background: autoSpeak ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: autoSpeak ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: autoSpeak ? '#00f0ff' : '#64748b',
            cursor: 'pointer'
          }}
          title={autoSpeak ? "Auto-Speak Voice Enabled" : "Auto-Speak Voice Muted"}
        >
          {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      </form>
    </div>
  );
};
