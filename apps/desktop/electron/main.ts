import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, shell, session } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;

const DEV_ORIGIN = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const BACKEND_ORIGIN = process.env.FRIDAY_API_URL || 'http://localhost:8000';

/**
 * Read the API token the backend generated.
 *
 * A packaged build loads the UI over file://, which reports an Origin of "null".
 * The backend treats that as untrusted (it has to: a sandboxed iframe and a
 * local HTML file both report "null"), so the renderer cannot authenticate by
 * origin and needs the shared token instead. Main runs as the same user as the
 * server, so it can read the 0600 token file directly.
 */
function readApiToken(): string {
  if (process.env.FRIDAY_API_TOKEN) return process.env.FRIDAY_API_TOKEN;
  const tokenFile = process.env.FRIDAY_TOKEN_FILE || path.join(os.homedir(), '.friday', 'api_token');
  try {
    return fs.readFileSync(tokenFile, 'utf-8').trim();
  } catch {
    // Not fatal: in dev the renderer runs on an allowlisted origin and does not
    // need a token at all.
    return '';
  }
}

function createWindow() {
  const apiToken = readApiToken();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    title: 'FRIDAY — AI Operating Assistant',
    backgroundColor: '#060913',
    // Native macOS Glassmorphism & Frameless Traffic Lights
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 18 },
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    visualEffectState: 'active',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // sandbox was false, which left the renderer with a full Node-capable
      // process behind it. FRIDAY renders model output and remote content, so a
      // single XSS was a path to host compromise. The preload no longer needs
      // Node: the token is passed in as an argument below.
      sandbox: true,
      webSecurity: true,
      // Deny window.open-created popups Node access as well.
      nodeIntegrationInSubFrames: false,
      additionalArguments: [`--friday-api-token=${apiToken}`]
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  const prodPath = path.join(__dirname, '../dist/index.html');

  if (isDev) {
    mainWindow.loadURL(DEV_ORIGIN);
  } else if (fs.existsSync(prodPath)) {
    mainWindow.loadFile(prodPath);
  } else {
    // Previously fell back to the dev server URL, so a packaged build with a
    // missing bundle silently tried to load http://localhost:5173 and showed a
    // blank window. Fail visibly instead.
    mainWindow.loadURL(
      'data:text/html,' +
        encodeURIComponent(
          '<body style="background:#060913;color:#fff;font:14px system-ui;padding:40px">' +
            '<h2>FRIDAY build incomplete</h2>' +
            '<p>The renderer bundle was not found. Run <code>npm run build</code> before packaging.</p>' +
            '</body>'
        )
    );
  }

  // Refuse in-app navigation away from the app's own content. Without this an
  // injected link or a script-driven location change could load an attacker page
  // inside the trusted window.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedInternalUrl(url)) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  // Never open a second Electron window; hand external links to the real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });

  // Block attaching a webview with its own (possibly unsafe) preferences.
  mainWindow.webContents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function isAllowedInternalUrl(url: string): boolean {
  try {
    const target = new URL(url);
    if (target.protocol === 'file:') return true;
    return target.origin === new URL(DEV_ORIGIN).origin || target.origin === new URL(BACKEND_ORIGIN).origin;
  } catch {
    return false;
  }
}

/**
 * Answer permission prompts explicitly.
 *
 * Electron grants most permissions automatically when no handler is set, so the
 * renderer could silently obtain geolocation, camera, notifications and more.
 * FRIDAY genuinely needs the microphone for voice input; nothing else.
 */
function installPermissionHandlers() {
  const allowed = new Set(['media', 'audioCapture', 'clipboard-sanitized-write']);

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const url = webContents?.getURL() ?? '';
    callback(allowed.has(permission) && isAllowedInternalUrl(url));
  });

  session.defaultSession.setPermissionCheckHandler((_wc, permission, requestingOrigin) => {
    if (!allowed.has(permission)) return false;
    return requestingOrigin === 'null' || isAllowedInternalUrl(requestingOrigin);
  });
}

function createTray() {
  try {
    // A 16x16 template image. nativeImage.createEmpty() produced a zero-sized
    // icon, so the tray entry existed but was invisible in the menu bar.
    const iconPath = path.join(__dirname, '../build/trayIconTemplate.png');
    const icon = fs.existsSync(iconPath)
      ? nativeImage.createFromPath(iconPath)
      : nativeImage.createFromDataURL(FALLBACK_TRAY_ICON);
    if (process.platform === 'darwin') icon.setTemplateImage(true);
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      { label: 'FRIDAY AI Assistant', enabled: false },
      { type: 'separator' },
      {
        label: 'Show/Hide Cockpit',
        accelerator: 'CmdOrCtrl+Shift+Space',
        click: toggleMainWindow
      },
      { type: 'separator' },
      { label: 'Quit FRIDAY', click: () => app.quit() }
    ]);

    tray.setToolTip('FRIDAY AI Assistant');
    tray.setContextMenu(contextMenu);
    tray.on('click', toggleMainWindow);
  } catch (err) {
    console.warn('Tray initialization:', err);
  }
}

// Minimal 16x16 filled circle, so the menu bar entry is visible without
// shipping a binary asset.
const FALLBACK_TRAY_ICON =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
      '<circle cx="8" cy="8" r="6" fill="black"/></svg>'
  ).toString('base64');

function toggleMainWindow() {
  if (!mainWindow) {
    createWindow();
    return;
  }
  if (mainWindow.isVisible()) {
    if (mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.focus();
    }
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
}

app.whenReady().then(() => {
  installPermissionHandlers();
  createWindow();
  createTray();

  // Register Global Summon Hotkey (Command + Shift + Space on Mac)
  globalShortcut.register('CommandOrControl+Shift+Space', toggleMainWindow);
});

// Deny any additional renderer that tries to enable unsafe preferences.
app.on('web-contents-created', (_event, contents) => {
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedInternalUrl(url)) event.preventDefault();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    mainWindow?.show();
    mainWindow?.focus();
  }
});
