package com.friday.assistant.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friday.assistant.data.MessageEntity
import com.friday.assistant.network.ToolResult

// Yellow Brutalism Color Palette
private val CanvasDark = Color(0xFF0E0E0C)
private val SurfaceDark = Color(0xFF1B1A16)
private val SurfaceElevated = Color(0xFF24231E)
private val AccentYellow = Color(0xFFFFE600)
private val BorderDark = Color(0xFF3A382F)
private val TextWhite = Color(0xFFF5F5F0)
private val TextMuted = Color(0xFFA19F93)
private val SuccessGreen = Color(0xFF00E599)
private val DangerRed = Color(0xFFFF3B30)

@Composable
fun FridayScreen(
    state: FridayUiState,
    onTabSelect: (ConsoleTab) -> Unit,
    onInputChange: (String) -> Unit,
    onSendMessage: (String?) -> Unit,
    onRunTool: (String, String) -> Unit,
    onToggleVoice: () -> Unit,
    onStopVoice: () -> Unit,
    onToggleService: (Boolean) -> Unit,
    onRefreshHealth: () -> Unit,
    onSandboxInputChange: (String) -> Unit = {},
    onSandboxGrammarFix: () -> Unit = {},
    onSandboxToneRewrite: (String) -> Unit = {},
    onToggleFloatingService: () -> Unit = {},
    onOpenAccessibilitySettings: () -> Unit = {},
) {
    Scaffold(
        containerColor = CanvasDark,
        topBar = {
            TopConsoleBar(
                isOnline = state.backendHealth.isOnline,
                onRefresh = onRefreshHealth
            )
        },
        bottomBar = {
            BottomConsoleNav(
                currentTab = state.currentTab,
                onSelect = onTabSelect
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(CanvasDark)
        ) {
            when (state.currentTab) {
                ConsoleTab.CHAT -> ChatView(
                    messages = state.messages,
                    inputText = state.inputText,
                    isSending = state.isSending,
                    onInputChange = onInputChange,
                    onSend = { onSendMessage(null) },
                    onQuickPrompt = { onSendMessage(it) }
                )
                ConsoleTab.VOICE -> VoiceView(
                    assistantState = state.assistantState,
                    audioLevels = state.audioLevels,
                    transcript = state.latestVoiceTranscript,
                    onToggleVoice = onToggleVoice,
                    onStopVoice = onStopVoice
                )
                ConsoleTab.TOOLS -> ToolsView(
                    actionLedger = state.actionLedger,
                    onRunTool = onRunTool
                )
                ConsoleTab.ASSIST -> AssistView(
                    state = state,
                    onSandboxInputChange = onSandboxInputChange,
                    onSandboxGrammarFix = onSandboxGrammarFix,
                    onSandboxToneRewrite = onSandboxToneRewrite,
                    onToggleFloatingService = onToggleFloatingService,
                    onOpenAccessibilitySettings = onOpenAccessibilitySettings
                )
                ConsoleTab.STATUS -> StatusView(
                    state = state,
                    onToggleService = onToggleService,
                    onRefresh = onRefreshHealth
                )
            }
        }
    }
}

@Composable
private fun TopConsoleBar(isOnline: Boolean, onRefresh: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceDark)
            .statusBarsPadding()
            .border(width = 2.dp, color = BorderDark, shape = RectangleShape)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .background(AccentYellow, RectangleShape)
                    .border(1.dp, Color.Black, RectangleShape)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "FRIDAY",
                    color = Color.Black,
                    fontWeight = FontWeight.Black,
                    fontSize = 14.sp
                )
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(
                    text = "LOCAL CONSOLE",
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp
                )
                Text(
                    text = "v2.5 • ON-DEVICE",
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .background(if (isOnline) Color(0xFF003820) else Color(0xFF3B2F00))
                    .border(
                        1.dp,
                        if (isOnline) SuccessGreen else AccentYellow,
                        RectangleShape
                    )
                    .padding(horizontal = 8.dp, vertical = 3.dp)
                    .clickable { onRefresh() }
            ) {
                Text(
                    text = if (isOnline) "ONLINE • 10.0.2.2" else "LOCAL • DEVICE",
                    color = if (isOnline) SuccessGreen else AccentYellow,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

@Composable
private fun BottomConsoleNav(
    currentTab: ConsoleTab,
    onSelect: (ConsoleTab) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceDark)
            .navigationBarsPadding()
            .border(width = 2.dp, color = BorderDark, shape = RectangleShape)
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        ConsoleTab.values().forEach { tab ->
            val isSelected = currentTab == tab
            Box(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onSelect(tab) }
                    .background(
                        if (isSelected) AccentYellow else Color.Transparent,
                        RectangleShape
                    )
                    .padding(vertical = 12.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = tab.name,
                    color = if (isSelected) Color.Black else TextMuted,
                    fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 1. CHAT VIEW
// -----------------------------------------------------------------------------
@Composable
private fun ChatView(
    messages: List<MessageEntity>,
    inputText: String,
    isSending: Boolean,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
    onQuickPrompt: (String) -> Unit
) {
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Message list
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(messages) { msg ->
                val isUser = msg.role == "user"
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (isUser) Arrangement.End else Arrangement.Start
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(0.88f)
                            .background(if (isUser) SurfaceElevated else SurfaceDark)
                            .border(
                                width = 1.5.dp,
                                color = if (isUser) BorderDark else AccentYellow,
                                shape = RectangleShape
                            )
                            .padding(12.dp)
                    ) {
                        Column {
                            Text(
                                text = if (isUser) "USER" else "FRIDAY CORE",
                                color = if (isUser) TextMuted else AccentYellow,
                                fontWeight = FontWeight.Black,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = msg.text,
                                color = TextWhite,
                                fontSize = 13.sp,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        // Quick prompt chips
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            listOf("Hardware status", "Calc 128*32", "Draft email").forEach { prompt ->
                Box(
                    modifier = Modifier
                        .background(SurfaceElevated)
                        .border(1.dp, BorderDark, RectangleShape)
                        .clickable { onQuickPrompt(prompt) }
                        .padding(horizontal = 8.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = prompt,
                        color = TextWhite,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        Spacer(Modifier.height(8.dp))

        // Text input bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = onInputChange,
                modifier = Modifier.weight(1f),
                placeholder = { Text("Ask FRIDAY or run tool...", color = TextMuted, fontSize = 13.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite,
                    focusedContainerColor = SurfaceDark,
                    unfocusedContainerColor = SurfaceDark,
                    focusedBorderColor = AccentYellow,
                    unfocusedBorderColor = BorderDark,
                ),
                shape = RectangleShape,
                singleLine = true
            )
            Spacer(Modifier.width(8.dp))
            Button(
                onClick = onSend,
                enabled = inputText.isNotBlank() && !isSending,
                colors = ButtonDefaults.buttonColors(
                    containerColor = AccentYellow,
                    contentColor = Color.Black,
                    disabledContainerColor = SurfaceDark,
                    disabledContentColor = TextMuted
                ),
                shape = RectangleShape,
                modifier = Modifier
                    .height(56.dp)
                    .border(2.dp, BorderDark, RectangleShape)
            ) {
                if (isSending) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(18.dp),
                        color = Color.Black,
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("SEND", fontWeight = FontWeight.Black)
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 2. VOICE VIEW
// -----------------------------------------------------------------------------
@Composable
private fun VoiceView(
    assistantState: AssistantState,
    audioLevels: List<Float>,
    transcript: String,
    onToggleVoice: () -> Unit,
    onStopVoice: () -> Unit
) {
    val isListening = assistantState == AssistantState.LISTENING
    val isThinking = assistantState == AssistantState.THINKING
    val isSpeaking = assistantState == AssistantState.SPEAKING

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "AUDIO NEURAL PIPELINE",
            color = TextMuted,
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp,
            fontFamily = FontFamily.Monospace
        )
        Spacer(Modifier.height(8.dp))
        Text(
            text = assistantState.name,
            color = when (assistantState) {
                AssistantState.LISTENING -> SuccessGreen
                AssistantState.THINKING -> AccentYellow
                AssistantState.SPEAKING -> Color(0xFF65D6FF)
                else -> TextWhite
            },
            fontWeight = FontWeight.Black,
            fontSize = 26.sp
        )

        Spacer(Modifier.height(32.dp))

        // Push to talk primary brutalist button
        Box(
            modifier = Modifier
                .size(140.dp)
                .background(
                    if (isListening) SuccessGreen else AccentYellow,
                    RectangleShape
                )
                .border(3.dp, Color.Black, RectangleShape)
                .clickable { onToggleVoice() },
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = if (isListening) "LISTENING" else "PUSH TO TALK",
                    color = Color.Black,
                    fontWeight = FontWeight.Black,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = if (isListening) "RELEASE TO STOP" else "TAP TO ACTIVATE",
                    color = Color.Black.copy(alpha = 0.7f),
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Spacer(Modifier.height(36.dp))

        // 16-Bar Segmented Audio Waveform
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp)
                .background(SurfaceDark)
                .border(2.dp, BorderDark, RectangleShape)
                .padding(horizontal = 12.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            audioLevels.forEach { level ->
                val animatedHeight by animateFloatAsState(targetValue = level * 48f)
                Box(
                    modifier = Modifier
                        .width(12.dp)
                        .height(animatedHeight.dp.coerceAtLeast(4.dp))
                        .background(
                            if (isListening) SuccessGreen else if (isSpeaking) Color(0xFF65D6FF) else AccentYellow
                        )
                )
            }
        }

        Spacer(Modifier.height(24.dp))

        // Live transcription card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceDark)
                .border(1.5.dp, BorderDark, RectangleShape)
                .padding(16.dp)
        ) {
            Column {
                Text(
                    text = "TRANSCRIPTION / STATUS",
                    color = TextMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = transcript,
                    color = TextWhite,
                    fontSize = 13.sp
                )
            }
        }

        if (isListening || isThinking || isSpeaking) {
            Spacer(Modifier.height(16.dp))
            Button(
                onClick = onStopVoice,
                colors = ButtonDefaults.buttonColors(containerColor = DangerRed, contentColor = Color.White),
                shape = RectangleShape
            ) {
                Text("CANCEL VOICE SESSION", fontWeight = FontWeight.Bold)
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 3. TOOLS VIEW
// -----------------------------------------------------------------------------
@Composable
private fun ToolsView(
    actionLedger: List<ToolResult>,
    onRunTool: (String, String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "DETERMINISTIC TOOL RUNNER",
            color = AccentYellow,
            fontWeight = FontWeight.Black,
            fontSize = 13.sp,
            fontFamily = FontFamily.Monospace
        )
        Spacer(Modifier.height(12.dp))

        // Tool Action Cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ToolCard(
                title = "AST Calculator",
                description = "Eval 48 * 2.5 + 8",
                modifier = Modifier.weight(1f),
                onClick = { onRunTool("calculate", "48 * 2.5 + 8") }
            )
            ToolCard(
                title = "Hardware Inspect",
                description = "Battery & RAM",
                modifier = Modifier.weight(1f),
                onClick = { onRunTool("system_info", "inspect") }
            )
        }

        Spacer(Modifier.height(8.dp))

        ToolCard(
            title = "Task: Draft Email",
            description = "Draft update to Team regarding FRIDAY Android build",
            modifier = Modifier.fillMaxWidth(),
            onClick = { onRunTool("email", "FRIDAY Android app built and verified on emulator") }
        )

        Spacer(Modifier.height(20.dp))

        // Recent Action Ledger
        Text(
            text = "RECENT ACTION LEDGER",
            color = TextWhite,
            fontWeight = FontWeight.Bold,
            fontSize = 12.sp,
            fontFamily = FontFamily.Monospace
        )
        Spacer(Modifier.height(8.dp))

        if (actionLedger.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No tool actions run yet. Tap a tool card above.",
                    color = TextMuted,
                    fontSize = 12.sp
                )
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(actionLedger) { item ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(SurfaceDark)
                            .border(1.dp, BorderDark, RectangleShape)
                            .padding(10.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                text = item.tool.uppercase(),
                                color = AccentYellow,
                                fontWeight = FontWeight.Bold,
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = item.result,
                                color = TextWhite,
                                fontSize = 12.sp,
                                maxLines = 2
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Box(
                            modifier = Modifier
                                .background(Color(0xFF003820))
                                .border(1.dp, SuccessGreen, RectangleShape)
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "${item.durationMs}ms",
                                color = SuccessGreen,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ToolCard(
    title: String,
    description: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Box(
        modifier = modifier
            .background(SurfaceDark)
            .border(2.dp, BorderDark, RectangleShape)
            .clickable { onClick() }
            .padding(12.dp)
    ) {
        Column {
            Text(
                text = title,
                color = AccentYellow,
                fontWeight = FontWeight.Black,
                fontSize = 12.sp
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = description,
                color = TextWhite,
                fontSize = 11.sp
            )
        }
    }
}

// -----------------------------------------------------------------------------
// 4. STATUS & PRIVACY VIEW
// -----------------------------------------------------------------------------
@Composable
private fun StatusView(
    state: FridayUiState,
    onToggleService: (Boolean) -> Unit,
    onRefresh: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "SYSTEM TELEMETRY & PRIVACY",
            color = AccentYellow,
            fontWeight = FontWeight.Black,
            fontSize = 13.sp,
            fontFamily = FontFamily.Monospace
        )

        // Telemetry Row
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(SurfaceDark)
                    .border(1.5.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column {
                    Text("BATTERY", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    Text(state.backendHealth.batteryPct, color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(SurfaceDark)
                    .border(1.5.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column {
                    Text("HOST RAM", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    Text(state.backendHealth.ramGb, color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(SurfaceDark)
                    .border(1.5.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column {
                    Text("ROOM MESSAGES", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    Text("${state.messages.size}", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }
        }

        // Background service control
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceDark)
                .border(1.5.dp, BorderDark, RectangleShape)
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text("Background Assistant Service", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                Text("Keep assistant active via foreground notification", color = TextMuted, fontSize = 11.sp)
            }
            Switch(
                checked = state.serviceEnabled,
                onCheckedChange = onToggleService,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.Black,
                    checkedTrackColor = AccentYellow,
                    uncheckedTrackColor = SurfaceElevated
                )
            )
        }

        // Privacy Statement Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceDark)
                .border(1.5.dp, BorderDark, RectangleShape)
                .padding(14.dp)
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = "ON-DEVICE PRIVACY BOUNDARIES",
                    color = AccentYellow,
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text("• Local-first: All data stored in SQLite Room on device.", color = TextWhite, fontSize = 12.sp)
                Text("• Audio retention: Zero audio recorded or retained permanently.", color = TextWhite, fontSize = 12.sp)
                Text("• Deterministic tools: Only allowlisted local functions can execute.", color = TextWhite, fontSize = 12.sp)
                Text("• Backend bridge: Connects directly to host Apple Silicon via 10.0.2.2 without cloud hops.", color = TextWhite, fontSize = 12.sp)
            }
        }

        Spacer(Modifier.weight(1f))

        Button(
            onClick = onRefresh,
            modifier = Modifier
                .fillMaxWidth()
                .border(2.dp, BorderDark, RectangleShape),
            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
            shape = RectangleShape
        ) {
            Text(
                text = "REFRESH TELEMETRY",
                fontWeight = FontWeight.Black,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

// -----------------------------------------------------------------------------
// 5. ASSIST (SIRI & SYSTEM WRITING COMPANION) VIEW
// -----------------------------------------------------------------------------
@Composable
private fun AssistView(
    state: FridayUiState,
    onSandboxInputChange: (String) -> Unit,
    onSandboxGrammarFix: () -> Unit,
    onSandboxToneRewrite: (String) -> Unit,
    onToggleFloatingService: () -> Unit,
    onOpenAccessibilitySettings: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            Text(
                text = "SIRI SYSTEM ASSISTANT & WRITING COMPANION",
                color = AccentYellow,
                fontWeight = FontWeight.Black,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace
            )
            Spacer(Modifier.height(4.dp))
            Text(
                text = "Real-time grammar fix & assistant overlay across WhatsApp, Gmail & Web",
                color = TextMuted,
                fontSize = 11.sp
            )
        }

        // Service Control Cards
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Floating Overlay Trigger
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(SurfaceDark)
                        .border(1.5.dp, BorderDark, RectangleShape)
                        .padding(12.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("FLOATING PILL", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                            Box(
                                modifier = Modifier
                                    .background(if (state.isFloatingRunning) Color(0xFF003820) else Color(0xFF24231E))
                                    .border(1.dp, if (state.isFloatingRunning) SuccessGreen else BorderDark, RectangleShape)
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = if (state.isFloatingRunning) "ACTIVE" else "OFF",
                                    color = if (state.isFloatingRunning) SuccessGreen else TextMuted,
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text("Overlay on any app", color = TextWhite, fontSize = 11.sp)
                        Spacer(Modifier.height(10.dp))
                        Button(
                            onClick = onToggleFloatingService,
                            modifier = Modifier.fillMaxWidth().height(36.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (state.isFloatingRunning) DangerRed else AccentYellow,
                                contentColor = Color.Black
                            ),
                            shape = RectangleShape
                        ) {
                            Text(if (state.isFloatingRunning) "STOP" else "START", fontWeight = FontWeight.Bold, fontSize = 10.sp)
                        }
                    }
                }

                // Accessibility Service Setup
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(SurfaceDark)
                        .border(1.5.dp, BorderDark, RectangleShape)
                        .padding(12.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("AUTO-TYPING", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                            Box(
                                modifier = Modifier
                                    .background(if (state.isAccessibilityRunning) Color(0xFF003820) else Color(0xFF24231E))
                                    .border(1.dp, if (state.isAccessibilityRunning) SuccessGreen else BorderDark, RectangleShape)
                                    .padding(horizontal = 4.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = if (state.isAccessibilityRunning) "READY" else "SETUP",
                                    color = if (state.isAccessibilityRunning) SuccessGreen else AccentYellow,
                                    fontSize = 8.sp,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
                        Spacer(Modifier.height(6.dp))
                        Text("In-place text fix", color = TextWhite, fontSize = 11.sp)
                        Spacer(Modifier.height(10.dp))
                        Button(
                            onClick = onOpenAccessibilitySettings,
                            modifier = Modifier.fillMaxWidth().height(36.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RectangleShape
                        ) {
                            Text("SETTINGS", fontWeight = FontWeight.Bold, fontSize = 10.sp)
                        }
                    }
                }
            }
        }

        // Universal Text Selection Tip
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF24231E))
                    .border(1.5.dp, AccentYellow, RectangleShape)
                    .padding(12.dp)
            ) {
                Column {
                    Text(
                        text = "⚡ NATIVE WHATSAPP & GMAIL INTEGRATION",
                        color = AccentYellow,
                        fontWeight = FontWeight.Black,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Highlight text in WhatsApp, Gmail, or Chrome -> Tap 3-dot context menu -> Select 'FRIDAY: Fix Grammar'.",
                        color = TextWhite,
                        fontSize = 12.sp,
                        lineHeight = 17.sp
                    )
                }
            }
        }

        // Interactive Grammar Sandbox
        item {
            Text(
                text = "INTERACTIVE GRAMMAR & REWRITE SANDBOX",
                color = TextWhite,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace
            )
            Spacer(Modifier.height(6.dp))

            OutlinedTextField(
                value = state.sandboxInput,
                onValueChange = onSandboxInputChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Enter message with typos or awkward phrasing...", color = TextMuted, fontSize = 12.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite,
                    focusedContainerColor = SurfaceDark,
                    unfocusedContainerColor = SurfaceDark,
                    focusedBorderColor = AccentYellow,
                    unfocusedBorderColor = BorderDark,
                ),
                shape = RectangleShape
            )

            Spacer(Modifier.height(8.dp))

            // Action triggers
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Button(
                    onClick = onSandboxGrammarFix,
                    enabled = !state.isAnalyzing,
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                    shape = RectangleShape,
                    modifier = Modifier.weight(1.1f)
                ) {
                    Text("⚡ Grammar", fontWeight = FontWeight.Black, fontSize = 10.sp, maxLines = 1)
                }

                Button(
                    onClick = { onSandboxToneRewrite("professional") },
                    enabled = !state.isAnalyzing,
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated, contentColor = TextWhite),
                    shape = RectangleShape,
                    modifier = Modifier.weight(0.95f).border(1.dp, BorderDark, RectangleShape)
                ) {
                    Text("✉ Gmail", fontWeight = FontWeight.Bold, fontSize = 10.sp, maxLines = 1)
                }

                Button(
                    onClick = { onSandboxToneRewrite("casual") },
                    enabled = !state.isAnalyzing,
                    contentPadding = PaddingValues(horizontal = 4.dp, vertical = 6.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated, contentColor = TextWhite),
                    shape = RectangleShape,
                    modifier = Modifier.weight(1.05f).border(1.dp, BorderDark, RectangleShape)
                ) {
                    Text("💬 WhatsApp", fontWeight = FontWeight.Bold, fontSize = 10.sp, maxLines = 1)
                }
            }
        }

        // Sandbox Result Card
        item {
            if (state.isAnalyzing) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RectangleShape)
                        .padding(20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(modifier = Modifier.size(18.dp), color = AccentYellow, strokeWidth = 2.dp)
                        Spacer(Modifier.width(10.dp))
                        Text("Analyzing linguistic structure...", color = TextWhite, fontSize = 12.sp)
                    }
                }
            } else if (state.sandboxResult != null) {
                val res = state.sandboxResult
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceDark)
                        .border(1.5.dp, AccentYellow, RectangleShape)
                        .padding(14.dp)
                ) {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "CORRECTED OUTPUT",
                                color = AccentYellow,
                                fontWeight = FontWeight.Black,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            Text(
                                text = if (res.isOnline) "LOCAL OLLAMA" else "OFFLINE HEURISTICS",
                                color = if (res.isOnline) SuccessGreen else AccentYellow,
                                fontSize = 9.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = res.correctedText,
                            color = TextWhite,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                        Spacer(Modifier.height(6.dp))
                        Text(
                            text = res.explanation,
                            color = TextMuted,
                            fontSize = 11.sp
                        )
                    }
                }
            }
        }
    }
}

