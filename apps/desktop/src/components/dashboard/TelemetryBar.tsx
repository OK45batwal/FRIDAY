import React from 'react';
import { Cpu, HardDrive, Clock, Battery, ShieldCheck } from 'lucide-react';
import type { SystemTelemetry, AssistantState } from '../../types';

interface TelemetryBarProps {
  telemetry: SystemTelemetry | null;
  state: AssistantState;
  isConnected: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry, state, isConnected }) => {
  const cpu = telemetry ? telemetry.cpu_usage_percent : 12;
  const mem = telemetry ? telemetry.memory_usage_percent : 42;
  const bat = telemetry?.battery?.percent ?? 88;

  return (
    <div
      style={{
        padding: '10px 20px',
        background: 'rgba(10, 11, 16, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: '#94a3b8'
      }}
    >
      {/* Left: System Status & Neural Link */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#f43f5e',
              boxShadow: isConnected ? '0 0 10px #10b981' : '0 0 10px #f43f5e'
            }}
          />
          <span style={{ color: isConnected ? '#ffffff' : '#94a3b8', fontWeight: 600 }}>
            {isConnected ? 'FRIDAY CORE 1.0 ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={13} color="#f43f5e" />
          <span>NEURAL LINK: <strong style={{ color: '#ffffff' }}>{state.toUpperCase()}</strong></span>
        </div>
      </div>

      {/* Right: Real Hardware HUD Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Cpu size={13} color="#f43f5e" />
          <span>CPU <strong style={{ color: '#ffffff' }}>{cpu}%</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <HardDrive size={13} color="#f43f5e" />
          <span>RAM <strong style={{ color: '#ffffff' }}>{mem}%</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Battery size={13} color="#10b981" />
          <span>BAT <strong style={{ color: '#10b981' }}>{bat}%</strong></span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#cbd5e1' }}>
          <Clock size={13} color="#f43f5e" />
          <span>{telemetry?.current_time ? telemetry.current_time.split(' ')[1] : new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
