import React from 'react';
import { MessageSquarePlus, MessageSquare } from 'lucide-react';
import type { Conversation } from '../../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation
}) => {
  return (
    <aside
      className="glass-panel"
      style={{
        width: '260px',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '12px',
        height: '100%'
      }}
    >
      <button
        onClick={onNewConversation}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(255, 42, 95, 0.25) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#ffffff',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 0 14px rgba(239, 68, 68, 0.25)',
          transition: 'all 0.2s ease'
        }}
      >
        <MessageSquarePlus size={16} color="#ef4444" />
        <span>NEW CONVERSATION</span>
      </button>

      <div style={{ fontSize: '11px', fontFamily: 'Orbitron, sans-serif', color: '#94a3b8', marginTop: '6px', letterSpacing: '1px' }}>
        SAVED CHATS
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {conversations.length === 0 ? (
          <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
            No saved sessions
          </div>
        ) : (
          conversations.map((c) => {
            const isActive = c.id === activeConversationId;
            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                <MessageSquare size={14} color={isActive ? '#ef4444' : '#64748b'} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: isActive ? 600 : 400 }}>
                  {c.title || 'Conversation'}
                </span>
                {c.message_count ? (
                  <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                    {c.message_count}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
