package com.friday.assistant.actions

import android.app.SearchManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.provider.AlarmClock
import android.util.Log

class DeviceActionManager(private val context: Context) {

    companion object {
        private const val TAG = "DeviceActionManager"
    }

    /**
     * Parse and execute intent actions directly on the Android OS
     */
    fun executeIntent(actionType: String, params: Map<String, String>): String {
        return try {
            when (actionType.lowercase()) {
                "flashlight" -> toggleFlashlight(params["state"] == "on")
                "alarm" -> setAlarm(
                    params["hour"]?.toIntOrNull() ?: 7,
                    params["minute"]?.toIntOrNull() ?: 0,
                    params["message"] ?: "FRIDAY Alarm"
                )
                "timer" -> setTimer(
                    params["seconds"]?.toIntOrNull() ?: 60,
                    params["message"] ?: "FRIDAY Timer"
                )
                "call" -> makePhoneCall(params["number"] ?: params["name"] ?: "")
                "whatsapp" -> sendWhatsApp(params["number"], params["message"] ?: "")
                "open_app" -> launchApp(params["app_name"] ?: "")
                "volume" -> setVolume(params["level"]?.toIntOrNull() ?: 50)
                "web_search" -> performWebSearch(params["query"] ?: "")
                else -> "Unrecognized action."
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed executing action: $actionType", e)
            "Could not complete action: ${e.message}"
        }
    }

    private fun toggleFlashlight(turnOn: Boolean): String {
        return try {
            val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
            val cameraId = cameraManager.cameraIdList[0]
            cameraManager.setTorchMode(cameraId, turnOn)
            if (turnOn) "Flashlight turned on." else "Flashlight turned off."
        } catch (e: Exception) {
            "Flashlight unavailable on this device."
        }
    }

    private fun setAlarm(hour: Int, minute: Int, message: String): String {
        val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
            putExtra(AlarmClock.EXTRA_HOUR, hour)
            putExtra(AlarmClock.EXTRA_MINUTES, minute)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Alarm set for %02d:%02d (%s).".format(hour, minute, message)
    }

    private fun setTimer(seconds: Int, message: String): String {
        val intent = Intent(AlarmClock.ACTION_SET_TIMER).apply {
            putExtra(AlarmClock.EXTRA_LENGTH, seconds)
            putExtra(AlarmClock.EXTRA_MESSAGE, message)
            putExtra(AlarmClock.EXTRA_SKIP_UI, true)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Timer started for $seconds seconds."
    }

    private fun makePhoneCall(number: String): String {
        val cleanNumber = number.replace(Regex("[^0-9+]"), "")
        val intent = Intent(Intent.ACTION_DIAL).apply {
            data = Uri.parse("tel:$cleanNumber")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Dialing $number..."
    }

    private fun sendWhatsApp(number: String?, message: String): String {
        val uri = if (!number.isNullOrBlank()) {
            Uri.parse("https://api.whatsapp.com/send?phone=$number&text=${Uri.encode(message)}")
        } else {
            Uri.parse("https://api.whatsapp.com/send?text=${Uri.encode(message)}")
        }
        val intent = Intent(Intent.ACTION_VIEW, uri).apply {
            setPackage("com.whatsapp")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        return try {
            context.startActivity(intent)
            "Opening WhatsApp to send message."
        } catch (e: Exception) {
            "WhatsApp is not installed on this device."
        }
    }

    private fun launchApp(appName: String): String {
        val pm = context.packageManager
        val query = appName.lowercase().trim()
        val installedApps = pm.getInstalledApplications(PackageManager.GET_META_DATA)

        for (app in installedApps) {
            val label = pm.getApplicationLabel(app).toString().lowercase()
            if (label.contains(query) || app.packageName.contains(query)) {
                val launchIntent = pm.getLaunchIntentForPackage(app.packageName)?.apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                if (launchIntent != null) {
                    context.startActivity(launchIntent)
                    return "Opening ${pm.getApplicationLabel(app)}."
                }
            }
        }
        return "Could not find application named '$appName'."
    }

    private fun setVolume(percent: Int): String {
        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val maxVolume = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
        val targetVolume = (maxVolume * (percent.coerceIn(0, 100) / 100f)).toInt()
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, targetVolume, AudioManager.FLAG_SHOW_UI)
        return "Media volume set to $percent%."
    }

    private fun performWebSearch(query: String): String {
        val intent = Intent(Intent.ACTION_WEB_SEARCH).apply {
            putExtra(SearchManager.QUERY, query)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
        return "Searching web for: $query"
    }
}
