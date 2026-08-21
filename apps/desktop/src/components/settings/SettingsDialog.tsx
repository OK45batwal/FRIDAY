import React, { useState, useEffect } from 'react';
import { Settings, X, Check, Cpu, Key, Globe, Sparkles, Volume2 } from 'lucide-react';
import { api } from '../../services/api';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableVoices?: SpeechSynthesisVoice[];
  selectedVoiceName?: string;
  onSelectVoice?: (voiceName: string) => void;
  onTestVoice?: (text: string) => void;
}

const OPENROUTER_POPULAR_MODELS = [
  { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Meta: Llama 3.3 70B Instruct' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek: R1 (Reasoning)' },
  { id: 'anthropic/claude-3.5-sonnet', label: 'Anthropic: Claude 3.5 Sonnet' },
  { id: 'google/gemini-2.0-flash-exp:free', label: 'Google: Gemini 2.0 Flash (Free tier)' },
  { id: 'openai/gpt-4o-mini', label: 'OpenAI: GPT-4o Mini' },
  { id: 'mistralai/mistral-large', label: 'Mistral: Mistral Large' }
];

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  availableVoices = [],
  selectedVoiceName = '',
  onSelectVoice,
  onTestVoice
}) => {
  const [provider, setProvider] = useState('openrouter');
  const [apiKey, setApiKey] = useState('');
  const [openrouterModel, setOpenrouterModel] = useState('meta-llama/llama-3.3-70b-instruct');
  const [customModel, setCustomModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getHealth().then(data => {
        if (data?.ai_provider) setProvider(data.ai_provider);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const selectedModel = customModel.trim() || openrouterModel;
    try {
      await api.updateConfig(provider, apiKey.trim(), selectedModel);
    } catch (err) {
      console.error(err);
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 700);
  };

  const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '540px',
          maxWidth: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          border: '1px solid rgba(239, 68, 68, 0.45)',
          boxShadow: '0 0 32px rgba(239, 68, 68, 0.25)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="#ef4444" />
            <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '15px', color: '#ffffff', letterSpacing: '1px' }}>
              FRIDAY AI CORE CONFIGURATION
            </h3>
          </div>
          <button onClick={onClose} className="btn-action-icon">
            <X size={20} />
          </button>
        </div>

        {/* Voice Persona Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontFamily: 'Orbitron, sans-serif', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={14} color="#ef4444" /> FRIDAY FEMALE VOICE PERSONA
            </label>
            {onTestVoice && (
              <button
                type="button"
                onClick={() => onTestVoice("Good day, Omkar. All FRIDAY neural link and voice systems are operating at peak efficiency.")}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontFamily: 'Orbitron, sans-serif',
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
          <select
            value={selectedVoiceName}
            onChange={(e) => onSelectVoice?.(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(18, 12, 16, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'Space Grotesk, sans-serif'
            }}
          >
            {englishVoices.length > 0 ? (
              englishVoices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name.includes('Moira') ? '🌟 Moira (Irish - F.R.I.D.A.Y. Authentic)' :
                   v.name.includes('Samantha') ? '✨ Samantha (macOS Studio Female)' :
                   v.name.includes('Sonia') ? '🎙️ Sonia (Natural British Female)' :
                   v.name.includes('Ava') ? '⚡ Ava (Natural AI Female)' :
                   v.name.includes('Karen') ? '🎙️ Karen (Refined Female)' :
                   `${v.name} (${v.lang})`}
                </option>
              ))
            ) : (
              <option value="">Default Female Voice</option>
            )}
          </select>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Recommended: <strong>Moira (Irish)</strong> for true Marvel F.R.I.D.A.Y. persona, or <strong>Samantha / Sonia</strong> for studio clarity.
          </span>
        </div>

        {/* AI Provider Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontFamily: 'Orbitron, sans-serif', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#ef4444" /> SELECT AI BRAIN PROVIDER
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(18, 12, 16, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'Space Grotesk, sans-serif'
            }}
          >
            <option value="openrouter">OpenRouter (Access Claude, DeepSeek, Llama, GPT-4o)</option>
            <option value="mock">Offline Smart Assistant (Built-in No Key Needed)</option>
            <option value="openai">OpenAI Direct (GPT-4o / GPT-4o-mini)</option>
            <option value="gemini">Google Gemini 1.5 Flash Direct</option>
            <option value="ollama">Local Ollama (Llama 3 / Local Models)</option>
          </select>
        </div>

        {/* OpenRouter Model Selection */}
        {provider === 'openrouter' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontFamily: 'Orbitron, sans-serif', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} color="#ff2a5f" /> OPENROUTER MODEL
            </label>
            <select
              value={openrouterModel}
              onChange={(e) => {
                setOpenrouterModel(e.target.value);
                setCustomModel('');
              }}
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(18, 12, 16, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {OPENROUTER_POPULAR_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              placeholder="Or enter any custom OpenRouter model ID..."
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>
        )}

        {/* API Key Input */}
        {provider !== 'mock' && provider !== 'ollama' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontFamily: 'Orbitron, sans-serif', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} color="#ef4444" />
              {provider === 'openrouter' ? 'OPENROUTER API KEY' : `${provider.toUpperCase()} API KEY`}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={provider === 'openrouter' ? 'sk-or-v1-...' : 'Enter API Key...'}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(18, 12, 16, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            {provider === 'openrouter' && (
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Get an OpenRouter API key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: '#ef4444' }}>openrouter.ai/keys</a>
              </span>
            )}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            marginTop: '6px',
            padding: '12px',
            borderRadius: '12px',
            background: saved ? '#10b981' : 'linear-gradient(135deg, #ef4444 0%, #ff2a5f 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)',
            transition: 'all 0.2s ease'
          }}
        >
          {saved ? <Check size={18} /> : <Sparkles size={16} />}
          <span>{saved ? 'SETTINGS SAVED & APPLIED' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>
    </div>
  );
};
