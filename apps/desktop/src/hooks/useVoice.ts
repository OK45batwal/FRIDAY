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
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);

  // Initialize Audio Player
  useEffect(() => {
    const audio = new Audio();
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
      // Process next queued sentence chunk
      processNextAudioChunk();
    };
    audio.onerror = () => {
      processNextAudioChunk();
    };
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

  // Process sequential sentence chunks from the audio queue
  const processNextAudioChunk = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      return;
    }

    isProcessingQueueRef.current = true;
    const nextChunk = audioQueueRef.current.shift();
    if (!nextChunk || !nextChunk.trim()) {
      processNextAudioChunk();
      return;
    }

    const cleanText = nextChunk
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .replace(/https?:\/\/\S+/g, 'link')
      .trim();

    if (!cleanText) {
      processNextAudioChunk();
      return;
    }

    // 1. Try Backend Neural Audio Stream
    try {
      const response = await fetch(`${getBaseUrl()}/api/voice/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText, voice: selectedVoiceName })
      });

      if (response.ok && response.status === 200) {
        const blob = await response.blob();
        if (blob.size > 200) {
          const blobUrl = URL.createObjectURL(blob);
          if (audioPlayerRef.current) {
            audioPlayerRef.current.src = blobUrl;
            await audioPlayerRef.current.play();
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Backend audio synthesis fetch failed, using browser Web Speech:", err);
    }

    // 2. Browser Web Speech Fallback for chunk
    fallbackWebSpeech(cleanText, () => processNextAudioChunk());
  }, [selectedVoiceName]);

  // Enqueue incoming sentence chunk for sub-250ms streaming TTS
  const enqueueChunk = useCallback((chunk: string) => {
    if (!autoSpeak || !chunk.trim()) return;
    audioQueueRef.current.push(chunk.trim());
    if (!isProcessingQueueRef.current) {
      processNextAudioChunk();
    }
  }, [autoSpeak, processNextAudioChunk]);

  // Full response speak fallback
  const speak = useCallback(async (text: string) => {
    if (!text || !text.trim()) return;
    audioQueueRef.current = [text];
    processNextAudioChunk();
  }, [processNextAudioChunk]);

  const fallbackWebSpeech = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.08;
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
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Web Speech error:", err);
      setIsSpeaking(false);
      onEnd?.();
    }
  };

  const stopSpeaking = useCallback(() => {
    audioQueueRef.current = [];
    isProcessingQueueRef.current = false;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Simple, Direct Speech Recognition
  const startListening = useCallback(() => {
    stopSpeaking(); // Interrupt active speech when user speaks

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
  }, [onTranscript, stopSpeaking]);

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

  return {
    isListening,
    isSpeaking,
    autoSpeak,
    setAutoSpeak,
    selectedVoiceName,
    setSelectedVoiceName,
    toggleListening,
    speak,
    enqueueChunk,
    stopSpeaking
  };
};
