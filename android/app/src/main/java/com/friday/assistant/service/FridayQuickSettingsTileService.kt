package com.friday.assistant.service

import android.content.Intent
import android.os.Build
import android.service.quicksettings.TileService
import androidx.annotation.RequiresApi
import com.friday.assistant.MainActivity

@RequiresApi(Build.VERSION_CODES.N)
class FridayQuickSettingsTileService : TileService() {

    override fun onClick() {
        super.onClick()

        // 1. If accessibility service is running and observing a text field, fix it
        val accessibility = FridayAccessibilityService.instance
        if (accessibility != null) {
            accessibility.fixCurrentInputField()
            return
        }

        // 2. Otherwise, launch FRIDAY console
        val launchIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        startActivityAndCollapse(launchIntent)
    }
}
