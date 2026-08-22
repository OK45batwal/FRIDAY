import React from 'react';
import { PenTool, Code2, GraduationCap, Image, Search, Terminal } from 'lucide-react';

export interface AgentCardItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  defaultPrompt: string;
}

interface WelcomeHeroProps {
  selectedAgent: string;
  onSelectAgent: (agentId: string) => void;
  onTriggerPrompt: (prompt: string, agentId: string) => void;
}

export const AGENT_MODES: AgentCardItem[] = [
  {
    id: 'writing',
    title: 'Writing',
    subtitle: 'Your expert AI assistant for Writing',
    icon: <PenTool size={16} />,
    color: '#3b82f6',
    defaultPrompt: 'Help me draft a compelling project specification document.'
  },
  {
    id: 'programming',
    title: 'Programming',
    subtitle: 'Your expert AI assistant for Programming',
    icon: <Code2 size={16} />,
    color: '#ef4444',
    defaultPrompt: 'Write a full-stack Python & TypeScript solution for real-time streaming.'
  },
  {
    id: 'education',
    title: 'Education',
    subtitle: 'Your expert AI assistant for Learning',
    icon: <GraduationCap size={16} />,
    color: '#f59e0b',
    defaultPrompt: 'Explain how vector embeddings and local LLM quantization work in simple terms.'
  },
  {
    id: 'vision',
    title: 'Image & Vision',
    subtitle: 'Your expert AI assistant for Vision',
    icon: <Image size={16} />,
    color: '#8b5cf6',
    defaultPrompt: 'Analyze modern dark UI design systems and generate layout specs.'
  },
  {
    id: 'research',
    title: 'Research',
    subtitle: 'Your expert AI assistant for Research',
    icon: <Search size={16} />,
    color: '#ec4899',
    defaultPrompt: 'Conduct deep technical research on state-of-the-art AI assistant architectures.'
  },
  {
    id: 'system',
    title: 'OS Control',
    subtitle: 'Your expert AI assistant for Computer Control',
    icon: <Terminal size={16} />,
    color: '#10b981',
    defaultPrompt: 'Open Spotify and show my computer diagnostic telemetry.'
  }
];

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  selectedAgent,
  onSelectAgent,
  onTriggerPrompt
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', gap: '32px', textAlign: 'center', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Personalized Greeting */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px' }}>
          Namaste, <span style={{ color: '#ffffff' }}>Omkar</span>
        </h1>
        <p style={{ fontSize: '15px', color: '#9ca3af', maxWidth: '520px', lineHeight: '1.5' }}>
          FRIDAY, your dedicated Indian AI operating assistant ready to assist at any moment.
        </p>
      </div>

      {/* 6 Specialized Agent Cards Grid */}
      <div
        className="hero-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          width: '100%'
        }}
      >
        {AGENT_MODES.map((agent) => {
          const isSelected = selectedAgent === agent.id;
          return (
            <div
              key={agent.id}
              onClick={() => {
                onSelectAgent(agent.id);
                onTriggerPrompt(agent.defaultPrompt, agent.id);
              }}
              className={`modern-card ${isSelected ? 'active' : ''}`}
              style={{ textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: `${agent.color}20`,
                    color: agent.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {agent.icon}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                  {agent.title}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' }}>
                {agent.subtitle}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
