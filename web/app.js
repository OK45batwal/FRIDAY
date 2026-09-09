// ==========================================================================
// FRIDAY — Local AI Assistant (Frontend Controller v2.0)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // DOM Navigation & Views
  const navItems = document.querySelectorAll(".nav-item");
  const viewPanels = document.querySelectorAll(".view-panel");

  // Status Indicator
  const statusPill = document.getElementById("status-pill");
  const statusLabel = document.getElementById("status-label");

  // Mini Hardware Footer
  const miniBatt = document.getElementById("mini-batt");
  const miniRam = document.getElementById("mini-ram");
  const miniDisk = document.getElementById("mini-disk");

  // Conversations Elements
  const btnNewChat = document.getElementById("btn-new-chat");
  const convList = document.getElementById("conversations-list");
  const convCountBadge = document.getElementById("conv-count-badge");
  const activeChatTitle = document.getElementById("active-chat-title");
  const activeModelBadge = document.getElementById("active-model-badge");
  const btnRenameChat = document.getElementById("btn-rename-chat");
  const btnDeleteChat = document.getElementById("btn-delete-chat");

  // Chat Elements
  const chatStreamArea = document.getElementById("chat-stream-area");
  const chatWelcomeCard = document.getElementById("chat-welcome-card");
  const chatInput = document.getElementById("chat-input");
  const btnSendMessage = document.getElementById("btn-send-message");
  const btnVoiceInput = document.getElementById("btn-voice-input");
  const toolActivityStrip = document.getElementById("chat-tool-activity");
  const toolActivityLabel = document.getElementById("chat-tool-activity-label");

  // Voice Mode Elements
  const btnExitVoice = document.getElementById("btn-exit-voice");
  const centralVoiceOrb = document.getElementById("central-voice-orb");
  const voiceStateBanner = document.getElementById("voice-state-banner");
  const voiceOrbIcon = document.getElementById("voice-orb-icon");
  const voiceTranscriptContent = document.getElementById("voice-transcript-content");

  // Dashboard Elements
  const btnRefreshDash = document.getElementById("btn-refresh-dash");
  const dashLlmStatus = document.getElementById("dash-llm-status");
  const dashLlmModel = document.getElementById("dash-llm-model");
  const dashMemCount = document.getElementById("dash-mem-count");
  const dashStatMessages = document.getElementById("dash-stat-messages");
  const dashStatTools = document.getElementById("dash-stat-tools");
  const dashStatMemories = document.getElementById("dash-stat-memories");
  const dashHwBatt = document.getElementById("dash-hw-batt");
  const dashHwBattStatus = document.getElementById("dash-hw-batt-status");
  const dashHwRam = document.getElementById("dash-hw-ram");
  const dashHwArch = document.getElementById("dash-hw-arch");
  const dashHwDisk = document.getElementById("dash-hw-disk");

  // Expo Demo Elements
  const insIntent = document.getElementById("ins-intent");
  const insTool = document.getElementById("ins-tool");
  const insArgs = document.getElementById("ins-args");
  const insTime = document.getElementById("ins-time");
  const insRawOutput = document.getElementById("ins-raw-output");

  // Settings Elements
  const setModel = document.getElementById("set-model");
  const setTemp = document.getElementById("set-temp");
  const setTempVal = document.getElementById("set-temp-val");
  const setMaxTokens = document.getElementById("set-max-tokens");
  const setTokensVal = document.getElementById("set-tokens-val");
  const setMemory = document.getElementById("set-memory");
  const setVoice = document.getElementById("set-voice");
  const setVoicePersona = document.getElementById("set-voice-persona");
  const btnTestVoice = document.getElementById("btn-test-voice");
  const voiceTestFeedback = document.getElementById("voice-test-feedback");
  const btnSaveSettings = document.getElementById("btn-save-settings");
  const settingsSavedFeedback = document.getElementById("settings-saved-feedback");

  // State
  let currentConversationId = null;
  let isGenerating = false;
  let isListening = false;
  let speechRecognition = null;
  let ws = null;

  // ==========================================================================
  // 0. Neo-Brutalist Theme Controller (Dark & Light)
  // ==========================================================================
  const btnThemeToggle = document.getElementById("btn-theme-toggle");
  const btnThemeToggleTop = document.getElementById("btn-theme-toggle-top");

  function applyTheme(theme) {
    document.body.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("friday_theme", theme);

    const isDark = theme === "dark";
    const sunSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
    const moonSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    const iconHtml = isDark ? moonSvg : sunSvg;
    const label = isDark ? "DARK" : "LIGHT";

    if (btnThemeToggle) {
      const iconEl = btnThemeToggle.querySelector(".theme-icon");
      const labelEl = btnThemeToggle.querySelector(".theme-label");
      if (iconEl) iconEl.innerHTML = iconHtml;
      if (labelEl) labelEl.textContent = label;
    }
    if (btnThemeToggleTop) {
      const iconEl = btnThemeToggleTop.querySelector(".theme-icon");
      const labelEl = btnThemeToggleTop.querySelector(".theme-label");
      if (iconEl) iconEl.innerHTML = iconHtml;
      if (labelEl) labelEl.textContent = label;
    }
  }

  function toggleTheme() {
    const currentTheme = document.body.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
  }

  const initialTheme = localStorage.getItem("friday_theme") || "dark";
  applyTheme(initialTheme);

  if (btnThemeToggle) btnThemeToggle.addEventListener("click", toggleTheme);
  if (btnThemeToggleTop) btnThemeToggleTop.addEventListener("click", toggleTheme);

  // ==========================================================================
  // 1. Navigation & View Switching
  // ==========================================================================
  function switchView(viewName) {
    navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
    });
    viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === `view-${viewName}`);
    });

    if (viewName === "dashboard") loadDashboardData();
    if (viewName === "settings") loadSettings();
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      if (view) switchView(view);
    });
  });

  // Back to Chat buttons across all panels
  document.querySelectorAll(".btn-back-chat").forEach((btn) => {
    btn.addEventListener("click", () => {
      switchView("chat");
      chatInput.focus();
    });
  });

  btnExitVoice.addEventListener("click", () => switchView("chat"));

  // Universal Keyboard Shortcuts (⌘1..5, ⌘K, Escape)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      switchView("chat");
      chatInput.focus();
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "1") { e.preventDefault(); switchView("chat"); }
      else if (e.key === "2") { e.preventDefault(); switchView("voice"); }
      else if (e.key === "3") { e.preventDefault(); switchView("dashboard"); }
      else if (e.key === "4") { e.preventDefault(); switchView("expo"); }
      else if (e.key === "5") { e.preventDefault(); switchView("settings"); }
      else if (e.key.toLowerCase() === "k") {
        e.preventDefault();
        btnNewChat.click();
      }
    }
  });

  // ==========================================================================
  // 2. State & Indicator Manager
  // ==========================================================================
  function setAssistantState(state) {
    // states: ONLINE, LISTENING, THINKING, USING_TOOL, SPEAKING, ERROR
    const normalized = state.toUpperCase().replace(" ", "_");
    statusPill.className = `status-indicator ${normalized.toLowerCase()}`;
    statusLabel.textContent = normalized.replace("_", " ");

    if (centralVoiceOrb) {
      centralVoiceOrb.className = `central-voice-orb ${normalized.toLowerCase()}`;
      voiceStateBanner.textContent = `${normalized.replace("_", " ")}...`;
      if (normalized === "LISTENING") {
        voiceOrbIcon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`;
      } else if (normalized === "THINKING") {
        voiceOrbIcon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>`;
      } else if (normalized === "SPEAKING") {
        voiceOrbIcon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;
      } else if (normalized === "USING_TOOL") {
        voiceOrbIcon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
      } else {
        voiceOrbIcon.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`;
      }
    }
  }

  // ==========================================================================
  // 3. Health & Telemetry Polling
  // ==========================================================================
  async function loadDashboardData() {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        const sys = data.system || {};
        const act = data.activity || {};

        // Sidebar Mini Stats
        miniBatt.textContent = sys.battery_pct || "100%";
        miniRam.textContent = `${sys.ram_gb || 16}G`;
        miniDisk.textContent = `${sys.disk_free_gb || 600}G`;

        // Dashboard Elements
        dashLlmStatus.textContent = data.llm ? "Connected" : "Disconnected";
        dashLlmModel.textContent = `Model: ${data.system?.arch ? 'Gemma 2 (2.6B)' : 'Local'}`;
        dashMemCount.textContent = `${act.total_memories || 0} Persistent Memories`;

        dashStatMessages.textContent = act.total_messages || 0;
        dashStatTools.textContent = act.total_tool_calls || 0;
        dashStatMemories.textContent = act.total_memories || 0;

        dashHwBatt.textContent = sys.battery_pct || "100%";
        dashHwBattStatus.textContent = sys.battery_status || "AC Power";
        dashHwRam.textContent = `${sys.ram_gb || 16.0} GB`;
        dashHwArch.textContent = `${sys.arch || 'Apple Silicon'} (${sys.os ? sys.os.split('-')[0] : 'macOS'})`;
        dashHwDisk.textContent = `${sys.disk_free_gb || 600} GB`;
      }
    } catch (e) {
      console.warn("Could not load health metrics:", e);
    }
  }

  // ==========================================================================
  // 4. Conversation History Management
  // ==========================================================================
  let cachedConversations = [];
  const convSearchInput = document.getElementById("conv-search-input");
  const btnQuickNewConv = document.getElementById("btn-quick-new-conv");

  if (btnQuickNewConv) {
    btnQuickNewConv.addEventListener("click", createNewConversation);
  }

  if (convSearchInput) {
    convSearchInput.addEventListener("input", (e) => {
      renderConversationsList(e.target.value.trim().toLowerCase());
    });
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "";
      const now = new Date();
      const diffMs = now - date;
      const diffMin = Math.floor(diffMs / 60000);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  }

  async function loadConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        cachedConversations = await res.json();
        convCountBadge.textContent = cachedConversations.length;
        const query = convSearchInput ? convSearchInput.value.trim().toLowerCase() : "";
        renderConversationsList(query);
      }
    } catch (e) {
      console.warn("Failed to load conversations:", e);
    }
  }

  function renderConversationsList(filterQuery = "") {
    convList.innerHTML = "";

    const filtered = filterQuery
      ? cachedConversations.filter((c) => (c.title || "").toLowerCase().includes(filterQuery))
      : cachedConversations;

    if (cachedConversations.length === 0) {
      convList.innerHTML = `
        <div class="conv-empty-state">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>No saved sessions</span>
          <button class="btn-start-chat-hint" type="button">Start a chat <kbd>⌘K</kbd></button>
        </div>
      `;
      const hintBtn = convList.querySelector(".btn-start-chat-hint");
      if (hintBtn) hintBtn.addEventListener("click", createNewConversation);
      return;
    }

    if (filtered.length === 0) {
      convList.innerHTML = `
        <div class="conv-empty-state">
          <span style="font-size:0.75rem;">No chats matching "${escapeHtml(filterQuery)}"</span>
        </div>
      `;
      return;
    }

    filtered.forEach((conv) => {
      const item = document.createElement("div");
      const isActive = conv.id === currentConversationId;
      item.className = `conv-item ${isActive ? "active" : ""}`;
      item.setAttribute("data-id", conv.id);

      const timeText = formatRelativeTime(conv.updated_at || conv.created_at);

      item.innerHTML = `
        <div class="conv-item-main">
          <span class="conv-item-icon">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </span>
          <div class="conv-item-meta">
            <span class="conv-title-text" title="${escapeHtml(conv.title)}">${escapeHtml(conv.title)}</span>
            ${timeText ? `<span class="conv-time-text">${timeText}</span>` : ""}
          </div>
        </div>
        <div class="conv-item-actions">
          <button class="btn-conv-action btn-conv-rename" title="Rename conversation" type="button">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button class="btn-conv-action btn-conv-delete" title="Delete conversation" type="button">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      item.querySelector(".conv-item-main").addEventListener("click", () => {
        selectConversation(conv.id, conv.title);
      });

      const renameBtn = item.querySelector(".btn-conv-rename");
      renameBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const newTitle = prompt("Enter new title for this chat:", conv.title);
        if (newTitle && newTitle.trim()) {
          try {
            await fetch(`/api/conversations/${conv.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: newTitle.trim() }),
            });
            if (conv.id === currentConversationId) {
              activeChatTitle.textContent = newTitle.trim();
            }
            await loadConversations();
          } catch (err) {
            console.error("Rename failed:", err);
          }
        }
      });

      const deleteBtn = item.querySelector(".btn-conv-delete");
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${conv.title}"?`)) {
          try {
            await fetch(`/api/conversations/${conv.id}`, { method: "DELETE" });
            if (conv.id === currentConversationId) {
              currentConversationId = null;
              activeChatTitle.textContent = "New Conversation";
              chatStreamArea.innerHTML = "";
            }
            await loadConversations();
          } catch (err) {
            console.error("Delete failed:", err);
          }
        }
      });

      convList.appendChild(item);
    });
  }

  async function selectConversation(convId, title) {
    currentConversationId = convId;
    activeChatTitle.textContent = title || "Conversation";

    // Mark active in sidebar
    document.querySelectorAll(".conv-item").forEach((el) => {
      el.classList.toggle("active", el.getAttribute("data-id") === convId);
    });

    // Switch view to chat if we're on another tab
    switchView("chat");

    // Fetch messages
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        renderConversationMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to load conversation messages:", e);
    }
  }

  function renderConversationMessages(messages) {
    if (chatWelcomeCard) chatWelcomeCard.remove();
    chatStreamArea.innerHTML = "";

    if (messages.length === 0) {
      chatStreamArea.innerHTML = `<div class="welcome-hero-card glass-panel"><h2>Conversation Started</h2><p class="hero-description">Ask FRIDAY anything to begin.</p></div>`;
      return;
    }

    messages.forEach((msg) => {
      if (msg.role === "user") {
        appendUserMessage(msg.content);
      } else if (msg.role === "assistant") {
        const assistantElem = createAssistantMessage();
        const textElem = assistantElem.querySelector(".msg-body");
        textElem.innerHTML = renderMarkdown(msg.content);
      }
    });

    chatStreamArea.scrollTop = chatStreamArea.scrollHeight;
  }

  async function createNewConversation() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (res.ok) {
        const conv = await res.json();
        currentConversationId = conv.id;
        activeChatTitle.textContent = conv.title;
        chatStreamArea.innerHTML = "";
        switchView("chat");
        await loadConversations();
        chatInput.focus();
      }
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
  }

  btnNewChat.addEventListener("click", createNewConversation);

  btnRenameChat.addEventListener("click", async () => {
    if (!currentConversationId) return;
    const newTitle = prompt("Enter new title for this session:", activeChatTitle.textContent);
    if (newTitle && newTitle.trim()) {
      try {
        await fetch(`/api/conversations/${currentConversationId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTitle.trim() }),
        });
        activeChatTitle.textContent = newTitle.trim();
        await loadConversations();
      } catch (e) {
        console.error("Rename failed:", e);
      }
    }
  });

  btnDeleteChat.addEventListener("click", async () => {
    if (!currentConversationId) return;
    if (confirm("Delete this conversation session?")) {
      try {
        await fetch(`/api/conversations/${currentConversationId}`, { method: "DELETE" });
        currentConversationId = null;
        activeChatTitle.textContent = "New Conversation";
        chatStreamArea.innerHTML = "";
        await loadConversations();
      } catch (e) {
        console.error("Delete failed:", e);
      }
    }
  });

  // ==========================================================================
  // 5. Chat UI Streaming & Event Handling
  // ==========================================================================
  function appendUserMessage(text) {
    if (chatWelcomeCard) chatWelcomeCard.remove();

    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg user";
    msgDiv.innerHTML = `
      <div class="msg-avatar" title="You">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div class="msg-body">
        <p>${escapeHtml(text)}</p>
      </div>
    `;
    chatStreamArea.appendChild(msgDiv);
    chatStreamArea.scrollTop = chatStreamArea.scrollHeight;
  }

  function createAssistantMessage() {
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg assistant";
    msgDiv.innerHTML = `
      <div class="msg-avatar" title="FRIDAY">
        <svg width="16" height="16" viewBox="0 0 48 48" fill="none"><path d="M14 10H34C34.55 10 35 10.45 35 11V15C35 15.55 34.55 16 34 16H20V21H30C30.55 21 31 21.45 31 22V26C31 26.55 30.55 27 30 27H20V37C20 37.55 19.55 38 19 38H15C14.45 38 14 37.55 14 37V10Z" fill="currentColor"/><circle cx="34" cy="35" r="3.5" fill="currentColor"/></svg>
      </div>
      <div class="msg-body-wrapper">
        <div class="tool-slot"></div>
        <div class="msg-body">
          <span class="live-tokens"></span>
          <span class="cursor-blink"></span>
        </div>
        <div class="msg-meta-row">
          <span class="assistant-tag">FRIDAY • Gemma 2B</span>
          <button class="btn-msg-copy" title="Copy response">Copy</button>
          <span>• ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `;

    const copyBtn = msgDiv.querySelector(".btn-msg-copy");
    copyBtn.addEventListener("click", async () => {
      const text = msgDiv.querySelector(".msg-body").innerText;
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = "Copy"; }, 2000);
      } catch (e) {}
    });

    chatStreamArea.appendChild(msgDiv);
    chatStreamArea.scrollTop = chatStreamArea.scrollHeight;
    return msgDiv;
  }

  function createToolAccordion(slotElem, toolName, args) {
    const acc = document.createElement("div");
    acc.className = "tool-accordion";
    acc.innerHTML = `
      <div class="tool-accordion-header">
        <span class="tool-badge-wrap">
          <span class="tool-badge">${escapeHtml(toolName.toUpperCase())}</span>
          <span class="tool-acc-param">${escapeHtml(JSON.stringify(args || {}))}</span>
        </span>
        <span class="tool-acc-chevron">▼</span>
      </div>
      <div class="tool-accordion-body">Executing tool observation...</div>
    `;

    acc.querySelector(".tool-accordion-header").addEventListener("click", () => {
      acc.classList.toggle("expanded");
    });

    slotElem.appendChild(acc);
    chatStreamArea.scrollTop = chatStreamArea.scrollHeight;
    return acc;
  }

  async function sendMessage(promptText) {
    if (!promptText || isGenerating) return;

    isGenerating = true;
    btnSendMessage.disabled = true;
    appendUserMessage(promptText);
    chatInput.value = "";
    adjustTextareaHeight(chatInput);

    setAssistantState("THINKING");

    const assistantElem = createAssistantMessage();
    const toolSlot = assistantElem.querySelector(".tool-slot");
    const tokenSpan = assistantElem.querySelector(".live-tokens");
    const cursor = assistantElem.querySelector(".cursor-blink");

    let activeAccordion = null;
    let accumulatedText = "";
    let tStart = Date.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const rawJson = line.replace("data: ", "").trim();
            if (!rawJson) continue;

            try {
              const ev = JSON.parse(rawJson);

              if (ev.type === "conversation_created") {
                currentConversationId = ev.conversation_id;
                await loadConversations();

              } else if (ev.type === "assistant_state") {
                setAssistantState(ev.state);

              } else if (ev.type === "intent_detected") {
                insIntent.textContent = ev.intent;

              } else if (ev.type === "tool_started") {
                toolActivityLabel.textContent = `Using tool: ${ev.tool}...`;
                toolActivityStrip.classList.remove("hidden");
                activeAccordion = createToolAccordion(toolSlot, ev.tool, ev.arguments);

                // Update Expo Inspector
                insTool.textContent = ev.tool;
                insArgs.textContent = JSON.stringify(ev.arguments || {});

              } else if (ev.type === "tool_completed") {
                toolActivityStrip.classList.add("hidden");
                if (activeAccordion) {
                  const body = activeAccordion.querySelector(".tool-accordion-body");
                  body.textContent = ev.result || "Complete.";
                }
                // Update Expo Inspector
                insRawOutput.textContent = ev.result || "Complete.";

              } else if (ev.type === "assistant_token") {
                accumulatedText += ev.content;
                tokenSpan.innerHTML = renderMarkdown(accumulatedText);
                chatStreamArea.scrollTop = chatStreamArea.scrollHeight;

              } else if (ev.type === "assistant_finished") {
                insTime.textContent = `${ev.duration || ((Date.now() - tStart)/1000).toFixed(2)}s`;
                setAssistantState("ONLINE");

                // Speak aloud if voice enabled
                if (setVoice.checked && accumulatedText) {
                  speakText(accumulatedText);
                }

              } else if (ev.type === "error") {
                tokenSpan.innerHTML += `<p style="color:#ef4444;">[Error: ${escapeHtml(ev.message)}]</p>`;
                setAssistantState("ERROR");
              }
            } catch (jsonErr) {
              console.warn("Parse chunk error:", jsonErr);
            }
          }
        }
      }

    } catch (err) {
      console.error("Chat generation failed:", err);
      tokenSpan.innerHTML += `<p style="color:#ef4444;">[Failed to communicate with FRIDAY: ${escapeHtml(err.message)}]</p>`;
      setAssistantState("ERROR");
    } finally {
      if (cursor) cursor.remove();
      toolActivityStrip.classList.add("hidden");
      isGenerating = false;
      btnSendMessage.disabled = false;
      setAssistantState("ONLINE");
      chatInput.focus();
      loadDashboardData();
    }
  }

  btnSendMessage.addEventListener("click", () => {
    const text = chatInput.value.trim();
    if (text) sendMessage(text);
  });

  chatInput.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (text) sendMessage(text);
    }
  });

  chatInput.addEventListener("input", () => adjustTextareaHeight(chatInput));

  function adjustTextareaHeight(el) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  // Quick chips click
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".quick-chip");
    if (chip) {
      const text = chip.getAttribute("data-text");
      if (text) sendMessage(text);
    }
  });

  // Global Shortcuts
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      createNewConversation();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "/") {
      e.preventDefault();
      chatInput.focus();
    }
  });

  // ==========================================================================
  // 6. Voice Interaction (Speech-to-Text & Text-to-Speech)
  // ==========================================================================
  function initVoiceRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn("Web Speech API not supported in this browser.");
      return null;
    }
    const rec = new SpeechRec();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onstart = () => {
      isListening = true;
      btnVoiceInput.classList.add("listening");
      setAssistantState("LISTENING");
    };

    rec.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        // Append to voice feed
        const p = document.createElement("p");
        p.innerHTML = `<strong>You:</strong> ${escapeHtml(transcript)}`;
        voiceTranscriptContent.appendChild(p);

        // Send to assistant
        sendMessage(transcript);
      }
    };

    rec.onerror = (e) => {
      console.warn("Speech recognition error:", e);
      isListening = false;
      btnVoiceInput.classList.remove("listening");
      setAssistantState("ONLINE");
    };

    rec.onend = () => {
      isListening = false;
      btnVoiceInput.classList.remove("listening");
      setAssistantState("ONLINE");
    };

    return rec;
  }

  speechRecognition = initVoiceRecognition();

  function toggleVoiceInput() {
    if (!speechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Safari or keyboard text.");
      return;
    }
    if (isListening) {
      speechRecognition.stop();
    } else {
      speechRecognition.start();
    }
  }

  btnVoiceInput.addEventListener("click", toggleVoiceInput);
  if (centralVoiceOrb) centralVoiceOrb.addEventListener("click", toggleVoiceInput);

  // Hold Space to talk in voice mode
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && document.getElementById("view-voice").classList.contains("active")) {
      if (!isListening && document.activeElement !== chatInput) {
        e.preventDefault();
        toggleVoiceInput();
      }
    }
  });

  let currentAudio = null;

  async function speakText(text) {
    // 1. Stop any currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const cleanSpeech = text
      .replace(/```[\s\S]*?```/g, " code omitted ")
      .replace(/[*_#`~]/g, "")
      .trim();

    if (!cleanSpeech) return;

    // 2. High-Fidelity Free Neural TTS (/api/voice/tts)
    try {
      setAssistantState("SPEAKING");
      const selectedVoice = (setVoicePersona ? setVoicePersona.value : null) || localStorage.getItem("friday_voice") || "aria";

      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanSpeech,
          voice: selectedVoice,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        currentAudio = new Audio(audioUrl);
        currentAudio.onended = () => {
          setAssistantState("ONLINE");
          URL.revokeObjectURL(audioUrl);
          currentAudio = null;
        };
        currentAudio.onerror = () => {
          fallbackBrowserSpeech(cleanSpeech);
        };
        await currentAudio.play();
        return;
      }
    } catch (e) {
      console.warn("Neural TTS request failed, falling back to browser speech:", e);
    }

    // 3. Fallback: Browser Web Speech API
    fallbackBrowserSpeech(cleanSpeech);
  }

  function fallbackBrowserSpeech(text) {
    if (!window.speechSynthesis) {
      setAssistantState("ONLINE");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 300));
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setAssistantState("SPEAKING");
    utterance.onend = () => setAssistantState("ONLINE");
    utterance.onerror = () => setAssistantState("ONLINE");
    window.speechSynthesis.speak(utterance);
  }

  // ==========================================================================
  // 7. Expo Demo Mode Scenarios
  // ==========================================================================
  document.querySelectorAll(".demo-card").forEach((card) => {
    card.addEventListener("click", () => {
      const demoNum = card.getAttribute("data-demo");
      runDemoScenario(demoNum);
    });
  });

  const btnAutoplayExpo = document.getElementById("btn-autoplay-expo");
  if (btnAutoplayExpo) {
    btnAutoplayExpo.addEventListener("click", async () => {
      if (isGenerating) return;
      btnAutoplayExpo.disabled = true;
      btnAutoplayExpo.innerHTML = `<span>⏳ Running Expo Demo Sequence...</span>`;
      switchView("chat");

      const demoPrompts = [
        "Hello FRIDAY. Introduce yourself and describe your system architecture.",
        "Calculate 125 * 48 and check my system hardware status.",
        "Remember that my project is called FRIDAY and I am presenting it at the college project expo.",
        "What is the name of my project and where am I presenting it?"
      ];

      for (let i = 0; i < demoPrompts.length; i++) {
        await sendMessage(demoPrompts[i]);
        // Wait 2.5 seconds between demos for viewing results
        await new Promise((r) => setTimeout(r, 2500));
      }

      btnAutoplayExpo.disabled = false;
      btnAutoplayExpo.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        <span>Auto-Run Full Demo (1 &rarr; 4)</span>
      `;
    });
  }

  async function runDemoScenario(num) {
    switch (num) {
      case "1": // Normal Conversation
        switchView("chat");
        sendMessage("Hello FRIDAY. Introduce yourself and describe your architecture.");
        break;
      case "2": // Reasoning
        switchView("chat");
        sendMessage("Explain how modern transformers and neural networks work under the hood.");
        break;
      case "3": // Live Tool
        switchView("chat");
        sendMessage("Calculate 125 * 48 and check my current time.");
        break;
      case "4": // Memory
        switchView("chat");
        sendMessage("Remember that my project is called FRIDAY and I am presenting it at the college project expo.");
        break;
      case "5": // Voice
        switchView("voice");
        toggleVoiceInput();
        break;
    }
  }

  // ==========================================================================
  // 8. Settings Management
  // ==========================================================================
  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const s = await res.json();
        setTemp.value = s.temperature;
        setTempVal.textContent = parseFloat(s.temperature).toFixed(2);
        setMaxTokens.value = s.max_tokens;
        setTokensVal.textContent = s.max_tokens;
        setMemory.checked = s.enable_memory;
        setVoice.checked = s.enable_voice;
      }
    } catch (e) {}

    // Load saved voice persona
    if (setVoicePersona) {
      const savedPersona = localStorage.getItem("friday_voice") || "aria";
      setVoicePersona.value = savedPersona;
    }
  }

  if (setVoicePersona) {
    setVoicePersona.addEventListener("change", () => {
      localStorage.setItem("friday_voice", setVoicePersona.value);
    });
  }

  if (btnTestVoice) {
    btnTestVoice.addEventListener("click", async () => {
      btnTestVoice.disabled = true;
      if (voiceTestFeedback) voiceTestFeedback.textContent = "Synthesizing...";
      try {
        await speakText("All systems online. FRIDAY neural voice synthesizer is functioning at peak efficiency.");
        if (voiceTestFeedback) {
          voiceTestFeedback.textContent = "Voice active";
          setTimeout(() => { if (voiceTestFeedback) voiceTestFeedback.textContent = ""; }, 3000);
        }
      } catch (err) {
        if (voiceTestFeedback) voiceTestFeedback.textContent = "Test failed";
      } finally {
        btnTestVoice.disabled = false;
      }
    });
  }

  setTemp.addEventListener("input", (e) => setTempVal.textContent = parseFloat(e.target.value).toFixed(2));
  setMaxTokens.addEventListener("input", (e) => setTokensVal.textContent = e.target.value);

  btnSaveSettings.addEventListener("click", async () => {
    try {
      if (setVoicePersona) {
        localStorage.setItem("friday_voice", setVoicePersona.value);
      }
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: parseFloat(setTemp.value),
          max_tokens: parseInt(setMaxTokens.value, 10),
          enable_memory: setMemory.checked,
          enable_voice: setVoice.checked,
        }),
      });
      settingsSavedFeedback.classList.remove("hidden");
      setTimeout(() => settingsSavedFeedback.classList.add("hidden"), 2500);
    } catch (e) {
      console.error("Save settings error:", e);
    }
  });

  btnRefreshDash.addEventListener("click", loadDashboardData);

  // ==========================================================================
  // 9. Markdown Parser Utility
  // ==========================================================================
  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderMarkdown(md) {
    if (!md) return "";
    let html = escapeHtml(md);

    // Code blocks ```code```
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    // Inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // URLs
    html = html.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">↗ $1</a>');
    // Bullet lines: * text or - text
    html = html.replace(/(?:^|\n)[*-]\s+(.+)/g, '<br>&bull; $1');
    // Newlines to <br>
    html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    return html;
  }

  // Initial Boot
  loadConversations();
  loadDashboardData();
  setInterval(loadDashboardData, 12000); // 12s hardware gauge refresh
  setAssistantState("ONLINE");
});
