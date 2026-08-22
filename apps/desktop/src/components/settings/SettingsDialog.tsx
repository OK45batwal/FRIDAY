import React, { useState, useEffect } from 'react';
import { Settings, X, Check, Sparkles, Volume2, Zap, Globe, Key } from 'lucide-react';
import { api } from '../../services/api';

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
  const [provider, setProvider] = useState<'local_llm' | 'openrouter'>('local_llm');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('google/gemini-2.0-flash-001');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getModels().then(data => {
        if (data.active_provider === 'openrouter') {
          setProvider('openrouter');
          if (data.active_model) setModel(data.active_model);
        } else {
          setProvider('local_llm');
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = async () => {
    try {
      await api.updateConfig(provider, apiKey || undefined, provider === 'openrouter' ? model : 'friday-1.0');
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 600);
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
              FRIDAY Intelligence & Model Settings
            </h3>
          </div>
          <button onClick={onClose} className="btn-action-icon">
            <X size={18} />
          </button>
        </div>

        {/* Intelligence Mode Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setProvider('openrouter')}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: provider === 'openrouter' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${provider === 'openrouter' ? '#f43f5e' : 'rgba(255, 255, 255, 0.08)'}`,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <Globe size={14} color="#f43f5e" /> Cloud Frontier (GPT-4 / Gemini / Claude)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Full reasoning like ChatGPT & Gemini via OpenRouter API.
            </div>
          </button>

          <button
            type="button"
            onClick={() => setProvider('local_llm')}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: provider === 'local_llm' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${provider === 'local_llm' ? '#10b981' : 'rgba(255, 255, 255, 0.08)'}`,
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}>
              <Zap size={14} color="#10b981" /> Local FRIDAY 1.0 (On-Device SLM)
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              100% private, 4-bit GGUF (~780 MB) running locally on Mac/Phone.
            </div>
          </button>
        </div>

        {/* Configuration Body */}
        {provider === 'openrouter' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Key size={13} color="#f43f5e" /> OpenRouter API Key
              </label>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Get an API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: '#f43f5e' }}>openrouter.ai/keys</a> (works with free and paid tiers).
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', display: 'block', marginBottom: '6px' }}>
                Select Frontier Brain Model:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#1a1b26',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '13px'
                }}
              >
                <option value="google/gemini-2.0-flash-001">⚡ Google: Gemini 2.0 Flash (Fast & Ultra-Smart)</option>
                <option value="anthropic/claude-3.5-sonnet">🧠 Anthropic: Claude 3.5 Sonnet (Best Reasoning)</option>
                <option value="openai/gpt-4o-mini">🔥 OpenAI: GPT-4o Mini (ChatGPT Intelligence)</option>
                <option value="meta-llama/llama-3.3-70b-instruct">🦙 Meta: Llama 3.3 (70B Open Source)</option>
                <option value="deepseek/deepseek-r1">🔮 DeepSeek: R1 (Reasoning Master)</option>
              </select>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                ⭐ FRIDAY 1.0 (On-Device SLM)
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 8px', borderRadius: '6px' }}>
                ON-DEVICE & PRIVATE
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
              Our custom 1.1 Billion parameter model trained specifically for your Mac & Android phone. Uses local RAG memory and native OS tools with zero internet dependency.
            </p>
          </div>
        )}

        {/* Voice Card */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
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
              onClick={() => onTestVoice("Namaste Omkar. All FRIDAY neural links and voice systems are operating at peak efficiency.")}
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

        {/* Apply & Save Button */}
        <button
          onClick={handleApply}
          style={{
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
          <span>{saved ? 'SETTINGS SAVED' : 'SAVE & APPLY CONFIGURATION'}</span>
        </button>
      </div>
    </div>
  );
};
