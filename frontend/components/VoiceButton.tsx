import React, { useState } from 'react';

type VoiceButtonProps = {
  onAudioRecorded: (audioBlob: Blob, finalChunk: Blob | null) => void; // Added finalChunk for remaining audio
  onRecordingStart?: () => void;
  onChunkRecorded?: (chunk: Blob) => void; // For live transcription (incremental chunks)
  disabled?: boolean;
};

export default function VoiceButton({ onAudioRecorded, onRecordingStart, onChunkRecorded, disabled }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recorder, setRecorder] = useState<any>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [chunkIntervalId, setChunkIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [isTabHidden, setIsTabHidden] = useState(false);
  
  // Chunking for live transcription (5 seconds per chunk for near-real-time feel)
  const CHUNK_DURATION_MS = 5 * 1000; // 5 seconds - faster updates!
  
  // No more max duration! Effectively unlimited recording
  // (We'll handle large files differently via chunking + Supabase Storage)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] 🔘 BUTTON CLICKED`, {
      isRecording,
      isStarting,
      disabled,
      currentRecorder: recorder ? 'exists' : 'null'
    });
    
    if (isRecording) {
      // Stop recording
      await stopRecording();
    } else {
      // Start recording
      await startRecording();
    }
  };

  const startRecording = async () => {
    const timestamp = new Date().toISOString();
    
    // Prevent starting if already recording or in the process of starting
    if (isRecording || isStarting || disabled) {
      console.log(`[${timestamp}] ⛔ Ignoring start - already recording or starting`);
      return;
    }

    console.log(`[${timestamp}] 🎤 Start recording triggered`);
    setIsStarting(true);

    try {
      // Import dynamically to avoid SSR issues
      const { AudioRecorder } = await import('@/utils/audioRecorder');
      const newRecorder = new AudioRecorder();
      await newRecorder.startRecording();
      
      const startTimestamp = new Date().toISOString();
      console.log(`[${startTimestamp}] ✅ Recording started successfully`);
      setRecorder(newRecorder);
      setIsRecording(true);
      setDuration(0);
      setRecordingStartTime(Date.now());
      
      // Notify parent that recording has started (for audio interruption)
      if (onRecordingStart) {
        console.log(`[${startTimestamp}] 🔔 Notifying parent: recording started`);
        onRecordingStart();
      }

      // Start duration counter
      const id = setInterval(() => {
        setDuration(prev => prev + 0.1);
      }, 100);
      setIntervalId(id);
      
      // Start chunking timer for live transcription (using NEW chunks only!)
      if (onChunkRecorded) {
        const chunkId = setInterval(async () => {
          console.log(`[${new Date().toISOString()}] 🔄 Chunk interval triggered - getting NEW audio chunks`);
          try {
            // Use getNewChunks() to only transcribe audio since last call
            const chunk = await newRecorder.getNewChunks();
            if (chunk && chunk.size > 0) {
              console.log(`[${new Date().toISOString()}] ✅ New chunk extracted:`, chunk.size, 'bytes');
              onChunkRecorded(chunk);
            }
          } catch (error) {
            console.error(`[${new Date().toISOString()}] ❌ Failed to get chunk:`, error);
          }
        }, CHUNK_DURATION_MS);
        setChunkIntervalId(chunkId);
      }
      
      // Handle tab visibility changes (keep recording even when tab is hidden)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log(`[${new Date().toISOString()}] 👁️ Tab hidden - recording continues!`);
          setIsTabHidden(true);
        } else {
          console.log(`[${new Date().toISOString()}] 👁️ Tab visible again`);
          setIsTabHidden(false);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
    } catch (error) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to start recording:`, error);
      alert('Could not access microphone. Please check permissions and try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopRecording = async () => {
    const timestamp = new Date().toISOString();
    
    console.log(`[${timestamp}] ⏹️ STOP RECORDING TRIGGERED`, {
      hasRecorder: !!recorder,
      isRecording
    });
    
    if (!recorder || !isRecording) {
      console.log(`[${timestamp}] ⛔ Ignoring stop - not recording`);
      return;
    }

    // Check if minimum duration has passed (300ms minimum to avoid corrupted audio)
    const recordingDuration = Date.now() - recordingStartTime;
    console.log(`[${timestamp}] ⏱️ Recording duration check:`, {
      duration: recordingDuration,
      minimumRequired: 300,
      willProceed: recordingDuration >= 300
    });
    
    if (recordingDuration < 300) {
      console.log(`[${timestamp}] ⏸️ Recording too short, waiting...`, recordingDuration, 'ms');
      // Let it record a bit longer - user might have just clicked too fast
      await new Promise(resolve => setTimeout(resolve, 300 - recordingDuration));
      console.log(`[${new Date().toISOString()}] ⏰ Minimum duration met, proceeding with stop`);
    }

    console.log(`[${new Date().toISOString()}] ⏹️ Stopping recording after ${Date.now() - recordingStartTime}ms`);

    try {
      // CRITICAL: Get the final chunk BEFORE stopping (remaining audio after last interval)
      const finalChunk = await recorder.getFinalChunk();
      if (finalChunk && finalChunk.size > 0) {
        console.log(`[${new Date().toISOString()}] 📦 Final chunk captured:`, finalChunk.size, 'bytes');
      } else {
        console.log(`[${new Date().toISOString()}] ℹ️ No final chunk (all audio already sent)`);
      }
      
      const audioBlob = await recorder.stopRecording();
      const sizeMB = (audioBlob.size / 1024 / 1024).toFixed(1);
      console.log(`[${new Date().toISOString()}] 📦 Full audio blob created:`, sizeMB, 'MB (', audioBlob.size, 'bytes)');
      
      // Clear intervals
      setIsRecording(false);
      setRecorder(null);
      setIsTabHidden(false);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      if (chunkIntervalId) {
        clearInterval(chunkIntervalId);
        setChunkIntervalId(null);
      }
      
      // Remove visibility listener
      document.removeEventListener('visibilitychange', () => {});

      console.log(`[${new Date().toISOString()}] 📤 Sending complete audio + final chunk to parent`);
      onAudioRecorded(audioBlob, finalChunk);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to stop recording:`, error);
      setIsRecording(false);
      setRecorder(null);
      setIsTabHidden(false);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      if (chunkIntervalId) {
        clearInterval(chunkIntervalId);
        setChunkIntervalId(null);
      }
      
      // Show user-friendly error
      alert('Recording failed: ' + (error.message || 'Please try again'));
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleClick}
        disabled={disabled || isStarting}
        className={`
          w-32 h-32 rounded-full text-white font-bold text-lg
          transition-all duration-200 transform
          ${isRecording 
            ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50' 
            : isStarting
            ? 'bg-yellow-500 scale-105 shadow-lg'
            : 'bg-blue-500 hover:bg-blue-600 hover:scale-105 shadow-lg'
          }
          ${disabled || isStarting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
        `}
      >
        {isRecording ? '⏹️ Stop' : isStarting ? '⏳ Starting...' : '🎤 Record'}
      </button>
      
      {isRecording && (
        <div className="flex flex-col items-center gap-1">
          <div className="text-sm font-mono font-semibold text-gray-600">
            Recording: {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
          </div>
          <div className="text-xs text-gray-500">
            ✨ Unlimited length - take your time
          </div>
          {isTabHidden && (
            <div className="text-xs text-orange-600 font-medium animate-pulse">
              📱 Recording continues in background
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        {isRecording 
          ? '🔴 Recording in progress - Click to stop' 
          : 'Click to start recording (unlimited length!)'
        }
      </div>
    </div>
  );
}




