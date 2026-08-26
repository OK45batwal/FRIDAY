package com.friday.assistant

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {

    companion object {
        private const val PERMISSION_REQ_CODE = 1001
    }

    private val requiredPermissions = arrayOf(
        Manifest.permission.RECORD_AUDIO,
        Manifest.permission.CAMERA,
        Manifest.permission.CALL_PHONE
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        checkAndRequestPermissions()

        val btnSetDefault = findViewById<Button>(R.id.btnSetDefault)
        val btnTestAssistant = findViewById<Button>(R.id.btnTestAssistant)
        val tvStatus = findViewById<TextView>(R.id.tvAssistantStatus)

        btnSetDefault.setOnClickListener {
            openDefaultAssistantSettings()
        }

        btnTestAssistant.setOnClickListener {
            val intent = Intent(Intent.ACTION_ASSIST).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            try {
                startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(this, "Please set FRIDAY as default assistant first.", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun openDefaultAssistantSettings() {
        val intent = Intent(Settings.ACTION_VOICE_INPUT_SETTINGS)
        try {
            startActivity(intent)
        } catch (e: Exception) {
            val fallbackIntent = Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS)
            try {
                startActivity(fallbackIntent)
            } catch (ex: Exception) {
                startActivity(Intent(Settings.ACTION_SETTINGS))
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), PERMISSION_REQ_CODE)
        }
    }
}
