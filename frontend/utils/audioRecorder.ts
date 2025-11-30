// Audio recorder utility using MediaRecorder API

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;

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

  // Get accumulated chunks as a blob (for live transcription)
  // This does NOT stop recording - it just extracts what we have so far
  async getChunk(): Promise<Blob | null> {
    if (!this.mediaRecorder || this.audioChunks.length === 0) {
      console.log('No chunks available yet');
      return null;
    }

    // Create blob from current chunks
    const mimeType = this.mediaRecorder.mimeType || 'audio/webm';
    const chunk = new Blob([...this.audioChunks], { type: mimeType });
    
    console.log('Created chunk blob:', {
      size: chunk.size,
      type: chunk.type,
      chunksUsed: this.audioChunks.length
    });

    // IMPORTANT: Don't clear chunks! We need them for the final audio
    // The final stopRecording() will use ALL chunks accumulated
    
    return chunk;
  }
}
