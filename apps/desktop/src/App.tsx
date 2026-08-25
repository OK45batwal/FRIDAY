import React, { useState, useCallback, useEffect } from 'react';
import { Navbar } from './components/header/Navbar';
import { Sidebar } from './components/chat/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';
import { FloatingInputDock } from './components/chat/FloatingInputDock';
import { SettingsDialog } from './components/settings/SettingsDialog';
import { FridayStoreModal } from './components/library/FridayStoreModal';
import { VoiceAssistantModal } from './components/voice/VoiceAssistantModal';
import { ArtifactCanvas, type ArtifactItem } from './components/canvas/ArtifactCanvas';
import { SpotlightOverlay } from './components/spotlight/SpotlightOverlay';
import { useFriday } from './hooks/useFriday';
import { useVoice } from './hooks/useVoice';

export const App: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState('general');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactItem | null>(null);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [lastUserTranscript, setLastUserTranscript] = useState<string>('');

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
      setLastUserTranscript(transcript.trim());
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

    // Auto-detect code block generation for Claude-style Artifact canvas
    setTimeout(() => {
      const codeBlockMatch = text.match(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/);
      if (codeBlockMatch) {
        setActiveArtifact({
          id: String(Date.now()),
          title: "Generated Code Artifact",
          language: codeBlockMatch[1] || "python",
          content: codeBlockMatch[2].trim(),
          type: "code"
        });
        setArtifactOpen(true);
      }
    }, 1500);
  };

  // Keyboard shortcut listener for Cmd+K (Spotlight) and Cmd+Shift+Space (Voice Assistant)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSpotlightOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const latestAssistantMessage = messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: 'var(--bg-main)', overflow: 'hidden' }}>
      {/* Top Navbar */}
      <Navbar
        autoSpeak={autoSpeak}
        onToggleAutoSpeak={() => setAutoSpeak(!autoSpeak)}
        onNewChat={startNewConversation}
        onOpenConfig={() => setSettingsOpen(true)}
        onOpenLibrary={() => setStoreOpen(true)}
        onToggleSearch={() => setSidebarOpen(!sidebarOpen)}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
        onOpenSpotlight={() => setSpotlightOpen(true)}
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

        {/* Claude-Style Side-By-Side Interactive Artifact Canvas */}
        <ArtifactCanvas
          artifact={activeArtifact}
          isOpen={artifactOpen}
          onClose={() => setArtifactOpen(false)}
          onRunCode={(code, lang) => {
            handleSendMessage(`Run this ${lang} code and show the output:\n\`\`\`${lang}\n${code}\n\`\`\``, 'text');
          }}
        />
      </div>

      {/* Fullscreen Voice Assistant Modal (Siri / Google Assistant Mode) */}
      <VoiceAssistantModal
        isOpen={voiceAssistantOpen}
        onClose={() => setVoiceAssistantOpen(false)}
        isListening={isListening}
        isSpeaking={isSpeaking}
        isHandsFree={isHandsFree}
        audioLevel={audioLevel}
        lastUserTranscript={lastUserTranscript}
        lastAssistantResponse={latestAssistantMessage}
        onToggleListening={toggleListening}
        onToggleHandsFree={toggleHandsFree}
        onSendMessage={(text) => handleSendMessage(text, 'voice')}
      />

      {/* Raycast/Spotlight Global Command Palette Overlay */}
      <SpotlightOverlay
        isOpen={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onSubmit={(prompt) => handleSendMessage(prompt, 'text')}
      />

      {/* Settings Dialog */}
      <SettingsDialog
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onTestVoice={speak}
      />

      {/* FRIDAY All-in-One Package & Store Modal */}
      <FridayStoreModal
        isOpen={storeOpen}
        onClose={() => setStoreOpen(false)}
        onSelectAgent={(agent) => {
          setSelectedAgent(agent);
          setStoreOpen(false);
        }}
      />
    </div>
  );
};

export default App;
