/**
 * Chat Header Component
 *
 * Header with settings, export/clear buttons, universal playback controls, and status bar
 */

import React from 'react'
import type { Message } from '@/contexts/ChatContext'

interface ChatHeaderProps {
  // Message state
  messages: Message[]
  messageQueue: string[]
  isProcessing: boolean
  error: string
  status: string

  // Playback state
  playingMessageId: string | null
  globalPlaybackSpeed: number
  speedMenuOpen: boolean

  // Actions
  onSettingsClick: () => void
  onExportClick: () => void
  onClearClick: () => void
  onStopAllAudio: () => void
  onRestartAudio: () => void
  onSkipBackward: () => void
  onSkipForward: () => void
  onSpeedMenuToggle: () => void
  onSpeedChange: (speed: number) => void
}

export function ChatHeader({
  messages,
  messageQueue,
  isProcessing,
  error,
  status,
  playingMessageId,
  globalPlaybackSpeed,
  speedMenuOpen,
  onSettingsClick,
  onExportClick,
  onClearClick,
  onStopAllAudio,
  onRestartAudio,
  onSkipBackward,
  onSkipForward,
  onSpeedMenuToggle,
  onSpeedChange,
}: ChatHeaderProps) {
  return (
    <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
      {/* Top Row - Title + Actions */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Conversation</h2>

          {/* Settings Button */}
          <button
            onClick={onSettingsClick}
            className="px-2 py-1 text-lg rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
            title="Settings"
          >
            ⚙️
          </button>

          {/* Export & Clear Buttons */}
          {messages.length > 0 && (
            <>
              <button
                onClick={onExportClick}
                className="px-3 py-1 text-xs rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-all font-medium"
                title="Export conversation & memories"
              >
                💾 Export
              </button>
              <button
                onClick={onClearClick}
                className="px-3 py-1 text-xs rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-all font-medium"
                title="Clear all conversations"
              >
                🗑️ Clear
              </button>
            </>
          )}
        </div>

        {/* Universal Playback Controls */}
        <div className="flex items-center gap-2">
          {playingMessageId && (
            <>
              {/* Stop Button */}
              <button
                onClick={onStopAllAudio}
                className="px-2 py-1 rounded-lg font-medium text-sm transition-all bg-red-500 hover:bg-red-600 text-white"
                title="Stop playback"
              >
                ⏹️
              </button>

              {/* Restart Button */}
              <button
                onClick={onRestartAudio}
                className="px-2 py-1 rounded-lg font-medium text-sm transition-all bg-gray-500 hover:bg-gray-600 text-white"
                title="Restart from beginning"
              >
                🔄
              </button>

              {/* Skip Backward */}
              <button
                onClick={onSkipBackward}
                className="px-2 py-1 rounded-lg font-medium text-xs transition-all bg-blue-500 hover:bg-blue-600 text-white"
                title="Skip backward 10 seconds"
              >
                ⏪ -10s
              </button>

              {/* Skip Forward */}
              <button
                onClick={onSkipForward}
                className="px-2 py-1 rounded-lg font-medium text-xs transition-all bg-blue-600 hover:bg-blue-700 text-white"
                title="Skip forward 10 seconds"
              >
                +10s ⏩
              </button>
            </>
          )}

          {/* Speed Selector */}
          <div className="relative speed-selector">
            <button
              onClick={onSpeedMenuToggle}
              className="px-3 py-1 rounded-lg font-bold text-sm transition-all bg-gray-400 hover:bg-gray-500 text-white flex items-center gap-1"
              title={`Playback speed: ${globalPlaybackSpeed}x`}
            >
              {globalPlaybackSpeed}x
              <span className="text-xs">{speedMenuOpen ? '▲' : '▼'}</span>
            </button>

            {speedMenuOpen && (
              <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                {[1, 1.25, 1.5, 1.75, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => onSpeedChange(speed)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                      globalPlaybackSpeed === speed
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {speed === 1 ? 'Normal' : `${speed}x`}
                    {globalPlaybackSpeed === speed && <span className="ml-2">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar - Always Visible */}
      <div
        className={`px-4 pb-3 flex items-center justify-between transition-all ${
          isProcessing || playingMessageId || error ? 'opacity-100' : 'opacity-70'
        }`}
      >
        <div className="flex items-center gap-2">
          {isProcessing && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              <span className="animate-spin">⏳</span>
              {status}
            </span>
          )}
          {playingMessageId && !isProcessing && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              <span className="animate-pulse">🔊</span>
              Playing audio
            </span>
          )}
          {!isProcessing && !playingMessageId && !error && (
            <span className="text-sm text-gray-600">
              {messages.length > 0 ? `${messages.length} messages` : 'Ready to chat'}
            </span>
          )}
          {error && (
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
              ❌ {error}
            </span>
          )}
        </div>
        {messageQueue.length > 0 && (
          <span className="text-xs text-orange-600 font-medium">
            📬 {messageQueue.length} queued
          </span>
        )}
      </div>
    </div>
  )
}
