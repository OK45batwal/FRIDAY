import React from 'react';
import { X, Sparkles, Terminal, Code2, PenTool, Globe, Eye, Cpu, CheckCircle } from 'lucide-react';

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

const TOOLS_LIST = [
  {
    id: 'spotify',
    name: 'Spotify & Music Controller',
    category: 'OS Tool',
    desc: 'Launch Spotify and control music playback via voice commands.',
    icon: <Sparkles size={16} color="#10b981" />
  },
  {
    id: 'code_runner',
    name: 'Full-Stack Code Engine',
    category: 'Programming',
    desc: 'Generates TypeScript, React, Python, and FastAPI architectures with best practices.',
    icon: <Code2 size={16} color="#ef4444" />
  },
  {
    id: 'terminal_exec',
    name: 'Terminal & App Automation',
    category: 'System',
    desc: 'Launches VS Code, Terminal, Finder, and inspects hardware diagnostics.',
    icon: <Terminal size={16} color="#3b82f6" />
  },
  {
    id: 'deep_research',
    name: 'Deep Web Researcher',
    category: 'Research',
    desc: 'Synthesizes technical documentation, algorithms, and comparative reports.',
    icon: <Globe size={16} color="#ec4899" />
  },
  {
    id: 'screen_vision',
    name: 'Multimodal Screen Inspector',
    category: 'Vision',
    desc: 'Analyzes visual UI layouts, architectural diagrams, and error screenshots.',
    icon: <Eye size={16} color="#8b5cf6" />
  },
  {
    id: 'pro_writer',
    name: 'Executive Specification Drafter',
    category: 'Writing',
    desc: 'Drafts technical PRDs, architecture specifications, and documentation.',
    icon: <PenTool size={16} color="#f59e0b" />
  }
];

export const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose, onSelectAgent }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        className="modern-panel"
        style={{
          width: '600px',
          maxWidth: '92%',
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={20} color="#ef4444" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              FRIDAY Capabilities & Agent Tools
            </h3>
          </div>
          <button onClick={onClose} className="btn-action-icon">
            <X size={18} />
          </button>
        </div>

        {/* List of tools */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {TOOLS_LIST.map((tool) => (
            <div
              key={tool.id}
              onClick={() => {
                onSelectAgent(tool.category.toLowerCase());
                onClose();
              }}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)' }}>
                {tool.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{tool.name}</span>
                  <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                    {tool.category}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' }}>{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 600 }}>
          <CheckCircle size={14} />
          <span>All 6 Native OS & Cloud Agent Engines Online</span>
        </div>
      </div>
    </div>
  );
};
