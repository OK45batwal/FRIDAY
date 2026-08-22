import React from 'react';
import { Plus, Search, BookOpen, Settings, Sparkles, Mic, MicOff } from 'lucide-react';

interface NavbarProps {
  wakeWordEnabled: boolean;
  onToggleWakeWord: () => void;
  onNewChat: () => void;
  onOpenConfig: () => void;
  onOpenLibrary: () => void;
  onToggleSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wakeWordEnabled,
  onToggleWakeWord,
  onNewChat,
  onOpenConfig,
  onOpenLibrary,
  onToggleSearch
}) => {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(12, 13, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}
    >
      {/* Brand & Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #ff2a5f 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)'
          }}
        >
          <Sparkles size={16} />
        </div>
        <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.5px' }}>
          FRIDAY
        </span>
      </div>

      {/* Action Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Hands-Free Wake Word Toggle Pill */}
        <button
          onClick={onToggleWakeWord}
          className="nav-pill"
          style={{
            borderColor: wakeWordEnabled ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.08)',
            background: wakeWordEnabled ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            color: wakeWordEnabled ? '#ffffff' : '#9ca3af'
          }}
          title={wakeWordEnabled ? "Always-On Wake Word Enabled (Say 'Hey FRIDAY')" : "Wake Word Inactive (Click to Enable)"}
        >
          {wakeWordEnabled ? <Mic size={14} color="#ef4444" /> : <MicOff size={14} color="#6b7280" />}
          <span>{wakeWordEnabled ? 'Hey FRIDAY' : 'Wake Word Off'}</span>
        </button>

        <button onClick={onNewChat} className="nav-pill">
          <Plus size={14} color="#ef4444" />
          <span>New chat</span>
        </button>

        <button onClick={onToggleSearch} className="nav-pill">
          <Search size={14} color="#9ca3af" />
          <span>Search chats</span>
        </button>

        <button onClick={onOpenLibrary} className="nav-pill">
          <BookOpen size={14} color="#9ca3af" />
          <span>Tools & Agents</span>
        </button>

        <button onClick={onOpenConfig} className="nav-pill">
          <Settings size={14} color="#9ca3af" />
          <span>Config</span>
        </button>

        {/* User Avatar Badge */}
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            marginLeft: '4px'
          }}
          title="Omkar (Pro Active)"
        >
          O
        </div>
      </div>
    </header>
  );
};
