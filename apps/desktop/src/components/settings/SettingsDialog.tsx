import React, { useState, useEffect } from 'react';
import { Settings, X, Check, Sparkles, Volume2, ShieldCheck, Zap, Globe, Key } from 'lucide-react';
import { api } from '../../services/api';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTestVoice?: (text: string) => void;
}

const CLOUD_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta: Llama 3.3 (70B - Free Cloud Frontier)' },
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google: Gemini 2.0 Flash (Free)' },
  { id: 'openai/gpt-4o-mini', name: 'OpenAI: ChatGPT (GPT-4o Mini)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic: Claude 3.5 Sonnet' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek: R1 (Reasoning)' }
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  onTestVoice
}) => {
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [cloudKey, setCloudKey] = useState('');
  const [selectedCloudModel, setSelectedCloudModel] = useState('meta-llama/llama-3.3-70b-instruct:free');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getModels().then(data => {
        if (data.active_provider === 'openrouter') {
          setActiveTab('cloud');
          setSelectedCloudModel(data.active_model || 'meta-llama/llama-3.3-70b-instruct:free');
        } else {
          setActiveTab('local');
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndApply = async () => {
    try {
      if (activeTab === 'cloud') {
        await api.updateConfig('openrouter', cloudKey, selectedCloudModel);
      } else {
        await api.updateConfig('local_llm', undefined, 'friday-1.0');
      }
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 500);
    } catch (e) {
      console.error(e);
    }
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
          width: '560px',
          maxWidth: '94%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="#f43f5e" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
              FRIDAY AI Intelligence Mode & Settings
            </h3>
          </div>
          <button onClick={onClose} className="btn-action-icon">
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(0, 0, 0, 0.4)', padding: '4px', borderRadius: '10px' }}>
          <button
            onClick={() => setActiveTab('local')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'local' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              color: activeTab === 'local' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Zap size={14} color={activeTab === 'local' ? '#f43f5e' : '#94a3b8'} />
            <span>⭐ FRIDAY 1.0 (Local SLM)</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'cloud' ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
              color: activeTab === 'cloud' ? '#ffffff' : '#94a3b8',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Globe size={14} color={activeTab === 'cloud' ? '#f43f5e' : '#94a3b8'} />
            <span>⚡ ChatGPT / Claude / Gemini</span>
          </button>
        </div>

        {/* Tab 1: Local SLM Mode */}
        {activeTab === 'local' && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.09) 0%, rgba(225, 29, 72, 0.03) 100%)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                ⭐ FRIDAY 1.0 (1.1B Parameters)
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                ON-DEVICE ACTIVE
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              Our custom 1.1 Billion parameter model trained for Mac & Android. 100% on-device privacy, zero cloud lag (&lt;50ms), and native system control.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', paddingTop: '4px' }}>
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>Quantization:</span> 4-bit Q4_K_M GGUF
              </div>
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>RAM Usage:</span> ~780 MB
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Cloud Frontier Mode */}
        {activeTab === 'cloud' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Globe size={14} color="#f43f5e" /> Select Cloud Frontier Model:
              </label>
              <select
                value={selectedCloudModel}
                onChange={e => setSelectedCloudModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              >
                {CLOUD_MODELS.map(m => (
                  <option key={m.id} value={m.id} style={{ background: '#18181b', color: '#ffffff' }}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Key size={14} color="#f43f5e" /> OpenRouter / OpenAI / Gemini API Key:
              </label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={cloudKey}
                onChange={e => setCloudKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>
                Get a free key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: '#f43f5e', textDecoration: 'underline' }}>openrouter.ai</a> to unlock full ChatGPT, Claude, and Gemini capabilities!
              </span>
            </div>
          </div>
        )}

        {/* Dedicated Voice Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={16} color="#f43f5e" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff' }}>Tara (Indian English Female Voice)</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>16-bit Studio Linear PCM WAV • 185 WPM Pacing</div>
            </div>
          </div>
          {onTestVoice && (
            <button
              type="button"
              onClick={() => onTestVoice("Namaste Omkar. All FRIDAY neural systems and voice links are operating at peak efficiency.")}
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

        {/* Privacy / Security Notice */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 14px', borderRadius: '10px', fontSize: '11px', color: '#10b981' }}>
          <ShieldCheck size={16} />
          <span>Active mode will be saved and applied instantly across your desktop and mobile sessions.</span>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleSaveAndApply}
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
          <span>{saved ? 'SETTINGS APPLIED' : 'APPLY & SAVE SETTINGS'}</span>
        </button>
      </div>
    </div>
  );
};
