import React from 'react';
import { Terminal, Globe, Code2, Calculator } from 'lucide-react';
import { FridayLogo } from '../common/FridayLogo';

interface WelcomeHeroProps {
  onTriggerPrompt: (prompt: string) => void;
}

const INSPIRATION_PROMPTS = [
  {
    icon: <Code2 size={15} color="#f43f5e" />,
    label: "Write an async Python service",
    prompt: "Write a high-performance asynchronous Python service with FastAPI and type annotations."
  },
  {
    icon: <Terminal size={15} color="#10b981" />,
    label: "Check hardware telemetry",
    prompt: "Show real-time CPU utilization, RAM usage, and battery telemetry."
  },
  {
    icon: <Calculator size={15} color="#3b82f6" />,
    label: "Calculate math & formulas",
    prompt: "Calculate 10+50+90 and convert 100 C to F"
  },
  {
    icon: <Globe size={15} color="#a855f7" />,
    label: "Search web & latest news",
    prompt: "Search web for the latest artificial intelligence breakthroughs"
  }
];

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({ onTriggerPrompt }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        gap: '32px',
        textAlign: 'center',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto'
      }}
    >
      {/* Friday Center Logo & Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ marginBottom: '4px' }}>
          <FridayLogo size={48} showText={false} />
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '34px',
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.8px',
            lineHeight: '1.2'
          }}
        >
          What can I help with today?
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '520px', lineHeight: '1.6' }}>
          Ask anything, write code, run math, or automate your Mac. FRIDAY understands your intent automatically.
        </p>
      </div>

      {/* Clean Minimal Inspiration Chips (ChatGPT / Gemini Style) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          width: '100%',
          maxWidth: '680px'
        }}
      >
        {INSPIRATION_PROMPTS.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onTriggerPrompt(item.prompt)}
            className="prompt-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              background: 'rgba(14, 16, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)'
              }}
            >
              {item.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>{item.label}</span>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Click to ask</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
