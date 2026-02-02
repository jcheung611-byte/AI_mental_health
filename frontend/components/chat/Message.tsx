/**
 * Message Component
 *
 * Individual message bubble with text, timestamp, and audio playback controls
 */

import React from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import type { Message as MessageType } from '@/contexts/ChatContext'
import { useThemedStyles } from '@/hooks/useThemedStyles'

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
  const { styles, theme } = useThemedStyles()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: parseFloat(theme.animations.duration) / 1000,
        delay: index * 0.05,
        ease: theme.animations.easing as any,
      }}
      className={`
        flex w-full
        ${isUser ? 'justify-end md:justify-stretch' : 'justify-start md:justify-stretch'}
      `}
    >
      <div
        style={{
          borderRadius: isUser ? theme.borderRadius.xl : theme.borderRadius.xl,
          boxShadow: theme.shadows.md,
          transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
        }}
        className={`
          p-4 max-w-[85%] md:max-w-full
          ${isUser
            ? 'bg-[var(--color-primary)] text-white border-0 md:bg-[var(--color-primary)]/10 md:text-gray-700 md:border md:border-[var(--color-primary)]/25'
            : 'bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/25'}
        `}
      >
      {/* Message Header */}
      <p className={`text-sm font-medium mb-2 ${
        isUser
          ? 'text-white/80 md:text-[var(--color-primary)]'
          : 'text-[var(--color-secondary)]'
      }`}>
        {isUser ? '🎯 You' : '🤖 AI'}
      </p>

      {/* Message Content */}
      <div className={`mb-3 prose prose-sm max-w-none ${
        isUser ? 'text-white md:text-gray-700' : 'text-gray-700'
      }`}>
        {isAssistant && !message.text ? (
          // Loading state for AI response
          <div className="flex items-center gap-2 text-[var(--color-secondary)]">
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
              <span className="inline-block w-2 h-4 bg-[var(--color-secondary)] ml-1 animate-pulse"></span>
            )}
          </>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
      </div>

      {/* Message Footer */}
      <div className="flex items-center justify-between">
        <p className={`text-xs ${
          isUser ? 'text-white/60 md:text-gray-400' : 'text-gray-400'
        }`}>{message.timestamp.toLocaleTimeString()}</p>

        {/* Play/Pause Button for Assistant Messages */}
        {isAssistant && message.text && (
          <button
            onClick={playbackState === 'playing' ? onPause : onPlay}
            disabled={playbackState === 'loading'}
            style={{
              backgroundColor: playbackState === 'loading'
                ? '#9CA3AF'
                : playbackState === 'playing'
                ? theme.colors.accent
                : theme.colors.secondary,
              borderRadius: theme.borderRadius.lg,
              transition: `all ${theme.animations.duration} ${theme.animations.easing}`,
            }}
            className="px-4 py-2 min-h-[44px] font-medium text-sm text-white flex items-center justify-center disabled:cursor-wait"
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
      </div>
    </motion.div>
  )
}
