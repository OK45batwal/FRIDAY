package com.friday.assistant.actions;

import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.hardware.camera2.CameraManager;
import android.media.AudioManager;
import android.net.Uri;
import android.provider.AlarmClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Log;
import android.view.KeyEvent;
import org.json.JSONArray;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class DeviceActionManager {
    private static final String TAG = "DeviceActionManager";
    private static final String NOTES_PREF = "FRIDAY_NOTES";
    private final Context context;

    private static final Map<String, String> APP_PACKAGE_ALIASES = new HashMap<>();
    static {
        APP_PACKAGE_ALIASES.put("youtube", "com.google.android.youtube");
        APP_PACKAGE_ALIASES.put("yt", "com.google.android.youtube");
        APP_PACKAGE_ALIASES.put("whatsapp", "com.whatsapp");
        APP_PACKAGE_ALIASES.put("instagram", "com.instagram.android");
        APP_PACKAGE_ALIASES.put("insta", "com.instagram.android");
        APP_PACKAGE_ALIASES.put("spotify", "com.spotify.music");
        APP_PACKAGE_ALIASES.put("music", "com.spotify.music");
        APP_PACKAGE_ALIASES.put("chrome", "com.android.chrome");
        APP_PACKAGE_ALIASES.put("browser", "com.android.chrome");
        APP_PACKAGE_ALIASES.put("maps", "com.google.android.apps.maps");
        APP_PACKAGE_ALIASES.put("navigation", "com.google.android.apps.maps");
        APP_PACKAGE_ALIASES.put("calculator", "com.google.android.calculator");
        APP_PACKAGE_ALIASES.put("calc", "com.google.android.calculator");
        APP_PACKAGE_ALIASES.put("camera", "android.media.action.IMAGE_CAPTURE");
        APP_PACKAGE_ALIASES.put("settings", "android.settings.SETTINGS");
        APP_PACKAGE_ALIASES.put("gmail", "com.google.android.gm");
        APP_PACKAGE_ALIASES.put("email", "com.google.android.gm");
        APP_PACKAGE_ALIASES.put("mail", "com.google.android.gm");
        APP_PACKAGE_ALIASES.put("telegram", "org.telegram.messenger");
        APP_PACKAGE_ALIASES.put("netflix", "com.netflix.mediaclient");
        APP_PACKAGE_ALIASES.put("photos", "com.google.android.apps.photos");
        APP_PACKAGE_ALIASES.put("gallery", "com.google.android.apps.photos");
        APP_PACKAGE_ALIASES.put("twitter", "com.twitter.android");
        APP_PACKAGE_ALIASES.put("x", "com.twitter.android");
        APP_PACKAGE_ALIASES.put("clock", "com.google.android.deskclock");
    }

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
                case "media":
                    return controlMedia(params.getOrDefault("command", "play"));
                case "web_search":
                    return performWebSearch(params.getOrDefault("query", ""));
                case "save_reminder":
                    return saveReminder(params.getOrDefault("note", ""));
                case "get_reminders":
                    return getReminders();
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

    public String toggleFlashlight(boolean turnOn) {
        try {
            CameraManager cameraManager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
            if (cameraManager != null && cameraManager.getCameraIdList().length > 0) {
                String cameraId = cameraManager.getCameraIdList()[0];
                cameraManager.setTorchMode(cameraId, turnOn);
                return turnOn ? "Flashlight turned on." : "Flashlight turned off.";
            }
            return "Flashlight hardware unavailable.";
        } catch (Exception e) {
            return "Could not toggle flashlight: " + e.getMessage();
        }
    }

    public String setAlarm(int hour, int minute, String message) {
        Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
        intent.putExtra(AlarmClock.EXTRA_HOUR, hour);
        intent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
        intent.putExtra(AlarmClock.EXTRA_MESSAGE, message);
        intent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
            return String.format(Locale.US, "Alarm set for %02d:%02d (%s).", hour, minute, message);
        } catch (Exception e) {
            return "Alarm scheduled for " + String.format(Locale.US, "%02d:%02d", hour, minute) + ".";
        }
    }

    public String setTimer(int seconds, String message) {
        Intent intent = new Intent(AlarmClock.ACTION_SET_TIMER);
        intent.putExtra(AlarmClock.EXTRA_LENGTH, seconds);
        intent.putExtra(AlarmClock.EXTRA_MESSAGE, message);
        intent.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(intent);
            int min = seconds / 60;
            int sec = seconds % 60;
            String timeStr = min > 0 ? (min + " min" + (sec > 0 ? " " + sec + "s" : "")) : (sec + " seconds");
            return "Timer started for " + timeStr + ".";
        } catch (Exception e) {
            return "Timer started for " + seconds + " seconds.";
        }
    }

    public String makePhoneCall(String number) {
        String clean = number.replaceAll("[^0-9+]", "");
        Intent intent = new Intent(Intent.ACTION_DIAL);
        intent.setData(Uri.parse("tel:" + clean));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        return "Opening dialer for " + number + "...";
    }

    public String sendWhatsApp(String number, String message) {
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

    public String launchApp(String appName) {
        String cleanName = appName.toLowerCase().trim();
        PackageManager pm = context.getPackageManager();

        // 1. Direct Alias Match
        if (cleanName.equals("camera")) {
            Intent cameraIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            cameraIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { context.startActivity(cameraIntent); return "Opening Camera."; } catch (Exception ignored) {}
        }
        if (cleanName.equals("settings")) {
            Intent settingsIntent = new Intent(Settings.ACTION_SETTINGS);
            settingsIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try { context.startActivity(settingsIntent); return "Opening Settings."; } catch (Exception ignored) {}
        }

        if (APP_PACKAGE_ALIASES.containsKey(cleanName)) {
            String pkg = APP_PACKAGE_ALIASES.get(cleanName);
            Intent launchIntent = pm.getLaunchIntentForPackage(pkg);
            if (launchIntent != null) {
                launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(launchIntent);
                return "Opening " + capitalize(cleanName) + ".";
            }
        }

        // 2. Fuzzy Match Across All Installed Applications
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        for (ApplicationInfo app : apps) {
            String label = pm.getApplicationLabel(app).toString().toLowerCase();
            if (label.contains(cleanName) || app.packageName.toLowerCase().contains(cleanName)) {
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

    public String setVolume(int percent) {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager != null) {
            int max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
            int target = (int) (max * (Math.max(0, Math.min(100, percent)) / 100.0f));
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, target, AudioManager.FLAG_SHOW_UI);
            return "Media volume set to " + percent + "%.";
        }
        return "Volume adjusted.";
    }

    public String controlMedia(String command) {
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return "Audio service unavailable.";

        int keyCode = KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
        String desc = "Toggled playback.";
        if (command.equalsIgnoreCase("play")) {
            keyCode = KeyEvent.KEYCODE_MEDIA_PLAY;
            desc = "Playing music.";
        } else if (command.equalsIgnoreCase("pause") || command.equalsIgnoreCase("stop")) {
            keyCode = KeyEvent.KEYCODE_MEDIA_PAUSE;
            desc = "Paused music.";
        } else if (command.equalsIgnoreCase("next")) {
            keyCode = KeyEvent.KEYCODE_MEDIA_NEXT;
            desc = "Skipped to next track.";
        } else if (command.equalsIgnoreCase("prev") || command.equalsIgnoreCase("previous")) {
            keyCode = KeyEvent.KEYCODE_MEDIA_PREVIOUS;
            desc = "Previous track.";
        }

        audioManager.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, keyCode));
        audioManager.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, keyCode));
        return desc;
    }

    public String performWebSearch(String query) {
        Intent intent = new Intent(Intent.ACTION_WEB_SEARCH);
        intent.putExtra(SearchManager.QUERY, query);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
        return "Searching for: " + query;
    }

    public String saveReminder(String note) {
        if (note.trim().isEmpty()) return "Nothing to remember.";
        SharedPreferences prefs = context.getSharedPreferences(NOTES_PREF, Context.MODE_PRIVATE);
        try {
            String existing = prefs.getString("notes_list", "[]");
            JSONArray arr = new JSONArray(existing);
            arr.put(note);
            prefs.edit().putString("notes_list", arr.toString()).apply();
            return "Noted: \"" + note + "\".";
        } catch (Exception e) {
            return "Saved reminder: " + note;
        }
    }

    public String getReminders() {
        SharedPreferences prefs = context.getSharedPreferences(NOTES_PREF, Context.MODE_PRIVATE);
        try {
            String existing = prefs.getString("notes_list", "[]");
            JSONArray arr = new JSONArray(existing);
            if (arr.length() == 0) return "You have no saved reminders, Sir.";
            StringBuilder sb = new StringBuilder("Here are your saved reminders:\n");
            for (int i = 0; i < arr.length(); i++) {
                sb.append("• ").append(arr.getString(i)).append("\n");
            }
            return sb.toString().trim();
        } catch (Exception e) {
            return "No reminders found.";
        }
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        return str.substring(0, 1).toUpperCase() + str.substring(1);
    }
}
