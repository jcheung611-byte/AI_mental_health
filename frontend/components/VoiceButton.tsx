import React, { useState, useRef, useEffect } from 'react';

type VoiceButtonProps = {
  onAudioRecorded: (audioBlob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStateChange?: (isRecording: boolean, duration: number) => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function VoiceButton({ 
  onAudioRecorded, 
  onRecordingStart, 
  onRecordingStateChange,
  disabled, 
  compact 
}: VoiceButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recorder, setRecorder] = useState<any>(null);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>([0, 0, 0, 0, 0]);
  
  const visibilityHandlerRef = useRef<(() => void) | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const MAX_DURATION_SECONDS = 15 * 60;
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Notify parent of recording state changes
  useEffect(() => {
    if (onRecordingStateChange) {
      onRecordingStateChange(isRecording, duration);
    }
  }, [isRecording, duration, onRecordingStateChange]);

  const updateAudioLevels = () => {
    if (!analyserRef.current || !isRecording) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Sample 5 frequency bands for visualization
    const bands = 5;
    const bandSize = Math.floor(dataArray.length / bands);
    const levels = [];
    
    for (let i = 0; i < bands; i++) {
      let sum = 0;
      for (let j = i * bandSize; j < (i + 1) * bandSize; j++) {
        sum += dataArray[j];
      }
      // Normalize to 0-1 range with some amplification
      levels.push(Math.min(1, (sum / bandSize / 255) * 2));
    }
    
    setAudioLevels(levels);
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    if (isRecording || isStarting || disabled) return;

    setIsStarting(true);

    try {
      const { AudioRecorder } = await import('@/utils/audioRecorder');
      const newRecorder = new AudioRecorder();
      const stream = await newRecorder.startRecording();
      
      // Set up audio analyser for visualization
      try {
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        
        // Start updating audio levels
        animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
      } catch (err) {
        console.warn('Could not set up audio visualization:', err);
      }
      
      setRecorder(newRecorder);
      setIsRecording(true);
      setDuration(0);
      
      if (onRecordingStart) {
        onRecordingStart();
      }

      const startTime = Date.now();
      setRecordingStartTime(startTime);
      
      const id = setInterval(() => {
        const elapsedSeconds = (Date.now() - startTime) / 1000;
        setDuration(elapsedSeconds);
        
        if (elapsedSeconds >= MAX_DURATION_SECONDS) {
          stopRecording();
        }
      }, 100);
      setIntervalId(id);
      
      const handleVisibilityChange = () => {
        setIsTabHidden(document.hidden);
      };
      visibilityHandlerRef.current = handleVisibilityChange;
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    } finally {
      setIsStarting(false);
    }
  };

  const stopRecording = async () => {
    if (!recorder || !isRecording) return;

    // Stop audio visualization
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setAudioLevels([0, 0, 0, 0, 0]);

    const recordingDuration = Date.now() - recordingStartTime;
    if (recordingDuration < 300) {
      await new Promise(resolve => setTimeout(resolve, 300 - recordingDuration));
    }

    try {
      const audioBlob = await recorder.stopRecording();
      
      setIsRecording(false);
      setRecorder(null);
      setIsTabHidden(false);
      setDuration(0);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }

      onAudioRecorded(audioBlob);
    } catch (error: any) {
      console.error('Failed to stop recording:', error);
      setIsRecording(false);
      setRecorder(null);
      setIsTabHidden(false);
      setDuration(0);
      
      if (intervalId) {
        clearInterval(intervalId);
        setIntervalId(null);
      }
      
      if (visibilityHandlerRef.current) {
        document.removeEventListener('visibilitychange', visibilityHandlerRef.current);
        visibilityHandlerRef.current = null;
      }
      
      alert('Recording failed: ' + (error.message || 'Please try again'));
    }
  };

  // Compact mode with waveform
  if (compact) {
    return (
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || isStarting}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center
            transition-all duration-200
            ${isRecording 
              ? 'bg-red-500 text-white' 
              : isStarting
              ? 'bg-yellow-500 text-white'
              : 'bg-gray-100 hover:bg-purple-100 text-gray-600 hover:text-purple-600'
            }
            ${disabled || isStarting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title={isRecording ? 'Stop recording' : 'Start voice recording'}
        >
          {isRecording ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          ) : isStarting ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          )}
        </button>
      </div>
    );
  }

  // Full mode with waveform visualization
  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
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
        <div className="flex flex-col items-center gap-2">
          {/* Audio waveform visualization */}
          <div className="flex items-end justify-center gap-1 h-8">
            {audioLevels.map((level, i) => (
              <div
                key={i}
                className="w-2 bg-red-400 rounded-full transition-all duration-75"
                style={{ height: `${Math.max(4, level * 32)}px` }}
              />
            ))}
          </div>
          
          <div className="text-sm font-mono font-semibold text-gray-600">
            {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
            <span className="text-gray-400 ml-1">/ {Math.floor(MAX_DURATION_SECONDS / 60)}:00</span>
          </div>
          
          {isTabHidden && (
            <div className="text-xs text-orange-600 font-medium animate-pulse">
              📱 Recording in background
            </div>
          )}
        </div>
      )}
      
      <div className="text-xs text-gray-500 text-center max-w-xs">
        {isRecording ? '🔴 Recording...' : 'Click to record (up to 15 min)'}
      </div>
    </div>
  );
}

