import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Terminal, CornerDownLeft, Code2, Calculator, Globe } from 'lucide-react';


interface SpotlightOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

const QUICK_SPOTLIGHT_MODES = [
  { icon: <Terminal size={13} color="var(--accent-rose)" />, label: "System Telemetry", prompt: "Show real-time CPU, RAM, and battery telemetry." },
  { icon: <Calculator size={13} color="var(--accent-cyan)" />, label: "Calculate", prompt: "Calculate 125 * 8 - 250 and convert 100C to Fahrenheit." },
  { icon: <Code2 size={13} color="var(--accent-emerald)" />, label: "Write Code", prompt: "Write an async Python service with FastAPI." },
  { icon: <Globe size={13} color="#a855f7" />, label: "Web Search", prompt: "Search the web for latest AI news." }
];

export const SpotlightOverlay: React.FC<SpotlightOverlayProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && query.trim()) {
      onSubmit(query.trim());
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        animation: 'fadeIn 0.15s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Floating Raycast/Spotlight Bar */}
      <div
        className="glass-panel"
        style={{
          width: '640px',
          maxWidth: '92vw',
          background: 'rgba(10, 14, 26, 0.95)',
          border: '1px solid var(--accent-rose)',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(244, 63, 94, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Input Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <Sparkles size={20} color="var(--accent-rose)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask FRIDAY anything, run commands, or calculate math... (ESC to exit)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontSize: '15px',
              fontWeight: 500,
              outline: 'none',
              fontFamily: 'inherit'
            }}
          />
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                onSubmit(query.trim());
                onClose();
              }}
              style={{
                background: 'var(--accent-rose)',
                border: 'none',
                borderRadius: '8px',
                padding: '4px 10px',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <span>RUN</span>
              <CornerDownLeft size={11} />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Suggestion Palette */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px', paddingLeft: '8px' }}>
            Quick Actions
          </div>
          {QUICK_SPOTLIGHT_MODES.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSubmit(item.prompt);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background 0.1s ease',
                color: 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {item.icon}
                <span style={{ fontSize: '13px', fontWeight: 500 }}>{item.label}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>⏎ Enter</span>
            </div>
          ))}
        </div>

        {/* Footer shortcuts info */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}
        >
          <span>Global Shortcut: <kbd style={{ padding: '2px 4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}>⌘ ⇧ Space</kbd></span>
          <span>Press <kbd style={{ padding: '2px 4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}>ESC</kbd> to dismiss</span>
        </div>
      </div>
    </div>
  );
};
