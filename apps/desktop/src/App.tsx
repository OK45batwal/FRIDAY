import React, { useState, useCallback } from 'react';
import { Navbar } from './components/header/Navbar';
import { Sidebar } from './components/chat/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { FloatingInputDock } from './components/chat/FloatingInputDock';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { ToolsModal } from './components/library/ToolsModal';
import { useFriday } from './hooks/useFriday';
import { useVoice } from './hooks/useVoice';

export const App: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    isListening,
    isSpeaking,
    autoSpeak,
    isHandsFree,
    audioLevel,
    setAutoSpeak,
    toggleListening,
    toggleHandsFree,
    speak,
    enqueueChunk
  } = useVoice((transcript) => {
    if (transcript.trim()) {
      sendMessage(transcript.trim(), 'voice', selectedAgent);
    }
  });

  const handleSentenceChunk = useCallback((chunk: string) => {
    if (autoSpeak && chunk) {
      enqueueChunk(chunk);
    }
  }, [autoSpeak, enqueueChunk]);

  const {
    conversations,
    activeConversationId,
    messages,
    selectConversation,
    startNewConversation,
    deleteConversation,
    sendMessage
  } = useFriday(undefined, handleSentenceChunk);

  const handleSendMessage = (text: string, inputType: 'text' | 'voice' = 'text', agentMode?: string) => {
    sendMessage(text, inputType, agentMode || selectedAgent);
    if (agentMode) setSelectedAgent(agentMode);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-main)', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <Navbar
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        onNewChat={startNewConversation}
        onOpenConfig={() => setSettingsOpen(true)}
        onOpenLibrary={() => setToolsOpen(true)}
        onToggleSearch={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left Sliding Sidebar */}
        {sidebarOpen && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              zIndex: 40,
              animation: 'slideRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              width: '280px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'var(--bg-card)'
            }}
          >
            <Sidebar
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                selectConversation(id);
                setSidebarOpen(false);
              }}
              onNewConversation={startNewConversation}
              onDeleteConversation={deleteConversation}
            />
          </div>
        )}

        {/* Center Content: Hero or Messages + Floating Dock */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 20px 24px 20px', overflow: 'hidden' }}>
          {/* Chat Feed or Hero Screen */}
          <ChatPanel
            messages={messages}
            selectedAgent={selectedAgent}
            onSpeak={speak}
            onSelectAgent={setSelectedAgent}
            onTriggerPrompt={(prompt, agent) => handleSendMessage(prompt, 'text', agent)}
          />

          {/* Floating Input Dock at bottom */}
          <div style={{ paddingTop: '12px' }}>
            <FloatingInputDock
              isListening={isListening}
              isSpeaking={isSpeaking}
              isHandsFree={isHandsFree}
              audioLevel={audioLevel}
              selectedAgent={selectedAgent}
              onToggleVoice={toggleListening}
              onToggleHandsFree={toggleHandsFree}
              onSendMessage={handleSendMessage}
              onSelectAgent={setSelectedAgent}
            />
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onTestVoice={speak}
      />

      {/* Tools & Agents Library Modal */}
      <ToolsModal
        isOpen={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onSelectAgent={(agent) => {
          setSelectedAgent(agent);
          setToolsOpen(false);
        }}
      />
    </div>
  );
};

export default App;
