/**
 * Voice Context
 *
 * Manages voice playback, recording, and TTS settings
 */

import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react'

interface VoiceContextValue {
  // Playback state
  playingMessageId: string | null
  playbackStates: Record<string, 'stopped' | 'playing' | 'paused' | 'loading'>
  globalPlaybackSpeed: number
  speedMenuOpen: boolean

  // Voice settings
  selectedVoice: string
  selectedModel: string
  previewingVoice: string | null
  preGeneratingPreviews: boolean

  // Refs
  audioRefs: React.MutableRefObject<Record<string, HTMLAudioElement>>
  previewAudioRef: React.MutableRefObject<HTMLAudioElement | null>
  previewIndexRef: React.MutableRefObject<Record<string, number>>
  previewCacheRef: React.MutableRefObject<Record<string, string>>

  // Setters
  setPlayingMessageId: (id: string | null) => void
  setPlaybackStates: (states: Record<string, 'stopped' | 'playing' | 'paused' | 'loading'> | ((prev: Record<string, 'stopped' | 'playing' | 'paused' | 'loading'>) => Record<string, 'stopped' | 'playing' | 'paused' | 'loading'>)) => void
  setGlobalPlaybackSpeed: (speed: number) => void
  setSpeedMenuOpen: (open: boolean) => void
  setSelectedVoice: (voice: string) => void
  setSelectedModel: (model: string) => void
  setPreviewingVoice: (voice: string | null) => void
  setPreGeneratingPreviews: (generating: boolean) => void

  // Methods
  playMessage: (messageId: string, audioUrl?: string) => Promise<void>
  pauseMessage: (messageId: string) => void
  restartMessage: (messageId: string, audioUrl?: string) => Promise<void>
  skipBackward: (messageId: string, seconds: number) => void
  skipForward: (messageId: string, seconds: number) => void
  setSpeed: (speed: number) => void
  stopAllAudio: () => void
  previewVoice: (voiceId: string) => Promise<void>
  preGenerateVoicePreviews: () => Promise<void>

  // Constants
  voicePreviewMessages: Record<string, string[]>
}

const VoiceContext = createContext<VoiceContextValue | undefined>(undefined)

interface VoiceProviderProps {
  children: ReactNode
}

