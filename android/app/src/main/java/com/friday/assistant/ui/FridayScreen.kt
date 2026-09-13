package com.friday.assistant.ui

import android.content.Intent
import android.widget.Toast
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friday.assistant.data.MessageEntity
import com.friday.assistant.network.ToolResult

// Tactical Yellow Brutalism Color Palette
private val CanvasDark = Color(0xFF0A0A08)
private val SurfaceDark = Color(0xFF141310)
private val SurfaceElevated = Color(0xFF1F1E19)
private val AccentYellow = Color(0xFFFFE600)
private val AccentAmber = Color(0xFFFF9500)
private val BorderDark = Color(0xFF333128)
private val BorderHighlight = Color(0xFFFFE600)
private val TextWhite = Color(0xFFF7F7F2)
private val TextMuted = Color(0xFFA6A498)
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
    onSpeakMessage: (String) -> Unit = {},
    onClearChat: () -> Unit = {},
    onSandboxInputChange: (String) -> Unit = {},
    onSetWritingMode: (String) -> Unit = {},
    onSetTargetLanguage: (String) -> Unit = {},
    onRunWritingTransform: () -> Unit = {},
    onToggleFloatingService: () -> Unit = {},
    onOpenAccessibilitySettings: () -> Unit = {},
    onSetCustomServerUrl: (String) -> Unit = {},
    onAdjustVolume: (Int) -> Unit = {},
    onToggleTorch: () -> Unit = {},
) {
    Box(modifier = Modifier.fillMaxSize()) {
        Scaffold(
            containerColor = CanvasDark,
            topBar = {
                TopConsoleBar(
                    isOnline = state.backendHealth.isOnline,
                    pingMs = state.pingMs,
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
                        onQuickPrompt = { onSendMessage(it) },
                        onSpeak = onSpeakMessage,
                        onClearChat = onClearChat
                    )
                    ConsoleTab.VOICE -> VoiceView(
                        assistantState = state.assistantState,
                        audioLevels = state.audioLevels,
                        transcript = state.latestVoiceTranscript,
                        onToggleVoice = onToggleVoice,
                        onStopVoice = onStopVoice,
                        onQuickPrompt = { onSendMessage(it) }
                    )
                    ConsoleTab.TOOLS -> ToolsView(
                        state = state,
                        onRunTool = onRunTool,
                        onToggleTorch = onToggleTorch,
                        onAdjustVolume = onAdjustVolume
                    )
                    ConsoleTab.ASSIST -> AssistView(
                        state = state,
                        onSandboxInputChange = onSandboxInputChange,
                        onSetWritingMode = onSetWritingMode,
                        onSetTargetLanguage = onSetTargetLanguage,
                        onRunTransform = onRunWritingTransform,
                        onToggleFloatingService = onToggleFloatingService,
                        onOpenAccessibilitySettings = onOpenAccessibilitySettings
                    )
                    ConsoleTab.STATUS -> StatusView(
                        state = state,
                        onToggleService = onToggleService,
                        onRefresh = onRefreshHealth,
                        onSetServerUrl = onSetCustomServerUrl,
                        onClearChat = onClearChat,
                        onToggleFloating = onToggleFloatingService,
                        onOpenAccessibility = onOpenAccessibilitySettings
                    )
                }
            }
        }

        // Apple Intelligence Animated Luminous Edge Glow
        if (state.assistantState == AssistantState.LISTENING || state.assistantState == AssistantState.SPEAKING) {
            AppleIntelligenceEdgeGlow(state.assistantState)
        }
    }
}

