import React, { useState } from 'react';
import { Plus, MessageSquare, Search, Trash2 } from 'lucide-react';
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
    (c.title || 'New Chat').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      style={{
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        padding: '14px',
        gap: '12px',
        height: '100%',
        background: '#171717',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* New Chat Button */}
      <button
        onClick={onNewConversation}
        style={{
          width: '100%',
          padding: '10px 14px',
          borderRadius: '10px',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: '#ffffff',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          transition: 'background 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
      >
        <Plus size={16} color="#ffffff" />
        <span>New chat</span>
      </button>

      {/* Search Input */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} color="#737373" style={{ position: 'absolute', left: '10px' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats..."
          style={{
            width: '100%',
            padding: '7px 10px 7px 30px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            fontSize: '12px',
            outline: 'none'
          }}
        />
      </div>

      <div style={{ fontSize: '11px', color: '#737373', fontWeight: 600, paddingLeft: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Recent Chats
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {filtered.length === 0 ? (
          <div style={{ color: '#737373', fontSize: '12px', textAlign: 'center', marginTop: '30px' }}>
            No chats found
          </div>
        ) : (
          filtered.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                  color: isActive ? '#ffffff' : '#a3a3a3',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  <MessageSquare size={14} color={isActive ? '#ffffff' : '#737373'} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title || 'New Chat'}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(c.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#737373',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isActive ? 1 : 0.6
                  }}
                  title="Delete chat"
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
