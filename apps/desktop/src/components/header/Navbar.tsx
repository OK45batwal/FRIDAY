import React from 'react';
import { PanelLeft, Plus, Settings, Volume2, VolumeX, Download } from 'lucide-react';

interface NavbarProps {
  autoSpeak: boolean;
  onToggleAutoSpeak: () => void;
  onNewChat: () => void;
  onOpenConfig: () => void;
  onOpenLibrary: () => void;
  onToggleSearch: () => void;
  onOpenDownload?: () => void;
  sidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  autoSpeak,
  onToggleAutoSpeak,
  onNewChat,
  onOpenConfig,
  onOpenDownload,
  onToggleSearch
}) => {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#171717',
        zIndex: 40
      }}
    >
      {/* Left: Sidebar Toggle & App Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={onToggleSearch}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a3a3a3',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="Toggle sidebar"
        >
          <PanelLeft size={18} />
        </button>

        <button
          onClick={onNewChat}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a3a3a3',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          title="New chat"
        >
          <Plus size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '4px' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>FRIDAY</span>
          <span style={{ fontSize: '11px', color: '#737373', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '6px' }}>
            1.0
          </span>
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Get App */}
        <button
          onClick={onOpenDownload}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Download size={14} />
          <span>Get App</span>
        </button>

        {/* Voice Toggle */}
        <button
          onClick={onToggleAutoSpeak}
          style={{
            background: 'transparent',
            border: 'none',
            color: autoSpeak ? '#ffffff' : '#737373',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={autoSpeak ? "Voice output enabled" : "Voice output muted"}
        >
          {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenConfig}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a3a3a3',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Settings"
        >
          <Settings size={18} />
        </button>

        {/* User Profile */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#3b82f6',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px'
          }}
        >
          O
        </div>
      </div>
    </header>
  );
};
