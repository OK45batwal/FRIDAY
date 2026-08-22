import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Code, Zap, Radio, Globe, FolderTree } from 'lucide-react';
import { AGENT_MODES } from '../home/WelcomeHero';

interface FloatingInputDockProps {
  isListening: boolean;
  selectedAgent: string;
  onToggleVoice: () => void;
  onSendMessage: (text: string, inputType: 'text' | 'voice', agentMode?: string) => void;
  onSelectAgent: (agentId: string) => void;
}

const QUICK_PROMPTS = [
  { id: 'search', label: 'Search web for latest AI news', icon: <Globe size={13} />, agent: 'general' },
  { id: 'files', label: 'List files in project workspace', icon: <FolderTree size={13} />, agent: 'system' },
  { id: 'code', label: 'Write full-stack async Python & React service', icon: <Code size={13} />, agent: 'programming' },
  { id: 'math', label: 'Calculate 10+50+90 and convert 100 C to F', icon: <Zap size={13} />, agent: 'education' }
];

export const FloatingInputDock: React.FC<FloatingInputDockProps> = ({
  isListening,
  selectedAgent,
  onToggleVoice,
  onSendMessage,
  onSelectAgent
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
          // Auto-submit voice transcription
          onSendMessage(text.trim(), 'voice', selectedAgent);
          setText('');
        }
      };

      recognitionRef.current = recognition;
    }
  }, [selectedAgent, text, onSendMessage]);

  const handleToggleMic = () => {
    if (!recognitionRef.current) {
      // Fallback to parent voice toggle if SpeechRecognition unsupported
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
    onSendMessage(text.trim(), 'text', selectedAgent);
    setText('');
  };

  const activeAgent = AGENT_MODES.find(a => a.id === selectedAgent) || AGENT_MODES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '840px', margin: '0 auto' }}>
      
      {/* Tesla Floating Cyber Command Dock */}
      <div
        className="input-dock"
        style={{
          border: isRecording || isListening ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isRecording ? '0 0 25px rgba(244, 63, 94, 0.25)' : 'none'
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Main Input Text Area */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isRecording ? "Listening to your voice... Speak now..." : "Ask FRIDAY anything, search web, manage files, or control your Mac..."}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: isRecording ? '#fb7185' : '#ffffff',
              fontSize: '14px',
              outline: 'none',
              padding: '6px 0',
              fontFamily: 'inherit'
            }}
          />

          {/* Action Controls Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
            {/* Left Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Mode Selector Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: `${activeAgent.color}15`,
                  border: `1px solid ${activeAgent.color}45`,
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  const currentIndex = AGENT_MODES.findIndex(a => a.id === selectedAgent);
                  const nextIndex = (currentIndex + 1) % AGENT_MODES.length;
                  onSelectAgent(AGENT_MODES[nextIndex].id);
                }}
                title="Click to cycle active AI mode"
              >
                <span style={{ color: activeAgent.color }}>{activeAgent.icon}</span>
                <span>{activeAgent.title}</span>
              </div>
            </div>

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
          </div>
        </form>
      </div>

      {/* Quick Suggestion Chips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          width: '100%'
        }}
      >
        {QUICK_PROMPTS.map((prompt) => (
          <div
            key={prompt.id}
            onClick={() => {
              onSelectAgent(prompt.agent);
              onSendMessage(prompt.label, 'text', prompt.agent);
            }}
            className="prompt-card"
          >
            <span style={{ color: '#f43f5e' }}>{prompt.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
              {prompt.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
