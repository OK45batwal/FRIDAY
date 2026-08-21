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
    deleteConversation,
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
    availableVoices,
    selectedVoiceName,
    setSelectedVoiceName,
    toggleListening,
    speak,
    stopSpeaking
  } = useVoice(handleVoiceTranscript);

  // Auto-speak assistant response if autoSpeak is enabled
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
      {/* Header Bar */}
      <header className="glass-panel" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.22)', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <Cpu size={20} color="#ef4444" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="font-display glow-text-red" style={{ fontSize: '18px', letterSpacing: '3px', fontWeight: 900 }}>
                FRIDAY
              </h1>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(239, 68, 68, 0.2)', color: '#ffffff', border: '1px solid rgba(239, 68, 68, 0.45)', fontFamily: 'Orbitron, sans-serif', fontWeight: 700 }}>
                ASSISTANT
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontFamily: 'Orbitron, sans-serif',
              transition: 'all 0.2s ease'
            }}
          >
            <Settings size={14} color="#ef4444" />
            <span>CONFIG</span>
          </button>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '270px 320px 1fr', gap: '14px', height: 'calc(100vh - 160px)' }}>
        {/* Left: Conversations Sidebar */}
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={selectConversation}
          onNewConversation={startNewConversation}
          onDeleteConversation={deleteConversation}
        />

        {/* Center: Google Assistant AI Core Visualizer */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <OrbVisualizer state={effectiveState} size={290} />
        </div>

        {/* Right: Chat Panel, Suggestion Chips, Voice Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>
          <TelemetryBar telemetry={telemetry} state={effectiveState} isConnected={isConnected} />

          <div className="glass-panel" style={{ flex: 1, padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ChatPanel
              messages={messages}
              onSpeak={speak}
              onSelectSuggestion={(query) => sendMessage(query, 'text')}
            />
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

      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        availableVoices={availableVoices}
        selectedVoiceName={selectedVoiceName}
        onSelectVoice={setSelectedVoiceName}
        onTestVoice={speak}
      />
    </div>
  );
};

export default App;
