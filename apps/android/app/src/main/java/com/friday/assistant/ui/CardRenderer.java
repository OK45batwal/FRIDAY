package com.friday.assistant.ui;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import com.friday.assistant.R;
import com.friday.assistant.actions.DeviceActionManager;
import java.util.Locale;

public class CardRenderer {
    private final Activity activity;
    private final LinearLayout container;
    private final LayoutInflater inflater;
    private final DeviceActionManager actionManager;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public CardRenderer(Activity activity, LinearLayout container, DeviceActionManager actionManager) {
        this.activity = activity;
        this.container = container;
        this.inflater = LayoutInflater.from(activity);
        this.actionManager = actionManager;
    }

    public void addUserMessage(String message) {
        TextView tv = new TextView(activity);
        tv.setText("🗣️  " + message);
        tv.setTextColor(0xFF38BDF8);
        tv.setTextSize(15);
        tv.setPadding(12, 10, 12, 10);
        container.addView(tv);
    }

    public void addAssistantMessage(String message) {
        TextView tv = new TextView(activity);
        tv.setText("🤖  " + message);
        tv.setTextColor(0xFFF1F5F9);
        tv.setTextSize(15);
        tv.setPadding(12, 10, 12, 10);
        container.addView(tv);
    }

    public void renderTimerCard(final int totalSeconds, String label) {
        final View card = inflater.inflate(R.layout.card_timer, container, false);
        final TextView tvCountdown = card.findViewById(R.id.tvTimerCountdown);
        final TextView tvLabel = card.findViewById(R.id.tvTimerLabel);
        final Button btnPause = card.findViewById(R.id.btnTimerPause);
        final Button btnCancel = card.findViewById(R.id.btnTimerCancel);

        if (label != null && !label.isEmpty()) {
            tvLabel.setText(label);
        }

        final int[] remainingSeconds = {totalSeconds};
        final boolean[] isPaused = {false};

        final Runnable timerRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isPaused[0] && remainingSeconds[0] > 0) {
                    remainingSeconds[0]--;
                    int m = remainingSeconds[0] / 60;
                    int s = remainingSeconds[0] % 60;
                    tvCountdown.setText(String.format(Locale.US, "%02d:%02d", m, s));
                    if (remainingSeconds[0] > 0) {
                        mainHandler.postDelayed(this, 1000);
                    } else {
                        tvCountdown.setText("⏰ Time's Up!");
                        tvCountdown.setTextColor(0xFF10B981);
                        btnPause.setVisibility(View.GONE);
                    }
                }
            }
        };

        int m = totalSeconds / 60;
        int s = totalSeconds % 60;
        tvCountdown.setText(String.format(Locale.US, "%02d:%02d", m, s));
        mainHandler.postDelayed(timerRunnable, 1000);

        btnPause.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                isPaused[0] = !isPaused[0];
                if (isPaused[0]) {
                    btnPause.setText("▶️ Resume");
                } else {
                    btnPause.setText("⏸️ Pause");
                    mainHandler.postDelayed(timerRunnable, 1000);
                }
            }
        });

        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                isPaused[0] = true;
                tvCountdown.setText("Cancelled");
                tvCountdown.setTextColor(0xFFF43F5E);
                btnPause.setVisibility(View.GONE);
                btnCancel.setVisibility(View.GONE);
            }
        });

        container.addView(card);
    }

    public void renderAppCard(final String appName, String desc, String emoji) {
        View card = inflater.inflate(R.layout.card_app, container, false);
        TextView tvEmoji = card.findViewById(R.id.tvAppEmoji);
        TextView tvName = card.findViewById(R.id.tvAppName);
        TextView tvDesc = card.findViewById(R.id.tvAppDesc);
        Button btnLaunch = card.findViewById(R.id.btnLaunchApp);

        tvEmoji.setText(emoji != null ? emoji : "🚀");
        tvName.setText(appName);
        if (desc != null) tvDesc.setText(desc);

        btnLaunch.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                actionManager.launchApp(appName);
            }
        });

        container.addView(card);
    }

    public void renderReminderCard(String reminderText) {
        View card = inflater.inflate(R.layout.card_reminder, container, false);
        TextView tvText = card.findViewById(R.id.tvReminderText);
        tvText.setText(reminderText);
        container.addView(card);
    }
}