// -----------------------------------------------------------------------------
// Top Console Bar
// -----------------------------------------------------------------------------
@Composable
private fun TopConsoleBar(
    isOnline: Boolean,
    pingMs: Long,
    onRefresh: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceDark)
            .statusBarsPadding()
            .border(width = 1.5.dp, color = BorderDark, shape = RectangleShape)
            .padding(horizontal = 14.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .background(AccentYellow, RectangleShape)
                    .padding(horizontal = 7.dp, vertical = 3.dp)
            ) {
                Text(
                    text = "FRIDAY",
                    color = Color.Black,
                    fontWeight = FontWeight.Black,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
            Spacer(Modifier.width(8.dp))
            Column {
                Text(
                    text = "INTELLIGENCE CORE",
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp
                )
                Text(
                    text = "v2.5 • ON-DEVICE",
                    color = TextMuted,
                    fontSize = 9.5.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .background(if (isOnline) Color(0xFF00331A) else Color(0xFF2E2600))
                    .border(
                        1.dp,
                        if (isOnline) SuccessGreen else AccentYellow,
                        RectangleShape
                    )
                    .clickable { onRefresh() }
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(if (isOnline) SuccessGreen else AccentYellow, CircleShape)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (isOnline) {
                            if (pingMs > 0) "ONLINE • ${pingMs}ms" else "ONLINE • 10.0.2.2"
                        } else {
                            "LOCAL • ON-DEVICE"
                        },
                        color = if (isOnline) SuccessGreen else AccentYellow,
                        fontWeight = FontWeight.Bold,
                        fontSize = 9.5.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Bottom Console Navigation
// -----------------------------------------------------------------------------
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
            .border(width = 1.5.dp, color = BorderDark, shape = RectangleShape)
            .padding(vertical = 3.dp),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        listOf(
            ConsoleTab.CHAT to "CHAT",
            ConsoleTab.VOICE to "VOICE",
            ConsoleTab.TOOLS to "TOOLS",
            ConsoleTab.ASSIST to "ASSIST",
            ConsoleTab.STATUS to "STATUS"
        ).forEach { (tab, label) ->
            val isSelected = currentTab == tab
            Box(
                modifier = Modifier
                    .weight(1f)
                    .background(
                        if (isSelected) AccentYellow else Color.Transparent,
                        RectangleShape
                    )
                    .clickable { onSelect(tab) }
                    .padding(vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = label,
                    color = if (isSelected) Color.Black else TextMuted,
                    fontWeight = if (isSelected) FontWeight.Black else FontWeight.Bold,
                    fontSize = 10.5.sp,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 1
                )
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Apple Intelligence Screen Edge Glow
// -----------------------------------------------------------------------------
@Composable
private fun AppleIntelligenceEdgeGlow(state: AssistantState) {
    val infiniteTransition = rememberInfiniteTransition(label = "glow_pulse")
    val alpha by infiniteTransition.animateFloat(
        initialValue = 0.5f,
        targetValue = 0.95f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glow_alpha"
    )

    val colors = if (state == AssistantState.LISTENING) {
        listOf(
            Color(0xFFFF3B30).copy(alpha = alpha),
            Color(0xFFFFE600).copy(alpha = alpha),
            Color(0xFFFF9500).copy(alpha = alpha),
            Color(0xFFFF3B30).copy(alpha = alpha)
        )
    } else {
        listOf(
            Color(0xFFFFE600).copy(alpha = alpha),
            Color(0xFF00E599).copy(alpha = alpha),
            Color(0xFF00BFFF).copy(alpha = alpha),
            Color(0xFFFFE600).copy(alpha = alpha)
        )
    }

    val brush = Brush.sweepGradient(colors)

    Canvas(modifier = Modifier.fillMaxSize()) {
        drawRect(
            brush = brush,
            style = Stroke(width = 8.dp.toPx())
        )
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
    onQuickPrompt: (String) -> Unit,
    onSpeak: (String) -> Unit,
    onClearChat: () -> Unit
) {
    val listState = rememberLazyListState()
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current
    var showClearDialog by remember { mutableStateOf(false) }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    if (showClearDialog) {
        AlertDialog(
            onDismissRequest = { showClearDialog = false },
            title = { Text("Reset Chat Console", color = Color.White, fontWeight = FontWeight.Bold) },
            text = { Text("Clear all messages from the on-device database?", color = TextMuted) },
            confirmButton = {
                TextButton(onClick = {
                    showClearDialog = false
                    onClearChat()
                }) {
                    Text("CLEAR", color = DangerRed, fontWeight = FontWeight.Black)
                }
            },
            dismissButton = {
                TextButton(onClick = { showClearDialog = false }) {
                    Text("CANCEL", color = Color.White)
                }
            },
            containerColor = SurfaceDark
        )
    }

    Column(modifier = Modifier.fillMaxSize()) {
        // Quick Reset Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${messages.size} MESSAGES IN LOG",
                color = TextMuted,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = "CLEAR HISTORY",
                color = AccentYellow,
                fontSize = 9.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.clickable { showClearDialog = true }
            )
        }

        // Messages List
        LazyColumn(
            state = listState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(messages) { msg ->
                val isUser = msg.role == "user"
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth(if (isUser) 0.85f else 1.0f)
                            .background(if (isUser) SurfaceDark else SurfaceElevated, RectangleShape)
                            .border(
                                width = if (isUser) 1.dp else 1.5.dp,
                                color = if (isUser) BorderDark else AccentYellow,
                                shape = RectangleShape
                            )
                            .padding(10.dp)
                    ) {
                        Column {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = if (isUser) "USER" else "FRIDAY CORE",
                                    color = if (isUser) TextMuted else AccentYellow,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 9.5.sp,
                                    fontFamily = FontFamily.Monospace
                                )

                                if (!isUser) {
                                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                                        Text(
                                            text = "🔊 SPEAK",
                                            color = AccentYellow,
                                            fontSize = 9.sp,
                                            fontFamily = FontFamily.Monospace,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.clickable { onSpeak(msg.text) }
                                        )
                                        Text(
                                            text = "📋 COPY",
                                            color = TextWhite,
                                            fontSize = 9.sp,
                                            fontFamily = FontFamily.Monospace,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.clickable {
                                                clipboard.setText(AnnotatedString(msg.text))
                                                Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                                            }
                                        )
                                    }
                                }
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(
                                text = msg.text,
                                color = TextWhite,
                                fontSize = 12.5.sp,
                                lineHeight = 18.sp
                            )
                        }
                    }
                }
            }
        }

        // Quick Prompt Chips
        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            val chips = listOf(
                "Hardware status",
                "What time is it?",
                "Current weather",
                "Torch on",
                "Calc 128*32",
                "Draft email"
            )
            items(chips) { prompt ->
                Box(
                    modifier = Modifier
                        .background(SurfaceDark, RectangleShape)
                        .border(1.dp, BorderDark, RectangleShape)
                        .clickable { onQuickPrompt(prompt) }
                        .padding(horizontal = 9.dp, vertical = 5.dp)
                ) {
                    Text(
                        text = prompt,
                        color = TextWhite,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        // Input Area
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = onInputChange,
                placeholder = { Text("Ask FRIDAY or run tool...", color = TextMuted, fontSize = 12.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AccentYellow,
                    unfocusedBorderColor = BorderDark,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite,
                    focusedContainerColor = SurfaceDark,
                    unfocusedContainerColor = SurfaceDark
                ),
                shape = RectangleShape,
                modifier = Modifier.weight(1f)
            )

            Button(
                onClick = onSend,
                enabled = !isSending && inputText.isNotBlank(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = AccentYellow,
                    contentColor = Color.Black,
                    disabledContainerColor = SurfaceDark,
                    disabledContentColor = TextMuted
                ),
                shape = RectangleShape,
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp)
            ) {
                if (isSending) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.Black)
                } else {
                    Text("SEND", fontWeight = FontWeight.Black, fontSize = 11.5.sp)
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 2. VOICE VIEW (Real Audio Spectrum + Live Native STT & TTS)
// -----------------------------------------------------------------------------
@Composable
private fun VoiceView(
    assistantState: AssistantState,
    audioLevels: List<Float>,
    transcript: String,
    onToggleVoice: () -> Unit,
    onStopVoice: () -> Unit,
    onQuickPrompt: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        // Voice Mode Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceDark)
                .border(1.dp, BorderDark, RectangleShape)
                .padding(12.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "VOICE INTELLIGENCE",
                        color = AccentYellow,
                        fontWeight = FontWeight.Black,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Text(
                        text = when (assistantState) {
                            AssistantState.LISTENING -> "LIVE MIC ACTIVE"
                            AssistantState.SPEAKING -> "TTS PLAYBACK"
                            AssistantState.THINKING -> "PROCESSING"
                            else -> "STANDBY"
                        },
                        color = if (assistantState == AssistantState.LISTENING) DangerRed else SuccessGreen,
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    text = "Native SpeechRecognizer + Neural TextToSpeech on Apple Silicon/Android Core",
                    color = TextMuted,
                    fontSize = 10.sp
                )
            }
        }

        // Live Audio Spectrum Visualizer (16 real decibel bands)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(90.dp)
                .background(SurfaceDark)
                .border(1.5.dp, BorderDark, RectangleShape)
                .padding(horizontal = 14.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.Bottom
        ) {
            audioLevels.forEach { rawLevel ->
                val level by animateFloatAsState(
                    targetValue = rawLevel,
                    animationSpec = tween(durationMillis = 80, easing = LinearEasing),
                    label = "bar_anim"
                )
                val barColor = when (assistantState) {
                    AssistantState.LISTENING -> DangerRed
                    AssistantState.SPEAKING -> AccentYellow
                    AssistantState.THINKING -> AccentAmber
                    else -> BorderDark
                }
                Box(
                    modifier = Modifier
                        .width(10.dp)
                        .height((level * 74).coerceIn(4f, 74f).dp)
                        .background(barColor, RectangleShape)
                )
            }
        }

        // Live Captions / Transcript Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(SurfaceElevated)
                .border(1.5.dp, AccentYellow, RectangleShape)
                .padding(14.dp)
        ) {
            Column {
                Text(
                    text = "TRANSCRIPTION & SPOKEN RESPONSE",
                    color = AccentYellow,
                    fontWeight = FontWeight.Black,
                    fontSize = 10.sp,
                    fontFamily = FontFamily.Monospace
                )
                Spacer(Modifier.height(6.dp))
                Text(
                    text = transcript,
                    color = TextWhite,
                    fontSize = 13.sp,
                    lineHeight = 19.sp
                )
            }
        }

        // Push To Talk Big Button
        val isBusy = assistantState == AssistantState.LISTENING || assistantState == AssistantState.SPEAKING
        Button(
            onClick = {
                if (isBusy) onStopVoice() else onToggleVoice()
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = if (assistantState == AssistantState.LISTENING) DangerRed else AccentYellow,
                contentColor = Color.Black
            ),
            shape = RectangleShape,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
        ) {
            Text(
                text = when (assistantState) {
                    AssistantState.LISTENING -> "⏹️ STOP LISTENING"
                    AssistantState.SPEAKING -> "⏹️ STOP SPEAKING"
                    AssistantState.THINKING -> "⏳ THINKING..."
                    else -> "🎙️ PUSH TO TALK"
                },
                fontWeight = FontWeight.Black,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}

// -----------------------------------------------------------------------------
// 3. TOOLS VIEW (9 Working Device Tools + Interactive Dashboard)
// -----------------------------------------------------------------------------
@Composable
private fun ToolsView(
    state: FridayUiState,
    onRunTool: (String, String) -> Unit,
    onToggleTorch: () -> Unit,
    onAdjustVolume: (Int) -> Unit
) {
    var calcExpr by remember { mutableStateOf("48 * 2.5 + 8") }
    var searchQuery by remember { mutableStateOf("Latest AI research 2026") }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "DEVICE ACTIONS & TOOLS",
                    color = AccentYellow,
                    fontWeight = FontWeight.Black,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace
                )
                Text(
                    text = "9 WORKING CAPABILITIES",
                    color = TextMuted,
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        // Card 1: Flashlight Torch
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("🔦 FLASHLIGHT TORCH", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text(if (state.isTorchOn) "Status: ON 💡" else "Status: OFF", color = if (state.isTorchOn) AccentYellow else TextMuted, fontSize = 10.sp)
                    }
                    Button(
                        onClick = onToggleTorch,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (state.isTorchOn) AccentYellow else SurfaceElevated,
                            contentColor = if (state.isTorchOn) Color.Black else TextWhite
                        ),
                        shape = RectangleShape
                    ) {
                        Text(if (state.isTorchOn) "TURN OFF" else "TURN ON", fontWeight = FontWeight.Black, fontSize = 10.5.sp)
                    }
                }
            }
        }

        // Card 2: Real Device Telemetry
        item {
            val telem = state.hardwareTelemetry
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("📊 DEVICE TELEMETRY", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        Text("REFRESH", color = TextWhite, fontSize = 9.sp, modifier = Modifier.clickable { onRunTool("diagnostics", "") })
                    }
                    Text(
                        text = "Battery: ${telem?.batteryPct ?: 80}% (${if (telem?.isCharging == true) "Charging" else "Discharging"}) | RAM: ${telem?.ramUsedGb ?: 1.8}/${telem?.ramTotalGb ?: 4.0} GB",
                        color = TextWhite,
                        fontSize = 11.sp
                    )
                    Text(
                        text = "Storage: ${telem?.storageFreeGb ?: 42.0} GB free | OS: ${telem?.osVersion ?: "Android 16"}",
                        color = TextMuted,
                        fontSize = 10.sp
                    )
                }
            }
        }

        // Card 3: AST Math Calculator
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🧮 MATH CALCULATOR (AST SAFE)", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = calcExpr,
                            onValueChange = { calcExpr = it },
                            placeholder = { Text("Expression", fontSize = 11.sp) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AccentYellow,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedContainerColor = SurfaceElevated,
                                unfocusedContainerColor = SurfaceElevated
                            ),
                            shape = RectangleShape,
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = { onRunTool("calculate", calcExpr) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RectangleShape
                        ) {
                            Text("RUN", fontWeight = FontWeight.Black, fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // Card 4: Audio Volume Controller
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("🔊 MEDIA VOLUME", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        Text("Level: ${state.volumePercent}%", color = AccentYellow, fontSize = 10.sp)
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Button(
                            onClick = { onAdjustVolume(-1) },
                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated, contentColor = TextWhite),
                            shape = RectangleShape
                        ) {
                            Text("VOL -", fontWeight = FontWeight.Bold, fontSize = 10.sp)
                        }
                        Button(
                            onClick = { onAdjustVolume(1) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RectangleShape
                        ) {
                            Text("VOL +", fontWeight = FontWeight.Black, fontSize = 10.sp)
                        }
                    }
                }
            }
        }

        // Card 5: App Launcher (WhatsApp, Gmail, Chrome, Maps, YouTube)
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("📱 QUICK APP LAUNCHER", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("WhatsApp", "Gmail", "Chrome", "YouTube", "Maps").forEach { appName ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .background(SurfaceElevated)
                                    .border(1.dp, BorderDark, RectangleShape)
                                    .clickable { onRunTool("launch_app", appName) }
                                    .padding(vertical = 8.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(appName, color = TextWhite, fontSize = 9.sp, fontWeight = FontWeight.Bold, maxLines = 1)
                            }
                        }
                    }
                }
            }
        }

        // Card 6: Live Weather & World Clock
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RectangleShape)
                        .clickable { onRunTool("weather", "") }
                        .padding(12.dp)
                ) {
                    Column {
                        Text("⛅ WEATHER", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)
                        Spacer(Modifier.height(4.dp))
                        Text("Tap to fetch live forecast", color = TextMuted, fontSize = 9.5.sp)
                    }
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RectangleShape)
                        .clickable { onRunTool("clock", "") }
                        .padding(12.dp)
                ) {
                    Column {
                        Text("🕒 WORLD TIME", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)
                        Spacer(Modifier.height(4.dp))
                        Text("Tap for localized clock", color = TextMuted, fontSize = 9.5.sp)
                    }
                }
            }
        }

        // Card 7: Web Search
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🔍 DUCKDUCKGO SEARCH", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = { searchQuery = it },
                            placeholder = { Text("Query...", fontSize = 11.sp) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AccentYellow,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedContainerColor = SurfaceElevated,
                                unfocusedContainerColor = SurfaceElevated
                            ),
                            shape = RectangleShape,
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = { onRunTool("web_search", searchQuery) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RectangleShape
                        ) {
                            Text("SEARCH", fontWeight = FontWeight.Black, fontSize = 10.5.sp)
                        }
                    }
                }
            }
        }

        // Action Ledger (Recent Execution History)
        if (state.actionLedger.isNotEmpty()) {
            item {
                Text("RECENT ACTION LEDGER", color = TextMuted, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace)
            }
            items(state.actionLedger.take(5)) { item ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceElevated)
                        .border(1.dp, BorderDark, RectangleShape)
                        .padding(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(item.tool.uppercase(), color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 10.sp)
                            Text(item.result, color = TextWhite, fontSize = 11.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        }
                        Text("${item.durationMs}ms", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 4. ASSIST VIEW (Apple Intelligence Writing Tools Studio)
// -----------------------------------------------------------------------------
@Composable
private fun AssistView(
    state: FridayUiState,
    onSandboxInputChange: (String) -> Unit,
    onSetWritingMode: (String) -> Unit,
    onSetTargetLanguage: (String) -> Unit,
    onRunTransform: () -> Unit,
    onToggleFloatingService: () -> Unit,
    onOpenAccessibilitySettings: () -> Unit
) {
    val clipboard = LocalClipboardManager.current
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // System Integration Banners
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.5.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("SYSTEM WRITING COMPANION", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Floating Siri Overlay", color = TextWhite, fontSize = 11.sp)
                            Text(if (state.isFloatingRunning) "ACTIVE OVER ALL APPS" else "DISABLED", color = if (state.isFloatingRunning) SuccessGreen else TextMuted, fontSize = 9.sp)
                        }
                        Button(
                            onClick = onToggleFloatingService,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (state.isFloatingRunning) DangerRed else AccentYellow,
                                contentColor = Color.Black
                            ),
                            shape = RectangleShape
                        ) {
                            Text(if (state.isFloatingRunning) "STOP" else "START", fontWeight = FontWeight.Black, fontSize = 10.sp)
                        }
                    }
                }
            }
        }

        // Writing Studio Input Box
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("TEXT TO TRANSFORM", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                        Text("${state.sandboxInput.length} chars • ${state.sandboxInput.split(Regex("\\s+")).filter { it.isNotBlank() }.size} words", color = TextMuted, fontSize = 9.sp)
                    }

                    OutlinedTextField(
                        value = state.sandboxInput,
                        onValueChange = onSandboxInputChange,
                        placeholder = { Text("Type or paste message to polish...", fontSize = 12.sp) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AccentYellow,
                            unfocusedBorderColor = BorderDark,
                            focusedTextColor = TextWhite,
                            unfocusedTextColor = TextWhite,
                            focusedContainerColor = SurfaceElevated,
                            unfocusedContainerColor = SurfaceElevated
                        ),
                        shape = RectangleShape,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp)
                    )

                    // Quick Template Chips
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val templates = listOf(
                            "WhatsApp Reply" to "hey let me know if u can come today at 5pm",
                            "Gmail Follow-up" to "i wanted to see if u have looked at the report we discussed",
                            "Meeting Request" to "are you free tomorrow to discuss the new mobile project",
                            "Apology / Delay" to "sorry for the delay i was stuck in another meeting"
                        )
                        items(templates) { (label, text) ->
                            Box(
                                modifier = Modifier
                                    .background(SurfaceElevated)
                                    .border(1.dp, BorderDark, RectangleShape)
                                    .clickable { onSandboxInputChange(text) }
                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                            ) {
                                Text(label, color = TextWhite, fontSize = 9.5.sp)
                            }
                        }
                    }
                }
            }
        }

        // 5 Writing Modes Row
        item {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("SELECT WRITING MODE", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    listOf(
                        "Grammar" to "Proofread",
                        "Professional" to "Gmail",
                        "Casual" to "WhatsApp",
                        "Concise" to "Summary",
                        "Translate" to "Translate"
                    ).forEach { (mode, label) ->
                        val isSel = state.selectedWritingMode.equals(mode, ignoreCase = true)
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(if (isSel) AccentYellow else SurfaceDark)
                                .border(1.dp, if (isSel) AccentYellow else BorderDark, RectangleShape)
                                .clickable { onSetWritingMode(mode) }
                                .padding(vertical = 7.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                color = if (isSel) Color.Black else TextWhite,
                                fontSize = 9.5.sp,
                                fontWeight = if (isSel) FontWeight.Black else FontWeight.Bold,
                                maxLines = 1
                            )
                        }
                    }
                }
            }
        }

        // Target Language Chips (if Translate mode selected)
        if (state.selectedWritingMode.equals("Translate", ignoreCase = true)) {
            item {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("TARGET LANGUAGE", color = TextMuted, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val langs = listOf("Spanish", "French", "German", "Hindi", "Japanese", "Italian")
                        items(langs) { lang ->
                            val isSel = state.selectedTargetLang.equals(lang, ignoreCase = true)
                            Box(
                                modifier = Modifier
                                    .background(if (isSel) AccentYellow else SurfaceElevated)
                                    .border(1.dp, if (isSel) AccentYellow else BorderDark, RectangleShape)
                                    .clickable { onSetTargetLanguage(lang) }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Text(lang, color = if (isSel) Color.Black else TextWhite, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }

        // Execute Transform Button
        item {
            Button(
                onClick = onRunTransform,
                enabled = !state.isAnalyzing && state.sandboxInput.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                shape = RectangleShape,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                if (state.isAnalyzing) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.Black, strokeWidth = 2.dp)
                } else {
                    Text("✨ TRANSFORM TEXT (${state.selectedWritingMode.uppercase()})", fontWeight = FontWeight.Black, fontSize = 12.sp)
                }
            }
        }

        // Result Card
        if (state.sandboxResult != null) {
            val result = state.sandboxResult
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(SurfaceElevated)
                        .border(1.5.dp, AccentYellow, RectangleShape)
                        .padding(14.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("POLISHED OUTPUT", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            Text(if (result.isOnline) "LOCAL OLLAMA" else "OFFLINE ENGINE", color = if (result.isOnline) SuccessGreen else AccentYellow, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                        }

                        Text(
                            text = result.correctedText,
                            color = TextWhite,
                            fontSize = 12.5.sp,
                            lineHeight = 18.sp
                        )

                        Text(
                            text = result.explanation,
                            color = TextMuted,
                            fontSize = 10.sp
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = {
                                    clipboard.setText(AnnotatedString(result.correctedText))
                                    Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                                shape = RectangleShape,
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("COPY RESULT", fontWeight = FontWeight.Black, fontSize = 10.5.sp)
                            }

                            Button(
                                onClick = {
                                    val sendIntent = Intent().apply {
                                        action = Intent.ACTION_SEND
                                        putExtra(Intent.EXTRA_TEXT, result.correctedText)
                                        type = "text/plain"
                                    }
                                    context.startActivity(Intent.createChooser(sendIntent, "Share polished text"))
                                },
                                colors = ButtonDefaults.buttonColors(containerColor = SurfaceDark, contentColor = TextWhite),
                                shape = RectangleShape,
                                modifier = Modifier.weight(1f).border(1.dp, BorderDark, RectangleShape)
                            ) {
                                Text("SHARE", fontWeight = FontWeight.Bold, fontSize = 10.5.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// 5. STATUS VIEW (Control Room, Server IP Configurator & Permissions)
// -----------------------------------------------------------------------------
@Composable
private fun StatusView(
    state: FridayUiState,
    onToggleService: (Boolean) -> Unit,
    onRefresh: () -> Unit,
    onSetServerUrl: (String) -> Unit,
    onClearChat: () -> Unit,
    onToggleFloating: () -> Unit,
    onOpenAccessibility: () -> Unit
) {
    var serverUrlInput by remember { mutableStateOf(state.customServerUrl) }
    val context = LocalContext.current

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Host Server URL Configurator Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.5.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("HOST BACKEND SERVER CONFIG", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)
                    Text("Configure host IP/port (default: http://10.0.2.2:8080)", color = TextMuted, fontSize = 9.5.sp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        OutlinedTextField(
                            value = serverUrlInput,
                            onValueChange = { serverUrlInput = it },
                            placeholder = { Text("http://10.0.2.2:8080", fontSize = 11.sp) },
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = AccentYellow,
                                unfocusedBorderColor = BorderDark,
                                focusedTextColor = TextWhite,
                                unfocusedTextColor = TextWhite,
                                focusedContainerColor = SurfaceElevated,
                                unfocusedContainerColor = SurfaceElevated
                            ),
                            shape = RectangleShape,
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = { onSetServerUrl(serverUrlInput) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RectangleShape
                        ) {
                            Text("SAVE", fontWeight = FontWeight.Black, fontSize = 11.sp)
                        }
                    }
                }
            }
        }

        // Live Health Telemetry
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("SYSTEM TELEMETRY", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)
                        Text(if (state.backendHealth.isOnline) "STATUS: ONLINE" else "STATUS: LOCAL", color = if (state.backendHealth.isOnline) SuccessGreen else AccentYellow, fontSize = 10.sp, fontWeight = FontWeight.Bold)
                    }
                    Text("• LLM Engine: ${state.backendHealth.model}", color = TextWhite, fontSize = 11.sp)
                    Text("• Host Latency: ${if (state.pingMs > 0) "${state.pingMs} ms" else "Offline"}", color = TextWhite, fontSize = 11.sp)
                    Text("• Agent Tools Registered: ${state.backendHealth.toolCount} available", color = TextWhite, fontSize = 11.sp)
                    Text("• Memory Items Stored: ${state.backendHealth.totalMemories} records", color = TextWhite, fontSize = 11.sp)
                }
            }
        }

        // Permissions & Services
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RectangleShape)
                    .padding(12.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("PERMISSIONS & OVERLAYS", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)

                    // Floating Overlay
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Siri Floating Overlay", color = TextWhite, fontSize = 11.5.sp)
                            Text(if (state.isFloatingRunning) "Active on display" else "Inactive", color = TextMuted, fontSize = 9.sp)
                        }
                        Button(
                            onClick = onToggleFloating,
                            colors = ButtonDefaults.buttonColors(containerColor = if (state.isFloatingRunning) DangerRed else AccentYellow, contentColor = Color.Black),
                            shape = RectangleShape
                        ) {
                            Text(if (state.isFloatingRunning) "DISABLE" else "ENABLE", fontWeight = FontWeight.Bold, fontSize = 9.5.sp)
                        }
                    }

                    // Accessibility Service
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Accessibility Writing Service", color = TextWhite, fontSize = 11.5.sp)
                            Text(if (state.isAccessibilityRunning) "Hooks active in WhatsApp/Gmail" else "Not enabled", color = TextMuted, fontSize = 9.sp)
                        }
                        Button(
                            onClick = onOpenAccessibility,
                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated, contentColor = TextWhite),
                            shape = RectangleShape,
                            modifier = Modifier.border(1.dp, BorderDark, RectangleShape)
                        ) {
                            Text("SETTINGS", fontWeight = FontWeight.Bold, fontSize = 9.5.sp)
                        }
                    }
                }
            }
        }

        // Database Reset
        item {
            Button(
                onClick = onClearChat,
                colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated, contentColor = DangerRed),
                shape = RectangleShape,
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, DangerRed, RectangleShape)
                    .height(44.dp)
            ) {
                Text("RESET CONSOLE DATABASE", fontWeight = FontWeight.Black, fontSize = 11.sp)
            }
        }
    }
}
