package com.friday.assistant.audio

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.Locale

class AssistantAudioEngine(
    private val context: Context,
    private val onSpeechResult: (String) => Unit,
    private val onStateChanged: (AssistantState) => Unit,
    private val onRmsChanged: (Float) => Unit
) : TextToSpeech.OnInitListener {

    enum class AssistantState {
        IDLE,
        LISTENING,
        THINKING,
        SPEAKING
    }

    companion object {
        private const val TAG = "AssistantAudioEngine"
        private const val UTTERANCE_ID = "FRIDAY_RESPONSE"
    }

    private var speechRecognizer: SpeechRecognizer? = null
    private var tts: TextToSpeech? = null
    private var isTtsReady = false

    init {
        tts = TextToSpeech(context, this)
        initSpeechRecognizer()
    }

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        onStateChanged(AssistantState.LISTENING)
                    }

                    override fun onBeginningOfSpeech() {}

                    override fun onRmsChanged(rmsdB: Float) {
                        onRmsChanged(rmsdB)
                    }

                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        onStateChanged(AssistantState.THINKING)
                    }

                    override fun onError(error: Int) {
                        Log.w(TAG, "Speech recognition error code: $error")
                        onStateChanged(AssistantState.IDLE)
                    }

                    override fun onResults(results: Bundle?) {
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val spokenText = matches?.firstOrNull() ?: ""
                        if (spokenText.isNotBlank()) {
                            onSpeechResult(spokenText)
                        } else {
                            onStateChanged(AssistantState.IDLE)
                        }
                    }

                    override fun onPartialResults(partialResults: Bundle?) {}
                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.US
            tts?.setPitch(1.05f)
            tts?.setSpeechRate(1.02f)
            isTtsReady = true

            tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {
                    onStateChanged(AssistantState.SPEAKING)
                }

                override fun onDone(utteranceId: String?) {
                    // Re-arm listening loop for hands-free turn-taking
                    onStateChanged(AssistantState.LISTENING)
                    startListening()
                }

                override fun onError(utteranceId: String?) {
                    onStateChanged(AssistantState.IDLE)
                }
            })
        }
    }

    fun startListening() {
        stopSpeaking()
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }
        speechRecognizer?.startListening(intent)
        onStateChanged(AssistantState.LISTENING)
    }

    fun stopListening() {
        speechRecognizer?.stopListening()
        onStateChanged(AssistantState.IDLE)
    }

    fun speak(text: String) {
        if (isTtsReady && text.isNotBlank()) {
            onStateChanged(AssistantState.SPEAKING)
            tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID)
        }
    }

    fun stopSpeaking() {
        if (tts?.isSpeaking == true) {
            tts?.stop()
        }
    }

    fun destroy() {
        speechRecognizer?.destroy()
        tts?.stop()
        tts?.shutdown()
    }
}
