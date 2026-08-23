import React from 'react';

interface FridayLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  fontSize?: number;
}

export const FridayLogo: React.FC<FridayLogoProps> = ({
  size = 34,
  showText = true,
  textColor = 'var(--text-primary)',
  fontSize = 17
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', userSelect: 'none', cursor: 'pointer' }}>
      {/* Precision Glowing Cyber Arc Reactor Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, filter: 'drop-shadow(0 0 10px rgba(244, 63, 94, 0.45))' }}
      >
        <defs>
          <linearGradient id="friday-primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff2e63" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="friday-cyan-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <radialGradient id="friday-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(244, 63, 94, 0.3)" />
            <stop offset="100%" stopColor="rgba(244, 63, 94, 0)" />
          </radialGradient>
        </defs>

        {/* Ambient Glow Background */}
        <circle cx="22" cy="22" r="20" fill="url(#friday-glow)" />

        {/* Outer Squircle Ring */}
        <rect
          x="2"
          y="2"
          width="40"
          height="40"
          rx="12"
          fill="rgba(18, 22, 34, 0.9)"
          stroke="url(#friday-primary-grad)"
          strokeWidth="1.5"
        />

        {/* Inner Cyber Circuit Nodes */}
        <path
          d="M14 13H30C30.55 13 31 13.45 31 14V17C31 17.55 30.55 18 30 18H20V21H27C27.55 21 28 21.45 28 22V25C28 25.55 27.55 26 27 26H20V30C20 30.55 19.55 31 19 31H15C14.45 31 14 30.55 14 30V13Z"
          fill="url(#friday-primary-grad)"
        />

        {/* Luminous Quantum Core Node */}
        <circle cx="28" cy="15.5" r="2" fill="#38bdf8" />
        <circle cx="28" cy="15.5" r="3.5" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="0.75" />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: "'Inter', -apple-system, sans-serif",
              fontSize: `${fontSize}px`,
              fontWeight: 800,
              letterSpacing: '0.8px',
              color: textColor,
              lineHeight: 1.1
            }}
          >
            FRIDAY
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '1px',
              color: 'var(--accent-rose)',
              textTransform: 'uppercase'
            }}
          >
            Neural AI
          </span>
        </div>
      )}
    </div>
  );
};
