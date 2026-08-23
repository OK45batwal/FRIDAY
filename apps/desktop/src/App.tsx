import React, { useState, useCallback } from 'react';
import { Navbar } from './components/header/Navbar';
import { Sidebar } from './components/chat/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { FloatingInputDock } from './components/chat/FloatingInputDock';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { ToolsModal } from './components/library/ToolsModal';
import { DownloadModal } from './components/download/DownloadModal';
import { useFriday } from './hooks/useFriday';
import { useVoice } from './hooks/useVoice';

export const App: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    isListening,
    autoSpeak,
    setAutoSpeak,
    toggleListening,
    speak
  } = useVoice((transcript) => {
    if (transcript.trim()) {
      sendMessage(transcript.trim(), 'voice', selectedAgent);
    }
  });

  const handleMessageComplete = useCallback((content: string) => {
    if (autoSpeak && content) {
      speak(content);
    }
  }, [autoSpeak, speak]);

  const {
    conversations,
    activeConversationId,
    messages,
    selectConversation,
    startNewConversation,
    deleteConversation,
    sendMessage
  } = useFriday(handleMessageComplete);

  const handleSendMessage = (text: string, inputType: 'text' | 'voice' = 'text', agentMode?: string) => {
    sendMessage(text, inputType, agentMode || selectedAgent);
    if (agentMode) setSelectedAgent(agentMode);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#212121', color: '#ffffff', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <Navbar
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        onNewChat={startNewConversation}
        onOpenConfig={() => setSettingsOpen(true)}
        onOpenLibrary={() => setToolsOpen(true)}
        onOpenDownload={() => setDownloadOpen(true)}
        onToggleSearch={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Workspace Layout */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left Sidebar */}
        {sidebarOpen && (
          <Sidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={selectConversation}
            onNewConversation={startNewConversation}
            onDeleteConversation={deleteConversation}
          />
        )}

        {/* Center Content: Chat Feed + Bottom Input */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden', background: '#212121' }}>
          {/* Chat Messages */}
          <ChatPanel
            messages={messages}
            selectedAgent={selectedAgent}
            onSpeak={speak}
            onSelectAgent={setSelectedAgent}
            onTriggerPrompt={(prompt, agent) => handleSendMessage(prompt, 'text', agent)}
          />

          {/* Bottom Clean Input Bar */}
          <div style={{ padding: '0 16px 20px 16px' }}>
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

      {/* Download Modal (macOS & Android Apps) */}
      <DownloadModal
        isOpen={downloadOpen}
        onClose={() => setDownloadOpen(false)}
      />

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
