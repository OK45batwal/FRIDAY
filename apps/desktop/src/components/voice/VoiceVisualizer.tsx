import React from 'react';
import { Mic, Volume2 } from 'lucide-react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
  audioLevel: number;
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  isListening,
  isSpeaking,
  audioLevel
}) => {
  if (!isListening && !isSpeaking) return null;

  const scale = 1 + Math.min(audioLevel * 0.75, 0.6);
  const themeColor = isListening ? 'var(--accent-rose)' : 'var(--accent-cyan)';
  const themeRgb = isListening ? '244, 63, 94' : '56, 189, 248';

  // Multi-frequency bar heights based on level
  const bars = [
    Math.max(8, (audioLevel * 32) * 0.7),
    Math.max(12, (audioLevel * 44) * 0.9),
    Math.max(16, (audioLevel * 56) * 1.1),
    Math.max(22, (audioLevel * 64) * 1.3),
    Math.max(16, (audioLevel * 56) * 1.1),
    Math.max(12, (audioLevel * 44) * 0.9),
    Math.max(8, (audioLevel * 32) * 0.7),
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px 0',
        gap: '10px',
        userSelect: 'none',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Dynamic Cyber Orb with Multi-Layer Radiance */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Ambient Halo Ring */}
        <div
          style={{
            position: 'absolute',
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${themeRgb}, 0.35) 0%, rgba(${themeRgb}, 0) 70%)`,
            transform: `scale(${scale * 1.25})`,
            transition: 'transform 0.08s ease-out',
            pointerEvents: 'none'
          }}
        />

        {/* Central Glowing Core */}
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: isListening
              ? 'radial-gradient(circle at 35% 35%, #fb7185 0%, #e11d48 50%, #881337 100%)'
              : 'radial-gradient(circle at 35% 35%, #7dd3fc 0%, #0284c7 50%, #0c4a6e 100%)',
            boxShadow: `0 0 ${20 + audioLevel * 35}px rgba(${themeRgb}, 0.65), inset 0 0 10px rgba(255, 255, 255, 0.4)`,
            transform: `scale(${scale})`,
            transition: 'transform 0.06s ease-out, box-shadow 0.06s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1
          }}
        >
          {isListening ? (
            <Mic size={20} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
          ) : (
            <Volume2 size={20} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }} />
          )}
        </div>
      </div>

      {/* 7-Band Equalizer Soundwave Spectrum */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '24px' }}>
        {bars.map((h, idx) => (
          <div
            key={idx}
            style={{
              width: '3px',
              height: `${h}px`,
              borderRadius: '9999px',
              background: themeColor,
              boxShadow: `0 0 8px rgba(${themeRgb}, 0.5)`,
              transition: 'height 0.06s ease-out'
            }}
          />
        ))}
      </div>

      {/* Status Mode Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '9999px',
          background: `rgba(${themeRgb}, 0.12)`,
          border: `1px solid rgba(${themeRgb}, 0.3)`,
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '0.8px',
          color: themeColor,
          textTransform: 'uppercase'
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: themeColor,
            boxShadow: `0 0 6px ${themeColor}`
          }}
        />
        <span>{isListening ? 'Listening (Zero-Click VAD)' : 'FRIDAY Speaking'}</span>
      </div>
    </div>
  );
};

