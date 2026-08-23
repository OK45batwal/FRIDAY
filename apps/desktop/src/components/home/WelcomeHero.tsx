import React from 'react';
import { Code, Compass, Lightbulb, Sparkles } from 'lucide-react';

interface WelcomeHeroProps {
  onSelectPrompt: (prompt: string, agentId?: string) => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    { icon: <Code size={16} color="#3b82f6" />, label: "Write code", prompt: "Write a clean TypeScript WebSocket client with automatic reconnection." },
    { icon: <Lightbulb size={16} color="#eab308" />, label: "Explain concept", prompt: "Explain how quantum computing works in simple terms." },
    { icon: <Compass size={16} color="#10b981" />, label: "Solve math", prompt: "Calculate the derivative of f(x) = x^3 * e^(2x) step by step." },
    { icon: <Sparkles size={16} color="#ec4899" />, label: "Brainstorm", prompt: "Give me 5 high-impact ideas for my AI assistant project." }
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center'
      }}
    >
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '24px',
          letterSpacing: '-0.5px'
        }}
      >
        What can I help with today?
      </h1>

      {/* Suggestion Chips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          width: '100%',
          maxWidth: '640px'
        }}
      >
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt, 'general')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#d4d4d4',
              fontSize: '13px',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
            }}
          >
            {item.icon}
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '13px' }}>{item.label}</div>
              <div style={{ fontSize: '11px', color: '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.prompt}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
