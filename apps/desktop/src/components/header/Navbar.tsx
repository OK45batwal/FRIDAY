import React, { useState, useEffect } from 'react';
import { Plus, Search, Settings, Volume2, VolumeX, Sun, Moon, Mic, MessageSquare, Box } from 'lucide-react';


import { FridayLogo } from '../common/FridayLogo';

interface NavbarProps {
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onNewChat: () => void;
  onOpenConfig: () => void;
  onOpenLibrary: () => void;
  onToggleSearch: () => void;
  onOpenVoiceAssistant?: () => void;
  onOpenSpotlight?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  autoSpeak,
  onToggleAutoSpeak,
  onNewChat,
  onOpenConfig,
  onOpenLibrary,
  onToggleSearch,
  onOpenVoiceAssistant,
  onOpenSpotlight
}) => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('FRIDAY_THEME') as 'dark' | 'light') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('FRIDAY_THEME', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background 0.3s ease, border-color 0.3s ease'
      }}
    >
      {/* Brand & Logo */}
      <FridayLogo size={34} fontSize={17} showText={true} />

      {/* Action Navigation Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        
        {/* Fullscreen Voice Assistant Cockpit (Siri / Google Assistant Mode) */}
        {onOpenVoiceAssistant && (
          <button
            onClick={onOpenVoiceAssistant}
            className="nav-pill"
            style={{
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
              border: '1px solid rgba(244, 63, 94, 0.5)',
              color: 'var(--text-primary)',
              boxShadow: '0 0 12px rgba(244, 63, 94, 0.25)'
            }}
            title="Open Siri / Google Assistant Fullscreen Voice Cockpit"
          >
            <Mic size={14} color="var(--accent-rose)" />
            <span>Voice Assistant</span>
          </button>
        )}

        {/* Global Spotlight / Command Palette Button */}
        {onOpenSpotlight && (
          <button
            onClick={onOpenSpotlight}
            className="nav-pill"
            title="Summon Spotlight Command Palette (⌘K)"
          >
            <Search size={14} color="var(--accent-cyan)" />
            <span>Spotlight (⌘K)</span>
          </button>
        )}

        {/* Search / History Toggle */}
        <button
          onClick={onToggleSearch}
          className="nav-pill"
          title="Search conversation history"
        >
          <MessageSquare size={14} color="var(--text-secondary)" />
          <span>History</span>
        </button>

        {/* Theme Toggle (Dark / Light Mode) */}
        <button
          onClick={toggleTheme}
          className="nav-pill"
          style={{
            color: theme === 'dark' ? '#f59e0b' : '#6366f1'
          }}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} color="#6366f1" />}
          <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>


        {/* Voice Auto-Speak Toggle */}
        <button
          onClick={onToggleAutoSpeak}
          className="nav-pill"
          style={{
            borderColor: autoSpeak ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)',
            background: autoSpeak ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-card)',
            color: autoSpeak ? 'var(--text-primary)' : 'var(--text-secondary)'
          }}
          title={autoSpeak ? "Spoken Voice Audio Enabled" : "Voice Audio Muted"}
        >
          {autoSpeak ? <Volume2 size={14} color="#f43f5e" /> : <VolumeX size={14} color="var(--text-muted)" />}
          <span>{autoSpeak ? 'Voice On' : 'Muted'}</span>
        </button>

        <button onClick={onNewChat} className="nav-pill">
          <Plus size={14} color="#f43f5e" />
          <span>New chat</span>
        </button>

        <button onClick={onOpenLibrary} className="nav-pill" title="FRIDAY Store — All Packages, Tools, Agents, and Models">
          <Box size={14} color="var(--accent-rose)" />
          <span>Store & Hub</span>
        </button>

        <button onClick={onOpenConfig} className="nav-pill">
          <Settings size={14} color="var(--text-secondary)" />
          <span>Config</span>
        </button>


        {/* User Avatar */}
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
            border: '1.5px solid var(--border-subtle)',
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

