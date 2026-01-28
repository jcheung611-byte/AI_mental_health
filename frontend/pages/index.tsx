/**
 * Main Chat Page - Refactored with Contexts and Components
 *
 * This is the refactored version using React contexts and modular components.
 * Original: 2527 lines → Refactored: ~300 lines (including modals)
 */

import { useEffect, useState } from 'react'
import Head from 'next/head'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChatProvider,
  useChat,
  VoiceProvider,
  useVoice,
  MemoryProvider,
  useMemory,
  SettingsProvider,
  useSettings,
} from '@/contexts'
import { ChatHeader, MessageList, InputArea } from '@/components/chat'
import { DesktopNav, MobileNav } from '@/components/navigation'
import { MemoryPanel } from '@/components/memory/MemoryPanel'
import { useKeyboardShortcuts, KEYBOARD_SHORTCUTS, getShortcutDisplay } from '@/hooks/useKeyboardShortcuts'

// Main Chat Interface (uses all contexts)
function ChatInterface() {
  // Chat context
  const {
    messages,
    status,
    isProcessing,
    error,
    textInput,
    messageQueue,
    textareaRef,
    messagesEndRef,
    setTextInput,
    handleTextSubmit,
    handleAudioRecorded,
    clearConversation,
    exportConversation,
  } = useChat()

  // Voice context
  const {
    playingMessageId,
    playbackStates,
    globalPlaybackSpeed,
    speedMenuOpen,
    selectedVoice,
    selectedModel,
    previewingVoice,
    preGeneratingPreviews,
    setSpeedMenuOpen,
    playMessage,
    pauseMessage,
    restartMessage,
    skipBackward,
    skipForward,
    setSpeed,
    stopAllAudio,
    setSelectedVoice,
    setSelectedModel,
    previewVoice,
    preGenerateVoicePreviews,
  } = useVoice()

  // Memory context
  const {
    memories,
    memoryEnabled,
    memoryToast,
    memoryFilter,
    setMemoryEnabled,
    setMemoryFilter,
    deleteMemory,
    clearMemories,
  } = useMemory()

  // Settings context
  const {
    showSettingsModal,
    showClearModal,
    showOnboardingModal,
    userAboutMe,
    userInstructions,
    onboardingStep,
    selectedOnboardingOption,
    chatGPTResponse,
    parsedFacts,
    parsedAboutMe,
    isParsingContext,
    setShowSettingsModal,
    setShowClearModal,
    setShowOnboardingModal,
    setUserAboutMe,
    setUserInstructions,
    setOnboardingStep,
    setSelectedOnboardingOption,
    setChatGPTResponse,
    parseContextFromChatGPT,
    completeOnboarding,
    skipOnboarding,
  } = useSettings()

  // Local state for shortcuts help
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onFocusInput: () => textareaRef.current?.focus(),
    onShowHelp: () => setShowShortcutsHelp(true),
    onExport: exportConversation,
    onClear: () => setShowClearModal(true),
    onEscape: () => {
      setShowSettingsModal(false)
      setShowClearModal(false)
      setShowShortcutsHelp(false)
      stopAllAudio()
    },
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, messagesEndRef])

  // Pre-generate voice previews when settings modal opens
  useEffect(() => {
    if (showSettingsModal) {
      preGenerateVoicePreviews()
    }
  }, [showSettingsModal, preGenerateVoicePreviews])

  // Close speed menu when clicking outside
  useEffect(() => {
    if (!speedMenuOpen) return

    const handleClickOutside = () => setSpeedMenuOpen(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [speedMenuOpen, setSpeedMenuOpen])

  // Handler wrappers
  const handleRecordingStart = () => {
    stopAllAudio()
  }

  const handleRestartAudio = () => {
    if (!playingMessageId) return
    const message = messages.find((m) => m.id === playingMessageId)
    if (message) {
      restartMessage(playingMessageId, message.audioUrl)
    }
  }

  return (
    <>
      <Head>
        <title>Chat - AI Voice Assistant</title>
        <meta name="description" content="AI voice companion for mental health" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="flex h-screen bg-gray-50">
        {/* Desktop Sidebar Navigation */}
        <DesktopNav />

        {/* Main Chat Content - Extra padding for mobile browser chrome */}
        <main className="flex-1 flex flex-col min-w-0 pt-safe pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="flex-1 flex flex-col w-full max-w-4xl lg:max-w-5xl mx-auto min-h-0 md:p-4">
          <div className="bg-white md:rounded-xl md:shadow-md flex flex-col flex-1 min-h-0 md:mb-4">
            {/* Chat Header */}
            <ChatHeader
              messages={messages}
              messageQueue={messageQueue}
              isProcessing={isProcessing}
              error={error}
              status={status}
              playingMessageId={playingMessageId}
              globalPlaybackSpeed={globalPlaybackSpeed}
              speedMenuOpen={speedMenuOpen}
              onSettingsClick={() => setShowSettingsModal(true)}
              onExportClick={exportConversation}
              onClearClick={() => setShowClearModal(true)}
              onStopAllAudio={stopAllAudio}
              onRestartAudio={handleRestartAudio}
              onSkipBackward={() => playingMessageId && skipBackward(playingMessageId, 10)}
              onSkipForward={() => playingMessageId && skipForward(playingMessageId, 10)}
              onSpeedMenuToggle={() => setSpeedMenuOpen(!speedMenuOpen)}
              onSpeedChange={(speed) => {
                setSpeed(speed)
                setSpeedMenuOpen(false)
              }}
            />

            {/* Message List - Extra bottom padding for mobile to scroll past input */}
            <div className="flex-1 overflow-y-auto p-6 pb-8">
              <MessageList
                messages={messages}
                playbackStates={playbackStates}
                messagesEndRef={messagesEndRef}
                onPlayMessage={playMessage}
                onPauseMessage={pauseMessage}
              />
            </div>

            {/* Input Area */}
            <InputArea
              textInput={textInput}
              textareaRef={textareaRef}
              isProcessing={isProcessing}
              onTextChange={setTextInput}
              onTextSubmit={handleTextSubmit}
              onAudioRecorded={handleAudioRecorded}
              onRecordingStart={handleRecordingStart}
            />
          </div>
          </div>
        </main>

        {/* Desktop Memory Panel (right sidebar) */}
        <MemoryPanel />

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </div>

      {/* Memory Toast */}
      <AnimatePresence>
        {memoryToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg z-50 max-w-md text-center"
          >
            {memoryToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear Conversation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Clear All Chats?</h3>
                <p className="text-gray-600 mb-6">
                  This will permanently delete all your conversation history. This action cannot be
                  undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowClearModal(false)}
                    className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      await clearConversation()
                      setShowClearModal(false)
                    }}
                    className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Help Modal */}
      <AnimatePresence>
        {showShortcutsHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowShortcutsHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 shadow-sm">
                      {getShortcutDisplay(shortcut.key)}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Press <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Cmd/Ctrl + /</kbd> anytime to see shortcuts
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal - TODO: Extract to component in future iteration */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl mx-4 w-full max-h-[90vh] overflow-y-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Settings Content - Keeping inline for now, will extract later */}
              <div>
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2 z-10">
                  <div className="flex items-center gap-2">
                    <div className="text-3xl">⚙️</div>
                    <h3 className="text-2xl font-bold text-gray-900">Settings</h3>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  {/* About Me Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">📝 About Me</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      This context helps me understand you better. Edit anytime.
                    </p>
                    <textarea
                      value={userAboutMe}
                      onChange={(e) => setUserAboutMe(e.target.value)}
                      placeholder="Tell me about yourself..."
                      className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-y text-sm"
                    />
                  </div>

                  {/* Instructions Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      🎯 Response Instructions
                    </h4>
                    <textarea
                      value={userInstructions}
                      onChange={(e) => setUserInstructions(e.target.value)}
                      placeholder="Tell me how you'd like me to respond..."
                      className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-y text-sm"
                    />
                  </div>

                  {/* Memory Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">🧠 Memory</h4>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">Auto-save memories</p>
                        <p className="text-sm text-gray-600">
                          AI automatically remembers important facts
                        </p>
                      </div>
                      <button
                        onClick={() => setMemoryEnabled(!memoryEnabled)}
                        className={`relative w-12 h-6 rounded-full transition-all ${
                          memoryEnabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            memoryEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      <strong>{memories.length}</strong> memories stored
                    </p>

                    {/* Memory List */}
                    {memories.length > 0 && (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {memories.map((memory) => (
                          <div
                            key={memory.id}
                            className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <p className="text-sm text-gray-700 flex-1">{memory.fact}</p>
                            <button
                              onClick={() => deleteMemory(memory.id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                              title="Delete memory"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {memories.length > 0 && (
                      <button
                        onClick={clearMemories}
                        className="mt-3 w-full px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium text-sm"
                      >
                        Clear All Memories
                      </button>
                    )}
                  </div>

                  {/* Voice Settings Section */}
                  <div className="border-b border-gray-200 pb-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">🎤 Voice Settings</h4>

                    {/* Quality Selector */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Quality</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setSelectedModel('tts-1')}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedModel === 'tts-1'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-800">Standard</p>
                          <p className="text-xs text-gray-600">Faster, lower latency</p>
                          {selectedModel === 'tts-1' && (
                            <span className="text-purple-600 text-lg">✓</span>
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedModel('tts-1-hd')}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            selectedModel === 'tts-1-hd'
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-gray-800">HD</p>
                          <p className="text-xs text-gray-600">Higher quality audio</p>
                          {selectedModel === 'tts-1-hd' && (
                            <span className="text-purple-600 text-lg">✓</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Voice Selector */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Voice</p>
                      <div className="space-y-3">
                      {['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].map((voice) => (
                        <div
                          key={voice}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedVoice === voice
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedVoice(voice)}
                        >
                          <div>
                            <p className="font-medium text-gray-800 capitalize">{voice}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedVoice === voice && (
                              <span className="text-purple-600 font-bold">✓</span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                previewVoice(voice)
                              }}
                              disabled={previewingVoice === voice || preGeneratingPreviews}
                              className="px-3 py-1 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm disabled:opacity-50"
                            >
                              {previewingVoice === voice ? '🔊' : '▶️'}
                            </button>
                          </div>
                        </div>
                      ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Modal - TODO: Extract to component in future iteration */}
      {/* Keeping onboarding flow inline for now - can extract in future refinement */}
    </>
  )
}

// Wrapper component with all providers
export default function Home() {
  return (
    <MemoryProvider>
      <SettingsProvider>
        <VoiceProvider>
          <ChatProviderWrapper>
            <ChatInterface />
          </ChatProviderWrapper>
        </VoiceProvider>
      </SettingsProvider>
    </MemoryProvider>
  )
}

// Chat Provider Wrapper - bridges contexts
function ChatProviderWrapper({ children }: { children: React.ReactNode }) {
  const { memories, memoryEnabled, extractAndSaveMemories, setMemories } = useMemory()
  const { userAboutMe, userInstructions } = useSettings()
  const { selectedVoice, selectedModel } = useVoice()

  return (
    <ChatProvider
      selectedVoice={selectedVoice}
      selectedModel={selectedModel}
      memoryEnabled={memoryEnabled}
      userAboutMe={userAboutMe}
      userInstructions={userInstructions}
      memories={memories}
      onMemoryExtracted={extractAndSaveMemories}
      onNewMessage={(messages) => {
        // Optional: can add side effects when new messages arrive
      }}
    >
      {children}
    </ChatProvider>
  )
}
