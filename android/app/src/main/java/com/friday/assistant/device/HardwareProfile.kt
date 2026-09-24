package com.friday.assistant.device

import android.app.ActivityManager
import android.content.Context
import android.os.Build
data class HardwareProfile(val availableRamMb: Long, val supportedAbis: List<String>, val storageAvailableMb: Long)

class HardwareProfiler(private val context: Context) {
    fun collect(): HardwareProfile {
        val memory = ActivityManager.MemoryInfo().also { context.getSystemService(ActivityManager::class.java).getMemoryInfo(it) }
        val storage = context.filesDir.usableSpace / (1024 * 1024)
        return HardwareProfile(memory.availMem / (1024 * 1024), Build.SUPPORTED_ABIS.toList(), storage)
    }
}

