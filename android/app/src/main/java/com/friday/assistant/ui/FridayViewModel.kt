package com.friday.assistant.ui

import android.app.Application
import android.media.AudioManager
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.friday.assistant.data.FridayDatabase
import com.friday.assistant.data.MessageEntity
import com.friday.assistant.device.DeviceActionManager
import com.friday.assistant.device.HardwareTelemetry
import com.friday.assistant.network.BackendHealth
import com.friday.assistant.network.FridayApiClient
import com.friday.assistant.network.GrammarResult
import com.friday.assistant.network.ToolResult
import com.friday.assistant.service.FridayAccessibilityService
import com.friday.assistant.service.FridayFloatingService
import com.friday.assistant.voice.VoiceAssistantManager
import com.friday.assistant.voice.VoiceEventListener
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class ConsoleTab { CHAT, VOICE, TOOLS, ASSIST, STATUS }
enum class AssistantState { IDLE, LISTENING, THINKING, EXECUTING, SPEAKING, ERROR }

data class FridayUiState(
    val currentTab: ConsoleTab = ConsoleTab.CHAT,
    val assistantState: AssistantState = AssistantState.IDLE,
    val inputText: String = "",
    val messages: List<MessageEntity> = emptyList(),
    val isSending: Boolean = false,
    val backendHealth: BackendHealth = BackendHealth(isOnline = false),
    val serviceEnabled: Boolean = false,
    val microphoneGranted: Boolean = false,
    val audioLevels: List<Float> = List(16) { 0.15f },
    val actionLedger: List<ToolResult> = emptyList(),
    val latestVoiceTranscript: String = "Tap PUSH TO TALK to speak to FRIDAY",
    val isFloatingRunning: Boolean = false,
    val isAccessibilityRunning: Boolean = false,
    val sandboxInput: String = "he dont know what time is the meeting and i has to tell him",
    val sandboxResult: GrammarResult? = null,
    val isAnalyzing: Boolean = false,
    val selectedWritingMode: String = "Grammar",
    val selectedTargetLang: String = "Spanish",
    val hardwareTelemetry: HardwareTelemetry? = null,
    val isTorchOn: Boolean = false,
    val volumePercent: Int = 50,
    val pingMs: Long = -1L,
    val customServerUrl: String = "http://10.0.2.2:8080",
)

class FridayViewModel(application: Application) : AndroidViewModel(application), VoiceEventListener {

    var state by mutableStateOf(FridayUiState())
        private set

    val apiClient = FridayApiClient()
    val deviceManager = DeviceActionManager(application)
    private val voiceManager = VoiceAssistantManager(application, this)
    private val db = FridayDatabase.getInstance(application)
    private val messageDao = db.messageDao()

    init {
        loadMessages()
        refreshHealth()
        refreshServiceStates()
        refreshDeviceStats()
    }

    fun selectTab(tab: ConsoleTab) {
        state = state.copy(currentTab = tab)
        refreshServiceStates()
        if (tab == ConsoleTab.TOOLS || tab == ConsoleTab.STATUS) {
            refreshDeviceStats()
        }
    }

    fun onInputTextChange(text: String) {
        state = state.copy(inputText = text)
    }

    fun setPermissionsGranted(granted: Boolean) {
        state = state.copy(microphoneGranted = granted)
    }

    fun setServiceEnabled(enabled: Boolean) {
        state = state.copy(serviceEnabled = enabled)
    }

    fun refreshServiceStates() {
        state = state.copy(
            isFloatingRunning = FridayFloatingService.isRunning,
            isAccessibilityRunning = FridayAccessibilityService.isRunning
        )
    }

    fun refreshDeviceStats() {
        val telem = deviceManager.getHardwareTelemetry()
        val vol = deviceManager.getVolumePercent()
        val torch = deviceManager.isTorchActive()
        state = state.copy(
            hardwareTelemetry = telem,
            volumePercent = vol,
            isTorchOn = torch
        )
    }

    fun setCustomServerUrl(url: String) {
        val clean = url.trim()
        if (clean.isNotEmpty()) {
            apiClient.baseUrl = clean
            state = state.copy(customServerUrl = clean)
            refreshHealth()
        }
    }

    fun refreshHealth() {
        viewModelScope.launch {
            val latency = apiClient.pingLatency()
            val health = apiClient.checkHealth()
            state = state.copy(
                backendHealth = health,
                pingMs = latency
            )
            refreshServiceStates()
        }
    }

    // -------------------------------------------------------------------------
    // Chat & Messaging
    // -------------------------------------------------------------------------
    private fun loadMessages() {
        viewModelScope.launch {
            val history = messageDao.getRecentMessages(50).reversed()
            if (history.isEmpty()) {
                val welcome = MessageEntity(
                    role = "assistant",
                    text = "FRIDAY Local Intelligence Core active. System-wide Siri Assistant, WhatsApp/Gmail writing companion, and device tools ready."
                )
                messageDao.insert(welcome)
                state = state.copy(messages = listOf(welcome))
            } else {
                state = state.copy(messages = history)
            }
        }
    }

