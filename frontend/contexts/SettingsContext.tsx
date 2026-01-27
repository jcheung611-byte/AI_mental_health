/**
 * Settings Context
 *
 * Manages app settings, user context, and onboarding
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, DEFAULT_USER_ID } from '@/utils/supabase'
import type { Memory } from './MemoryContext'

const ABOUT_ME_KEY = 'ai-voice-about-me'
const INSTRUCTIONS_KEY = 'ai-voice-instructions'
const ONBOARDING_COMPLETE_KEY = 'ai-voice-onboarding-complete'

interface SettingsContextValue {
  // Modal state
  showSettingsModal: boolean
  showClearModal: boolean
  showOnboardingModal: boolean

  // User context
  userAboutMe: string
  userInstructions: string

  // Onboarding state
  onboardingStep: number
  selectedOnboardingOption: 'chatgpt' | 'fresh' | null
  chatGPTResponse: string
  parsedFacts: string[]
  parsedAboutMe: string
  isParsingContext: boolean

  // Setters
  setShowSettingsModal: (show: boolean) => void
  setShowClearModal: (show: boolean) => void
  setShowOnboardingModal: (show: boolean) => void
  setUserAboutMe: (text: string) => void
  setUserInstructions: (text: string) => void
  setOnboardingStep: (step: number) => void
  setSelectedOnboardingOption: (option: 'chatgpt' | 'fresh' | null) => void
  setChatGPTResponse: (response: string) => void
  setParsedFacts: (facts: string[]) => void
  setParsedAboutMe: (text: string) => void
  setIsParsingContext: (parsing: boolean) => void

  // Methods
  parseContextFromChatGPT: (response: string) => Promise<void>
  completeOnboarding: (memories: Memory[], onMemoriesUpdate: (newMemories: Memory[]) => void) => Promise<void>
  skipOnboarding: () => void
  saveUserContextToStorage: () => void
  loadUserContextFromStorage: () => void
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined)

interface SettingsProviderProps {
  children: ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showClearModal, setShowClearModal] = useState(false)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)

  const [userAboutMe, setUserAboutMeState] = useState<string>('')
  const [userInstructions, setUserInstructionsState] = useState<string>('')

  const [onboardingStep, setOnboardingStep] = useState<number>(1)
  const [selectedOnboardingOption, setSelectedOnboardingOption] = useState<'chatgpt' | 'fresh' | null>(null)
  const [chatGPTResponse, setChatGPTResponse] = useState<string>('')
  const [parsedFacts, setParsedFacts] = useState<string[]>([])
  const [parsedAboutMe, setParsedAboutMe] = useState<string>('')
  const [isParsingContext, setIsParsingContext] = useState(false)

  // Load user context from localStorage on mount
  const loadUserContextFromStorage = () => {
    const aboutMe = localStorage.getItem(ABOUT_ME_KEY)
    if (aboutMe) {
      setUserAboutMeState(aboutMe)
    }

    const instructions = localStorage.getItem(INSTRUCTIONS_KEY)
    if (instructions) {
      setUserInstructionsState(instructions)
    }

    const onboardingComplete = localStorage.getItem(ONBOARDING_COMPLETE_KEY)
    if (!onboardingComplete) {
      setShowOnboardingModal(true)
    }
  }

  useEffect(() => {
    loadUserContextFromStorage()
  }, [])

  // Save user context to localStorage
  const saveUserContextToStorage = () => {
    localStorage.setItem(ABOUT_ME_KEY, userAboutMe)
    localStorage.setItem(INSTRUCTIONS_KEY, userInstructions)
  }

  // Wrapper setters that also save to localStorage
  const setUserAboutMe = (text: string) => {
    setUserAboutMeState(text)
    localStorage.setItem(ABOUT_ME_KEY, text)
  }

  const setUserInstructions = (text: string) => {
    setUserInstructionsState(text)
    localStorage.setItem(INSTRUCTIONS_KEY, text)
  }

  // ChatGPT import prompt
  const CHATGPT_IMPORT_PROMPT = `Tell me everything you know about me as a person. Please include:
- My personality, values, communication style
- What I'm working on or interested in
- Any challenges I've mentioned
- Important relationships or life events
- Preferences and patterns you've noticed
- Anything that helps you understand me better

Be thorough and specific!`

  // Parse context from ChatGPT response
  const parseContextFromChatGPT = async (response: string) => {
    setIsParsingContext(true)
    console.log(`[${new Date().toISOString()}] 🔍 Parsing ChatGPT context...`)

    try {
      const parseResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Extract key discrete facts from this text about a person. Return a JSON object with:
1. "facts": an array of 15-25 short, specific facts - include ALL important details like:
   - Name, job, location
   - Family members and relationships
   - Pets
   - Mental health notes (ADHD, anxiety, etc.)
   - Key interests and hobbies
   - Career goals
   - Important life events
   - Communication preferences
   Example facts: ["Name is Jordan", "Works at DoorDash in Strategy & Ops", "Dad passed away in 2023", "Has ADHD and anxiety", "Wants to pivot to AI product/engineering"]

2. "aboutMe": A COMPREHENSIVE paragraph (150-300 words) summarizing:
   - Their personality and emotional patterns
   - What motivates them
   - Their communication style preferences
   - Current life situation and challenges
   - What kind of support they need
   DO NOT over-summarize. Preserve the richness and nuance.

Text to parse:
${response}

Return ONLY valid JSON with no additional text.`,
            },
          ],
        }),
      })

      if (!parseResponse.ok) {
        throw new Error(`Parse error: ${parseResponse.status}`)
      }

      const parseData = await parseResponse.json()
      const parsed = JSON.parse(parseData.message)

      setParsedFacts(parsed.facts || [])
      setParsedAboutMe(parsed.aboutMe || '')

      console.log(`[${new Date().toISOString()}] ✅ Parsed ${parsed.facts?.length || 0} facts`)
      setIsParsingContext(false)
    } catch (error) {
      console.error('Failed to parse ChatGPT context:', error)
      setIsParsingContext(false)
      throw error
    }
  }

  // Complete onboarding
  const completeOnboarding = async (
    memories: Memory[],
    onMemoriesUpdate: (newMemories: Memory[]) => void
  ) => {
    console.log(`[${new Date().toISOString()}] ✨ Completing onboarding...`)

    // Save parsed facts as memories
    if (parsedFacts.length > 0) {
      const newMemories: Memory[] = parsedFacts.map((fact) => ({
        id: crypto.randomUUID(),
        fact: fact,
        timestamp: new Date(),
        source: 'import' as const,
      }))

      onMemoriesUpdate([...memories, ...newMemories])
      console.log(`[${new Date().toISOString()}] 💾 Saved ${newMemories.length} imported facts as memories`)
    }

    // Save about me
    if (parsedAboutMe) {
      setUserAboutMe(parsedAboutMe)
      console.log(`[${new Date().toISOString()}] 💾 Saved About Me`)
    }

    // Save original ChatGPT import to Supabase for reference
    if (chatGPTResponse) {
      try {
        const { error } = await supabase.from('chatgpt_imports').insert({
          user_id: DEFAULT_USER_ID,
          original_text: chatGPTResponse,
          parsed_about_me: parsedAboutMe,
        })

        if (error) {
          console.error('Failed to save ChatGPT import to Supabase:', error)
        } else {
          console.log(`[${new Date().toISOString()}] 💾 Saved ChatGPT import to Supabase`)
        }
      } catch (error) {
        console.error('Failed to save ChatGPT import:', error)
      }
    }

    // Mark onboarding as complete
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
    setShowOnboardingModal(false)
    setOnboardingStep(1)

    console.log(`[${new Date().toISOString()}] 🎉 Onboarding complete!`)
  }

  // Skip onboarding
  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true')
    setShowOnboardingModal(false)
    setOnboardingStep(1)
  }

  const value: SettingsContextValue = {
    showSettingsModal,
    showClearModal,
    showOnboardingModal,
    userAboutMe,
    userInstructions,
    onboardingStep,
    selectedOnboardingOption,
    chatGPTResponse,
    parsedFacts,
    parsedAboutMe,
    isParsingContext,
    setShowSettingsModal,
    setShowClearModal,
    setShowOnboardingModal,
    setUserAboutMe,
    setUserInstructions,
    setOnboardingStep,
    setSelectedOnboardingOption,
    setChatGPTResponse,
    setParsedFacts,
    setParsedAboutMe,
    setIsParsingContext,
    parseContextFromChatGPT,
    completeOnboarding,
    skipOnboarding,
    saveUserContextToStorage,
    loadUserContextFromStorage,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}
