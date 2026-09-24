package com.friday.assistant.ai

import java.time.ZonedDateTime

sealed interface Route { data class Tool(val name: String, val arguments: Map<String, String> = emptyMap()) : Route; data object LocalLlm : Route; data object Stop : Route }

/** Routes transparent, deterministic requests before considering a local LLM. */
class Router {
    fun route(text: String): Route {
        val normalized = text.trim().lowercase()
        return when {
            normalized in setOf("friday stop", "stop", "stop friday") -> Route.Stop
            "battery" in normalized -> Route.Tool("battery")
            normalized.contains("what time") || normalized.contains("current time") -> Route.Tool("time")
            Regex("^(calculate|what is)?\\s*[0-9(). +*/-]+$").matches(normalized) -> Route.Tool("calculator", mapOf("expression" to normalized.removePrefix("calculate").removePrefix("what is").trim()))
            else -> Route.LocalLlm
        }
    }
}

