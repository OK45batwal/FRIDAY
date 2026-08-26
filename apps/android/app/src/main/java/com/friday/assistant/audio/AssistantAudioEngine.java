package com.friday.assistant.audio;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.util.Log;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Set;

public class AssistantAudioEngine implements TextToSpeech.OnInitListener {
    public enum AssistantState { IDLE, LISTENING, THINKING, SPEAKING }

    public interface SpeechCallback {
        void onResult(String finalTranscript);
        void onPartialResult(String partialTranscript);
    }

    public interface StateCallback {
        void onState(AssistantState state);
        void onRmsAmplitude(float rmsdB);
    }

    private static final String TAG = "AssistantAudioEngine";
    private static final String UTTERANCE_ID = "FRIDAY_RESPONSE";

    private final Context context;
    private final SpeechCallback speechCallback;
    private final StateCallback stateCallback;
    private SpeechRecognizer speechRecognizer;
    private TextToSpeech tts;
    private boolean isTtsReady = false;
    private boolean isContinuousListening = false;

    public AssistantAudioEngine(Context context, SpeechCallback speechCallback, StateCallback stateCallback) {
        this.context = context;
        this.speechCallback = speechCallback;
        this.stateCallback = stateCallback;
        this.tts = new TextToSpeech(context, this);
        initSpeechRecognizer();
    }

    private void initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context);
            speechRecognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onReadyForSpeech(Bundle params) {
                    stateCallback.onState(AssistantState.LISTENING);
                }

                @Override public void onBeginningOfSpeech() {}

                @Override public void onRmsChanged(float rmsdB) {
                    stateCallback.onRmsAmplitude(rmsdB);
                }

                @Override public void onBufferReceived(byte[] buffer) {}

                @Override public void onEndOfSpeech() {
                    stateCallback.onState(AssistantState.THINKING);
                }

                @Override public void onError(int error) {
                    Log.w(TAG, "Speech error code: " + error);
                    stateCallback.onState(AssistantState.IDLE);
                }

                @Override public void onResults(Bundle results) {
                    ArrayList<String> matches = results != null ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
                    String spoken = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                    if (!spoken.trim().isEmpty()) {
                        speechCallback.onResult(spoken);
                    } else {
                        stateCallback.onState(AssistantState.IDLE);
                    }
                }

                @Override public void onPartialResults(Bundle partialResults) {
                    ArrayList<String> partials = partialResults != null ? partialResults.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
                    if (partials != null && !partials.isEmpty()) {
                        speechCallback.onPartialResult(partials.get(0));
                    }
                }

                @Override public void onEvent(int eventType, Bundle params) {}
            });
        }
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            tts.setLanguage(Locale.US);
            tts.setPitch(1.04f);
            tts.setSpeechRate(1.03f);

            // Select most natural voice if available
            try {
                Set<Voice> voices = tts.getVoices();
                if (voices != null) {
                    for (Voice v : voices) {
                        if (v.getLocale().equals(Locale.US) && !v.isNetworkConnectionRequired() && v.getQuality() >= Voice.QUALITY_HIGH) {
                            tts.setVoice(v);
                            break;
                        }
                    }
                }
            } catch (Exception ignored) {}

            isTtsReady = true;

            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) {
                    stateCallback.onState(AssistantState.SPEAKING);
                }

                @Override public void onDone(String utteranceId) {
                    stateCallback.onState(AssistantState.IDLE);
                    if (isContinuousListening) {
                        startListening();
                    }
                }

                @Override public void onError(String utteranceId) {
                    stateCallback.onState(AssistantState.IDLE);
                }
            });
        }
    }

    public void startListening() {
        stopSpeaking();
        if (speechRecognizer != null) {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
            intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L);
            intent.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1200L);

            try {
                speechRecognizer.startListening(intent);
                stateCallback.onState(AssistantState.LISTENING);
            } catch (Exception e) {
                Log.e(TAG, "Failed starting speech recognizer", e);
            }
        }
    }

    public void stopListening() {
        if (speechRecognizer != null) {
            try { speechRecognizer.stopListening(); } catch (Exception ignored) {}
        }
        stateCallback.onState(AssistantState.IDLE);
    }

    public void speak(String text) {
        if (isTtsReady && text != null && !text.trim().isEmpty()) {
            stateCallback.onState(AssistantState.SPEAKING);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID);
        }
    }

    public void stopSpeaking() {
        if (tts != null && tts.isSpeaking()) {
            tts.stop();
        }
    }

    public void setContinuousListening(boolean enabled) {
        this.isContinuousListening = enabled;
    }

    public void destroy() {
        if (speechRecognizer != null) {
            try { speechRecognizer.destroy(); } catch (Exception ignored) {}
        }
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
    }
}
