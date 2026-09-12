/**
 * FRIDAY — Local Intelligence Console (v2.5)
 * Architecture: Hash Router, Yellow Brutalism Design System, Trust Ledger, and Permission Center.
 */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

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

  // Modals
  const modalToolConfirm = document.getElementById("modal-tool-confirm");
  const modalConfirmDetails = document.getElementById("modal-confirm-details");
  const btnApproveAction = document.getElementById("btn-approve-action");
  const btnRejectAction = document.getElementById("btn-reject-action");
  let pendingToolApprovalResolver = null;

  // ==========================================================================
  // 2. Hash Router Engine (#chat, #voice, #translate, #tasks, #dashboard, #settings, #about)
  // ==========================================================================
  const VIEW_TITLES = {
    chat: "ASSISTANT CHAT",
    voice: "VOICE MODE",
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

    // Highlight button in settings
    [btnSetDark, btnSetLight, btnSetSystem].forEach((b) => {
      if (b) b.classList.remove("btn-brutal-primary");
    });
    if (themeName === "dark" && btnSetDark) btnSetDark.classList.add("btn-brutal-primary");
    if (themeName === "light" && btnSetLight) btnSetLight.classList.add("btn-brutal-primary");
    if (themeName === "system" && btnSetSystem) btnSetSystem.classList.add("btn-brutal-primary");
  }

  btnToggleTheme.addEventListener("click", () => {
    const next = activeTheme === "dark" ? "light" : activeTheme === "light" ? "system" : "dark";
    applyTheme(next);
  });

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
      convList.innerHTML = `<div style="padding: 12px; font-size: 11px; color: var(--color-ink-muted); text-align: center;">No saved chats</div>`;
      return;
    }

    filtered.forEach((c) => {
      const div = document.createElement("div");
      div.className = `conv-item ${c.id === currentConversationId ? "active" : ""}`;
      div.innerHTML = `
        <div class="conv-item-title" title="${escapeHtml(c.title)}">${escapeHtml(c.title)}</div>
        <div class="conv-item-actions">
          <button class="btn-conv-action delete" title="Delete chat">✕</button>
        </div>
      `;
      div.querySelector(".conv-item-title").addEventListener("click", () => {
        selectConversation(c.id, c.title);
      });
      div.querySelector(".btn-conv-action.delete").addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${c.title}"?`)) {
          await fetch(`/api/conversations/${c.id}`, { method: "DELETE" });
          if (c.id === currentConversationId) {
            currentConversationId = null;
            chatMessages.innerHTML = "";
          }
          await loadConversations();
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
    msgs.forEach((m) => {
      if (m.role === "user") appendUserMessage(m.content);
      else if (m.role === "assistant") {
        const card = createAssistantCard();
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
        chatMessages.innerHTML = "";
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

  function createAssistantCard() {
    const row = document.createElement("div");
    row.className = "message-row";
    row.innerHTML = `
      <div class="message-card assistant">
        <div class="msg-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="color: var(--color-primary);">FRIDAY</strong>
            <span class="brutal-badge local" style="padding: 1px 4px; font-size: 9px;">ON-DEVICE</span>
          </div>
          <span class="msg-time font-mono">${new Date().toLocaleTimeString()}</span>
        </div>
        <div class="trace-container"></div>
        <div class="tool-widgets-container"></div>
        <div class="msg-content"></div>
      </div>
    `;
    chatMessages.appendChild(row);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return row.querySelector(".message-card");
  }

  function renderToolWidget(toolName, args, result) {
    const div = document.createElement("div");
    div.className = "tool-widget-card";
    const locality = toolName === "web_search" || toolName === "weather" ? "NETWORK" : "DEVICE";

    div.innerHTML = `
      <div class="tool-widget-header">
        <span>TOOL: <strong>${escapeHtml(toolName)}</strong></span>
        <span class="brutal-badge ${locality.toLowerCase()}">${locality}</span>
      </div>
      <div class="tool-widget-body">
        <pre style="margin-bottom: 6px; color: var(--color-ink-muted);">ARG: ${escapeHtml(JSON.stringify(args))}</pre>
        <pre style="background: var(--color-surface); padding: 8px; border: 1px solid var(--color-border); overflow-x: auto;">${escapeHtml(result || "Executed.")}</pre>
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
    drafts.chat = "";

    const card = createAssistantCard();
    const traceContainer = card.querySelector(".trace-container");
    const widgetsContainer = card.querySelector(".tool-widgets-container");
    const msgContent = card.querySelector(".msg-content");

    // Live Execution Trace
    traceContainer.innerHTML = `
      <div class="execution-trace-pill">
        <span class="spinner"></span>
        <span>Thinking locally (gemma2:2b / go1.0)...</span>
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
            } else if (ev.type === "tool_started") {
              const locality = ev.tool === "web_search" || ev.tool === "weather" ? "NETWORK" : "DEVICE";
              traceContainer.innerHTML = `
                <div class="execution-trace-pill">
                  <span class="spinner"></span>
                  <span>Executing tool: ${escapeHtml(ev.tool)}...</span>
                </div>
              `;
            } else if (ev.type === "tool_completed") {
              const locality = ev.tool === "web_search" || ev.tool === "weather" ? "NETWORK" : "DEVICE";
              const dur = Math.round(performance.now() - startTime);
              recordAction(ev.tool, ev.arguments, locality, dur, "SUCCESS");
              widgetsContainer.appendChild(renderToolWidget(ev.tool, ev.arguments, ev.result));
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

  function initVoiceWebSocket() {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    try {
      voiceWs = new WebSocket(`${proto}//${window.location.host}/ws/voice`);
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
    } catch (e) {}
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
    currentAudio.play().catch(() => playNextVoiceAudio());
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
        if (ev.results[0].isFinal && transcript.trim()) {
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
      const [resHealth, resTools, resMemory] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/tools"),
        fetch("/api/memory"),
      ]);

      if (resHealth.ok) {
        const h = await resHealth.json();
        if (dashLlmStatus) dashLlmStatus.textContent = h.llm_model || "gemma2:2b";
      }
      if (resTools.ok) {
        const t = await resTools.json();
        if (dashToolsCount) dashToolsCount.textContent = (t.tools || []).length;
      }
      if (resMemory.ok) {
        const m = await resMemory.json();
        if (dashMemoryCount) dashMemoryCount.textContent = (m.memories || []).length;
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
  // 13. Universal Keyboard Shortcuts (⌘1..6, ⌘K, Enter)
  // ==========================================================================
  window.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "6") {
      e.preventDefault();
      const views = ["chat", "voice", "translate", "tasks", "dashboard", "settings"];
      const target = views[parseInt(e.key) - 1];
      if (target) {
        window.location.hash = target;
        routeToView(target);
      }
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      createNewConversation();
    }
  });

  // ==========================================================================
  // 14. Markdown & Helper Utilities
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

  function renderMarkdown(md) {
    if (!md) return "";
    let html = escapeHtml(md);

    // Code blocks
    html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre class="font-mono" style="background: #000000; color: #FFE600; padding: 12px; border: 2px solid var(--color-border); margin: 8px 0; overflow-x: auto;"><code>$2</code></pre>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="font-mono" style="background: var(--color-surface-subtle); padding: 2px 5px; border: 1px solid var(--color-border);">$1</code>');

    // Bold & italics
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Line breaks to paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  }

  // Initial Route & Load
  routeToView(window.location.hash || "chat");
  loadConversations();
});
