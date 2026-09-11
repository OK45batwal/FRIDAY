package com.friday.assistant.voice

interface WakeWordEngine { val enabled: Boolean; fun start(); fun stop() }
interface VadEngine { fun isSpeech(frame: ShortArray): Boolean }
interface SpeechRecognizer { fun startListening(); fun stopListening(); fun cancelListening() }
interface SpeechSynthesizer { fun speak(text: String); fun stop(); fun setSpeed(speed: Float) }
