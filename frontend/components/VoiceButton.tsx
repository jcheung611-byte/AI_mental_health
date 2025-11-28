import React, { useState } from 'react';

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
      console.log(`[${new Date().toISOString()}] 📦 Audio blob created:`, audioBlob.size, 'bytes');
      
      setIsRecording(false);
      setRecorder(null);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }

      console.log(`[${new Date().toISOString()}] 📤 Sending audio to parent component`);
      onAudioRecorded(audioBlob);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] ❌ Failed to stop recording:`, error);
      setIsRecording(false);
      setRecorder(null);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
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
        <div className="text-sm text-gray-600 font-mono">
          Recording: {duration.toFixed(1)}s
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        {isRecording 
          ? '🔴 Recording in progress - Click to stop and send' 
          : 'Click to start recording your message'
        }
      </div>
    </div>
  );
}



