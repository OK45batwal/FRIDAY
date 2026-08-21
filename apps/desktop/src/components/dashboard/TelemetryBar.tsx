import React from 'react';
import { Cpu, HardDrive, Radio, Clock, ShieldCheck } from 'lucide-react';
import type { SystemTelemetry, AssistantState } from '../../types';

interface TelemetryBarProps {
  telemetry: SystemTelemetry | null;
  state: AssistantState;
  isConnected: boolean;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry, state, isConnected }) => {
  const cpu = telemetry ? telemetry.cpu_usage_percent : 0;
  const mem = telemetry ? telemetry.memory_usage_percent : 0;

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
          <Radio size={14} color={isConnected ? '#00f0ff' : '#ef4444'} />
          <span style={{ color: isConnected ? '#00f0ff' : '#ef4444' }}>
            {isConnected ? 'LINK ACTIVE' : 'DISCONNECTED'}
          </span>
        </div>

        {/* State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
          <ShieldCheck size={14} color="#00f0ff" />
          <span>STATE: <strong style={{ color: '#00f0ff' }}>{state}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* CPU */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
          <Cpu size={14} color="#00f0ff" />
          <span>CPU: <strong style={{ color: '#00f0ff' }}>{cpu}%</strong></span>
        </div>

        {/* RAM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
          <HardDrive size={14} color="#a855f7" />
          <span>RAM: <strong style={{ color: '#a855f7' }}>{mem}%</strong></span>
        </div>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
          <Clock size={14} color="#f59e0b" />
          <span>{telemetry?.current_time ? telemetry.current_time.split(' ')[1] : '--:--:--'}</span>
        </div>
      </div>
    </div>
  );
};
