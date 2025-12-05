// Audio recorder utility using MediaRecorder API
// Simplified version - records full audio, transcribes at end

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

      console.log('[AudioRecorder] Requesting microphone access...');
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[AudioRecorder] Microphone access granted');
      
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
          this.audioChunks.push(event.data);
          // Log every 10th chunk to avoid console spam
          if (this.audioChunks.length % 10 === 0) {
            console.log(`[AudioRecorder] Chunks collected: ${this.audioChunks.length}`);
          }
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        console.error('[AudioRecorder] MediaRecorder error:', event.error);
      };

      // Start recording with 100ms timeslices
      this.mediaRecorder.start(100);
      console.log('[AudioRecorder] Recording started with mimeType:', this.mediaRecorder.mimeType);
    } catch (error) {
      console.error('[AudioRecorder] Error starting recording:', error);
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
      console.log(`[AudioRecorder] Stopping after ${(recordingDuration / 1000).toFixed(1)}s`);

      if (this.mediaRecorder.state === 'inactive') {
        console.warn('[AudioRecorder] MediaRecorder already inactive');
        reject(new Error('Recording already stopped'));
        return;
      }

      // Request any remaining data before stopping
      console.log('[AudioRecorder] Requesting final data...');
      this.mediaRecorder.requestData();

      this.mediaRecorder.onstop = () => {
        console.log(`[AudioRecorder] Stopped. Total chunks: ${this.audioChunks.length}`);
        
        if (this.audioChunks.length === 0) {
          console.error('[AudioRecorder] ❌ No audio chunks captured!');
          reject(new Error('No audio data recorded'));
          return;
        }

        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const sizeMB = (audioBlob.size / 1024 / 1024).toFixed(2);
        const expectedSize = (recordingDuration / 1000) * 0.012; // ~12KB per second for opus
        
        console.log(`[AudioRecorder] ✅ Audio blob created:`, {
          size: `${sizeMB} MB`,
          chunks: this.audioChunks.length,
          duration: `${(recordingDuration / 1000).toFixed(1)}s`,
          expectedSize: `~${expectedSize.toFixed(2)} MB`,
          sizeRatio: `${(audioBlob.size / 1024 / 1024 / expectedSize * 100).toFixed(0)}% of expected`
        });
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => {
            track.stop();
          });
          this.stream = null;
        }
        
        // Validate blob
        if (audioBlob.size < 100) {
          console.error('[AudioRecorder] ❌ Audio blob too small:', audioBlob.size, 'bytes');
          reject(new Error('Audio recording too short or empty'));
          return;
        }
        
        resolve(audioBlob);
      };

      try {
        // Small delay to let requestData() process
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
          }
        }, 100);
      } catch (error) {
        console.error('[AudioRecorder] Error stopping MediaRecorder:', error);
        reject(error);
      }
    });
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }
}
