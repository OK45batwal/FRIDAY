package com.friday.assistant.audio;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.util.Log;
import java.util.ArrayList;
import java.util.Locale;

/**
 * Continuous Hotword / Wake-Word Detection Engine.
 * Listens in the background/foreground for "Hey Friday", "Friday", or "Ok Friday"
 * and triggers the active assistant voice session without requiring screen touch.
 */
public class WakeWordEngine {
    private static final String TAG = "WakeWordEngine";

    public interface WakeWordCallback {
        void onWakeWordDetected(String detectedPhrase);
    }

    private final Context context;
    private final WakeWordCallback callback;
    private SpeechRecognizer speechRecognizer;
    private boolean isListening = false;
    private boolean isPaused = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public WakeWordEngine(Context context, WakeWordCallback callback) {
        this.context = context;
        this.callback = callback;
        initRecognizer();
    }

    private void initRecognizer() {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            Log.w(TAG, "SpeechRecognizer is unavailable for Wake Word engine.");
            return;
        }

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context);
        speechRecognizer.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle params) {}
            @Override public void onBeginningOfSpeech() {}
            @Override public void onRmsChanged(float rmsdB) {}
            @Override public void onBufferReceived(byte[] buffer) {}
            @Override public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                // Restart listening after brief delay if still active
                if (isListening && !isPaused) {
                    mainHandler.postDelayed(new Runnable() {
                        @Override public void run() {
                            restartListening();
                        }
                    }, 500);
                }
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results != null ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
                if (matches != null) {
                    for (String text : matches) {
                        if (isWakeWordMatch(text)) {
                            Log.i(TAG, "Wake word match found: " + text);
                            callback.onWakeWordDetected(text);
                            return;
                        }
                    }
                }
                // Continue continuous listening loop
                if (isListening && !isPaused) {
                    restartListening();
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> partials = partialResults != null ? partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
                if (partials != null) {
                    for (String text : partials) {
                        if (isWakeWordMatch(text)) {
                            Log.i(TAG, "Wake word partial match: " + text);
                            stopListening();
                            callback.onWakeWordDetected(text);
                            return;
                        }
                    }
                }
            }

            @Override public void onEvent(int eventType, Bundle params) {}
        });
    }

    private boolean isWakeWordMatch(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase().trim();
        return lower.contains("friday") || 
               lower.contains("hey friday") || 
               lower.contains("ok friday") || 
               lower.contains("hi friday") ||
               lower.contains("hey google") ||
               lower.contains("ok google");
    }

    public void startListening() {
        if (speechRecognizer == null) return;
        isListening = true;
        isPaused = false;
        restartListening();
    }

    public void pause() {
        isPaused = true;
        if (speechRecognizer != null) {
            try { speechRecognizer.stopListening(); } catch (Exception ignored) {}
        }
    }

    public void resume() {
        isPaused = false;
        if (isListening) {
            restartListening();
        }
    }

    public void stopListening() {
        isListening = false;
        isPaused = false;
        if (speechRecognizer != null) {
            try {
                speechRecognizer.stopListening();
                speechRecognizer.cancel();
            } catch (Exception ignored) {}
        }
    }

    private void restartListening() {
        if (!isListening || isPaused || speechRecognizer == null) return;
        try {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
            speechRecognizer.startListening(intent);
        } catch (Exception e) {
            Log.e(TAG, "Error starting wake word recognizer", e);
        }
    }

    public void destroy() {
        stopListening();
        if (speechRecognizer != null) {
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
        }
    }
}
