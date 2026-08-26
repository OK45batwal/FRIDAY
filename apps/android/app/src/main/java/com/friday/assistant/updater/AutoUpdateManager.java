package com.friday.assistant.updater;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
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
    private static final String GITHUB_API_URL = "https://api.github.com/repos/OK45batwal/FRIDAY/releases/latest";

    private final Activity activity;

    public AutoUpdateManager(Activity activity) {
        this.activity = activity;
    }

    public void checkForUpdates(final boolean showUpToDateToast) {
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
                        String latestTag = release.optString("tag_name", "v1.0.1");
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

                        if (downloadUrl != null) {
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

                    if (showUpToDateToast) {
                        activity.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                Toast.makeText(activity, "FRIDAY is up to date!", Toast.LENGTH_SHORT).show();
                            }
                        });
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Update check failed: " + e.getMessage());
                }
            }
        }).start();
    }

    private void promptUpdateDialog(String tag, final String apkUrl) {
        new AlertDialog.Builder(activity)
            .setTitle("🚀 FRIDAY Update Available (" + tag + ")")
            .setMessage("A new version of FRIDAY Assistant is available.\n\nTap 'Update' to download the latest release.")
            .setPositiveButton("Update", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(apkUrl));
                    browserIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(browserIntent);
                }
            })
            .setNegativeButton("Later", null)
            .show();
    }
}
