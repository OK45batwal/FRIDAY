import React from 'react';

interface FridayLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  fontSize?: number;
}

export const FridayLogo: React.FC<FridayLogoProps> = ({
  size = 32,
  showText = true,
  textColor = '#ffffff',
  fontSize = 17
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', userSelect: 'none' }}>
      {/* Minimalist Geometric 'F' Spark Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="friday-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff3366" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="friday-accent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fda4af" />
          </linearGradient>
        </defs>

        {/* Outer squircle base */}
        <rect width="40" height="40" rx="10" fill="#14141d" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        
        {/* Geometric Stylized 'F' Icon */}
        <path
          d="M13 11H27C27.5523 11 28 11.4477 28 12V15C28 15.5523 27.5523 16 27 16H18V19H25C25.5523 19 26 19.4477 26 20V23C26 23.5523 25.5523 24 25 24H18V28C18 28.5523 17.5523 29 17 29H14C13.4477 29 13 28.5523 13 28V11Z"
          fill="url(#friday-grad)"
        />
        
        {/* Precision core node dot */}
        <circle cx="25" cy="13.5" r="1.5" fill="#ffffff" />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily: "'Outfit', 'Plus Jakarta Sans', -apple-system, sans-serif",
            fontSize: `${fontSize}px`,
            fontWeight: 700,
            letterSpacing: '0.6px',
            color: textColor
          }}
        >
          FRIDAY
        </span>
      )}
    </div>
  );
};
