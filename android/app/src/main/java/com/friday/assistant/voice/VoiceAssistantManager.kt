package com.friday.assistant.voice

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
import java.util.UUID
import kotlin.math.abs
import kotlin.random.Random

interface VoiceEventListener {
    fun onListeningStarted()
    fun onRmsChanged(levels: List<Float>)
    fun onPartialTranscript(text: String)
    fun onFinalTranscript(text: String)
    fun onSpeechError(errorMessage: String)
    fun onSpeakingStarted()
    fun onSpeakingFinished()
}

class VoiceAssistantManager(
    private val context: Context,
    private val listener: VoiceEventListener
) : TextToSpeech.OnInitListener {

    private var speechRecognizer: SpeechRecognizer? = null
    private var textToSpeech: TextToSpeech? = null
    private var isTtsReady = false

    init {
        initSpeechRecognizer()
        initTts()
    }

    private fun initSpeechRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(createRecognitionListener())
            }
        }
    }

    private fun initTts() {
        textToSpeech = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = textToSpeech?.setLanguage(Locale.US)
            if (result != TextToSpeech.LANG_MISSING_DATA && result != TextToSpeech.LANG_NOT_SUPPORTED) {
                textToSpeech?.setPitch(1.0f)
                textToSpeech?.setSpeechRate(1.05f)
                isTtsReady = true

                textToSpeech?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                    override fun onStart(utteranceId: String?) {
                        listener.onSpeakingStarted()
                    }

                    override fun onDone(utteranceId: String?) {
                        listener.onSpeakingFinished()
                    }

                    @Deprecated("Deprecated in Java")
                    override fun onError(utteranceId: String?) {
                        listener.onSpeakingFinished()
                    }
                })
            }
        }
    }

    fun startListening() {
        stopSpeaking()
        if (speechRecognizer == null) {
            initSpeechRecognizer()
        }

        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            listener.onSpeechError("Speech recognition is not available on this device.")
            return
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
        }

        try {
            speechRecognizer?.startListening(intent)
            listener.onListeningStarted()
        } catch (e: Exception) {
            listener.onSpeechError("Failed to start voice listener: ${e.message}")
        }
    }

    fun stopListening() {
        try {
            speechRecognizer?.stopListening()
        } catch (e: Exception) {
            Log.e("VoiceManager", "Error stopping listening: ${e.message}")
        }
    }

    fun cancelListening() {
        try {
            speechRecognizer?.cancel()
        } catch (e: Exception) {
            Log.e("VoiceManager", "Error canceling listening: ${e.message}")
        }
    }

    fun speak(text: String) {
        if (!isTtsReady || textToSpeech == null) {
            // Re-init TTS if needed
            initTts()
            return
        }

        val cleanText = text
            .replace(Regex("\\[TOOL:[^\\]]+\\]"), "")
            .replace(Regex("[*#_`~]"), "")
            .trim()

        if (cleanText.isEmpty()) return

        val utteranceId = UUID.randomUUID().toString()
        textToSpeech?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    fun stopSpeaking() {
        try {
            if (textToSpeech?.isSpeaking == true) {
                textToSpeech?.stop()
                listener.onSpeakingFinished()
            }
        } catch (e: Exception) {
            Log.e("VoiceManager", "Error stopping TTS: ${e.message}")
        }
    }

    fun isSpeaking(): Boolean = textToSpeech?.isSpeaking == true

    private fun createRecognitionListener(): RecognitionListener {
        return object : RecognitionListener {
            override fun onReadyForSpeech(params: Bundle?) {
                listener.onListeningStarted()
            }

            override fun onBeginningOfSpeech() {
                listener.onListeningStarted()
            }

            override fun onRmsChanged(rmsdB: Float) {
                // Map rmsdB (-2f to 10f) to 16 normalized decibel spectrum bands (0.15f to 1.0f)
                val base = ((rmsdB + 2f) / 12f).coerceIn(0.12f, 0.95f)
                val levels = List(16) { index ->
                    val variance = (Random.nextFloat() * 0.25f) - 0.12f
                    (base + variance).coerceIn(0.12f, 1.0f)
                }
                listener.onRmsChanged(levels)
            }

            override fun onBufferReceived(buffer: ByteArray?) {}

            override fun onEndOfSpeech() {
                // Stopped speaking, processing
            }

            override fun onError(error: Int) {
                val msg = when (error) {
                    SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                    SpeechRecognizer.ERROR_CLIENT -> "Client error"
                    SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission required"
                    SpeechRecognizer.ERROR_NETWORK -> "Network error during speech recognition"
                    SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout"
                    SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized. Tap to try again."
                    SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer busy"
                    SpeechRecognizer.ERROR_SERVER -> "Server error"
                    SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech detected"
                    else -> "Speech recognition paused"
                }
                listener.onSpeechError(msg)
            }

            override fun onResults(results: Bundle?) {
                val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val sentence = matches?.firstOrNull() ?: ""
                if (sentence.isNotEmpty()) {
                    listener.onFinalTranscript(sentence)
                } else {
                    listener.onSpeechError("No speech detected. Please speak clearly.")
                }
            }

            override fun onPartialResults(partialResults: Bundle?) {
                val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                val partial = matches?.firstOrNull() ?: ""
                if (partial.isNotEmpty()) {
                    listener.onPartialTranscript(partial)
                }
            }

            override fun onEvent(eventType: Int, params: Bundle?) {}
        }
    }

    fun destroy() {
        try {
            speechRecognizer?.destroy()
            textToSpeech?.stop()
            textToSpeech?.shutdown()
        } catch (e: Exception) {
            Log.e("VoiceManager", "Error in destroy: ${e.message}")
        }
    }
}
