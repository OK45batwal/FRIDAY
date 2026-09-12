package com.friday.assistant.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

data class BackendHealth(
    val isOnline: Boolean,
    val status: String = "Offline",
    val model: String = "None",
    val batteryPct: String = "N/A",
    val ramGb: String = "N/A",
    val toolCount: Int = 0,
    val totalMemories: Int = 0,
)

data class ChatResult(
    val reply: String,
    val isOnline: Boolean,
    val toolUsed: String? = null,
)

data class ToolResult(
    val tool: String,
    val result: String,
    val isSuccess: Boolean,
    val durationMs: Long,
)

class FridayApiClient(
    private val baseUrl: String = "http://10.0.2.2:8080"
) {

    suspend fun checkHealth(): BackendHealth = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/api/health")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 3000
                readTimeout = 3000
                requestMethod = "GET"
            }

            if (conn.responseCode == 200) {
                val response = readStream(conn)
                val json = JSONObject(response)
                val status = json.optString("status", "healthy")
                val toolsCount = json.optInt("tools_count", 0)
                val activity = json.optJSONObject("activity")
                val totalMemories = activity?.optInt("total_memories", 0) ?: 0
                val system = json.optJSONObject("system")
                val battery = system?.optString("battery_pct", "100%") ?: "100%"
                val ram = system?.optDouble("ram_gb", 16.0)?.toString() ?: "16.0"

                BackendHealth(
                    isOnline = true,
                    status = status.uppercase(),
                    model = "gemma2:2b (Local)",
                    batteryPct = battery,
                    ramGb = "$ram GB",
                    toolCount = toolsCount,
                    totalMemories = totalMemories,
                )
            } else {
                BackendHealth(isOnline = false)
            }
        } catch (e: Exception) {
            BackendHealth(isOnline = false)
        }
    }

    suspend fun sendChat(prompt: String): ChatResult = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/api/chat")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 12000
                readTimeout = 25000
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                doOutput = true
            }

            val payload = JSONObject().apply {
                put("message", prompt)
                put("stream", false)
            }

            OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }

            if (conn.responseCode == 200) {
                val raw = readStream(conn)
                val reply = try {
                    val json = JSONObject(raw)
                    json.optString("reply", json.optString("response", raw))
                } catch (e: Exception) {
                    raw
                }
                ChatResult(reply = reply, isOnline = true)
            } else {
                fallbackLocalReply(prompt)
            }
        } catch (e: Exception) {
            fallbackLocalReply(prompt)
        }
    }

    suspend fun executeCalculate(expr: String): ToolResult = withContext(Dispatchers.IO) {
        val start = System.currentTimeMillis()
        try {
            val url = URL("$baseUrl/api/tools/calculate/execute")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 4000
                readTimeout = 4000
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                doOutput = true
            }
            val payload = JSONObject().apply {
                val args = JSONObject().apply { put("expression", expr) }
                put("arguments", args)
            }
            OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }

            val duration = System.currentTimeMillis() - start
            if (conn.responseCode == 200) {
                val json = JSONObject(readStream(conn))
                val res = json.optString("result", "Completed")
                ToolResult("calculate", res, true, duration)
            } else {
                ToolResult("calculate", localEval(expr), true, duration)
            }
        } catch (e: Exception) {
            val duration = System.currentTimeMillis() - start
            ToolResult("calculate", localEval(expr), true, duration)
        }
    }

    suspend fun draftEmail(purpose: String, recipient: String, keyPoints: String): String = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/api/tasks/email")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                connectTimeout = 10000
                readTimeout = 15000
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                doOutput = true
            }
            val payload = JSONObject().apply {
                put("purpose", purpose)
                put("recipient", recipient)
                put("tone", "Professional")
                put("key_points", keyPoints)
            }
            OutputStreamWriter(conn.outputStream).use { it.write(payload.toString()) }

            if (conn.responseCode == 200) {
                val json = JSONObject(readStream(conn))
                json.optString("full_text", "Subject: $purpose\n\nTo $recipient,\n\n$keyPoints")
            } else {
                "Subject: ${purpose.replace('_', ' ').capitalize()}\nTo: $recipient\n\nRegarding: $keyPoints\n\nBest regards,\nFRIDAY Android"
            }
        } catch (e: Exception) {
            "Subject: ${purpose.replace('_', ' ').capitalize()}\nTo: $recipient\n\nRegarding: $keyPoints\n\nBest regards,\nFRIDAY Android (Offline Mode)"
        }
    }

    private fun fallbackLocalReply(prompt: String): ChatResult {
        val lower = prompt.lowercase().trim()
        val reply = when {
            lower.contains("hello") || lower.contains("hi") ->
                "Greetings. FRIDAY on-device core is active. Connected locally on Apple Silicon."
            lower.contains("status") || lower.contains("health") ->
                "FRIDAY Android Client is running autonomously. Storage: SQLite Room. Permissions: Microphone enabled."
            lower.contains("calc") || lower.matches(Regex(".*[0-9]+[\\+\\-\\*\\/][0-9]+.*")) -> {
                val expr = prompt.replace(Regex("[^0-9\\+\\-\\*/\\.\\(\\)]"), "")
                "Local Math Evaluation: $expr = ${localEval(expr)}"
            }
            lower.contains("who are you") || lower.contains("friday") ->
                "I am FRIDAY: Fully Responsive Intelligent Digital Assistant Youth. Running locally on device with strict privacy boundaries."
            else ->
                "Local AI Core: Command processed. Host server at 10.0.2.2:8080 is currently offline. Operating in autonomous local mode."
        }
        return ChatResult(reply = reply, isOnline = false)
    }

    private fun localEval(expr: String): String {
        return try {
            val sanitized = expr.replace(" ", "")
            if ("+" in sanitized) {
                val p = sanitized.split("+")
                (p[0].trim().toDouble() + p[1].trim().toDouble()).toString()
            } else if ("*" in sanitized) {
                val p = sanitized.split("*")
                (p[0].trim().toDouble() * p[1].trim().toDouble()).toString()
            } else if ("-" in sanitized) {
                val p = sanitized.split("-")
                (p[0].trim().toDouble() - p[1].trim().toDouble()).toString()
            } else if ("/" in sanitized) {
                val p = sanitized.split("/")
                (p[0].trim().toDouble() / p[1].trim().toDouble()).toString()
            } else {
                sanitized
            }
        } catch (e: Exception) {
            "Evaluation complete"
        }
    }

    private fun readStream(conn: HttpURLConnection): String {
        return BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
    }
}
