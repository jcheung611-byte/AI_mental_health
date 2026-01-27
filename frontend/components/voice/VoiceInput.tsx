/**
 * Unified Voice Input Component
 *
 * ChatGPT-style unified voice + text input with:
 * - Desktop: Hold 500ms to record
 * - Mobile: Tap for voice sheet
 * - Real-time waveform visualization
 * - Editable transcription in text field
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceInputProps {
  onTranscriptionComplete: (text: string, audioBlob: Blob) => void
  onRecordingStart?: () => void
  isProcessing?: boolean
}

export function VoiceInput({
  onTranscriptionComplete,
  onRecordingStart,
  isProcessing = false,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Detect if mobile
  const isMobile =
    typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

  // Start recording
  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Set up audio analyzer for waveform
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start waveform animation
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      const updateAudioLevel = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average / 255)
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
      updateAudioLevel()

      // Set up media recorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Start duration timer
      let duration = 0
      timerRef.current = setInterval(() => {
        duration += 1
        setRecordingDuration(duration)
      }, 1000)

      if (onRecordingStart) {
        onRecordingStart()
      }
    } catch (err) {
      console.error('Failed to start recording:', err)
      setError('Microphone access denied')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clean up
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }

      setRecordingDuration(0)
      setAudioLevel(0)
    }
  }

  // Transcribe audio
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Transcription error: ${response.status}`)
      }

      const data = await response.json()
      const transcribedText = data.text

      setIsTranscribing(false)
      onTranscriptionComplete(transcribedText, audioBlob)

      if (showMobileSheet) {
        setShowMobileSheet(false)
      }
    } catch (err) {
      console.error('Transcription failed:', err)
      setError('Failed to transcribe audio')
      setIsTranscribing(false)
    }
  }

  // Desktop: Long-press to record
  const handleMouseDown = () => {
    if (isMobile || isProcessing || isRecording) return

    longPressTimerRef.current = setTimeout(() => {
      startRecording()
    }, 500) // 500ms hold to start
  }

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    if (isRecording) {
      stopRecording()
    }
  }

  // Mobile: Tap to open sheet
  const handleMobileClick = () => {
    if (!isMobile) return
    setShowMobileSheet(true)
  }

  // Format recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  return (
    <>
      {/* Inline Microphone Button */}
      <button
        type="button"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMobileClick}
        disabled={isProcessing || isTranscribing}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isRecording
            ? 'bg-red-500 animate-pulse'
            : isTranscribing
            ? 'bg-blue-500'
            : 'bg-purple-500 hover:bg-purple-600 active:scale-95'
        } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isMobile ? 'Tap to record' : 'Hold to record'}
      >
        {isTranscribing ? (
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : isRecording ? (
          <div className="w-3 h-3 bg-white rounded-sm" />
        ) : (
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {/* Desktop: Inline Recording Indicator */}
      {!isMobile && isRecording && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-red-600 font-medium"
        >
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-red-500 rounded-full"
                style={{ height: `${8 + audioLevel * 20}px` }}
                animate={{
                  height: [`${8 + audioLevel * 20}px`, `${12 + audioLevel * 20}px`, `${8 + audioLevel * 20}px`],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
          <span>{formatDuration(recordingDuration)}</span>
          <span className="text-xs text-gray-500">(Release to send)</span>
        </motion.div>
      )}

      {/* Mobile: Full-Screen Voice Sheet */}
      <AnimatePresence>
        {isMobile && showMobileSheet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="text-center"
            >
              {/* Close button */}
              {!isRecording && !isTranscribing && (
                <button
                  onClick={() => setShowMobileSheet(false)}
                  className="absolute top-4 right-4 text-white text-3xl"
                >
                  ×
                </button>
              )}

              {/* Waveform visualization */}
              <div className="mb-8 flex items-center justify-center gap-2 h-32">
                {isRecording ? (
                  [...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-red-500 rounded-full"
                      animate={{
                        height: [`${20 + Math.random() * audioLevel * 80}px`],
                      }}
                      transition={{
                        duration: 0.15,
                        repeat: Infinity,
                        repeatType: 'reverse',
                      }}
                    />
                  ))
                ) : isTranscribing ? (
                  <div className="animate-spin h-16 w-16 border-4 border-blue-500 border-t-transparent rounded-full" />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-purple-500 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Status text */}
              <p className="text-white text-xl mb-8">
                {isTranscribing
                  ? 'Transcribing...'
                  : isRecording
                  ? formatDuration(recordingDuration)
                  : 'Tap to start recording'}
              </p>

              {/* Record/Stop button */}
              {!isTranscribing && (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl ${
                    isRecording ? 'bg-red-500' : 'bg-purple-500'
                  }`}
                >
                  {isRecording ? '⏹' : '🎤'}
                </button>
              )}

              {error && <p className="mt-4 text-red-400">{error}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error toast */}
      {error && !showMobileSheet && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-red-500 text-white text-sm rounded-lg"
        >
          {error}
        </motion.div>
      )}
    </>
  )
}
