import { useState, useEffect, useRef, useCallback } from 'react';

export const useVoice = (onTranscript: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Load available system voices
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);

        // Best Female Voices prioritized for FRIDAY (Irish, British, Sophisticated US)
        const preferred = voices.find(v => 
          v.name.includes('Moira') || // Marvel FRIDAY Irish voice
          v.name.includes('Samantha') || // macOS Studio crisp female
          v.name.includes('Sonia') || // Edge Natural British female
          v.name.includes('Libby') || // British female
          v.name.includes('Ava') || // Natural AI female
          v.name.includes('Karen') || // Australian/English female
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

  // Speech Recognition (Microphone)
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      if (text) {
        onTranscript(text);
      }
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  }, [isListening]);

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // Clean text of markdown markers (*, #, `) for cleaner speech
    const cleanText = text
      .replace(/[*#`_~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.02; // Slightly higher pitch for poised intelligence

    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.name === selectedVoiceName);

    if (!voice) {
      // Fallback to top female voices
      voice = voices.find(v => 
        v.name.includes('Moira') ||
        v.name.includes('Samantha') ||
        v.name.includes('Sonia') ||
        v.name.includes('Libby') ||
        v.name.includes('Ava') ||
        v.name.includes('Karen') ||
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
