package com.friday.assistant.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.NotificationCompat
import com.friday.assistant.MainActivity
import com.friday.assistant.device.DeviceActionManager
import com.friday.assistant.network.FridayApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

import com.friday.assistant.FridayClientHolder

class FridayFloatingService : Service() {

    private var windowManager: WindowManager? = null
    private var pillView: View? = null
    private var expandedView: View? = null
    private var params: WindowManager.LayoutParams? = null
    private var isExpanded = false
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private lateinit var deviceManager: DeviceActionManager
    private val apiClient get() = FridayClientHolder.getClient(this)

    companion object {
        var isRunning: Boolean = false
            private set
        private const val CHANNEL_ID = "friday_floating_channel"
        private const val NOTIF_ID = 2002
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        deviceManager = DeviceActionManager(this)
        startForeground(NOTIF_ID, createNotification())

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !android.provider.Settings.canDrawOverlays(this)) {
            stopSelf()
            return
        }

        setupFloatingView()
    }

    private fun setupFloatingView() {
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 24
            y = 360
        }

        // 1. Compact Pill View
        val pill = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#07080A"))
                setStroke(2, Color.parseColor("#00F2FE"))
                cornerRadius = 32f
            }
            background = bg
            setPadding(28, 16, 28, 16)
            elevation = 16f
        }

        val pillText = TextView(this).apply {
            text = "◉ FRIDAY"
            setTextColor(Color.parseColor("#00F2FE"))
            textSize = 12f
            typeface = Typeface.DEFAULT_BOLD
        }
        pill.addView(pillText)

        pill.setOnTouchListener(createDragTouchListener(onTap = { expandOverlay() }))
        pillView = pill

        // 2. Expanded Assistant Card View
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#0F1218"))
                setStroke(2, Color.parseColor("#00F2FE"))
                cornerRadius = 24f
            }
            background = bg
            setPadding(24, 20, 24, 20)
            elevation = 24f
        }

        // Header Row
        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }
        val headerTitle = TextView(this).apply {
            text = "◉ FRIDAY ASSISTANT"
            setTextColor(Color.parseColor("#00F2FE"))
            textSize = 13f
            typeface = Typeface.MONOSPACE
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        val minBtn = TextView(this).apply {
            text = " [—] "
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = Typeface.MONOSPACE
            setOnClickListener { collapseOverlay() }
        }
        val closeBtn = TextView(this).apply {
            text = " [✕] "
            setTextColor(Color.parseColor("#FF5555"))
            textSize = 14f
            typeface = Typeface.MONOSPACE
            setOnClickListener {
                collapseOverlay()
                stopSelf()
            }
        }
        headerRow.addView(headerTitle)
        headerRow.addView(minBtn)
        headerRow.addView(closeBtn)
        card.addView(headerRow)

        // Status line
        val statusText = TextView(this).apply {
            text = "System Ready • On-Device Intelligence"
            setTextColor(Color.parseColor("#A19F93"))
            textSize = 10f
            setPadding(0, 8, 0, 14)
        }
        card.addView(statusText)

        // Action Row 1: Voice & Clipboard Fix
        val actionRow1 = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, 0, 0, 10)
        }

        val voiceBtn = createBrutalistButton("🎙️ VOICE") {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("EXTRA_OPEN_VOICE", true)
            }
            startActivity(intent)
            collapseOverlay()
        }

        val clipBtn = createBrutalistButton("✍️ FIX CLIPBOARD") {
            val cm = getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            val clip = cm.primaryClip
            if (clip != null && clip.itemCount > 0) {
                val text = clip.getItemAt(0).text?.toString() ?: ""
                if (text.isNotBlank()) {
                    scope.launch {
                        statusText.text = "Polishing clipboard text..."
                        val result = apiClient.fixGrammar(text)
                        withContext(Dispatchers.Main) {
                            cm.setPrimaryClip(ClipData.newPlainText("FRIDAY Corrected", result.correctedText))
                            statusText.text = "Polished! Replaced on clipboard."
                            Toast.makeText(this@FridayFloatingService, "Clipboard polished & replaced!", Toast.LENGTH_SHORT).show()
                        }
                    }
                } else {
                    Toast.makeText(this, "Clipboard is empty.", Toast.LENGTH_SHORT).show()
                }
            } else {
                Toast.makeText(this, "Clipboard is empty.", Toast.LENGTH_SHORT).show()
            }
        }
        actionRow1.addView(voiceBtn)
        actionRow1.addView(clipBtn)
        card.addView(actionRow1)

        // Action Row 2: Torch & Console
        val actionRow2 = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
        }

        val torchBtn = createBrutalistButton("🔦 TORCH") {
            val active = deviceManager.toggleTorch()
            statusText.text = if (active) "Torch: ACTIVE 💡" else "Torch: OFF"
        }

        val consoleBtn = createBrutalistButton("📱 CONSOLE") {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivity(intent)
            collapseOverlay()
        }
        actionRow2.addView(torchBtn)
        actionRow2.addView(consoleBtn)
        card.addView(actionRow2)

        card.setOnTouchListener(createDragTouchListener(onTap = {}))
        expandedView = card

        // Initially show compact pill
        windowManager?.addView(pillView, params)
    }

    private fun createBrutalistButton(label: String, onClick: () -> Unit): Button {
        return Button(this).apply {
            text = label
            setTextColor(Color.WHITE)
            textSize = 11f
            typeface = Typeface.DEFAULT_BOLD
            val bg = GradientDrawable().apply {
                setColor(Color.parseColor("#1B1A16"))
                setStroke(2, Color.parseColor("#3A382F"))
            }
            background = bg
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                setMargins(4, 0, 4, 0)
            }
            layoutParams = lp
            setOnClickListener { onClick() }
        }
    }

    private fun expandOverlay() {
        if (isExpanded) return
        isExpanded = true
        windowManager?.removeView(pillView)
        params?.width = WindowManager.LayoutParams.WRAP_CONTENT
        params?.height = WindowManager.LayoutParams.WRAP_CONTENT
        windowManager?.addView(expandedView, params)
    }

    private fun collapseOverlay() {
        if (!isExpanded) return
        isExpanded = false
        windowManager?.removeView(expandedView)
        params?.width = WindowManager.LayoutParams.WRAP_CONTENT
        params?.height = WindowManager.LayoutParams.WRAP_CONTENT
        windowManager?.addView(pillView, params)
    }

    private fun createDragTouchListener(onTap: () -> Unit): View.OnTouchListener {
        return object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isClick = false

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params?.x ?: 0
                        initialY = params?.y ?: 0
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isClick = true
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
                            isClick = false
                        }
                        params?.x = (initialX + dx).coerceAtLeast(0)
                        params?.y = (initialY + dy).coerceAtLeast(0)
                        val target = if (isExpanded) expandedView else pillView
                        if (target != null && target.isAttachedToWindow) {
                            windowManager?.updateViewLayout(target, params)
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (isClick) {
                            onTap()
                        }
                        return true
                    }
                }
                return false
            }
        }
    }

    private fun createNotification(): Notification {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "FRIDAY Floating Assistant",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the FRIDAY Siri floating overlay active on screen"
            }
            manager.createNotificationChannel(channel)
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("FRIDAY Assistant Overlay")
            .setContentText("Tap overlay on screen for instant Siri tools and writing")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        scope.cancel()
        if (isExpanded && expandedView?.isAttachedToWindow == true) {
            windowManager?.removeView(expandedView)
        } else if (pillView?.isAttachedToWindow == true) {
            windowManager?.removeView(pillView)
        }
    }
}
