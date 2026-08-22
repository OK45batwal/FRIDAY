import React, { useState } from 'react';
import { Plus, Mic, Send, AudioWaveform, Sparkles, FileText, Code, Globe } from 'lucide-react';
import { AGENT_MODES } from '../home/WelcomeHero';

interface FloatingInputDockProps {
  isListening: boolean;
  selectedAgent: string;
  onToggleVoice: () => void;
  onSendMessage: (text: string, inputType: 'text' | 'voice', agentMode?: string) => void;
  onSelectAgent: (agentId: string) => void;
}

const QUICK_PROMPTS = [
  { id: 'spec', label: 'Help me write a project spec', icon: <FileText size={13} />, agent: 'writing' },
  { id: 'code', label: 'Generate full-stack code solution', icon: <Code size={13} />, agent: 'programming' },
  { id: 'research', label: 'Research latest AI frameworks', icon: <Globe size={13} />, agent: 'research' },
  { id: 'sys', label: 'Analyze system architecture & logs', icon: <Sparkles size={13} />, agent: 'system' }
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

  const activeAgent = AGENT_MODES.find(a => a.id === selectedAgent) || AGENT_MODES[1];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', maxWidth: '820px', margin: '0 auto' }}>
      {/* Floating Input Dock Box */}
      <div className="input-dock">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Main Input Text Area */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How can I help you today?"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '15px',
              outline: 'none',
              padding: '4px 0',
              fontFamily: 'inherit'
            }}
          />

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
            {/* Left Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn-action-icon"
                style={{ background: 'rgba(255, 255, 255, 0.06)', borderRadius: '50%', width: '32px', height: '32px' }}
                title="Attach context or file"
              >
                <Plus size={16} color="#9ca3af" />
              </button>

              {/* Mode Selector Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: `${activeAgent.color}15`,
                  border: `1px solid ${activeAgent.color}40`,
                  padding: '4px 10px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const currentIndex = AGENT_MODES.findIndex(a => a.id === selectedAgent);
                  const nextIndex = (currentIndex + 1) % AGENT_MODES.length;
                  onSelectAgent(AGENT_MODES[nextIndex].id);
                }}
                title="Click to switch active agent mode"
              >
                <span style={{ color: activeAgent.color }}>{activeAgent.icon}</span>
                <span>{activeAgent.title}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Mic Icon */}
              <button
                type="button"
                onClick={onToggleVoice}
                className="btn-action-icon"
                style={{
                  color: isListening ? '#ef4444' : '#9ca3af',
                  background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px'
                }}
                title={isListening ? "Listening..." : "Toggle Microphone"}
              >
                <Mic size={18} />
              </button>

              {/* Inspiration Talk Pill */}
              <button
                type="button"
                onClick={onToggleVoice}
                className={`btn-talk ${isListening ? 'listening' : ''}`}
              >
                <AudioWaveform size={16} />
                <span>{isListening ? 'Listening' : 'Talk'}</span>
              </button>

              {text.trim() && (
                <button
                  type="submit"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '34px',
                    height: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <Send size={15} />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Contextual Quick Suggestion Cards */}
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
            <span style={{ color: '#9ca3af' }}>{prompt.icon}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {prompt.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