export function VoiceProvider({ children }: VoiceProviderProps) {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null)
  const [playbackStates, setPlaybackStates] = useState<Record<string, 'stopped' | 'playing' | 'paused' | 'loading'>>({})
  const [globalPlaybackSpeed, setGlobalPlaybackSpeed] = useState<number>(1)
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)

  const [selectedVoice, setSelectedVoice] = useState<string>('nova')
  const [selectedModel, setSelectedModel] = useState<string>('tts-1')
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null)
  const [preGeneratingPreviews, setPreGeneratingPreviews] = useState(false)

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)
  const previewIndexRef = useRef<Record<string, number>>({})
  const previewCacheRef = useRef<Record<string, string>>({})

  // Voice preview messages - multiple personalized messages for each voice
  const voicePreviewMessages: Record<string, string[]> = {
    alloy: [
      "Hey, I'm here whenever you need to talk.",
      "Still exploring? Take all the time you need.",
      "I'm ready when you are.",
    ],
    echo: [
      "I'm listening. No rush at all.",
      "Back to hear me again? I appreciate that.",
      "You can share anything with me.",
    ],
    fable: [
      "Let's talk about what's on your mind.",
      "Checking in again? I'm here for it.",
      "I'm here to help you think things through.",
    ],
    onyx: [
      "I've got you. We'll work through this together.",
      "Trying me out again? I like the thoroughness.",
      "You're not alone in this.",
    ],
    nova: [
      "Hi! So glad you're here today.",
      "Still deciding? No pressure at all!",
      "I'm excited to chat with you!",
    ],
    shimmer: [
      "You're safe here. I'm listening.",
      "Taking your time? That's wise.",
      "There's no wrong choice. Trust yourself.",
    ],
  }

  // Pre-generate all voice previews
  const preGenerateVoicePreviews = async () => {
    if (preGeneratingPreviews) return

    setPreGeneratingPreviews(true)
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] 🎵 Pre-generating all voice previews...`)

    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']

    const promises = voices.flatMap((voiceId) => {
      const messages = voicePreviewMessages[voiceId]

      return messages.map(async (message, index) => {
        const cacheKey = `${voiceId}-${index}`

        if (previewCacheRef.current[cacheKey]) {
          return
        }

        try {
          const response = await fetch('/api/speak', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: message,
              voice: voiceId,
              model: selectedModel,
            }),
          })

          if (response.ok) {
            const audioBlob = await response.blob()
            const audioUrl = URL.createObjectURL(audioBlob)
            previewCacheRef.current[cacheKey] = audioUrl
            console.log(`[${new Date().toISOString()}] ✅ ${voiceId}[${index}] cached`)
          }
        } catch (error) {
          console.error(`Failed to pre-generate ${voiceId}[${index}]:`, error)
        }
      })
    })

    await Promise.all(promises)
    console.log(`[${new Date().toISOString()}] 🎉 All ${promises.length} preview variations ready!`)
    setPreGeneratingPreviews(false)
  }

  // Preview a voice
  const previewVoice = async (voiceId: string) => {
    const timestamp = new Date().toISOString()

    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause()
      previewAudioRef.current = null
    }

    // Get the next message index for this voice (rotate through variations)
    const messages = voicePreviewMessages[voiceId]
    const currentIndex = previewIndexRef.current[voiceId] || 0
    const nextIndex = (currentIndex + 1) % messages.length
    previewIndexRef.current[voiceId] = nextIndex

    const message = messages[currentIndex]
    const cacheKey = `${voiceId}-${currentIndex}`

    setPreviewingVoice(voiceId)

    try {
      let audioUrl = previewCacheRef.current[cacheKey]

      // If not cached, generate on-demand
      if (!audioUrl) {
        const response = await fetch('/api/speak', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: message,
            voice: voiceId,
            model: selectedModel,
          }),
        })

        if (!response.ok) {
          throw new Error(`TTS error: ${response.status}`)
        }

        const audioBlob = await response.blob()
        audioUrl = URL.createObjectURL(audioBlob)
        previewCacheRef.current[cacheKey] = audioUrl
      }

      const audio = new Audio(audioUrl)
      previewAudioRef.current = audio

      audio.onended = () => {
        setPreviewingVoice(null)
      }

      audio.onerror = () => {
        setPreviewingVoice(null)
      }

      await audio.play()
      console.log(`[${timestamp}] 🎤 Playing preview for ${voiceId}[${currentIndex}]: "${message}"`)
    } catch (error) {
      console.error(`Failed to preview ${voiceId}:`, error)
      setPreviewingVoice(null)
    }
  }

  // Play message audio
  const playMessage = async (messageId: string, audioUrl?: string) => {
    if (!audioUrl) {
      console.warn(`No audio URL for message ${messageId}`)
      return
    }

    // Stop all other audio
    stopAllAudio()

    setPlaybackStates((prev) => ({
      ...prev,
      [messageId]: 'loading',
    }))

    try {
      let audio = audioRefs.current[messageId]

      if (!audio) {
        audio = new Audio(audioUrl)
        audioRefs.current[messageId] = audio

        audio.onended = () => {
          setPlaybackStates((prev) => ({
            ...prev,
            [messageId]: 'stopped',
          }))
          setPlayingMessageId(null)
        }

        audio.onerror = () => {
          setPlaybackStates((prev) => ({
            ...prev,
            [messageId]: 'stopped',
          }))
          setPlayingMessageId(null)
        }
      }

      audio.playbackRate = globalPlaybackSpeed
      await audio.play()

      setPlaybackStates((prev) => ({
        ...prev,
        [messageId]: 'playing',
      }))
      setPlayingMessageId(messageId)
    } catch (error) {
      console.error(`Failed to play message ${messageId}:`, error)
      setPlaybackStates((prev) => ({
        ...prev,
        [messageId]: 'stopped',
      }))
    }
  }

  // Pause message audio
  const pauseMessage = (messageId: string) => {
    const audio = audioRefs.current[messageId]
    if (audio) {
      audio.pause()
      setPlaybackStates((prev) => ({
        ...prev,
        [messageId]: 'paused',
      }))
    }
  }

  // Restart message audio from beginning
  const restartMessage = async (messageId: string, audioUrl?: string) => {
    const audio = audioRefs.current[messageId]
    if (audio) {
      audio.currentTime = 0
      audio.playbackRate = globalPlaybackSpeed
      await audio.play()
      setPlaybackStates((prev) => ({
        ...prev,
        [messageId]: 'playing',
      }))
      setPlayingMessageId(messageId)
    } else {
      await playMessage(messageId, audioUrl)
    }
  }

  // Skip backward
  const skipBackward = (messageId: string, seconds: number) => {
    const audio = audioRefs.current[messageId]
    if (audio) {
      audio.currentTime = Math.max(0, audio.currentTime - seconds)
    }
  }

  // Skip forward
  const skipForward = (messageId: string, seconds: number) => {
    const audio = audioRefs.current[messageId]
    if (audio) {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + seconds)
    }
  }

  // Set playback speed
  const setSpeed = (speed: number) => {
    setGlobalPlaybackSpeed(speed)
    Object.values(audioRefs.current).forEach((audio) => {
      audio.playbackRate = speed
    })
  }

  // Stop all audio
  const stopAllAudio = () => {
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      audio.pause()
      audio.currentTime = 0
    })

    setPlaybackStates((prev) => {
      const newStates: Record<string, 'stopped'> = {}
      Object.keys(prev).forEach((id) => {
        newStates[id] = 'stopped'
      })
      return newStates
    })

    setPlayingMessageId(null)
  }

  // Update all audio playback speeds when global speed changes
  useEffect(() => {
    Object.values(audioRefs.current).forEach((audio) => {
      audio.playbackRate = globalPlaybackSpeed
    })
  }, [globalPlaybackSpeed])

  const value: VoiceContextValue = {
    playingMessageId,
    playbackStates,
    globalPlaybackSpeed,
    speedMenuOpen,
    selectedVoice,
    selectedModel,
    previewingVoice,
    preGeneratingPreviews,
    audioRefs,
    previewAudioRef,
    previewIndexRef,
    previewCacheRef,
    setPlayingMessageId,
    setPlaybackStates,
    setGlobalPlaybackSpeed,
    setSpeedMenuOpen,
    setSelectedVoice,
    setSelectedModel,
    setPreviewingVoice,
    setPreGeneratingPreviews,
    playMessage,
    pauseMessage,
    restartMessage,
    skipBackward,
    skipForward,
    setSpeed,
    stopAllAudio,
    previewVoice,
    preGenerateVoicePreviews,
    voicePreviewMessages,
  }

  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>
}

export function useVoice() {
  const context = useContext(VoiceContext)
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}
