package com.friday.assistant.service;

import android.service.voice.VoiceInteractionService;
import android.util.Log;

public class FridayVoiceInteractionService extends VoiceInteractionService {
    private static final String TAG = "FridayVoiceService";

    @Override
    public void onReady() {
        super.onReady();
        Log.i(TAG, "FRIDAY VoiceInteractionService is READY as Default Assistant.");
    }

    @Override
    public void onShutdown() {
        super.onShutdown();
        Log.i(TAG, "FRIDAY VoiceInteractionService shutting down.");
    }
}
