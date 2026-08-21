import React, { useState } from 'react';
import { Settings, X, Check, Cpu, Key, Database } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [provider, setProvider] = useState('mock');
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
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
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '480px',
          maxWidth: '90%',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} color="#00f0ff" />
            <h3 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: '15px', color: '#00f0ff' }}>
              FRIDAY CORE SETTINGS
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* AI Provider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontFamily: 'Orbitron, sans-serif', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Cpu size={14} color="#00f0ff" /> AI PROVIDER SELECTION
          </label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(10, 15, 30, 0.9)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none'
            }}
          >
            <option value="mock">Offline Smart Assistant (Built-in)</option>
            <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
            <option value="gemini">Google Gemini 1.5 Flash</option>
            <option value="ollama">Local Ollama (Llama 3)</option>
          </select>
        </div>

        {/* API Key */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', fontFamily: 'Orbitron, sans-serif', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Key size={14} color="#00f0ff" /> API KEY (OPTIONAL)
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API Key if using cloud AI..."
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(10, 15, 30, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        {/* Database info */}
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Database size={16} color="#10b981" />
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Database: SQLite Persistent Storage (`friday.db`)</span>
        </div>

        <button
          onClick={handleSave}
          style={{
            padding: '12px',
            borderRadius: '10px',
            background: saved ? '#10b981' : 'linear-gradient(135deg, #00f0ff 0%, #3b82f6 100%)',
            border: 'none',
            color: '#000000',
            fontWeight: 700,
            fontFamily: 'Orbitron, sans-serif',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {saved ? <Check size={18} /> : null}
          <span>{saved ? 'SAVED' : 'SAVE CONFIGURATION'}</span>
        </button>
      </div>
    </div>
  );
};
