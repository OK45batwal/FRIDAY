package com.friday.assistant.service

import android.content.Intent
import android.service.voice.VoiceInteractionService
import android.util.Log

/**
 * Official Android System Digital Assistant Service.
 * Allows FRIDAY to be registered as the phone's Default Digital Assistant.
 */
class FridayVoiceInteractionService : VoiceInteractionService() {

    companion object {
        private const val TAG = "FridayVoiceService"
    }

    override fun onReady() {
        super.onReady()
        Log.i(TAG, "FRIDAY VoiceInteractionService is READY and active as system assistant.")
    }

    override fun onShutdown() {
        super.onShutdown()
        Log.i(TAG, "FRIDAY VoiceInteractionService shutting down.")
    }
}
