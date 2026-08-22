import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/header/Navbar';
import { Sidebar } from './components/chat/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { FloatingInputDock } from './components/chat/FloatingInputDock';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { ToolsModal } from './components/library/ToolsModal';
import { useFriday } from './hooks/useFriday';
import { useVoice } from './hooks/useVoice';

export const App: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    messages,
    selectConversation,
    startNewConversation,
    deleteConversation,
    sendMessage
  } = useFriday();

  const [selectedAgent, setSelectedAgent] = useState('programming');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (transcript.trim()) {
      sendMessage(transcript.trim(), 'voice', selectedAgent);
    }
  }, [sendMessage, selectedAgent]);

  const {
    isListening,
    autoSpeak,
    setAutoSpeak,
    toggleListening,
    speak
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

  const handleSendMessage = (text: string, inputType: 'text' | 'voice' = 'text', agentMode?: string) => {
    sendMessage(text, inputType, agentMode || selectedAgent);
    if (agentMode) setSelectedAgent(agentMode);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', position: 'relative' }}>
      {/* Top Navbar */}
      <Navbar
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        onNewChat={startNewConversation}
        onOpenConfig={() => setSettingsOpen(true)}
        onOpenLibrary={() => setToolsOpen(true)}
        onToggleSearch={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Workspace */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden', height: 'calc(100vh - 65px)' }}>
        {/* Slide-in Conversation Sidebar (Search & History) */}
        {sidebarOpen && (
          <div style={{ width: '280px', height: '100%', borderRight: '1px solid rgba(255, 255, 255, 0.08)', background: 'var(--bg-card)' }}>
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
              selectedAgent={selectedAgent}
              onToggleVoice={toggleListening}
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
