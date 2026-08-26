package com.friday.assistant.service

import android.os.Bundle
import android.service.voice.VoiceInteractionSession
import android.service.voice.VoiceInteractionSessionService
import com.friday.assistant.session.FridayVoiceSession

/**
 * Service that creates active assistant interaction sessions when the user
 * triggers the assistant gesture (Power long-press, corner swipe, home hold).
 */
class FridayVoiceSessionService : VoiceInteractionSessionService() {

    override fun onNewSession(args: Bundle?): VoiceInteractionSession {
        return FridayVoiceSession(this)
    }
}
