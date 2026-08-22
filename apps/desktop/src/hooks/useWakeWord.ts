import { useState, useEffect, useRef, useCallback } from 'react';
import { playWakeChime } from '../utils/audioChime';

interface UseWakeWordProps {
  enabled: boolean;
  onWake: () => void;
  onCommand: (command: string) => void;
}

export const useWakeWord = ({ enabled, onWake, onCommand }: UseWakeWordProps) => {
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false);
  const [lastWakeTime, setLastWakeTime] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const startWakeWordListener = useCallback(() => {
    if (!enabledRef.current) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningForWakeWord(true);
      };

      recognition.onresult = (event: any) => {
        const results = event.results;
        for (let i = event.resultIndex; i < results.length; i++) {
          const transcript = results[i][0].transcript.toLowerCase().trim();

          // Check for Wake Words: "hey friday", "friday", "hi friday", "ok friday"
          if (
            transcript.includes('hey friday') ||
            transcript.includes('hi friday') ||
            transcript.includes('ok friday') ||
            transcript.includes('hello friday') ||
            transcript.startsWith('friday')
          ) {
            playWakeChime();
            setLastWakeTime(Date.now());
            onWake();

            // Extract any follow-up command spoken in the same utterance
            const command = transcript
              .replace(/hey friday/g, '')
              .replace(/hi friday/g, '')
              .replace(/ok friday/g, '')
              .replace(/hello friday/g, '')

              .replace(/^friday/g, '')
              .trim();

            if (command.length > 2) {
              onCommand(command);
            }
            break;
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.warn("Wake word listener error:", event.error);
        }
      };

      recognition.onend = () => {
        setIsListeningForWakeWord(false);
        // Automatically restart if still enabled
        if (enabledRef.current) {
          setTimeout(() => {
            if (enabledRef.current) {
              try {
                recognition.start();
              } catch (e) {
                // Ignore duplicate start errors
              }
            }
          }, 300);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error("Failed to start wake word listener:", e);
    }
  }, [onWake, onCommand]);

  const stopWakeWordListener = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListeningForWakeWord(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startWakeWordListener();
    } else {
      stopWakeWordListener();
    }

    return () => {
      stopWakeWordListener();
    };
  }, [enabled, startWakeWordListener, stopWakeWordListener]);

  return {
    isListeningForWakeWord,
    lastWakeTime,
    startWakeWordListener,
    stopWakeWordListener
  };
};
