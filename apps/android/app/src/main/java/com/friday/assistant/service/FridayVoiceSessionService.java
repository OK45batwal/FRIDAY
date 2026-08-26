package com.friday.assistant.service;

import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;
import android.service.voice.VoiceInteractionSessionService;
import com.friday.assistant.session.FridayVoiceSession;

public class FridayVoiceSessionService extends VoiceInteractionSessionService {
    @Override
    public VoiceInteractionSession onNewSession(Bundle args) {
        return new FridayVoiceSession(this);
    }
}