    fun sendMessage(customText: String? = null, speakOutput: Boolean = false) {
        val textToSend = (customText ?: state.inputText).trim()
        if (textToSend.isEmpty()) return

        state = state.copy(inputText = "", isSending = true, assistantState = AssistantState.THINKING)

        viewModelScope.launch {
            val userMsg = MessageEntity(role = "user", text = textToSend)
            messageDao.insert(userMsg)
            state = state.copy(messages = state.messages + userMsg)

            // Check if user is asking for device action (torch, time, battery)
            val replyText = handlePotentialDeviceCommand(textToSend) ?: run {
                val result = apiClient.sendChat(textToSend)
                state = state.copy(backendHealth = state.backendHealth.copy(isOnline = result.isOnline))
                result.reply
            }

            val replyMsg = MessageEntity(role = "assistant", text = replyText)
            messageDao.insert(replyMsg)

            state = state.copy(
                messages = state.messages + replyMsg,
                isSending = false,
                assistantState = AssistantState.IDLE
            )

            if (speakOutput) {
                voiceManager.speak(replyText)
            }
        }
    }

    private suspend fun handlePotentialDeviceCommand(text: String): String? {
        val lower = text.lowercase().trim()
        return when {
            lower.contains("torch on") || lower.contains("flashlight on") -> {
                if (!deviceManager.isTorchActive()) deviceManager.toggleTorch()
                state = state.copy(isTorchOn = true)
                "[TOOL: TORCH] Flashlight turned ON 💡"
            }
            lower.contains("torch off") || lower.contains("flashlight off") -> {
                if (deviceManager.isTorchActive()) deviceManager.toggleTorch()
                state = state.copy(isTorchOn = false)
                "[TOOL: TORCH] Flashlight turned OFF"
            }
            lower.contains("what time") || lower.contains("current time") -> {
                val time = deviceManager.getClockInfo()
                "[TOOL: CLOCK] $time"
            }
            lower.contains("weather") -> {
                val weather = deviceManager.fetchLiveWeather()
                "[TOOL: WEATHER] $weather"
            }
            lower.contains("open whatsapp") -> {
                val (ok, msg) = deviceManager.launchApp("whatsapp")
                "[TOOL: LAUNCH] $msg"
            }
            lower.contains("open gmail") -> {
                val (ok, msg) = deviceManager.launchApp("gmail")
                "[TOOL: LAUNCH] $msg"
            }
            lower.contains("open chrome") || lower.contains("open browser") -> {
                val (ok, msg) = deviceManager.launchApp("chrome")
                "[TOOL: LAUNCH] $msg"
            }
            lower.contains("open youtube") -> {
                val (ok, msg) = deviceManager.launchApp("youtube")
                "[TOOL: LAUNCH] $msg"
            }
            lower.contains("open camera") -> {
                val (ok, msg) = deviceManager.launchApp("camera")
                "[TOOL: LAUNCH] $msg"
            }
            lower.contains("open settings") -> {
                val (ok, msg) = deviceManager.launchApp("settings")
                "[TOOL: LAUNCH] $msg"
            }
            else -> null
        }
    }

    fun clearChatHistory() {
        viewModelScope.launch {
            messageDao.clearAll()
            val reset = MessageEntity(
                role = "assistant",
                text = "Console reset. FRIDAY Intelligence Core ready for input."
            )
            messageDao.insert(reset)
            state = state.copy(messages = listOf(reset))
        }
    }

    fun speakMessage(text: String) {
        voiceManager.speak(text)
    }

    fun stopSpeaking() {
        voiceManager.stopSpeaking()
    }

