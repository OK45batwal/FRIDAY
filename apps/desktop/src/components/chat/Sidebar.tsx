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
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          color: '#00f0ff',
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '12px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 0 12px rgba(0, 240, 255, 0.2)'
        }}
      >
        <MessageSquarePlus size={16} />
        <span>NEW CHAT</span>
      </button>

      <div style={{ fontSize: '11px', fontFamily: 'Orbitron, sans-serif', color: '#64748b', marginTop: '6px', letterSpacing: '1px' }}>
        CONVERSATIONS
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {conversations.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '12px', textAlign: 'center', marginTop: '20px' }}>
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
                  borderRadius: '8px',
                  background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                  color: isActive ? '#00f0ff' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden'
                }}
              >
                <MessageSquare size={14} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {c.title || 'Conversation'}
                </span>
                {c.message_count ? (
                  <span style={{ fontSize: '10px', background: 'rgba(255, 255, 255, 0.1)', padding: '2px 5px', borderRadius: '4px' }}>
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
