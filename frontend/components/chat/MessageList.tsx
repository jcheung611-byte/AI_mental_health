/**
 * Message List Component
 *
 * Scrollable list of chat messages with animations
 */

import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { Message } from './Message'
import type { Message as MessageType } from '@/contexts/ChatContext'

interface MessageListProps {
  messages: MessageType[]
  playbackStates: Record<string, 'stopped' | 'playing' | 'paused' | 'loading'>
  messagesEndRef: React.RefObject<HTMLDivElement>
  onPlayMessage: (messageId: string, audioUrl?: string) => Promise<void>
  onPauseMessage: (messageId: string) => void
}

export function MessageList({
  messages,
  playbackStates,
  messagesEndRef,
  onPlayMessage,
  onPauseMessage,
}: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12">
        <p className="text-lg mb-2">👋</p>
        <p className="text-sm">No messages yet. Click the mic to start!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            index={index}
            playbackState={playbackStates[message.id] || 'stopped'}
            onPlay={() => onPlayMessage(message.id, message.audioUrl)}
            onPause={() => onPauseMessage(message.id)}
          />
        ))}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  )
}
