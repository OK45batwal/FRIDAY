import React from 'react';
import { Plus, Search, BookOpen, Settings, Mic, MicOff } from 'lucide-react';
import { FridayLogo } from '../common/FridayLogo';

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
      {/* Geometric Clean Logo & Brand */}
      <FridayLogo size={32} fontSize={17} showText={true} />

      {/* Action Navigation Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Hands-Free Wake Word Toggle Pill */}
        <button
          onClick={onToggleWakeWord}
          className="nav-pill"
          style={{
            borderColor: wakeWordEnabled ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)',
            background: wakeWordEnabled ? 'rgba(244, 63, 94, 0.1)' : 'rgba(255, 255, 255, 0.04)',
            color: wakeWordEnabled ? '#ffffff' : '#94a3b8'
          }}
          title={wakeWordEnabled ? "Always-On Wake Word Enabled (Say 'Hey FRIDAY')" : "Wake Word Inactive (Click to Enable)"}
        >
          {wakeWordEnabled ? <Mic size={14} color="#f43f5e" /> : <MicOff size={14} color="#64748b" />}
          <span>{wakeWordEnabled ? 'Hey FRIDAY' : 'Wake Word Off'}</span>
        </button>

        <button onClick={onNewChat} className="nav-pill">
          <Plus size={14} color="#f43f5e" />
          <span>New chat</span>
        </button>

        <button onClick={onToggleSearch} className="nav-pill">
          <Search size={14} color="#94a3b8" />
          <span>Search chats</span>
        </button>

        <button onClick={onOpenLibrary} className="nav-pill">
          <BookOpen size={14} color="#94a3b8" />
          <span>Tools & Agents</span>
        </button>

        <button onClick={onOpenConfig} className="nav-pill">
          <Settings size={14} color="#94a3b8" />
          <span>Config</span>
        </button>

        {/* User Profile Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '13px',
            fontWeight: 700,
            color: '#ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.15)',
            marginLeft: '4px'
          }}
          title="Omkar (Pro)"
        >
          O
        </div>
      </div>
    </header>
  );
};
