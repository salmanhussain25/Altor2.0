
import { useState, useCallback, useEffect, useRef } from 'react';
import { debug } from '../utils/debug';
import { SpeechSegment, InterviewerGender } from '../types';

// A set of mouth shape identifiers for animation. 'X' is for the closed/neutral state.
const MOUTH_SHAPES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const preprocessTextForSpeech = (text: string): string => {
    // This regex finds a sequence of digits, followed by a dot, followed by another sequence of digits.
    // It will match "2.5", "12.34", etc. but not "example.com" or "end of sentence."
    // It also replaces "use" with "yuuzh" for better pronunciation.
    let processedText = text.replace(/(\d+)\.(\d+)/g, (_match, integerPart, fractionalPart) => {
        const spacedFractionalPart = fractionalPart.split('').join(' ');
        return `${integerPart} point ${spacedFractionalPart}`;
    });
    processedText = processedText.replace(/use/gi, 'yuuzh');
    return processedText;
};


export const useSpeechSynthesis = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [mouthShape, setMouthShape] = useState('X'); // 'X' for closed

  const utteranceQueue = useRef<SpeechSynthesisUtterance[]>([]);
  const onEndCallback = useRef<(() => void) | undefined>(undefined);
  
  const voices = useRef<{
    en: { male: SpeechSynthesisVoice | null, female: SpeechSynthesisVoice | null },
    hi: { male: SpeechSynthesisVoice | null, female: SpeechSynthesisVoice | null }
  }>({
    en: { male: null, female: null },
    hi: { male: null, female: null }
  });

  const processQueue = useCallback(() => {
      const utterance = utteranceQueue.current.shift();
      if (utterance) {
          window.speechSynthesis.speak(utterance);
      } else {
          debug('SPEECH', 'Synthesis queue finished');
          setIsSpeaking(false);
          setMouthShape('X');
          if (onEndCallback.current) {
              onEndCallback.current();
              onEndCallback.current = undefined;
          }
      }
  }, []);

  const cancel = useCallback(() => {
    utteranceQueue.current = [];
    onEndCallback.current = undefined;
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    // A cancel will trigger the 'onend' event of the current utterance, 
    // which then calls processQueue, which will find an empty queue and reset the state.
    // Setting state here is a good safeguard in case onend doesn't fire.
    setIsSpeaking(false);
    setMouthShape('X');
  }, []);

  const speak = useCallback((textOrSegments: string | SpeechSegment[], onEnd?: () => void, langOrGender: string | InterviewerGender = 'hi-IN') => {
    debug('SPEECH', 'speak() called', { textOrSegments, langOrGender, isMuted });

    if (isMuted || !window.speechSynthesis) {
        if(onEnd) onEnd();
        return;
    }
    
    // Cancel any existing speech and clear our queue.
    cancel();

    let segments: SpeechSegment[];
    if (typeof textOrSegments === 'string') {
        const lang: 'hi' | 'en' = langOrGender === 'hi-IN' ? 'hi' : 'en';
        segments = [{ text: textOrSegments, lang }];
    } else {
        segments = textOrSegments;
    }

    segments = segments.filter(s => s.text && s.text.trim().length > 0);
    
    if (segments.length === 0) {
        if(onEnd) onEnd();
        return;
    }

    const fullOriginalText = segments.map(s => s.text).join('');
    setSpokenText(fullOriginalText);

    utteranceQueue.current = segments.map(segment => {
        const processedText = preprocessTextForSpeech(segment.text);
        const utterance = new SpeechSynthesisUtterance(processedText);
        
        if (segment.lang === 'hi') {
            utterance.lang = 'hi-IN';
            utterance.voice = voices.current.hi.female || voices.current.hi.male; // Prefer female for Hindi, fallback to male
        } else { // 'en'
            utterance.lang = 'en-US';
            if (langOrGender === 'female') {
                utterance.voice = voices.current.en.female;
            } else { // Default to male for 'en' or if gender is male
                utterance.voice = voices.current.en.male;
            }
        }
        
        // Fallback if a specific voice wasn't found
        if (!utterance.voice) {
            const allVoices = window.speechSynthesis.getVoices();
            utterance.voice = allVoices.find(v => v.lang === utterance.lang) || allVoices.find(v => v.lang.startsWith(utterance.lang.split('-')[0])) || null;
        }

        utterance.rate = 1;
        utterance.pitch = 1;

        utterance.onend = () => processQueue();
        
        utterance.onboundary = (event) => {
            if (event.name === 'word') {
                const randomShape = MOUTH_SHAPES[Math.floor(Math.random() * MOUTH_SHAPES.length)];
                setMouthShape(randomShape);
            }
        };
        
        utterance.onerror = (e) => {
            debug('ERROR', 'Synthesis error in segment', { error: e.error, segment });
        };

        return utterance;
    });

    if (utteranceQueue.current.length > 0) {
        onEndCallback.current = onEnd;
        setIsSpeaking(true);
        setMouthShape('A');
        processQueue();
    } else {
        if(onEnd) onEnd();
    }
  }, [isMuted, processQueue, cancel]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
        const nextState = !prev;
        if (nextState) {
            cancel();
        }
        return nextState;
    });
  }, [cancel]);

  useEffect(() => {
    const getAndSetVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length === 0) return;
      
      debug('SPEECH', 'Available synthesis voices:', allVoices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));

      // --- English Voices ---
      const enVoices = allVoices.filter(v => v.lang === 'en-US');
      voices.current.en.female = 
          enVoices.find(v => v.name.includes('Female')) ||
          enVoices.find(v => v.name.includes('Google') && !v.name.includes('Male')) || // Google US English is often female by default
          enVoices.find(v => v.name.includes('Zira')) || // Windows
          enVoices.find(v => v.name.includes('Samantha')) || // macOS
          null;
      voices.current.en.male = 
          enVoices.find(v => v.name.includes('Male')) ||
          enVoices.find(v => v.name.includes('David')) || // Windows
          enVoices.find(v => v.name.includes('Alex')) || // macOS
          null;

      // --- Hindi Voices ---
      const hiVoices = allVoices.filter(v => v.lang === 'hi-IN');
      voices.current.hi.female = 
          hiVoices.find(v => v.name.includes('Female')) ||
          hiVoices.find(v => v.name.includes('Kalpana')) ||
          hiVoices.find(v => v.name.includes('Google')) || // Google Hindi is often female
          null;
      voices.current.hi.male = 
          hiVoices.find(v => v.name.includes('Male')) ||
          hiVoices.find(v => v.name.includes('Hemant')) ||
          null;

      // Basic Fallbacks if gendered voices are not found
      if (!voices.current.en.female && !voices.current.en.male) {
        voices.current.en.female = enVoices[0] || null;
        voices.current.en.male = enVoices[0] || null;
      }
      if (!voices.current.hi.female && !voices.current.hi.male) {
        voices.current.hi.female = hiVoices[0] || null;
        voices.current.hi.male = hiVoices[0] || null;
      }

      debug('SPEECH', 'Voices set', { 
          en_female: voices.current.en.female?.name, 
          en_male: voices.current.en.male?.name,
          hi_female: voices.current.hi.female?.name,
          hi_male: voices.current.hi.male?.name,
      });
    };
    
    window.speechSynthesis.addEventListener('voiceschanged', getAndSetVoices);
    getAndSetVoices();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', getAndSetVoices);
      window.speechSynthesis.cancel();
    };
  }, []);

  return { speak, cancel, isMuted, toggleMute, isSpeaking, spokenText, mouthShape };
};