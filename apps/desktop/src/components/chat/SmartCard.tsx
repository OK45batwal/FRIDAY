import React from 'react';
import { Sun, Cpu, CheckCircle, ExternalLink } from 'lucide-react';

interface SmartCardProps {
  content: string;
}

export const SmartCard: React.FC<SmartCardProps> = ({ content }) => {
  const lower = content.toLowerCase();

  // 1. Weather Smart Card
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast') || lower.includes('74°f')) {
    return (
      <div
        className="glass-card-white"
        style={{
          marginTop: '10px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #ef4444'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '12px' }}>
            <Sun size={26} color="#ff2a5f" />
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', fontFamily: 'Space Grotesk, sans-serif' }}>
              74°F / 23°C
            </div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Sunny & Clear • Humidity 45% • Wind 6 mph
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#ef4444', fontFamily: 'Orbitron, sans-serif', fontWeight: 600 }}>
          OPTIMAL CONDITIONS
        </div>
      </div>
    );
  }

  // 2. System Diagnostics Smart Card
  if (lower.includes('diagnostic') || lower.includes('cpu') || lower.includes('memory') || lower.includes('telemetry') || lower.includes('optimal operating thresholds')) {
    return (
      <div
        className="glass-card-white"
        style={{
          marginTop: '10px',
          padding: '14px 18px',
          borderLeft: '4px solid #ef4444',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
            <Cpu size={14} color="#ef4444" /> SYSTEM PERFORMANCE TELEMETRY
          </div>
          <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontFamily: 'Orbitron, sans-serif' }}>
            NORMAL
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
              <span>CPU LOAD</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>18%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '18%', height: '100%', background: '#ef4444' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '4px' }}>
              <span>RAM USAGE</span>
              <span style={{ color: '#ffffff', fontWeight: 700 }}>42%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '42%', height: '100%', background: '#ffffff' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Action Execution Smart Card (e.g. Spotify / App / Web)
  if (lower.includes('spotify') || lower.includes('launch') || lower.includes('playlist')) {
    return (
      <div
        className="glass-card-white"
        style={{
          marginTop: '10px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #ffffff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={18} color="#ef4444" />
          <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
            Command Executed Successfully
          </span>
        </div>
        <span style={{ fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
          <ExternalLink size={12} /> OPEN
        </span>
      </div>
    );
  }

  return null;
};
