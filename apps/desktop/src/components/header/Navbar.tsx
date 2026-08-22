import React from 'react';
import { Plus, Search, BookOpen, Settings, Sparkles } from 'lucide-react';

interface NavbarProps {
  onNewChat: () => void;
  onOpenConfig: () => void;
  onOpenLibrary: () => void;
  onToggleSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
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
        background: 'rgba(12, 13, 18, 0.8)',
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
