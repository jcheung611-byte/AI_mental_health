// Audio recorder utility using MediaRecorder API

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private lastChunkIndex: number = 0; // Track which chunks have been sent for transcription

  async startRecording(): Promise<void> {
    try {
      // Clean up any existing stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }

      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Try to use a compatible format
      let options: MediaRecorderOptions = {};
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        options.mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      }
      
      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.lastChunkIndex = 0; // Reset chunk tracking
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes');
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('MediaRecorder error:', event.error);
      };

      // Start recording with 100ms timeslices to ensure data is captured frequently
      this.mediaRecorder.start(100);
      console.log('Recording started with mimeType:', this.mediaRecorder.mimeType);
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No media recorder initialized'));
        return;
      }

      const recordingDuration = Date.now() - this.startTime;
      console.log('Stopping recording after', recordingDuration, 'ms');

      // If recording was too short, still try to get what we have
      if (recordingDuration < 300) {
        console.warn('⚠️ Recording very short (<300ms) - audio might be incomplete');
      }

      if (this.mediaRecorder.state === 'inactive') {
        console.warn('MediaRecorder already inactive');
        reject(new Error('Recording already stopped'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped, chunks collected:', this.audioChunks.length);
        
        if (this.audioChunks.length === 0) {
          console.error('❌ No audio chunks captured!');
          reject(new Error('No audio data recorded'));
          return;
        }

        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        console.log('Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          chunks: this.audioChunks.length,
          duration: recordingDuration + 'ms'
        });
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => {
            track.stop();
            console.log('Track stopped:', track.kind);
          });
          this.stream = null;
        }
        
        // Validate blob
        if (audioBlob.size < 100) {
          console.error('❌ Audio blob too small:', audioBlob.size, 'bytes');
          reject(new Error('Audio recording too short or empty'));
          return;
        }
        
        resolve(audioBlob);
      };

      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
        reject(error);
      }
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  // Get NEW chunks since last call (for incremental live transcription)
  // This does NOT stop recording - it just extracts what's new since last call
  async getNewChunks(): Promise<Blob | null> {
    if (!this.mediaRecorder) {
      console.log('No media recorder');
      return null;
    }

    // Get only the NEW chunks since last call
    const newChunks = this.audioChunks.slice(this.lastChunkIndex);
    
    if (newChunks.length === 0) {
      console.log('No new chunks since last call');
      return null;
    }

    // Update the index so next call only gets newer chunks
    const previousIndex = this.lastChunkIndex;
    this.lastChunkIndex = this.audioChunks.length;

    // Create blob from NEW chunks only
    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
    const chunk = new Blob(newChunks, { type: mimeType });
    
    console.log('Created NEW chunk blob:', {
      size: chunk.size,
      type: chunk.type,
      newChunksUsed: newChunks.length,
      chunkRange: `${previousIndex} to ${this.lastChunkIndex}`,
      totalChunks: this.audioChunks.length
    });
    
    return chunk;
  }

  // Get remaining unsent chunks (for final transcription on stop)
  // CRITICAL: Must call requestData() first to flush any buffered audio!
  async getFinalChunk(): Promise<Blob | null> {
    if (!this.mediaRecorder) {
      console.log('No media recorder');
      return null;
    }

    // CRITICAL FIX: Force the MediaRecorder to flush its internal buffer!
    // Without this, the last bit of audio might still be buffered and not in audioChunks
    if (this.mediaRecorder.state === 'recording') {
      console.log('Requesting final data from MediaRecorder...');
      this.mediaRecorder.requestData();
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Get any chunks that haven't been sent yet
    const remainingChunks = this.audioChunks.slice(this.lastChunkIndex);
    
    if (remainingChunks.length === 0) {
      console.log('No remaining chunks to transcribe');
      return null;
    }

    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
    const chunk = new Blob(remainingChunks, { type: mimeType });
    
    console.log('Created FINAL chunk blob:', {
      size: chunk.size,
      type: chunk.type,
      remainingChunksUsed: remainingChunks.length,
      chunkRange: `${this.lastChunkIndex} to ${this.audioChunks.length}`
    });
    
    return chunk;
  }

  // Legacy method - get ALL chunks (for backward compatibility)
  async getChunk(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.audioChunks.length === 0) {
      console.log('No chunks available yet');
      return null;
    }

    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
    const chunk = new Blob([...this.audioChunks], { type: mimeType });
    
    console.log('Created chunk blob (ALL):', {
      size: chunk.size,
      type: chunk.type,
      chunksUsed: this.audioChunks.length
    });
    
    return chunk;
  }
}
