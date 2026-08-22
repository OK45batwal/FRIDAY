import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Radio, Sparkles, X, Check } from 'lucide-react';

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
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Initialize browser Web Speech Recognition for real-time STT
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setLiveTranscript(currentTranscript);
        setText(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleStartRecording = () => {
    if (!recognitionRef.current) {
      onToggleVoice();
      return;
    }

    try {
      setText('');
      setLiveTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Speech recognition start:", err);
    }
  };

  const handleStopAndSend = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    const finalMsg = (liveTranscript || text).trim();
    if (finalMsg) {
      onSendMessage(finalMsg, 'voice', 'general');
      setText('');
      setLiveTranscript('');
    }
  };

  const handleCancelRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setText('');
    setLiveTranscript('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text', 'general');
    setText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', maxWidth: '840px', margin: '0 auto', position: 'relative' }}>
      
      {/* 🌟 ENLARGED PROMINENT CYBER VOICE LISTENING HUD OVERLAY */}
      {isRecording && (
        <div
          style={{
            position: 'absolute',
            bottom: '75px',
            left: 0,
            right: 0,
            background: 'rgba(11, 13, 19, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 35px rgba(244, 63, 94, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 50
          }}
        >
          {/* Header Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="pulse-circle" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f43f5e' }} />
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f43f5e', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                FRIDAY Voice Listening...
              </span>
            </div>

            {/* Equalizer Visualizer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '18px' }}>
              <div className="audio-bar" style={{ background: '#f43f5e', height: '18px', animation: 'wave 0.8s infinite' }} />
              <div className="audio-bar" style={{ background: '#f43f5e', height: '14px', animation: 'wave 1.1s infinite 0.1s' }} />
              <div className="audio-bar" style={{ background: '#f43f5e', height: '20px', animation: 'wave 0.9s infinite 0.2s' }} />
              <div className="audio-bar" style={{ background: '#f43f5e', height: '12px', animation: 'wave 1.2s infinite 0.3s' }} />
              <div className="audio-bar" style={{ background: '#f43f5e', height: '16px', animation: 'wave 0.7s infinite 0.4s' }} />
            </div>
          </div>

          {/* Real-Time Live Transcript Preview Area */}
          <div
            style={{
              minHeight: '60px',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '15px',
              color: liveTranscript ? '#ffffff' : '#64748b',
              lineHeight: '1.5',
              fontStyle: liveTranscript ? 'normal' : 'italic'
            }}
          >
            {liveTranscript || "Speak now, I'm listening to your request..."}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={handleCancelRecording}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <X size={14} />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={handleStopAndSend}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: '9999px',
                background: '#f43f5e',
                border: 'none',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4)'
              }}
            >
              <Check size={14} />
              <span>Send Query</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Universal Cyber Command Dock */}
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
            placeholder={isRecording ? "Listening to your voice..." : "Ask FRIDAY anything, write code, run math, or control your Mac..."}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
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
              onClick={isRecording ? handleStopAndSend : handleStartRecording}
              className="btn-action-icon"
              style={{
                color: isRecording ? '#ffffff' : '#94a3b8',
                background: isRecording ? '#f43f5e' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                animation: isRecording ? 'pulse 1.5s infinite' : 'none'
              }}
              title={isRecording ? "Click to Submit Voice" : "Click to Speak (Speech-To-Text)"}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Tesla Talk Pill */}
            <button
              type="button"
              onClick={isRecording ? handleStopAndSend : handleStartRecording}
              className={`btn-talk ${isRecording || isListening ? 'listening' : ''}`}
              style={{ padding: '7px 16px' }}
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
