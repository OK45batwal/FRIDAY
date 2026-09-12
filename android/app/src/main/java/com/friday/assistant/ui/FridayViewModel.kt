package com.friday.assistant.ui

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.friday.assistant.data.FridayDatabase
import com.friday.assistant.data.MessageEntity
import com.friday.assistant.network.BackendHealth
import com.friday.assistant.network.FridayApiClient
import com.friday.assistant.network.GrammarResult
import com.friday.assistant.network.ToolResult
import com.friday.assistant.service.FridayAccessibilityService
import com.friday.assistant.service.FridayFloatingService
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.random.Random

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
)

class FridayViewModel(application: Application) : AndroidViewModel(application) {

    var state by mutableStateOf(FridayUiState())
        private set

    private val apiClient = FridayApiClient()
    private val db = FridayDatabase.getInstance(application)
    private val messageDao = db.messageDao()

    init {
        loadMessages()
        refreshHealth()
        refreshServiceStates()
    }

    fun selectTab(tab: ConsoleTab) {
        state = state.copy(currentTab = tab)
        refreshServiceStates()
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

    fun refreshHealth() {
        viewModelScope.launch {
            val health = apiClient.checkHealth()
            state = state.copy(backendHealth = health)
            refreshServiceStates()
        }
    }

    // -------------------------------------------------------------------------
    // Interactive Sandbox for Grammar & Siri Assistant
    // -------------------------------------------------------------------------
    fun onSandboxInputChange(text: String) {
        state = state.copy(sandboxInput = text)
    }

    fun runSandboxGrammarFix() {
        val text = state.sandboxInput.trim()
        if (text.isEmpty()) return

        state = state.copy(isAnalyzing = true)
        viewModelScope.launch {
            val res = apiClient.fixGrammar(text)
            state = state.copy(sandboxResult = res, isAnalyzing = false)
        }
    }

    fun runSandboxToneRewrite(tone: String) {
        val text = state.sandboxInput.trim()
        if (text.isEmpty()) return

        state = state.copy(isAnalyzing = true)
        viewModelScope.launch {
            val res = apiClient.rewriteTone(text, tone)
            state = state.copy(sandboxResult = res, isAnalyzing = false)
        }
    }

    private fun loadMessages() {
        viewModelScope.launch {
            val history = messageDao.getRecentMessages(50).reversed()
            if (history.isEmpty()) {
                val welcome = MessageEntity(
                    role = "assistant",
                    text = "FRIDAY Local Intelligence Core active. System-wide Siri Assistant and WhatsApp/Gmail writing companion enabled."
                )
                messageDao.insert(welcome)
                state = state.copy(messages = listOf(welcome))
            } else {
                state = state.copy(messages = history)
            }
        }
    }

    fun sendMessage(customText: String? = null) {
        val textToSend = (customText ?: state.inputText).trim()
        if (textToSend.isEmpty()) return

        state = state.copy(inputText = "", isSending = true, assistantState = AssistantState.THINKING)

        viewModelScope.launch {
            val userMsg = MessageEntity(role = "user", text = textToSend)
            messageDao.insert(userMsg)
            state = state.copy(messages = state.messages + userMsg)

            val result = apiClient.sendChat(textToSend)

            val replyMsg = MessageEntity(role = "assistant", text = result.reply)
            messageDao.insert(replyMsg)

            state = state.copy(
                messages = state.messages + replyMsg,
                isSending = false,
                assistantState = AssistantState.IDLE,
                backendHealth = state.backendHealth.copy(isOnline = result.isOnline)
            )
        }
    }

    fun runTool(toolName: String, argument: String) {
        viewModelScope.launch {
            state = state.copy(assistantState = AssistantState.EXECUTING)
            val res = when (toolName) {
                "calculate" -> apiClient.executeCalculate(argument)
                "email" -> {
                    val start = System.currentTimeMillis()
                    val text = apiClient.draftEmail("Project Demo", "Team", argument)
                    val dur = System.currentTimeMillis() - start
                    ToolResult("draft_email", text, true, dur)
                }
                else -> {
                    ToolResult(toolName, "Battery: ${state.backendHealth.batteryPct}, RAM: ${state.backendHealth.ramGb}", true, 12)
                }
            }

            state = state.copy(
                actionLedger = listOf(res) + state.actionLedger.take(15),
                assistantState = AssistantState.IDLE
            )

            val toolSummary = MessageEntity(
                role = "assistant",
                text = "[TOOL: ${res.tool.uppercase()}] ${res.result} (${res.durationMs}ms)"
            )
            messageDao.insert(toolSummary)
            state = state.copy(messages = state.messages + toolSummary)
        }
    }

    fun startVoiceListening() {
        state = state.copy(
            assistantState = AssistantState.LISTENING,
            latestVoiceTranscript = "Listening locally... (Speak now)"
        )
        viewModelScope.launch {
            for (i in 0 until 12) {
                if (state.assistantState != AssistantState.LISTENING) break
                val levels = List(16) { Random.nextFloat().coerceIn(0.2f, 0.95f) }
                state = state.copy(audioLevels = levels)
                delay(120)
            }

            if (state.assistantState == AssistantState.LISTENING) {
                state = state.copy(
                    assistantState = AssistantState.THINKING,
                    latestVoiceTranscript = "Analyzing speech with Whisper on Apple Silicon..."
                )
                delay(1000)

                state = state.copy(
                    assistantState = AssistantState.SPEAKING,
                    latestVoiceTranscript = "Voice Pipeline: Ready. Edge-TTS neural speech synthesized."
                )

                for (i in 0 until 8) {
                    val levels = List(16) { Random.nextFloat().coerceIn(0.15f, 0.7f) }
                    state = state.copy(audioLevels = levels)
                    delay(120)
                }

                state = state.copy(
                    assistantState = AssistantState.IDLE,
                    audioLevels = List(16) { 0.15f }
                )
            }
        }
    }

    fun stopVoiceListening() {
        state = state.copy(
            assistantState = AssistantState.IDLE,
            audioLevels = List(16) { 0.15f },
            latestVoiceTranscript = "Voice cancelled. Ready for speech input."
        )
    }

    fun cancel() {
        state = state.copy(assistantState = AssistantState.IDLE)
    }
}
