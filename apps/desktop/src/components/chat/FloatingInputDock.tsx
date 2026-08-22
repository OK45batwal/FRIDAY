import React, { useState } from 'react';
import { Mic, Send, FileText, Code, Zap, Radio, Sparkles } from 'lucide-react';
import { AGENT_MODES } from '../home/WelcomeHero';

interface FloatingInputDockProps {
  isListening: boolean;
  selectedAgent: string;
  onToggleVoice: () => void;
  onSendMessage: (text: string, inputType: 'text' | 'voice', agentMode?: string) => void;
  onSelectAgent: (agentId: string) => void;
}

const QUICK_PROMPTS = [
  { id: 'spec', label: 'Draft complete project architecture spec', icon: <FileText size={13} />, agent: 'writing' },
  { id: 'code', label: 'Write full-stack async Python & React service', icon: <Code size={13} />, agent: 'programming' },
  { id: 'sys', label: 'Show system hardware telemetry & diagnostics', icon: <Sparkles size={13} />, agent: 'system' },
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
      <div className="input-dock" style={{ border: isListening ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.08)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Main Input Text Area */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask FRIDAY anything, execute code, or control your Mac..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
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

            {/* Right Controls: Tesla Voice & Send */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Mic Icon */}
              <button
                type="button"
                onClick={onToggleVoice}
                className="btn-action-icon"
                style={{
                  color: isListening ? '#f43f5e' : '#94a3b8',
                  background: isListening ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px'
                }}
                title={isListening ? "Listening..." : "Toggle Indian Voice Input"}
              >
                <Mic size={17} />
              </button>

              {/* Tesla Talk Pill */}
              <button
                type="button"
                onClick={onToggleVoice}
                className={`btn-talk ${isListening ? 'listening' : ''}`}
              >
                {isListening ? (
                  <div className="audio-wave-container">
                    <div className="audio-bar" style={{ background: '#ffffff' }} />
                    <div className="audio-bar" style={{ background: '#ffffff' }} />
                    <div className="audio-bar" style={{ background: '#ffffff' }} />
                  </div>
                ) : (
                  <Radio size={14} />
                )}
                <span>{isListening ? 'LISTENING...' : 'TALK'}</span>
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
