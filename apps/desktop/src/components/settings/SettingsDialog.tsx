import React, { useState } from 'react';
import { Settings, X, Check, Sparkles, Volume2, ShieldCheck, Zap } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTestVoice?: (text: string) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  onTestVoice
}) => {
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        className="modern-panel"
        style={{
          width: '520px',
          maxWidth: '92%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="#f43f5e" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
              FRIDAY System Status & Configuration
            </h3>
          </div>
          <button onClick={onClose} className="btn-action-icon">
            <X size={18} />
          </button>
        </div>

        {/* Dedicated Model Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(225, 29, 72, 0.03) 100%)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#f43f5e" />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                ⭐ FRIDAY-1B (Dedicated Custom SLM)
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#10b981',
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              ACTIVE PRIMARY
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
            Custom trained model tailored specifically for your Mac & Android phone. Pre-trained on desktop app automation, full-stack programming, and Indian conversational dialogue.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', paddingTop: '4px' }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>Architecture:</span> 4-bit Q4_K_M GGUF
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>RAM Budget:</span> ~780 MB
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>Latency:</span> &lt; 50 ms (0ms network)
            </div>
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>Hardware:</span> Metal GPU & ARM64
            </div>
          </div>
        </div>

        {/* Dedicated Voice Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={16} color="#f43f5e" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Tara (Indian English Female Voice)</div>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>16-bit Studio Linear PCM WAV • Human Pacing (185 WPM)</div>
              </div>
            </div>
            {onTestVoice && (
              <button
                type="button"
                onClick={() => onTestVoice("Namaste Omkar. All FRIDAY-1B neural threads and voice systems are operating at peak efficiency.")}
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#ffffff',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Volume2 size={12} /> TEST VOICE
              </button>
            )}
          </div>
        </div>

        {/* Privacy & Hardware Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#10b981' }}>
          <ShieldCheck size={16} />
          <span>100% On-Device & Private — Zero Cloud Subscriptions or External APIs.</span>
        </div>

        {/* Close Button */}
        <button
          onClick={handleApply}
          style={{
            marginTop: '4px',
            padding: '12px',
            borderRadius: '12px',
            background: saved ? '#10b981' : 'var(--accent-talk)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(244, 63, 94, 0.35)',
            transition: 'all 0.2s ease'
          }}
        >
          {saved ? <Check size={16} /> : <Sparkles size={16} />}
          <span>{saved ? 'CONFIRMED' : 'CLOSE & CONTINUE'}</span>
        </button>
      </div>
    </div>
  );
};
