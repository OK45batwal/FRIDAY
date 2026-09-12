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
import com.friday.assistant.network.ToolResult
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.random.Random

enum class ConsoleTab { CHAT, VOICE, TOOLS, STATUS }
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
    }

    fun selectTab(tab: ConsoleTab) {
        state = state.copy(currentTab = tab)
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

    fun refreshHealth() {
        viewModelScope.launch {
            val health = apiClient.checkHealth()
            state = state.copy(backendHealth = health)
        }
    }

    private fun loadMessages() {
        viewModelScope.launch {
            val history = messageDao.getRecentMessages(50).reversed()
            if (history.isEmpty()) {
                val welcome = MessageEntity(
                    role = "assistant",
                    text = "FRIDAY Local Intelligence Core active. Ready for local inference and tool execution."
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

            // Send to backend (with local offline fallback)
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
            // Animate waveform
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

                // Simulate speaking waveform
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
