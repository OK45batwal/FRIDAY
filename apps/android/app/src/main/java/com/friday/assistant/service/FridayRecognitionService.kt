package com.friday.assistant.service

import android.content.Intent
import android.speech.RecognitionService
import android.util.Log

/**
 * System RecognitionService required by VoiceInteractionService.
 */
class FridayRecognitionService : RecognitionService() {

    companion object {
        private const val TAG = "FridayRecogService"
    }

    override fun onStartListening(recognizerIntent: Intent?, listener: Callback?) {
        Log.d(TAG, "onStartListening")
    }

    override fun onStopListening(listener: Callback?) {
        Log.d(TAG, "onStopListening")
    }

    override fun onCancel(listener: Callback?) {
        Log.d(TAG, "onCancel")
    }
}
