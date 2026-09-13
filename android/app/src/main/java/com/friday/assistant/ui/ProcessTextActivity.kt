package com.friday.assistant.ui

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.friday.assistant.network.FridayApiClient
import com.friday.assistant.network.GrammarResult
import kotlinx.coroutines.launch

class ProcessTextActivity : ComponentActivity() {

    private val apiClient = FridayApiClient()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val selectedText = intent.getCharSequenceExtra(Intent.EXTRA_PROCESS_TEXT)?.toString() ?: ""
        val isReadOnly = intent.getBooleanExtra(Intent.EXTRA_PROCESS_TEXT_READONLY, false)

        setContent {
            ProcessTextModal(
                originalText = selectedText,
                isReadOnly = isReadOnly,
                onReplace = { replacement ->
                    val returnIntent = Intent().apply {
                        putExtra(Intent.EXTRA_PROCESS_TEXT, replacement)
                    }
                    setResult(RESULT_OK, returnIntent)
                    finish()
                },
                onCopy = { textToCopy ->
                    val clipboard = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    clipboard.setPrimaryClip(ClipData.newPlainText("FRIDAY Corrected", textToCopy))
                    Toast.makeText(this, "Copied to clipboard", Toast.LENGTH_SHORT).show()
                    finish()
                },
                onDismiss = { finish() },
                apiClient = apiClient
            )
        }
    }
}

@Composable
private fun ProcessTextModal(
    originalText: String,
    isReadOnly: Boolean,
    onReplace: (String) -> Unit,
    onCopy: (String) -> Unit,
    onDismiss: () -> Unit,
    apiClient: FridayApiClient
) {
    var isProcessing by remember { mutableStateOf(true) }
    var currentResult by remember { mutableStateOf<GrammarResult?>(null) }
    var selectedMode by remember { mutableStateOf("Grammar") }
    val scope = rememberCoroutineScope()

    fun runProcess(mode: String) {
        selectedMode = mode
        isProcessing = true
        scope.launch {
            val result = when (mode) {
                "Professional" -> apiClient.rewriteTone(originalText, "professional")
                "Casual" -> apiClient.rewriteTone(originalText, "casual")
                "Concise" -> apiClient.rewriteTone(originalText, "concise")
                else -> apiClient.fixGrammar(originalText)
            }
            currentResult = result
            isProcessing = false
        }
    }

    LaunchedEffect(originalText) {
        runProcess("Grammar")
    }

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(12.dp)
            .background(Color(0xFF0E0E0C), RectangleShape)
            .border(2.dp, Color(0xFFFFE600), RectangleShape)
            .padding(12.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .background(Color(0xFFFFE600), RectangleShape)
                            .padding(horizontal = 5.dp, vertical = 2.dp)
                    ) {
                        Text("FRIDAY", color = Color.Black, fontWeight = FontWeight.Black, fontSize = 11.sp)
                    }
                    Spacer(Modifier.width(6.dp))
                    Text(
                        "WRITING ASSISTANT",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }

                Text(
                    text = if (currentResult?.isOnline == true) "LOCAL OLLAMA" else "OFFLINE RULES",
                    color = Color(0xFFFFE600),
                    fontSize = 9.sp,
                    fontFamily = FontFamily.Monospace
                )
            }

            // Original Text Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF1B1A16))
                    .border(1.dp, Color(0xFF3A382F), RectangleShape)
                    .padding(8.dp)
            ) {
                Column {
                    Text("ORIGINAL TEXT", color = Color(0xFFA19F93), fontSize = 9.sp, fontFamily = FontFamily.Monospace)
                    Spacer(Modifier.height(2.dp))
                    Text(
                        text = originalText.ifEmpty { "(No text selected)" },
                        color = Color(0xFFE2EDF5),
                        fontSize = 12.sp,
                        maxLines = 3,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Corrected / Polished Text Card
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF24231E))
                    .border(1.5.dp, Color(0xFFFFE600), RectangleShape)
                    .padding(10.dp)
            ) {
                if (isProcessing) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        CircularProgressIndicator(modifier = Modifier.size(16.dp), color = Color(0xFFFFE600), strokeWidth = 2.dp)
                        Spacer(Modifier.width(8.dp))
                        Text("Polishing text with AI...", color = Color.White, fontSize = 11.sp)
                    }
                } else {
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "POLISHED TEXT (${selectedMode.uppercase()})",
                                color = Color(0xFFFFE600),
                                fontWeight = FontWeight.Black,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = currentResult?.correctedText ?: originalText,
                            color = Color.White,
                            fontSize = 12.sp,
                            lineHeight = 17.sp
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = currentResult?.explanation ?: "",
                            color = Color(0xFFA19F93),
                            fontSize = 10.sp
                        )
                    }
                }
            }

            // Interactive Tone Selector Chips
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                listOf(
                    "Grammar" to "Grammar",
                    "Gmail" to "Professional",
                    "WhatsApp" to "Casual",
                    "Summary" to "Concise"
                ).forEach { (label, mode) ->
                    val isSelected = selectedMode == mode
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .background(if (isSelected) Color(0xFFFFE600) else Color(0xFF1B1A16))
                            .border(1.dp, if (isSelected) Color(0xFFFFE600) else Color(0xFF3A382F), RectangleShape)
                            .clickable { runProcess(mode) }
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            color = if (isSelected) Color.Black else Color(0xFFFFE600),
                            fontSize = 9.5.sp,
                            fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                            fontFamily = FontFamily.Monospace,
                            maxLines = 1
                        )
                    }
                }
            }

            // Actions Row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                if (!isReadOnly) {
                    Button(
                        onClick = { onReplace(currentResult?.correctedText ?: originalText) },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFE600), contentColor = Color.Black),
                        shape = RectangleShape,
                        contentPadding = PaddingValues(horizontal = 6.dp, vertical = 8.dp),
                        modifier = Modifier.weight(1.2f)
                    ) {
                        Text("REPLACE", fontWeight = FontWeight.Black, fontSize = 11.sp, maxLines = 1)
                    }
                }

                Button(
                    onClick = { onCopy(currentResult?.correctedText ?: originalText) },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1B1A16), contentColor = Color.White),
                    shape = RectangleShape,
                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 8.dp),
                    modifier = Modifier.weight(0.9f).border(1.dp, Color(0xFF3A382F), RectangleShape)
                ) {
                    Text("COPY", fontWeight = FontWeight.Bold, fontSize = 11.sp, maxLines = 1)
                }

                Button(
                    onClick = onDismiss,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF24231E), contentColor = Color(0xFFA19F93)),
                    shape = RectangleShape,
                    contentPadding = PaddingValues(horizontal = 6.dp, vertical = 8.dp),
                    modifier = Modifier.weight(0.9f)
                ) {
                    Text("CLOSE", fontSize = 11.sp, maxLines = 1)
                }
            }
        }
    }
}
