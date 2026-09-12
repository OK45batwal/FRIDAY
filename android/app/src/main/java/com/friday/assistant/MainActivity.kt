package com.friday.assistant

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import com.friday.assistant.service.FridayForegroundService
import com.friday.assistant.ui.AssistantState
import com.friday.assistant.ui.FridayScreen
import com.friday.assistant.ui.FridayViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            val model: FridayViewModel = viewModel()
            val permissions = buildList {
                add(Manifest.permission.RECORD_AUDIO)
                if (Build.VERSION.SDK_INT >= 33) add(Manifest.permission.POST_NOTIFICATIONS)
            }.toTypedArray()

            val launcher = rememberLauncherForActivityResult(
                ActivityResultContracts.RequestMultiplePermissions()
            ) { result ->
                val granted = result[Manifest.permission.RECORD_AUDIO] == true
                model.setPermissionsGranted(granted)
                if (granted) {
                    startFridayService()
                    model.setServiceEnabled(true)
                }
            }

            FridayScreen(
                state = model.state,
                onTabSelect = model::selectTab,
                onInputChange = model::onInputTextChange,
                onSendMessage = model::sendMessage,
                onRunTool = model::runTool,
                onToggleVoice = {
                    if (model.state.assistantState == AssistantState.LISTENING) {
                        model.stopVoiceListening()
                    } else {
                        val granted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
                        if (!granted) {
                            launcher.launch(permissions)
                        } else {
                            model.startVoiceListening()
                        }
                    }
                },
                onStopVoice = model::stopVoiceListening,
                onToggleService = { enabled ->
                    val granted = ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
                    if (enabled && !granted) {
                        launcher.launch(permissions)
                    } else if (enabled) {
                        startFridayService()
                        model.setServiceEnabled(true)
                    } else {
                        stopService(Intent(this, FridayForegroundService::class.java))
                        model.setServiceEnabled(false)
                    }
                },
                onRefreshHealth = model::refreshHealth
            )
        }
    }

    private fun startFridayService() {
        ContextCompat.startForegroundService(this, Intent(this, FridayForegroundService::class.java))
    }
}
