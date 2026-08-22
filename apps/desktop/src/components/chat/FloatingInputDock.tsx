import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Radio, Sparkles } from 'lucide-react';

interface FloatingInputDockProps {
  isListening: boolean;
  selectedAgent?: string;
  onToggleVoice: () => void;
  onSendMessage: (text: string, inputType: 'text' | 'voice', agentMode?: string) => void;
  onSelectAgent?: (agentId: string) => void;
}

export const FloatingInputDock: React.FC<FloatingInputDockProps> = ({
  isListening,
  onToggleVoice,
  onSendMessage
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize browser Web Speech Recognition for real-time STT
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setText(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (text.trim()) {
          onSendMessage(text.trim(), 'voice', 'general');
          setText('');
        }
      };

      recognitionRef.current = recognition;
    }
  }, [text, onSendMessage]);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      onToggleVoice();
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        setText('');
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Speech recognition restart:", err);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text', 'general');
    setText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '840px', margin: '0 auto' }}>
      {/* Universal Floating Cyber Command Dock */}
      <div
        className="input-dock"
        style={{
          border: isRecording || isListening ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isRecording ? '0 0 25px rgba(244, 63, 94, 0.25)' : 'none',
          padding: '12px 18px'
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          {/* Neural AI Icon */}
          <div style={{ color: '#f43f5e', display: 'flex', alignItems: 'center', opacity: 0.8 }}>
            <Sparkles size={18} />
          </div>

          {/* Main Input Text Area */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? "Listening to your voice... Speak now..." : "Ask FRIDAY anything, write code, run math, or control your Mac..."}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: isRecording ? '#fb7185' : '#ffffff',
              fontSize: '14px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />

          {/* Right Controls: Real-Time STT Voice & Send */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Native Speech-to-Text Mic Icon */}
            <button
              type="button"
              onClick={handleToggleMic}
              className="btn-action-icon"
              style={{
                color: isRecording ? '#ffffff' : '#94a3b8',
                background: isRecording ? '#f43f5e' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none'
              }}
              title={isRecording ? "Stop Recording & Submit" : "Click to Speak (Speech-To-Text)"}
            >
              {isRecording ? <MicOff size={17} /> : <Mic size={17} />}
            </button>

            {/* Tesla Talk Pill */}
            <button
              type="button"
              onClick={handleToggleMic}
              className={`btn-talk ${isRecording || isListening ? 'listening' : ''}`}
            >
              {isRecording || isListening ? (
                <div className="audio-wave-container">
                  <div className="audio-bar" style={{ background: '#ffffff' }} />
                  <div className="audio-bar" style={{ background: '#ffffff' }} />
                  <div className="audio-bar" style={{ background: '#ffffff' }} />
                </div>
              ) : (
                <Radio size={14} />
              )}
              <span>{isRecording ? 'LISTENING...' : isListening ? 'SPEAKING' : 'TALK'}</span>
            </button>

            {text.trim() && (
              <button
                type="submit"
                style={{
                  background: 'var(--accent-talk)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(244, 63, 94, 0.4)'
                }}
              >
                <Send size={15} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