    // -------------------------------------------------------------------------
    // Real Tools Execution
    // -------------------------------------------------------------------------
    fun runTool(toolName: String, argument: String) {
        viewModelScope.launch {
            state = state.copy(assistantState = AssistantState.EXECUTING)
            val start = System.currentTimeMillis()

            val toolResult = when (toolName.lowercase()) {
                "torch" -> {
                    val active = deviceManager.toggleTorch()
                    state = state.copy(isTorchOn = active)
                    val dur = System.currentTimeMillis() - start
                    ToolResult("torch", if (active) "Flashlight turned ON 💡" else "Flashlight turned OFF", true, dur)
                }
                "hardware", "diagnostics" -> {
                    refreshDeviceStats()
                    val telem = state.hardwareTelemetry ?: deviceManager.getHardwareTelemetry()
                    val dur = System.currentTimeMillis() - start
                    ToolResult("diagnostics", "Battery: ${telem.batteryPct}% (${if (telem.isCharging) "Charging" else "Battery"}), RAM: ${telem.ramUsedGb}/${telem.ramTotalGb} GB, Storage: ${telem.storageFreeGb} GB free, OS: ${telem.osVersion}", true, dur)
                }
                "volume_up" -> {
                    val newVol = deviceManager.adjustVolume(AudioManager.ADJUST_RAISE)
                    state = state.copy(volumePercent = newVol)
                    val dur = System.currentTimeMillis() - start
                    ToolResult("volume", "Media Volume: $newVol%", true, dur)
                }
                "volume_down" -> {
                    val newVol = deviceManager.adjustVolume(AudioManager.ADJUST_LOWER)
                    state = state.copy(volumePercent = newVol)
                    val dur = System.currentTimeMillis() - start
                    ToolResult("volume", "Media Volume: $newVol%", true, dur)
                }
                "calculate" -> apiClient.executeCalculate(argument)
                "weather" -> {
                    val w = deviceManager.fetchLiveWeather()
                    val dur = System.currentTimeMillis() - start
                    ToolResult("weather", w, true, dur)
                }
                "clock", "time" -> {
                    val t = deviceManager.getClockInfo()
                    val dur = System.currentTimeMillis() - start
                    ToolResult("clock", t, true, dur)
                }
                "web_search" -> apiClient.searchWeb(argument)
                "email" -> {
                    val text = apiClient.draftEmail("Project Demo", "Team", argument)
                    val dur = System.currentTimeMillis() - start
                    ToolResult("draft_email", text, true, dur)
                }
                "launch_app" -> {
                    val (ok, msg) = deviceManager.launchApp(argument)
                    val dur = System.currentTimeMillis() - start
                    ToolResult("launch_app", msg, ok, dur)
                }
                else -> {
                    ToolResult(toolName, "Executed: $argument", true, 10)
                }
            }

            state = state.copy(
                actionLedger = listOf(toolResult) + state.actionLedger.take(15),
                assistantState = AssistantState.IDLE
            )

            val toolSummary = MessageEntity(
                role = "assistant",
                text = "[TOOL: ${toolResult.tool.uppercase()}] ${toolResult.result} (${toolResult.durationMs}ms)"
            )
            messageDao.insert(toolSummary)
            state = state.copy(messages = state.messages + toolSummary)
        }
    }

    // -------------------------------------------------------------------------
    // Writing Companion & Sandbox
    // -------------------------------------------------------------------------
    fun onSandboxInputChange(text: String) {
        state = state.copy(sandboxInput = text)
    }

    fun setWritingMode(mode: String) {
        state = state.copy(selectedWritingMode = mode)
    }

    fun setTargetLanguage(lang: String) {
        state = state.copy(selectedTargetLang = lang)
    }

    fun runSandboxWritingTransform() {
        val text = state.sandboxInput.trim()
        if (text.isEmpty()) return

        state = state.copy(isAnalyzing = true)
        viewModelScope.launch {
            val res = when (state.selectedWritingMode.lowercase()) {
                "professional" -> apiClient.rewriteTone(text, "professional")
                "casual" -> apiClient.rewriteTone(text, "casual")
                "concise" -> apiClient.rewriteTone(text, "concise")
                "translate" -> apiClient.translateText(text, state.selectedTargetLang)
                else -> apiClient.fixGrammar(text)
            }
            state = state.copy(sandboxResult = res, isAnalyzing = false)
        }
    }

    fun runSandboxGrammarFix() {
        state = state.copy(selectedWritingMode = "Grammar")
        runSandboxWritingTransform()
    }

    fun runSandboxToneRewrite(tone: String) {
        state = state.copy(selectedWritingMode = tone)
        runSandboxWritingTransform()
    }

    // -------------------------------------------------------------------------
    // Real Native Voice Recognition & TTS Callbacks
    // -------------------------------------------------------------------------
    fun startVoiceListening() {
        voiceManager.startListening()
    }

    fun stopVoiceListening() {
        voiceManager.stopListening()
    }

    override fun onListeningStarted() {
        state = state.copy(
            assistantState = AssistantState.LISTENING,
            latestVoiceTranscript = "Listening... (Speak to FRIDAY)"
        )
    }

    override fun onRmsChanged(levels: List<Float>) {
        if (state.assistantState == AssistantState.LISTENING) {
            state = state.copy(audioLevels = levels)
        }
    }

    override fun onPartialTranscript(text: String) {
        state = state.copy(latestVoiceTranscript = text)
    }

    override fun onFinalTranscript(text: String) {
        state = state.copy(
            latestVoiceTranscript = text,
            assistantState = AssistantState.THINKING
        )
        // Send message to assistant and speak aloud the result
        sendMessage(customText = text, speakOutput = true)
    }

    override fun onSpeechError(errorMessage: String) {
        state = state.copy(
            assistantState = AssistantState.IDLE,
            latestVoiceTranscript = errorMessage,
            audioLevels = List(16) { 0.15f }
        )
    }

    override fun onSpeakingStarted() {
        state = state.copy(assistantState = AssistantState.SPEAKING)
    }

    override fun onSpeakingFinished() {
        state = state.copy(
            assistantState = AssistantState.IDLE,
            audioLevels = List(16) { 0.15f }
        )
    }

    override fun onCleared() {
        super.onCleared()
        voiceManager.destroy()
    }
}
