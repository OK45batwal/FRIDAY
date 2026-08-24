import { app, BrowserWindow, globalShortcut, Tray, Menu, nativeImage, shell, session } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';
import os from 'os';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let backendProcess: ChildProcess | null = null;

const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;

const DEV_ORIGIN = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
const BACKEND_ORIGIN = process.env.FRIDAY_API_URL || 'http://localhost:8000';

/**
 * Check if the backend is already responding to HTTP requests.
 */
function isBackendHealthy(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:8000/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * Automatically launch the backend service sidecar if not already running.
 */
async function ensureBackendRunning() {
  const healthy = await isBackendHealthy();
  if (healthy) {
    console.log('✅ FRIDAY Core backend already running on http://127.0.0.1:8000');
    return;
  }

  console.log('🚀 Spawning FRIDAY Core backend sidecar process...');

  const possiblePythonPaths = [
    // Packaged application path
    path.join(process.resourcesPath, 'services', 'core', 'venv', 'bin', 'python'),
    path.join(process.resourcesPath, 'services', 'core', 'venv', 'Scripts', 'python.exe'),
    // Development repository path
    path.join(__dirname, '..', '..', '..', 'services', 'core', 'venv', 'bin', 'python'),
    path.join(__dirname, '..', '..', '..', 'services', 'core', 'venv', 'Scripts', 'python.exe'),
    // System PATH fallbacks
    'python3',
    'python'
  ];

  let pythonExec = 'python3';
  for (const p of possiblePythonPaths) {
    if (fs.existsSync(p)) {
      pythonExec = p;
      break;
    }
  }

  const projectRoot = isDev
    ? path.resolve(__dirname, '..', '..', '..')
    : path.join(process.resourcesPath);

  try {
    backendProcess = spawn(pythonExec, ['-m', 'services.core.app.main'], {
      cwd: projectRoot,
      env: {
        ...process.env,
        PYTHONPATH: projectRoot,
        HOST: '127.0.0.1',
        PORT: '8000'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProcess.stdout?.on('data', (data) => {
      console.log(`[Core] ${data.toString().trim()}`);
    });

    backendProcess.stderr?.on('data', (data) => {
      console.warn(`[Core Warn] ${data.toString().trim()}`);
    });

    backendProcess.on('exit', (code) => {
      console.log(`[Core] Backend process exited with code ${code}`);
      backendProcess = null;
    });

    // Wait up to 10 seconds for backend to come online
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await isBackendHealthy()) {
        console.log('✅ FRIDAY Core backend sidecar initialized and healthy!');
        break;
      }
    }
  } catch (err) {
    console.error('Failed to spawn backend process:', err);
  }
}

/**
 * Read the API token the backend generated.
 */
function readApiToken(): string {
  if (process.env.FRIDAY_API_TOKEN) return process.env.FRIDAY_API_TOKEN;
  const tokenFile = process.env.FRIDAY_TOKEN_FILE || path.join(os.homedir(), '.friday', 'api_token');
  try {
    return fs.readFileSync(tokenFile, 'utf-8').trim();
  } catch {
    return '';
  }
}
function createWindow() {
  const apiToken = readApiToken();
  const iconPath = path.join(__dirname, '../public/icon.png');


  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 680,
    title: 'FRIDAY — AI Operating Assistant',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
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

app.whenReady().then(async () => {
  await ensureBackendRunning();
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
  if (backendProcess) {
    console.log('🛑 Shutting down FRIDAY backend sidecar...');
    try {
      backendProcess.kill('SIGTERM');
    } catch {
      // Process may already have terminated
    }
    backendProcess = null;
  }
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
