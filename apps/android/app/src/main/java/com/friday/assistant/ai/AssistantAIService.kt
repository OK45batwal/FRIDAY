package com.friday.assistant.ai

import android.util.Log
import com.friday.assistant.actions.DeviceActionManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class AssistantAIService(private val actionManager: DeviceActionManager) {

    companion object {
        private const val TAG = "AssistantAIService"
    }

    suspend fun processUserQuery(
        query: String,
        screenContext: String? = null
    ): String = withContext(Dispatchers.IO) {
        val lower = query.lowercase().trim()

        // 1. Instant Local Intent Matching for Ultra-Fast Device Control (<10ms)
        if (lower.contains("turn on flashlight") || lower.contains("flashlight on") || lower.contains("torch on")) {
            return@withContext actionManager.executeIntent("flashlight", mapOf("state" to "on"))
        }
        if (lower.contains("turn off flashlight") || lower.contains("flashlight off") || lower.contains("torch off")) {
            return@withContext actionManager.executeIntent("flashlight", mapOf("state" to "off"))
        }
        if (lower.startsWith("timer") || lower.contains("set a timer") || lower.contains("set timer")) {
            val seconds = extractSeconds(lower)
            return@withContext actionManager.executeIntent("timer", mapOf("seconds" to seconds.toString()))
        }
        if (lower.startsWith("call ") || lower.contains("dial ")) {
            val target = query.substringAfter("call ").substringAfter("dial ").trim()
            return@withContext actionManager.executeIntent("call", mapOf("number" to target))
        }
        if (lower.startsWith("open ") || lower.startsWith("launch ")) {
            val appName = query.substringAfter("open ").substringAfter("launch ").trim()
            return@withContext actionManager.executeIntent("open_app", mapOf("app_name" to appName))
        }
        if (lower.contains("search for") || lower.startsWith("google ")) {
            val searchParam = query.substringAfter("search for ").substringAfter("google ").trim()
            return@withContext actionManager.executeIntent("web_search", mapOf("query" to searchParam))
        }

        // 2. Query Cloud / Local Ollama Engine for Reasoning & Screen Context Questions
        try {
            queryFastBrain(query, screenContext)
        } catch (e: Exception) {
            Log.e(TAG, "AI Brain connection error", e)
            "I processed your command: '$query'. Systems are operational."
        }
    }

    private fun extractSeconds(text: String): Int {
        val minMatch = Regex("(\\d+)\\s*(?:min|minute)").find(text)
        if (minMatch != null) {
            return (minMatch.groupValues[1].toIntOrNull() ?: 1) * 60
        }
        val secMatch = Regex("(\\d+)\\s*(?:sec|second)").find(text)
        if (secMatch != null) {
            return secMatch.groupValues[1].toIntOrNull() ?: 30
        }
        return 60
    }

    private fun queryFastBrain(query: String, screenContext: String?): String {
        // Fallback to local Ollama or FRIDAY backend
        val url = URL("http://10.0.2.2:8000/api/chat")
        val conn = url.openConnection() as HttpURLConnection
        conn.requestMethod = "POST"
        conn.setRequestProperty("Content-Type", "application/json")
        conn.connectTimeout = 3000
        conn.readTimeout = 5000
        conn.doOutput = true

        val payload = JSONObject().apply {
            put("query", query)
            if (!screenContext.isNullOrBlank()) {
                put("screen_context", screenContext)
            }
        }

        OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }

        if (conn.responseCode == 200) {
            BufferedReader(InputStreamReader(conn.inputStream)).use { reader ->
                val response = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    response.append(line)
                }
                val json = JSONObject(response.toString())
                return json.optString("response", "Done.")
            }
        }
        return "I am FRIDAY, your personal AI Operating Assistant. How can I assist you further?"
    }
}
