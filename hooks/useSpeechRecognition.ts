import { useState, useEffect, useRef, useCallback } from 'react';
import { debug } from '../utils/debug';

// Type definitions for the Web Speech API to ensure TypeScript compatibility.
// These interfaces describe the shape of the objects provided by the browser's API.
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionStatic {
  new(): SpeechRecognition;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

// Extend the global Window interface to include SpeechRecognition APIs.
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionStatic;
    webkitSpeechRecognition?: SpeechRecognitionStatic;
  }
}


// Check for SpeechRecognition API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const isSpeechRecognitionSupported = !!SpeechRecognition;

const SUBMISSION_KEYWORDS = [
    'submit', 'done', 'finished', 'check', 'evaluate', 'ready', 'complete',
    'i am done', 'i am ready', 'i think i am done', 'i have finished', 'is this right'
];

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  isSupported: boolean;
}

interface useSpeechRecognitionArgs {
  onTranscriptEnd: (finalTranscript: string) => void;
  onSubmissionIntent: () => void;
}

export const useSpeechRecognition = ({ onTranscriptEnd, onSubmissionIntent }: useSpeechRecognitionArgs): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const onTranscriptEndRef = useRef(onTranscriptEnd);
  onTranscriptEndRef.current = onTranscriptEnd;

  const onSubmissionIntentRef = useRef(onSubmissionIntent);
  onSubmissionIntentRef.current = onSubmissionIntent;


  useEffect(() => {
    if (!SpeechRecognition) {
      debug('ERROR', "Speech recognition is not supported in this browser.");
      setError("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      debug('SPEECH', 'Recognition started.');
      setIsListening(true);
      setTranscript('');
      setInterimTranscript('');
      setError(null);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      debug('ERROR', 'Speech recognition error', { error: event.error, message: event.message });
      // For 'no-speech' error, we just let it end gracefully without showing a user-facing error.
      // The onend handler will be called, and the useEffect in App can decide to restart.
      if (event.error === 'no-speech') {
        console.warn('Speech recognition ended due to no speech.');
        setIsListening(false);
        return;
      }

      console.error('Speech recognition error:', event.error);
      let errorMessage = `An error occurred with speech recognition: ${event.error}`;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        errorMessage = 'Microphone access was denied. Please allow microphone access in your browser settings.';
      }
      setError(errorMessage);
      setIsListening(false);
    };

    recognition.onend = () => {
      debug('SPEECH', 'Recognition ended.');
      setIsListening(false);
      setInterimTranscript('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }
      setInterimTranscript(currentInterim);
      if(finalTranscript.trim()) {
        const transcriptLower = finalTranscript.trim().toLowerCase();
        const isSubmission = SUBMISSION_KEYWORDS.some(keyword => transcriptLower.includes(keyword));
        
        debug('SPEECH', 'Final transcript received', { transcript: finalTranscript.trim(), isSubmission });

        if(isSubmission && onSubmissionIntentRef.current) {
            debug('SPEECH', 'Submission intent detected.');
            onSubmissionIntentRef.current();
        } else {
            setTranscript(prev => prev + finalTranscript);
            onTranscriptEndRef.current(finalTranscript.trim());
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        debug('SPEECH', 'Attempting to start recognition...');
        recognitionRef.current.start();
      } catch(e) {
        debug('ERROR', "Error starting speech recognition:", e);
        setError("Could not start listening. Microphone might be in use.");
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      debug('SPEECH', 'Attempting to stop recognition...');
      recognitionRef.current.stop();
    }
  }, [isListening]);


  return { isListening, transcript, interimTranscript, error, startListening, stopListening, isSupported: isSpeechRecognitionSupported };
};