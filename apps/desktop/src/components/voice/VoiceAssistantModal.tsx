import React, { useEffect, useState } from 'react';
import { Mic, Volume2, X, Zap, Sparkles, Terminal, Calendar, Clock } from 'lucide-react';


interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  isSpeaking: boolean;
  isHandsFree: boolean;
  audioLevel: number;
  lastUserTranscript?: string;
  lastAssistantResponse?: string;
  onToggleListening: () => void;
  onToggleHandsFree: () => void;
  onSendMessage: (text: string, inputType: 'voice') => void;
}

const QUICK_ACTIONS = [
  { icon: <Clock size={14} />, label: "What time is it?", prompt: "What is the current time and date?" },
  { icon: <Terminal size={14} />, label: "Device Telemetry", prompt: "Show real-time CPU, RAM, and battery telemetry." },
  { icon: <Sparkles size={14} />, label: "Daily Briefing", prompt: "Give me a quick morning briefing and system status." },
  { icon: <Calendar size={14} />, label: "Set a reminder", prompt: "Remind me to check my code build in 30 minutes." }
];

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  isListening,
  isSpeaking,
  isHandsFree,
  audioLevel,
  lastUserTranscript,
  lastAssistantResponse,
  onToggleListening,
  onToggleHandsFree,
  onSendMessage
}) => {
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    const scale = 1 + Math.min(audioLevel * 0.8, 0.7);
    setPulseScale(scale);
  }, [audioLevel]);

  if (!isOpen) return null;

  const modeColor = isListening ? '#f43f5e' : isSpeaking ? '#38bdf8' : '#a855f7';
  const modeRgb = isListening ? '244, 63, 94' : isSpeaking ? '56, 189, 248' : '168, 85, 247';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'radial-gradient(circle at 50% 45%, rgba(15, 23, 42, 0.96) 0%, rgba(3, 7, 18, 0.98) 100%)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'env(safe-area-inset-top, 24px) 24px env(safe-area-inset-bottom, 32px) 24px',
        color: '#ffffff',
        animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '600px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: modeColor,
              boxShadow: `0 0 10px ${modeColor}`
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#e2e8f0' }}>
            FRIDAY Voice Assistant
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Hands-Free Toggle */}
          <button
            type="button"
            onClick={onToggleHandsFree}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isHandsFree ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${isHandsFree ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '9999px',
              padding: '6px 12px',
              color: isHandsFree ? 'var(--accent-emerald)' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
            title={isHandsFree ? "Auto Turn-Taking Enabled" : "Enable Hands-Free Continuous Loop"}
          >
            <Zap size={13} color={isHandsFree ? 'var(--accent-emerald)' : '#94a3b8'} />
            <span>{isHandsFree ? 'Hands-Free ON' : 'Push-To-Talk'}</span>
          </button>

          {/* Close Assistant Modal */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            title="Exit Voice Mode"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Central Ambient Orb & Particle Field */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          gap: '28px',
          width: '100%',
          maxWidth: '500px'
        }}
      >
        {/* Outer Radiant Energy Waves */}
        <div
          style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${modeRgb}, 0.25) 0%, rgba(${modeRgb}, 0) 70%)`,
            transform: `scale(${pulseScale * 1.3})`,
            transition: 'transform 0.08s ease-out',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${modeRgb}, 0.4) 0%, rgba(${modeRgb}, 0) 70%)`,
            transform: `scale(${pulseScale * 1.15})`,
            transition: 'transform 0.06s ease-out',
            pointerEvents: 'none'
          }}
        />

        {/* 3D Glowing Core Sphere */}
        <div
          onClick={onToggleListening}
          style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            background: isListening
              ? 'radial-gradient(circle at 35% 30%, #fb7185 0%, #e11d48 50%, #881337 100%)'
              : isSpeaking
              ? 'radial-gradient(circle at 35% 30%, #7dd3fc 0%, #0284c7 50%, #0c4a6e 100%)'
              : 'radial-gradient(circle at 35% 30%, #c084fc 0%, #7e22ce 50%, #3b0764 100%)',
            boxShadow: `0 0 ${40 + audioLevel * 50}px rgba(${modeRgb}, 0.7), inset 0 0 20px rgba(255, 255, 255, 0.45)`,
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.06s ease-out, box-shadow 0.06s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          {isListening ? (
            <Mic size={40} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
          ) : isSpeaking ? (
            <Volume2 size={40} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
          ) : (
            <Sparkles size={40} color="#ffffff" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
          )}
        </div>

        {/* State Label & Reactive Equalizer Wave */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              color: modeColor
            }}
          >
            {isListening
              ? "Listening to you..."
              : isSpeaking
              ? "FRIDAY is speaking..."
              : "Tap Orb to speak"}
          </span>

          {/* 9-Band Audio Equalizer Waves */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '28px' }}>
            {[0.6, 0.8, 1.1, 1.4, 1.6, 1.4, 1.1, 0.8, 0.6].map((mult, idx) => {
              const h = Math.max(6, Math.min(28, (audioLevel * 40 * mult)));
              return (
                <div
                  key={idx}
                  style={{
                    width: '3.5px',
                    height: `${h}px`,
                    borderRadius: '9999px',
                    background: modeColor,
                    boxShadow: `0 0 8px rgba(${modeRgb}, 0.6)`,
                    transition: 'height 0.05s ease-out'
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Live Subtitle Transcript Display */}
        <div
          style={{
            width: '100%',
            minHeight: '80px',
            maxHeight: '130px',
            overflowY: 'auto',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '14px 18px',
            textAlign: 'center',
            fontSize: '15px',
            lineHeight: '1.5',
            color: '#f8fafc',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {lastUserTranscript ? (
            <span>"{lastUserTranscript}"</span>
          ) : lastAssistantResponse ? (
            <span style={{ color: 'var(--accent-cyan)' }}>{lastAssistantResponse}</span>
          ) : (
            <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontStyle: 'italic', fontSize: '13.5px' }}>
              "Hey FRIDAY, what can you do?"
            </span>
          )}
        </div>
      </div>

      {/* Bottom Quick Trigger Chips */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          paddingBottom: '8px'
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}
        >
          {QUICK_ACTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSendMessage(item.prompt, 'voice')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '9999px',
                padding: '8px 14px',
                color: '#e2e8f0',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ color: 'var(--accent-rose)' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
