package com.friday.assistant.device

data class ResourceState(val availableRamMb: Long, val batteryPercent: Int, val isCharging: Boolean, val thermalStatus: Int)
enum class ResourceAction { KEEP, UNLOAD_MODEL, PREFER_SMALL_MODEL }

object ResourceManager {
    /** Call from a low-frequency worker/service tick, never from a tight polling loop. */
    fun recommendedAction(state: ResourceState): ResourceAction = when {
        state.availableRamMb < 700 || state.thermalStatus >= 4 -> ResourceAction.UNLOAD_MODEL
        state.batteryPercent < 15 && !state.isCharging || state.thermalStatus >= 3 -> ResourceAction.PREFER_SMALL_MODEL
        else -> ResourceAction.KEEP
    }
}
