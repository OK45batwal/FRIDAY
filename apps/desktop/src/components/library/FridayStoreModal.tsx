import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Terminal, Cpu, CheckCircle, 
  Download, Zap, Search, Layers, Box, Music, Star
} from 'lucide-react';


interface FridayStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
}

export interface StorePackage {
  id: string;
  name: string;
  category: 'agents' | 'tools' | 'voices' | 'models' | 'plugins';
  version: string;
  rating: number;
  downloads: string;
  author: string;
  desc: string;
  tags: string[];
  iconBg: string;
  iconColor: string;
}

const STORE_PACKAGES: StorePackage[] = [
  // --- AGENTS ---
  {
    id: 'agent_architect',
    name: 'Senior Software Architect',
    category: 'agents',
    version: '1.2.0',
    rating: 4.9,
    downloads: '14.2k',
    author: 'FRIDAY Core',
    desc: 'Designs scalable distributed systems, async Python services, microservices, and React architectures.',
    tags: ['Architecture', 'Python', 'TypeScript', 'Clean Code'],
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconColor: '#ef4444'
  },
  {
    id: 'agent_math',
    name: 'Calculus & Physics Specialist',
    category: 'agents',
    version: '1.1.0',
    rating: 5.0,
    downloads: '9.8k',
    author: 'FRIDAY Core',
    desc: 'Performs step-by-step mathematical derivations, product rules, quantum mechanics, and AST arithmetic.',
    tags: ['Math', 'Calculus', 'Physics', 'AST'],
    iconBg: 'rgba(56, 189, 248, 0.15)',
    iconColor: '#38bdf8'
  },
  {
    id: 'agent_sre',
    name: 'DevSecOps & SRE Engineer',
    category: 'agents',
    version: '1.0.4',
    rating: 4.8,
    downloads: '8.1k',
    author: 'Community',
    desc: 'Automates Docker containers, Kubernetes manifests, CI/CD pipelines, and server health monitoring.',
    tags: ['DevOps', 'Docker', 'Linux', 'Security'],
    iconBg: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#10b981'
  },
  {
    id: 'agent_writer',
    name: 'Executive Technical Writer',
    category: 'agents',
    version: '1.0.2',
    rating: 4.7,
    downloads: '6.5k',
    author: 'Community',
    desc: 'Drafts comprehensive Product Requirement Documents (PRDs), engineering specs, and release notes.',
    tags: ['PRD', 'Docs', 'Writing'],
    iconBg: 'rgba(245, 158, 11, 0.15)',
    iconColor: '#f59e0b'
  },

  // --- TOOLS ---
  {
    id: 'tool_os_automation',
    name: 'macOS & Windows OS Controller',
    category: 'tools',
    version: '2.0.0',
    rating: 4.9,
    downloads: '25.3k',
    author: 'FRIDAY Core',
    desc: 'Controls native operating system commands, apps (VS Code, Finder, Terminal), and clipboard buffer.',
    tags: ['macOS', 'Windows', 'Automation'],
    iconBg: 'rgba(59, 130, 246, 0.15)',
    iconColor: '#3b82f6'
  },
  {
    id: 'tool_telemetry',
    name: 'Hardware Telemetry Monitor',
    category: 'tools',
    version: '1.3.0',
    rating: 4.8,
    downloads: '18.9k',
    author: 'FRIDAY Core',
    desc: 'Real-time CPU per-core load, unified RAM consumption, battery health, and Apple Metal GPU stats.',
    tags: ['Hardware', 'Diagnostics', 'Sensors'],
    iconBg: 'rgba(168, 85, 247, 0.15)',
    iconColor: '#a855f7'
  },
  {
    id: 'tool_web_research',
    name: 'Live Web Researcher',
    category: 'tools',
    version: '1.4.2',
    rating: 4.9,
    downloads: '21.0k',
    author: 'FRIDAY Core',
    desc: 'Synthesizes real-time web search results, GitHub releases, and documentation into markdown reports.',
    tags: ['Web', 'Search', 'RAG'],
    iconBg: 'rgba(236, 72, 153, 0.15)',
    iconColor: '#ec4899'
  },

  // --- VOICES ---
  {
    id: 'voice_tara',
    name: 'Tara (Warm & Fast Neural Voice)',
    category: 'voices',
    version: '2.1.0',
    rating: 4.9,
    downloads: '19.4k',
    author: 'Neural TTS',
    desc: 'Expressive, clear, low-latency conversational voice tuned for hands-free voice assistance.',
    tags: ['TTS', 'Low-Latency', 'English'],
    iconBg: 'rgba(244, 63, 94, 0.15)',
    iconColor: '#f43f5e'
  },
  {
    id: 'voice_samantha',
    name: 'Samantha (Studio Assistant)',
    category: 'voices',
    version: '1.8.0',
    rating: 4.8,
    downloads: '15.6k',
    author: 'Apple Native',
    desc: 'Classic crystal-clear assistant voice optimized for quick responses and system notifications.',
    tags: ['TTS', 'Studio', 'macOS'],
    iconBg: 'rgba(56, 189, 248, 0.15)',
    iconColor: '#38bdf8'
  },
  {
    id: 'voice_jarvis',
    name: 'JARVIS Cyber Hologram Tone',
    category: 'voices',
    version: '1.0.1',
    rating: 5.0,
    downloads: '32.1k',
    author: 'FRIDAY Lab',
    desc: 'Deep futuristic synthesized cyber tone with subtle acoustic holographic reverberation.',
    tags: ['Cyber', 'Sci-Fi', 'HUD'],
    iconBg: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#10b981'
  },

  // --- MODELS ---
  {
    id: 'model_friday_nano',
    name: 'FRIDAY-Nano 0.5B (On-Device SLM)',
    category: 'models',
    version: '1.0.0',
    rating: 4.9,
    downloads: '45.1k',
    author: 'FRIDAY Core',
    desc: 'Runs 100% offline with under 350MB RAM footprint. Instant <20ms token latency on CPU and Metal GPU.',
    tags: ['Offline', 'Local', 'Low-RAM', 'Qwen'],
    iconBg: 'rgba(239, 68, 68, 0.15)',
    iconColor: '#ef4444'
  },
  {
    id: 'model_friday_core',
    name: 'FRIDAY-Core 1.5B (Reasoning SLM)',
    category: 'models',
    version: '1.0.0',
    rating: 4.9,
    downloads: '28.3k',
    author: 'FRIDAY Core',
    desc: 'Balanced on-device model for full code generation, AST tool calling, and multi-step logic.',
    tags: ['Local', 'Coding', '1.5B', 'GGUF'],
    iconBg: 'rgba(56, 189, 248, 0.15)',
    iconColor: '#38bdf8'
  },
  {
    id: 'model_soup_7b',
    name: 'Soup-Streaming 7B/8B Recipe',
    category: 'models',
    version: '0.73.3',
    rating: 5.0,
    downloads: '11.8k',
    author: 'Soup Framework',
    desc: 'Layer-streamed 8B parameter fine-tuned model trained on 4GB laptop GPU with NF4 quantization.',
    tags: ['8B', 'Layer Streaming', 'Soup', 'SFT+DPO'],
    iconBg: 'rgba(168, 85, 247, 0.15)',
    iconColor: '#a855f7'
  },

  // --- PLUGINS ---
  {
    id: 'plugin_spotify',
    name: 'Spotify Connect Controller',
    category: 'plugins',
    version: '1.2.0',
    rating: 4.8,
    downloads: '16.7k',
    author: 'Music Lab',
    desc: 'Voice commands to play, pause, skip tracks, and search playlists on Spotify desktop & mobile.',
    tags: ['Music', 'Spotify', 'Media'],
    iconBg: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#10b981'
  },
  {
    id: 'plugin_github',
    name: 'GitHub Repository Automator',
    category: 'plugins',
    version: '1.1.5',
    rating: 4.9,
    downloads: '13.2k',
    author: 'DevTools',
    desc: 'Manage PRs, inspect commit history, clone repos, and create GitHub releases directly from chat.',
    tags: ['GitHub', 'Git', 'Dev'],
    iconBg: 'rgba(255, 255, 255, 0.15)',
    iconColor: '#f8fafc'
  }
];

