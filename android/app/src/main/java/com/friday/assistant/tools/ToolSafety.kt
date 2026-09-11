package com.friday.assistant.tools

enum class ToolRisk { SAFE, CONFIRMATION_REQUIRED }
data class ToolRequest(val name: String, val arguments: Map<String, String>, val risk: ToolRisk)

/** The only bridge from reasoning to Android actions: no shell or arbitrary intent execution. */
class ToolSafetyManager {
    private val allowed = setOf("battery", "time", "calculator", "open_app", "timer", "note", "read_selected_file")
    fun validate(request: ToolRequest): Result<ToolRequest> = when {
        request.name !in allowed -> Result.failure(SecurityException("Tool is not on FRIDAY's allowlist."))
        request.risk == ToolRisk.CONFIRMATION_REQUIRED -> Result.failure(IllegalStateException("User confirmation is required before executing this action."))
        else -> Result.success(request)
    }
}
