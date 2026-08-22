import { useState, useEffect, useRef, useCallback } from 'react';

const getBaseUrl = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return (import.meta as any).env?.VITE_API_URL || `http://${host || 'localhost'}:8000`;
};

export const useVoice = (onTranscript: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('Tara');
  
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio Player
  useEffect(() => {
    const audio = new Audio();
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.onerror = () => setIsSpeaking(false);
    audioPlayerRef.current = audio;

    const unlockAudio = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.resume();
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);

    return () => {
      audio.pause();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  // Simple, Direct Speech Recognition
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone recognition is not supported in this browser. Please use Google Chrome or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (event.results[0].isFinal && currentTranscript.trim()) {
          onTranscript(currentTranscript.trim());
          setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Multi-Tier Resilient Speech Synthesis
  const speak = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;

    // Clean text into short summary for voice
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanText) return;

    // Pick first 2 sentences for fast audio delivery
    const sentences = cleanText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 3);
    const spokenText = sentences.slice(0, 2).join(' ').trim() || cleanText.slice(0, 150);

    // 1. Try Backend Audio Synthesis via POST with Blob playback
    try {
      const response = await fetch(`${getBaseUrl()}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText, voice: selectedVoiceName })
      });

      if (response.ok && response.status === 200) {
        const blob = await response.blob();
        if (blob.size > 200) {
          const blobUrl = URL.createObjectURL(blob);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.src = blobUrl;
            await audioPlayerRef.current.play();
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Backend audio synthesis fetch failed, using browser Web Speech:", err);
    }

    // 2. Instant Zero-Failure Browser Speech Synthesis Fallback
    fallbackWebSpeech(spokenText);
  }, [selectedVoiceName]);

  const fallbackWebSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v =>
        v.name.includes('Tara') ||
        v.name.includes('Samantha') ||
        v.name.includes('Rishi') ||
        v.name.includes('Karen') ||
        v.lang.startsWith('en')
      );

      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Web Speech error:", err);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    autoSpeak,
    setAutoSpeak,
    selectedVoiceName,
    setSelectedVoiceName,
    toggleListening,
    speak,
    stopSpeaking
  };
};
