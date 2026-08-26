package com.friday.assistant.audio;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.util.Log;
import java.util.ArrayList;
import java.util.Locale;

public class AssistantAudioEngine implements TextToSpeech.OnInitListener {
    public enum AssistantState { IDLE, LISTENING, THINKING, SPEAKING }

    public interface SpeechCallback { void onResult(String text); }
    public interface StateCallback { void onState(AssistantState state); }

    private static final String TAG = "AssistantAudioEngine";
    private static final String UTTERANCE_ID = "FRIDAY_RESPONSE";

    private final Context context;
    private final SpeechCallback speechCallback;
    private final StateCallback stateCallback;
    private SpeechRecognizer speechRecognizer;
    private TextToSpeech tts;
    private boolean isTtsReady = false;

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
                @Override public void onReadyForSpeech(Bundle params) { stateCallback.onState(AssistantState.LISTENING); }
                @Override public void onBeginningOfSpeech() {}
                @Override public void onRmsChanged(float rmsdB) {}
                @Override public void onBufferReceived(byte[] buffer) {}

                @Override public void onEndOfSpeech() { stateCallback.onState(AssistantState.THINKING); }
                @Override public void onError(int error) { Log.w(TAG, "Speech error: " + error); stateCallback.onState(AssistantState.IDLE); }
                @Override public void onResults(Bundle results) {
                    ArrayList<String> matches = results != null ? results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION) : null;
                    String spoken = (matches != null && !matches.isEmpty()) ? matches.get(0) : "";
                    if (!spoken.trim().isEmpty()) {
                        speechCallback.onResult(spoken);
                    } else {
                        stateCallback.onState(AssistantState.IDLE);
                    }
                }
                @Override public void onPartialResults(Bundle partialResults) {}
                @Override public void onEvent(int eventType, Bundle params) {}
            });
        }
    }

    @Override
    public void onInit(int status) {
        if (status == TextToSpeech.SUCCESS) {
            tts.setLanguage(Locale.US);
            tts.setPitch(1.05f);
            tts.setSpeechRate(1.02f);
            isTtsReady = true;
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String utteranceId) { stateCallback.onState(AssistantState.SPEAKING); }
                @Override public void onDone(String utteranceId) {
                    stateCallback.onState(AssistantState.LISTENING);
                    startListening();
                }
                @Override public void onError(String utteranceId) { stateCallback.onState(AssistantState.IDLE); }
            });
        }
    }

    public void startListening() {
        stopSpeaking();
        if (speechRecognizer != null) {
            Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
            intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault());
            intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
            speechRecognizer.startListening(intent);
            stateCallback.onState(AssistantState.LISTENING);
        }
    }

    public void stopListening() {
        if (speechRecognizer != null) speechRecognizer.stopListening();
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

    public void destroy() {
        if (speechRecognizer != null) speechRecognizer.destroy();
        if (tts != null) {
            tts.stop();
            tts.shutdown();
        }
    }
}
