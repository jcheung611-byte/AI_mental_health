import React, { useState, useRef, useEffect } from 'react';

type VoiceButtonProps = {
  onAudioRecorded: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  disabled?: boolean;
};

export default function VoiceButton({ onAudioRecorded, onRecordingStart, disabled }: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recorder, setRecorder] = useState<any>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [isTabHidden, setIsTabHidden] = useState(false);
  
  // Store visibility handler ref so we can remove it later
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  
  // Max recording duration (15 minutes = ~15MB, well under Whisper's 25MB limit)
  // Vercel Pro supports up to 100MB, Whisper supports up to 25MB
  const MAX_DURATION_SECONDS = 15 * 60; // 15 minutes
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove visibility listener if still attached
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }
    };
  }, []);

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

      // Start duration counter using REAL elapsed time (not increment)
      // This ensures timer is accurate even when tab is in background
      const startTime = Date.now();
      setRecordingStartTime(startTime);
      
      const id = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        setDuration(elapsedSeconds);
        
        // Auto-stop if max duration reached
        if (elapsedSeconds >= MAX_DURATION_SECONDS) {
          console.log(`[${new Date().toISOString()}] ⏱️ Max duration reached (${MAX_DURATION_SECONDS}s), auto-stopping`);
          stopRecording();
        }
      }, 100);
      setIntervalId(id);
      
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
      // Store handler ref so we can remove it later
      visibilityHandlerRef.current = handleVisibilityChange;
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
      const audioBlob = await recorder.stopRecording();
      const sizeMB = (audioBlob.size / 1024 / 1024).toFixed(2);
      console.log(`[${new Date().toISOString()}] 📦 Full audio blob created:`, sizeMB, 'MB (', audioBlob.size, 'bytes)');
      
      // Clear state
      setIsRecording(false);
      setRecorder(null);
      setIsTabHidden(false);
      setDuration(0);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      // Remove visibility listener properly using the stored ref
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }

      console.log(`[${new Date().toISOString()}] 📤 Sending complete audio to parent`);
      onAudioRecorded(audioBlob);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to stop recording:`, error);
      setIsRecording(false);
      setRecorder(null);
      setIsTabHidden(false);
      setDuration(0);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      // Remove visibility listener on error too
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
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
            <span className="text-gray-400 ml-1">
              / {Math.floor(MAX_DURATION_SECONDS / 60)}:00
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {duration >= MAX_DURATION_SECONDS - 60 
              ? '⚠️ Approaching limit...' 
              : '🎙️ Up to 15 minutes per message'}
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
          : 'Click to start recording (up to 15 min)'
        }
      </div>
    </div>
  );
}




