import { useState, useEffect, useRef, useCallback } from 'react';

const getBaseUrl = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return (import.meta as any).env?.VITE_API_URL || `http://${host || 'localhost'}:8000`;
};

export const useVoice = (onTranscript: (transcript: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isHandsFree, setIsHandsFree] = useState(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>('Tara');
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<any>(null);
  const currentTranscriptRef = useRef<string>('');
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Audio Player & Global User Interaction Unlock
  useEffect(() => {
    const audio = new Audio();
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => {
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
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      stopAcousticAnalyser();
    };
  }, []);

  // Acoustic Frequency Analyser for Live Waveform Orb
  const startAcousticAnalyser = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(avg / 128, 1.0));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();
    } catch (e) {
      console.warn("Could not start acoustic analyser:", e);
    }
  };

  const stopAcousticAnalyser = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  };

  // Process sequential sentence chunks from the audio queue
  const processNextAudioChunk = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isProcessingQueueRef.current = false;
      setIsSpeaking(false);
      // In hands-free mode, resume listening after assistant finishes speaking
      if (isHandsFree && !isListening) {
        startListening();
      }
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
  }, [selectedVoiceName, isHandsFree, isListening]);

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

  // Continuous Zero-Click Voice Activity Detection (VAD)
  const startListening = useCallback(() => {
    stopSpeaking(); // Interrupt assistant on user voice
    startAcousticAnalyser();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Microphone recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          interimText += event.results[i][0].transcript;
        }

        currentTranscriptRef.current = interimText.trim();

        // Zero-Click VAD: reset 650ms silence debounce timer on new speech
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        silenceTimerRef.current = setTimeout(() => {
          if (currentTranscriptRef.current && currentTranscriptRef.current.length > 1) {
            const finalSpeech = currentTranscriptRef.current;
            currentTranscriptRef.current = '';
            onTranscript(finalSpeech);
            if (!isHandsFree) {
              stopListening();
            }
          }
        }, 700);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition notice:", event.error);
        }
      };

      recognition.onend = () => {
        if (isHandsFree && !isSpeaking) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
          stopAcousticAnalyser();
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
      stopAcousticAnalyser();
    }
  }, [onTranscript, stopSpeaking, isHandsFree, isSpeaking]);

  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    stopAcousticAnalyser();
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const toggleHandsFree = useCallback(() => {
    const next = !isHandsFree;
    setIsHandsFree(next);
    if (next && !isListening) {
      startListening();
    } else if (!next && isListening) {
      stopListening();
    }
  }, [isHandsFree, isListening, startListening, stopListening]);

  return {
    isListening,
    isSpeaking,
    autoSpeak,
    isHandsFree,
    audioLevel,
    selectedVoiceName,
    setAutoSpeak,
    setSelectedVoiceName,
    toggleListening,
    toggleHandsFree,
    speak,
    enqueueChunk,
    stopSpeaking
  };
};
