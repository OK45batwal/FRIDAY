package com.friday.assistant.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun FridayScreen(state: FridayUiState, onToggleService: (Boolean) -> Unit, onManualListen: () -> Unit, onStop: () -> Unit) {
    MaterialTheme(colorScheme = FridayColorScheme) {
        Column(
            modifier = Modifier.fillMaxSize().background(Color(0xFF07111B)).padding(24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("FRIDAY AI CORE", color = Color(0xFF8DE1FF), fontWeight = FontWeight.Bold)
            Text(if (state.assistantState == AssistantState.IDLE) "READY" else state.assistantState.name, color = Color.White, style = MaterialTheme.typography.headlineMedium)
            Spacer(Modifier.height(12.dp))
            Column(Modifier.align(Alignment.CenterHorizontally).clip(CircleShape).background(stateColor(state.assistantState)).padding(46.dp)) {
                Text(state.assistantState.name, color = Color.Black, fontWeight = FontWeight.Bold)
            }
            Card(Modifier.fillMaxWidth()) { Column(Modifier.padding(16.dp)) {
                Text("LOCAL ONLY • Model: ${state.modelStatus}", fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(8.dp)); Text(state.latestResponse)
            } }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Background assistant", color = Color(0xFFE2EDF5))
                    Text("Visible notification required", color = Color(0xFFB6C8D6), style = MaterialTheme.typography.bodySmall)
                }
                Switch(state.serviceEnabled, onToggleService)
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(onClick = onManualListen, modifier = Modifier.weight(1f)) { Text("Manual mic") }
                Button(onClick = onStop, modifier = Modifier.weight(1f)) { Text("Stop") }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Column {
                    Text("Privacy dashboard", color = Color(0xFFE2EDF5))
                    Text("Cloud AI is unavailable in this build", color = Color(0xFFB6C8D6), style = MaterialTheme.typography.bodySmall)
                }
                Switch(checked = false, onCheckedChange = {}, enabled = false)
            }
            Text("Wake word: manual fallback active • Memories: stored locally • Audio is not retained", color = Color(0xFFB6C8D6), style = MaterialTheme.typography.bodySmall)
        }
    }
}

private val FridayColorScheme = darkColorScheme(
    primary = Color(0xFF8DE1FF),
    onPrimary = Color(0xFF001E2B),
    surface = Color(0xFF101E2B),
    onSurface = Color(0xFFE2EDF5),
)

private fun stateColor(state: AssistantState) = when (state) {
    AssistantState.IDLE -> Color(0xFF63D8FF); AssistantState.LISTENING -> Color(0xFF7CFFB2)
    AssistantState.THINKING -> Color(0xFFFFC857); AssistantState.EXECUTING -> Color(0xFFFF9D5C)
    AssistantState.SPEAKING -> Color(0xFFC09CFF); AssistantState.ERROR -> Color(0xFFFF7D7D)
}
