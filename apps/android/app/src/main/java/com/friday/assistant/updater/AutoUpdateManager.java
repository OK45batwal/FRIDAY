package com.friday.assistant.updater;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.util.Log;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class AutoUpdateManager {
    private static final String TAG = "AutoUpdateManager";
    private static final String PREFS_NAME = "FRIDAY_UPDATE_PREFS";
    private static final String GITHUB_API_URL = "https://api.github.com/repos/OK45batwal/FRIDAY/releases/latest";
    private static final String CURRENT_VERSION = "v1.0.1";

    private final Activity activity;

    public AutoUpdateManager(Activity activity) {
        this.activity = activity;
    }

    public void checkForUpdates(final boolean isManualCheck) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(GITHUB_API_URL);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setRequestProperty("User-Agent", "FRIDAY-Assistant-App");
                    conn.setConnectTimeout(4000);
                    conn.setReadTimeout(4000);

                    if (conn.getResponseCode() == 200) {
                        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                        StringBuilder sb = new StringBuilder();
                        String line;
                        while ((line = reader.readLine()) != null) sb.append(line);
                        reader.close();

                        JSONObject release = new JSONObject(sb.toString());
                        String latestTag = release.optString("tag_name", "").trim();
                        JSONArray assets = release.optJSONArray("assets");

                        String downloadUrl = null;
                        if (assets != null) {
                            for (int i = 0; i < assets.length(); i++) {
                                JSONObject asset = assets.getJSONObject(i);
                                String name = asset.optString("name", "");
                                if (name.endsWith(".apk")) {
                                    downloadUrl = asset.optString("browser_download_url", null);
                                    break;
                                }
                            }
                        }

                        // Compare latestTag with current installed version
                        if (downloadUrl != null && !latestTag.isEmpty() && isNewerVersion(latestTag, CURRENT_VERSION)) {
                            SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                            String dismissedTag = prefs.getString("dismissed_tag", "");

                            // On auto-check, do NOT show if user already clicked 'Later' for this exact tag
                            if (!isManualCheck && latestTag.equals(dismissedTag)) {
                                return;
                            }

                            final String apkUrl = downloadUrl;
                            final String tag = latestTag;

                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    promptUpdateDialog(tag, apkUrl);
                                }
                            });
                            return;
                        }
                    }

                    if (isManualCheck) {
                        activity.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(activity, "FRIDAY is already on the latest version (" + CURRENT_VERSION + ")", Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Update check failed: " + e.getMessage());
                    if (isManualCheck) {
                        activity.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(activity, "Could not reach update server.", Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                }
            }
        }).start();
    }

    private boolean isNewerVersion(String latest, String current) {
        String cleanLatest = latest.replaceFirst("(?i)^v", "").trim();
        String cleanCurrent = current.replaceFirst("(?i)^v", "").trim();
        if (cleanLatest.equals(cleanCurrent)) return false;

        String[] lParts = cleanLatest.split("\\.");
        String[] cParts = cleanCurrent.split("\\.");

        int length = Math.max(lParts.length, cParts.length);
        for (int i = 0; i < length; i++) {
            int l = i < lParts.length ? parseVer(lParts[i]) : 0;
            int c = i < cParts.length ? parseVer(cParts[i]) : 0;
            if (l > c) return true;
            if (l < c) return false;
        }
        return false;
    }

    private int parseVer(String s) {
        try {
            return Integer.parseInt(s.replaceAll("[^0-9]", ""));
        } catch (Exception e) {
            return 0;
        }
    }

    private void promptUpdateDialog(final String tag, final String apkUrl) {
        final SharedPreferences prefs = activity.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        new AlertDialog.Builder(activity)
            .setTitle("🚀 New Update Available (" + tag + ")")
            .setMessage("A new version of FRIDAY Assistant is available with updated features.\n\nWould you like to download now?")
            .setPositiveButton("Update", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl));
                    browserIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(browserIntent);
                }
            })
            .setNegativeButton("Later", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    prefs.edit().putString("dismissed_tag", tag).apply();
                }
            })
            .show();
    }
}
