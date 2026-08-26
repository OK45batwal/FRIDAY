package com.friday.assistant.ai;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.BatteryManager;
import android.util.Log;
import com.friday.assistant.actions.DeviceActionManager;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AssistantAIService {
    private static final String TAG = "AssistantAIService";
    private static final String PREFS_NAME = "FRIDAY_PREFS";
    private final Context context;
    private final DeviceActionManager actionManager;

    private static class MessageTurn {
        String user;
        String assistant;
        MessageTurn(String u, String a) { user = u; assistant = a; }
    }
    private final List<MessageTurn> conversationHistory = new ArrayList<>();

    public AssistantAIService(Context context, DeviceActionManager actionManager) {
        this.context = context;
        this.actionManager = actionManager;
    }

    public String processUserQuery(String query, String screenContext) {
        if (query == null || query.trim().isEmpty()) {
            return "I am listening. How can I assist you?";
        }

        String lower = query.toLowerCase().trim();
        StringBuilder responseBuilder = new StringBuilder();

        // 0. Handle Compound Commands ("Turn on flashlight AND set a timer for 5m")
        if (lower.contains(" and ") && (lower.contains("flashlight") || lower.contains("timer") || lower.contains("alarm"))) {
            String[] parts = query.split("(?i)\\s+and\\s+");
            for (String part : parts) {
                String singleRes = handleSingleQuery(part.trim(), screenContext);
                if (responseBuilder.length() > 0) responseBuilder.append("\n");
                responseBuilder.append(singleRes);
            }
            String finalCompound = responseBuilder.toString();
            recordTurn(query, finalCompound);
            return finalCompound;
        }

        String res = handleSingleQuery(query, screenContext);
        recordTurn(query, res);
        return res;
    }

    private void recordTurn(String user, String assistant) {
        conversationHistory.add(new MessageTurn(user, assistant));
        if (conversationHistory.size() > 6) {
            conversationHistory.remove(0);
        }
    }

    private String handleSingleQuery(String query, String screenContext) {
        String lower = query.toLowerCase().trim();

        // 1. HARDWARE & DEVICE CONTROLS
        if (lower.contains("flashlight on") || lower.contains("turn on flashlight") || lower.contains("torch on")) {
            Map<String, String> p = new HashMap<>();
            p.put("state", "on");
            return actionManager.executeIntent("flashlight", p);
        }
        if (lower.contains("flashlight off") || lower.contains("turn off flashlight") || lower.contains("torch off")) {
            Map<String, String> p = new HashMap<>();
            p.put("state", "off");
            return actionManager.executeIntent("flashlight", p);
        }
        if (lower.contains("timer") || lower.contains("set a timer") || lower.contains("set timer")) {
            int seconds = extractSeconds(lower);
            Map<String, String> p = new HashMap<>();
            p.put("seconds", String.valueOf(seconds));
            return actionManager.executeIntent("timer", p);
        }
        if (lower.startsWith("alarm") || lower.contains("wake me up") || lower.contains("set alarm") || lower.contains("set an alarm")) {
            int hour = extractHour(lower);
            int minute = extractMinute(lower);
            Map<String, String> p = new HashMap<>();
            p.put("hour", String.valueOf(hour));
            p.put("minute", String.valueOf(minute));
            p.put("message", "FRIDAY Alarm");
            return actionManager.executeIntent("alarm", p);
        }
        if (lower.startsWith("call ") || lower.contains("dial ")) {
            String target = query.replaceFirst("(?i)call ", "").replaceFirst("(?i)dial ", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("number", target);
            return actionManager.executeIntent("call", p);
        }
        if (lower.startsWith("whatsapp ") || lower.contains("send whatsapp") || lower.contains("whatsapp to")) {
            String target = query.replaceFirst("(?i)whatsapp ", "").replaceFirst("(?i)send whatsapp to ", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("number", target);
            p.put("message", "Hello from FRIDAY");
            return actionManager.executeIntent("whatsapp", p);
        }
        if (lower.startsWith("open ") || lower.startsWith("launch ")) {
            String app = query.replaceFirst("(?i)open ", "").replaceFirst("(?i)launch ", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("app_name", app);
            return actionManager.executeIntent("open_app", p);
        }
        if (lower.contains("search for") || lower.startsWith("google ") || lower.startsWith("search ")) {
            String q = query.replaceFirst("(?i).*search for ", "").replaceFirst("(?i)google ", "").replaceFirst("(?i)search ", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("query", q);
            return actionManager.executeIntent("web_search", p);
        }

        // 2. NOTES & REMINDERS MEMORY
        if (lower.startsWith("remember that") || lower.startsWith("note that") || lower.startsWith("remind me to") || lower.startsWith("save note")) {
            String note = query.replaceFirst("(?i)remember that|note that|remind me to|save note", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("note", note);
            return actionManager.executeIntent("save_reminder", p);
        }
        if (lower.contains("what are my reminders") || lower.contains("show my notes") || lower.contains("get reminders") || lower.equals("reminders")) {
            return actionManager.executeIntent("get_reminders", new HashMap<String, String>());
        }

        // 3. SYSTEM DIAGNOSTICS, BATTERY & OFFLINE INTELLIGENCE
        if (lower.contains("battery") || lower.contains("power level") || lower.contains("battery percentage")) {
            return getBatteryStatus();
        }
        if (lower.contains("what time is it") || lower.equals("time") || lower.contains("current time")) {
            return "The current time is " + new SimpleDateFormat("hh:mm a", Locale.getDefault()).format(new Date()) + ".";
        }
        if (lower.contains("what is today's date") || lower.contains("what day is it") || lower.equals("date")) {
            return "Today is " + new SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.getDefault()).format(new Date()) + ".";
        }
        if (lower.contains("who are you") || lower.contains("what is your name")) {
            return "I am FRIDAY — your personal AI Operating Assistant, inspired by Tony Stark's AI, built for high-performance voice interaction and device automation.";
        }
        if (lower.contains("how are you")) {
            return "All diagnostic parameters, audio visualizers, and neural sub-systems are operating at maximum efficiency, Sir.";
        }
        if (lower.contains("tell me a joke")) {
            String[] jokes = {
                "Why do programmers prefer dark mode? Because light attracts bugs!",
                "There are 10 types of people in the world: those who understand binary, and those who don't.",
                "Why was the JavaScript developer sad? Because they didn't know how to 'null' their feelings.",
                "A SQL query walks into a bar, walks up to two tables and asks: 'Can I join you?'"
            };
            return jokes[(int) (Math.random() * jokes.length)];
        }

        // Fast Math & Unit Conversions (0ms)
        String mathRes = tryEvaluateMath(query);
        if (mathRes != null) return mathRes;

        String unitRes = tryUnitConversion(lower);
        if (unitRes != null) return unitRes;

        // 4. SCREEN CONTEXT REASONING
        if (screenContext != null && !screenContext.trim().isEmpty() && (lower.contains("summarize") || lower.contains("what's on my screen") || lower.contains("read this"))) {
            return "Summary of active screen:\n" + (screenContext.length() > 250 ? screenContext.substring(0, 250) + "..." : screenContext);
        }

        // 5. CLOUD & LOCAL HIGH-INTELLIGENCE LLM (Groq / OpenRouter / Ollama)
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String apiKey = prefs.getString("api_key", "").trim();
        String hostIp = prefs.getString("host_ip", "").trim();

        if (!apiKey.isEmpty()) {
            try {
                return queryCloudLLM(query, apiKey, screenContext);
            } catch (Exception e) {
                Log.e(TAG, "Cloud LLM query failed: " + e.getMessage());
            }
        } else if (!hostIp.isEmpty()) {
            try {
                return queryLocalHostLLM(query, hostIp, screenContext);
            } catch (Exception e) {
                Log.e(TAG, "Host query failed: " + e.getMessage());
            }
        }

        return "I processed your request: \"" + query + "\". Configure a free Groq API key in Settings (⚙️) for deep conversational reasoning, or try commands like 'Turn on flashlight', 'Set timer', or 'Remember that my flight is at 6 PM'.";
    }

    private String getBatteryStatus() {
        IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
        Intent batteryStatus = context.registerReceiver(null, ifilter);
        if (batteryStatus != null) {
            int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
            boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL;
            int batteryPct = (int) ((level / (float) scale) * 100);
            return "Battery is at " + batteryPct + "%" + (isCharging ? " and actively charging." : ".");
        }
        return "Battery diagnostic is operational.";
    }

    private String tryUnitConversion(String text) {
        Matcher m1 = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:celsius|c)\\s*(?:to|in)\\s*(?:fahrenheit|f)").matcher(text);
        if (m1.find()) {
            double c = Double.parseDouble(m1.group(1));
            double f = (c * 9/5) + 32;
            return String.format(Locale.US, "%.1f°C is equal to %.1f°F.", c, f);
        }
        Matcher m2 = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:fahrenheit|f)\\s*(?:to|in)\\s*(?:celsius|c)").matcher(text);
        if (m2.find()) {
            double f = Double.parseDouble(m2.group(1));
            double c = (f - 32) * 5/9;
            return String.format(Locale.US, "%.1f°F is equal to %.1f°C.", f, c);
        }
        Matcher m3 = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:km|kilometers?)\\s*(?:to|in)\\s*(?:miles?)").matcher(text);
        if (m3.find()) {
            double km = Double.parseDouble(m3.group(1));
            double mi = km * 0.621371;
            return String.format(Locale.US, "%.2f km is approximately %.2f miles.", km, mi);
        }
        Matcher m4 = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:miles?)\\s*(?:to|in)\\s*(?:km|kilometers?)").matcher(text);
        if (m4.find()) {
            double mi = Double.parseDouble(m4.group(1));
            double km = mi * 1.60934;
            return String.format(Locale.US, "%.2f miles is approximately %.2f km.", mi, km);
        }
        return null;
    }

    private String queryCloudLLM(String query, String apiKey, String screenContext) throws Exception {
        String endpoint = apiKey.startsWith("gsk_") 
            ? "https://api.groq.com/openai/v1/chat/completions" 
            : "https://openrouter.ai/api/v1/chat/completions";
        
        String model = apiKey.startsWith("gsk_") ? "llama-3.3-70b-versatile" : "meta-llama/llama-3.3-70b-instruct";

        URL url = new URL(endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setRequestProperty("Authorization", "Bearer " + apiKey);
        conn.setConnectTimeout(4000);
        conn.setReadTimeout(8000);
        conn.setDoOutput(true);

        String systemPrompt = "You are FRIDAY — an ultra-intelligent, precise, and articulate AI Operating Assistant. Think step-by-step. Deliver sharp, conversational answers tailored for speech (1-3 clear sentences).";
        if (screenContext != null && !screenContext.isEmpty()) {
            systemPrompt += " Current on-screen context: " + screenContext;
        }

        JSONObject payload = new JSONObject();
        payload.put("model", model);
        payload.put("max_tokens", 180);
        payload.put("temperature", 0.6);

        JSONArray messages = new JSONArray();
        messages.put(new JSONObject().put("role", "system").put("content", systemPrompt));
        for (MessageTurn turn : conversationHistory) {
            messages.put(new JSONObject().put("role", "user").put("content", turn.user));
            messages.put(new JSONObject().put("role", "assistant").put("content", turn.assistant));
        }
        messages.put(new JSONObject().put("role", "user").put("content", query));
        payload.put("messages", messages);

        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
        writer.write(payload.toString());
        writer.flush();

        if (conn.getResponseCode() == 200) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();

            JSONObject res = new JSONObject(sb.toString());
            return res.getJSONArray("choices")
                      .getJSONObject(0)
                      .getJSONObject("message")
                      .getString("content")
                      .trim();
        }
        throw new Exception("HTTP Error: " + conn.getResponseCode());
    }

    private String queryLocalHostLLM(String query, String hostIp, String screenContext) throws Exception {
        String fullUrl = hostIp.startsWith("http") ? hostIp : "http://" + hostIp;
        if (!fullUrl.contains("/api")) fullUrl += "/api/chat";

        URL url = new URL(fullUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setConnectTimeout(3000);
        conn.setReadTimeout(6000);
        conn.setDoOutput(true);

        JSONObject payload = new JSONObject();
        payload.put("query", query);
        if (screenContext != null) payload.put("screen_context", screenContext);

        OutputStreamWriter writer = new OutputStreamWriter(conn.getOutputStream());
        writer.write(payload.toString());
        writer.flush();

        if (conn.getResponseCode() == 200) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
            reader.close();
            JSONObject res = new JSONObject(sb.toString());
            return res.optString("response", "Command executed.");
        }
        throw new Exception("Local HTTP Error: " + conn.getResponseCode());
    }

    private String tryEvaluateMath(String text) {
        String clean = text.replaceAll("(?i)what is|calculate|solve|equals|equal to|\\?", "").trim();
        Matcher m = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*([\\+\\-\\*/xX\\^])\\s*(\\d+(?:\\.\\d+)?)").matcher(clean);
        if (m.find()) {
            try {
                double a = Double.parseDouble(m.group(1));
                String op = m.group(2);
                double b = Double.parseDouble(m.group(3));
                double res = 0;
                if (op.equals("+")) res = a + b;
                else if (op.equals("-")) res = a - b;
                else if (op.equals("*") || op.equalsIgnoreCase("x")) res = a * b;
                else if (op.equals("/")) res = b != 0 ? a / b : 0;
                else if (op.equals("^")) res = Math.pow(a, b);

                String formatted = (res == (long) res) ? String.format(Locale.US, "%d", (long) res) : String.format(Locale.US, "%.2f", res);
                return clean + " = " + formatted;
            } catch (Exception e) {}
        }
        return null;
    }

    private int extractSeconds(String text) {
        Matcher min = Pattern.compile("(\\d+)\\s*(?:min|minute)").matcher(text);
        if (min.find()) {
            try { return Integer.parseInt(min.group(1)) * 60; } catch (Exception e) {}
        }
        Matcher sec = Pattern.compile("(\\d+)\\s*(?:sec|second)").matcher(text);
        if (sec.find()) {
            try { return Integer.parseInt(sec.group(1)); } catch (Exception e) {}
        }
        return 60;
    }

    private int extractHour(String text) {
        Matcher m = Pattern.compile("(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?", Pattern.CASE_INSENSITIVE).matcher(text);
        if (m.find()) {
            int h = Integer.parseInt(m.group(1));
            String ampm = m.group(3);
            if ("pm".equalsIgnoreCase(ampm) && h < 12) h += 12;
            if ("am".equalsIgnoreCase(ampm) && h == 12) h = 0;
            return h;
        }
        return 7;
    }

    private int extractMinute(String text) {
        Matcher m = Pattern.compile("(\\d{1,2}):(\\d{2})").matcher(text);
        if (m.find()) {
            return Integer.parseInt(m.group(2));
        }
        return 0;
    }
}
