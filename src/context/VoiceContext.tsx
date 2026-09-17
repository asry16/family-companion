import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

interface VoiceContextValue {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  startListening: (onResult?: (text: string) => void) => void;
  stopListening: () => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  clearTranscript: () => void;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');

  const speak = useCallback((text: string) => {
    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*_#`[\]()•]/g, '').trim();
    if (!cleanText) return;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(true);
      Speech.speak(cleanText, {
        rate: 0.95,
        pitch: 1.0,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    } else {
      Speech.stop();
    }
    setIsSpeaking(false);
  }, []);

  const startListening = useCallback((onResult?: (text: string) => void) => {
    setIsListening(true);
    setTranscript('');

    // If Web Speech API is available in browser
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            const current = event.resultIndex;
            const text = event.results[current][0].transcript;
            setTranscript(text);
            if (event.results[current].isFinal) {
              setIsListening(false);
              if (onResult) onResult(text);
            }
          };

          recognition.onerror = () => {
            setIsListening(false);
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognition.start();
          return;
        } catch (e) {
          console.warn('SpeechRecognition initialization error:', e);
        }
      }
    }

    // Fallback simulation timer for environments without direct mic permission
    const simulatedQueries = [
      'Where is Dad?',
      'What do I need to do today?',
      'Where is Dad\'s passport?',
      'Did we pay the electricity bill?',
      'When is Mom\'s appointment?',
    ];
    const pickedQuery = simulatedQueries[Math.floor(Math.random() * simulatedQueries.length)];

    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex += 2;
      if (charIndex <= pickedQuery.length) {
        setTranscript(pickedQuery.slice(0, charIndex));
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsListening(false);
          if (onResult) onResult(pickedQuery);
        }, 300);
      }
    }, 60);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        isListening,
        isSpeaking,
        transcript,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        clearTranscript,
      }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const ctx = useContext(VoiceContext);
  if (!ctx) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return ctx;
};
