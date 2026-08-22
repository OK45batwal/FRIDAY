import React from 'react';
import { PenTool, Code2, GraduationCap, Image, Search, Terminal, Zap } from 'lucide-react';

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
    id: 'programming',
    title: 'Code & Architecture',
    subtitle: 'Senior software engineering & full-stack code synthesis',
    icon: <Code2 size={16} />,
    color: '#f43f5e',
    defaultPrompt: 'Write a full-stack Python & TypeScript solution for real-time streaming.'
  },
  {
    id: 'system',
    title: 'OS & Automation',
    subtitle: 'Native Mac automation, Spotify, VS Code & telemetry',
    icon: <Terminal size={16} />,
    color: '#10b981',
    defaultPrompt: 'Open Spotify and show my computer diagnostic telemetry.'
  },
  {
    id: 'education',
    title: 'Reasoning & Math',
    subtitle: 'Step-by-step problem solving, math & science explanations',
    icon: <GraduationCap size={16} />,
    color: '#3b82f6',
    defaultPrompt: 'Explain how vector embeddings and local LLM quantization work in simple terms.'
  },
  {
    id: 'writing',
    title: 'Strategic Writing',
    subtitle: 'Technical specs, executive summaries & project roadmaps',
    icon: <PenTool size={16} />,
    color: '#8b5cf6',
    defaultPrompt: 'Help me draft a compelling project specification document.'
  },
  {
    id: 'research',
    title: 'Deep Research',
    subtitle: 'Architecture analysis, benchmarks & multi-domain synthesis',
    icon: <Search size={16} />,
    color: '#ec4899',
    defaultPrompt: 'Conduct deep technical research on state-of-the-art AI assistant architectures.'
  },
  {
    id: 'vision',
    title: 'UI/UX Design',
    subtitle: 'Tesla-inspired dark UI systems, HUD layouts & tokens',
    icon: <Image size={16} />,
    color: '#f59e0b',
    defaultPrompt: 'Analyze modern dark UI design systems and generate layout specs.'
  }
];

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  selectedAgent,
  onSelectAgent,
  onTriggerPrompt
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 20px', gap: '28px', textAlign: 'center', width: '100%', maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Tesla Cockpit Header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '5px 14px', borderRadius: '9999px', fontSize: '11px', fontWeight: 700, color: '#f43f5e', letterSpacing: '0.6px' }}>
          <Zap size={13} />
          <span>FRIDAY 1.0 NEURAL COCKPIT</span>
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '38px', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.8px', lineHeight: '1.2' }}>
          Namaste, <span style={{ background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Omkar</span>
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '540px', lineHeight: '1.6' }}>
          Your dedicated AI Operating Assistant & software architect. Ready to write code, control your desktop, and answer questions with zero lag.
        </p>
      </div>

      {/* 6 Specialized Tesla HUD Agent Cards Grid */}
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
              style={{
                textAlign: 'left',
                background: 'rgba(14, 16, 23, 0.7)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: isSelected ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background: `${agent.color}22`,
                    color: agent.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${agent.color}44`
                  }}
                >
                  {agent.icon}
                </div>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)' }}>
                  {agent.title}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.45' }}>
                {agent.subtitle}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
