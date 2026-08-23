import React from 'react';

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

  const scale = 1 + audioLevel * 0.8;
  const glow = isListening
    ? `0 0 ${20 + audioLevel * 40}px rgba(244, 63, 94, 0.7)`
    : `0 0 ${20 + audioLevel * 40}px rgba(56, 189, 248, 0.7)`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 0',
        userSelect: 'none'
      }}
    >
      {/* Siri / ChatGPT Voice Orb */}
      <div
        style={{
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: isListening
            ? 'radial-gradient(circle, #f43f5e 0%, #be123c 60%, rgba(244,63,94,0.2) 100%)'
            : 'radial-gradient(circle, #38bdf8 0%, #0284c7 60%, rgba(56,189,248,0.2) 100%)',
          boxShadow: glow,
          transform: `scale(${scale})`,
          transition: 'transform 0.08s ease-out, box-shadow 0.08s ease-out',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            opacity: 0.85
          }}
        />
      </div>
    </div>
  );
};
