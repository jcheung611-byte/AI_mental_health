/**
 * Chat Context
 *
 * Manages chat messages, processing state, and message queue
 */

import React, { createContext, useContext, useState, useRef, ReactNode, useEffect } from 'react'
import { supabase, DEFAULT_USER_ID, uploadAudioToStorage } from '@/utils/supabase'

export type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
  audioUrl?: string
  generatedVoice?: string
  generatedModel?: string
}

const STORAGE_KEY = 'ai-voice-conversations'

interface ChatContextValue {
  // State
  messages: Message[]
  status: string
  isProcessing: boolean
  error: string
  textInput: string
  messageQueue: string[]

  // Refs
  fullAudioBlobRef: React.MutableRefObject<Blob | null>
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null>
  messagesEndRef: React.MutableRefObject<HTMLDivElement | null>

  // Setters
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void
  setStatus: (status: string) => void
  setIsProcessing: (isProcessing: boolean) => void
  setError: (error: string) => void
  setTextInput: (text: string) => void
  setMessageQueue: (queue: string[] | ((prev: string[]) => string[])) => void

  // Methods
  processTextMessage: (text: string) => Promise<void>
  handleTextSubmit: (e: React.FormEvent) => Promise<void>
  handleAudioRecorded: (blob: Blob) => Promise<void>
  saveMessagesToStorage: (messagesToSave: Message[]) => Promise<void>
  clearConversation: () => Promise<void>
  exportConversation: () => void
  loadMessagesFromStorage: () => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

interface ChatProviderProps {
  children: ReactNode
  selectedVoice: string
  selectedModel: string
  memoryEnabled: boolean
  userAboutMe: string
  userInstructions: string
  memories: Array<{ id: string; fact: string; timestamp: Date }>
  onMemoryExtracted: (userMessage: string) => Promise<void>
  onNewMessage?: (messages: Message[]) => void
}

export function ChatProvider({
  children,
  selectedVoice,
  selectedModel,
  memoryEnabled,
  userAboutMe,
  userInstructions,
  memories,
  onMemoryExtracted,
  onNewMessage,
}: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [status, setStatus] = useState<string>('Ready - Use mic or type to compose')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string>('')
  const [textInput, setTextInput] = useState<string>('')
  const [messageQueue, setMessageQueue] = useState<string[]>([])

  const fullAudioBlobRef = useRef<Blob | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages from localStorage on mount
  const loadMessagesFromStorage = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
        setMessages(messagesWithDates)
      } catch (error) {
        console.error('Failed to parse stored messages:', error)
      }
    }
  }

  useEffect(() => {
    loadMessagesFromStorage()
  }, [])

  // Save messages to localStorage
  const saveMessagesToStorage = async (messagesToSave: Message[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave))
    } catch (error) {
      console.error('Failed to save messages to localStorage:', error)
    }
  }

  // Process text message through API
  const processTextMessage = async (text: string) => {
    if (!text.trim()) return

    setIsProcessing(true)
    setError('')
    setStatus('Processing your message...')

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    }

    if (fullAudioBlobRef.current) {
      try {
        const result = await uploadAudioToStorage(fullAudioBlobRef.current, DEFAULT_USER_ID)
        if (result) {
          userMessage.audioUrl = result.url
        }
      } catch (error) {
        console.error('Failed to upload audio:', error)
      }
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    await saveMessagesToStorage(updatedMessages)

    // Call memory extraction if enabled
    if (memoryEnabled) {
      await onMemoryExtracted(text.trim())
    }

    // Build context for API
    const conversationHistory = updatedMessages.map(msg => ({
      role: msg.role,
      content: msg.text,
    }))

    // Add memory context if enabled and memories exist
    let systemMessage = ''
    if (memoryEnabled && memories.length > 0) {
      const memoryContext = memories.map(m => m.fact).join('\n')
      systemMessage = `You are a supportive mental health companion. Here's what you know about the user:\n\n${memoryContext}`
    } else {
      systemMessage = 'You are a supportive mental health companion.'
    }

    // Add user context if provided
    if (userAboutMe.trim()) {
      systemMessage += `\n\nAbout the user: ${userAboutMe.trim()}`
    }

    if (userInstructions.trim()) {
      systemMessage += `\n\nUser instructions: ${userInstructions.trim()}`
    }

    setStatus('Getting response...')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemMessage },
            ...conversationHistory,
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const assistantText = data.message

      setStatus('Generating voice response...')

      // Generate TTS for assistant response
      const ttsResponse = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: assistantText,
          voice: selectedVoice,
          model: selectedModel,
        }),
      })

      if (!ttsResponse.ok) {
        throw new Error(`TTS error: ${ttsResponse.status}`)
      }

      const audioBlob = await ttsResponse.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      // Create assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: assistantText,
        timestamp: new Date(),
        audioUrl,
        generatedVoice: selectedVoice,
        generatedModel: selectedModel,
      }

      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)
      await saveMessagesToStorage(finalMessages)

      if (onNewMessage) {
        onNewMessage(finalMessages)
      }

      setStatus('Ready - Use mic or type to compose')
      setIsProcessing(false)
      fullAudioBlobRef.current = null
    } catch (err: any) {
      console.error('Error processing message:', err)
      setError(err.message || 'Failed to process message')
      setStatus('Error - Try again')
      setIsProcessing(false)
    }
  }

  // Handle text form submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim() || isProcessing) return

    const text = textInput.trim()
    setTextInput('')

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await processTextMessage(text)
  }

  // Handle audio recording completion
  const handleAudioRecorded = async (blob: Blob) => {
    fullAudioBlobRef.current = blob
    setStatus('Transcribing audio...')
    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Transcription error: ${response.status}`)
      }

      const data = await response.json()
      const transcribedText = data.text

      setTextInput(transcribedText)
      await processTextMessage(transcribedText)
    } catch (err: any) {
      console.error('Error transcribing audio:', err)
      setError(err.message || 'Failed to transcribe audio')
      setStatus('Error - Try again')
      setIsProcessing(false)
      fullAudioBlobRef.current = null
    }
  }

  // Clear conversation
  const clearConversation = async () => {
    setMessages([])
    setMessageQueue([])
    setTextInput('')
    setError('')
    setStatus('Ready - Use mic or type to compose')
    await saveMessagesToStorage([])
  }

  // Export conversation as JSON
  const exportConversation = () => {
    const dataStr = JSON.stringify(messages, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `conversation-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const value: ChatContextValue = {
    messages,
    status,
    isProcessing,
    error,
    textInput,
    messageQueue,
    fullAudioBlobRef,
    textareaRef,
    messagesEndRef,
    setMessages,
    setStatus,
    setIsProcessing,
    setError,
    setTextInput,
    setMessageQueue,
    processTextMessage,
    handleTextSubmit,
    handleAudioRecorded,
    saveMessagesToStorage,
    clearConversation,
    exportConversation,
    loadMessagesFromStorage,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
