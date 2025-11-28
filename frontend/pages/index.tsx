import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import VoiceButton from '@/components/VoiceButton';

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
};

const STORAGE_KEY = 'ai-voice-conversations';
const MEMORY_STORAGE_KEY = 'ai-voice-memories';
const MEMORY_ENABLED_KEY = 'ai-voice-memory-enabled';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<string>('Ready - Click to speak');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [textInput, setTextInput] = useState<string>('');
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  
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
  
  // Voice settings
  const [selectedVoice, setSelectedVoice] = useState<string>('nova');
  const [selectedModel, setSelectedModel] = useState<string>('tts-1');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice preview data - personalized messages for each voice
  const voicePreviewMessages: Record<string, string> = {
    alloy: "Hey there! I'm here whenever you need me.",
    echo: "I'm listening. Take your time, no rush.",
    fable: "Let's talk about what's on your mind today.",
    onyx: "I'm here to support you through anything.",
    nova: "Hi! I'm so glad you're here. How are you feeling?",
    shimmer: "You're safe here. I'm here to listen.",
  };

  const previewVoice = async (voiceId: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🎵 Previewing voice: ${voiceId}`);
    
    // Stop any currently playing preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    
    setPreviewingVoice(voiceId);
    
    try {
      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: voicePreviewMessages[voiceId],
          voice: voiceId,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      
      audio.onended = () => {
        console.log(`[${new Date().toISOString()}] ✅ Preview completed`);
        setPreviewingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error(`[${new Date().toISOString()}] ❌ Preview playback failed`);
        setPreviewingVoice(null);
      };

      await audio.play();
      console.log(`[${new Date().toISOString()}] ▶️ Playing preview`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Preview error:`, error);
      setError('Failed to preview voice');
      setPreviewingVoice(null);
    }
  };

  // Load conversations and memories from localStorage on mount
  useEffect(() => {
    const loadConversations = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsed.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
          console.log(`[${new Date().toISOString()}] 💾 Loaded ${messagesWithDates.length} messages from storage`);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    const loadMemories = () => {
      try {
        const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const memoriesWithDates = parsed.map((mem: any) => ({
            ...mem,
            timestamp: new Date(mem.timestamp)
          }));
          setMemories(memoriesWithDates);
          console.log(`[${new Date().toISOString()}] 🧠 Loaded ${memoriesWithDates.length} memories from storage`);
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
    
    loadConversations();
    loadMemories();
    loadMemorySettings();
    loadVoiceSettings();
  }, []);

  // Manual save function to avoid excessive saves during streaming
  const saveMessagesToStorage = (messagesToSave: Message[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messagesToSave));
      console.log(`[${new Date().toISOString()}] 💾 Saved ${messagesToSave.length} messages to storage`);
    } catch (error) {
      console.error('Failed to save conversations:', error);
    }
  };

  // Save memories to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(memories));
      if (memories.length > 0) {
        console.log(`[${new Date().toISOString()}] 🧠 Saved ${memories.length} memories to storage`);
      }
    } catch (error) {
      console.error('Failed to save memories:', error);
    }
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

  const clearConversation = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🗑️ Clearing conversation history`);
    stopAllAudio();
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setStatus('Conversation cleared - Ready to chat');
    setShowClearModal(false);
  };

  const clearMemories = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧠 Clearing all memories`);
    setMemories([]);
    localStorage.removeItem(MEMORY_STORAGE_KEY);
    setMemoryToast('All memories cleared');
    setTimeout(() => setMemoryToast(null), 2000);
  };

  const deleteMemory = (memoryId: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🧠 Deleting memory: ${memoryId}`);
    setMemories(prev => prev.filter(m => m.id !== memoryId));
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
          id: Math.random().toString(36).substr(2, 9),
          fact: mem.fact,
          timestamp: new Date(),
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

  const handleRecordingStart = () => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🎤 RECORDING STARTED - checking for audio to interrupt`);
    
    // Stop any playing audio
    stopAllAudio();
    
    // Clear error
    setError('');
  };

  const processTextMessage = async (text: string) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ⌨️ PROCESSING TEXT MESSAGE:`, text);

    setIsProcessing(true);
    setStatus('Getting AI response...');
    setError('');

    try {
      // Add user message to conversation
      const userMessageId = `user-${Date.now()}`;
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
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}));
        throw new Error(errorData.details || 'Chat failed');
      }

      const chatData = await chatResponse.json();
      console.log(`[${new Date().toISOString()}] ✅ Chat response received:`, chatData.text);
      
      const fullText = chatData.text;
      const assistantMessageId = `assistant-${Date.now()}`;
      
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
    console.log(`[${timestamp}] 📥 AUDIO RECORDED - handleAudioRecorded called`, {
      blobSize: blob.size,
      blobType: blob.type,
    });
    
    // Validate audio blob
    if (blob.size < 100) {
      setError('Audio recording too short. Please speak for at least 1 second.');
      setStatus('Ready - Click to speak');
      return;
    }

    console.log(`[${timestamp}] ✅ Audio validated, starting processing pipeline`);
    
    setStatus('Transcribing audio...');
    setIsProcessing(true);

    try {
      // Step 1: Transcribe audio
      console.log(`[${new Date().toISOString()}] 📝 Step 1: Sending audio to transcription API`);
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        const errorData = await transcribeResponse.json().catch(() => ({}));
        const errorMsg = errorData.details || errorData.error || 'Transcription failed';
        
        // Check for audio format errors
        if (errorMsg.includes('could not be decoded') || errorMsg.includes('format is not supported')) {
          throw new Error('Audio recording was corrupted. Please try speaking again - make sure to speak for at least 1 second.');
        } else if (errorMsg.includes('too short')) {
          throw new Error('Recording was too short. Please speak for at least 1 second.');
        }
        
        throw new Error(errorMsg);
      }

      const transcribeData = await transcribeResponse.json();
      console.log(`[${new Date().toISOString()}] ✅ Transcription received:`, transcribeData.text);
      
      if (!transcribeData.text || transcribeData.text.trim() === '') {
        throw new Error('No speech detected. Please try again.');
      }
      
      // Add user message to conversation
      const userMessageId = `user-${Date.now()}`;
      const userMessage: Message = {
        id: userMessageId,
        role: 'user',
        text: transcribeData.text,
        timestamp: new Date(),
      };
      setMessages(prev => {
        const updated = [...prev, userMessage];
        saveMessagesToStorage(updated);
        return updated;
      });
      
      setStatus('Getting AI response...');

      // Step 2: Get chat response with conversation history
      // Include all previous messages in the history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text,
      }));
      
      console.log(`[${new Date().toISOString()}] 💬 Step 2: Sending to chat API with ${conversationHistory.length} previous messages + current message`);
      
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: transcribeData.text,
          conversationHistory: conversationHistory,
          memories: memories,
        }),
      });

      if (!chatResponse.ok) {
        const errorData = await chatResponse.json().catch(() => ({}));
        throw new Error(errorData.details || 'Chat failed');
      }

      const chatData = await chatResponse.json();
      console.log(`[${new Date().toISOString()}] ✅ Chat response received:`, chatData.text);
      
      const fullText = chatData.text;
      const assistantMessageId = `assistant-${Date.now()}`;
      
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
      console.log(`[${new Date().toISOString()}] 🔊 Step 3: Converting to speech (parallel)`);
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
      
      // Processing done
      setIsProcessing(false);
      setStatus('AI response ready - Click play to hear it');
      console.log(`[${new Date().toISOString()}] ✅ Message added to conversation, ready for playback`);

      // Extract and save memories (async, don't await) - only from user message
      extractAndSaveMemories(transcribeData.text).catch(err => 
        console.error('Memory extraction failed:', err)
      );
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
      
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col items-center justify-center p-8">
        <div className="max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Voice Assistant
          </h1>
          <p className="text-center text-gray-600 mb-12">v0 - Complete Voice Interface</p>
          
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex flex-col items-center">
              <VoiceButton 
                onAudioRecorded={handleAudioRecorded}
                onRecordingStart={handleRecordingStart}
                disabled={isProcessing}
              />
            </div>
          </div>
          
          {/* Conversation History with Integrated Status */}
          <div className="bg-white rounded-xl shadow-md flex flex-col" style={{ height: 'calc(100vh - 350px)', minHeight: '450px', maxHeight: '700px' }}>
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
                  
                  {/* Clear Conversation Button */}
                  {messages.length > 0 && (
                    <button
                      onClick={() => setShowClearModal(true)}
                      className="px-3 py-1 text-xs rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-all font-medium"
                      title="Clear all conversations"
                    >
                      Clear All Chats
                    </button>
                  )}
                </div>
                
                {/* Universal Playback Controls */}
                <div className="flex items-center gap-2">
                  {playingMessageId && (
                    <>
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
                {messages.map((message) => (
                  <div key={message.id} className={`p-4 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-50 border border-blue-200' 
                      : 'bg-purple-50 border border-purple-200'
                  }`}>
                    <p className={`text-sm font-medium mb-2 ${message.role === 'user' ? 'text-blue-800' : 'text-purple-800'}`}>
                      {message.role === 'user' ? '🎯 You' : '🤖 AI'}
                    </p>
                    
                    <p className="text-gray-700 whitespace-pre-wrap mb-3">
                      {message.text}
                      {message.role === 'assistant' && !message.audioUrl && message.text && (
                        <span className="inline-block w-2 h-4 bg-purple-600 ml-1 animate-pulse"></span>
                      )}
                    </p>
                    
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
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
            </div>
            
            {/* Text Input - Sticky at bottom */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isProcessing ? "Type to queue message..." : "Type a message..."}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className={`px-6 py-2 font-medium rounded-lg transition-all ${
                    isProcessing
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-purple-500 hover:bg-purple-600 text-white'
                  } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                  title={isProcessing ? 'Message will be queued' : 'Send message'}
                >
                  {isProcessing ? 'Queue' : 'Send'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-white/80 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">How to use:</h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Voice:</strong> Click the mic to start/stop recording, or</li>
              <li>• <strong>Text:</strong> Type in the text box at the bottom of the conversation</li>
              <li>• The AI remembers your conversation and will speak responses</li>
              <li>• Each message has playback controls (play, pause, skip, speed)</li>
              <li>• You can interrupt the AI at any time by recording again</li>
              <li>• Change voice in Settings - old messages auto-regenerate when played</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Current Voice:</strong> {selectedVoice} ({selectedModel === 'tts-1-hd' ? 'HD' : 'Standard'})
              </p>
            </div>
          </div>
          
          <div className="mt-4 text-center text-xs text-gray-400">
            <p>Full voice loop: Speech → Text → AI Response → Voice</p>
          </div>
        </div>
      </main>

      {/* Clear Conversation Modal */}
      {showClearModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowClearModal(false)}
        >
          <div 
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
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSettingsModal(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg mx-4 w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between mb-6">
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

              {/* Memory Settings Section */}
              <div className="space-y-4">
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

                  {/* Memory List */}
                  {memories.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                      {memories.map(memory => (
                        <div key={memory.id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                          <div className="flex-1 pr-2">
                            <p className="text-sm text-gray-800">{memory.fact}</p>
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
                  )}

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
                        <div
                          key={voice.id}
                          className={`w-full p-3 rounded-lg border-2 transition-all ${
                            selectedVoice === voice.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => setSelectedVoice(voice.id)}
                              className="flex-1 text-left"
                            >
                              <p className="font-medium text-gray-800">{voice.name}</p>
                              <p className="text-xs text-gray-600">{voice.desc}</p>
                            </button>
                            
                            <div className="flex items-center gap-2">
                              {/* Preview Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  previewVoice(voice.id);
                                }}
                                disabled={previewingVoice === voice.id}
                                className={`p-2 rounded-lg transition-all ${
                                  previewingVoice === voice.id
                                    ? 'bg-blue-500 text-white cursor-wait'
                                    : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                }`}
                                title="Preview voice"
                              >
                                {previewingVoice === voice.id ? '🔊' : '▶️'}
                              </button>
                              
                              {/* Selected Checkmark */}
                              {selectedVoice === voice.id && (
                                <span className="text-purple-600 text-xl">✓</span>
                              )}
                            </div>
                          </div>
                        </div>
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
          </div>
        </div>
      )}

      {/* Memory Toast Notification */}
      {memoryToast && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in-out">
          <div className="bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
            <span>💾</span>
            <span className="font-medium">{memoryToast}</span>
          </div>
        </div>
      )}
    </>
  );
}
