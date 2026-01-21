import { useState, useRef } from 'react';
import VoiceButton from '../components/VoiceButton';
import Link from 'next/link';

type ResponseType = {
  type: 'followup_needed' | 'intervention';
  question?: string;
  mode?: string;
  text?: string;
  session_id?: string;
  signals?: any;
  mode_rationale?: string;
  safety_flag?: string;
};

export default function CheckinPage() {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState<ResponseType | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [status, setStatus] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle audio recording
  const handleAudioRecorded = async (audioBlob: Blob, finalChunk?: Blob) => {
    setIsRecording(false);
    setStatus('Transcribing...');

    try {
      // Transcribe audio
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeRes.ok) {
        throw new Error('Transcription failed');
      }

      const { text } = await transcribeRes.json();
      setTranscript(text);
      setStatus('');
    } catch (error) {
      console.error('Transcription error:', error);
      setStatus('Transcription failed');
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!transcript.trim()) {
      setStatus('Please say or type something');
      return;
    }

    setIsProcessing(true);
    setStatus('Thinking...');
    setResponse(null);
    setFeedbackGiven(false);

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          sessionId: sessionId, // Pass session ID if this is a follow-up
        }),
      });

      if (!res.ok) {
        throw new Error('Check-in failed');
      }

      const data: ResponseType = await res.json();
      setResponse(data);
      
      // Store session ID for potential follow-up
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      // Clear transcript if this is the first message (not a follow-up)
      if (data.type === 'followup_needed') {
        setTranscript('');
      }

      setStatus('');
    } catch (error) {
      console.error('Check-in error:', error);
      setStatus('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle follow-up submission
  const handleFollowupSubmit = async () => {
    if (!transcript.trim()) {
      setStatus('Please answer the question');
      return;
    }

    setIsProcessing(true);
    setStatus('Processing your answer...');

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: transcript.trim(),
          followupResponse: transcript.trim(),
          sessionId: sessionId,
        }),
      });

      if (!res.ok) {
        throw new Error('Follow-up failed');
      }

      const data: ResponseType = await res.json();
      setResponse(data);
      setTranscript('');
      setStatus('');
    } catch (error) {
      console.error('Follow-up error:', error);
      setStatus('Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle feedback
  const handleFeedback = async (feedback: 'helped' | 'didnt_help' | 'too_much') => {
    if (!sessionId) return;

    try {
      const res = await fetch('/api/checkin/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          feedback,
        }),
      });

      if (!res.ok) {
        throw new Error('Feedback submission failed');
      }

      setFeedbackGiven(true);
      setStatus('Thanks for your feedback! 🙏');
      
      // Clear after 2 seconds
      setTimeout(() => setStatus(''), 2000);
    } catch (error) {
      console.error('Feedback error:', error);
      setStatus('Failed to save feedback');
    }
  };

  // Start new check-in
  const handleNewCheckin = () => {
    setTranscript('');
    setResponse(null);
    setFeedbackGiven(false);
    setSessionId(null);
    setStatus('');
  };

  // Get mode badge color
  const getModeColor = (mode?: string) => {
    switch (mode) {
      case 'reflect':
        return 'bg-purple-100 text-purple-700';
      case 'ground':
        return 'bg-blue-100 text-blue-700';
      case 'action':
        return 'bg-green-100 text-green-700';
      case 'hold':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Chat
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Quick Check-in
          </h1>
          <p className="text-lg text-gray-600">
            Share how you're doing. I'll offer a short, helpful response.
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            Beta
          </div>
        </div>

        {/* Main content */}
        {!response ? (
          // Initial check-in input
          <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How are you doing right now?
              </label>
              <div className="flex items-center gap-4 mb-4">
                <VoiceButton
                  onAudioRecorded={handleAudioRecorded}
                  onRecordingStateChange={(recording, duration) => setIsRecording(recording)}
                />
                <span className="text-sm text-gray-500">
                  {isRecording ? 'Recording...' : 'Press to record (10-30 seconds)'}
                </span>
              </div>
              <textarea
                ref={textareaRef}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Or type how you're feeling..."
                className="w-full h-32 p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                disabled={isProcessing}
              />
            </div>

            {status && (
              <div className="text-center text-gray-600 py-2">{status}</div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!transcript.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-4 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md"
            >
              {isProcessing ? 'Processing...' : 'Submit Check-in'}
            </button>
          </div>
        ) : response.type === 'followup_needed' ? (
          // Follow-up question
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="mb-6">
                <div className="text-sm text-gray-500 mb-2">Follow-up Question</div>
                <p className="text-lg text-gray-800">{response.question}</p>
              </div>

              <div>
                <textarea
                  ref={textareaRef}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full h-24 p-4 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-300 mb-4"
                  disabled={isProcessing}
                />
              </div>

              {status && (
                <div className="text-center text-gray-600 py-2 mb-4">{status}</div>
              )}

              <button
                onClick={handleFollowupSubmit}
                disabled={!transcript.trim() || isProcessing}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-white py-3 rounded-2xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-yellow-600 transition-all"
              >
                {isProcessing ? 'Processing...' : 'Submit Answer'}
              </button>
            </div>
          </div>
        ) : (
          // Intervention response
          <div className="space-y-6">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getModeColor(response.mode)}`}>
                  {response.mode?.charAt(0).toUpperCase() + (response.mode?.slice(1) || '')} Mode
                </span>
                {response.safety_flag && response.safety_flag !== 'none' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700">
                    Crisis Support
                  </span>
                )}
              </div>

              <div className="prose prose-lg max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {response.text}
                </div>
              </div>
            </div>

            {!feedbackGiven ? (
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Was this helpful?
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleFeedback('helped')}
                    className="px-6 py-3 bg-green-100 text-green-700 rounded-xl font-medium hover:bg-green-200 transition-colors"
                  >
                    👍 Helped
                  </button>
                  <button
                    onClick={() => handleFeedback('didnt_help')}
                    className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  >
                    😐 Didn't Help
                  </button>
                  <button
                    onClick={() => handleFeedback('too_much')}
                    className="px-6 py-3 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-colors"
                  >
                    😓 Too Much
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={handleNewCheckin}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-2xl font-medium hover:from-orange-600 hover:to-yellow-600 transition-all shadow-md"
                >
                  Do Another Check-in
                </button>
              </div>
            )}

            {status && (
              <div className="text-center text-gray-600">{status}</div>
            )}
          </div>
        )}

        {/* Info footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            This is a short, structured check-in experience. For longer conversations,
            use the <Link href="/" className="text-orange-600 hover:underline">Chat</Link> feature.
          </p>
        </div>
      </div>
    </div>
  );
}

