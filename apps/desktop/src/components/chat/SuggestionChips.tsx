import React from 'react';
import { CloudSun, Activity, Play, Sparkles, Clock, Compass, HelpCircle } from 'lucide-react';

interface SuggestionChipsProps {
  onSelectChip: (text: string) => void;
}

const CHIPS = [
  { icon: CloudSun, label: "What's the weather today?", query: "What's the weather today?" },
  { icon: Activity, label: "System diagnostics", query: "Show system diagnostics" },
  { icon: Play, label: "Open Spotify", query: "Open Spotify" },
  { icon: Compass, label: "Help me plan my project", query: "Help me plan my project" },
  { icon: Clock, label: "Set 15-minute timer", query: "Set a 15 minute timer" },
  { icon: Sparkles, label: "Tell me a tech fact", query: "Tell me a fascinating tech fact" },
  { icon: HelpCircle, label: "Who are you?", query: "Who are you and what can you do?" }
];

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onSelectChip }) => {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        padding: '6px 2px 10px 2px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {CHIPS.map((chip, idx) => {
        const Icon = chip.icon;
        return (
          <button
            key={idx}
            className="suggestion-chip"
            onClick={() => onSelectChip(chip.query)}
          >
            <Icon size={14} color="#ef4444" />
            <span>{chip.label}</span>
          </button>
        );
      })}
    </div>
  );
};
