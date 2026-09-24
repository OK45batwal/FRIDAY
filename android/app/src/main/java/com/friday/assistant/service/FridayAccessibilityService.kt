package com.friday.assistant.service

import android.accessibilityservice.AccessibilityService
import android.os.Bundle
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast
import com.friday.assistant.network.FridayApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class FridayAccessibilityService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val apiClient = FridayApiClient()
    private var lastFocusedNode: AccessibilityNodeInfo? = null

    companion object {
        var isRunning: Boolean = false
            private set
        var instance: FridayAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        isRunning = true
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        when (event.eventType) {
            AccessibilityEvent.TYPE_VIEW_FOCUSED,
            AccessibilityEvent.TYPE_VIEW_TEXT_CHANGED,
            AccessibilityEvent.TYPE_VIEW_CLICKED -> {
                val source = event.source
                if (source != null) {
                    if (source.isEditable) {
                        lastFocusedNode?.recycle()
                        lastFocusedNode = source
                    } else {
                        source.recycle()
                    }
                }
            }
        }
    }

    override fun onInterrupt() {
        // Accessibility service interrupted
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        instance = null
        lastFocusedNode?.recycle()
        lastFocusedNode = null
        serviceScope.cancel()
    }

    fun fixCurrentInputField() {
        val node = lastFocusedNode
        if (node == null || !node.refresh() || !node.isEditable) {
            Toast.makeText(this, "No active text field detected", Toast.LENGTH_SHORT).show()
            return
        }

        val originalText = node.text?.toString() ?: ""
        if (originalText.isBlank()) {
            Toast.makeText(this, "Text field is empty", Toast.LENGTH_SHORT).show()
            return
        }

        Toast.makeText(this, "FRIDAY: Polishing text...", Toast.LENGTH_SHORT).show()

        serviceScope.launch {
            try {
                val result = apiClient.fixGrammar(originalText)
                val arguments = Bundle().apply {
                    putCharSequence(
                        AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                        result.correctedText
                    )
                }
                val success = node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, arguments)
                if (success) {
                    Toast.makeText(this@FridayAccessibilityService, "FRIDAY: Grammar fixed!", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@FridayAccessibilityService, "Could not replace text in target app", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@FridayAccessibilityService, "Polishing failed: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
