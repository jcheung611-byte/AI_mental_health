/**
 * Input Area Component
 *
 * Combined text input + voice button for message composition
 * Note: This is a basic version. Will be enhanced in Week 5 with unified voice/text interface.
 */

import React from 'react'
import VoiceButton from '@/components/VoiceButton'

interface InputAreaProps {
  textInput: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
  isProcessing: boolean
  onTextChange: (text: string) => void
  onTextSubmit: (e: React.FormEvent) => Promise<void>
  onAudioRecorded: (blob: Blob) => Promise<void>
  onRecordingStart: () => void
}

export function InputArea({
  textInput,
  textareaRef,
  isProcessing,
  onTextChange,
  onTextSubmit,
  onAudioRecorded,
  onRecordingStart,
}: InputAreaProps) {
  return (
    <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl">
      <form onSubmit={onTextSubmit} className="flex items-center gap-2">
        {/* Voice Button - Compact */}
        <VoiceButton
          onAudioRecorded={onAudioRecorded}
          onRecordingStart={onRecordingStart}
          disabled={isProcessing}
          compact
        />

        {/* Text Input - Auto-expanding */}
        <textarea
          ref={textareaRef}
          value={textInput}
          onChange={(e) => onTextChange(e.target.value)}
          onKeyDown={(e) => {
            // Submit on Enter (unless Shift+Enter for new line)
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onTextSubmit(e as any)
            }
          }}
          placeholder={isProcessing ? 'Transcribing...' : 'Type message or use mic...'}
          rows={1}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 resize-none overflow-y-auto"
          style={{
            minHeight: '42px',
            maxHeight: '50vh',
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!textInput.trim()}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            textInput.trim()
              ? isProcessing
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={isProcessing ? 'Queue message' : 'Send message'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