export const FridayStoreModal: React.FC<FridayStoreModalProps> = ({
  isOpen,
  onClose,
  onSelectAgent
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'agents' | 'tools' | 'voices' | 'models' | 'plugins'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installedPackages, setInstalledPackages] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('FRIDAY_INSTALLED_PACKAGES');
    return saved ? JSON.parse(saved) : {
      'agent_architect': true,
      'agent_math': true,
      'tool_os_automation': true,
      'tool_telemetry': true,
      'voice_tara': true,
      'model_friday_nano': true
    };
  });

  useEffect(() => {
    localStorage.setItem('FRIDAY_INSTALLED_PACKAGES', JSON.stringify(installedPackages));
  }, [installedPackages]);

  if (!isOpen) return null;

  const togglePackage = (id: string) => {
    setInstalledPackages(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredPackages = STORE_PACKAGES.filter(pkg => {
    const matchesTab = activeTab === 'all' || pkg.category === activeTab;
    const matchesSearch = searchQuery === '' || 
      pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '920px',
          maxWidth: '96vw',
          height: '84vh',
          maxHeight: '760px',
          background: 'rgba(10, 14, 26, 0.96)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.8), 0 0 40px rgba(244, 63, 94, 0.15)',
          overflow: 'hidden'
        }}
      >
        {/* Top Store Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-rose)'
              }}
            >
              <Box size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  FRIDAY Store & Hub
                </h2>
                <span style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '9999px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  All-in-One App
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>
                One application, all packages. 1-click install agents, tools, voice packs, and models.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search & Category Filter Navigation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(0, 0, 0, 0.2)',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
            {[
              { id: 'all', label: 'All Packages', icon: <Layers size={13} /> },
              { id: 'agents', label: 'AI Agents', icon: <Sparkles size={13} /> },
              { id: 'tools', label: 'OS Tools', icon: <Terminal size={13} /> },
              { id: 'voices', label: 'Voice Packs', icon: <Music size={13} /> },
              { id: 'models', label: 'LLM Engines', icon: <Cpu size={13} /> },
              { id: 'plugins', label: 'Plugins', icon: <Zap size={13} /> }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  border: activeTab === tab.id ? '1px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                  background: activeTab === tab.id ? 'rgba(244, 63, 94, 0.18)' : 'var(--bg-card)',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: '220px' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store packages..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: '8px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Packages Grid View */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '16px',
            alignContent: 'flex-start'
          }}
        >
          {filteredPackages.map(pkg => {
            const isInstalled = !!installedPackages[pkg.id];
            return (
              <div
                key={pkg.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: isInstalled ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                  border: isInstalled ? '1px solid rgba(244, 63, 94, 0.4)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Card Top: Icon, Title, Rating */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '10px',
                        background: pkg.iconBg,
                        color: pkg.iconColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Box size={18} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                        <Star size={11} fill="#f59e0b" /> {pkg.rating}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        ({pkg.downloads})
                      </span>
                    </div>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {pkg.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', minHeight: '36px' }}>
                    {pkg.desc}
                  </p>
                </div>

                {/* Card Bottom: Tags & 1-Click Install Button */}
                <div>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    {pkg.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '9.5px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      v{pkg.version} • {pkg.author}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        togglePackage(pkg.id);
                        if (!isInstalled && pkg.category === 'agents') {
                          onSelectAgent(pkg.id);
                        }
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: isInstalled ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-rose)',
                        background: isInstalled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: isInstalled ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isInstalled ? <CheckCircle size={12} /> : <Download size={12} />}
                      <span>{isInstalled ? 'ACTIVE' : 'INSTALL'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
