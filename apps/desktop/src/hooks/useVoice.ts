import { useState, useEffect, useRef, useCallback } from 'react';
import { playWakeChime } from '../utils/audioChime';

export const useVoice = (
  onTranscript: (transcript: string) => void,
  wakeWordEnabled: boolean = true
) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const wakeWordEnabledRef = useRef(wakeWordEnabled);
  wakeWordEnabledRef.current = wakeWordEnabled;

  // Load available system voices
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Best Female Voices prioritized for FRIDAY (Irish, British, Studio US)
        const preferred = voices.find(v => 
          v.name.includes('Moira') || // Marvel FRIDAY Irish voice
          v.name.includes('Samantha') || // macOS Studio female
          v.name.includes('Sonia') || // Edge Natural British female
          v.name.includes('Libby') ||
          v.name.includes('Ava') ||
          v.name.includes('Karen') ||
          v.name.includes('Victoria') ||
          (v.name.includes('Female') && v.lang.startsWith('en'))
        );

        if (preferred && !selectedVoiceName) {
          setSelectedVoiceName(preferred.name);
        }
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceName]);

  // Unified High-Speed Speech Recognition & Wake Word Engine
  const startRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      // Background listener active
    };

    recognition.onresult = (event: any) => {
      const results = event.results;
      for (let i = event.resultIndex; i < results.length; i++) {
        const item = results[i];
        const transcript = item[0].transcript.toLowerCase().trim();
        const isFinal = item.isFinal;

        // 1. Instant Wake Word Detection ("hey friday", "friday", "hi friday")
        if (
          wakeWordEnabledRef.current &&
          (transcript.includes('hey friday') ||
           transcript.includes('hi friday') ||
           transcript.includes('ok friday') ||
           transcript.includes('hello friday') ||
           transcript.startsWith('friday'))
        ) {
          if (!isListeningRef.current) {
            playWakeChime();
            setIsListening(true);
            isListeningRef.current = true;
          }

          // Extract follow-up command in the same utterance
          const cleanedCommand = transcript
            .replace(/hey friday/g, '')
            .replace(/hi friday/g, '')
            .replace(/ok friday/g, '')
            .replace(/hello friday/g, '')
            .replace(/^friday/g, '')
            .trim();

          if (isFinal && cleanedCommand.length > 1) {
            onTranscript(cleanedCommand);
            setIsListening(false);
            isListeningRef.current = false;
          }
          return;
        }

        // 2. Direct Manual Voice Command (if user clicked Talk / Mic)
        if (isListeningRef.current && isFinal && transcript.length > 0) {
          onTranscript(transcript);
          setIsListening(false);
          isListeningRef.current = false;
        }
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn("Speech recognition error:", event.error);
      }
    };

    recognition.onend = () => {
      // Auto-restart continuously for zero-latency wake word listening
      setTimeout(() => {
        try {
          recognition.start();
        } catch (e) {
          // Ignore restart collisions
        }
      }, 200);
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
    }
  }, [onTranscript]);

  useEffect(() => {
    startRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, [startRecognition]);

  const toggleListening = useCallback(() => {
    if (!isListening) {
      playWakeChime();
      setIsListening(true);
      isListeningRef.current = true;
    } else {
      setIsListening(false);
      isListeningRef.current = false;
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean text of markdown markers (*, #, `) for cleaner speech
    const cleanText = text
      .replace(/[*#`_~]/g, '')
      .replace(/```[\s\S]*?```/g, 'Code block output.')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05; // Fast, snappy response rate
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.name === selectedVoiceName);

    if (!voice) {
      voice = voices.find(v => 
        v.name.includes('Moira') ||
        v.name.includes('Samantha') ||
        v.name.includes('Sonia') ||
        v.name.includes('Ava') ||
        v.lang.startsWith('en')
      );
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [selectedVoiceName]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    autoSpeak,
    setAutoSpeak,
    availableVoices,
    selectedVoiceName,
    setSelectedVoiceName,
    toggleListening,
    speak,
    stopSpeaking
  };
};
