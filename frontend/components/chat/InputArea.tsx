/**
 * Input Area Component - Week 5 Enhanced
 *
 * Unified voice + text input (ChatGPT-style)
 * - Desktop: Long-press mic to record
 * - Mobile: Tap mic for voice sheet
 * - Real-time waveform visualization
 * - Transcription appears as editable text
 */

import React, { useEffect } from 'react'
import { VoiceInput } from '@/components/voice'

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
  // Handle voice transcription completion
  const handleTranscriptionComplete = async (transcribedText: string, audioBlob: Blob) => {
    // Set transcribed text in input field (user can edit before sending)
    onTextChange(transcribedText)

    // Call the audio recorded handler to save the blob
    await onAudioRecorded(audioBlob)
  }

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [textInput, textareaRef])

  return (
    <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl">
      <form onSubmit={onTextSubmit} className="flex items-center gap-3 relative">
        {/* Unified Voice Input - Inline microphone */}
        <VoiceInput
          onTranscriptionComplete={handleTranscriptionComplete}
          onRecordingStart={onRecordingStart}
          isProcessing={isProcessing}
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
          placeholder={isProcessing ? 'Processing...' : 'Type or hold mic to speak...'}
          rows={1}
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 resize-none overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{
            minHeight: '42px',
            maxHeight: '50vh',
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!textInput.trim() || isProcessing}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            textInput.trim() && !isProcessing
              ? 'bg-purple-500 hover:bg-purple-600 active:scale-95 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={isProcessing ? 'Processing...' : textInput.trim() ? 'Send message' : 'Type to enable'}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </form>
    </div>
  )
}
