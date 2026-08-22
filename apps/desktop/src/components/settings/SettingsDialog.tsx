import React, { useState, useEffect } from 'react';
import { Settings, X, Check, Cpu, Key, Globe, Sparkles, Volume2, HardDrive, Terminal } from 'lucide-react';
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

const LOCAL_MODELS_PRESETS = [
  { id: 'llama3.2:3b', name: 'Meta: Llama 3.2 (3B - Fast on Mac & Android)', size: '1.8 GB' },
  { id: 'llama3.2:1b', name: 'Meta: Llama 3.2 (1B - Ultra-Lightweight)', size: '0.8 GB' },
  { id: 'qwen2.5:3b', name: 'Alibaba: Qwen 2.5 (3B - Code & Math)', size: '1.9 GB' },
  { id: 'deepseek-r1:1.5b', name: 'DeepSeek: R1 Distill (1.5B - Reasoning)', size: '1.1 GB' },
  { id: 'gemma2:2b', name: 'Google: Gemma 2 (2.6B - Mobile Optimized)', size: '1.6 GB' }
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
  const [localModel, setLocalModel] = useState('llama3.2:3b');
  const [localBaseUrl, setLocalBaseUrl] = useState('http://localhost:11434');
  const [installedLocalModels, setInstalledLocalModels] = useState<any[]>([]);
  const [customModel, setCustomModel] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getHealth().then(data => {
        if (data?.ai_provider) setProvider(data.ai_provider);
      }).catch(console.error);

      api.getModels().then(data => {
        if (data?.local_models) setInstalledLocalModels(data.local_models);
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const selectedModel = provider === 'ollama' 
      ? (customModel.trim() || localModel)
      : (customModel.trim() || openrouterModel);

    try {
      await api.updateConfig(provider, apiKey.trim(), selectedModel, localBaseUrl.trim());
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
          maxHeight: '90vh',
          overflowY: 'auto',
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
              AI Brain & Voice Configuration
            </h3>
          </div>
          <button onClick={onClose} className="btn-action-icon">
            <X size={18} />
          </button>
        </div>

        {/* AI Provider Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#f43f5e" /> SELECT AI ENGINE
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(18, 19, 26, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <option value="openrouter">OpenRouter Cloud (Access Claude 3.5, DeepSeek R1, Llama 3.3)</option>
            <option value="ollama">Local LLM (Mac Metal GPU / Android On-Device)</option>
            <option value="mock">Offline Smart Assistant (Built-in No Setup Needed)</option>
            <option value="openai">OpenAI Direct (GPT-4o / GPT-4o-mini)</option>
            <option value="gemini">Google Gemini 1.5 Flash Direct</option>
          </select>
        </div>

        {/* Local LLM Configuration (Mac & Android) */}
        {provider === 'ollama' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255, 255, 255, 0.03)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HardDrive size={14} color="#10b981" /> LOCAL MODEL PRESET
              </label>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600 }}>100% Private & Offline</span>
            </div>

            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(12, 13, 18, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {LOCAL_MODELS_PRESETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.size})
                </option>
              ))}
              {installedLocalModels.map((im) => (
                <option key={im.name} value={im.name}>
                  ⚡ {im.name} (Installed - {im.size_gb} GB)
                </option>
              ))}
            </select>

            {/* Local Server URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8' }}>
                Local Server URL (Mac: <code>http://localhost:11434</code> | Android: <code>http://localhost:8080</code>)
              </label>
              <input
                type="text"
                value={localBaseUrl}
                onChange={(e) => setLocalBaseUrl(e.target.value)}
                placeholder="http://localhost:11434"
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            {/* Terminal Command Tip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.4)', padding: '8px 10px', borderRadius: '6px', fontSize: '11px', color: '#cbd5e1' }}>
              <Terminal size={13} color="#f43f5e" />
              <span>To install on Mac: <code>ollama pull {localModel}</code></span>
            </div>
          </div>
        )}

        {/* OpenRouter Cloud Configuration */}
        {provider === 'openrouter' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={14} color="#f43f5e" /> OPENROUTER MODEL
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
                background: 'rgba(18, 19, 26, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
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
              placeholder="Or enter any custom model ID..."
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
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Key size={14} color="#f43f5e" />
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
                background: 'rgba(18, 19, 26, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        )}

        {/* Voice Persona Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={14} color="#f43f5e" /> FEMALE VOICE PERSONA
            </label>
            {onTestVoice && (
              <button
                type="button"
                onClick={() => onTestVoice("Good day, Omkar. All FRIDAY neural link and voice systems are operating at peak efficiency.")}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f43f5e',
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
          <select
            value={selectedVoiceName}
            onChange={(e) => onSelectVoice?.(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '10px',
              background: 'rgba(18, 19, 26, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
              fontFamily: 'inherit'
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
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
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
          <span>{saved ? 'SETTINGS SAVED & APPLIED' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>
    </div>
  );
};
