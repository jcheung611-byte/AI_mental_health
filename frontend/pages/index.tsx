import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import VoiceButton from '@/components/VoiceButton';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, DEFAULT_USER_ID, uploadAudioToStorage } from '@/utils/supabase';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  audioUrl?: string;
  generatedVoice?: string;
  generatedModel?: string;
};

type Memory = {
  id: string;
  fact: string;
  timestamp: Date;
  source?: 'import' | 'conversation'; // Track where memory came from
};

const STORAGE_KEY = 'ai-voice-conversations';
const MEMORY_STORAGE_KEY = 'ai-voice-memories';
const MEMORY_ENABLED_KEY = 'ai-voice-memory-enabled';
const ABOUT_ME_KEY = 'ai-voice-about-me';
const INSTRUCTIONS_KEY = 'ai-voice-instructions';
const ONBOARDING_COMPLETE_KEY = 'ai-voice-onboarding-complete';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>('Ready - Use mic or type to compose');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  
  // Audio storage for future Supabase upload
  const fullAudioBlobRef = useRef<Blob | null>(null);
  
  // Debug: test audio playback
  const [debugAudioUrl, setDebugAudioUrl] = useState<string | null>(null);
  
  // Playback state per message
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [playbackStates, setPlaybackStates] = useState<Record<string, 'stopped' | 'playing' | 'paused' | 'loading'>>({});
  const [globalPlaybackSpeed, setGlobalPlaybackSpeed] = useState<number>(1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  
  // Memory system
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [memoryToast, setMemoryToast] = useState<string | null>(null);
  const [copyConfirm, setCopyConfirm] = useState(false);
  const [memoryFilter, setMemoryFilter] = useState<'all' | 'import' | 'conversation'>('all');
  
  // About Me / User Context
  const [userAboutMe, setUserAboutMe] = useState<string>('');
  const [userInstructions, setUserInstructions] = useState<string>('');
  
  // Onboarding
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [selectedOnboardingOption, setSelectedOnboardingOption] = useState<'chatgpt' | 'fresh' | null>(null);
  
  // Text input auto-resize
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [chatGPTResponse, setChatGPTResponse] = useState<string>('');
  const [parsedFacts, setParsedFacts] = useState<string[]>([]);
  const [parsedAboutMe, setParsedAboutMe] = useState<string>('');
  const [isParsingContext, setIsParsingContext] = useState(false);
  
  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState<string>('nova');
  const [selectedModel, setSelectedModel] = useState<string>('tts-1');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [preGeneratingPreviews, setPreGeneratingPreviews] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice preview data - multiple personalized messages for each voice
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
  };
  
  // Track which preview message to use next for each voice
  const previewIndexRef = useRef<Record<string, number>>({});

  // Cache for generated previews (so we only generate once per session)
  const previewCacheRef = useRef<Record<string, string>>({});

  // Pre-generate all voice previews when settings modal opens
  const preGenerateVoicePreviews = async () => {
    if (preGeneratingPreviews) return; // Already generating
    
    setPreGeneratingPreviews(true);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🎵 Pre-generating all voice previews...`);
    
    const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    
    // Generate all variations in parallel for speed!
    const promises = voices.flatMap((voiceId) => {
      const messages = voicePreviewMessages[voiceId];
      
      return messages.map(async (message, index) => {
        const cacheKey = `${voiceId}-${index}`;
        
        // Skip if already cached
        if (previewCacheRef.current[cacheKey]) {
          return;
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
          });

          if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            previewCacheRef.current[cacheKey] = audioUrl;
            console.log(`[${new Date().toISOString()}] ✅ ${voiceId}[${index}] cached`);
          }
        } catch (error) {
          console.error(`Failed to pre-generate ${voiceId}[${index}]:`, error);
        }
      });
    });
    
    await Promise.all(promises);
    console.log(`[${new Date().toISOString()}] 🎉 All ${promises.length} preview variations ready!`);
    setPreGeneratingPreviews(false);
  };

  // Pre-generate previews when settings modal opens
  useEffect(() => {
    if (showSettingsModal) {
      preGenerateVoicePreviews();
    }
  }, [showSettingsModal]);

  const previewVoice = async (voiceId: string) => {
    const timestamp = new Date().toISOString();
    
    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    
    // Get the next message index for this voice (rotate through variations)
    const messages = voicePreviewMessages[voiceId];
    const currentIndex = previewIndexRef.current[voiceId] || 0;
    const nextIndex = (currentIndex + 1) % messages.length;
    previewIndexRef.current[voiceId] = nextIndex;
    
    const cacheKey = `${voiceId}-${currentIndex}`;
    
    // If already cached, play instantly
    const audioUrl = previewCacheRef.current[cacheKey];
    if (audioUrl) {
      console.log(`[${timestamp}] ⚡ Playing cached preview for ${voiceId} (variation ${currentIndex})`);
      setPreviewingVoice(voiceId);
      
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      
      audio.onended = () => {
        setPreviewingVoice(null);
      };

      audio.onerror = () => {
        setPreviewingVoice(null);
      };

      audio.play();
      return;
    }
    
    // Not cached yet, generate it (fallback - shouldn't happen if pre-gen worked)
    console.log(`[${timestamp}] 🔄 Generating preview for ${voiceId} (variation ${currentIndex})...`);
    setPreviewingVoice(voiceId);
    
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: messages[currentIndex],
          voice: voiceId,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const audioBlob = await response.blob();
      const newAudioUrl = URL.createObjectURL(audioBlob);
      
      // Cache it
      previewCacheRef.current[cacheKey] = newAudioUrl;
      
      const audio = new Audio(newAudioUrl);
      previewAudioRef.current = audio;
      
      audio.onended = () => {
        setPreviewingVoice(null);
      };

      audio.onerror = () => {
        setPreviewingVoice(null);
      };

      await audio.play();
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Preview error:`, error);
      setError('Failed to preview voice');
      setPreviewingVoice(null);
    }
  };

  // Load conversations and memories from Supabase (or localStorage as fallback) on mount
  useEffect(() => {
    const loadConversations = async () => {
      try {
        // Try loading from Supabase first
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('user_id', DEFAULT_USER_ID)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.warn('Supabase load failed, falling back to localStorage:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          const messagesWithDates = data.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            text: msg.text,
            timestamp: new Date(msg.created_at),
            audioUrl: msg.audio_url,
            generatedVoice: msg.generated_voice,
            generatedModel: msg.generated_model,
          }));
          setMessages(messagesWithDates);
          console.log(`[${new Date().toISOString()}] ☁️ Loaded ${messagesWithDates.length} messages from Supabase`);
          return;
        }
      } catch (error) {
        console.log('Loading from localStorage instead...');
      }
      
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const messagesWithDates = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
          console.log(`[${new Date().toISOString()}] 💾 Loaded ${messagesWithDates.length} messages from localStorage`);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    const loadMemories = async () => {
      try {
        // Try loading from Supabase first
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .eq('user_id', DEFAULT_USER_ID)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.warn('Supabase memories load failed, falling back to localStorage:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          const memoriesWithDates = data.map((mem: any) => ({
            id: mem.id,
            fact: mem.fact,
            timestamp: new Date(mem.created_at),
            source: mem.source as 'import' | 'conversation' | undefined, // Preserve source field
          }));
          setMemories(memoriesWithDates);
          console.log(`[${new Date().toISOString()}] ☁️ Loaded ${memoriesWithDates.length} memories from Supabase`);
          return;
        }
      } catch (error) {
        console.log('Loading memories from localStorage instead...');
      }
      
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const memoriesWithDates = parsed.map((mem: any) => ({
            ...mem,
            timestamp: new Date(mem.timestamp)
          }));
          setMemories(memoriesWithDates);
          console.log(`[${new Date().toISOString()}] 💾 Loaded ${memoriesWithDates.length} memories from localStorage`);
        }
      } catch (error) {
        console.error('Failed to load memories:', error);
      }
    };

    const loadMemorySettings = () => {
      try {
        const stored = localStorage.getItem(MEMORY_ENABLED_KEY);
        if (stored !== null) {
          setMemoryEnabled(JSON.parse(stored));
          console.log(`[${new Date().toISOString()}] ⚙️ Memory auto-save: ${stored}`);
        }
      } catch (error) {
        console.error('Failed to load memory settings:', error);
      }
    };

    const loadVoiceSettings = () => {
      try {
        const validVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        const validModels = ['tts-1', 'tts-1-hd'];
        
        const storedVoice = localStorage.getItem('ai-voice-preference');
        const storedModel = localStorage.getItem('ai-voice-model');
        
        if (storedVoice && validVoices.includes(storedVoice)) {
          setSelectedVoice(storedVoice);
          console.log(`[${new Date().toISOString()}] 🎤 Loaded voice: ${storedVoice}`);
        } else if (storedVoice) {
          console.warn(`[${new Date().toISOString()}] ⚠️ Invalid voice "${storedVoice}" - resetting to nova`);
          setSelectedVoice('nova');
          localStorage.setItem('ai-voice-preference', 'nova');
        }
        
        if (storedModel && validModels.includes(storedModel)) {
          setSelectedModel(storedModel);
          console.log(`[${new Date().toISOString()}] 🎚️ Loaded model: ${storedModel}`);
        }
      } catch (error) {
        console.error('Failed to load voice settings:', error);
      }
    };

    const loadAboutMe = () => {
      try {
        const storedAboutMe = localStorage.getItem(ABOUT_ME_KEY);
        if (storedAboutMe) {
          setUserAboutMe(storedAboutMe);
          console.log(`[${new Date().toISOString()}] 📝 Loaded About Me: ${storedAboutMe.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error('Failed to load About Me:', error);
      }
    };

    const loadInstructions = () => {
      try {
        const storedInstructions = localStorage.getItem(INSTRUCTIONS_KEY);
        if (storedInstructions) {
          setUserInstructions(storedInstructions);
          console.log(`[${new Date().toISOString()}] 📋 Loaded Instructions: ${storedInstructions.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error('Failed to load Instructions:', error);
      }
    };

    const checkOnboarding = async () => {
      try {
        // Check Supabase first (persists across deployments)
        const { data, error } = await supabase
          .from('user_settings')
          .select('onboarding_complete')
          .eq('user_id', DEFAULT_USER_ID)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
          console.warn('Failed to check onboarding from Supabase:', error);
          // Fall back to localStorage
          const hasCompleted = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
          if (!hasCompleted) {
            setTimeout(() => setShowOnboardingModal(true), 1000);
          }
          return;
        }
        
        const hasCompleted = data?.onboarding_complete || localStorage.getItem(ONBOARDING_COMPLETE_KEY);
        
        if (!hasCompleted) {
          // Show onboarding for new users after a brief delay
          setTimeout(() => {
            setShowOnboardingModal(true);
          }, 1000);
        } else {
          // Sync to localStorage if not already there
          if (!localStorage.getItem(ONBOARDING_COMPLETE_KEY)) {
            localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // Fallback: check localStorage
        const hasCompleted = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
        if (!hasCompleted) {
          setTimeout(() => setShowOnboardingModal(true), 1000);
        }
      }
    };
    
    loadConversations();
    loadMemories();
    loadMemorySettings();
    loadVoiceSettings();
    loadAboutMe();
    loadInstructions();
    checkOnboarding();
  }, []);

  // Auto-resize textarea as text changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set height to scrollHeight (content height)
    // Max height is 50vh (half viewport), then it scrolls
    const maxHeight = window.innerHeight * 0.5;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [textInput]);

  // Manual save function to save to both Supabase and localStorage
  const saveMessagesToStorage = async (messagesToSave: Message[]) => {
    try {
      // Save to localStorage (instant, always works)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
      
      // Save to Supabase (persistent across devices/deployments)
      const messagesForSupabase = messagesToSave.map(msg => ({
        id: msg.id,
        user_id: DEFAULT_USER_ID,
        role: msg.role,
        text: msg.text,
        audio_url: msg.audioUrl,
        generated_voice: msg.generatedVoice,
        generated_model: msg.generatedModel,
        created_at: msg.timestamp.toISOString(),
      }));
      
      // Upsert to Supabase (insert or update if exists)
      const { error } = await supabase
        .from('messages')
        .upsert(messagesForSupabase, { onConflict: 'id' });
      
      if (error) {
        console.warn('Failed to save to Supabase (localStorage still saved):', error);
      } else {
        console.log(`[${new Date().toISOString()}] ☁️ Saved ${messagesToSave.length} messages to Supabase`);
      }
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  };

  // Save memories to both Supabase and localStorage whenever they change
  useEffect(() => {
    const saveMemories = async () => {
      try {
        // Save to localStorage (instant, always works)
        localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
        
        if (memories.length > 0) {
          // Save to Supabase (persistent across devices/deployments)
          const memoriesForSupabase = memories.map(mem => ({
            id: mem.id,
            user_id: DEFAULT_USER_ID,
            fact: mem.fact,
            source: mem.source, // Preserve source (import vs conversation)
            created_at: mem.timestamp.toISOString(),
            last_used_at: mem.timestamp.toISOString(),
          }));
          
          // Upsert to Supabase (insert or update if exists)
          const { error } = await supabase
            .from('memories')
            .upsert(memoriesForSupabase, { onConflict: 'id' });
          
          if (error) {
            console.warn('Failed to save memories to Supabase (localStorage still saved):', error);
          } else {
            console.log(`[${new Date().toISOString()}] ☁️ Saved ${memories.length} memories to Supabase`);
          }
        }
      } catch (error) {
        console.error('Failed to save memories:', error);
      }
    };
    
    saveMemories();
  }, [memories]);

  // Save memory settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_ENABLED_KEY, JSON.stringify(memoryEnabled));
    } catch (error) {
      console.error('Failed to save memory settings:', error);
    }
  }, [memoryEnabled]);

  // Save voice settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('ai-voice-preference', selectedVoice);
    } catch (error) {
      console.error('Failed to save voice preference:', error);
    }
  }, [selectedVoice]);

  useEffect(() => {
    try {
      localStorage.setItem('ai-voice-model', selectedModel);
    } catch (error) {
      console.error('Failed to save model preference:', error);
    }
  }, [selectedModel]);

  // Save About Me whenever it changes
  useEffect(() => {
    try {
      if (userAboutMe) {
        localStorage.setItem(ABOUT_ME_KEY, userAboutMe);
      }
    } catch (error) {
      console.error('Failed to save About Me:', error);
    }
  }, [userAboutMe]);

  // Save Instructions whenever they change
  useEffect(() => {
    try {
      if (userInstructions) {
        localStorage.setItem(INSTRUCTIONS_KEY, userInstructions);
      }
    } catch (error) {
      console.error('Failed to save Instructions:', error);
    }
  }, [userInstructions]);

  // Auto-scroll to bottom when new messages arrive (only if near bottom)
  useEffect(() => {
    const scrollContainer = messagesEndRef.current?.parentElement;
    if (!scrollContainer) return;
    
    // Only auto-scroll if user is near the bottom (within 100px)
    const isNearBottom = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight < 100;
    
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (speedMenuOpen && !(e.target as Element).closest('.speed-selector')) {
        setSpeedMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [speedMenuOpen]);

  const playMessage = async (messageId: string, audioUrl?: string) => {
    const timestamp = new Date().toISOString();
    const currentState = playbackStates[messageId] || 'stopped';
    const message = messages.find(m => m.id === messageId);

    if (!message) {
      console.error(`[${timestamp}] ❌ Message ${messageId} not found`);
      return;
    }

    // If paused, resume from current position
    if (currentState === 'paused' && audioRefs.current[messageId]) {
      console.log(`[${timestamp}] ▶️ Resuming message ${messageId}`);
      setPlaybackStates(prev => ({ ...prev, [messageId]: 'playing' }));
      audioRefs.current[messageId].play().catch(err => {
        console.error(`[${timestamp}] ❌ Resume failed:`, err);
        setError('Could not resume audio');
        setPlaybackStates(prev => ({ ...prev, [messageId]: 'stopped' }));
      });
      return;
    }

    // Check if audio needs regeneration (voice/model mismatch)
    const needsRegeneration = message.role === 'assistant' && (
      !message.audioUrl ||
      message.generatedVoice !== selectedVoice ||
      message.generatedModel !== selectedModel
    );

    if (needsRegeneration) {
      console.log(`[${timestamp}] 🔄 Audio needs regeneration: voice=${message.generatedVoice}→${selectedVoice}, model=${message.generatedModel}→${selectedModel}`);
      
      // Show loading state
      setPlaybackStates(prev => ({ ...prev, [messageId]: 'loading' }));
      
      try {
        // Regenerate audio with current settings
        const ttsResponse = await fetch('/api/speak', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: message.text, voice: selectedVoice, model: selectedModel }),
        });

        if (!ttsResponse.ok) {
          throw new Error('Failed to generate audio');
        }

        const audioBlob = await ttsResponse.blob();
        console.log(`[${new Date().toISOString()}] ✅ Audio generated:`, audioBlob.size, 'bytes');
        
        // Revoke old URL to prevent memory leaks
        if (message.audioUrl) {
          URL.revokeObjectURL(message.audioUrl);
        }
        
        const newAudioUrl = URL.createObjectURL(audioBlob);
        
        // Update message with new audio URL and metadata
        setMessages(prev => {
          const updated = prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, audioUrl: newAudioUrl, generatedVoice: selectedVoice, generatedModel: selectedModel }
              : msg
          );
          saveMessagesToStorage(updated);
          return updated;
        });
        
        // Now play the newly generated audio
        audioUrl = newAudioUrl;
      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] ❌ Failed to generate audio:`, error);
        setError('Failed to generate audio');
        setPlaybackStates(prev => ({ ...prev, [messageId]: 'stopped' }));
        return;
      }
    }

    if (!audioUrl) {
      console.error(`[${timestamp}] ❌ No audio URL available for ${messageId}`);
      return;
    }

    // Stop any other playing audio
    Object.keys(audioRefs.current).forEach(id => {
      if (id !== messageId && audioRefs.current[id]) {
        audioRefs.current[id].pause();
        setPlaybackStates(prev => ({ ...prev, [id]: 'stopped' }));
      }
    });

    console.log(`[${timestamp}] ▶️ Playing message ${messageId} from beginning`);
    
    // Clean up previous audio for this message if exists
    if (audioRefs.current[messageId]) {
      audioRefs.current[messageId].pause();
      delete audioRefs.current[messageId];
    }
    
    const audio = new Audio(audioUrl);
    audioRefs.current[messageId] = audio;
    audio.playbackRate = globalPlaybackSpeed;
    
    setPlaybackStates(prev => ({ ...prev, [messageId]: 'playing' }));
    setPlayingMessageId(messageId);
    
    audio.onended = () => {
      console.log(`[${new Date().toISOString()}] ✅ Message ${messageId} playback completed`);
      setPlaybackStates(prev => ({ ...prev, [messageId]: 'stopped' }));
      setPlayingMessageId(null);
      delete audioRefs.current[messageId];
    };

    audio.onerror = (e) => {
      console.error(`[${new Date().toISOString()}] ❌ Playback error for ${messageId}:`, e);
      setPlaybackStates(prev => ({ ...prev, [messageId]: 'stopped' }));
      setError('Failed to play audio response');
      delete audioRefs.current[messageId];
    };
    
    audio.play().catch(err => {
      console.error(`[${new Date().toISOString()}] ❌ Play failed:`, err);
      setError('Could not play audio');
      setPlaybackStates(prev => ({ ...prev, [messageId]: 'stopped' }));
    });
  };

  const pauseMessage = (messageId: string) => {
    const timestamp = new Date().toISOString();
    const audio = audioRefs.current[messageId];
    if (audio && playbackStates[messageId] === 'playing') {
      console.log(`[${timestamp}] ⏸️ Pausing message ${messageId} at ${audio.currentTime.toFixed(1)}s`);
      audio.pause();
      setPlaybackStates(prev => ({ ...prev, [messageId]: 'paused' }));
    }
  };

  const restartMessage = async (messageId: string, audioUrl?: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔄 Restarting message ${messageId} from beginning`);
    
    if (audioRefs.current[messageId]) {
      audioRefs.current[messageId].pause();
      delete audioRefs.current[messageId];
    }
    
    setPlaybackStates(prev => ({ ...prev, [messageId]: 'stopped' }));
    // Immediately play from beginning (will regenerate if needed)
    await playMessage(messageId, audioUrl);
  };

  const skipBackward = (messageId: string, seconds: number) => {
    const timestamp = new Date().toISOString();
    const audio = audioRefs.current[messageId];
    if (audio) {
      const newTime = Math.max(audio.currentTime - seconds, 0);
      console.log(`[${timestamp}] ⏪ Skipping backward ${seconds}s: ${audio.currentTime.toFixed(1)}s → ${newTime.toFixed(1)}s`);
      audio.currentTime = newTime;
    }
  };

  const skipForward = (messageId: string, seconds: number) => {
    const timestamp = new Date().toISOString();
    const audio = audioRefs.current[messageId];
    if (audio) {
      const newTime = Math.min(audio.currentTime + seconds, audio.duration);
      console.log(`[${timestamp}] ⏩ Skipping forward ${seconds}s: ${audio.currentTime.toFixed(1)}s → ${newTime.toFixed(1)}s`);
      audio.currentTime = newTime;
    }
  };

  const setSpeed = (speed: number) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🎚️ Changing global playback speed: ${globalPlaybackSpeed}x → ${speed}x`);
    
    setGlobalPlaybackSpeed(speed);
    setSpeedMenuOpen(false);
    
    // Update all currently playing audio
    Object.keys(audioRefs.current).forEach(id => {
      if (audioRefs.current[id]) {
        audioRefs.current[id].playbackRate = speed;
      }
    });
  };

  const stopAllAudio = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔇 Stopping all audio playback`);
    Object.keys(audioRefs.current).forEach(id => {
      if (audioRefs.current[id]) {
        audioRefs.current[id].pause();
        audioRefs.current[id].currentTime = 0;
        delete audioRefs.current[id];
      }
    });
    setPlaybackStates({});
    setPlayingMessageId(null);
  };

  const clearConversation = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🗑️ Clearing conversation history`);
    stopAllAudio();
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    
    // Also clear from Supabase
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('user_id', DEFAULT_USER_ID);
      
      if (error) {
        console.warn('Failed to clear messages from Supabase:', error);
      } else {
        console.log(`[${timestamp}] ☁️ Cleared messages from Supabase`);
      }
    } catch (error) {
      console.error('Error clearing Supabase messages:', error);
    }
    
    setStatus('Conversation cleared - Ready to chat');
    setShowClearModal(false);
  };

  const clearMemories = async () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧠 Clearing all memories`);
    setMemories([]);
    localStorage.removeItem(MEMORY_STORAGE_KEY);
    
    // Also clear from Supabase
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('user_id', DEFAULT_USER_ID);
      
      if (error) {
        console.warn('Failed to clear memories from Supabase:', error);
      } else {
        console.log(`[${timestamp}] ☁️ Cleared memories from Supabase`);
      }
    } catch (error) {
      console.error('Error clearing Supabase memories:', error);
    }
    
    setMemoryToast('All memories cleared');
    setTimeout(() => setMemoryToast(null), 2000);
  };

  const exportConversation = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 📥 Exporting conversation data`);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      messages: messages.map(m => ({
        role: m.role,
        text: m.text,
        timestamp: m.timestamp,
      })),
      memories: memories.map(m => ({
        fact: m.fact,
        timestamp: m.timestamp,
      })),
      settings: {
        voice: selectedVoice,
        model: selectedModel,
        memoryEnabled: memoryEnabled,
      },
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-mental-health-conversation-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    setMemoryToast('Conversation exported!');
    setTimeout(() => setMemoryToast(null), 2000);
  };

  const deleteMemory = async (memoryId: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧠 Deleting memory: ${memoryId}`);
    setMemories(prev => prev.filter(m => m.id !== memoryId));
    
    // Also delete from Supabase
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);
      
      if (error) {
        console.warn('Failed to delete memory from Supabase:', error);
      } else {
        console.log(`[${timestamp}] ☁️ Deleted memory from Supabase`);
      }
    } catch (error) {
      console.error('Error deleting Supabase memory:', error);
    }
    
    setMemoryToast('Memory deleted');
    setTimeout(() => setMemoryToast(null), 2000);
  };

  const extractAndSaveMemories = async (userMessage: string) => {
    if (!memoryEnabled) {
      console.log(`[${new Date().toISOString()}] 🧠 Memory auto-save is disabled, skipping extraction`);
      return;
    }

    try {
      console.log(`[${new Date().toISOString()}] 🧠 Extracting memories from user message only...`);
      
      const response = await fetch('/api/extract-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`[${new Date().toISOString()}] ❌ Memory extraction failed:`, errorData);
        throw new Error('Memory extraction failed');
      }

      const { memories: extractedMemories } = await response.json();
      
      if (extractedMemories && extractedMemories.length > 0) {
        // Add new memories with IDs and timestamps
        const newMemories = extractedMemories.map((mem: any) => ({
          id: crypto.randomUUID(),
          fact: mem.fact,
          timestamp: new Date(),
          source: 'conversation' as const, // Mark as extracted from conversation
        }));

        // Check for duplicates before adding
        const existingFacts = memories.map(m => m.fact.toLowerCase());
        const uniqueNewMemories = newMemories.filter(
          (mem: Memory) => !existingFacts.includes(mem.fact.toLowerCase())
        );

        if (uniqueNewMemories.length > 0) {
          setMemories(prev => [...prev, ...uniqueNewMemories]);
          setMemoryToast(`Saved ${uniqueNewMemories.length} new ${uniqueNewMemories.length === 1 ? 'memory' : 'memories'}`);
          setTimeout(() => setMemoryToast(null), 2000);
          console.log(`[${new Date().toISOString()}] ✅ Saved ${uniqueNewMemories.length} new ${uniqueNewMemories.length === 1 ? 'memory' : 'memories'}`);
        }
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Memory extraction error:`, error);
    }
  };

  // ChatGPT context import prompt
  const CHATGPT_IMPORT_PROMPT = `Tell me everything you know about me as a person. Please include:
- My name (if you know it)
- My job/profession
- My relationships (family, friends, pets)
- My interests and hobbies
- Challenges or struggles I've mentioned
- My communication preferences
- Anything else important about me

Format your response as a clear list with categories.`;

  // Parse ChatGPT response into facts and about me
  const parseContextFromChatGPT = async (response: string) => {
    setIsParsingContext(true);
    console.log(`[${new Date().toISOString()}] 🔍 Parsing ChatGPT context...`);
    
    try {
      // Use AI to extract structured facts - but keep FULL context for About Me
      const parseResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Extract key discrete facts from this text about a person. Return a JSON object with:
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

Return ONLY valid JSON, no other text.`,
          conversationHistory: [],
          memories: [],
          systemOverride: 'You are a JSON extraction assistant. You MUST return ONLY valid JSON - no apologies, no explanations, no markdown. Just the raw JSON object.',
          maxTokens: 2000, // Need more tokens for 15-25 facts + 300 word about me
        }),
      });

      if (!parseResponse.ok) {
        throw new Error('Failed to parse context');
      }

      const data = await parseResponse.json();
      
      console.log(`[${new Date().toISOString()}] 📥 AI response received:`, data.text?.substring(0, 200) + '...');
      
      // Try to parse the AI response as JSON
      try {
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        let jsonStr = data.text;
        
        // Check if it looks like an error/apology instead of JSON
        if (jsonStr.toLowerCase().startsWith('i apologize') || 
            jsonStr.toLowerCase().startsWith('i\'m sorry') ||
            jsonStr.toLowerCase().startsWith('sorry')) {
          console.warn('AI returned an apology instead of JSON. Using fallback.');
          throw new Error('AI refused to parse - returned apology');
        }
        
        // Try to extract JSON from markdown code blocks
        const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1].trim();
        }
        
        // Try to extract just the JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        
        const parsed = JSON.parse(jsonStr);
        const facts = parsed.facts || [];
        const aboutMe = parsed.aboutMe || '';
        
        console.log(`[${new Date().toISOString()}] ✅ Successfully parsed ${facts.length} facts, About Me: ${aboutMe.length} chars`);
        setParsedFacts(facts);
        setParsedAboutMe(aboutMe);
        setOnboardingStep(3);
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        console.log('Raw AI response was:', data.text?.substring(0, 500));
        // Fallback: keep the FULL original response as "about me"
        setParsedFacts([]);
        setParsedAboutMe(response); // Keep FULL response, not truncated!
        setOnboardingStep(3);
      }
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Parse error:`, error);
      // On error, still let them proceed with the full original text
      setParsedFacts([]);
      setParsedAboutMe(response); // Keep FULL response
      setOnboardingStep(3);
    } finally {
      setIsParsingContext(false);
    }
  };

  // Complete onboarding and save everything
  const completeOnboarding = async () => {
    console.log(`[${new Date().toISOString()}] ✨ Completing onboarding...`);
    
    // Save parsed facts as memories
    if (parsedFacts.length > 0) {
      const newMemories = parsedFacts.map(fact => ({
        id: crypto.randomUUID(),
        fact: fact,
        timestamp: new Date(),
        source: 'import' as const, // Mark as imported from ChatGPT
      }));
      setMemories(prev => [...prev, ...newMemories]);
      console.log(`[${new Date().toISOString()}] 💾 Saved ${newMemories.length} imported facts as memories`);
    }
    
    // Save about me
    if (parsedAboutMe) {
      setUserAboutMe(parsedAboutMe);
      console.log(`[${new Date().toISOString()}] 💾 Saved About Me`);
    }
    
    // Save original ChatGPT import to Supabase for reference
    if (chatGPTResponse) {
      try {
        const { error } = await supabase
          .from('chatgpt_imports')
          .insert({
            user_id: DEFAULT_USER_ID,
            original_text: chatGPTResponse,
            parsed_about_me: parsedAboutMe,
          });
        
        if (error) {
          console.warn('Failed to save ChatGPT import to Supabase:', error);
        } else {
          console.log(`[${new Date().toISOString()}] ☁️ Saved original ChatGPT import to Supabase`);
        }
      } catch (error) {
        console.error('Error saving ChatGPT import:', error);
      }
    }
    
    // Mark onboarding complete in Supabase
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: DEFAULT_USER_ID,
          onboarding_complete: true,
          about_me: parsedAboutMe,
        }, { onConflict: 'user_id' });
      
      if (error) {
        console.warn('Failed to save onboarding completion to Supabase:', error);
      } else {
        console.log(`[${new Date().toISOString()}] ☁️ Marked onboarding complete in Supabase`);
      }
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    
    // Mark onboarding complete locally as fallback
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    
    // Close modal
    setShowOnboardingModal(false);
    setOnboardingStep(1);
    setChatGPTResponse('');
    setParsedFacts([]);
    setParsedAboutMe('');
    
    setMemoryToast('Welcome! Your context has been saved 🎉');
    setTimeout(() => setMemoryToast(null), 3000);
  };

  // Skip onboarding
  const skipOnboarding = () => {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
    setShowOnboardingModal(false);
    setOnboardingStep(1);
  };

  const handleRecordingStart = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🎤 RECORDING STARTED - checking for audio to interrupt`);
    
    // Stop any playing audio
    stopAllAudio();
    
    // Clear error
    setError('');
    fullAudioBlobRef.current = null;
  };

  const processTextMessage = async (text: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ⌨️ PROCESSING TEXT MESSAGE:`, text);

    setIsProcessing(true);
    setStatus('Getting AI response...');
    setError('');

    try {
      // Add user message to conversation
      const userMessageId = crypto.randomUUID();
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        text: text,
        timestamp: new Date(),
      };
      setMessages(prev => {
        const updated = [...prev, userMessage];
        saveMessagesToStorage(updated);
        return updated;
      });

      // Prepare conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text,
      }));

      console.log(`[${new Date().toISOString()}] 💬 Sending text to chat API with ${conversationHistory.length} previous messages`);

      // Get chat response
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: text,
          conversationHistory: conversationHistory,
          memories: memories,
          userAboutMe: userAboutMe,
          userInstructions: userInstructions,
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}));
        throw new Error(errorData.details || 'Chat failed');
      }

      const chatData = await chatResponse.json();
      console.log(`[${new Date().toISOString()}] ✅ Chat response received:`, chatData.text);
      
      const fullText = chatData.text;
      const assistantMessageId = crypto.randomUUID();
      
      // Add AI message with empty text initially (will stream in)
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        text: '',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Start TTS generation in parallel
      setStatus('AI responding...');
      const ttsPromise = fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: fullText, voice: selectedVoice, model: selectedModel }),
      });

      // Stream text in chunks (simulate ChatGPT typing)
      const words = fullText.split(' ');
      const wordsPerChunk = 3; // Show 3 words at a time
      const delayMs = 50; // 50ms between chunks
      
      for (let i = 0; i < words.length; i += wordsPerChunk) {
        const chunk = words.slice(0, i + wordsPerChunk).join(' ');
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, text: chunk }
            : msg
        ));
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
      // Ensure full text is shown
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, text: fullText }
          : msg
      ));

      // Wait for TTS to complete
      setStatus('Finalizing audio...');
      const ttsResponse = await ttsPromise;

      if (!ttsResponse.ok) {
        const errorData = await ttsResponse.json().catch(() => ({}));
        throw new Error(errorData.details || 'TTS failed');
      }

      const audioBlob = await ttsResponse.blob();
      console.log(`[${new Date().toISOString()}] ✅ TTS audio received:`, audioBlob.size, 'bytes');
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Update message with audio URL and voice metadata
      setMessages(prev => {
        const updated = prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, audioUrl: audioUrl, generatedVoice: selectedVoice, generatedModel: selectedModel }
            : msg
        );
        saveMessagesToStorage(updated);
        return updated;
      });
      
      setIsProcessing(false);
      setStatus('AI response ready');
      console.log(`[${new Date().toISOString()}] ✅ Text message processed successfully`);

      // Extract and save memories (async, don't await) - only from user message
      extractAndSaveMemories(text).catch(err => 
        console.error('Memory extraction failed:', err)
      );
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ Error processing text:`, error);
      setError(error.message || 'An unexpected error occurred');
      setStatus('Error - Ready to try again');
      setIsProcessing(false);
      
      // Clear queue on error
      setMessageQueue([]);
    }
  };

  // Process queue separately to avoid infinite loop
  useEffect(() => {
    if (!isProcessing && messageQueue.length > 0) {
      const nextMessage = messageQueue[0];
      setMessageQueue(prev => prev.slice(1));
      console.log(`[${new Date().toISOString()}] 📬 Processing queued message (${messageQueue.length - 1} remaining)`);
      processTextMessage(nextMessage);
    }
  }, [isProcessing, messageQueue]);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textInput.trim()) {
      return;
    }

    const userText = textInput.trim();
    setTextInput(''); // Clear input immediately
    
    if (isProcessing) {
      // Queue the message if currently processing
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 📬 Queueing message (${messageQueue.length + 1} in queue)`);
      setMessageQueue(prev => [...prev, userText]);
      setStatus(`AI responding... (${messageQueue.length + 1} queued)`);
    } else {
      // Process immediately
      await processTextMessage(userText);
    }
  };

  const handleAudioRecorded = async (blob: Blob) => {
    const timestamp = new Date().toISOString();
    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
    console.log(`[${timestamp}] 📥 AUDIO RECORDED - handleAudioRecorded called`, {
      blobSize: blob.size,
      blobSizeMB: sizeMB,
      blobType: blob.type,
    });
    
    // Store full audio blob for later upload to Supabase Storage
    fullAudioBlobRef.current = blob;
    
    // DEBUG: Create playback URL to verify full audio was recorded
    if (debugAudioUrl) {
      URL.revokeObjectURL(debugAudioUrl);
    }
    const testUrl = URL.createObjectURL(blob);
    setDebugAudioUrl(testUrl);
    console.log(`[${timestamp}] 🔊 DEBUG: Audio playback URL created - test in console: new Audio("${testUrl}").play()`);
    
    // Validate audio blob
    if (blob.size < 100) {
      setError('Audio recording too short. Please speak for at least 1 second.');
      setStatus('Ready - Click to speak');
      return;
    }
    
    // Whisper API limit is 25MB (~20+ minutes of audio)
    const MAX_SIZE_MB = 25;
    if (blob.size > MAX_SIZE_MB * 1024 * 1024) {
      const estimatedMinutes = Math.round(blob.size / 1024 / 1024); // ~1MB per minute
      setError(`Recording too large (${sizeMB}MB ≈ ${estimatedMinutes} min). OpenAI Whisper limit is 25MB. Please keep under ~20 minutes.`);
      setStatus('Ready - Click to speak');
      return;
    }

    console.log(`[${timestamp}] ✅ Audio validated (${sizeMB}MB), processing...`);
    
    setIsProcessing(true);
    setStatus('Processing your recording...');

    try {
      const VERCEL_LIMIT_MB = 4.5;
      let transcribedText: string;
      let audioUrl: string | null = null;
      
      // HYBRID APPROACH: Choose strategy based on file size
      if (blob.size <= VERCEL_LIMIT_MB * 1024 * 1024) {
        // Strategy 1: File small enough - do BOTH in parallel!
        console.log(`[${timestamp}] 📤 File ≤4.5MB - using PARALLEL upload + transcribe`);
        setStatus('Uploading & transcribing...');
        
        const [uploadResult, transcribeResult] = await Promise.all([
          // Background: Upload to Supabase Storage for Voice Journal
          (async () => {
            try {
              const result = await uploadAudioToStorage(blob, DEFAULT_USER_ID);
              if (result) {
                console.log(`[${timestamp}] ✅ Supabase upload complete: ${result.url}`);
                return result.url;
              }
              return null;
            } catch (err) {
              console.error(`[${timestamp}] ⚠️ Supabase upload failed (non-critical):`, err);
              return null; // Graceful degradation - transcription still works
            }
          })(),
          
          // Foreground: Direct transcription (fast!)
          (async () => {
            const formData = new FormData();
            formData.append('audio', blob, 'recording.webm');
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData,
            });
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `Transcription failed (${response.status})`);
            }
            const data = await response.json();
            console.log(`[${timestamp}] ✅ Direct transcription complete`);
            return data.text;
          })()
        ]);
        
        audioUrl = uploadResult;
        transcribedText = transcribeResult;
        
      } else {
        // Strategy 2: File too large for Vercel - use Supabase URL method
        console.log(`[${timestamp}] 📤 File >4.5MB - using Supabase URL method`);
        
        // Step 1: Upload to Supabase
        setStatus('Uploading large recording...');
        const uploadResult = await uploadAudioToStorage(blob, DEFAULT_USER_ID);
        if (!uploadResult) {
          throw new Error('Failed to upload audio to storage');
        }
        audioUrl = uploadResult.url;
        console.log(`[${timestamp}] ✅ Supabase upload complete: ${audioUrl}`);
        
        // Step 2: Transcribe from URL
        setStatus('Transcribing from storage...');
        const response = await fetch('/api/transcribe-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioUrl }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Transcription from URL failed (${response.status})`);
        }
        
        const data = await response.json();
        transcribedText = data.text;
        console.log(`[${timestamp}] ✅ URL transcription complete`);
      }
      
      // Validation
      if (!transcribedText || transcribedText.trim() === '') {
        throw new Error('No speech detected. Please try again.');
      }
      
      console.log(`[${timestamp}] ✅ Final transcription (${transcribedText.length} chars):`, transcribedText.substring(0, 100) + '...');
      
      // Append transcribed text to the text input box
      // Add a space if there's already text, otherwise just add the transcription
      setTextInput(prev => {
        if (prev.trim()) {
          return prev + ' ' + transcribedText;
        }
        return transcribedText;
      });
      
      // Reset processing state
      setIsProcessing(false);
      setStatus('Transcription complete - Edit or send message');
      console.log(`[${timestamp}] ✅ Transcription added to text input - ready to send`);
      
      // User can now:
      // 1. Record more audio (will append to text input)
      // 2. Edit the text manually
      // 3. Hit Enter or click Send to send the message
    } catch (error: any) {
      console.error('Error:', error);
      setError(error.message || 'An unexpected error occurred');
      setStatus('Error - Ready to try again');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Voice Assistant v0</title>
        <meta name="description" content="Warm AI roommate - voice interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <main className="h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col p-4 pb-0">
        {/* Compact Header */}
        <div className="flex items-center justify-center gap-3 py-3 flex-shrink-0">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Voice Companion
          </h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">v0</span>
        </div>
        
        {/* Main Content - Takes remaining height */}
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto min-h-0">
          {/* Conversation History - Expands to fill space */}
          <div className="bg-white rounded-xl shadow-md flex flex-col flex-1 min-h-0 mb-4">
            {/* Header with Status */}
            <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Conversation
            </h2>
                  
                  {/* Settings Button */}
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="px-2 py-1 text-lg rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all"
                    title="Settings"
                  >
                    ⚙️
                  </button>
                  
                  {/* Export & Clear Buttons */}
                  {messages.length > 0 && (
                    <>
                      <button
                        onClick={exportConversation}
                        className="px-3 py-1 text-xs rounded-lg bg-green-100 hover:bg-green-200 text-green-700 transition-all font-medium"
                        title="Export conversation & memories"
                      >
                        💾 Export
                      </button>
                      <button
                        onClick={() => setShowClearModal(true)}
                        className="px-3 py-1 text-xs rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-all font-medium"
                        title="Clear all conversations"
                      >
                        🗑️ Clear
                      </button>
                    </>
                  )}
                </div>
                
                {/* Universal Playback Controls */}
                <div className="flex items-center gap-2">
                  {playingMessageId && (
                    <>
                      {/* Stop Button */}
                      <button
                        onClick={stopAllAudio}
                        className="px-2 py-1 rounded-lg font-medium text-sm transition-all bg-red-500 hover:bg-red-600 text-white"
                        title="Stop playback"
                      >
                        ⏹️
                      </button>
                      
                      {/* Restart Button */}
                      <button
                        onClick={() => {
                          const message = messages.find(m => m.id === playingMessageId);
                          if (message) restartMessage(playingMessageId, message.audioUrl);
                        }}
                        className="px-2 py-1 rounded-lg font-medium text-sm transition-all bg-gray-500 hover:bg-gray-600 text-white"
                        title="Restart from beginning"
                      >
                        🔄
                      </button>
                      
                      {/* Skip Backward */}
                      <button
                        onClick={() => skipBackward(playingMessageId, 10)}
                        className="px-2 py-1 rounded-lg font-medium text-xs transition-all bg-blue-500 hover:bg-blue-600 text-white"
                        title="Skip backward 10 seconds"
                      >
                        ⏪ -10s
                      </button>
                      
                      {/* Skip Forward */}
                      <button
                        onClick={() => skipForward(playingMessageId, 10)}
                        className="px-2 py-1 rounded-lg font-medium text-xs transition-all bg-blue-600 hover:bg-blue-700 text-white"
                        title="Skip forward 10 seconds"
                      >
                        +10s ⏩
                      </button>
                    </>
                  )}
                  
                  {/* Speed Selector */}
                  <div className="relative speed-selector">
                    <button
                      onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
                      className="px-3 py-1 rounded-lg font-bold text-sm transition-all bg-gray-400 hover:bg-gray-500 text-white flex items-center gap-1"
                      title={`Playback speed: ${globalPlaybackSpeed}x`}
                    >
                      {globalPlaybackSpeed}x
                      <span className="text-xs">{speedMenuOpen ? '▲' : '▼'}</span>
                    </button>
                    
                    {speedMenuOpen && (
                      <div className="absolute right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                        {[1, 1.25, 1.5, 1.75, 2].map(speed => (
                          <button
                            key={speed}
                            onClick={() => setSpeed(speed)}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                              globalPlaybackSpeed === speed ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-gray-700'
                            }`}
                          >
                            {speed === 1 ? 'Normal' : `${speed}x`}
                            {globalPlaybackSpeed === speed && <span className="ml-2">✓</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Status Bar - Always Visible */}
              <div className={`px-4 pb-3 flex items-center justify-between transition-all ${
                isProcessing || playingMessageId || error ? 'opacity-100' : 'opacity-70'
              }`}>
                <div className="flex items-center gap-2">
                  {isProcessing && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <span className="animate-spin">⏳</span>
                      {status}
                    </span>
                  )}
                  {playingMessageId && !isProcessing && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                      <span className="animate-pulse">🔊</span>
                      Playing audio
                    </span>
                  )}
                  {!isProcessing && !playingMessageId && !error && (
                    <span className="text-sm text-gray-600">
                      {messages.length > 0 ? `${messages.length} messages` : 'Ready to chat'}
                    </span>
                  )}
            {error && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      ❌ {error}
                    </span>
                  )}
                </div>
                {messageQueue.length > 0 && (
                  <span className="text-xs text-orange-600 font-medium">
                    📬 {messageQueue.length} queued
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
            
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg mb-2">👋</p>
                <p className="text-sm">No messages yet. Click the mic to start!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={`p-4 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'bg-purple-50 border border-purple-200'
                      }`}
                    >
                    <p className={`text-sm font-medium mb-2 ${message.role === 'user' ? 'text-blue-800' : 'text-purple-800'}`}>
                      {message.role === 'user' ? '🎯 You' : '🤖 AI'}
                    </p>
                    
                    <div className="text-gray-700 mb-3 prose prose-sm max-w-none">
                      {message.role === 'assistant' && !message.text ? (
                        // Loading state for AI response
                        <div className="flex items-center gap-2 text-purple-600">
                          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm font-medium">Thinking...</span>
                        </div>
                      ) : message.role === 'assistant' ? (
                        <>
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="mb-2" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="ml-2" {...props} />,
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
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                      
                      {/* Play/Pause Button for Assistant Messages */}
                      {message.role === 'assistant' && message.text && (
                        <button
                          onClick={() => playbackStates[message.id] === 'playing' 
                            ? pauseMessage(message.id) 
                            : playMessage(message.id, message.audioUrl)
                          }
                          disabled={playbackStates[message.id] === 'loading'}
                          className={`
                            px-3 py-1 rounded-lg font-medium text-sm transition-all
                            ${playbackStates[message.id] === 'loading'
                              ? 'bg-gray-400 text-white cursor-wait' 
                              : playbackStates[message.id] === 'playing'
                              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                            }
                          `}
                          title={
                            playbackStates[message.id] === 'loading' 
                              ? 'Generating audio...' 
                              : playbackStates[message.id] === 'playing' 
                              ? 'Pause' 
                              : 'Play'
                          }
                        >
                          {playbackStates[message.id] === 'loading' 
                            ? '⏳' 
                            : playbackStates[message.id] === 'playing' 
                            ? '⏸️' 
                            : '▶️'
                          }
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            )}
            </div>
            
            {/* Input Bar - Text + Voice */}
            <div className="p-3 border-t border-gray-200 bg-white rounded-b-xl">
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                {/* Voice Button - Compact */}
                <VoiceButton 
                  onAudioRecorded={handleAudioRecorded}
                  onRecordingStart={handleRecordingStart}
                  disabled={isProcessing}
                  compact
                />
                
                {/* Text Input - Auto-expanding */}
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Submit on Enter (unless Shift+Enter for new line)
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleTextSubmit(e as any);
                    }
                  }}
                  placeholder={isProcessing ? "Transcribing..." : "Type message or use mic..."}
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
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>

        </div>
      </main>

      {/* Clear Conversation Modal */}
      <AnimatePresence>
        {showClearModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowClearModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="text-center">
              <div className="text-5xl mb-4">🗑️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Clear All Chats?
              </h3>
              <p className="text-gray-600 mb-6">
                This will permanently delete all your conversation history. This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={clearConversation}
                  className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
                >
                  Clear All
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowSettingsModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg mx-4 w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div>
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-2">
                <div className="flex items-center gap-2">
                  <div className="text-3xl">⚙️</div>
                  <h3 className="text-2xl font-bold text-gray-900">Settings</h3>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

                {/* About Me Section */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">📝 About Me</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    This context helps me understand you better. Edit anytime.
                  </p>
                  <textarea
                    value={userAboutMe}
                    onChange={(e) => setUserAboutMe(e.target.value)}
                    placeholder="Tell me about yourself - your personality, preferences, current challenges, goals..."
                    className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-y text-sm"
                  />
                  {!userAboutMe && (
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        setShowOnboardingModal(true);
                        setOnboardingStep(2);
                      }}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      🔗 Import from ChatGPT
                    </button>
                  )}
                </div>

                {/* Instructions Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">🎯 Response Instructions</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Tell me how you'd like me to respond - your preferred tone, style, and approach.
                  </p>
                  <textarea
                    value={userInstructions}
                    onChange={(e) => setUserInstructions(e.target.value)}
                    placeholder="e.g., 'Match my energy - if I'm casual, be casual. Keep responses concise unless I'm venting. Use direct feedback, no sugarcoating.'"
                    className="w-full h-32 p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-y text-sm"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    💡 Examples: "Be direct and concise" • "Match my vibe" • "Use formatting for clarity" • "Keep it brief unless I'm processing something heavy"
                  </p>
                </div>

                {/* Memory Settings Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">🧠 Memory</h4>
                  
                  {/* Memory Toggle */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">Auto-save memories</p>
                      <p className="text-sm text-gray-600">AI automatically remembers important facts about you</p>
                    </div>
                    <button
                      onClick={() => setMemoryEnabled(!memoryEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-all ${
                        memoryEnabled ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        memoryEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {/* Memory Count */}
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg mb-3">
                    <p className="text-sm text-gray-700">
                      <strong>{memories.length}</strong> {memories.length === 1 ? 'memory' : 'memories'} stored
                    </p>
                  </div>

                  {/* Filter Pills */}
                  {memories.length > 0 && (
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => setMemoryFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          memoryFilter === 'all'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        All {memories.length > 0 && `(${memories.length})`}
                      </button>
                      <button
                        onClick={() => setMemoryFilter('import')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          memoryFilter === 'import'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Imported {memories.filter(m => m.source === 'import').length > 0 && `(${memories.filter(m => m.source === 'import').length})`}
                      </button>
                      <button
                        onClick={() => setMemoryFilter('conversation')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          memoryFilter === 'conversation'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Learned {memories.filter(m => m.source === 'conversation').length > 0 && `(${memories.filter(m => m.source === 'conversation').length})`}
                      </button>
                      {memoryFilter !== 'all' && (
                        <button
                          onClick={() => setMemoryFilter('all')}
                          className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  )}

                  {/* Memory List */}
                  {memories.length > 0 && (() => {
                    const filteredMemories = memories.filter(memory => {
                      if (memoryFilter === 'all') return true;
                      if (memoryFilter === 'import') return memory.source === 'import';
                      if (memoryFilter === 'conversation') return memory.source === 'conversation';
                      return true;
                    });

                    return filteredMemories.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                        {filteredMemories.map(memory => (
                          <div key={memory.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm text-gray-800">{memory.fact}</p>
                                {memory.source === 'import' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 whitespace-nowrap">
                                    From Import
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(memory.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteMemory(memory.id)}
                              className="ml-2 text-gray-400 hover:text-red-600 text-xl font-bold transition-all"
                              title="Delete this memory"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">No {memoryFilter} memories yet</p>
                      </div>
                    );
                  })()}

                  {/* Clear Memories Button */}
                  {memories.length > 0 && (
                    <button
                      onClick={clearMemories}
                      className="w-full px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-medium transition-all"
                    >
                      Clear All Memories
                    </button>
                  )}
                </div>

                {/* Voice Settings Section */}
                <div className="border-b border-gray-200 pb-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">🎤 Voice Settings</h4>
                  
                  {/* Quality Selector */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Quality</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setSelectedModel('tts-1')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedModel === 'tts-1'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-800">Standard</p>
                        <p className="text-xs text-gray-600">Faster, lower latency</p>
                        {selectedModel === 'tts-1' && <span className="text-purple-600 text-lg">✓</span>}
                      </button>
                      <button
                        onClick={() => setSelectedModel('tts-1-hd')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedModel === 'tts-1-hd'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-800">HD</p>
                        <p className="text-xs text-gray-600">Higher quality audio</p>
                        {selectedModel === 'tts-1-hd' && <span className="text-purple-600 text-lg">✓</span>}
                      </button>
                    </div>
                  </div>

                  {/* Voice Selector */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Voice ({selectedVoice})</p>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {[
                        { id: 'alloy', name: 'Alloy', desc: 'Balanced, neutral' },
                        { id: 'echo', name: 'Echo', desc: 'Deep, resonant male' },
                        { id: 'fable', name: 'Fable', desc: 'Warm, expressive British' },
                        { id: 'onyx', name: 'Onyx', desc: 'Strong, authoritative male' },
                        { id: 'nova', name: 'Nova', desc: 'Bright, energetic female' },
                        { id: 'shimmer', name: 'Shimmer', desc: 'Soft, gentle female' },
                      ].map(voice => (
                        <button
                          key={voice.id}
                          onClick={() => {
                            setSelectedVoice(voice.id);
                            previewVoice(voice.id);
                          }}
                          disabled={previewingVoice === voice.id}
                          className={`w-full p-3 rounded-lg border-2 transition-all ${
                            selectedVoice === voice.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          } ${previewingVoice === voice.id ? 'cursor-wait' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-800">{voice.name}</p>
                              <p className="text-xs text-gray-600">{voice.desc}</p>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Playing indicator */}
                              {previewingVoice === voice.id && (
                                <span className="text-blue-600 text-xl animate-pulse">🔊</span>
                              )}
                              
                              {/* Selected Checkmark */}
                              {selectedVoice === voice.id && (
                                <span className="text-purple-600 text-xl">✓</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Close Button */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="w-full px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-medium transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Memory Toast Notification */}
      <AnimatePresence>
        {memoryToast && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100]"
          >
            <div className="bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
              <span>💾</span>
              <span className="font-medium">{memoryToast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboardingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative"
            >
              {/* X button - top right */}
              <button
                onClick={() => {
                  setShowOnboardingModal(false);
                  localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
                }}
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Step 1: Welcome */}
              {onboardingStep === 1 && (
                <div className="p-8 pb-6">
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">🌟</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
                    <p className="text-gray-600">Let's personalize your experience</p>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <button
                      onClick={() => setSelectedOnboardingOption('chatgpt')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedOnboardingOption === 'chatgpt'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔗</span>
                        <div>
                          <p className="font-semibold text-gray-900">Import from ChatGPT</p>
                          <p className="text-sm text-gray-600">Bring context ChatGPT knows about you</p>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setSelectedOnboardingOption('fresh')}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedOnboardingOption === 'fresh'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✨</span>
                        <div>
                          <p className="font-semibold text-gray-900">Start fresh</p>
                          <p className="text-sm text-gray-600">I'll learn about you as we talk</p>
                        </div>
                      </div>
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-center mb-6">
                    You can always add context later in Settings
                  </p>
                  
                  {/* Bottom buttons: Skip & Confirm */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowOnboardingModal(false);
                        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
                      }}
                      className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Skip
                    </button>
                    <button
                      onClick={() => {
                        if (selectedOnboardingOption === 'chatgpt') {
                          setOnboardingStep(2);
                        } else if (selectedOnboardingOption === 'fresh') {
                          skipOnboarding();
                        }
                      }}
                      disabled={!selectedOnboardingOption}
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedOnboardingOption
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Copy Prompt & Paste Response */}
              {onboardingStep === 2 && (
                <div className="p-8">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="text-gray-500 hover:text-gray-700 mb-4"
                  >
                    ← Back
                  </button>
                  
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">📋</div>
                    <h2 className="text-xl font-bold text-gray-900">Import from ChatGPT</h2>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Step 2a: Copy prompt */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        1. Copy this prompt and send it to ChatGPT:
                      </p>
                      <div className="bg-gray-100 rounded-lg p-4 text-sm text-gray-700 relative">
                        <pre className="whitespace-pre-wrap font-mono text-xs">{CHATGPT_IMPORT_PROMPT}</pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(CHATGPT_IMPORT_PROMPT);
                            setCopyConfirm(true);
                            setTimeout(() => setCopyConfirm(false), 2000);
                          }}
                          className={`absolute top-2 right-2 px-3 py-1 text-white text-xs rounded-lg transition-all ${
                            copyConfirm 
                              ? 'bg-green-500' 
                              : 'bg-purple-500 hover:bg-purple-600'
                          }`}
                        >
                          {copyConfirm ? '✓ Copied!' : '📋 Copy'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Step 2b: Paste response */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        2. Paste ChatGPT's response here:
                      </p>
                      <textarea
                        value={chatGPTResponse}
                        onChange={(e) => setChatGPTResponse(e.target.value)}
                        placeholder="Paste ChatGPT's response about you here..."
                        className="w-full h-40 p-4 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none text-sm"
                      />
                    </div>
                    
                    <button
                      onClick={() => parseContextFromChatGPT(chatGPTResponse)}
                      disabled={!chatGPTResponse.trim() || isParsingContext}
                      className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
                        chatGPTResponse.trim() && !isParsingContext
                          ? 'bg-purple-500 hover:bg-purple-600'
                          : 'bg-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {isParsingContext ? '✨ Analyzing...' : 'Import Context →'}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Confirm */}
              {onboardingStep === 3 && (
                <div className="p-8 max-h-[75vh] overflow-y-auto">
                  <button
                    onClick={() => setOnboardingStep(2)}
                    className="text-gray-500 hover:text-gray-700 mb-4"
                  >
                    ← Back
                  </button>
                  
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">✨</div>
                    <h2 className="text-xl font-bold text-gray-900">Here's what I learned</h2>
                    <p className="text-sm text-gray-600">Review and edit before saving - scroll to see everything!</p>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Facts Section */}
                    {parsedFacts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          📋 Facts I'll remember ({parsedFacts.length} items):
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
                          {parsedFacts.map((fact, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                              <span className="text-purple-600">•</span>
                              <input
                                type="text"
                                value={fact}
                                onChange={(e) => {
                                  const newFacts = [...parsedFacts];
                                  newFacts[index] = e.target.value;
                                  setParsedFacts(newFacts);
                                }}
                                className="flex-1 bg-transparent text-sm text-gray-800 focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  setParsedFacts(parsedFacts.filter((_, i) => i !== index));
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* About Me Section */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        💭 About you (for context):
                      </p>
                      <textarea
                        value={parsedAboutMe}
                        onChange={(e) => setParsedAboutMe(e.target.value)}
                        placeholder="A comprehensive description of yourself - personality, preferences, challenges, goals, communication style..."
                        className="w-full h-48 p-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-y text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {parsedAboutMe.length} characters • More context = better personalization
                      </p>
                    </div>
                    
                    <button
                      onClick={completeOnboarding}
                      className="w-full py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition-all"
                    >
                      ✅ Looks good! Start chatting
                    </button>
                    
                    <button
                      onClick={skipOnboarding}
                      className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
