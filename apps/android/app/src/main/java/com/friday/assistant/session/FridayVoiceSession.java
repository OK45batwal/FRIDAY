package com.friday.assistant.session;

import android.app.assist.AssistContent;
import android.app.assist.AssistStructure;
import android.content.Context;
import android.os.Bundle;
import android.service.voice.VoiceInteractionSession;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;
import android.widget.ProgressBar;
import android.widget.TextView;
import com.friday.assistant.R;
import com.friday.assistant.actions.DeviceActionManager;
import com.friday.assistant.ai.AssistantAIService;
import com.friday.assistant.audio.AssistantAudioEngine;

public class FridayVoiceSession extends VoiceInteractionSession {
    private DeviceActionManager actionManager;
    private AssistantAIService aiService;
    private AssistantAudioEngine audioEngine;

    private TextView tvUserTranscript;
    private TextView tvAssistantAnswer;
    private TextView tvStatus;
    private ProgressBar progressBar;
    private ImageButton btnClose;
    private String lastScreenContext = null;

    public FridayVoiceSession(Context context) {
        super(context);
    }

    @Override
    public void onCreate() {
        super.onCreate();
        actionManager = new DeviceActionManager(getContext());
        aiService = new AssistantAIService(getContext(), actionManager);


        audioEngine = new AssistantAudioEngine(
            getContext(),
            new AssistantAudioEngine.SpeechCallback() {
                @Override public void onResult(String text) { handleUserSpeech(text); }
                @Override public void onPartialResult(final String partial) {
                    if (tvUserTranscript != null) {
                        tvUserTranscript.post(new Runnable() {
                            @Override public void run() { tvUserTranscript.setText(partial); }
                        });
                    }
                }
            },
            new AssistantAudioEngine.StateCallback() {
                @Override public void onState(AssistantAudioEngine.AssistantState state) { updateUiState(state); }
                @Override public void onRmsAmplitude(float rmsdB) {}
            }
        );

    }

    @Override
    public View onCreateContentView() {
        LayoutInflater inflater = LayoutInflater.from(getContext());
        View view = inflater.inflate(R.layout.session_assistant_overlay, null);

        tvUserTranscript = view.findViewById(R.id.tvUserTranscript);
        tvAssistantAnswer = view.findViewById(R.id.tvAssistantAnswer);
        tvStatus = view.findViewById(R.id.tvStatus);
        progressBar = view.findViewById(R.id.progressBar);
        btnClose = view.findViewById(R.id.btnClose);

        if (btnClose != null) {
            btnClose.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) { hide(); }
            });
        }
        return view;
    }

    @Override
    public void onShow(Bundle args, int showFlags) {
        super.onShow(args, showFlags);
        if (getWindow() != null && getWindow().getWindow() != null) {
            WindowManager.LayoutParams lp = getWindow().getWindow().getAttributes();
            lp.gravity = Gravity.BOTTOM;
            lp.width = WindowManager.LayoutParams.MATCH_PARENT;
            lp.height = WindowManager.LayoutParams.WRAP_CONTENT;
            getWindow().getWindow().setAttributes(lp);
        }

        if (tvUserTranscript != null) tvUserTranscript.setText("");
        if (tvAssistantAnswer != null) tvAssistantAnswer.setText("Listening...");
        if (tvStatus != null) tvStatus.setText("⚡ FRIDAY READY");
        audioEngine.startListening();
    }

    @Override
    public void onHide() {
        super.onHide();
        audioEngine.stopListening();
        audioEngine.stopSpeaking();
    }

    @Override
    public void onHandleAssist(Bundle data, AssistStructure structure, AssistContent content) {
        super.onHandleAssist(data, structure, content);
        lastScreenContext = extractStructureText(structure);
    }

    private void handleUserSpeech(String transcript) {
        if (tvUserTranscript != null) tvUserTranscript.setText(transcript);
        if (tvStatus != null) tvStatus.setText("⚡ EXECUTING...");
        if (progressBar != null) progressBar.setVisibility(View.VISIBLE);

        new Thread(new Runnable() {
            @Override public void run() {
                final String response = aiService.processUserQuery(transcript, lastScreenContext);
                if (tvAssistantAnswer != null) {
                    tvAssistantAnswer.post(new Runnable() {
                        @Override public void run() {
                            if (progressBar != null) progressBar.setVisibility(View.GONE);
                            tvAssistantAnswer.setText(response);
                            if (tvStatus != null) tvStatus.setText("🔊 FRIDAY SPEAKING...");
                            audioEngine.speak(response);
                        }
                    });
                }
            }
        }).start();
    }

    private void updateUiState(AssistantAudioEngine.AssistantState state) {
        if (tvStatus == null) return;
        tvStatus.post(new Runnable() {
            @Override public void run() {
                switch (state) {
                    case LISTENING:
                        tvStatus.setText("🎙️ LISTENING...");
                        if (progressBar != null) progressBar.setVisibility(View.GONE);
                        break;
                    case THINKING:
                        tvStatus.setText("⚡ THINKING...");
                        if (progressBar != null) progressBar.setVisibility(View.VISIBLE);
                        break;
                    case SPEAKING:
                        tvStatus.setText("🔊 FRIDAY SPEAKING...");
                        if (progressBar != null) progressBar.setVisibility(View.GONE);
                        break;
                    case IDLE:
                        tvStatus.setText("⚡ FRIDAY READY");
                        if (progressBar != null) progressBar.setVisibility(View.GONE);
                        break;
                }
            }
        });
    }

    private String extractStructureText(AssistStructure structure) {
        if (structure == null) return null;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < structure.getWindowNodeCount(); i++) {
            AssistStructure.ViewNode node = structure.getWindowNodeAt(i).getRootViewNode();
            traverseNode(node, sb);
        }
        return sb.toString();
    }

    private void traverseNode(AssistStructure.ViewNode node, StringBuilder sb) {
        if (node == null) return;
        if (node.getText() != null) sb.append(node.getText()).append(" ");
        for (int i = 0; i < node.getChildCount(); i++) {
            traverseNode(node.getChildAt(i), sb);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        audioEngine.destroy();
    }
}
