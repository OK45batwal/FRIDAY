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
import androidx.compose.animation.animateColorAsState
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
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Fill
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

// -----------------------------------------------------------------------------
// Modern Vector Icon System
// -----------------------------------------------------------------------------
enum class ModernIconType {
    CHAT, VOICE, TOOLS, ASSIST, STATUS, SEND, COPY, CHECK, SPEAKER, TRASH, REFRESH, SPARKLE, CLOUD, CPU, CALC, FOLDER, TORCH, SEARCH
}

@Composable
fun ModernIcon(
    type: ModernIconType,
    tint: Color,
    modifier: Modifier = Modifier
) {
    Canvas(modifier = modifier) {
        val w = size.width
        val h = size.height
        val sw = (w * 0.10f).coerceAtLeast(1.5f)

        when (type) {
            ModernIconType.CHAT -> {
                val path = Path().apply {
                    moveTo(w * 0.15f, h * 0.20f)
                    lineTo(w * 0.85f, h * 0.20f)
                    quadraticTo(w * 0.95f, h * 0.20f, w * 0.95f, h * 0.30f)
                    lineTo(w * 0.95f, h * 0.65f)
                    quadraticTo(w * 0.95f, h * 0.75f, w * 0.85f, h * 0.75f)
                    lineTo(w * 0.45f, h * 0.75f)
                    lineTo(w * 0.22f, h * 0.92f)
                    lineTo(w * 0.25f, h * 0.75f)
                    lineTo(w * 0.15f, h * 0.75f)
                    quadraticTo(w * 0.05f, h * 0.75f, w * 0.05f, h * 0.65f)
                    lineTo(w * 0.05f, h * 0.30f)
                    quadraticTo(w * 0.05f, h * 0.20f, w * 0.15f, h * 0.20f)
                    close()
                }
                drawPath(path, color = tint, style = Stroke(width = sw, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
            ModernIconType.VOICE -> {
                drawRoundRect(
                    color = tint,
                    topLeft = androidx.compose.ui.geometry.Offset(w * 0.36f, h * 0.12f),
                    size = androidx.compose.ui.geometry.Size(w * 0.28f, h * 0.50f),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.14f, w * 0.14f),
                    style = Stroke(width = sw)
                )
                drawArc(
                    color = tint,
                    startAngle = 0f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = androidx.compose.ui.geometry.Offset(w * 0.20f, h * 0.32f),
                    size = androidx.compose.ui.geometry.Size(w * 0.60f, h * 0.42f),
                    style = Stroke(width = sw, cap = StrokeCap.Round)
                )
                drawLine(color = tint, start = androidx.compose.ui.geometry.Offset(w * 0.50f, h * 0.74f), end = androidx.compose.ui.geometry.Offset(w * 0.50f, h * 0.90f), strokeWidth = sw, cap = StrokeCap.Round)
                drawLine(color = tint, start = androidx.compose.ui.geometry.Offset(w * 0.30f, h * 0.90f), end = androidx.compose.ui.geometry.Offset(w * 0.70f, h * 0.90f), strokeWidth = sw, cap = StrokeCap.Round)
            }
            ModernIconType.TOOLS -> {
                val path = Path().apply {
                    moveTo(w * 0.75f, h * 0.15f)
                    lineTo(w * 0.85f, h * 0.25f)
                    lineTo(w * 0.65f, h * 0.45f)
                    lineTo(w * 0.30f, h * 0.80f)
                    lineTo(w * 0.18f, h * 0.82f)
                    lineTo(w * 0.20f, h * 0.70f)
                    lineTo(w * 0.55f, h * 0.35f)
                    close()
                }
                drawPath(path, color = tint, style = Stroke(width = sw, cap = StrokeCap.Round, join = StrokeJoin.Round))
                drawCircle(color = tint, radius = w * 0.10f, center = androidx.compose.ui.geometry.Offset(w * 0.75f, h * 0.25f), style = Stroke(width = sw))
            }
            ModernIconType.ASSIST -> {
                val path = Path().apply {
                    moveTo(w * 0.50f, h * 0.08f)
                    lineTo(w * 0.62f, h * 0.38f)
                    lineTo(w * 0.92f, h * 0.50f)
                    lineTo(w * 0.62f, h * 0.62f)
                    lineTo(w * 0.50f, h * 0.92f)
                    lineTo(w * 0.38f, h * 0.62f)
                    lineTo(w * 0.08f, h * 0.50f)
                    lineTo(w * 0.38f, h * 0.38f)
                    close()
                }
                drawPath(path, color = tint, style = Fill)
            }
            ModernIconType.STATUS -> {
                val path = Path().apply {
                    moveTo(w * 0.10f, h * 0.55f)
                    lineTo(w * 0.30f, h * 0.55f)
                    lineTo(w * 0.45f, h * 0.22f)
                    lineTo(w * 0.60f, h * 0.82f)
                    lineTo(w * 0.72f, h * 0.55f)
                    lineTo(w * 0.90f, h * 0.55f)
                }
                drawPath(path, color = tint, style = Stroke(width = sw, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
            ModernIconType.SEND -> {
                val path = Path().apply {
                    moveTo(w * 0.90f, h * 0.12f)
                    lineTo(w * 0.15f, h * 0.48f)
                    lineTo(w * 0.45f, h * 0.58f)
                    lineTo(w * 0.55f, h * 0.88f)
                    close()
                }
                drawPath(path, color = tint, style = Fill)
            }
            ModernIconType.COPY -> {
                drawRoundRect(
                    color = tint,
                    topLeft = androidx.compose.ui.geometry.Offset(w * 0.32f, h * 0.32f),
                    size = androidx.compose.ui.geometry.Size(w * 0.56f, h * 0.56f),
                    cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.08f, w * 0.08f),
                    style = Stroke(width = sw)
                )
                val path = Path().apply {
                    moveTo(w * 0.68f, h * 0.20f)
                    lineTo(w * 0.20f, h * 0.20f)
                    lineTo(w * 0.20f, h * 0.68f)
                }
                drawPath(path, color = tint, style = Stroke(width = sw, cap = StrokeCap.Round))
            }
            ModernIconType.CHECK -> {
                val path = Path().apply {
                    moveTo(w * 0.18f, h * 0.50f)
                    lineTo(w * 0.40f, h * 0.76f)
                    lineTo(w * 0.84f, h * 0.24f)
                }
                drawPath(path, color = tint, style = Stroke(width = sw * 1.3f, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
            ModernIconType.SPEAKER -> {
                val path = Path().apply {
                    moveTo(w * 0.18f, h * 0.38f)
                    lineTo(w * 0.36f, h * 0.38f)
                    lineTo(w * 0.58f, h * 0.20f)
                    lineTo(w * 0.58f, h * 0.80f)
                    lineTo(w * 0.36f, h * 0.62f)
                    lineTo(w * 0.18f, h * 0.62f)
                    close()
                }
                drawPath(path, color = tint, style = Fill)
                drawArc(
                    color = tint,
                    startAngle = -45f,
                    sweepAngle = 90f,
                    useCenter = false,
                    topLeft = androidx.compose.ui.geometry.Offset(w * 0.55f, h * 0.30f),
                    size = androidx.compose.ui.geometry.Size(w * 0.30f, h * 0.40f),
                    style = Stroke(width = sw, cap = StrokeCap.Round)
                )
            }
            ModernIconType.TRASH -> {
                drawLine(color = tint, start = androidx.compose.ui.geometry.Offset(w * 0.20f, h * 0.25f), end = androidx.compose.ui.geometry.Offset(w * 0.80f, h * 0.25f), strokeWidth = sw, cap = StrokeCap.Round)
                drawRoundRect(color = tint, topLeft = androidx.compose.ui.geometry.Offset(w * 0.28f, h * 0.25f), size = androidx.compose.ui.geometry.Size(w * 0.44f, h * 0.62f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.08f, w * 0.08f), style = Stroke(width = sw))
            }
            ModernIconType.REFRESH -> {
                drawArc(color = tint, startAngle = 30f, sweepAngle = 280f, useCenter = false, topLeft = androidx.compose.ui.geometry.Offset(w * 0.18f, h * 0.18f), size = androidx.compose.ui.geometry.Size(w * 0.64f, h * 0.64f), style = Stroke(width = sw, cap = StrokeCap.Round))
            }
            ModernIconType.SPARKLE -> {
                drawCircle(color = tint, radius = w * 0.25f, center = androidx.compose.ui.geometry.Offset(w * 0.5f, h * 0.5f), style = Fill)
            }
            ModernIconType.CLOUD -> {
                drawCircle(color = tint, radius = w * 0.22f, center = androidx.compose.ui.geometry.Offset(w * 0.42f, h * 0.45f), style = Stroke(width = sw))
                drawCircle(color = tint, radius = w * 0.18f, center = androidx.compose.ui.geometry.Offset(w * 0.68f, h * 0.55f), style = Stroke(width = sw))
            }
            ModernIconType.CPU -> {
                drawRoundRect(color = tint, topLeft = androidx.compose.ui.geometry.Offset(w * 0.25f, h * 0.25f), size = androidx.compose.ui.geometry.Size(w * 0.50f, h * 0.50f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.08f, w * 0.08f), style = Stroke(width = sw))
                drawRoundRect(color = tint, topLeft = androidx.compose.ui.geometry.Offset(w * 0.38f, h * 0.38f), size = androidx.compose.ui.geometry.Size(w * 0.24f, h * 0.24f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.04f, w * 0.04f), style = Fill)
            }
            ModernIconType.CALC -> {
                drawRoundRect(color = tint, topLeft = androidx.compose.ui.geometry.Offset(w * 0.20f, h * 0.12f), size = androidx.compose.ui.geometry.Size(w * 0.60f, h * 0.76f), cornerRadius = androidx.compose.ui.geometry.CornerRadius(w * 0.10f, w * 0.10f), style = Stroke(width = sw))
                drawLine(color = tint, start = androidx.compose.ui.geometry.Offset(w * 0.30f, h * 0.28f), end = androidx.compose.ui.geometry.Offset(w * 0.70f, h * 0.28f), strokeWidth = sw)
            }
            ModernIconType.FOLDER -> {
                val path = Path().apply {
                    moveTo(w * 0.15f, h * 0.25f)
                    lineTo(w * 0.40f, h * 0.25f)
                    lineTo(w * 0.48f, h * 0.35f)
                    lineTo(w * 0.85f, h * 0.35f)
                    lineTo(w * 0.85f, h * 0.80f)
                    lineTo(w * 0.15f, h * 0.80f)
                    close()
                }
                drawPath(path, color = tint, style = Stroke(width = sw, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
            ModernIconType.TORCH -> {
                val path = Path().apply {
                    moveTo(w * 0.30f, h * 0.15f)
                    lineTo(w * 0.70f, h * 0.15f)
                    lineTo(w * 0.60f, h * 0.40f)
                    lineTo(w * 0.60f, h * 0.85f)
                    lineTo(w * 0.40f, h * 0.85f)
                    lineTo(w * 0.40f, h * 0.40f)
                    close()
                }
                drawPath(path, color = tint, style = Stroke(width = sw, cap = StrokeCap.Round, join = StrokeJoin.Round))
            }
            ModernIconType.SEARCH -> {
                drawCircle(color = tint, radius = w * 0.28f, center = androidx.compose.ui.geometry.Offset(w * 0.42f, h * 0.42f), style = Stroke(width = sw))
                drawLine(color = tint, start = androidx.compose.ui.geometry.Offset(w * 0.62f, h * 0.62f), end = androidx.compose.ui.geometry.Offset(w * 0.85f, h * 0.85f), strokeWidth = sw * 1.3f, cap = StrokeCap.Round)
            }
        }
    }
}

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
            .border(width = 1.dp, color = BorderDark, shape = RectangleShape)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(AccentYellow)
                    .padding(horizontal = 8.dp, vertical = 4.dp)
            ) {
                Text(
                    text = "FRIDAY",
                    color = Color.Black,
                    fontWeight = FontWeight.Black,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 0.8.sp
                )
            }
            Spacer(Modifier.width(10.dp))
            Column {
                Text(
                    text = "INTELLIGENCE CORE",
                    color = TextWhite,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    letterSpacing = 0.3.sp
                )
                Text(
                    text = "v3.0 • ON-DEVICE METAL",
                    color = TextMuted,
                    fontSize = 9.5.sp,
                    fontFamily = FontFamily.Monospace
                )
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(16.dp))
                    .background(if (isOnline) Color(0xFF0A2918) else Color(0xFF2E2600))
                    .border(
                        1.dp,
                        if (isOnline) SuccessGreen.copy(alpha = 0.8f) else AccentYellow.copy(alpha = 0.8f),
                        RoundedCornerShape(16.dp)
                    )
                    .clickable { onRefresh() }
                    .padding(horizontal = 10.dp, vertical = 5.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(7.dp)
                            .background(if (isOnline) SuccessGreen else AccentYellow, CircleShape)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = if (isOnline) {
                            if (pingMs > 0) "ONLINE • ${pingMs}ms" else "ONLINE"
                        } else {
                            "LOCAL ONLY"
                        },
                        color = if (isOnline) SuccessGreen else AccentYellow,
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    Spacer(Modifier.width(4.dp))
                    ModernIcon(
                        type = ModernIconType.REFRESH,
                        tint = if (isOnline) SuccessGreen else AccentYellow,
                        modifier = Modifier.size(10.dp)
                    )
                }
            }
        }
    }
}

// -----------------------------------------------------------------------------
// Bottom Console Navigation (Floating Modern Dock with Vector Icons)
// -----------------------------------------------------------------------------
@Composable
private fun BottomConsoleNav(
    currentTab: ConsoleTab,
    onSelect: (ConsoleTab) -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(SurfaceDark)
            .navigationBarsPadding()
            .padding(horizontal = 12.dp, vertical = 6.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(22.dp))
                .background(SurfaceElevated)
                .border(1.dp, BorderDark, RoundedCornerShape(22.dp))
                .padding(4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            listOf(
                Triple(ConsoleTab.CHAT, "CHAT", ModernIconType.CHAT),
                Triple(ConsoleTab.VOICE, "VOICE", ModernIconType.VOICE),
                Triple(ConsoleTab.TOOLS, "TOOLS", ModernIconType.TOOLS),
                Triple(ConsoleTab.ASSIST, "ASSIST", ModernIconType.ASSIST),
                Triple(ConsoleTab.STATUS, "STATUS", ModernIconType.STATUS)
            ).forEach { (tab, label, iconType) ->
                val isSelected = currentTab == tab
                val animBg by animateColorAsState(
                    targetValue = if (isSelected) AccentYellow else Color.Transparent,
                    animationSpec = tween(180),
                    label = "tab_bg"
                )
                val animFg by animateColorAsState(
                    targetValue = if (isSelected) Color.Black else TextMuted,
                    animationSpec = tween(180),
                    label = "tab_fg"
                )

                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(16.dp))
                        .background(animBg)
                        .clickable { onSelect(tab) }
                        .padding(vertical = 7.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        ModernIcon(
                            type = iconType,
                            tint = animFg,
                            modifier = Modifier.size(17.dp)
                        )
                        Spacer(Modifier.height(3.dp))
                        Text(
                            text = label,
                            color = animFg,
                            fontWeight = if (isSelected) FontWeight.Black else FontWeight.SemiBold,
                            fontSize = 9.sp,
                            fontFamily = FontFamily.Monospace,
                            maxLines = 1
                        )
                    }
                }
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

private fun formatTimestamp(millis: Long): String {
    return try {
        java.text.SimpleDateFormat("HH:mm:ss", java.util.Locale.getDefault()).format(java.util.Date(millis))
    } catch (e: Exception) {
        ""
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
                    if (isUser) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.86f)
                                .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp, bottomStart = 18.dp, bottomEnd = 4.dp))
                                .background(Color(0xFF222015))
                                .border(1.dp, BorderHighlight.copy(alpha = 0.5f), RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp, bottomStart = 18.dp, bottomEnd = 4.dp))
                                .padding(12.dp)
                        ) {
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .size(16.dp)
                                                .background(AccentYellow, CircleShape),
                                            contentAlignment = Alignment.Center
                                        ) {
                                            Text("U", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.Black)
                                        }
                                        Spacer(Modifier.width(6.dp))
                                        Text("YOU", color = AccentYellow, fontWeight = FontWeight.Bold, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                                    }
                                    Text(
                                        text = formatTimestamp(msg.createdAt),
                                        color = TextMuted,
                                        fontSize = 9.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                Spacer(Modifier.height(6.dp))
                                Text(
                                    text = msg.text,
                                    color = TextWhite,
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp
                                )
                            }
                        }
                    } else {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth(0.94f)
                                .clip(RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp, bottomStart = 4.dp, bottomEnd = 18.dp))
                                .background(SurfaceElevated)
                                .border(1.dp, BorderDark, RoundedCornerShape(topStart = 18.dp, topEnd = 18.dp, bottomStart = 4.dp, bottomEnd = 18.dp))
                                .padding(12.dp)
                        ) {
                            Column {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(4.dp))
                                                .background(AccentYellow)
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text("FRIDAY", color = Color.Black, fontSize = 9.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
                                        }
                                        Spacer(Modifier.width(6.dp))
                                        Box(
                                            modifier = Modifier
                                                .clip(RoundedCornerShape(10.dp))
                                                .background(Color(0xFF0A2918))
                                                .border(0.5.dp, SuccessGreen, RoundedCornerShape(10.dp))
                                                .padding(horizontal = 6.dp, vertical = 2.dp)
                                        ) {
                                            Text("ON-DEVICE", color = SuccessGreen, fontSize = 8.5.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                                        }
                                    }
                                    Text(
                                        text = formatTimestamp(msg.createdAt),
                                        color = TextMuted,
                                        fontSize = 9.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                Spacer(Modifier.height(8.dp))
                                Text(
                                    text = msg.text,
                                    color = TextWhite,
                                    fontSize = 13.sp,
                                    lineHeight = 19.sp
                                )

                                Spacer(Modifier.height(10.dp))
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.End,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    var copied by remember { mutableStateOf(false) }
                                    Row(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(SurfaceDark)
                                            .border(0.8.dp, BorderDark, RoundedCornerShape(12.dp))
                                            .clickable {
                                                clipboard.setText(AnnotatedString(msg.text))
                                                copied = true
                                                Toast.makeText(context, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                                            }
                                            .padding(horizontal = 8.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        ModernIcon(
                                            type = if (copied) ModernIconType.CHECK else ModernIconType.COPY,
                                            tint = if (copied) SuccessGreen else TextMuted,
                                            modifier = Modifier.size(12.dp)
                                        )
                                        Spacer(Modifier.width(4.dp))
                                        Text(
                                            text = if (copied) "COPIED" else "COPY",
                                            color = if (copied) SuccessGreen else TextMuted,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }

                                    Spacer(Modifier.width(6.dp))
                                    Row(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .background(SurfaceDark)
                                            .border(0.8.dp, BorderDark, RoundedCornerShape(12.dp))
                                            .clickable { onSpeak(msg.text) }
                                            .padding(horizontal = 8.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        ModernIcon(type = ModernIconType.SPEAKER, tint = AccentYellow, modifier = Modifier.size(12.dp))
                                        Spacer(Modifier.width(4.dp))
                                        Text(
                                            text = "SPEAK",
                                            color = AccentYellow,
                                            fontSize = 9.sp,
                                            fontWeight = FontWeight.Bold,
                                            fontFamily = FontFamily.Monospace
                                        )
                                    }
                                }
                            }
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
                "Hardware status" to ModernIconType.CPU,
                "Current weather" to ModernIconType.CLOUD,
                "Calc 128*32" to ModernIconType.CALC,
                "Torch on" to ModernIconType.TORCH,
                "Draft email" to ModernIconType.ASSIST
            )
            items(chips) { (prompt, icon) ->
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                        .clickable { onQuickPrompt(prompt) }
                        .padding(horizontal = 10.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    ModernIcon(type = icon, tint = AccentYellow, modifier = Modifier.size(12.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = prompt,
                        color = TextWhite,
                        fontSize = 10.5.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }
        }

        // Input Area
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = inputText,
                onValueChange = onInputChange,
                placeholder = { Text("Ask FRIDAY or run tool...", color = TextMuted, fontSize = 12.5.sp) },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AccentYellow,
                    unfocusedBorderColor = BorderDark,
                    focusedTextColor = TextWhite,
                    unfocusedTextColor = TextWhite,
                    focusedContainerColor = SurfaceDark,
                    unfocusedContainerColor = SurfaceDark
                ),
                shape = RoundedCornerShape(22.dp),
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
                shape = RoundedCornerShape(22.dp),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 12.dp)
            ) {
                if (isSending) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp, color = Color.Black)
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ModernIcon(type = ModernIconType.SEND, tint = if (inputText.isNotBlank()) Color.Black else TextMuted, modifier = Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("SEND", fontWeight = FontWeight.Black, fontSize = 11.sp, letterSpacing = 0.5.sp)
                    }
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
                .clip(RoundedCornerShape(16.dp))
                .background(SurfaceDark)
                .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                .padding(14.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ModernIcon(type = ModernIconType.VOICE, tint = AccentYellow, modifier = Modifier.size(15.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "VOICE INTELLIGENCE",
                            color = AccentYellow,
                            fontWeight = FontWeight.Black,
                            fontSize = 11.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(10.dp))
                            .background(if (assistantState == AssistantState.LISTENING) Color(0xFF330A0A) else Color(0xFF0A2918))
                            .border(0.5.dp, if (assistantState == AssistantState.LISTENING) DangerRed else SuccessGreen, RoundedCornerShape(10.dp))
                            .padding(horizontal = 7.dp, vertical = 2.dp)
                    ) {
                        Text(
                            text = when (assistantState) {
                                AssistantState.LISTENING -> "LIVE MIC ACTIVE"
                                AssistantState.SPEAKING -> "TTS PLAYBACK"
                                AssistantState.THINKING -> "PROCESSING"
                                else -> "STANDBY"
                            },
                            color = if (assistantState == AssistantState.LISTENING) DangerRed else SuccessGreen,
                            fontWeight = FontWeight.Bold,
                            fontSize = 9.5.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                }
                Spacer(Modifier.height(6.dp))
                Text(
                    text = "Native SpeechRecognizer + Neural TextToSpeech on On-Device Hardware",
                    color = TextMuted,
                    fontSize = 10.sp
                )
            }
        }

        // Live Audio Spectrum Visualizer (16 real decibel bands)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(96.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(SurfaceDark)
                .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                .padding(horizontal = 14.dp, vertical = 10.dp),
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
                        .width(11.dp)
                        .height((level * 74).coerceIn(5f, 74f).dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(barColor)
                )
            }
        }

        // Live Captions / Transcript Card
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(SurfaceElevated)
                .border(1.2.dp, BorderHighlight.copy(alpha = 0.8f), RoundedCornerShape(16.dp))
                .padding(14.dp)
        ) {
            Column {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ModernIcon(type = ModernIconType.ASSIST, tint = AccentYellow, modifier = Modifier.size(13.dp))
                    Spacer(Modifier.width(6.dp))
                    Text(
                        text = "TRANSCRIPTION & SPOKEN RESPONSE",
                        color = AccentYellow,
                        fontWeight = FontWeight.Black,
                        fontSize = 10.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Spacer(Modifier.height(8.dp))
                Text(
                    text = transcript.ifBlank { "Ready for vocal prompt. Tap PUSH TO TALK to speak." },
                    color = TextWhite,
                    fontSize = 13.sp,
                    lineHeight = 19.sp
                )
            }
        }

        // Push To Talk Big Button
        val isBusy = assistantState == AssistantState.LISTENING || assistantState == AssistantState.SPEAKING
        val voiceBtnBg by animateColorAsState(
            targetValue = when (assistantState) {
                AssistantState.LISTENING -> DangerRed
                AssistantState.SPEAKING -> SuccessGreen
                AssistantState.THINKING -> AccentAmber
                else -> AccentYellow
            },
            animationSpec = tween(220),
            label = "voice_btn_bg"
        )

        Button(
            onClick = {
                if (isBusy) onStopVoice() else onToggleVoice()
            },
            colors = ButtonDefaults.buttonColors(
                containerColor = voiceBtnBg,
                contentColor = Color.Black
            ),
            shape = RoundedCornerShape(30.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(60.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                ModernIcon(
                    type = if (isBusy) ModernIconType.STATUS else ModernIconType.VOICE,
                    tint = Color.Black,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(Modifier.width(10.dp))
                Text(
                    text = when (assistantState) {
                        AssistantState.LISTENING -> "STOP LISTENING"
                        AssistantState.SPEAKING -> "STOP SPEAKING"
                        AssistantState.THINKING -> "THINKING..."
                        else -> "PUSH TO TALK"
                    },
                    fontWeight = FontWeight.Black,
                    fontSize = 13.5.sp,
                    fontFamily = FontFamily.Monospace,
                    letterSpacing = 0.5.sp
                )
            }
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
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        item {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    ModernIcon(
                        type = ModernIconType.TOOLS,
                        tint = AccentYellow,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        text = "DEVICE ACTIONS & TOOLS",
                        color = AccentYellow,
                        fontWeight = FontWeight.Black,
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceElevated)
                        .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                        .padding(horizontal = 8.dp, vertical = 3.dp)
                ) {
                    Text(
                        text = "9 CAPABILITIES",
                        color = TextMuted,
                        fontSize = 9.sp,
                        fontFamily = FontFamily.Monospace,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Card 1: Flashlight Torch
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, if (state.isTorchOn) AccentYellow.copy(alpha = 0.5f) else BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(if (state.isTorchOn) AccentYellow.copy(alpha = 0.2f) else SurfaceElevated),
                            contentAlignment = Alignment.Center
                        ) {
                            ModernIcon(
                                type = ModernIconType.TORCH,
                                tint = if (state.isTorchOn) AccentYellow else TextMuted,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(Modifier.width(12.dp))
                        Column {
                            Text("FLASHLIGHT TORCH", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(Modifier.height(2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(if (state.isTorchOn) AccentYellow else TextMuted.copy(alpha = 0.5f), CircleShape)
                                )
                                Spacer(Modifier.width(6.dp))
                                Text(
                                    text = if (state.isTorchOn) "ACTIVE • ON" else "STANDBY • OFF",
                                    color = if (state.isTorchOn) AccentYellow else TextMuted,
                                    fontSize = 10.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                    }
                    Button(
                        onClick = onToggleTorch,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (state.isTorchOn) AccentYellow else SurfaceElevated,
                            contentColor = if (state.isTorchOn) Color.Black else TextWhite
                        ),
                        shape = RoundedCornerShape(12.dp)
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
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            ModernIcon(
                                type = ModernIconType.CPU,
                                tint = AccentYellow,
                                modifier = Modifier.size(15.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text("DEVICE TELEMETRY", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceElevated)
                                .clickable { onRunTool("diagnostics", "") }
                                .padding(horizontal = 8.dp, vertical = 4.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                ModernIcon(ModernIconType.REFRESH, TextWhite, Modifier.size(10.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("REFRESH", color = TextWhite, fontSize = 9.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // Battery Pill
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(SurfaceElevated)
                                .padding(8.dp)
                        ) {
                            Column {
                                Text("BATTERY", color = TextMuted, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    "${telem?.batteryPct ?: 80}%",
                                    color = if ((telem?.batteryPct ?: 80) < 20) DangerRed else SuccessGreen,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 12.sp
                                )
                                Text(
                                    if (telem?.isCharging == true) "Charging" else "Discharging",
                                    color = TextMuted,
                                    fontSize = 8.5.sp
                                )
                            }
                        }

                        // RAM Pill
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(SurfaceElevated)
                                .padding(8.dp)
                        ) {
                            Column {
                                Text("RAM USED", color = TextMuted, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    "${telem?.ramUsedGb ?: 1.8} GB",
                                    color = TextWhite,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 12.sp
                                )
                                Text(
                                    "Total: ${telem?.ramTotalGb ?: 4.0} GB",
                                    color = TextMuted,
                                    fontSize = 8.5.sp
                                )
                            }
                        }

                        // Storage Pill
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(10.dp))
                                .background(SurfaceElevated)
                                .padding(8.dp)
                        ) {
                            Column {
                                Text("STORAGE", color = TextMuted, fontSize = 8.5.sp, fontFamily = FontFamily.Monospace)
                                Spacer(Modifier.height(2.dp))
                                Text(
                                    "${telem?.storageFreeGb ?: 42.0} GB",
                                    color = TextWhite,
                                    fontWeight = FontWeight.Black,
                                    fontSize = 12.sp
                                )
                                Text(
                                    telem?.osVersion ?: "Android 16",
                                    color = TextMuted,
                                    fontSize = 8.5.sp,
                                    maxLines = 1
                                )
                            }
                        }
                    }
                }
            }
        }

        // Card 3: AST Math Calculator
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ModernIcon(ModernIconType.CALC, AccentYellow, Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("MATH CALCULATOR (AST SAFE)", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
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
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = { onRunTool("calculate", calcExpr) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RoundedCornerShape(12.dp)
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
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(38.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(SurfaceElevated),
                            contentAlignment = Alignment.Center
                        ) {
                            ModernIcon(ModernIconType.SPEAKER, AccentYellow, Modifier.size(18.dp))
                        }
                        Spacer(Modifier.width(10.dp))
                        Column {
                            Text("MEDIA VOLUME", color = TextWhite, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                            Spacer(Modifier.height(2.dp))
                            Text("Level: ${state.volumePercent}%", color = AccentYellow, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                        }
                    }
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Button(
                            onClick = { onAdjustVolume(-1) },
                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated, contentColor = TextWhite),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("VOL -", fontWeight = FontWeight.Bold, fontSize = 10.sp)
                        }
                        Button(
                            onClick = { onAdjustVolume(1) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RoundedCornerShape(10.dp)
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
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("QUICK APP LAUNCHER", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("WhatsApp", "Gmail", "Chrome", "YouTube", "Maps").forEach { appName ->
                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(SurfaceElevated)
                                    .border(1.dp, BorderDark, RoundedCornerShape(10.dp))
                                    .clickable { onRunTool("launch_app", appName) }
                                    .padding(vertical = 10.dp),
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
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
                        .clickable { onRunTool("weather", "") }
                        .padding(14.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            ModernIcon(ModernIconType.CLOUD, AccentYellow, Modifier.size(14.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("WEATHER", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)
                        }
                        Spacer(Modifier.height(6.dp))
                        Text("Tap to fetch live forecast", color = TextMuted, fontSize = 9.5.sp)
                    }
                }
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(14.dp))
                        .background(SurfaceDark)
                        .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
                        .clickable { onRunTool("clock", "") }
                        .padding(14.dp)
                ) {
                    Column {
                        Text("WORLD TIME", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp)
                        Spacer(Modifier.height(6.dp))
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
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ModernIcon(ModernIconType.SEARCH, AccentYellow, Modifier.size(13.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("DUCKDUCKGO SEARCH", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
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
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = { onRunTool("web_search", searchQuery) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            ModernIcon(ModernIconType.SEARCH, Color.Black, Modifier.size(12.dp))
                            Spacer(Modifier.width(4.dp))
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
                        .clip(RoundedCornerShape(12.dp))
                        .background(SurfaceElevated)
                        .border(1.dp, BorderDark, RoundedCornerShape(12.dp))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(6.dp))
                                    .background(AccentYellow.copy(alpha = 0.15f))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(item.tool.uppercase(), color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                            }
                            Spacer(Modifier.height(4.dp))
                            Text(item.result, color = TextWhite, fontSize = 11.sp, maxLines = 2, overflow = TextOverflow.Ellipsis)
                        }
                        Spacer(Modifier.width(8.dp))
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
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // System Integration Banners
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ModernIcon(ModernIconType.ASSIST, AccentYellow, Modifier.size(15.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("SYSTEM WRITING COMPANION", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Floating Siri Overlay", color = TextWhite, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.height(2.dp))
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(if (state.isFloatingRunning) SuccessGreen else TextMuted.copy(alpha = 0.5f), CircleShape)
                                )
                                Spacer(Modifier.width(5.dp))
                                Text(
                                    if (state.isFloatingRunning) "ACTIVE OVER ALL APPS" else "STANDBY / DISABLED",
                                    color = if (state.isFloatingRunning) SuccessGreen else TextMuted,
                                    fontSize = 9.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.SemiBold
                                )
                            }
                        }
                        Button(
                            onClick = onToggleFloatingService,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (state.isFloatingRunning) DangerRed else AccentYellow,
                                contentColor = Color.Black
                            ),
                            shape = RoundedCornerShape(10.dp)
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
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("TEXT TO TRANSFORM", color = TextMuted, fontSize = 9.5.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Bold)
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(8.dp))
                                .background(SurfaceElevated)
                                .padding(horizontal = 7.dp, vertical = 2.dp)
                        ) {
                            Text(
                                "${state.sandboxInput.length} chars • ${state.sandboxInput.split(Regex("\\s+")).filter { it.isNotBlank() }.size} words",
                                color = TextMuted,
                                fontSize = 8.5.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
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
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(115.dp)
                    )

                    // Quick Template Chips
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        val templates = listOf(
                            "WhatsApp Reply" to "hey let me know if u can come today at 5pm",
                            "Gmail Follow-up" to "i wanted to see if u have looked at the report we discussed",
                            "Meeting Request" to "are you free tomorrow to discuss the new mobile project",
                            "Apology / Delay" to "sorry for the delay i was stuck in another meeting"
                        )
                        items(templates) { (label, text) ->
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(SurfaceElevated)
                                    .border(1.dp, BorderDark, RoundedCornerShape(14.dp))
                                    .clickable { onSandboxInputChange(text) }
                                    .padding(horizontal = 10.dp, vertical = 5.dp)
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    ModernIcon(ModernIconType.ASSIST, AccentYellow.copy(alpha = 0.7f), Modifier.size(9.dp))
                                    Spacer(Modifier.width(5.dp))
                                    Text(label, color = TextWhite, fontSize = 9.5.sp, fontWeight = FontWeight.SemiBold)
                                }
                            }
                        }
                    }
                }
            }
        }

        // 5 Writing Modes Row
        item {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("SELECT WRITING MODE", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    listOf(
                        "Grammar" to "Proofread",
                        "Professional" to "Gmail",
                        "Casual" to "WhatsApp",
                        "Concise" to "Summary",
                        "Translate" to "Translate"
                    ).forEach { (mode, label) ->
                        val isSel = state.selectedWritingMode.equals(mode, ignoreCase = true)
                        val animBg by animateColorAsState(
                            targetValue = if (isSel) AccentYellow else SurfaceElevated,
                            animationSpec = tween(180),
                            label = "mode_bg"
                        )
                        val animFg by animateColorAsState(
                            targetValue = if (isSel) Color.Black else TextWhite,
                            animationSpec = tween(180),
                            label = "mode_fg"
                        )

                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(12.dp))
                                .background(animBg)
                                .border(1.dp, if (isSel) AccentYellow else BorderDark, RoundedCornerShape(12.dp))
                                .clickable { onSetWritingMode(mode) }
                                .padding(vertical = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                color = animFg,
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
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(if (isSel) AccentYellow else SurfaceElevated)
                                    .border(1.dp, if (isSel) AccentYellow else BorderDark, RoundedCornerShape(14.dp))
                                    .clickable { onSetTargetLanguage(lang) }
                                    .padding(horizontal = 12.dp, vertical = 6.dp)
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
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
            ) {
                if (state.isAnalyzing) {
                    CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color.Black, strokeWidth = 2.dp)
                } else {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        ModernIcon(ModernIconType.SPARKLE, Color.Black, Modifier.size(14.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("TRANSFORM TEXT (${state.selectedWritingMode.uppercase()})", fontWeight = FontWeight.Black, fontSize = 12.sp)
                    }
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
                        .clip(RoundedCornerShape(16.dp))
                        .background(SurfaceElevated)
                        .border(1.5.dp, AccentYellow.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
                        .padding(14.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("POLISHED OUTPUT", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 10.sp, fontFamily = FontFamily.Monospace)
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(SurfaceDark)
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    if (result.isOnline) "LOCAL OLLAMA" else "OFFLINE ENGINE",
                                    color = if (result.isOnline) SuccessGreen else AccentYellow,
                                    fontSize = 8.5.sp,
                                    fontFamily = FontFamily.Monospace,
                                    fontWeight = FontWeight.Bold
                                )
                            }
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
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f)
                            ) {
                                ModernIcon(ModernIconType.COPY, Color.Black, Modifier.size(13.dp))
                                Spacer(Modifier.width(6.dp))
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
                                shape = RoundedCornerShape(10.dp),
                                modifier = Modifier.weight(1f).border(1.dp, BorderDark, RoundedCornerShape(10.dp))
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
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Host Server URL Configurator Card
        item {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("HOST BACKEND SERVER CONFIG", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                    Text("Configure host IP/port (default: http://10.0.2.2:8080)", color = TextMuted, fontSize = 9.5.sp)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
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
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.weight(1f)
                        )
                        Button(
                            onClick = { onSetServerUrl(serverUrlInput) },
                            colors = ButtonDefaults.buttonColors(containerColor = AccentYellow, contentColor = Color.Black),
                            shape = RoundedCornerShape(12.dp)
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
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            ModernIcon(ModernIconType.STATUS, AccentYellow, Modifier.size(15.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("SYSTEM TELEMETRY", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                        }
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .background(if (state.backendHealth.isOnline) Color(0xFF0A2918) else Color(0xFF2E2600))
                                .border(1.dp, if (state.backendHealth.isOnline) SuccessGreen else AccentYellow, RoundedCornerShape(12.dp))
                                .padding(horizontal = 8.dp, vertical = 3.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(6.dp)
                                        .background(if (state.backendHealth.isOnline) SuccessGreen else AccentYellow, CircleShape)
                                )
                                Spacer(Modifier.width(5.dp))
                                Text(
                                    if (state.backendHealth.isOnline) "ONLINE" else "LOCAL",
                                    color = if (state.backendHealth.isOnline) SuccessGreen else AccentYellow,
                                    fontSize = 9.sp,
                                    fontWeight = FontWeight.Bold,
                                    fontFamily = FontFamily.Monospace
                                )
                            }
                        }
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
                    .clip(RoundedCornerShape(16.dp))
                    .background(SurfaceDark)
                    .border(1.dp, BorderDark, RoundedCornerShape(16.dp))
                    .padding(14.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("PERMISSIONS & OVERLAYS", color = AccentYellow, fontWeight = FontWeight.Black, fontSize = 11.sp, fontFamily = FontFamily.Monospace)

                    // Floating Overlay
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Siri Floating Overlay", color = TextWhite, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.height(2.dp))
                            Text(if (state.isFloatingRunning) "Active on display" else "Inactive", color = TextMuted, fontSize = 9.sp)
                        }
                        Button(
                            onClick = onToggleFloating,
                            colors = ButtonDefaults.buttonColors(containerColor = if (state.isFloatingRunning) DangerRed else AccentYellow, contentColor = Color.Black),
                            shape = RoundedCornerShape(10.dp)
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
                            Text("Accessibility Writing Service", color = TextWhite, fontSize = 11.5.sp, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.height(2.dp))
                            Text(if (state.isAccessibilityRunning) "Hooks active in WhatsApp/Gmail" else "Not enabled", color = TextMuted, fontSize = 9.sp)
                        }
                        Button(
                            onClick = onOpenAccessibility,
                            colors = ButtonDefaults.buttonColors(containerColor = SurfaceElevated, contentColor = TextWhite),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.border(1.dp, BorderDark, RoundedCornerShape(10.dp))
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
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, DangerRed.copy(alpha = 0.5f), RoundedCornerShape(14.dp))
                    .height(46.dp)
            ) {
                ModernIcon(ModernIconType.TRASH, DangerRed, Modifier.size(14.dp))
                Spacer(Modifier.width(8.dp))
                Text("RESET CONSOLE DATABASE", fontWeight = FontWeight.Black, fontSize = 11.sp)
            }
        }
    }
}
