package com.friday.assistant.ai;

import android.util.Log;
import com.friday.assistant.actions.DeviceActionManager;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AssistantAIService {
    private static final String TAG = "AssistantAIService";
    private final DeviceActionManager actionManager;

    public AssistantAIService(DeviceActionManager actionManager) {
        this.actionManager = actionManager;
    }

    public String processUserQuery(String query, String screenContext) {
        String lower = query.toLowerCase().trim();

        // 1. Instant Intent Execution (<5ms)
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
        if (lower.startsWith("call ") || lower.contains("dial ")) {
            String target = query.replaceFirst("(?i)call ", "").replaceFirst("(?i)dial ", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("number", target);
            return actionManager.executeIntent("call", p);
        }
        if (lower.startsWith("open ") || lower.startsWith("launch ")) {
            String app = query.replaceFirst("(?i)open ", "").replaceFirst("(?i)launch ", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("app_name", app);
            return actionManager.executeIntent("open_app", p);
        }
        if (lower.contains("search for") || lower.startsWith("google ")) {
            String q = query.replaceFirst("(?i).*search for ", "").replaceFirst("(?i)google ", "").trim();
            Map<String, String> p = new HashMap<>();
            p.put("query", q);
            return actionManager.executeIntent("web_search", p);
        }

        // 2. Screen Reading Context Query
        if (screenContext != null && !screenContext.trim().isEmpty() && (lower.contains("summarize") || lower.contains("what is on my screen") || lower.contains("read this"))) {
            return "Screen context: " + (screenContext.length() > 300 ? screenContext.substring(0, 300) + "..." : screenContext);
        }

        return "I am FRIDAY, your high-performance AI Operating Assistant. I processed your request: \"" + query + "\". Systems are operational.";
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
}
