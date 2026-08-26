package com.friday.assistant;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.friday.assistant.actions.DeviceActionManager;
import com.friday.assistant.ai.AssistantAIService;
import com.friday.assistant.audio.AssistantAudioEngine;

public class MainActivity extends Activity {
    private static final int PERM_REQ = 101;
    private static final String PREFS_NAME = "FRIDAY_PREFS";

    private DeviceActionManager actionManager;
    private AssistantAIService aiService;
    private AssistantAudioEngine audioEngine;

    private TextView tvStatus;
    private LinearLayout chatContainer;
    private ScrollView chatScrollView;
    private EditText etInput;
    private ImageButton btnVoice;
    private ImageButton btnSend;
    private ImageButton btnSettings;
    private View orbGlow;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        requestNeededPermissions();

        actionManager = new DeviceActionManager(this);
        aiService = new AssistantAIService(this, actionManager);

        tvStatus = findViewById(R.id.tvStatus);
        chatContainer = findViewById(R.id.chatContainer);
        chatScrollView = findViewById(R.id.chatScrollView);
        etInput = findViewById(R.id.etInput);
        btnVoice = findViewById(R.id.btnVoice);
        btnSend = findViewById(R.id.btnSend);
        btnSettings = findViewById(R.id.btnSettings);
        orbGlow = findViewById(R.id.orbGlow);

        audioEngine = new AssistantAudioEngine(
            this,
            new AssistantAudioEngine.SpeechCallback() {
                @Override public void onResult(String text) {
                    processQuery(text, true);
                }
            },
            new AssistantAudioEngine.StateCallback() {
                @Override public void onState(AssistantAudioEngine.AssistantState state) {
                    updateVoiceState(state);
                }
            }
        );

        // Voice button click
        if (btnVoice != null) {
            btnVoice.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) {
                    audioEngine.startListening();
                }
            });
        }

        // Send text button click
        if (btnSend != null) {
            btnSend.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) {
                    String query = etInput.getText().toString().trim();
                    if (!query.isEmpty()) {
                        etInput.setText("");
                        processQuery(query, false);
                    }
                }
            });
        }

        // Settings button click
        if (btnSettings != null) {
            btnSettings.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) {
                    showSettingsDialog();
                }
            });
        }

        // Setup Quick Action Chips
        setupChip(R.id.chipSetDefault, new Runnable() {
            @Override public void run() { openAssistantSettings(); }
        });
        setupChip(R.id.chipFlashlight, new Runnable() {
            @Override public void run() { processQuery("Turn on flashlight", false); }
        });
        setupChip(R.id.chipTimer, new Runnable() {
            @Override public void run() { processQuery("Set timer for 10 minutes", false); }
        });
        setupChip(R.id.chipAlarm, new Runnable() {
            @Override public void run() { processQuery("Set alarm for 7:00 AM", false); }
        });
        setupChip(R.id.chipTestOverlay, new Runnable() {
            @Override public void run() {
                try {
                    Intent intent = new Intent(Intent.ACTION_ASSIST);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Set FRIDAY as Default Assistant in Settings first.", Toast.LENGTH_SHORT).show();
                }
            }
        });

        addAssistantMessage("Hello Sir! I am FRIDAY, your AI Operating Assistant. Tap the Voice Orb or speak a command.");
    }

    private void setupChip(int id, final Runnable action) {
        View chip = findViewById(id);
        if (chip != null) {
            chip.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) { action.run(); }
            });
        }
    }

    private void processQuery(final String query, final boolean speakBack) {
        addUserMessage(query);
        tvStatus.setText("⚡ COMPUTING...");

        new Thread(new Runnable() {
            @Override public void run() {
                final String response = aiService.processUserQuery(query, null);
                runOnUiThread(new Runnable() {
                    @Override public void run() {
                        addAssistantMessage(response);
                        tvStatus.setText("⚡ FRIDAY ONLINE");
                        if (speakBack) {
                            audioEngine.speak(response);
                        }
                    }
                });
            }
        }).start();
    }

    private void addUserMessage(String message) {
        TextView tv = new TextView(this);
        tv.setText("🗣️ " + message);
        tv.setTextColor(0xFF38BDF8);
        tv.setTextSize(15);
        tv.setPadding(0, 10, 0, 10);
        chatContainer.addView(tv);
        scrollToBottom();
    }

    private void addAssistantMessage(String message) {
        TextView tv = new TextView(this);
        tv.setText("🤖 " + message);
        tv.setTextColor(0xFFF1F5F9);
        tv.setTextSize(15);
        tv.setPadding(0, 10, 0, 10);
        chatContainer.addView(tv);
        scrollToBottom();
    }

    private void scrollToBottom() {
        chatScrollView.post(new Runnable() {
            @Override public void run() {
                chatScrollView.fullScroll(View.FOCUS_DOWN);
            }
        });
    }

    private void updateVoiceState(final AssistantAudioEngine.AssistantState state) {
        runOnUiThread(new Runnable() {
            @Override public void run() {
                switch (state) {
                    case LISTENING:
                        tvStatus.setText("🎙️ LISTENING...");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x80F43F5E);
                        break;
                    case THINKING:
                        tvStatus.setText("🧠 THINKING...");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x8038BDF8);
                        break;
                    case SPEAKING:
                        tvStatus.setText("🔊 SPEAKING...");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x8010B981);
                        break;
                    case IDLE:
                        tvStatus.setText("⚡ FRIDAY ONLINE");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x2038BDF8);
                        break;
                }
            }
        });
    }

    private void showSettingsDialog() {
        final SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setPadding(50, 40, 50, 10);

        TextView tvKeyLabel = new TextView(this);
        tvKeyLabel.setText("Groq or OpenRouter API Key (Free):");
        layout.addView(tvKeyLabel);

        final EditText etKey = new EditText(this);
        etKey.setHint("gsk_... or sk-or-...");
        etKey.setText(prefs.getString("api_key", ""));
        layout.addView(etKey);

        TextView tvIpLabel = new TextView(this);
        tvIpLabel.setText("\nLocal PC / Mac IP Address (Optional):");
        layout.addView(tvIpLabel);

        final EditText etIp = new EditText(this);
        etIp.setHint("192.168.1.100:8000");
        etIp.setText(prefs.getString("host_ip", ""));
        layout.addView(etIp);

        new AlertDialog.Builder(this)
            .setTitle("FRIDAY AI Engine Configuration")
            .setView(layout)
            .setPositiveButton("Save", new DialogInterface.OnClickListener() {
                @Override public void onClick(DialogInterface dialog, int which) {
                    prefs.edit()
                         .putString("api_key", etKey.getText().toString().trim())
                         .putString("host_ip", etIp.getText().toString().trim())
                         .apply();
                    Toast.makeText(MainActivity.this, "Settings Saved!", Toast.LENGTH_SHORT).show();
                }
            })
            .setNegativeButton("Cancel", null)
            .show();
    }

    private void openAssistantSettings() {
        Intent intent = new Intent(Settings.ACTION_VOICE_INPUT_SETTINGS);
        try {
            startActivity(intent);
        } catch (Exception e) {
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_DEFAULT_APPS_SETTINGS));
            } catch (Exception ex) {
                startActivity(new Intent(Settings.ACTION_SETTINGS));
            }
        }
    }

    private void requestNeededPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, PERM_REQ);
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (audioEngine != null) audioEngine.destroy();
    }
}
