import React from 'react';
import { Terminal, Globe, Code2, Calculator, Sparkles } from 'lucide-react';
import { FridayLogo } from '../common/FridayLogo';

interface WelcomeHeroProps {
  onTriggerPrompt: (prompt: string) => void;
}

const INSPIRATION_PROMPTS = [
  {
    icon: <Code2 size={16} color="var(--accent-rose)" />,
    label: "Write an async Python service",
    prompt: "Write a high-performance asynchronous Python service with FastAPI and type annotations."
  },
  {
    icon: <Terminal size={16} color="var(--accent-emerald)" />,
    label: "Check hardware telemetry",
    prompt: "Show real-time CPU utilization, RAM usage, and battery telemetry."
  },
  {
    icon: <Calculator size={16} color="var(--accent-cyan)" />,
    label: "Calculate math & physics",
    prompt: "Derive the derivative of x^3 * e^(2x) and calculate 25 * 40 + 120."
  },
  {
    icon: <Globe size={16} color="#a855f7" />,
    label: "Search web & latest research",
    prompt: "Search the web for the latest artificial intelligence breakthroughs."
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
        margin: '0 auto',
        animation: 'fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Friday Center Logo & Ambient Hero Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            padding: '12px',
            borderRadius: '24px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FridayLogo size={52} showText={false} />
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: '9999px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', color: 'var(--accent-rose)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          <Sparkles size={12} />
          <span>On-Device Neural Engine Active</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.8px',
            lineHeight: '1.2'
          }}
        >
          What can I help you with today?
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '520px', lineHeight: '1.6' }}>
          Ask any question, write production code, run calculus, or automate your system.
        </p>
      </div>

      {/* Clean Theme-Adaptive Inspiration Chips */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '680px'
        }}
      >
        {INSPIRATION_PROMPTS.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onTriggerPrompt(item.prompt)}
            className="glass-panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 18px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.borderColor = 'var(--border-focus)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {item.icon}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Click to run</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
