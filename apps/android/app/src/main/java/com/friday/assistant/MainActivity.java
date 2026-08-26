package com.friday.assistant;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final int PERM_REQ = 101;
    private final String[] permissions = new String[]{
        Manifest.permission.RECORD_AUDIO
    };


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        requestNeededPermissions();

        Button btnSetDefault = findViewById(R.id.btnSetDefault);
        Button btnTestAssistant = findViewById(R.id.btnTestAssistant);

        if (btnSetDefault != null) {
            btnSetDefault.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    openAssistantSettings();
                }
            });
        }

        if (btnTestAssistant != null) {
            btnTestAssistant.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_ASSIST);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Set FRIDAY as Default Assistant in Settings first.", Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }
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
            for (String p : permissions) {
                if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(permissions, PERM_REQ);
                    break;
                }
            }
        }
    }
}
