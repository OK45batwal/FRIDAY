import React, { useState } from 'react';
import { Sun, Cpu, CheckCircle, Calendar, Code2, RotateCcw, Check, Play } from 'lucide-react';

interface SmartCardProps {
  content: string;
}

export const SmartCard: React.FC<SmartCardProps> = ({ content }) => {
  const [reminderDone, setReminderDone] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const lower = content.toLowerCase();

  // 1. macOS Reminders Interactive Action Card
  if (lower.includes('reminder') || lower.includes('reminded') || lower.includes('scheduled')) {
    return (
      <div
        className="glass-panel"
        style={{
          marginTop: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid var(--accent-rose)',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '10px', borderRadius: '12px' }}>
            <Calendar size={22} color="var(--accent-rose)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {reminderDone ? "Task Completed" : "macOS Reminder Synced"}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {reminderDone ? "Removed from your active reminders list" : "Added to native Apple Reminders"}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setReminderDone(!reminderDone)}
            className="btn-action-icon"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: reminderDone ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.12)',
              color: reminderDone ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              fontSize: '11px',
              fontWeight: 700,
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            {reminderDone ? <RotateCcw size={12} /> : <CheckCircle size={12} />}
            <span>{reminderDone ? 'Undo' : 'Mark Done'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Code Block Smart Card
  if (content.includes('```')) {
    const codeMatch = content.match(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/);
    const codeSnippet = codeMatch ? codeMatch[1].trim() : '';

    const handleCopyCode = () => {
      if (codeSnippet) {
        navigator.clipboard.writeText(codeSnippet);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      }
    };

    return (
      <div
        className="glass-panel"
        style={{
          marginTop: '12px',
          padding: '10px 14px',
          borderLeft: '4px solid var(--accent-cyan)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
          <Code2 size={16} color="var(--accent-cyan)" />
          <span>Code Block Generated</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleCopyCode}
            className="btn-action-icon"
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              background: codeCopied ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.12)',
              color: codeCopied ? 'var(--accent-emerald)' : 'var(--accent-cyan)',
              fontSize: '11px',
              fontWeight: 700,
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            {codeCopied ? <Check size={12} /> : <Play size={12} />}
            <span>{codeCopied ? 'Copied' : 'Copy Snippet'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. System Telemetry & Diagnostics Card
  if (lower.includes('cpu') || lower.includes('memory') || lower.includes('telemetry') || lower.includes('ram')) {
    return (
      <div
        className="glass-panel"
        style={{
          marginTop: '12px',
          padding: '14px 18px',
          borderLeft: '4px solid var(--accent-emerald)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            <Cpu size={16} color="var(--accent-emerald)" />
            <span>Hardware Telemetry Real-Time Status</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--accent-emerald)', fontWeight: 800 }}>
            NORMAL OPERATING THRESHOLDS
          </div>
        </div>
      </div>
    );
  }

  // 4. Weather Smart Card
  if (lower.includes('weather') || lower.includes('temperature') || lower.includes('forecast')) {
    return (
      <div
        className="glass-panel"
        style={{
          marginTop: '12px',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderLeft: '4px solid #f59e0b',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '12px' }}>
            <Sun size={24} color="#f59e0b" />
          </div>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>
              74°F / 23°C
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Sunny & Clear • Humidity 45% • Wind 6 mph
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '11px', color: '#f59e0b', fontWeight: 700 }}>
          OPTIMAL CONDITIONS
        </div>
      </div>
    );
  }

  return null;
};
