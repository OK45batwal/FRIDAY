package com.friday.assistant;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.friday.assistant.actions.DeviceActionManager;
import com.friday.assistant.ai.AssistantAIService;
import com.friday.assistant.audio.AssistantAudioEngine;
import com.friday.assistant.audio.WakeWordEngine;
import com.friday.assistant.ui.CardRenderer;
import com.friday.assistant.updater.AutoUpdateManager;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
    private static final int PERM_REQ = 101;
    private static final String PREFS_NAME = "FRIDAY_PREFS";

    private DeviceActionManager actionManager;
    private AssistantAIService aiService;
    private AssistantAudioEngine audioEngine;
    private WakeWordEngine wakeWordEngine;
    private AutoUpdateManager updateManager;
    private CardRenderer cardRenderer;

    private TextView tvPersonalizedGreeting;
    private TextView tvGlanceDate;
    private TextView tvGlanceBattery;
    private TextView tvStatus;
    private LinearLayout chatContainer;
    private ScrollView chatScrollView;
    private EditText etInput;
    private ImageButton btnVoice;
    private ImageButton btnSend;
    private ImageButton btnSettings;
    private Button chipWakeWordToggle;
    private View orbGlow;
    private View lightBar;

    private boolean isWakeWordEnabled = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        requestNeededPermissions();

        actionManager = new DeviceActionManager(this);
        aiService = new AssistantAIService(this, actionManager);
        updateManager = new AutoUpdateManager(this);

        updateManager.checkForUpdates(false);

        tvPersonalizedGreeting = findViewById(R.id.tvPersonalizedGreeting);
        tvGlanceDate = findViewById(R.id.tvGlanceDate);
        tvGlanceBattery = findViewById(R.id.tvGlanceBattery);
        tvStatus = findViewById(R.id.tvStatus);
        chatContainer = findViewById(R.id.chatContainer);
        chatScrollView = findViewById(R.id.chatScrollView);
        etInput = findViewById(R.id.etInput);
        btnVoice = findViewById(R.id.btnVoice);
        btnSend = findViewById(R.id.btnSend);
        btnSettings = findViewById(R.id.btnSettings);
        chipWakeWordToggle = findViewById(R.id.chipWakeWordToggle);
        orbGlow = findViewById(R.id.orbGlow);
        lightBar = findViewById(R.id.lightBar);

        cardRenderer = new CardRenderer(this, chatContainer, actionManager);

        updateAmbientGlance();

        // Wake Word Engine for hands-free "Hey Friday"
        wakeWordEngine = new WakeWordEngine(this, new WakeWordEngine.WakeWordCallback() {
            @Override public void onWakeWordDetected(String detectedPhrase) {
                runOnUiThread(new Runnable() {
                    @Override public void run() {
                        tvStatus.setText("⚡ 'HEY FRIDAY' DETECTED!");
                        audioEngine.startListening();
                    }
                });
            }
        });

        audioEngine = new AssistantAudioEngine(
            this,
            new AssistantAudioEngine.SpeechCallback() {
                @Override public void onResult(String finalTranscript) {
                    etInput.setText("");
                    processQuery(finalTranscript, true);
                }

                @Override public void onPartialResult(final String partialTranscript) {
                    runOnUiThread(new Runnable() {
                        @Override public void run() {
                            etInput.setText(partialTranscript);
                        }
                    });
                }
            },
            new AssistantAudioEngine.StateCallback() {
                @Override public void onState(AssistantAudioEngine.AssistantState state) {
                    updateVoiceState(state);
                }

                @Override public void onRmsAmplitude(final float rmsdB) {
                    runOnUiThread(new Runnable() {
                        @Override public void run() {
                            if (orbGlow != null && rmsdB > 2.0f) {
                                float scale = 1.0f + (Math.min(rmsdB, 10.0f) / 14.0f);
                                orbGlow.setScaleX(scale);
                                orbGlow.setScaleY(scale);
                            }
                            if (lightBar != null) {
                                float alpha = 0.5f + (Math.min(rmsdB, 10.0f) / 20.0f);
                                lightBar.setAlpha(alpha);
                            }
                        }
                    });
                }
            }
        );

        if (btnVoice != null) {
            btnVoice.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) {
                    wakeWordEngine.pause();
                    audioEngine.startListening();
                }
            });
        }

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

        if (btnSettings != null) {
            btnSettings.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) {
                    showSettingsDialog();
                }
            });
        }

        if (chipWakeWordToggle != null) {
            chipWakeWordToggle.setOnClickListener(new View.OnClickListener() {
                @Override public void onClick(View v) {
                    isWakeWordEnabled = !isWakeWordEnabled;
                    if (isWakeWordEnabled) {
                        chipWakeWordToggle.setText("🎙️ Wake Word: ON");
                        chipWakeWordToggle.setTextColor(0xFF10B981);
                        wakeWordEngine.startListening();
                        Toast.makeText(MainActivity.this, "Say 'Hey Friday' to trigger hands-free!", Toast.LENGTH_SHORT).show();
                    } else {
                        chipWakeWordToggle.setText("🎙️ Wake Word: OFF");
                        chipWakeWordToggle.setTextColor(0xFF94A3B8);
                        wakeWordEngine.stopListening();
                    }
                }
            });
        }

        setupChip(R.id.chipGoodMorning, new Runnable() {
            @Override public void run() { processQuery("Good morning", true); }
        });
        setupChip(R.id.chipTimer, new Runnable() {
            @Override public void run() { processQuery("Set a timer for 5 minutes", true); }
        });
        setupChip(R.id.chipYouTube, new Runnable() {
            @Override public void run() { processQuery("Open YouTube", true); }
        });
        setupChip(R.id.chipFlashlight, new Runnable() {
            @Override public void run() { processQuery("Turn on flashlight", false); }
        });
        setupChip(R.id.chipFlipCoin, new Runnable() {
            @Override public void run() { processQuery("Flip a coin", true); }
        });
        setupChip(R.id.chipReminders, new Runnable() {
            @Override public void run() { processQuery("What are my reminders?", true); }
        });

        cardRenderer.addAssistantMessage("Good day! I am FRIDAY, your personalized AI Assistant. Say 'Hey Friday' or choose a quick action below.");

        if (isWakeWordEnabled) {
            wakeWordEngine.startListening();
        }
    }

    private void updateAmbientGlance() {
        Calendar cal = Calendar.getInstance();
        int hour = cal.get(Calendar.HOUR_OF_DAY);
        String greeting = (hour < 12) ? "Good morning, Sir" : (hour < 17) ? "Good afternoon, Sir" : "Good evening, Sir";
        tvPersonalizedGreeting.setText(greeting);

        String dateStr = new SimpleDateFormat("EEEE, MMMM d", Locale.getDefault()).format(new Date());
        tvGlanceDate.setText(dateStr);

        IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = registerReceiver(null, ifilter);
        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            int pct = (int) ((level / (float) scale) * 100);
            tvGlanceBattery.setText("🔋 " + pct + "%");
        }
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
        cardRenderer.addUserMessage(query);
        tvStatus.setText("⚡ COMPUTING...");
        wakeWordEngine.pause();

        // If Timer intent, render interactive countdown card!
        String lower = query.toLowerCase();
        if (lower.contains("timer")) {
            int seconds = lower.contains("5 min") ? 300 : lower.contains("10 min") ? 600 : 300;
            cardRenderer.renderTimerCard(seconds, "Countdown Timer");
        }
        else if (lower.startsWith("open ") || lower.startsWith("launch ")) {
            String app = query.replaceFirst("(?i)open |launch ", "").trim();
            cardRenderer.renderAppCard(app, "Application launched", "🚀");
        }
        else if (lower.startsWith("remember that") || lower.startsWith("remind me to")) {
            String note = query.replaceFirst("(?i)remember that|remind me to", "").trim();
            cardRenderer.renderReminderCard(note);
        }

        new Thread(new Runnable() {
            @Override public void run() {
                final String response = aiService.processUserQuery(query, null);
                runOnUiThread(new Runnable() {
                    @Override public void run() {
                        cardRenderer.addAssistantMessage(response);
                        tvStatus.setText("⚡ READY • SAY 'HEY FRIDAY'");
                        scrollToBottom();
                        if (speakBack) {
                            audioEngine.speak(response);
                        } else if (isWakeWordEnabled) {
                            wakeWordEngine.resume();
                        }
                    }
                });
            }
        }).start();

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
                if (orbGlow != null) {
                    orbGlow.setScaleX(1.0f);
                    orbGlow.setScaleY(1.0f);
                }
                switch (state) {
                    case LISTENING:
                        tvStatus.setText("🎙️ LISTENING...");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x80F43F5E);
                        if (lightBar != null) lightBar.setAlpha(1.0f);
                        break;
                    case THINKING:
                        tvStatus.setText("🧠 THINKING...");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x8038BDF8);
                        if (lightBar != null) lightBar.setAlpha(0.8f);
                        break;
                    case SPEAKING:
                        tvStatus.setText("🔊 FRIDAY SPEAKING...");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x8010B981);
                        if (lightBar != null) lightBar.setAlpha(0.9f);
                        break;
                    case IDLE:
                        tvStatus.setText("⚡ READY • SAY 'HEY FRIDAY'");
                        if (orbGlow != null) orbGlow.setBackgroundColor(0x2538BDF8);
                        if (lightBar != null) lightBar.setAlpha(0.4f);
                        if (isWakeWordEnabled) {
                            wakeWordEngine.resume();
                        }
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
        tvKeyLabel.setText("Groq or OpenRouter API Key (Free Cloud LLM):");
        layout.addView(tvKeyLabel);

        final EditText etKey = new EditText(this);
        etKey.setHint("gsk_... or sk-or-...");
        etKey.setText(prefs.getString("api_key", ""));
        layout.addView(etKey);

        TextView tvIpLabel = new TextView(this);
        tvIpLabel.setText("\nLocal PC / Mac IP (e.g. 192.168.1.100:8000):");
        layout.addView(tvIpLabel);

        final EditText etIp = new EditText(this);
        etIp.setHint("192.168.1.100:8000");
        etIp.setText(prefs.getString("host_ip", ""));
        layout.addView(etIp);

        Button btnCheckUpdate = new Button(this);
        btnCheckUpdate.setText("🔄 Check for New Updates");
        btnCheckUpdate.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                updateManager.checkForUpdates(true);
            }
        });
        layout.addView(btnCheckUpdate);

        new AlertDialog.Builder(this)
            .setTitle("FRIDAY Assistant Configuration")
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

    private void requestNeededPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, PERM_REQ);
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (wakeWordEngine != null) wakeWordEngine.pause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (wakeWordEngine != null && isWakeWordEnabled) wakeWordEngine.resume();
        updateAmbientGlance();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (audioEngine != null) audioEngine.destroy();
        if (wakeWordEngine != null) wakeWordEngine.destroy();
    }
}
