import React, { useState, useEffect, useRef } from 'react';
import { Mic, ArrowUp, Square } from 'lucide-react';

interface FloatingInputDockProps {
  isListening?: boolean;
  selectedAgent?: string;
  onToggleVoice: () => void;
  onSendMessage: (text: string, inputType: 'text' | 'voice', agentMode?: string) => void;
  onSelectAgent?: (agentId: string) => void;
}

export const FloatingInputDock: React.FC<FloatingInputDockProps> = ({
  onToggleVoice,
  onSendMessage
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize Speech Recognition for Voice
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
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setText(currentTranscript);
        if (event.results[0].isFinal && currentTranscript.trim()) {
          onSendMessage(currentTranscript.trim(), 'voice', 'general');
          setText('');
          setIsRecording(false);
        }
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onSendMessage]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      onToggleVoice();
      return;
    }
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setText('');
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn("Speech start:", err);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text.trim(), 'text', 'general');
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  return (
    <div style={{ width: '100%', maxWidth: '768px', margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          background: '#212121',
          border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '10px 14px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          transition: 'border-color 0.2s ease'
        }}
      >
        {/* Multiline clean text input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={isRecording ? "Listening to your voice..." : "Message FRIDAY..."}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            fontSize: '15px',
            lineHeight: '1.5',
            outline: 'none',
            resize: 'none',
            maxHeight: '160px',
            fontFamily: 'inherit',
            padding: '2px 4px'
          }}
        />

        {/* Voice Mic Button */}
        <button
          type="button"
          onClick={toggleRecording}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: isRecording ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
            flexShrink: 0
          }}
          title={isRecording ? "Stop listening" : "Voice input"}
        >
          {isRecording ? <Square size={14} fill="#ffffff" /> : <Mic size={16} />}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: text.trim() ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: text.trim() ? '#000000' : '#737373',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: text.trim() ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
          title="Send message"
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '11px', color: '#737373' }}>
        FRIDAY can make mistakes. Verify important information.
      </div>
    </div>
  );
};
