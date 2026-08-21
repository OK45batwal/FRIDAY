import React, { useState, useEffect } from 'react';
import { OrbVisualizer } from './components/ai-core/OrbVisualizer';
import { Sidebar } from './components/chat/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { VoiceBar } from './components/voice/VoiceBar';
import { TelemetryBar } from './components/dashboard/TelemetryBar';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { useFriday } from './hooks/useFriday';
import { useVoice } from './hooks/useVoice';
import { Cpu, Settings } from 'lucide-react';

export const App: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    messages,
    state,
    isConnected,
    telemetry,
    selectConversation,
    startNewConversation,
    sendMessage
  } = useFriday();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleVoiceTranscript = (transcript: string) => {
    if (transcript) {
      sendMessage(transcript, 'voice');
    }
  };

  const {
    isListening,
    isSpeaking,
    autoSpeak,
    setAutoSpeak,
    toggleListening,
    speak,
    stopSpeaking
  } = useVoice(handleVoiceTranscript);

  // Auto-speak latest assistant message if auto-speak is enabled
  useEffect(() => {
    if (messages.length > 0 && autoSpeak) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        speak(lastMsg.content);
      }
    }
  }, [messages, autoSpeak, speak]);

  const effectiveState = isListening ? 'LISTENING' : (isSpeaking ? 'SPEAKING' : state);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: '14px' }}>
      {/* Header */}
      <header className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={22} className="glow-text-cyan" />
          <h1 className="font-display glow-text-cyan" style={{ fontSize: '18px', letterSpacing: '3px', fontWeight: 900 }}>
            FRIDAY
          </h1>
          <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', fontFamily: 'Orbitron, sans-serif' }}>
            v0.1 CORE
          </span>
        </div>

        <button
          onClick={() => setSettingsOpen(true)}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontFamily: 'Orbitron, sans-serif'
          }}
        >
          <Settings size={15} />
          <span>CONFIG</span>
        </button>
      </header>

      {/* Main Workspace Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 300px 1fr', gap: '14px', height: 'calc(100vh - 160px)' }}>
        {/* 1. Conversations Sidebar */}
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={startNewConversation}
        />

        {/* 2. AI Core Visualizer Column */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <OrbVisualizer state={effectiveState} size={280} />
        </div>

        {/* 3. Chat & Control Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
          <TelemetryBar telemetry={telemetry} state={effectiveState} isConnected={isConnected} />

          <div className="glass-panel" style={{ flex: 1, padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel messages={messages} onSpeak={speak} />
          </div>

          <VoiceBar
            state={effectiveState}
            isListening={isListening}
            isSpeaking={isSpeaking}
            autoSpeak={autoSpeak}
            onToggleVoice={toggleListening}
            onStopSpeaking={stopSpeaking}
            onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
            onSendMessage={sendMessage}
          />
        </div>
      </div>

      <SettingsDialog isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default App;
