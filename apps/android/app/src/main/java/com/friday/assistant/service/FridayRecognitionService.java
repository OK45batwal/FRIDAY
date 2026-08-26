package com.friday.assistant.service;

import android.content.Intent;
import android.speech.RecognitionService;
import android.util.Log;

public class FridayRecognitionService extends RecognitionService {
    private static final String TAG = "FridayRecognition";

    @Override
    protected void onStartListening(Intent recognizerIntent, Callback listener) {
        Log.d(TAG, "onStartListening");
    }

    @Override
    protected void onStopListening(Callback listener) {
        Log.d(TAG, "onStopListening");
    }

    @Override
    protected void onCancel(Callback listener) {
        Log.d(TAG, "onCancel");
    }
}
