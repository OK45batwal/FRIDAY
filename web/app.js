// ==========================================================================
// FRIDAY — Local AI Assistant (Frontend Controller v2.0)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // App Shell & Layout Elements
  const appLayout = document.getElementById("app-layout");
  const btnSidebarCollapse = document.getElementById("btn-sidebar-collapse");
  const btnSidebarToggleCanvas = document.getElementById("btn-sidebar-toggle-canvas");
  const sidebarBackdrop = document.getElementById("sidebar-backdrop");
  const btnMobDrawerToggle = document.getElementById("btn-mob-drawer-toggle");
  const canvasBreadcrumbView = document.getElementById("canvas-breadcrumb-view");
  const canvasPills = document.querySelectorAll(".canvas-pill");
  const mobNavBtns = document.querySelectorAll(".mob-nav-btn");
  const chatHeaderActions = document.getElementById("chat-header-actions");
  const chipTranslateDraft = document.getElementById("chip-translate-draft");
  const btnTransSendChat = document.getElementById("btn-trans-send-chat");
  const statusPillTop = document.getElementById("status-pill-top");
  const statusLabelTop = document.getElementById("status-label-top");

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
  let lastUserPrompt = "";
  let isGenerating = false;
  let isListening = false;
  let speechRecognition = null;
  let ws = null;

  // Toast notification helper
  function showToast(text, duration = 2400) {
    const existing = document.querySelectorAll(".friday-toast");
    existing.forEach((t) => t.remove());

    const toast = document.createElement("div");
    toast.className = "friday-toast";
    toast.innerHTML = `<span>✦</span><span>${escapeHtml(text)}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(8px)";
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

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

  const initialTheme = localStorage.getItem("friday_theme") || "light";
  applyTheme(initialTheme);

  if (btnThemeToggle) btnThemeToggle.addEventListener("click", toggleTheme);
  if (btnThemeToggleTop) btnThemeToggleTop.addEventListener("click", toggleTheme);

  // ==========================================================================
  // 1. Navigation & View Switching & Layout Control
  // ==========================================================================
  const VIEW_TITLES = {
    chat: "Assistant Chat",
    voice: "Voice Mode",
    translate: "Live Translator",
    tasks: "Email & Tasks",
    dashboard: "System Dashboard",
    settings: "System Settings",
    about: "About Architecture",
  };

  function toggleSidebar(force) {
    if (!appLayout) return;
    const isMobile = window.innerWidth <= 840;
    if (isMobile) {
      const willOpen = typeof force === "boolean" ? force : !appLayout.classList.contains("sidebar-open");
      appLayout.classList.toggle("sidebar-open", willOpen);
    } else {
      const willCollapse = typeof force === "boolean" ? force : !appLayout.classList.contains("sidebar-collapsed");
      appLayout.classList.toggle("sidebar-collapsed", willCollapse);
      try {
        localStorage.setItem("friday_sidebar_collapsed", willCollapse ? "true" : "false");
      } catch (e) {}
    }
  }

  // Restore saved desktop collapse state
  if (appLayout && window.innerWidth > 840) {
    try {
      if (localStorage.getItem("friday_sidebar_collapsed") === "true") {
        appLayout.classList.add("sidebar-collapsed");
      }
    } catch (e) {}
  }

  if (btnSidebarCollapse) btnSidebarCollapse.addEventListener("click", () => toggleSidebar());
  if (btnSidebarToggleCanvas) btnSidebarToggleCanvas.addEventListener("click", () => toggleSidebar());
  if (btnMobDrawerToggle) btnMobDrawerToggle.addEventListener("click", () => toggleSidebar(true));
  if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", () => toggleSidebar(false));

  function switchView(viewName) {
    navItems.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
    });
    canvasPills.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
    });
    mobNavBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === viewName);
    });
    viewPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === `view-${viewName}`);
    });

    if (canvasBreadcrumbView) {
      canvasBreadcrumbView.textContent = VIEW_TITLES[viewName] || viewName.toUpperCase();
    }

    if (chatHeaderActions) {
      chatHeaderActions.style.display = viewName === "chat" ? "flex" : "none";
    }

    document.querySelectorAll(".chat-only-crumb").forEach((el) => {
      el.style.display = viewName === "chat" ? "inline" : "none";
    });

    if (appLayout && window.innerWidth <= 840) {
      appLayout.classList.remove("sidebar-open");
    }

    if (viewName === "dashboard") loadDashboardData();
    if (viewName === "settings") loadSettings();
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      if (view) switchView(view);
    });
  });

  canvasPills.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      if (view) switchView(view);
    });
  });

  mobNavBtns.forEach((btn) => {
    if (btn.id === "btn-mob-drawer-toggle") return;
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

  // Universal Keyboard Shortcuts (⌘1..6, ⌘B, ⌘K, Escape)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (appLayout && appLayout.classList.contains("sidebar-open")) {
        appLayout.classList.remove("sidebar-open");
        return;
      }
      switchView("chat");
      chatInput.focus();
    }
    if (e.metaKey || e.ctrlKey) {
      if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      else if (e.key === "1") { e.preventDefault(); switchView("chat"); }
      else if (e.key === "2") { e.preventDefault(); switchView("voice"); }
      else if (e.key === "3") { e.preventDefault(); switchView("translate"); }
      else if (e.key === "4") { e.preventDefault(); switchView("tasks"); }
      else if (e.key === "5") { e.preventDefault(); switchView("dashboard"); }
      else if (e.key === "6") { e.preventDefault(); switchView("settings"); }
      else if (e.key.toLowerCase() === "t") { e.preventDefault(); switchView("translate"); }
      else if (e.key.toLowerCase() === "e") { e.preventDefault(); switchView("tasks"); }
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
    if (statusPill) statusPill.className = `status-indicator ${normalized.toLowerCase()}`;
    if (statusLabel) statusLabel.textContent = normalized.replace("_", " ");
    if (statusPillTop) statusPillTop.className = `status-indicator ${normalized.toLowerCase()}`;
    if (statusLabelTop) statusLabelTop.textContent = normalized.replace("_", " ");

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
    const currentModelName = document.getElementById("active-model-name")?.textContent || "GO 1.0";
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
        <div class="msg-translation-card hidden">
          <div class="msg-trans-header">
            <span class="msg-trans-lang-tag">SPANISH</span>
            <div class="msg-trans-actions">
              <button class="btn-msg-trans-speak" title="Listen pronunciation">🔊 Speak</button>
              <button class="btn-msg-trans-copy" title="Copy translation">📋 Copy</button>
              <button class="btn-msg-trans-close" title="Close translation">✕</button>
            </div>
          </div>
          <div class="msg-trans-body"></div>
        </div>
        <div class="msg-meta-row">
          <span class="assistant-tag">${escapeHtml(currentModelName)} • Edge</span>
          <div class="message-actions-bar">
            <button class="msg-action-btn btn-msg-copy" title="Copy response">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <span>Copy</span>
            </button>
            <div class="msg-translate-wrap">
              <button class="msg-action-btn btn-msg-translate" title="Live Translate Response">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>Translate</span>
              </button>
              <div class="msg-translate-dropdown hidden">
                <button data-lang="Spanish">Spanish (Español)</button>
                <button data-lang="French">French (Français)</button>
                <button data-lang="German">German (Deutsch)</button>
                <button data-lang="Hindi">Hindi (हिंदी)</button>
                <button data-lang="Japanese">Japanese (日本語)</button>
                <button data-lang="Chinese">Chinese (Mandarin)</button>
                <button data-lang="Italian">Italian (Italiano)</button>
                <button data-lang="Portuguese">Portuguese (Português)</button>
                <button data-lang="Russian">Russian (Русский)</button>
                <button data-lang="Arabic">Arabic (العربية)</button>
                <button data-lang="Korean">Korean (한국어)</button>
                <button data-lang="English">English</button>
              </div>
            </div>
            <button class="msg-action-btn btn-msg-speak" title="Read Aloud">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
              <span>Speak</span>
            </button>
            <button class="msg-action-btn btn-msg-retry" title="Regenerate">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
              <span>Retry</span>
            </button>
          </div>
          <span>• ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    `;

    const copyBtn = msgDiv.querySelector(".btn-msg-copy");
    copyBtn.addEventListener("click", async () => {
      const text = msgDiv.querySelector(".msg-body").innerText;
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!");
        copyBtn.classList.add("active");
        setTimeout(() => copyBtn.classList.remove("active"), 2000);
      } catch (e) {}
    });

    // In-Chat Translation
    const transWrap = msgDiv.querySelector(".msg-translate-wrap");
    const transBtn = msgDiv.querySelector(".btn-msg-translate");
    const transMenu = msgDiv.querySelector(".msg-translate-dropdown");
    const transCard = msgDiv.querySelector(".msg-translation-card");
    const transLangTag = msgDiv.querySelector(".msg-trans-lang-tag");
    const transBody = msgDiv.querySelector(".msg-trans-body");
    const transSpeakBtn = msgDiv.querySelector(".btn-msg-trans-speak");
    const transCopyBtn = msgDiv.querySelector(".btn-msg-trans-copy");
    const transCloseBtn = msgDiv.querySelector(".btn-msg-trans-close");

    transBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      transMenu.classList.toggle("hidden");
    });

    document.addEventListener("click", (e) => {
      if (!transWrap.contains(e.target)) {
        transMenu.classList.add("hidden");
      }
    });

    transMenu.querySelectorAll("button").forEach((langBtn) => {
      langBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const targetLang = langBtn.getAttribute("data-lang");
        transMenu.classList.add("hidden");

        const text = msgDiv.querySelector(".msg-body").innerText.trim();
        if (!text) return;

        transBtn.classList.add("active");
        transBtn.querySelector("span").textContent = "Translating...";

        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text,
              source_lang: "Auto-Detect",
              target_lang: targetLang,
              style: "Natural / Conversational",
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const translated = data.translated_text || "";

          transLangTag.textContent = `${data.target_lang || targetLang}`;
          transBody.textContent = translated;
          transCard.classList.remove("hidden");
          chatStreamArea.scrollTop = chatStreamArea.scrollHeight;
        } catch (err) {
          showToast(`Translation error: ${err.message}`);
        } finally {
          transBtn.classList.remove("active");
          transBtn.querySelector("span").textContent = "Translate";
        }
      });
    });

    transSpeakBtn.addEventListener("click", () => {
      const text = transBody.textContent;
      if (text && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const langStr = (transLangTag.textContent || "").toLowerCase();
        if (langStr.includes("span")) utterance.lang = "es-ES";
        else if (langStr.includes("fren")) utterance.lang = "fr-FR";
        else if (langStr.includes("germ")) utterance.lang = "de-DE";
        else if (langStr.includes("hin")) utterance.lang = "hi-IN";
        else if (langStr.includes("jap")) utterance.lang = "ja-JP";
        else if (langStr.includes("chin") || langStr.includes("mand")) utterance.lang = "zh-CN";
        else if (langStr.includes("ita")) utterance.lang = "it-IT";
        else if (langStr.includes("port")) utterance.lang = "pt-PT";
        else if (langStr.includes("russ")) utterance.lang = "ru-RU";
        else if (langStr.includes("arab")) utterance.lang = "ar-SA";
        else if (langStr.includes("kore")) utterance.lang = "ko-KR";
        else utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
      }
    });

    transCopyBtn.addEventListener("click", async () => {
      const text = transBody.textContent;
      if (text) {
        await navigator.clipboard.writeText(text);
        showToast("Translation copied!");
      }
    });

    transCloseBtn.addEventListener("click", () => {
      transCard.classList.add("hidden");
    });

    const speakBtn = msgDiv.querySelector(".btn-msg-speak");
    let isSpeaking = false;
    speakBtn.addEventListener("click", async () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        isSpeaking = false;
        speakBtn.classList.remove("active");
        speakBtn.querySelector("span").textContent = "Speak";
      } else {
        const text = msgDiv.querySelector(".msg-body").innerText;
        if (!text) return;
        isSpeaking = true;
        speakBtn.classList.add("active");
        speakBtn.querySelector("span").textContent = "Stop";
        try {
          await speakText(text);
        } finally {
          isSpeaking = false;
          speakBtn.classList.remove("active");
          speakBtn.querySelector("span").textContent = "Speak";
        }
      }
    });

    const retryBtn = msgDiv.querySelector(".btn-msg-retry");
    retryBtn.addEventListener("click", () => {
      if (lastUserPrompt && !isGenerating) {
        sendMessage(lastUserPrompt);
      }
    });

    chatStreamArea.appendChild(msgDiv);
    chatStreamArea.scrollTop = chatStreamArea.scrollHeight;
    return msgDiv;
  }

  function createToolAccordion(slotElem, toolName, args) {
    const acc = document.createElement("div");
    acc.className = "thought-accordion";
    acc.innerHTML = `
      <details class="thought-details" open>
        <summary class="thought-summary">
          <span class="thought-icon">💭</span>
          <span>Tool Execution: <strong>${escapeHtml(toolName.toUpperCase())}</strong></span>
          <span class="thought-badge">${escapeHtml(JSON.stringify(args || {}).slice(0, 32))}</span>
        </summary>
        <div class="thought-body tool-accordion-body">Executing tool observation...</div>
      </details>
    `;

    slotElem.appendChild(acc);
    chatStreamArea.scrollTop = chatStreamArea.scrollHeight;
    return acc;
  }

  async function sendMessage(promptText) {
    if (!promptText || isGenerating) return;

    lastUserPrompt = promptText;
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
                if (insIntent) insIntent.textContent = ev.intent;

              } else if (ev.type === "tool_started") {
                toolActivityLabel.textContent = `Using tool: ${ev.tool}...`;
                toolActivityStrip.classList.remove("hidden");
                activeAccordion = createToolAccordion(toolSlot, ev.tool, ev.arguments);

                if (insTool) insTool.textContent = ev.tool;
                if (insArgs) insArgs.textContent = JSON.stringify(ev.arguments || {});

              } else if (ev.type === "tool_completed") {
                toolActivityStrip.classList.add("hidden");
                if (activeAccordion) {
                  const body = activeAccordion.querySelector(".tool-accordion-body, .thought-body");
                  if (body) {
                    body.textContent = ev.result || "Complete.";
                  }
                }
                if (insRawOutput) insRawOutput.textContent = ev.result || "Complete.";

              } else if (ev.type === "assistant_token") {
                accumulatedText += ev.content;
                tokenSpan.innerHTML = renderMarkdown(accumulatedText);
                chatStreamArea.scrollTop = chatStreamArea.scrollHeight;

              } else if (ev.type === "assistant_finished") {
                if (insTime) insTime.textContent = `${ev.duration || ((Date.now() - tStart)/1000).toFixed(2)}s`;
                setAssistantState("ONLINE");

                // Speak aloud if voice enabled
                if (setVoice?.checked && accumulatedText) {
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (text && !isGenerating) sendMessage(text);
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
  // 8. Settings Management
  // ==========================================================================
  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const s = await res.json();
        if (setModel && s.llm_model) {
          setModel.value = s.llm_model;
        }
        if (activeModelBadge) {
          activeModelBadge.textContent = s.llm_model === "go1.0" ? "GO 1.0 (goo1)" : (s.llm_model || "GO 1.0 (goo1)");
        }
        const activeModelName = document.getElementById("active-model-name");
        if (activeModelName && s.llm_model) {
          activeModelName.textContent = s.llm_model === "go1.0" ? "GO 1.0" : (s.llm_model === "gemma2:2b" ? "Gemma 2" : "Llama 3.2");
        }
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
      const modelVal = setModel ? setModel.value : "go1.0";
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          llm_model: modelVal,
          temperature: parseFloat(setTemp.value),
          max_tokens: parseInt(setMaxTokens.value, 10),
          enable_memory: setMemory.checked,
          enable_voice: setVoice.checked,
        }),
      });
      if (activeModelBadge) {
        activeModelBadge.textContent = modelVal === "go1.0" ? "GO 1.0 (goo1)" : modelVal;
      }
      const activeModelName = document.getElementById("active-model-name");
      if (activeModelName) {
        activeModelName.textContent = modelVal === "go1.0" ? "GO 1.0" : (modelVal === "gemma2:2b" ? "Gemma 2" : "Llama 3.2");
      }
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
    // Clean raw tool call syntax if it ever leaks in stream
    let clean = md
      .replace(/```(?:tool|json)?\s*\{[\s\S]*?"tool"[\s\S]*?\}\s*```/g, "")
      .replace(/\{"tool":\s*"[^"]+".*?\}/g, "")
      .trim();
    if (!clean) return "";

    let html = escapeHtml(clean);

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

  // ==========================================================================
  // 10. GO 1.0 Live Translator Controller
  // ==========================================================================
  function initLiveTranslator() {
    const sourceLang = document.getElementById("trans-source-lang");
    const targetLang = document.getElementById("trans-target-lang");
    const styleSelect = document.getElementById("trans-style-select");
    const autoCheck = document.getElementById("trans-auto-check");
    const sourceInput = document.getElementById("trans-source-input");
    const targetOutput = document.getElementById("trans-target-output");
    const btnSwap = document.getElementById("btn-trans-swap");
    const btnExecute = document.getElementById("btn-trans-execute");
    const btnClear = document.getElementById("btn-trans-clear");
    const btnMic = document.getElementById("btn-trans-mic");
    const btnCopy = document.getElementById("btn-trans-copy");
    const btnSpeak = document.getElementById("btn-trans-speak");
    const detectedBadge = document.getElementById("trans-detected-badge");
    const nuanceCard = document.getElementById("trans-nuance-card");
    const nuanceText = document.getElementById("trans-nuance-text");
    const copyToast = document.getElementById("trans-copy-toast");
    const spinner = document.getElementById("trans-spinner");
    const sourceChars = document.getElementById("trans-source-chars");
    const sourceWords = document.getElementById("trans-source-words");
    const targetChars = document.getElementById("trans-target-chars");
    const targetWords = document.getElementById("trans-target-words");
    const phraseChips = document.querySelectorAll(".phrase-chip");

    if (!sourceInput || !targetOutput) return;

    let autoDebounceTimer = null;
    let isTranslating = false;
    let lastTranslatedText = "";

    function updateSourceStats() {
      const txt = sourceInput.value;
      const chars = txt.length;
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      if (sourceChars) sourceChars.textContent = `${chars} characters`;
      if (sourceWords) sourceWords.textContent = `${words} words`;
    }

    function updateTargetStats(txt) {
      const chars = txt.length;
      const words = txt.trim() ? txt.trim().split(/\s+/).length : 0;
      if (targetChars) targetChars.textContent = `${chars} characters`;
      if (targetWords) targetWords.textContent = `${words} words`;
    }

    async function executeTranslation() {
      const text = sourceInput.value.trim();
      if (!text) {
        targetOutput.innerHTML = '<span class="trans-placeholder">Translation will appear here in real-time...</span>';
        updateTargetStats("");
        if (nuanceCard) nuanceCard.classList.add("hidden");
        return;
      }
      if (text === lastTranslatedText) return;
      if (isTranslating) return;

      isTranslating = true;
      if (spinner) spinner.classList.remove("hidden");
      targetOutput.style.opacity = "0.6";

      try {
        const payload = {
          text: text,
          source_lang: sourceLang ? sourceLang.value : "Auto-Detect",
          target_lang: targetLang ? targetLang.value : "Spanish",
          style: styleSelect ? styleSelect.value : "Natural / Conversational",
        };

        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const translated = data.translated_text || "";
        targetOutput.textContent = translated;
        targetOutput.style.opacity = "1";
        lastTranslatedText = text;
        updateTargetStats(translated);

        if (detectedBadge) {
          if (data.detected_lang && sourceLang.value === "Auto-Detect") {
            detectedBadge.textContent = `Detected: ${data.detected_lang}`;
            detectedBadge.classList.remove("hidden");
          } else {
            detectedBadge.classList.add("hidden");
          }
        }

        if (nuanceCard && nuanceText) {
          if (data.nuance_notes) {
            nuanceText.textContent = data.nuance_notes;
            nuanceCard.classList.remove("hidden");
          } else {
            nuanceCard.classList.add("hidden");
          }
        }
      } catch (err) {
        console.error("Live translation error:", err);
        targetOutput.innerHTML = `<span style="color: var(--status-error);">Translation error: ${escapeHtml(err.message)}</span>`;
        targetOutput.style.opacity = "1";
      } finally {
        isTranslating = false;
        if (spinner) spinner.classList.add("hidden");
      }
    }

    sourceInput.addEventListener("input", () => {
      updateSourceStats();
      if (autoCheck && autoCheck.checked) {
        clearTimeout(autoDebounceTimer);
        const val = sourceInput.value.trim();
        if (val.length >= 3) {
          autoDebounceTimer = setTimeout(executeTranslation, 650);
        }
      }
    });

    sourceInput.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        executeTranslation();
      }
    });

    if (btnExecute) btnExecute.addEventListener("click", executeTranslation);

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        sourceInput.value = "";
        targetOutput.innerHTML = '<span class="trans-placeholder">Translation will appear here in real-time...</span>';
        updateSourceStats();
        updateTargetStats("");
        lastTranslatedText = "";
        if (detectedBadge) detectedBadge.classList.add("hidden");
        if (nuanceCard) nuanceCard.classList.add("hidden");
        sourceInput.focus();
      });
    }

    if (btnSwap) {
      btnSwap.addEventListener("click", () => {
        if (!sourceLang || !targetLang) return;
        const currSrc = sourceLang.value;
        const currTgt = targetLang.value;

        if (currSrc === "Auto-Detect") {
          sourceLang.value = currTgt;
          targetLang.value = "English";
        } else {
          sourceLang.value = currTgt;
          targetLang.value = currSrc;
        }

        const outText = targetOutput.textContent;
        if (outText && !targetOutput.querySelector(".trans-placeholder")) {
          sourceInput.value = outText;
          updateSourceStats();
          executeTranslation();
        }
      });
    }

    if (sourceLang) sourceLang.addEventListener("change", () => { lastTranslatedText = ""; executeTranslation(); });
    if (targetLang) targetLang.addEventListener("change", () => { lastTranslatedText = ""; executeTranslation(); });
    if (styleSelect) styleSelect.addEventListener("change", () => { lastTranslatedText = ""; executeTranslation(); });

    phraseChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const phrase = chip.getAttribute("data-phrase");
        if (phrase) {
          sourceInput.value = phrase;
          updateSourceStats();
          executeTranslation();
        }
      });
    });

    if (btnCopy) {
      btnCopy.addEventListener("click", () => {
        const text = targetOutput.textContent;
        if (text && !targetOutput.querySelector(".trans-placeholder")) {
          navigator.clipboard.writeText(text).then(() => {
            if (copyToast) {
              copyToast.classList.remove("hidden");
              setTimeout(() => copyToast.classList.add("hidden"), 2000);
            }
          });
        }
      });
    }

    if (btnSpeak) {
      btnSpeak.addEventListener("click", () => {
        const text = targetOutput.textContent;
        if (text && !targetOutput.querySelector(".trans-placeholder")) {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            const tgt = targetLang ? targetLang.value.toLowerCase() : "";
            if (tgt.includes("span")) utterance.lang = "es-ES";
            else if (tgt.includes("fren")) utterance.lang = "fr-FR";
            else if (tgt.includes("germ")) utterance.lang = "de-DE";
            else if (tgt.includes("hin")) utterance.lang = "hi-IN";
            else if (tgt.includes("jap")) utterance.lang = "ja-JP";
            else if (tgt.includes("chin") || tgt.includes("mand")) utterance.lang = "zh-CN";
            else if (tgt.includes("ita")) utterance.lang = "it-IT";
            else if (tgt.includes("port")) utterance.lang = "pt-PT";
            else if (tgt.includes("russ")) utterance.lang = "ru-RU";
            else if (tgt.includes("arab")) utterance.lang = "ar-SA";
            else if (tgt.includes("kore")) utterance.lang = "ko-KR";
            else utterance.lang = "en-US";
            utterance.rate = 0.95;
            window.speechSynthesis.speak(utterance);
          }
        }
      });
    }

    if (btnMic) {
      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        let transRec = null;
        let isTransListening = false;
        btnMic.addEventListener("click", () => {
          if (isTransListening && transRec) {
            transRec.stop();
            return;
          }
          transRec = new SpeechRec();
          transRec.continuous = false;
          transRec.interimResults = false;
          transRec.onstart = () => {
            isTransListening = true;
            btnMic.style.color = "var(--status-speaking)";
            btnMic.style.borderColor = "var(--status-speaking)";
          };
          transRec.onresult = (evt) => {
            const transcript = evt.results[0][0].transcript;
            sourceInput.value = (sourceInput.value ? sourceInput.value + " " : "") + transcript;
            updateSourceStats();
            executeTranslation();
          };
          transRec.onend = () => {
            isTransListening = false;
            btnMic.style.color = "";
            btnMic.style.borderColor = "";
          };
          transRec.onerror = () => {
            isTransListening = false;
            btnMic.style.color = "";
            btnMic.style.borderColor = "";
          };
          transRec.start();
        });
      } else {
        btnMic.style.display = "none";
      }
    }

    const btnSendChat = document.getElementById("btn-trans-send-chat");
    if (btnSendChat) {
      btnSendChat.addEventListener("click", () => {
        const text = targetOutput.textContent.trim();
        if (text && !targetOutput.querySelector(".trans-placeholder")) {
          chatInput.value = text;
          adjustTextareaHeight(chatInput);
          switchView("chat");
          chatInput.focus();
          showToast("Translation inserted into chat!");
        } else {
          showToast("Translate some text first!");
        }
      });
    }
  }

  // ==========================================================================
  // 11. GO 1.0 Task Studio Controller (Emails & Analysis)
  // ==========================================================================
  function initTaskStudio() {
    // Sub-tab toggling
    const subtabBtns = document.querySelectorAll(".tasks-subtab-bar .subtab-btn");
    const subtabContents = document.querySelectorAll(".tasks-studio-container .subtab-content");

    subtabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-subtab");
        subtabBtns.forEach((b) => b.classList.toggle("active", b === btn));
        subtabContents.forEach((c) => {
          c.classList.toggle("active", c.id === `subtab-${tab}-content`);
        });
      });
    });

    // --- Email Drafter ---
    const emailRecipient = document.getElementById("email-recipient");
    const emailTone = document.getElementById("email-tone");
    const emailPoints = document.getElementById("email-points");
    const btnGenerateEmail = document.getElementById("btn-generate-email");
    const emailSpinner = document.getElementById("email-spinner");
    const previewSubject = document.getElementById("preview-email-subject");
    const previewTo = document.getElementById("preview-email-to");
    const previewBody = document.getElementById("preview-email-body");
    const btnEmailCopy = document.getElementById("btn-email-copy");
    const btnEmailToChat = document.getElementById("btn-email-to-chat");
    const btnEmailSpeak = document.getElementById("btn-email-speak");
    const presetChips = document.querySelectorAll(".preset-chip");

    let currentEmailDraft = null;

    const presetTemplates = {
      follow_up: {
        recipient: "Alex Chen (Engineering Lead)",
        points: "Thank them for Tuesday's demo of the local AI assistant. Confirm that our performance testing passed with 60 tok/sec on Apple Silicon. Propose a brief 20-minute catch-up on Friday at 3 PM."
      },
      proposal: {
        recipient: "Executive Leadership Team",
        points: "Present our new on-device AI system GO 1.0. Highlight zero cloud API latency, 100% private SQLite memory, and agentic tool-calling capabilities. Request approval to pilot across engineering."
      },
      reschedule: {
        recipient: "Sarah Jenkins",
        points: "Apologize for having to reschedule our sprint retro originally planned for Thursday 2 PM. Propose Friday 10 AM or Monday 11 AM instead as alternatives."
      },
      extension: {
        recipient: "Project Coordinator",
        points: "Request a 3-day extension on milestone 2 deliverables due to unexpected edge-case validation requirements in the neural laboratory. Assure final quality will be exceptional."
      },
      thank_you: {
        recipient: "Hiring Manager / Tech Lead",
        points: "Express gratitude for the technical interview today. Highlight our discussion on local LLMs and how my background in distributed systems and PyTorch aligns with their roadmap."
      }
    };

    presetChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        presetChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const presetKey = chip.getAttribute("data-preset");
        if (presetTemplates[presetKey]) {
          if (emailRecipient) emailRecipient.value = presetTemplates[presetKey].recipient;
          if (emailPoints) emailPoints.value = presetTemplates[presetKey].points;
        }
      });
    });

    async function generateEmail() {
      const recipient = emailRecipient ? emailRecipient.value.trim() : "Colleague";
      const tone = emailTone ? emailTone.value : "Professional";
      const points = emailPoints ? emailPoints.value.trim() : "";

      if (!points) {
        alert("Please enter key points or details for the email.");
        return;
      }

      if (emailSpinner) emailSpinner.classList.remove("hidden");
      if (btnGenerateEmail) btnGenerateEmail.disabled = true;

      try {
        const res = await fetch("/api/tasks/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient,
            tone,
            key_points: points,
            purpose: "custom"
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        currentEmailDraft = data;

        if (previewSubject) previewSubject.textContent = data.subject || "Subject";
        if (previewTo) previewTo.textContent = recipient;
        if (previewBody) {
          previewBody.innerHTML = escapeHtml(data.salutation) + "<br><br>" +
            escapeHtml(data.body).replace(/\n/g, "<br>") + "<br><br>" +
            escapeHtml(data.sign_off).replace(/\n/g, "<br>");
        }
      } catch (err) {
        console.error("Email generation error:", err);
        if (previewBody) previewBody.innerHTML = `<span style="color: var(--status-error);">Generation error: ${escapeHtml(err.message)}</span>`;
      } finally {
        if (emailSpinner) emailSpinner.classList.add("hidden");
        if (btnGenerateEmail) btnGenerateEmail.disabled = false;
      }
    }

    if (btnGenerateEmail) btnGenerateEmail.addEventListener("click", generateEmail);

    if (btnEmailCopy) {
      btnEmailCopy.addEventListener("click", () => {
        if (!currentEmailDraft) return;
        navigator.clipboard.writeText(currentEmailDraft.full_text).then(() => {
          btnEmailCopy.textContent = "✓ Copied!";
          setTimeout(() => { btnEmailCopy.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy Email</span>'; }, 2000);
        });
      });
    }

    if (btnEmailToChat) {
      btnEmailToChat.addEventListener("click", () => {
        if (!currentEmailDraft) return;
        switchView("chat");
        chatInput.value = `Here is the email drafted by GO 1.0:\n\n${currentEmailDraft.full_text}`;
        chatInput.focus();
      });
    }

    if (btnEmailSpeak) {
      btnEmailSpeak.addEventListener("click", () => {
        if (!currentEmailDraft) return;
        speakText(currentEmailDraft.full_text);
      });
    }

    // --- Text Analysis & Polish ---
    const analysisChips = document.querySelectorAll(".analysis-chip");
    const analyzeInput = document.getElementById("analyze-input");
    const analyzeInputStats = document.getElementById("analyze-input-stats");
    const btnRunAnalysis = document.getElementById("btn-run-analysis");
    const analyzeSpinner = document.getElementById("analyze-spinner");
    const analyzeResultDisplay = document.getElementById("analyze-result-display");
    const btnAnalyzeCopy = document.getElementById("btn-analyze-copy");
    const btnAnalyzeSpeak = document.getElementById("btn-analyze-speak");

    let currentAnalysisAction = "summarize";
    let currentAnalysisResult = "";

    analysisChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        analysisChips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        currentAnalysisAction = chip.getAttribute("data-action");
      });
    });

    if (analyzeInput && analyzeInputStats) {
      analyzeInput.addEventListener("input", () => {
        const words = analyzeInput.value.trim() ? analyzeInput.value.trim().split(/\s+/).length : 0;
        analyzeInputStats.textContent = `${words} words`;
      });
    }

    async function runAnalysis() {
      const text = analyzeInput ? analyzeInput.value.trim() : "";
      if (!text) {
        alert("Please paste text to analyze.");
        return;
      }

      if (analyzeSpinner) analyzeSpinner.classList.remove("hidden");
      if (btnRunAnalysis) btnRunAnalysis.disabled = true;

      try {
        const res = await fetch("/api/tasks/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            action: currentAnalysisAction,
            target_tone: "Executive"
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        currentAnalysisResult = data.result || "";

        if (analyzeResultDisplay) {
          analyzeResultDisplay.innerHTML = renderMarkdown(currentAnalysisResult);
        }
      } catch (err) {
        console.error("Text analysis error:", err);
        if (analyzeResultDisplay) {
          analyzeResultDisplay.innerHTML = `<span style="color: var(--status-error);">Analysis error: ${escapeHtml(err.message)}</span>`;
        }
      } finally {
        if (analyzeSpinner) analyzeSpinner.classList.add("hidden");
        if (btnRunAnalysis) btnRunAnalysis.disabled = false;
      }
    }

    if (btnRunAnalysis) btnRunAnalysis.addEventListener("click", runAnalysis);

    if (btnAnalyzeCopy) {
      btnAnalyzeCopy.addEventListener("click", () => {
        if (!currentAnalysisResult) return;
        navigator.clipboard.writeText(currentAnalysisResult).then(() => {
          btnAnalyzeCopy.textContent = "✓ Copied!";
          setTimeout(() => { btnAnalyzeCopy.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span>Copy Output</span>'; }, 2000);
        });
      });
    }

    if (btnAnalyzeSpeak) {
      btnAnalyzeSpeak.addEventListener("click", () => {
        if (currentAnalysisResult) speakText(currentAnalysisResult);
      });
    }
  }

  // ==========================================================================
  // 12. Chat Quick Action Chips Controller
  // ==========================================================================
  function initChatQuickActions() {
    const actionChips = document.querySelectorAll("#chat-quick-actions .action-chip");
    actionChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const task = chip.getAttribute("data-task");
        if (task === "email") {
          switchView("tasks");
        } else if (task === "translate") {
          switchView("translate");
        } else if (task === "summarize") {
          chatInput.value = "Summarize the following text into key bullet points:\n";
          chatInput.focus();
        } else if (task === "grammar") {
          chatInput.value = "Please fix the grammar, polish the tone, and explain any corrections:\n";
          chatInput.focus();
        } else if (task === "system") {
          chatInput.value = "What is my current Mac system status, battery, and RAM?";
          btnSendMessage.click();
        } else if (task === "calc") {
          chatInput.value = "Calculate ";
          chatInput.focus();
        }
      });
    });

    if (chipTranslateDraft) {
      chipTranslateDraft.addEventListener("click", async () => {
        const text = chatInput.value.trim();
        if (!text) {
          showToast("Type something in the box first to translate!");
          chatInput.focus();
          return;
        }
        chipTranslateDraft.style.opacity = "0.6";
        const origLabel = chipTranslateDraft.querySelector("span") ? chipTranslateDraft.querySelector("span").textContent : "";
        if (chipTranslateDraft.querySelector("span")) {
          chipTranslateDraft.querySelector("span").textContent = "Translating...";
        }

        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: text,
              source_lang: "Auto-Detect",
              target_lang: "Spanish",
              style: "Natural / Conversational",
            }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (data.translated_text) {
            chatInput.value = data.translated_text;
            adjustTextareaHeight(chatInput);
            showToast(`Translated to ${data.target_lang || "Spanish"}!`);
          }
        } catch (err) {
          showToast(`Translate error: ${err.message}`);
        } finally {
          chipTranslateDraft.style.opacity = "1";
          if (chipTranslateDraft.querySelector("span")) {
            chipTranslateDraft.querySelector("span").textContent = origLabel;
          }
          chatInput.focus();
        }
      });
    }
  }

  // ==========================================================================
  // 13. Interactive Model Switcher Popover Controller (Claude / ChatGPT style)
  // ==========================================================================
  function initModelSelector() {
    const btnModelSelector = document.getElementById("btn-model-selector");
    const modelDropdownMenu = document.getElementById("model-dropdown-menu");
    const modelSelectorWrapper = document.getElementById("model-selector-wrapper");
    const activeModelName = document.getElementById("active-model-name");
    const activeModelTag = document.getElementById("active-model-tag");

    if (!btnModelSelector || !modelDropdownMenu) return;

    btnModelSelector.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = modelDropdownMenu.classList.contains("hidden");
      if (isHidden) {
        modelDropdownMenu.classList.remove("hidden");
        modelSelectorWrapper?.classList.add("open");
      } else {
        modelDropdownMenu.classList.add("hidden");
        modelSelectorWrapper?.classList.remove("open");
      }
    });

    document.addEventListener("click", (e) => {
      if (!modelSelectorWrapper?.contains(e.target)) {
        modelDropdownMenu.classList.add("hidden");
        modelSelectorWrapper?.classList.remove("open");
      }
    });

    const modelOptions = modelDropdownMenu.querySelectorAll(".model-option");
    modelOptions.forEach((opt) => {
      opt.addEventListener("click", async () => {
        const modelId = opt.getAttribute("data-model");
        const rawName = opt.querySelector(".option-name")?.textContent || modelId;
        const optTag = opt.querySelector(".option-pill-badge")?.textContent || "Custom";

        modelOptions.forEach((o) => o.classList.remove("active"));
        opt.classList.add("active");

        const displayName = modelId === "go1.0" ? "GO 1.0" : (modelId === "gemma2:2b" ? "Gemma 2" : "Llama 3.2");
        if (activeModelName) activeModelName.textContent = displayName;
        if (activeModelTag) activeModelTag.textContent = optTag;

        modelDropdownMenu.classList.add("hidden");
        modelSelectorWrapper?.classList.remove("open");

        if (setModel) setModel.value = modelId;

        try {
          await fetch("/api/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ llm_model: modelId }),
          });
          showToast(`Active model switched to ${rawName}`);
        } catch (e) {
          console.error("Failed to update active model:", e);
        }
      });
    });
  }

  // Initial Boot
  loadConversations();
  loadDashboardData();
  initLiveTranslator();
  initTaskStudio();
  initChatQuickActions();
  initModelSelector();
  setInterval(loadDashboardData, 12000); // 12s hardware gauge refresh
  setAssistantState("ONLINE");
});
