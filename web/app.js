import { ICONS, renderIcon, hydrateIcons } from "./icons.js";

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // Automatically inject X-API-Key from localStorage if set (P0-A / 0A.7)
  const originalFetch = window.fetch;
  window.fetch = function (url, options = {}) {
    const apiKey = localStorage.getItem("friday_api_key");
    if (apiKey) {
      options = options || {};
      options.headers = options.headers || {};
      if (options.headers instanceof Headers) {
        if (!options.headers.has("X-API-Key")) {
          options.headers.set("X-API-Key", apiKey);
        }
      } else if (Array.isArray(options.headers)) {
        options.headers.push(["X-API-Key", apiKey]);
      } else {
        if (!options.headers["X-API-Key"]) {
          options.headers["X-API-Key"] = apiKey;
        }
      }
    }
    return originalFetch.call(this, url, options);
  };

  // ==========================================================================
  // 1. Core State & Element Selectors
  // ==========================================================================
  let currentConversationId = null;
  let isGenerating = false;
  let currentAbortController = null;
  let voiceWs = null;
  let voiceAudioQueue = [];
  let isPlayingVoiceQueue = false;
  let currentAudio = null;
  let isListening = false;
  let speechRecognition = null;
  let activeTheme = localStorage.getItem("friday_theme") || "dark";

  // Memory & Action Ledger (Stored in Session)
  let actionLedger = [];
  try {
    const savedLedger = sessionStorage.getItem("friday_action_ledger");
    if (savedLedger) actionLedger = JSON.parse(savedLedger);
  } catch (e) {
    actionLedger = [];
  }

  // Permissions State
  const permissions = {
    mic: localStorage.getItem("friday_perm_mic") !== "revoked",
    files: localStorage.getItem("friday_perm_files") !== "disabled",
    screen: localStorage.getItem("friday_perm_screen") === "enabled",
  };

  // Drafts State (Preserved across view transitions)
  const drafts = {
    chat: "",
    transSource: "",
    emailRecipient: "",
    emailPoints: "",
    analyzeInput: "",
  };

  // Elements
  const headerViewTitle = document.getElementById("header-view-title");
  const headerSubTitle = document.getElementById("header-sub-title");
  const btnToggleTheme = document.getElementById("btn-toggle-theme");
  const themeModeLabel = document.getElementById("theme-mode-label");
  const btnSetDark = document.getElementById("btn-set-dark");
  const btnSetLight = document.getElementById("btn-set-light");
  const btnSetSystem = document.getElementById("btn-set-system");

  // Rail & Navigation
  const railBtns = document.querySelectorAll(".rail-btn");
  const mobNavLinks = document.querySelectorAll(".mob-nav-link");
  const viewPanels = document.querySelectorAll(".view-panel");

  // Chat Elements
  const chatMessages = document.getElementById("chat-messages");
  const chatInput = document.getElementById("chat-input");
  const btnSendMessage = document.getElementById("btn-send-message");
  const btnCancelGen = document.getElementById("btn-cancel-gen");
  const btnNewChat = document.getElementById("btn-new-chat");
  const convList = document.getElementById("conversations-list");
  const convSearchInput = document.getElementById("conv-search-input");
  const convCountBadge = document.getElementById("conv-count-badge");

  // Voice Elements
  const btnPushToTalk = document.getElementById("btn-push-to-talk");
  const pttLabel = document.getElementById("ptt-label");
  const voiceStateLabel = document.getElementById("voice-state-label");
  const voiceLiveCaption = document.getElementById("voice-live-caption");
  const voiceWaveformCanvas = document.getElementById("voice-waveform-canvas");

  // Translate Elements
  const transSourceLang = document.getElementById("trans-source-lang");
  const transTargetLang = document.getElementById("trans-target-lang");
  const btnTransSwap = document.getElementById("btn-trans-swap");
  const transSourceInput = document.getElementById("trans-source-input");
  const transOutput = document.getElementById("trans-output");
  const transCharCount = document.getElementById("trans-char-count");
  const btnExecuteTranslate = document.getElementById("btn-execute-translate");
  const btnTransCopy = document.getElementById("btn-trans-copy");
  const transErrorBanner = document.getElementById("trans-error-banner");

  // Tasks Elements
  const taskTabBtns = document.querySelectorAll(".tab-btn-brutal");
  const paneTaskEmail = document.getElementById("pane-task-email");
  const paneTaskAnalyze = document.getElementById("pane-task-analyze");
  const emailRecipient = document.getElementById("email-recipient");
  const emailTone = document.getElementById("email-tone");
  const emailPoints = document.getElementById("email-points");
  const btnGenerateEmail = document.getElementById("btn-generate-email");
  const emailPreview = document.getElementById("email-preview");
  const btnCopyEmail = document.getElementById("btn-copy-email");
  const btnOpenMail = document.getElementById("btn-open-mail");
  const analyzeTaskType = document.getElementById("analyze-task-type");
  const analyzeInput = document.getElementById("analyze-input");
  const btnRunAnalysis = document.getElementById("btn-run-analysis");
  const analyzeOutput = document.getElementById("analyze-output");
  const btnCopyAnalysis = document.getElementById("btn-copy-analysis");

  // Dashboard & Ledger Elements
  const dashLlmStatus = document.getElementById("dash-llm-status");
  const dashMemoryCount = document.getElementById("dash-memory-count");
  const dashToolsCount = document.getElementById("dash-tools-count");
  const ledgerTableBody = document.getElementById("ledger-table-body");
  const btnClearLedger = document.getElementById("btn-clear-ledger");

  // Settings & Permissions Elements
  const settingsModel = document.getElementById("settings-model");
  const settingsVoice = document.getElementById("settings-voice");
  const btnPermMic = document.getElementById("btn-perm-mic");
  const btnPermFiles = document.getElementById("btn-perm-files");
  const btnPermScreen = document.getElementById("btn-perm-screen");

  // Modals & Overlay Systems
  const modalToolConfirm = document.getElementById("modal-tool-confirm");
  const modalConfirmDetails = document.getElementById("modal-confirm-details");
  const btnApproveAction = document.getElementById("btn-approve-action");
  const btnRejectAction = document.getElementById("btn-reject-action");
  let pendingToolApprovalResolver = null;

  const toastContainer = document.getElementById("toast-container");
  const modalCommandPalette = document.getElementById("modal-command-palette");
  const paletteSearchInput = document.getElementById("palette-search-input");
  const paletteResultsList = document.getElementById("palette-results-list");
  const btnOpenPalette = document.getElementById("btn-open-palette");

  const modalOnboarding = document.getElementById("modal-onboarding");
  const onboardUserNameInput = document.getElementById("onboard-user-name");
  const btnOnboardNext1 = document.getElementById("btn-onboard-next-1");
  const btnOnboardPrev2 = document.getElementById("btn-onboard-prev-2");
  const btnOnboardNext2 = document.getElementById("btn-onboard-next-2");
  const btnOnboardPrev3 = document.getElementById("btn-onboard-prev-3");
  const btnOnboardFinish = document.getElementById("btn-onboard-finish");

  const modalShortcuts = document.getElementById("modal-shortcuts");
  const btnCloseShortcuts = document.getElementById("btn-close-shortcuts");

  function showToast({ message, type = "info", duration = 3200 }) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;
    const iconName = type === "success" ? "check" : type === "error" ? "close" : type === "warning" ? "zap" : "info";
    toast.innerHTML = `
      <div class="toast-icon">${renderIcon(iconName, { size: 16 })}</div>
      <div class="toast-msg">${escapeHtml(message)}</div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("toast-leave");
      setTimeout(() => toast.remove(), 220);
    }, duration);
  }

  // ==========================================================================
  // 2. Hash Router Engine (#chat, #voice, #translate, #tasks, #dashboard, #settings, #about)
  // ==========================================================================
  const VIEW_TITLES = {
    landing: "SHOWCASE LANDING",
    chat: "ASSISTANT CHAT",
    voice: "VOICE MODE",
    memory: "NEURAL MEMORY HUB",
    devices: "DEVICE CONTINUITY HUB",
    translate: "LIVE TRANSLATOR",
    tasks: "EMAIL & TASKS",
    dashboard: "INTELLIGENCE DASHBOARD",
    settings: "SETTINGS & PERMISSIONS",
    about: "ABOUT ARCHITECTURE",
  };

  function saveCurrentDrafts() {
    if (chatInput) drafts.chat = chatInput.value;
    if (transSourceInput) drafts.transSource = transSourceInput.value;
    if (emailRecipient) drafts.emailRecipient = emailRecipient.value;
    if (emailPoints) drafts.emailPoints = emailPoints.value;
    if (analyzeInput) drafts.analyzeInput = analyzeInput.value;
  }

  function restoreDrafts() {
    if (chatInput && drafts.chat) chatInput.value = drafts.chat;
    if (transSourceInput && drafts.transSource) {
      transSourceInput.value = drafts.transSource;
      transCharCount.textContent = drafts.transSource.length;
    }
    if (emailRecipient && drafts.emailRecipient) emailRecipient.value = drafts.emailRecipient;
    if (emailPoints && drafts.emailPoints) emailPoints.value = drafts.emailPoints;
    if (analyzeInput && drafts.analyzeInput) analyzeInput.value = drafts.analyzeInput;
  }

  function routeToView(viewName) {
    saveCurrentDrafts();
    const cleanView = (viewName || "chat").replace("#", "").toLowerCase();
    const targetView = VIEW_TITLES[cleanView] ? cleanView : "chat";

    // Update Panes
    viewPanels.forEach((panel) => {
      const isTarget = panel.id === `view-${targetView}`;
      panel.classList.toggle("active", isTarget);
    });

    // Update Nav Links (Desktop & Mobile)
    railBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-view") === targetView);
    });
    mobNavLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("data-view") === targetView);
    });

    // Update Header Breadcrumbs
    if (headerViewTitle) headerViewTitle.textContent = VIEW_TITLES[targetView];
    if (headerSubTitle) {
      headerSubTitle.textContent = targetView === "chat" && currentConversationId ? "Active Session" : "Ready";
    }

    // Refresh view-specific dynamic data
    if (targetView === "dashboard") loadDashboardData();
    if (targetView === "settings") loadSettingsData();
    if (targetView === "memory") loadMemories();
    if (targetView === "devices") loadDevices();

    // Modality bar button syncing
    const btnModeConsole = document.getElementById("btn-mode-console");
    const btnModeLanding = document.getElementById("btn-mode-landing");
    if (btnModeConsole && btnModeLanding) {
      btnModeConsole.classList.toggle("active", targetView !== "landing");
      btnModeLanding.classList.toggle("active", targetView === "landing");
    }

    restoreDrafts();
  }

  window.addEventListener("hashchange", () => {
    routeToView(window.location.hash);
  });

  // ==========================================================================
  // 3. Theme Engine (Yellow Brutalism: Dark / Light / System)
  // ==========================================================================
  function applyTheme(themeName) {
    activeTheme = themeName;
    localStorage.setItem("friday_theme", themeName);

    let effectiveTheme = themeName;
    if (themeName === "system") {
      effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-theme", effectiveTheme);
    if (themeModeLabel) {
      themeModeLabel.textContent = themeName.toUpperCase();
    }
    const themeIconWrap = document.getElementById("theme-icon-wrap");
    if (themeIconWrap) {
      themeIconWrap.innerHTML = renderIcon(effectiveTheme === "dark" ? "moon" : "sun", { size: 13 });
    }

    // Highlight button in settings
    [btnSetDark, btnSetLight, btnSetSystem].forEach((b) => {
      if (b) b.classList.remove("btn-brutal-primary");
    });
    if (themeName === "dark" && btnSetDark) btnSetDark.classList.add("btn-brutal-primary");
    if (themeName === "light" && btnSetLight) btnSetLight.classList.add("btn-brutal-primary");
    if (themeName === "system" && btnSetSystem) btnSetSystem.classList.add("btn-brutal-primary");
  }

  function toggleTheme() {
    const next = activeTheme === "dark" ? "light" : activeTheme === "light" ? "system" : "dark";
    applyTheme(next);
  }

  btnToggleTheme.addEventListener("click", toggleTheme);

  if (btnSetDark) btnSetDark.addEventListener("click", () => applyTheme("dark"));
  if (btnSetLight) btnSetLight.addEventListener("click", () => applyTheme("light"));
  if (btnSetSystem) btnSetSystem.addEventListener("click", () => applyTheme("system"));

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (activeTheme === "system") applyTheme("system");
  });

  applyTheme(activeTheme);

  // ==========================================================================
  // 4. Action Ledger & Audit Trail
  // ==========================================================================
  function recordAction(toolName, args, locality, durationMs, status) {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      tool: toolName,
      args: typeof args === "object" ? JSON.stringify(args) : String(args),
      locality: locality || "DEVICE",
      duration: `${durationMs}ms`,
      status: status || "SUCCESS",
    };
    actionLedger.unshift(entry);
    if (actionLedger.length > 40) actionLedger.pop();
    try {
      sessionStorage.setItem("friday_action_ledger", JSON.stringify(actionLedger));
    } catch (e) {}
    renderLedger();
  }

  function renderLedger() {
    if (!ledgerTableBody) return;
    if (actionLedger.length === 0) {
      ledgerTableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-ink-muted); padding: 18px;">No local actions executed yet. Ask FRIDAY to run a calculation, inspect battery, or search workspace files.</td></tr>`;
      return;
    }
    ledgerTableBody.innerHTML = actionLedger
      .map(
        (a) => `
        <tr>
          <td>${a.timestamp}</td>
          <td><strong style="color: var(--color-primary);">${escapeHtml(a.tool)}</strong></td>
          <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(a.args)}">${escapeHtml(a.args)}</td>
          <td><span class="brutal-badge ${a.locality.toLowerCase()}">${a.locality}</span></td>
          <td>${a.duration}</td>
          <td><span style="color: ${a.status === "SUCCESS" ? "var(--color-success)" : "var(--color-danger)"}; font-weight: 800;">${a.status}</span></td>
        </tr>
      `
      )
      .join("");
  }

  if (btnClearLedger) {
    btnClearLedger.addEventListener("click", () => {
      actionLedger = [];
      sessionStorage.removeItem("friday_action_ledger");
      renderLedger();
    });
  }

  // ==========================================================================
  // 5. Tool Confirmation Modal (Trust & Safety Layer)
  // ==========================================================================
  function requestToolApproval(toolName, args) {
    return new Promise((resolve) => {
      pendingToolApprovalResolver = resolve;
      modalConfirmDetails.textContent = `Action: ${toolName}\nArguments:\n${JSON.stringify(args, null, 2)}`;
      modalToolConfirm.classList.remove("hidden");
    });
  }

  btnApproveAction.addEventListener("click", () => {
    modalToolConfirm.classList.add("hidden");
    if (pendingToolApprovalResolver) {
      pendingToolApprovalResolver(true);
      pendingToolApprovalResolver = null;
    }
  });

  btnRejectAction.addEventListener("click", () => {
    modalToolConfirm.classList.add("hidden");
    if (pendingToolApprovalResolver) {
      pendingToolApprovalResolver(false);
      pendingToolApprovalResolver = null;
    }
  });

  if (modalToolConfirm) {
    modalToolConfirm.addEventListener("click", (e) => {
      if (e.target === modalToolConfirm) {
        btnRejectAction.click();
      }
    });
  }

  // ==========================================================================
  // 6. Permission Center Controller
  // ==========================================================================
  function updatePermissionUI() {
    if (btnPermMic) {
      btnPermMic.textContent = permissions.mic ? "GRANTED" : "REVOKED";
      btnPermMic.className = `btn-brutal ${permissions.mic ? "btn-brutal-primary" : "btn-brutal-secondary"}`;
    }
    if (btnPermFiles) {
      btnPermFiles.textContent = permissions.files ? "ENABLED" : "DISABLED";
      btnPermFiles.className = `btn-brutal ${permissions.files ? "btn-brutal-primary" : "btn-brutal-secondary"}`;
    }
    if (btnPermScreen) {
      btnPermScreen.textContent = permissions.screen ? "ENABLED" : "DISABLED";
      btnPermScreen.className = `btn-brutal ${permissions.screen ? "btn-brutal-primary" : "btn-brutal-secondary"}`;
    }
  }

  if (btnPermMic) {
    btnPermMic.addEventListener("click", () => {
      permissions.mic = !permissions.mic;
      localStorage.setItem("friday_perm_mic", permissions.mic ? "granted" : "revoked");
      updatePermissionUI();
    });
  }

  if (btnPermFiles) {
    btnPermFiles.addEventListener("click", () => {
      permissions.files = !permissions.files;
      localStorage.setItem("friday_perm_files", permissions.files ? "enabled" : "disabled");
      updatePermissionUI();
    });
  }

  if (btnPermScreen) {
    btnPermScreen.addEventListener("click", () => {
      permissions.screen = !permissions.screen;
      localStorage.setItem("friday_perm_screen", permissions.screen ? "enabled" : "disabled");
      updatePermissionUI();
    });
  }

  updatePermissionUI();

  // ==========================================================================
  // 7. Conversation Management (SQLite WAL Backend)
  // ==========================================================================
  let cachedConversations = [];

  async function loadConversations() {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        cachedConversations = await res.json();
        if (convCountBadge) convCountBadge.textContent = cachedConversations.length;
        renderConversationsList(convSearchInput ? convSearchInput.value.trim().toLowerCase() : "");
      }
    } catch (e) {
      console.warn("Failed to load conversations:", e);
    }
  }

  function renderConversationsList(query = "") {
    if (!convList) return;
    convList.innerHTML = "";

    const filtered = query
      ? cachedConversations.filter((c) => (c.title || "").toLowerCase().includes(query))
      : cachedConversations;

    if (filtered.length === 0) {
      convList.innerHTML = `
        <div style="padding: 24px 12px; text-align: center; color: var(--color-ink-muted); font-size: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <span style="opacity: 0.5;">${renderIcon("chat", { size: 24 })}</span>
          <span>${query ? "No chats match search" : "No saved chats yet"}</span>
        </div>
      `;
      return;
    }

    filtered.forEach((c) => {
      const div = document.createElement("div");
      div.className = `conv-item ${c.id === currentConversationId ? "active" : ""}`;
      div.innerHTML = `
        <div class="conv-item-title" title="${escapeHtml(c.title)} (Double-click to rename)">${escapeHtml(c.title)}</div>
        <div class="conv-item-actions">
          <button class="btn-conv-action delete" title="Delete chat">${renderIcon("trash", { size: 12 })}</button>
        </div>
      `;

      const titleEl = div.querySelector(".conv-item-title");
      titleEl.addEventListener("click", () => {
        selectConversation(c.id, c.title);
      });

      // Double-click inline renaming
      titleEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        const currentTitle = c.title || "Untitled";
        const input = document.createElement("input");
        input.type = "text";
        input.value = currentTitle;
        input.className = "conv-search-input";
        input.style.padding = "2px 6px";
        input.style.fontSize = "12px";
        input.style.width = "100%";

        titleEl.replaceWith(input);
        input.focus();
        input.select();

        let committed = false;
        async function commitRename() {
          if (committed) return;
          committed = true;
          const newTitle = input.value.trim() || currentTitle;
          input.replaceWith(titleEl);
          titleEl.textContent = newTitle;
          if (newTitle !== currentTitle) {
            try {
              const res = await fetch(`/api/conversations/${c.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle }),
              });
              if (res.ok) {
                c.title = newTitle;
                showToast({ message: `Renamed chat to "${newTitle}"`, type: "success" });
                if (currentConversationId === c.id && headerSubTitle) {
                  headerSubTitle.textContent = newTitle;
                }
              }
            } catch (err) {
              showToast({ message: "Failed to rename chat", type: "error" });
            }
          }
        }

        input.addEventListener("blur", commitRename);
        input.addEventListener("keydown", (evt) => {
          if (evt.key === "Enter") commitRename();
          if (evt.key === "Escape") {
            committed = true;
            input.replaceWith(titleEl);
          }
        });
      });

      div.querySelector(".btn-conv-action.delete").addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${c.title}"?`)) {
          try {
            await fetch(`/api/conversations/${c.id}`, { method: "DELETE" });
            showToast({ message: `Deleted conversation "${c.title}"`, type: "info" });
            if (c.id === currentConversationId) {
              currentConversationId = null;
              if (headerSubTitle) headerSubTitle.textContent = "Ready";
              renderConversationMessages([]);
            }
            await loadConversations();
          } catch (err) {
            showToast({ message: "Failed to delete chat", type: "error" });
          }
        }
      });
      convList.appendChild(div);
    });
  }

  async function selectConversation(convId, title) {
    currentConversationId = convId;
    if (headerSubTitle) headerSubTitle.textContent = title || "Active Session";
    document.querySelectorAll(".conv-item").forEach((el) => {
      el.classList.toggle("active", el.querySelector(".conv-item-title")?.textContent === title);
    });

    routeToView("chat");
    window.location.hash = "chat";

    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        renderConversationMessages(data.messages || []);
      }
    } catch (e) {
      console.error("Failed to load messages:", e);
    }
  }

  function renderConversationMessages(msgs) {
    if (!chatMessages) return;
    chatMessages.innerHTML = "";
    if (!msgs || msgs.length === 0) {
      chatMessages.innerHTML = `
        <div class="chat-hero-box">
          <div class="chat-hero-orb">
            ${renderIcon("sparkle", { size: 30, strokeWidth: 2.2 })}
          </div>
          <div class="chat-hero-title">FRIDAY INTELLIGENCE CONSOLE</div>
          <div class="chat-hero-desc">
            Dual-Engine Local Architecture • 
            <span style="color: var(--color-primary); font-weight: 600;">Laya System 1 Intent Router</span> (MPS) + 
            <span style="color: var(--color-secondary); font-weight: 600;">Ollama Engine</span>
            <br>Local deterministic tools, private persistent memory, zero external telemetry.
          </div>
          <div class="chat-hero-grid">
            <div class="hero-prompt-card" data-prompt="Check battery, RAM, and live hardware telemetry">
              <div class="hero-prompt-title">
                ${renderIcon("cpu", { size: 15, className: "text-secondary" })}
                <span>Hardware Telemetry</span>
              </div>
              <div class="hero-prompt-sub">Inspect Apple Silicon RAM, CPU load, and battery stats</div>
            </div>
            <div class="hero-prompt-card" data-prompt="Calculate (45 * 100) + (1024 / 4)">
              <div class="hero-prompt-title">
                ${renderIcon("calculator", { size: 15, className: "text-primary" })}
                <span>AST Calculator</span>
              </div>
              <div class="hero-prompt-sub">Deterministic Python AST math without LLM hallucinations</div>
            </div>
            <div class="hero-prompt-card" data-prompt="Check the current weather and forecast">
              <div class="hero-prompt-title">
                ${renderIcon("cloud", { size: 15, className: "text-info" })}
                <span>Live Weather</span>
              </div>
              <div class="hero-prompt-sub">Query atmospheric conditions and local forecast</div>
            </div>
            <div class="hero-prompt-card" data-prompt="List files in the workspace">
              <div class="hero-prompt-title">
                ${renderIcon("folder", { size: 15, className: "text-warning" })}
                <span>Workspace Files</span>
              </div>
              <div class="hero-prompt-sub">Browse, inspect, and summarize workspace documents</div>
            </div>
          </div>
        </div>
      `;

      chatMessages.querySelectorAll(".hero-prompt-card").forEach((card) => {
        card.addEventListener("click", () => {
          const prompt = card.getAttribute("data-prompt");
          if (prompt && chatInput) {
            chatInput.value = prompt;
            sendMessage(prompt);
          }
        });
      });
      return;
    }

    msgs.forEach((m) => {
      if (m.role === "user") appendUserMessage(m.content);
      else if (m.role === "assistant") {
        const card = createAssistantCard(m.content);
        card.querySelector(".msg-content").innerHTML = renderMarkdown(m.content);
      }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function createNewConversation() {
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      if (res.ok) {
        const c = await res.json();
        currentConversationId = c.id;
        renderConversationMessages([]);
        routeToView("chat");
        window.location.hash = "chat";
        await loadConversations();
        chatInput.focus();
      }
    } catch (e) {
      console.error("Failed to create conversation:", e);
    }
  }

  if (btnNewChat) btnNewChat.addEventListener("click", createNewConversation);
  if (convSearchInput) {
    convSearchInput.addEventListener("input", (e) => {
      renderConversationsList(e.target.value.trim().toLowerCase());
    });
  }

  // ==========================================================================
  // 8. Chat Streaming with Trace & Tool Renderers
  // ==========================================================================
  function appendUserMessage(text) {
    // Remove hero if present
    const hero = chatMessages.querySelector(".chat-hero-box");
    if (hero) hero.remove();

    const row = document.createElement("div");
    row.className = "message-row";
    row.innerHTML = `
      <div class="message-card user">
        <div class="msg-header">
          <span>YOU</span>
          <span class="font-mono">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="msg-content">${escapeHtml(text)}</div>
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function createAssistantCard(initialContent = "") {
    const row = document.createElement("div");
    row.className = "message-row";
    row.innerHTML = `
      <div class="message-card assistant">
        <div class="msg-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: var(--color-primary);">FRIDAY</strong>
            <span class="brutal-badge local" style="padding: 1px 6px; font-size: 9px;">ON-DEVICE</span>
          </div>
          <span class="msg-time font-mono">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="laya-pill-container"></div>
        <div class="trace-container"></div>
        <div class="tool-widgets-container"></div>
        <div class="msg-content"></div>
        <div class="msg-actions-bar">
          <button class="msg-action-btn btn-copy-msg" title="Copy response to clipboard">
            ${renderIcon("copy", { size: 12 })}
            <span>Copy</span>
          </button>
          <button class="msg-action-btn btn-feedback-up" title="Helpful response">
            ${renderIcon("thumbs-up", { size: 12 })}
          </button>
          <button class="msg-action-btn btn-feedback-down" title="Not helpful">
            ${renderIcon("thumbs-down", { size: 12 })}
          </button>
        </div>
      </div>
    `;

    const card = row.querySelector(".message-card");
    const copyBtn = card.querySelector(".btn-copy-msg");
    const thumbUp = card.querySelector(".btn-feedback-up");
    const thumbDown = card.querySelector(".btn-feedback-down");

    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const text = card.querySelector(".msg-content").innerText || initialContent;
        if (text) {
          navigator.clipboard.writeText(text);
          showToast({ message: "Response copied to clipboard!", type: "success" });
        }
      });
    }

    if (thumbUp) {
      thumbUp.addEventListener("click", () => {
        thumbUp.classList.toggle("active-feedback");
        thumbDown.classList.remove("active-feedback");
        showToast({ message: "Thanks for the feedback!", type: "info" });
      });
    }

    if (thumbDown) {
      thumbDown.addEventListener("click", () => {
        thumbDown.classList.toggle("active-feedback");
        thumbUp.classList.remove("active-feedback");
        showToast({ message: "Feedback recorded. FRIDAY will adapt.", type: "info" });
      });
    }

    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return card;
  }

  function renderToolWidget(toolName, args, result) {
    const div = document.createElement("div");
    div.className = "tool-widget-card";
    const locality = toolName === "web_search" || toolName === "weather" ? "NETWORK" : "DEVICE";
    const iconName = toolName === "calculate" ? "calculator" : toolName === "system_info" ? "cpu" : toolName === "weather" ? "cloud" : toolName === "time" ? "clock" : toolName === "file_manager" ? "folder" : "zap";

    div.innerHTML = `
      <div class="tool-widget-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          ${renderIcon(iconName, { size: 14 })}
          <span>TOOL: <strong>${escapeHtml(toolName)}</strong></span>
        </div>
        <span class="brutal-badge ${locality.toLowerCase()}">${locality}</span>
      </div>
      <div class="tool-widget-body">
        <pre style="margin-bottom: 6px; color: var(--color-ink-muted); font-size: 11px;">ARG: ${escapeHtml(JSON.stringify(args))}</pre>
        <pre style="background: var(--color-surface); padding: 8px; border: 1px solid var(--color-border); border-radius: var(--radius-xs); overflow-x: auto; font-size: 12px;">${escapeHtml(result || "Executed.")}</pre>
      </div>
    `;
    return div;
  }

  async function sendMessage(text) {
    if (!text || isGenerating) return;
    isGenerating = true;
    btnSendMessage.disabled = true;
    if (btnCancelGen) btnCancelGen.style.display = "inline-flex";

    appendUserMessage(text);
    chatInput.value = "";
    chatInput.style.height = "auto";
    drafts.chat = "";

    const card = createAssistantCard();
    const layaPillContainer = card.querySelector(".laya-pill-container");
    const traceContainer = card.querySelector(".trace-container");
    const widgetsContainer = card.querySelector(".tool-widgets-container");
    const msgContent = card.querySelector(".msg-content");

    // Live Execution Trace
    traceContainer.innerHTML = `
      <div class="execution-trace-pill">
        <span class="spinner"></span>
        <span>Thinking locally (Laya System 1 routing)...</span>
      </div>
    `;

    currentAbortController = new AbortController();
    let accumulatedText = "";
    const startTime = performance.now();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: currentAbortController.signal,
        body: JSON.stringify({
          message: text,
          conversation_id: currentConversationId,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "conversation_created") {
              currentConversationId = ev.conversation_id;
              await loadConversations();
            } else if (ev.type === "intent_detected") {
              if (layaPillContainer) {
                if (ev.fast_path) {
                  layaPillContainer.innerHTML = `
                    <div class="laya-decision-pill fast-path">
                      <span class="laya-bolt">⚡</span>
                      <span>LAYA FAST-PATH:</span>
                      <strong style="color: #FFF;">${escapeHtml(ev.laya_choice || ev.intent)}</strong>
                      <span class="laya-divider">•</span>
                      <span>${Math.round((ev.confidence || 0) * 100)}% conf</span>
                      <span class="laya-divider">•</span>
                      <span>${Math.round(ev.latency_ms || 0)}ms</span>
                      <span class="laya-bypass-tag">OLLAMA BYPASSED</span>
                    </div>
                  `;
                } else {
                  layaPillContainer.innerHTML = `
                    <div class="laya-decision-pill standard">
                      <span>🧠</span>
                      <span>LAYA ROUTED:</span>
                      <strong style="color: #FFF;">${escapeHtml(ev.laya_choice || ev.intent)}</strong>
                      <span class="laya-divider">•</span>
                      <span>${Math.round((ev.confidence || 0) * 100)}% conf</span>
                      <span class="laya-divider">•</span>
                      <span>${Math.round(ev.latency_ms || 0)}ms</span>
                    </div>
                  `;
                }
              }
            } else if (ev.type === "tool_started") {
              const locality = ev.tool === "web_search" || ev.tool === "weather" ? "NETWORK" : "DEVICE";
              traceContainer.innerHTML = `
                <div class="execution-trace-pill ${ev.fast_path ? 'fast-path-pill' : ''}">
                  <span class="spinner"></span>
                  <span>${ev.fast_path ? '⚡ Executing Fast-Path' : 'Executing tool'}: ${escapeHtml(ev.tool)}...</span>
                </div>
              `;
            } else if (ev.type === "tool_completed") {
              const locality = ev.tool === "web_search" || ev.tool === "weather" ? "NETWORK" : "DEVICE";
              const dur = Math.round(performance.now() - startTime);
              recordAction(ev.tool, ev.arguments || {}, locality, dur, "SUCCESS");
              widgetsContainer.appendChild(renderToolWidget(ev.tool, ev.arguments || {}, ev.result));
              traceContainer.innerHTML = "";
            } else if (ev.type === "assistant_token") {
              traceContainer.innerHTML = "";
              accumulatedText += ev.content;
              msgContent.innerHTML = renderMarkdown(accumulatedText);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            } else if (ev.type === "error") {
              msgContent.innerHTML += `<div style="color: var(--color-danger); font-weight: 800;">Error: ${escapeHtml(ev.message)}</div>`;
            }
          } catch (err) {}
        }
      }
    } catch (err) {
      if (err.name === "AbortError") {
        msgContent.innerHTML += `<p style="color: var(--color-warning);">[Generation cancelled by user]</p>`;
      } else {
        msgContent.innerHTML = `<div style="color: var(--color-danger); font-weight: 800;">Local engine error: ${escapeHtml(err.message)}</div>`;
      }
    } finally {
      isGenerating = false;
      btnSendMessage.disabled = false;
      if (btnCancelGen) btnCancelGen.style.display = "none";
      currentAbortController = null;
      traceContainer.innerHTML = "";
      await loadConversations();
    }
  }

  btnSendMessage.addEventListener("click", () => sendMessage(chatInput.value.trim()));
  if (chatInput) {
    chatInput.addEventListener("input", () => {
      chatInput.style.height = "auto";
      chatInput.style.height = Math.min(chatInput.scrollHeight, 180) + "px";
    });
  }
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value.trim());
    }
  });

  if (btnCancelGen) {
    btnCancelGen.addEventListener("click", () => {
      if (currentAbortController) currentAbortController.abort();
    });
  }

  // Quick Command Chips Click Handlers
  document.querySelectorAll(".quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      if (prompt && chatInput) {
        chatInput.value = prompt;
        sendMessage(prompt);
      }
    });
  });

  // Chat Composer Mic Button
  const btnChatMic = document.getElementById("btn-chat-mic");
  if (btnChatMic) {
    btnChatMic.addEventListener("click", () => {
      window.location.hash = "voice";
      setTimeout(() => {
        if (btnPushToTalk) btnPushToTalk.click();
      }, 150);
    });
  }

  // ==========================================================================
  // 9. Voice Console (Honest States & Waveform)
  // ==========================================================================
  function setVoiceState(state) {
    if (voiceStateLabel) {
      voiceStateLabel.textContent = state;
      voiceStateLabel.setAttribute("data-state", state);
    }
    if (pttLabel) {
      if (state === "LISTENING") pttLabel.textContent = "LISTENING (SPEAK NOW)";
      else if (state === "THINKING") pttLabel.textContent = "THINKING LOCALLY...";
      else if (state === "SPEAKING") pttLabel.textContent = "SPEAKING RESPONSE";
      else pttLabel.textContent = "HOLD OR CLICK TO TALK";
    }
    if (btnPushToTalk) {
      btnPushToTalk.classList.toggle("active-listening", state === "LISTENING");
    }
  }

  // Segmented Canvas Meter
  let audioCtx, analyser, dataArray;
  function initAudioMeter() {
    if (!voiceWaveformCanvas) return;
    const ctx = voiceWaveformCanvas.getContext("2d");
    function draw() {
      requestAnimationFrame(draw);
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, voiceWaveformCanvas.width, voiceWaveformCanvas.height);

      const numBars = 36;
      const barWidth = 10;
      const gap = 4;
      const startX = (voiceWaveformCanvas.width - numBars * (barWidth + gap)) / 2;

      for (let i = 0; i < numBars; i++) {
        let h = 4;
        if (isListening) {
          h = Math.max(4, Math.sin(Date.now() / 150 + i) * 20 + 22);
        } else if (isPlayingVoiceQueue) {
          h = Math.max(4, Math.cos(Date.now() / 180 + i) * 16 + 18);
        }
        ctx.fillStyle = isListening ? "#FF675E" : isPlayingVoiceQueue ? "#5EEB83" : "#FFE600";
        ctx.fillRect(startX + i * (barWidth + gap), (voiceWaveformCanvas.height - h) / 2, barWidth, h);
      }
    }
    draw();
  }
  initAudioMeter();

  let voiceReconnectDelay = 1000;
  function initVoiceWebSocket() {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const apiKey = localStorage.getItem("friday_api_key");
    const wsUrl = `${proto}//${window.location.host}/ws/voice${apiKey ? `?api_key=${encodeURIComponent(apiKey)}` : ""}`;
    try {
      if (voiceWs && voiceWs.readyState === WebSocket.OPEN) {
        voiceWs.close();
      }
      voiceWs = new WebSocket(wsUrl);
      voiceWs.onopen = () => {
        voiceReconnectDelay = 1000;
      };
      voiceWs.onclose = () => {
        setTimeout(initVoiceWebSocket, voiceReconnectDelay);
        voiceReconnectDelay = Math.min(voiceReconnectDelay * 1.5, 30000);
      };
      voiceWs.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "state") setVoiceState(msg.state);
          else if (msg.type === "token" && voiceLiveCaption) {
            voiceLiveCaption.textContent = (voiceLiveCaption.textContent + msg.content).slice(-120);
          } else if (msg.type === "audio") {
            queueVoiceAudio(msg.chunk, msg.mime || "audio/mpeg");
          }
        } catch (err) {}
      };
    } catch (e) {
      setTimeout(initVoiceWebSocket, voiceReconnectDelay);
    }
  }
  initVoiceWebSocket();

  function queueVoiceAudio(b64Data, mime) {
    try {
      const binary = atob(b64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      const url = URL.createObjectURL(blob);
      voiceAudioQueue.push(url);
      if (!isPlayingVoiceQueue) playNextVoiceAudio();
    } catch (e) {}
  }

  function playNextVoiceAudio() {
    if (voiceAudioQueue.length === 0) {
      isPlayingVoiceQueue = false;
      setVoiceState("READY");
      return;
    }
    isPlayingVoiceQueue = true;
    setVoiceState("SPEAKING");
    const url = voiceAudioQueue.shift();
    currentAudio = new Audio(url);
    currentAudio.onended = () => {
      URL.revokeObjectURL(url);
      playNextVoiceAudio();
    };
    currentAudio.onerror = () => {
      URL.revokeObjectURL(url);
      playNextVoiceAudio();
    };
    currentAudio.play().catch(() => {
      URL.revokeObjectURL(url);
      playNextVoiceAudio();
    });
  }

  // Push-To-Talk Events
  if (btnPushToTalk) {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      speechRecognition = new SpeechRec();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = true;
      speechRecognition.onstart = () => {
        isListening = true;
        setVoiceState("LISTENING");
        if (voiceLiveCaption) voiceLiveCaption.textContent = "Listening locally...";
      };
      speechRecognition.onresult = (ev) => {
        let transcript = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          transcript += ev.results[i][0].transcript;
        }
        if (voiceLiveCaption) voiceLiveCaption.textContent = `"${transcript}"`;
        const lastResult = ev.results[ev.results.length - 1];
        const isFinal = lastResult && lastResult.isFinal;
        if (isFinal && transcript.trim()) {
          setVoiceState("THINKING");
          if (voiceWs && voiceWs.readyState === WebSocket.OPEN) {
            voiceWs.send(JSON.stringify({ type: "user_speech", text: transcript.trim() }));
          } else {
            sendMessage(transcript.trim());
          }
        }
      };
      speechRecognition.onend = () => {
        isListening = false;
        if (!isPlayingVoiceQueue) setVoiceState("READY");
      };
      speechRecognition.onerror = () => {
        isListening = false;
        setVoiceState("READY");
      };
    }

    btnPushToTalk.addEventListener("click", () => {
      if (!permissions.mic) {
        alert("Microphone permission is currently REVOKED in the Settings Permission Center.");
        return;
      }
      if (!speechRecognition) {
        alert("Speech Recognition API is not supported in this browser.");
        return;
      }
      if (isListening) speechRecognition.stop();
      else {
        try {
          speechRecognition.start();
        } catch (e) {}
      }
    });
  }

  // ==========================================================================
  // 10. Live Translator (#translate)
  // ==========================================================================
  if (transSourceInput) {
    transSourceInput.addEventListener("input", () => {
      transCharCount.textContent = transSourceInput.value.length;
      drafts.transSource = transSourceInput.value;
      transErrorBanner.style.display = "none";
    });
  }

  if (btnTransSwap) {
    btnTransSwap.addEventListener("click", () => {
      const src = transSourceLang.value;
      const tgt = transTargetLang.value;
      if (src !== "Auto-Detect") {
        transSourceLang.value = tgt;
        transTargetLang.value = src;
      }
      const tmp = transSourceInput.value;
      transSourceInput.value = transOutput.value;
      transOutput.value = tmp;
      transCharCount.textContent = transSourceInput.value.length;
    });
  }

  if (btnExecuteTranslate) {
    btnExecuteTranslate.addEventListener("click", async () => {
      const text = transSourceInput.value.trim();
      if (!text) {
        transErrorBanner.textContent = "Please enter text to translate.";
        transErrorBanner.style.display = "block";
        return;
      }
      btnExecuteTranslate.disabled = true;
      btnExecuteTranslate.textContent = "TRANSLATING...";
      transErrorBanner.style.display = "none";

      const startTime = performance.now();
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            source_lang: transSourceLang.value,
            target_lang: transTargetLang.value,
          }),
        });
        if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
        const data = await res.json();
        transOutput.value = data.translated_text || "";
        const dur = Math.round(performance.now() - startTime);
        recordAction("translate", { from: transSourceLang.value, to: transTargetLang.value }, "DEVICE", dur, "SUCCESS");
      } catch (err) {
        transErrorBanner.textContent = `Translation failed: ${err.message}. Click to retry.`;
        transErrorBanner.style.display = "block";
      } finally {
        btnExecuteTranslate.disabled = false;
        btnExecuteTranslate.textContent = "TRANSLATE TEXT";
      }
    });
  }

  if (btnTransCopy) {
    btnTransCopy.addEventListener("click", () => {
      if (transOutput.value) {
        navigator.clipboard.writeText(transOutput.value);
        btnTransCopy.textContent = "COPIED!";
        setTimeout(() => (btnTransCopy.textContent = "COPY"), 1500);
      }
    });
  }

  // ==========================================================================
  // 11. Tasks Engine (#tasks: Email & Analyze)
  // ==========================================================================
  taskTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-task-tab");
      taskTabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      paneTaskEmail.classList.toggle("active", tab === "email");
      paneTaskAnalyze.classList.toggle("active", tab === "analyze");
    });
  });

  if (btnGenerateEmail) {
    btnGenerateEmail.addEventListener("click", async () => {
      const points = emailPoints.value.trim();
      if (!points) {
        alert("Please enter key points for the email.");
        return;
      }
      btnGenerateEmail.disabled = true;
      btnGenerateEmail.textContent = "DRAFTING LOCALLY...";
      const startTime = performance.now();
      try {
        const res = await fetch("/api/tasks/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipient: emailRecipient.value.trim() || "Colleague",
            tone: emailTone.value,
            key_points: points,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        emailPreview.value = data.full_text || `${data.subject}\n\n${data.body}`;
        const dur = Math.round(performance.now() - startTime);
        recordAction("task_email_draft", { tone: emailTone.value }, "DEVICE", dur, "SUCCESS");
      } catch (err) {
        alert(`Email generation failed: ${err.message}`);
      } finally {
        btnGenerateEmail.disabled = false;
        btnGenerateEmail.textContent = "GENERATE DRAFT";
      }
    });
  }

  if (btnCopyEmail) {
    btnCopyEmail.addEventListener("click", () => {
      if (emailPreview.value) {
        navigator.clipboard.writeText(emailPreview.value);
        btnCopyEmail.textContent = "COPIED!";
        setTimeout(() => (btnCopyEmail.textContent = "COPY DRAFT"), 1500);
      }
    });
  }

  if (btnOpenMail) {
    btnOpenMail.addEventListener("click", () => {
      if (emailPreview.value) {
        const lines = emailPreview.value.split("\n\n");
        const subj = lines[0]?.replace("Subject: ", "") || "Draft from FRIDAY";
        const body = lines.slice(1).join("\n\n");
        window.open(`mailto:?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`);
      }
    });
  }

  if (btnRunAnalysis) {
    btnRunAnalysis.addEventListener("click", async () => {
      const content = analyzeInput.value.trim();
      if (!content) {
        alert("Please paste text to analyze.");
        return;
      }
      btnRunAnalysis.disabled = true;
      btnRunAnalysis.textContent = "ANALYZING...";
      const startTime = performance.now();
      try {
        const res = await fetch("/api/tasks/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: content,
            task_type: analyzeTaskType.value,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        analyzeOutput.value = data.result || JSON.stringify(data, null, 2);
        const dur = Math.round(performance.now() - startTime);
        recordAction("task_text_analyze", { type: analyzeTaskType.value }, "DEVICE", dur, "SUCCESS");
      } catch (err) {
        alert(`Analysis failed: ${err.message}`);
      } finally {
        btnRunAnalysis.disabled = false;
        btnRunAnalysis.textContent = "RUN LOCAL ANALYSIS";
      }
    });
  }

  if (btnCopyAnalysis) {
    btnCopyAnalysis.addEventListener("click", () => {
      if (analyzeOutput.value) {
        navigator.clipboard.writeText(analyzeOutput.value);
        btnCopyAnalysis.textContent = "COPIED!";
        setTimeout(() => (btnCopyAnalysis.textContent = "COPY RESULT"), 1500);
      }
    });
  }

  // ==========================================================================
  // 12. Dashboard & Settings Data Loaders
  // ==========================================================================
  async function loadDashboardData() {
    renderLedger();
    try {
      const [resHealth, resTools, resMemory, resInfo] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/tools"),
        fetch("/api/memory"),
        fetch("/api/info"),
      ]);

      if (resHealth.ok) {
        const h = await resHealth.json();
        if (dashLlmStatus) dashLlmStatus.textContent = h.llm_model || (h.system ? h.system.arch : "gemma2:2b");
      }
      if (resTools.ok) {
        const t = await resTools.json();
        if (dashToolsCount) dashToolsCount.textContent = (t.tools || []).length;
      }
      if (resMemory.ok) {
        const m = await resMemory.json();
        if (dashMemoryCount) dashMemoryCount.textContent = (m.memories || []).length;
      }
      if (resInfo.ok) {
        const info = await resInfo.json();
        const laya = info.decision_model;
        const layaDeviceEl = document.getElementById("dash-laya-device");
        const layaLatencyEl = document.getElementById("dash-laya-latency");
        if (layaDeviceEl && laya) layaDeviceEl.textContent = laya.device || "MPS (Metal)";
        if (layaLatencyEl && laya) layaLatencyEl.textContent = laya.loaded ? "Active (~180ms)" : "Ready (MPS)";
        if (dashLlmStatus && info.agent_model) {
          dashLlmStatus.textContent = info.agent_model.model_name || "gemma2:2b";
        }
      }
    } catch (e) {
      console.warn("Telemetry refresh warning:", e);
    }
  }

  async function loadSettingsData() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const s = await res.json();
        if (settingsModel && s.llm_model) settingsModel.value = s.llm_model;
      }
    } catch (e) {}

    const settingsApiKey = document.getElementById("settings-api-key");
    const btnSaveApiKey = document.getElementById("btn-save-api-key");
    const apiKeyStatus = document.getElementById("api-key-status");

    if (settingsApiKey) {
      settingsApiKey.value = localStorage.getItem("friday_api_key") || "";
    }

    if (btnSaveApiKey && !btnSaveApiKey.dataset.bound) {
      btnSaveApiKey.dataset.bound = "true";
      btnSaveApiKey.addEventListener("click", () => {
        const val = settingsApiKey ? settingsApiKey.value.trim() : "";
        if (val) {
          localStorage.setItem("friday_api_key", val);
          if (apiKeyStatus) apiKeyStatus.textContent = "API key saved. Requests and WebSocket now authenticated.";
        } else {
          localStorage.removeItem("friday_api_key");
          if (apiKeyStatus) apiKeyStatus.textContent = "API key removed. Running in dev-anonymous mode.";
        }
        setTimeout(() => { if (apiKeyStatus) apiKeyStatus.textContent = ""; }, 4000);
        initVoiceWebSocket();
      });
    }
  }

  if (settingsModel) {
    settingsModel.addEventListener("change", async () => {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ llm_model: settingsModel.value }),
      });
    });
  }

  // ==========================================================================
  // 13. Command Palette System (Raycast / Linear Inspired)
  // ==========================================================================
  let paletteSelectedIndex = 0;
  let paletteItems = [];

  const COMMAND_REGISTRY = [
    { id: "view-landing", title: "Showcase Landing", category: "Navigation", icon: "sparkle", action: () => { routeToView("landing"); window.location.hash = "landing"; } },
    { id: "view-chat", title: "Assistant Chat", category: "Navigation", icon: "chat", shortcut: "⌘1", action: () => { routeToView("chat"); window.location.hash = "chat"; } },
    { id: "view-voice", title: "Voice Mode", category: "Navigation", icon: "mic", shortcut: "⌘2", action: () => { routeToView("voice"); window.location.hash = "voice"; } },
    { id: "view-memory", title: "Neural Memory Hub", category: "Navigation", icon: "database", shortcut: "⌘3", action: () => { routeToView("memory"); window.location.hash = "memory"; } },
    { id: "view-devices", title: "Device Continuity Hub", category: "Navigation", icon: "share", shortcut: "⌘4", action: () => { routeToView("devices"); window.location.hash = "devices"; } },
    { id: "view-trans", title: "Translator", category: "Navigation", icon: "globe", action: () => { routeToView("translate"); window.location.hash = "translate"; } },
    { id: "view-tasks", title: "Email & Tasks", category: "Navigation", icon: "mail", action: () => { routeToView("tasks"); window.location.hash = "tasks"; } },
    { id: "view-dash", title: "Intelligence Dashboard", category: "Navigation", icon: "dashboard", shortcut: "⌘5", action: () => { routeToView("dashboard"); window.location.hash = "dashboard"; } },
    { id: "view-settings", title: "Settings & Permissions", category: "Navigation", icon: "settings", shortcut: "⌘6", action: () => { routeToView("settings"); window.location.hash = "settings"; } },
    { id: "view-about", title: "About Architecture", category: "Navigation", icon: "info", action: () => { routeToView("about"); window.location.hash = "about"; } },
    { id: "act-new-chat", title: "New Conversation", category: "Actions", icon: "plus", shortcut: "⌘⇧N", action: () => createNewConversation() },
    { id: "act-theme", title: "Toggle Theme (Dark / Light / System)", category: "Actions", icon: "sun", shortcut: "⌘T", action: () => toggleTheme() },
    { id: "act-android-sim", title: "Open Android Companion Simulator", category: "Actions", icon: "smartphone", action: () => openAndroidSimulator() },
    { id: "act-shortcuts", title: "Keyboard Shortcuts", category: "Actions", icon: "command", shortcut: "⌘/", action: () => openShortcutsModal() },
    { id: "act-export", title: "Export Active Chat to Markdown", category: "Actions", icon: "download", action: () => exportCurrentChat() },
    
    // Core 10 Tools
    { id: "tool-search", title: "Web Search: Live DuckDuckGo Query", category: "Core 10 Tools", icon: "search", action: () => { routeToView("chat"); window.location.hash = "chat"; chatInput.value = "Search web for "; chatInput.focus(); } },
    { id: "tool-open-web", title: "Open Website: Browser Navigation", category: "Core 10 Tools", icon: "globe", action: () => { routeToView("chat"); window.location.hash = "chat"; chatInput.value = "Open website https://"; chatInput.focus(); } },
    { id: "tool-open-app", title: "Open Application: Launch Desktop App", category: "Core 10 Tools", icon: "laptop", action: () => { routeToView("chat"); window.location.hash = "chat"; chatInput.value = "Open application "; chatInput.focus(); } },
    { id: "tool-files", title: "File Manager: Workspace Files", category: "Core 10 Tools", icon: "folder", action: () => { routeToView("chat"); window.location.hash = "chat"; sendMessage("List files in the workspace"); } },
    { id: "tool-term", title: "Terminal: Run Safe Shell Command", category: "Core 10 Tools", icon: "command", action: () => { routeToView("chat"); window.location.hash = "chat"; chatInput.value = "Run terminal command: git status"; chatInput.focus(); } },
    { id: "tool-calc", title: "Calculator: Safe AST Math Evaluation", category: "Core 10 Tools", icon: "calculator", action: () => { routeToView("chat"); window.location.hash = "chat"; chatInput.value = "Calculate "; chatInput.focus(); } },
    { id: "tool-weather", title: "Weather: Forecast & Atmospherics", category: "Core 10 Tools", icon: "cloud", action: () => { routeToView("chat"); window.location.hash = "chat"; sendMessage("Check current weather and forecast"); } },
    { id: "tool-screen", title: "Screenshot: Capture Screen Image", category: "Core 10 Tools", icon: "laptop", action: () => { routeToView("chat"); window.location.hash = "chat"; sendMessage("Take a screenshot"); } },
    { id: "tool-notes", title: "Notes / Memory: Persistent Storage", category: "Core 10 Tools", icon: "database", action: () => { routeToView("memory"); window.location.hash = "memory"; } },
    { id: "tool-stats", title: "System Info: Hardware & Battery Telemetry", category: "Core 10 Tools", icon: "cpu", action: () => { routeToView("chat"); window.location.hash = "chat"; sendMessage("Check battery, RAM, and live hardware telemetry"); } },
  ];

  function openCommandPalette() {
    if (!modalCommandPalette) return;
    modalCommandPalette.classList.remove("hidden");
    if (paletteSearchInput) {
      paletteSearchInput.value = "";
      paletteSelectedIndex = 0;
      renderPaletteResults("");
      paletteSearchInput.focus();
    }
  }

  function closeCommandPalette() {
    if (!modalCommandPalette) return;
    modalCommandPalette.classList.add("hidden");
  }

  function renderPaletteResults(query = "") {
    if (!paletteResultsList) return;
    const q = query.toLowerCase().trim();
    paletteItems = COMMAND_REGISTRY.filter(cmd =>
      !q || cmd.title.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q)
    );

    // Also include conversation matches
    if (q && Array.isArray(cachedConversations)) {
      const convMatches = cachedConversations.filter(c => (c.title || "").toLowerCase().includes(q));
      convMatches.slice(0, 4).forEach(c => {
        paletteItems.push({
          id: `conv-${c.id}`,
          title: `Chat: ${c.title || "Untitled"}`,
          category: "Saved Chats",
          icon: "chat",
          action: () => selectConversation(c.id, c.title)
        });
      });
    }

    if (paletteSelectedIndex >= paletteItems.length) paletteSelectedIndex = 0;

    if (paletteItems.length === 0) {
      paletteResultsList.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--color-ink-muted); font-size: 13px;">No commands matching "${escapeHtml(query)}"</div>`;
      return;
    }

    const groups = {};
    paletteItems.forEach((item, idx) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push({ ...item, flatIndex: idx });
    });

    let html = "";
    Object.keys(groups).forEach(cat => {
      html += `<div class="command-palette-group-title">${cat}</div>`;
      groups[cat].forEach(item => {
        const isSelected = item.flatIndex === paletteSelectedIndex;
        html += `
          <div class="command-palette-item ${isSelected ? "selected" : ""}" data-index="${item.flatIndex}">
            <div class="command-palette-item-left">
              ${renderIcon(item.icon, { size: 15 })}
              <span>${escapeHtml(item.title)}</span>
            </div>
            ${item.shortcut ? `<kbd class="nav-kbd" style="font-size: 10px;">${item.shortcut}</kbd>` : ""}
          </div>
        `;
      });
    });

    paletteResultsList.innerHTML = html;

    const selectedEl = paletteResultsList.querySelector(".command-palette-item.selected");
    if (selectedEl) selectedEl.scrollIntoView({ block: "nearest" });

    // Attach click handlers
    paletteResultsList.querySelectorAll(".command-palette-item").forEach(el => {
      el.addEventListener("click", () => {
        const idx = parseInt(el.getAttribute("data-index"), 10);
        executePaletteItem(idx);
      });
    });
  }

  function executePaletteItem(index) {
    const item = paletteItems[index];
    if (item && typeof item.action === "function") {
      closeCommandPalette();
      item.action();
    }
  }

  if (modalCommandPalette) {
    modalCommandPalette.addEventListener("click", (e) => {
      if (e.target === modalCommandPalette) closeCommandPalette();
    });
  }

  if (btnOpenPalette) btnOpenPalette.addEventListener("click", openCommandPalette);
  if (paletteSearchInput) {
    paletteSearchInput.addEventListener("input", (e) => {
      paletteSelectedIndex = 0;
      renderPaletteResults(e.target.value);
    });
    paletteSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (paletteItems.length > 0) {
          paletteSelectedIndex = (paletteSelectedIndex + 1) % paletteItems.length;
          renderPaletteResults(paletteSearchInput.value);
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (paletteItems.length > 0) {
          paletteSelectedIndex = (paletteSelectedIndex - 1 + paletteItems.length) % paletteItems.length;
          renderPaletteResults(paletteSearchInput.value);
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        executePaletteItem(paletteSelectedIndex);
      }
    });
  }

  // ==========================================================================
  // 14. Keyboard Shortcuts Modal & Handlers
  // ==========================================================================
  function openShortcutsModal() {
    if (modalShortcuts) modalShortcuts.classList.remove("hidden");
  }

  function closeShortcutsModal() {
    if (modalShortcuts) modalShortcuts.classList.add("hidden");
  }

  if (btnCloseShortcuts) btnCloseShortcuts.addEventListener("click", closeShortcutsModal);
  if (modalShortcuts) {
    modalShortcuts.addEventListener("click", (e) => {
      if (e.target === modalShortcuts) closeShortcutsModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCommandPalette();
      closeShortcutsModal();
      if (modalOnboarding && !modalOnboarding.classList.contains("hidden")) {
        modalOnboarding.classList.add("hidden");
        localStorage.setItem("friday_onboarded", "true");
      }
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
    const isCmd = isMac ? e.metaKey : e.ctrlKey;

    if (isCmd) {
      if (e.key.toLowerCase() === "k" || e.code === "Space") {
        e.preventDefault();
        openCommandPalette();
        return;
      }
      if (e.shiftKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        createNewConversation();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        openShortcutsModal();
        return;
      }
      if (e.key.toLowerCase() === "t") {
        e.preventDefault();
        toggleTheme();
        return;
      }
      if (e.key >= "1" && e.key <= "6") {
        e.preventDefault();
        const views = ["chat", "voice", "translate", "tasks", "dashboard", "settings"];
        const target = views[parseInt(e.key) - 1];
        if (target) {
          window.location.hash = target;
          routeToView(target);
        }
      }
    }
  });

  // ==========================================================================
  // 15. Onboarding Controller
  // ==========================================================================
  function setOnboardStep(step) {
    [1, 2, 3].forEach(s => {
      const stepEl = document.getElementById(`onboarding-step-${s}`);
      const dotEl = document.querySelector(`.onboarding-dot[data-step="${s}"]`);
      if (stepEl) stepEl.classList.toggle("hidden", s !== step);
      if (dotEl) dotEl.classList.toggle("active", s === step);
    });
  }

  async function checkOnboarding() {
    if (localStorage.getItem("friday_onboarded")) return;
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.ok) {
        const data = await res.json();
        if (!data.completed && modalOnboarding) {
          modalOnboarding.classList.remove("hidden");
          setOnboardStep(1);
        }
      }
    } catch (e) {
      console.warn("Could not check onboarding:", e);
    }
  }

  if (btnOnboardNext1) btnOnboardNext1.addEventListener("click", () => setOnboardStep(2));
  if (btnOnboardPrev2) btnOnboardPrev2.addEventListener("click", () => setOnboardStep(1));
  if (btnOnboardNext2) btnOnboardNext2.addEventListener("click", () => setOnboardStep(3));
  if (btnOnboardPrev3) btnOnboardPrev3.addEventListener("click", () => setOnboardStep(2));
  if (btnOnboardFinish) {
    btnOnboardFinish.addEventListener("click", async () => {
      const name = onboardUserNameInput ? onboardUserNameInput.value.trim() : "User";
      try {
        await fetch("/api/onboarding/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_name: name }),
        });
      } catch (e) {}
      localStorage.setItem("friday_onboarded", "true");
      if (modalOnboarding) modalOnboarding.classList.add("hidden");
      showToast({ message: `Welcome to FRIDAY, ${name}! Your console is ready.`, type: "success" });
    });
  }

  const btnCloseOnboard = document.getElementById("btn-close-onboard");
  if (btnCloseOnboard) {
    btnCloseOnboard.addEventListener("click", () => {
      if (modalOnboarding) modalOnboarding.classList.add("hidden");
      localStorage.setItem("friday_onboarded", "true");
    });
  }
  if (modalOnboarding) {
    modalOnboarding.addEventListener("click", (e) => {
      if (e.target === modalOnboarding) {
        modalOnboarding.classList.add("hidden");
        localStorage.setItem("friday_onboarded", "true");
      }
    });
  }

  // ==========================================================================
  // 16. Export Conversation Helper
  // ==========================================================================
  async function exportCurrentChat() {
    if (!currentConversationId) {
      showToast({ message: "No active conversation to export.", type: "warning" });
      return;
    }
    try {
      const res = await fetch(`/api/conversations/${currentConversationId}/export?format=markdown`);
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([data.content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || "conversation.md";
        a.click();
        URL.revokeObjectURL(url);
        showToast({ message: "Conversation exported to Markdown!", type: "success" });
      }
    } catch (e) {
      showToast({ message: "Failed to export conversation", type: "error" });
    }
  }

  // ==========================================================================
  // 17. Health Polling
  // ==========================================================================
  async function pollHealth() {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        const dot = document.querySelector(".indicator-dot");
        const statusText = document.getElementById("rail-status-text");
        if (dot && statusText) {
          if (data.status === "healthy") {
            dot.style.background = "var(--color-success)";
            statusText.textContent = "ONLINE";
          } else {
            dot.style.background = "var(--color-warning)";
            statusText.textContent = "DEGRADED";
          }
        }
      }
    } catch (e) {
      const dot = document.querySelector(".indicator-dot");
      const statusText = document.getElementById("rail-status-text");
      if (dot && statusText) {
        dot.style.background = "var(--color-danger)";
        statusText.textContent = "OFFLINE";
      }
    }
  }
  setInterval(pollHealth, 30000);

  // ==========================================================================
  // 18. Rich Markdown & Syntax Highlighter
  // ==========================================================================
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function highlightCode(code, lang) {
    let escaped = escapeHtml(code);
    escaped = escaped.replace(/(["'`])(?:(?=(\\?))\2[\s\S])*?\1/g, '<span class="syn-string">$&</span>');
    escaped = escaped.replace(/(\/\/[^\n]*|#[^\n]*)/g, '<span class="syn-comment">$&</span>');
    escaped = escaped.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="syn-number">$1</span>');
    escaped = escaped.replace(/\b(def|class|return|function|const|let|var|import|export|from|async|await|if|else|elif|for|while|try|except|finally|None|True|False|true|false|null)\b/g, '<span class="syn-keyword">$1</span>');
    return escaped;
  }

  function renderMarkdown(md) {
    if (!md) return "";

    const codeBlocks = [];
    let text = md.replace(/```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = `__CODE_BLOCK_${codeBlocks.length}__`;
      const cleanLang = lang || "plaintext";
      const highlighted = highlightCode(code.trim(), cleanLang);
      const blockHtml = `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span>${cleanLang}</span>
            <button class="code-copy-btn" data-code="${encodeURIComponent(code.trim())}">
              ${renderIcon("copy", { size: 12 })}
              <span>Copy</span>
            </button>
          </div>
          <pre><code>${highlighted}</code></pre>
        </div>
      `;
      codeBlocks.push(blockHtml);
      return id;
    });

    let html = escapeHtml(text);

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Blockquotes
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Unordered Lists
    html = html.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(?:<li>.*?<\/li>(?:\r?\n)?)+/g, (match) => `<ul>${match.trim()}</ul>`);

    // Ordered Lists (1. item, 2. item)
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ol-item">$1</li>');
    html = html.replace(/(?:<li class="ol-item">.*?<\/li>(?:\r?\n)?)+/g, (match) => `<ol>${match.trim()}</ol>`);

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="font-mono" style="background: var(--color-surface-subtle); padding: 2px 5px; border-radius: var(--radius-xs); border: 1px solid var(--color-border);">$1</code>');

    // Bold & italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Line breaks to paragraphs
    html = html.replace(/\n\n+/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');

    // Restore code blocks
    codeBlocks.forEach((block, i) => {
      html = html.replace(`__CODE_BLOCK_${i}__`, block);
    });

    // Clean up invalid block elements inside paragraphs
    html = `<p>${html}</p>`;
    html = html.replace(/<p>\s*(<(?:div|ul|ol|h[1-6]|blockquote)[\s\S]*?<\/(?:div|ul|ol|h[1-6]|blockquote)>)\s*<\/p>/gi, '$1');
    html = html.replace(/<p>\s*<\/p>/g, '');
    return html;
  }

  // Delegated copy button listener for code blocks
  document.addEventListener("click", (e) => {
    const copyBtn = e.target.closest(".code-copy-btn");
    if (copyBtn) {
      const code = decodeURIComponent(copyBtn.getAttribute("data-code") || "");
      if (code) {
        navigator.clipboard.writeText(code);
        showToast({ message: "Code copied to clipboard!", type: "success" });
      }
    }
  });

  // ==========================================================================
  // 19. Modality Bar & Ecosystem Navigation
  // ==========================================================================
  const btnModeConsole = document.getElementById("btn-mode-console");
  const btnModeLanding = document.getElementById("btn-mode-landing");
  const btnModeAndroid = document.getElementById("btn-mode-android");

  if (btnModeConsole) {
    btnModeConsole.addEventListener("click", () => {
      window.location.hash = "chat";
      routeToView("chat");
    });
  }
  if (btnModeLanding) {
    btnModeLanding.addEventListener("click", () => {
      window.location.hash = "landing";
      routeToView("landing");
    });
  }
  if (btnModeAndroid) {
    btnModeAndroid.addEventListener("click", () => {
      openAndroidSimulator();
    });
  }

  // ==========================================================================
  // 20. Landing Showcase & FRIDAY Orb Controller
  // ==========================================================================
  const landingOrb = document.getElementById("landing-friday-orb");
  const landingOrbStatusText = document.getElementById("landing-orb-status-text");
  const landingDemoQuote = document.getElementById("landing-demo-quote");
  const btnLandingStartTalk = document.getElementById("btn-landing-start-talk");
  const btnLandingOpenConsole = document.getElementById("btn-landing-open-console");
  const btnLandingLaunchConsole = document.getElementById("btn-landing-launch-console");
  const btnLandingOpenAndroid = document.getElementById("btn-landing-open-android");

  const ORB_STATES = [
    { state: "state-idle", label: "FRIDAY CORE • IDLE", quote: '"Good evening, Omkar. All systems nominal. What would you like to build today?"' },
    { state: "state-listening", label: "FRIDAY CORE • LISTENING...", quote: '"Listening intently... Ready for your next vocal command."' },
    { state: "state-thinking", label: "FRIDAY CORE • THINKING...", quote: '"Synthesizing request, evaluating neural tool sequences across ecosystem..."' },
    { state: "state-speaking", label: "FRIDAY CORE • SPEAKING", quote: '"Task dispatched. Beamed instructions to MacBook Pro and synced Universal Clipboard."' }
  ];
  let currentOrbStateIdx = 0;

  function cycleLandingOrb() {
    if (!landingOrb) return;
    currentOrbStateIdx = (currentOrbStateIdx + 1) % ORB_STATES.length;
    const current = ORB_STATES[currentOrbStateIdx];

    ORB_STATES.forEach(s => landingOrb.classList.remove(s.state));
    landingOrb.classList.add(current.state);

    if (landingOrbStatusText) landingOrbStatusText.textContent = current.label;
    if (landingDemoQuote) landingDemoQuote.textContent = current.quote;
  }

  function initLandingPage() {
    if (landingOrb) {
      landingOrb.addEventListener("click", cycleLandingOrb);
    }
    if (btnLandingStartTalk) {
      btnLandingStartTalk.addEventListener("click", () => {
        window.location.hash = "voice";
        routeToView("voice");
      });
    }
    if (btnLandingOpenConsole) {
      btnLandingOpenConsole.addEventListener("click", () => {
        window.location.hash = "chat";
        routeToView("chat");
      });
    }
    if (btnLandingLaunchConsole) {
      btnLandingLaunchConsole.addEventListener("click", () => {
        window.location.hash = "chat";
        routeToView("chat");
      });
    }
    if (btnLandingOpenAndroid) {
      btnLandingOpenAndroid.addEventListener("click", () => {
        openAndroidSimulator();
      });
    }

    // Quick prompt chips on landing page
    document.querySelectorAll(".landing-prompt-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const text = chip.textContent.trim().replace(/^"|"$/g, "");
        window.location.hash = "chat";
        routeToView("chat");
        if (chatInput) {
          chatInput.value = text;
          sendMessage(text);
        }
      });
    });
  }

  // ==========================================================================
  // 21. Neural Memory Hub Controller (CRUD, Search & Category Filters)
  // ==========================================================================
  let cachedMemories = [];
  let activeMemoryCategory = "all";

  const memoryContainer = document.getElementById("memory-cards-container");
  const memorySearchInput = document.getElementById("memory-search-input");
  const btnOpenAddMemory = document.getElementById("btn-open-add-memory");
  const modalAddMemory = document.getElementById("modal-add-memory");
  const btnCancelAddMem = document.getElementById("btn-cancel-add-mem");
  const btnCloseAddMem = document.getElementById("btn-close-add-mem");
  const btnSaveNewMem = document.getElementById("btn-save-new-mem");
  const addMemCategory = document.getElementById("add-mem-category");
  const addMemContent = document.getElementById("add-mem-content");
  const addMemImportance = document.getElementById("add-mem-importance");
  const addMemImportanceVal = document.getElementById("add-mem-importance-val");

  async function loadMemories() {
    try {
      const res = await fetch("/api/memory");
      if (res.ok) {
        cachedMemories = await res.json();
        updateMemoryCounts();
        renderMemories();
      }
    } catch (e) {
      console.warn("Could not fetch memories:", e);
    }
  }

  function updateMemoryCounts() {
    const counts = { all: cachedMemories.length, preference: 0, project: 0, note: 0, general: 0 };
    cachedMemories.forEach(m => {
      const cat = (m.category || "general").toLowerCase();
      if (counts[cat] !== undefined) counts[cat]++;
      else counts.general++;
    });

    const elAll = document.getElementById("mem-count-all");
    const elPref = document.getElementById("mem-count-pref");
    const elProj = document.getElementById("mem-count-proj");
    const elNote = document.getElementById("mem-count-note");
    const elGen = document.getElementById("mem-count-gen");

    if (elAll) elAll.textContent = counts.all;
    if (elPref) elPref.textContent = counts.preference;
    if (elProj) elProj.textContent = counts.project;
    if (elNote) elNote.textContent = counts.note;
    if (elGen) elGen.textContent = counts.general;
  }

  function renderMemories() {
    if (!memoryContainer) return;
    const query = (memorySearchInput ? memorySearchInput.value : "").toLowerCase().trim();

    const filtered = cachedMemories.filter(m => {
      const cat = (m.category || "general").toLowerCase();
      const matchCat = activeMemoryCategory === "all" || cat === activeMemoryCategory;
      const matchQuery = !query || (m.content || "").toLowerCase().includes(query) || cat.includes(query);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      memoryContainer.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; border: 1px dashed var(--color-border); border-radius: var(--radius-md); background: var(--color-surface);">
          <div style="font-size: 28px; margin-bottom: 8px;">🧠</div>
          <div style="font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: var(--color-ink);">No memories found</div>
          <div style="font-size: 12px; color: var(--color-ink-muted); margin-top: 4px;">Click "+ Add Memory" above or store facts naturally via chat or voice.</div>
        </div>
      `;
      return;
    }

    const catBadges = {
      preference: { label: "👤 PREFERENCE", color: "var(--color-primary)" },
      project: { label: "🚀 PROJECT", color: "var(--color-secondary)" },
      note: { label: "📝 NOTE", color: "#10b981" },
      general: { label: "🌐 GENERAL", color: "var(--color-ink-muted)" },
    };

    memoryContainer.innerHTML = filtered.map(m => {
      const catKey = (m.category || "general").toLowerCase();
      const badge = catBadges[catKey] || catBadges.general;
      const importancePct = Math.round(((m.importance !== undefined ? m.importance : 1.0) * 100));
      const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString() : "Active";

      return `
        <div class="memory-card">
          <div class="memory-card-header">
            <span class="memory-category-tag" style="color: ${badge.color}; border-color: ${badge.color};">
              ${escapeHtml(badge.label)}
            </span>
            <button class="btn-del-memory" data-id="${m.id}" title="Delete memory">
              ✕
            </button>
          </div>
          <div class="memory-card-content">
            ${escapeHtml(m.content)}
          </div>
          <div class="memory-card-footer">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>Score: ${m.importance !== undefined ? m.importance : 1.0}</span>
              <div class="memory-importance-bar">
                <div class="memory-importance-fill" style="width: ${importancePct}%;"></div>
              </div>
            </div>
            <span>${escapeHtml(dateStr)}</span>
          </div>
        </div>
      `;
    }).join("");

    // Wire delete buttons
    memoryContainer.querySelectorAll(".btn-del-memory").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-id");
        if (!id) return;
        try {
          const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
          if (res.ok) {
            showToast({ message: "Memory removed from long-term storage.", type: "success" });
            loadMemories();
          } else {
            showToast({ message: "Failed to delete memory.", type: "error" });
          }
        } catch (err) {
          showToast({ message: "Network error deleting memory.", type: "error" });
        }
      });
    });
  }

  function initMemoryHub() {
    // Category tabs filter
    document.querySelectorAll(".memory-tab-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        document.querySelectorAll(".memory-tab-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        activeMemoryCategory = pill.getAttribute("data-category") || "all";
        renderMemories();
      });
    });

    if (memorySearchInput) {
      memorySearchInput.addEventListener("input", () => {
        renderMemories();
      });
    }

    if (btnOpenAddMemory && modalAddMemory) {
      btnOpenAddMemory.addEventListener("click", () => {
        modalAddMemory.classList.remove("hidden");
        if (addMemContent) {
          addMemContent.value = "";
          addMemContent.focus();
        }
      });
    }

    const closeAddMemModal = () => {
      if (modalAddMemory) modalAddMemory.classList.add("hidden");
    };

    if (btnCancelAddMem) btnCancelAddMem.addEventListener("click", closeAddMemModal);
    if (btnCloseAddMem) btnCloseAddMem.addEventListener("click", closeAddMemModal);
    if (modalAddMemory) {
      modalAddMemory.addEventListener("click", (e) => {
        if (e.target === modalAddMemory) closeAddMemModal();
      });
    }

    if (addMemImportance && addMemImportanceVal) {
      addMemImportance.addEventListener("input", (e) => {
        addMemImportanceVal.textContent = parseFloat(e.target.value).toFixed(1);
      });
    }

    if (btnSaveNewMem) {
      btnSaveNewMem.addEventListener("click", async () => {
        const content = addMemContent ? addMemContent.value.trim() : "";
        if (!content) {
          showToast({ message: "Please enter memory content.", type: "warning" });
          return;
        }
        const category = addMemCategory ? addMemCategory.value : "general";
        const importance = addMemImportance ? parseFloat(addMemImportance.value) : 1.0;

        try {
          const res = await fetch("/api/memory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, category, importance }),
          });

          if (res.ok) {
            showToast({ message: "Memory saved to long-term storage!", type: "success" });
            closeAddMemModal();
            loadMemories();
          } else {
            showToast({ message: "Error saving memory to database.", type: "error" });
          }
        } catch (err) {
          showToast({ message: "Failed to connect to memory service.", type: "error" });
        }
      });
    }
  }

  // ==========================================================================
  // 22. Device Continuity & Universal Clipboard Controller
  // ==========================================================================
  const clipboardLivePreview = document.getElementById("clipboard-live-preview");
  const clipboardSourceTag = document.getElementById("clipboard-source-tag");
  const btnCopyClipboard = document.getElementById("btn-copy-clipboard");
  const btnSyncToMac = document.getElementById("btn-sync-to-mac");
  const btnSyncToAndroid = document.getElementById("btn-sync-to-android");
  const clipboardBroadcastInput = document.getElementById("clipboard-broadcast-input");
  const btnBroadcastClipboard = document.getElementById("btn-broadcast-clipboard");
  const btnRefreshDevices = document.getElementById("btn-refresh-devices");
  const btnDevicesOpenAndroid = document.getElementById("btn-devices-open-android");

  async function loadDevices() {
    try {
      const [devRes, clipRes] = await Promise.all([
        fetch("/api/devices"),
        fetch("/api/devices/clipboard")
      ]);

      if (clipRes.ok) {
        const clipData = await clipRes.json();
        if (clipboardLivePreview && clipData.content) {
          clipboardLivePreview.textContent = clipData.content;
        }
        if (clipboardSourceTag && clipData.source_device) {
          clipboardSourceTag.textContent = `Source: ${clipData.source_device}`;
        }
      }
    } catch (e) {
      console.warn("Could not load continuity status:", e);
    }
  }

  function initDeviceContinuity() {
    if (btnRefreshDevices) {
      btnRefreshDevices.addEventListener("click", () => {
        loadDevices();
        showToast({ message: "Continuity ecosystem refreshed.", type: "info" });
      });
    }

    if (btnCopyClipboard && clipboardLivePreview) {
      btnCopyClipboard.addEventListener("click", () => {
        const text = clipboardLivePreview.textContent.trim();
        navigator.clipboard.writeText(text);
        showToast({ message: "Universal clipboard copied to local clipboard!", type: "success" });
      });
    }

    if (btnBroadcastClipboard && clipboardBroadcastInput) {
      btnBroadcastClipboard.addEventListener("click", async () => {
        const text = clipboardBroadcastInput.value.trim();
        if (!text) {
          showToast({ message: "Type text to broadcast to ecosystem.", type: "warning" });
          return;
        }

        try {
          const res = await fetch("/api/devices/clipboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text, source_device: "Web Console" }),
          });

          if (res.ok) {
            showToast({ message: "Broadcasted to all connected devices!", type: "success" });
            if (clipboardLivePreview) clipboardLivePreview.textContent = text;
            if (clipboardSourceTag) clipboardSourceTag.textContent = "Source: Web Console";
            clipboardBroadcastInput.value = "";
          }
        } catch (e) {
          showToast({ message: "Failed to broadcast clipboard text.", type: "error" });
        }
      });
    }

    if (btnSyncToMac) {
      btnSyncToMac.addEventListener("click", async () => {
        const text = clipboardLivePreview ? clipboardLivePreview.textContent.trim() : "";
        try {
          const res = await fetch("/api/devices/handover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target_device: "mac",
              action: "paste_clipboard",
              payload: { content: text }
            }),
          });
          if (res.ok) {
            showToast({ message: "Beamed clipboard directly to MacBook Pro!", type: "success" });
          }
        } catch (e) {
          showToast({ message: "Could not beam to MacBook Pro.", type: "error" });
        }
      });
    }

    if (btnSyncToAndroid) {
      btnSyncToAndroid.addEventListener("click", async () => {
        const text = clipboardLivePreview ? clipboardLivePreview.textContent.trim() : "";
        try {
          const res = await fetch("/api/devices/handover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target_device: "android",
              action: "paste_clipboard",
              payload: { content: text }
            }),
          });
          if (res.ok) {
            showToast({ message: "Beamed clipboard directly to Android Companion!", type: "success" });
          }
        } catch (e) {
          showToast({ message: "Could not beam to Android.", type: "error" });
        }
      });
    }

    if (btnDevicesOpenAndroid) {
      btnDevicesOpenAndroid.addEventListener("click", openAndroidSimulator);
    }
  }

  // ==========================================================================
  // 23. Android Companion Simulator Controller
  // ==========================================================================
  const modalAndroidSim = document.getElementById("modal-android-companion");
  const btnCloseAndroidSim = document.getElementById("btn-close-android-sim");
  const btnOpenAndroidPreview = document.getElementById("btn-open-android-preview");
  const androidOrb = document.getElementById("android-orb");
  const androidOrbCaption = document.getElementById("android-orb-caption");
  const androidSimOutput = document.getElementById("android-sim-output");
  const btnAndroidMic = document.getElementById("btn-android-mic");

  function openAndroidSimulator() {
    if (modalAndroidSim) modalAndroidSim.classList.remove("hidden");
  }

  function closeAndroidSimulator() {
    if (modalAndroidSim) modalAndroidSim.classList.add("hidden");
  }

  let androidTorchOn = false;

  function initAndroidSimulator() {
    if (btnOpenAndroidPreview) btnOpenAndroidPreview.addEventListener("click", openAndroidSimulator);
    if (btnCloseAndroidSim) btnCloseAndroidSim.addEventListener("click", closeAndroidSimulator);
    if (modalAndroidSim) {
      modalAndroidSim.addEventListener("click", (e) => {
        if (e.target === modalAndroidSim) closeAndroidSimulator();
      });
    }

    // Android orb state cycle on tap
    if (androidOrb) {
      androidOrb.addEventListener("click", () => {
        if (androidOrb.classList.contains("state-idle")) {
          androidOrb.className = "friday-orb friday-orb-small state-listening";
          if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon cyan" style="width: 5px; height: 5px;"></span><span>LISTENING...</span>`;
          if (androidSimOutput) androidSimOutput.textContent = "Listening on Android...";
        } else if (androidOrb.classList.contains("state-listening")) {
          androidOrb.className = "friday-orb friday-orb-small state-thinking";
          if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon amber" style="width: 5px; height: 5px;"></span><span>THINKING...</span>`;
          if (androidSimOutput) androidSimOutput.textContent = "Evaluating command with Laya Router...";
        } else if (androidOrb.classList.contains("state-thinking")) {
          androidOrb.className = "friday-orb friday-orb-small state-speaking";
          if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon green" style="width: 5px; height: 5px;"></span><span>SPEAKING</span>`;
          if (androidSimOutput) androidSimOutput.textContent = '"Actions completed. All devices synchronized."';
        } else {
          androidOrb.className = "friday-orb friday-orb-small state-idle";
          if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon cyan" style="width: 5px; height: 5px;"></span><span>ANDROID READY</span>`;
          if (androidSimOutput) androidSimOutput.textContent = "Tap mic below to speak to FRIDAY...";
        }
      });
    }

    // Android quick action tool chips
    document.querySelectorAll(".android-tool-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const tool = chip.getAttribute("data-tool");
        if (tool === "torch") {
          androidTorchOn = !androidTorchOn;
          chip.textContent = androidTorchOn ? "💡 Torch: ON" : "💡 Toggle Torch";
          if (androidSimOutput) {
            androidSimOutput.textContent = androidTorchOn
              ? "🔦 Hardware Action: Rear Flashlight turned ON."
              : "🔦 Hardware Action: Rear Flashlight turned OFF.";
          }
          showToast({ message: `Android Flashlight ${androidTorchOn ? "Enabled" : "Disabled"}`, type: "info" });
        } else if (tool === "weather") {
          if (androidSimOutput) {
            androidSimOutput.textContent = "⛅ Local Weather: 24°C, Clear skies in Mumbai, Winds 12 km/h.";
          }
        } else if (tool === "notes") {
          if (androidSimOutput) {
            androidSimOutput.textContent = "📝 Quick Note created and synced to FRIDAY Neural Memory.";
          }
          showToast({ message: "Note synced to Mac & Web", type: "success" });
        } else if (tool === "telemetry") {
          if (androidSimOutput) {
            androidSimOutput.textContent = "📊 Battery: 92% • RAM: 4.8GB / 8GB • Network: 5G Ultra • Latency: 14ms";
          }
        }
      });
    });

    // Android Mic Tap-to-Talk Simulation
    if (btnAndroidMic) {
      btnAndroidMic.addEventListener("click", () => {
        if (!androidOrb) return;
        androidOrb.className = "friday-orb friday-orb-small state-listening";
        if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon cyan" style="width: 5px; height: 5px;"></span><span>LISTENING...</span>`;
        if (androidSimOutput) androidSimOutput.textContent = "Listening to vocal prompt...";

        setTimeout(() => {
          androidOrb.className = "friday-orb friday-orb-small state-thinking";
          if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon amber" style="width: 5px; height: 5px;"></span><span>THINKING...</span>`;
          if (androidSimOutput) androidSimOutput.textContent = "Recognized: 'Send note to my Mac' — Routing to macOS...";
        }, 1200);

        setTimeout(() => {
          androidOrb.className = "friday-orb friday-orb-small state-speaking";
          if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon green" style="width: 5px; height: 5px;"></span><span>SPEAKING</span>`;
          if (androidSimOutput) androidSimOutput.textContent = '"Note beamed to MacBook Pro via Universal Continuity!"';
          showToast({ message: "Handover dispatched to Mac!", type: "success" });
        }, 2500);

        setTimeout(() => {
          androidOrb.className = "friday-orb friday-orb-small state-idle";
          if (androidOrbCaption) androidOrbCaption.innerHTML = `<span class="pulse-beacon cyan" style="width: 5px; height: 5px;"></span><span>ANDROID READY</span>`;
        }, 5000);
      });
    }
  }

  // Initial Route & Load
  initLandingPage();
  initMemoryHub();
  initDeviceContinuity();
  initAndroidSimulator();
  hydrateIcons();
  routeToView(window.location.hash || "chat");
  loadConversations();
  checkOnboarding();
  pollHealth();
});
