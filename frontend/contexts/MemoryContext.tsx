/**
 * Memory Context
 *
 * Manages user memories, memory settings, and memory extraction
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Memory = {
  id: string
  fact: string
  timestamp: Date
  source?: 'import' | 'conversation'
}

const MEMORY_STORAGE_KEY = 'ai-voice-memories'
const MEMORY_ENABLED_KEY = 'ai-voice-memory-enabled'

interface MemoryContextValue {
  // State
  memories: Memory[]
  memoryEnabled: boolean
  memoryToast: string | null
  memoryFilter: 'all' | 'import' | 'conversation'
  copyConfirm: boolean

  // Setters
  setMemories: (memories: Memory[] | ((prev: Memory[]) => Memory[])) => void
  setMemoryEnabled: (enabled: boolean) => void
  setMemoryToast: (message: string | null) => void
  setMemoryFilter: (filter: 'all' | 'import' | 'conversation') => void
  setCopyConfirm: (confirm: boolean) => void

  // Methods
  extractAndSaveMemories: (userMessage: string) => Promise<void>
  deleteMemory: (memoryId: string) => Promise<void>
  clearMemories: () => Promise<void>
  addMemories: (facts: string[], source?: 'import' | 'conversation') => Promise<void>
  loadMemoriesFromStorage: () => void
  saveMemoriesToStorage: (memoriesToSave: Memory[]) => Promise<void>
}

const MemoryContext = createContext<MemoryContextValue | undefined>(undefined)

interface MemoryProviderProps {
  children: ReactNode
}

export function MemoryProvider({ children }: MemoryProviderProps) {
  const [memories, setMemories] = useState<Memory[]>([])
  const [memoryEnabled, setMemoryEnabledState] = useState<boolean>(true)
  const [memoryToast, setMemoryToast] = useState<string | null>(null)
  const [memoryFilter, setMemoryFilter] = useState<'all' | 'import' | 'conversation'>('all')
  const [copyConfirm, setCopyConfirm] = useState(false)

  // Load memories and enabled state from localStorage on mount
  const loadMemoriesFromStorage = () => {
    const stored = localStorage.getItem(MEMORY_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        const memoriesWithDates = parsed.map((mem: any) => ({
          ...mem,
          timestamp: new Date(mem.timestamp),
        }))
        setMemories(memoriesWithDates)
      } catch (error) {
        console.error('Failed to parse stored memories:', error)
      }
    }

    const enabledStored = localStorage.getItem(MEMORY_ENABLED_KEY)
    if (enabledStored !== null) {
      setMemoryEnabledState(enabledStored === 'true')
    }
  }

  useEffect(() => {
    loadMemoriesFromStorage()
  }, [])

  // Save memories to localStorage
  const saveMemoriesToStorage = async (memoriesToSave: Memory[]) => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memoriesToSave))
    } catch (error) {
      console.error('Failed to save memories to localStorage:', error)
    }
  }

  // Wrapper to save enabled state to localStorage
  const setMemoryEnabled = (enabled: boolean) => {
    setMemoryEnabledState(enabled)
    localStorage.setItem(MEMORY_ENABLED_KEY, enabled.toString())
  }

  // Add memories from array of facts
  const addMemories = async (facts: string[], source: 'import' | 'conversation' = 'conversation') => {
    const newMemories: Memory[] = facts.map((fact) => ({
      id: `memory-${Date.now()}-${Math.random()}`,
      fact: fact.trim(),
      timestamp: new Date(),
      source,
    }))

    const updatedMemories = [...memories, ...newMemories]
    setMemories(updatedMemories)
    await saveMemoriesToStorage(updatedMemories)

    return newMemories
  }

  // Extract and save memories from user message
  const extractAndSaveMemories = async (userMessage: string) => {
    if (!memoryEnabled) return

    try {
      const response = await fetch('/api/extract-memories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          existingMemories: memories.map((m) => m.fact),
        }),
      })

      if (!response.ok) {
        throw new Error(`Memory extraction error: ${response.status}`)
      }

      const data = await response.json()

      if (data.newFacts && data.newFacts.length > 0) {
        const newMemories = await addMemories(data.newFacts, 'conversation')

        // Show toast for new memories
        if (newMemories.length === 1) {
          setMemoryToast(`💾 Remembered: ${newMemories[0].fact}`)
        } else {
          setMemoryToast(`💾 Remembered ${newMemories.length} new things`)
        }

        // Auto-hide toast after 5 seconds
        setTimeout(() => {
          setMemoryToast(null)
        }, 5000)
      }
    } catch (error) {
      console.error('Failed to extract memories:', error)
    }
  }

  // Delete a memory
  const deleteMemory = async (memoryId: string) => {
    const updatedMemories = memories.filter((m) => m.id !== memoryId)
    setMemories(updatedMemories)
    await saveMemoriesToStorage(updatedMemories)
    setMemoryToast('🗑️ Memory deleted')
    setTimeout(() => {
      setMemoryToast(null)
    }, 3000)
  }

  // Clear all memories
  const clearMemories = async () => {
    setMemories([])
    await saveMemoriesToStorage([])
    setMemoryToast('🗑️ All memories cleared')
    setTimeout(() => {
      setMemoryToast(null)
    }, 3000)
  }

  const value: MemoryContextValue = {
    memories,
    memoryEnabled,
    memoryToast,
    memoryFilter,
    copyConfirm,
    setMemories,
    setMemoryEnabled,
    setMemoryToast,
    setMemoryFilter,
    setCopyConfirm,
    extractAndSaveMemories,
    deleteMemory,
    clearMemories,
    addMemories,
    loadMemoriesFromStorage,
    saveMemoriesToStorage,
  }

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>
}

export function useMemory() {
  const context = useContext(MemoryContext)
  if (context === undefined) {
    throw new Error('useMemory must be used within a MemoryProvider')
  }
  return context
}
