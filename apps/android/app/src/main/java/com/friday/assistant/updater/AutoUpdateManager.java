package com.friday.assistant.updater;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;
import android.widget.Toast;
import org.json.JSONArray;

import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.File;
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
                        String latestTag = release.optString("tag_name", "v1.0.0");
                        String releaseNotes = release.optString("body", "Bug fixes and performance improvements.");
                        JSONArray assets = release.optJSONArray("assets");

                        String downloadUrl = null;
                        if (assets != null) {
                            for (int i = 0; i < assets.length(); i++) {
                                JSONObject asset = assets.getJSONObject(i);
                                String name = asset.optString("name", "");
                                if (name.endsWith(".apk") && name.contains("Assistant")) {
                                    downloadUrl = asset.optString("browser_download_url", null);
                                    break;
                                }
                            }
                        }

                        if (downloadUrl != null) {
                            final String apkUrl = downloadUrl;
                            final String tag = latestTag;
                            final String notes = releaseNotes;

                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    promptUpdateDialog(tag, notes, apkUrl);
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

    private void promptUpdateDialog(String tag, String notes, final String apkUrl) {
        new AlertDialog.Builder(activity)
            .setTitle("🚀 FRIDAY Update Available (" + tag + ")")
            .setMessage("A new version of FRIDAY Assistant is available with the latest features.\n\nWould you like to download and install now?")
            .setPositiveButton("Update Now", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    downloadAndInstallApk(apkUrl);
                }
            })
            .setNegativeButton("Later", null)
            .show();
    }

    private void downloadAndInstallApk(String url) {
        Toast.makeText(activity, "Downloading FRIDAY update in background...", Toast.LENGTH_LONG).show();

        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("FRIDAY Assistant Update");
            request.setDescription("Downloading latest build...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "FRIDAY-Assistant-Latest.apk");

            final DownloadManager manager = (DownloadManager) activity.getSystemService(Context.DOWNLOAD_SERVICE);
            final long downloadId = manager.enqueue(request);

            BroadcastReceiver onComplete = new BroadcastReceiver() {
                @Override
                public void onReceive(Context ctxt, Intent intent) {
                    long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                    if (downloadId == id) {
                        activity.unregisterReceiver(this);
                        installDownloadedApk();
                    }
                }
            };

            activity.registerReceiver(onComplete, new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        } catch (Exception e) {
            Log.e(TAG, "Download failed, opening browser fallback", e);
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            activity.startActivity(browserIntent);
        }
    }

    private void installDownloadedApk() {
        File file = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "FRIDAY-Assistant-Latest.apk");
        if (file.exists()) {
            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(Uri.fromFile(file), "application/vnd.android.package-archive");
            installIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            try {
                activity.startActivity(installIntent);
            } catch (Exception e) {
                Toast.makeText(activity, "Tap on downloaded file in Downloads to install.", Toast.LENGTH_LONG).show();
            }
        }
    }
}
