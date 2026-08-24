import React, { useState } from 'react';
import { MessageSquarePlus, MessageSquare, Search, Trash2 } from 'lucide-react';
import type { Conversation } from '../../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation
}) => {
  const [search, setSearch] = useState('');

  const filtered = conversations.filter(c =>
    (c.title || 'Conversation').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      className="glass-panel"
      style={{
        width: '270px',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '12px',
        height: '100%'
      }}
    >
      {/* New Conversation Button */}
      <button
        onClick={onNewConversation}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(255, 42, 95, 0.3) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.55)',
          color: '#ffffff',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 0 16px rgba(239, 68, 68, 0.25)',
          transition: 'all 0.2s ease'
        }}
      >
        <MessageSquarePlus size={16} color="#ef4444" />
        <span>NEW CONVERSATION</span>
      </button>

      {/* Search Conversations Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          style={{
            width: '100%',
            padding: '8px 12px 8px 32px',
            borderRadius: '10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            outline: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>

      <div style={{ fontSize: '11px', fontFamily: 'var(--font-display)', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '1px' }}>
        SAVED SESSIONS ({filtered.length})
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
            No matching sessions
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <div
                key={c.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(244, 63, 94, 0.18)' : 'var(--bg-card)',
                  border: isActive ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                <div
                  onClick={() => onSelectConversation(c.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, overflow: 'hidden' }}
                >
                  <MessageSquare size={14} color={isActive ? 'var(--accent-rose)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isActive ? 700 : 400 }}>
                    {c.title || 'Conversation'}
                  </span>
                </div>

                {c.message_count ? (
                  <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                    {c.message_count}
                  </span>
                ) : null}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(c.id);
                  }}
                  className="btn-action-icon btn-action-delete"
                  title="Delete conversation"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

