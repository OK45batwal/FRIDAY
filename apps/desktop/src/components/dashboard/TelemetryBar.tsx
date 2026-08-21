import React from 'react';
import { Cpu, HardDrive, Radio, Clock, ShieldCheck, Battery } from 'lucide-react';
import type { SystemTelemetry, AssistantState } from '../../types';

interface TelemetryBarProps {
  telemetry: SystemTelemetry | null;
  state: AssistantState;
  isConnected: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry, state, isConnected }) => {
  const cpu = telemetry ? telemetry.cpu_usage_percent : 0;
  const mem = telemetry ? telemetry.memory_usage_percent : 0;
  const bat = telemetry?.battery?.percent ?? 100;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '10px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '12px',
        fontFamily: 'Orbitron, sans-serif'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Connection status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={14} color={isConnected ? '#ef4444' : '#64748b'} />
          <span style={{ color: isConnected ? '#ffffff' : '#64748b' }}>
            {isConnected ? 'FRIDAY ONLINE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Assistant State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
          <ShieldCheck size={14} color="#ef4444" />
          <span>STATUS: <strong style={{ color: '#ff2a5f' }}>{state}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* CPU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
          <Cpu size={14} color="#ef4444" />
          <span>CPU: <strong style={{ color: '#ffffff' }}>{cpu}%</strong></span>
        </div>

        {/* RAM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
          <HardDrive size={14} color="#ff2a5f" />
          <span>RAM: <strong style={{ color: '#ffffff' }}>{mem}%</strong></span>
        </div>

        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
          <Battery size={14} color="#ef4444" />
          <span>POWER: <strong style={{ color: '#ffffff' }}>{bat}%</strong></span>
        </div>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
          <Clock size={14} color="#ef4444" />
          <span>{telemetry?.current_time ? telemetry.current_time.split(' ')[1] : '--:--:--'}</span>
        </div>
      </div>
    </div>
  );
};
