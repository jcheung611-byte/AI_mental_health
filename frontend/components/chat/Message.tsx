/**
 * Message Component
 *
 * Individual message bubble with text, timestamp, and audio playback controls
 */

import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { Message as MessageType } from '@/contexts/ChatContext'

interface MessageProps {
  message: MessageType
  index: number
  playbackState: 'stopped' | 'playing' | 'paused' | 'loading'
  onPlay: () => void
  onPause: () => void
}

export function Message({ message, index, playbackState, onPlay, onPause }: MessageProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`p-4 rounded-lg ${
        isUser ? 'bg-blue-50 border border-blue-200' : 'bg-purple-50 border border-purple-200'
      }`}
    >
      {/* Message Header */}
      <p className={`text-sm font-medium mb-2 ${isUser ? 'text-blue-800' : 'text-purple-800'}`}>
        {isUser ? '🎯 You' : '🤖 AI'}
      </p>

      {/* Message Content */}
      <div className="text-gray-700 mb-3 prose prose-sm max-w-none">
        {isAssistant && !message.text ? (
          // Loading state for AI response
          <div className="flex items-center gap-2 text-purple-600">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm font-medium">Thinking...</span>
          </div>
        ) : isAssistant ? (
          <>
            <ReactMarkdown
              components={{
                p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-gray-900" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="list-disc list-inside mb-2 space-y-1" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />
                ),
                li: ({ node, ...props }) => <li className="ml-2" {...props} />,
              }}
            >
              {message.text}
            </ReactMarkdown>
            {!message.audioUrl && message.text && (
              <span className="inline-block w-2 h-4 bg-purple-600 ml-1 animate-pulse"></span>
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
      </div>

      {/* Message Footer */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">{message.timestamp.toLocaleTimeString()}</p>

        {/* Play/Pause Button for Assistant Messages */}
        {isAssistant && message.text && (
          <button
            onClick={playbackState === 'playing' ? onPause : onPlay}
            disabled={playbackState === 'loading'}
            className={`
              px-3 py-1 rounded-lg font-medium text-sm transition-all
              ${
                playbackState === 'loading'
                  ? 'bg-gray-400 text-white cursor-wait'
                  : playbackState === 'playing'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }
            `}
            title={
              playbackState === 'loading'
                ? 'Generating audio...'
                : playbackState === 'playing'
                ? 'Pause'
                : 'Play'
            }
          >
            {playbackState === 'loading'
              ? '⏳'
              : playbackState === 'playing'
              ? '⏸️'
              : '▶️'}
          </button>
        )}
      </div>
    </motion.div>
  )
}
