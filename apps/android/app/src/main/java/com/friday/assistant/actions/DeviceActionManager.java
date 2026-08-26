package com.friday.assistant.actions;

import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.provider.AlarmClock;
import android.util.Log;
import java.util.List;
import java.util.Map;

public class DeviceActionManager {
    private static final String TAG = "DeviceActionManager";
    private final Context context;

    public DeviceActionManager(Context context) {
        this.context = context;
    }

    public String executeIntent(String actionType, Map<String, String> params) {
        try {
            switch (actionType.toLowerCase()) {
                case "flashlight":
                    return toggleFlashlight("on".equalsIgnoreCase(params.get("state")));
                case "alarm": {
                    int hour = parseInt(params.get("hour"), 7);
                    int minute = parseInt(params.get("minute"), 0);
                    String msg = params.getOrDefault("message", "FRIDAY Alarm");
                    return setAlarm(hour, minute, msg);
                }
                case "timer": {
                    int seconds = parseInt(params.get("seconds"), 60);
                    String msg = params.getOrDefault("message", "FRIDAY Timer");
                    return setTimer(seconds, msg);
                }
                case "call":
                    return makePhoneCall(params.getOrDefault("number", ""));
                case "whatsapp":
                    return sendWhatsApp(params.get("number"), params.getOrDefault("message", ""));
                case "open_app":
                    return launchApp(params.getOrDefault("app_name", ""));
                case "volume":
                    return setVolume(parseInt(params.get("level"), 50));
                case "web_search":
                    return performWebSearch(params.getOrDefault("query", ""));
                default:
                    return "Unrecognized action.";
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed action: " + actionType, e);
            return "Could not complete action: " + e.getMessage();
        }
    }

    private int parseInt(String val, int def) {
        if (val == null) return def;
        try { return Integer.parseInt(val.trim()); } catch (Exception e) { return def; }
    }

    private String toggleFlashlight(boolean turnOn) {
        try {
            CameraManager cameraManager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
            String cameraId = cameraManager.getCameraIdList()[0];
            cameraManager.setTorchMode(cameraId, turnOn);
            return turnOn ? "Flashlight turned on." : "Flashlight turned off.";
        } catch (Exception e) {
            return "Flashlight unavailable on this device.";
        }
    }

    private String setAlarm(int hour, int minute, String message) {
        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
        intent.putExtra(AlarmClock.EXTRA_HOUR, hour);
        intent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
        intent.putExtra(AlarmClock.EXTRA_MESSAGE, message);
        intent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        return String.format("Alarm set for %02d:%02d (%s).", hour, minute, message);
    }

    private String setTimer(int seconds, String message) {
        Intent intent = new Intent(AlarmClock.ACTION_SET_TIMER);
        intent.putExtra(AlarmClock.EXTRA_LENGTH, seconds);
        intent.putExtra(AlarmClock.EXTRA_MESSAGE, message);
        intent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        return "Timer started for " + seconds + " seconds.";
    }

    private String makePhoneCall(String number) {
        String clean = number.replaceAll("[^0-9+]", "");
        Intent intent = new Intent(Intent.ACTION_DIAL);
        intent.setData(Uri.parse("tel:" + clean));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        return "Dialing " + number + "...";
    }

    private String sendWhatsApp(String number, String message) {
        Uri uri = (number != null && !number.trim().isEmpty())
            ? Uri.parse("https://api.whatsapp.com/send?phone=" + number + "&text=" + Uri.encode(message))
            : Uri.parse("https://api.whatsapp.com/send?text=" + Uri.encode(message));
        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.setPackage("com.whatsapp");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
            return "Opening WhatsApp to send message.";
        } catch (Exception e) {
            return "WhatsApp is not installed on this device.";
        }
    }

    private String launchApp(String appName) {
        PackageManager pm = context.getPackageManager();
        String query = appName.toLowerCase().trim();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);

        for (ApplicationInfo app : apps) {
            String label = pm.getApplicationLabel(app).toString().toLowerCase();
            if (label.contains(query) || app.packageName.toLowerCase().contains(query)) {
                Intent launchIntent = pm.getLaunchIntentForPackage(app.packageName);
                if (launchIntent != null) {
                    launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(launchIntent);
                    return "Opening " + pm.getApplicationLabel(app) + ".";
                }
            }
        }
        return "Could not find application named '" + appName + "'.";
    }

    private String setVolume(int percent) {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        int max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        int target = (int) (max * (Math.max(0, Math.min(100, percent)) / 100.0f));
        audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, AudioManager.FLAG_SHOW_UI);
        return "Media volume set to " + percent + "%.";
    }

    private String performWebSearch(String query) {
        Intent intent = new Intent(Intent.ACTION_WEB_SEARCH);
        intent.putExtra(SearchManager.QUERY, query);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        return "Searching web for: " + query;
    }
}
