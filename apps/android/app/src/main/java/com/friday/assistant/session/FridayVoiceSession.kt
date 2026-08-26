package com.friday.assistant.session

import android.app.assist.AssistContent
import android.app.assist.AssistStructure
import android.content.Context
import android.os.Bundle
import android.service.voice.VoiceInteractionSession
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import com.friday.assistant.R
import com.friday.assistant.actions.DeviceActionManager
import com.friday.assistant.ai.AssistantAIService
import com.friday.assistant.audio.AssistantAudioEngine
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

/**
 * Active assistant session that renders the floating HUD overlay
 * and handles voice/assist interaction from any Android screen.
 */
class FridayVoiceSession(context: Context) : VoiceInteractionSession(context) {

    private val sessionScope = CoroutineScope(Dispatchers.Main + Job())
    private lateinit var actionManager: DeviceActionManager
    private lateinit var aiService: AssistantAIService
    private lateinit var audioEngine: AssistantAudioEngine

    private var tvUserTranscript: TextView? = null
    private var tvAssistantAnswer: TextView? = null
    private var tvStatus: TextView? = null
    private var progressBar: ProgressBar? = null
    private var btnClose: ImageButton? = null
    private var lastScreenContext: String? = null

    override fun onCreate() {
        super.onCreate()
        actionManager = DeviceActionManager(context)
        aiService = AssistantAIService(actionManager)

        audioEngine = AssistantAudioEngine(
            context = context,
            onSpeechResult = { text -> handleUserSpeech(text) },
            onStateChanged = { state -> updateUiState(state) },
            onRmsChanged = { rms ->
                // Pulse visualizer based on voice volume
            }
        )
    }

    override fun onCreateContentView(): View {
        val layoutInflater = LayoutInflater.from(context)
        val view = layoutInflater.inflate(R.layout.session_assistant_overlay, null)

        tvUserTranscript = view.findViewById(R.id.tvUserTranscript)
        tvAssistantAnswer = view.findViewById(R.id.tvAssistantAnswer)
        tvStatus = view.findViewById(R.id.tvStatus)
        progressBar = view.findViewById(R.id.progressBar)
        btnClose = view.findViewById(R.id.btnClose)

        btnClose?.setOnClickListener {
            hide()
        }

        return view
    }

    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)
        
        // Position window at bottom of screen like Google Assistant
        window?.window?.let { w ->
            val lp = w.attributes
            lp.gravity = Gravity.BOTTOM
            lp.width = WindowManager.LayoutParams.MATCH_PARENT
            lp.height = WindowManager.LayoutParams.WRAP_CONTENT
            w.attributes = lp
        }

        tvUserTranscript?.text = ""
        tvAssistantAnswer?.text = "Listening..."
        tvStatus?.text = "⚡ FRIDAY READY"
        audioEngine.startListening()
    }

    override fun onHide() {
        super.onHide()
        audioEngine.stopListening()
        audioEngine.stopSpeaking()
    }

    override fun onHandleAssist(
        data: Bundle?,
        structure: AssistStructure?,
        content: AssistContent?
    ) {
        super.onHandleAssist(data, structure, content)
        // Extract on-screen text context when available
        lastScreenContext = extractStructureText(structure)
    }

    private fun handleUserSpeech(transcript: String) {
        tvUserTranscript?.text = transcript
        tvStatus?.text = "🧠 THINKING..."
        progressBar?.visibility = View.VISIBLE

        sessionScope.launch {
            val response = aiService.processUserQuery(transcript, lastScreenContext)
            progressBar?.visibility = View.GONE
            tvAssistantAnswer?.text = response
            tvStatus?.text = "🎙️ SPEAKING..."
            audioEngine.speak(response)
        }
    }

    private fun updateUiState(state: AssistantAudioEngine.AssistantState) {
        when (state) {
            AssistantAudioEngine.AssistantState.LISTENING -> {
                tvStatus?.text = "🎙️ LISTENING..."
                progressBar?.visibility = View.GONE
            }
            AssistantAudioEngine.AssistantState.THINKING -> {
                tvStatus?.text = "⚡ COMPUTING..."
                progressBar?.visibility = View.VISIBLE
            }
            AssistantAudioEngine.AssistantState.SPEAKING -> {
                tvStatus?.text = "🔊 FRIDAY SPEAKING..."
                progressBar?.visibility = View.GONE
            }
            AssistantAudioEngine.AssistantState.IDLE -> {
                tvStatus?.text = "⚡ IDLE"
                progressBar?.visibility = View.GONE
            }
        }
    }

    private fun extractStructureText(structure: AssistStructure?): String? {
        if (structure == null) return null
        val sb = StringBuilder()
        for (i in 0 until structure.windowNodeCount) {
            val node = structure.getWindowNodeAt(i).rootViewNode
            traverseNode(node, sb)
        }
        return sb.toString().take(1500)
    }

    private fun traverseNode(node: AssistStructure.ViewNode?, sb: StringBuilder) {
        if (node == null) return
        node.text?.let { sb.append(it).append(" ") }
        for (i in 0 until node.childCount) {
            traverseNode(node.getChildAt(i), sb)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        audioEngine.destroy()
    }
}
