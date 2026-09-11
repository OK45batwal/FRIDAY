package com.friday.assistant.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import com.friday.assistant.ai.Route
import com.friday.assistant.ai.Router

enum class AssistantState { IDLE, LISTENING, THINKING, EXECUTING, SPEAKING, ERROR }
data class FridayUiState(
    val assistantState: AssistantState = AssistantState.IDLE,
    val serviceEnabled: Boolean = false,
    val microphoneGranted: Boolean = false,
    val wakeWordEnabled: Boolean = false,
    val modelStatus: String = "Unloaded",
    val latestResponse: String = "Ready for a local command.",
)

class FridayViewModel : ViewModel() {
    var state by mutableStateOf(FridayUiState())
        private set
    private val router = Router()

    fun setPermissionsGranted(granted: Boolean) { state = state.copy(microphoneGranted = granted) }
    fun setServiceEnabled(enabled: Boolean) { state = state.copy(serviceEnabled = enabled) }
    fun beginManualListening() { state = state.copy(assistantState = AssistantState.LISTENING, latestResponse = "Listening locally. Tap Stop to cancel.") }
    fun cancel() { state = state.copy(assistantState = AssistantState.IDLE, latestResponse = "Cancelled. FRIDAY is idle.") }
    fun submit(text: String) {
        when (router.route(text)) {
            Route.Stop -> cancel()
            is Route.Tool -> state = state.copy(assistantState = AssistantState.EXECUTING, latestResponse = "Executing safe local tool…")
            Route.LocalLlm -> state = state.copy(assistantState = AssistantState.ERROR, latestResponse = "No local model is installed. Tools and privacy controls remain available.")
        }
    }
}
