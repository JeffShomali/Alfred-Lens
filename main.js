const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Keep a global reference of the window object
let mainWindow = null;
let tray = null;
let isQuitting = false;
let commandKeyTimer = null;
let commandKeyPressed = false;
let commandKeyStartTime = null;

// Configuration
const CONFIG = {
  COMMAND_HOLD_DURATION: 5000, // 5 seconds
  WINDOW_WIDTH_RATIO: 0.8, // 80% of screen width
  WINDOW_HEIGHT_RATIO: 0.8, // 80% of screen height
  MAX_WIDTH: 1400,
  MAX_HEIGHT: 900
};

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      showWindow();
    }
  });
}

// Enable live reload for Electron
if (process.argv.includes('--dev')) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

function createWindow() {
  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Calculate window dimensions (80% of screen, with max limits)
  const windowWidth = Math.min(Math.floor(screenWidth * CONFIG.WINDOW_WIDTH_RATIO), CONFIG.MAX_WIDTH);
  const windowHeight = Math.min(Math.floor(screenHeight * CONFIG.WINDOW_HEIGHT_RATIO), CONFIG.MAX_HEIGHT);
  
  // Center the window
  const x = Math.floor((screenWidth - windowWidth) / 2);
  const y = Math.floor((screenHeight - windowHeight) / 2);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: x,
    y: y,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    hasShadow: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  });

  mainWindow.loadFile('renderer/index.html');

  // Hide window when it loses focus
  mainWindow.on('blur', () => {
    hideWindow();
  });

  // Prevent window from being destroyed, just hide it
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      hideWindow();
    }
  });

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createTray() {
  // Create tray icon
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  
  // Check if icon exists, if not create a placeholder
  if (!fs.existsSync(iconPath)) {
    // Create assets directory if it doesn't exist
    const assetsDir = path.join(__dirname, 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Use a default system icon for now
    tray = new Tray(nativeImage.createEmpty());
  } else {
    tray = new Tray(iconPath);
  }

  tray.setToolTip('Alfred Snippets Overflow');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Snippets',
      click: () => showWindow()
    },
    {
      type: 'separator'
    },
    {
      label: 'Settings',
      click: () => {
        // Open settings window
        showWindow();
        mainWindow.webContents.send('open-settings');
      }
    },
    {
      label: 'About',
      click: () => {
        // Show about dialog
        const { dialog } = require('electron');
        dialog.showMessageBox({
          type: 'info',
          title: 'About Alfred Snippets Overflow',
          message: 'Alfred Snippets Overflow v1.0.0',
          detail: 'A lightweight macOS tray application for quick access to Alfred snippets.\n\nCreated with ❤️ for productivity',
          buttons: ['OK']
        });
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Launch at Startup',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: true
        });
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  
  // Show window on tray icon click
  tray.on('click', () => {
    showWindow();
  });
}

function showWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send('window-shown');
  }
}

function hideWindow() {
  if (mainWindow) {
    mainWindow.hide();
    mainWindow.webContents.send('window-hidden');
  }
}

function setupGlobalShortcuts() {
  // Use the shortcuts manager for better handling
  const ShortcutManager = require('./lib/shortcuts');
  const shortcutManager = new ShortcutManager(mainWindow);
  
  // Get preferences
  const Store = require('electron-store');
  const store = new Store();
  const preferences = store.get('preferences', {
    shortcut: 'Command+Shift+S',
    holdDuration: 5000
  });
  
  // Initialize shortcuts
  shortcutManager.initialize(preferences);
  
  // Store reference for updates
  global.shortcutManager = shortcutManager;
}

function setupIpcHandlers() {
  // Handle window control from renderer
  ipcMain.handle('hide-window', () => {
    hideWindow();
  });

  ipcMain.handle('show-window', () => {
    showWindow();
  });

  // Handle clipboard operations
  ipcMain.handle('copy-to-clipboard', (event, text) => {
    clipboard.writeText(text);
    return true;
  });

  ipcMain.handle('get-clipboard', () => {
    return clipboard.readText();
  });

  // Handle snippet operations
  ipcMain.handle('load-snippets', async () => {
    const snippetsLoader = require('./lib/snippets');
    return await snippetsLoader.loadSnippets();
  });

  ipcMain.handle('search-snippets', async (event, query) => {
    const snippetsLoader = require('./lib/snippets');
    return await snippetsLoader.searchSnippets(query);
  });

  // Handle preferences
  ipcMain.handle('get-preferences', () => {
    const Store = require('electron-store');
    const store = new Store();
    return store.get('preferences', {
      theme: 'auto',
      shortcut: 'Command+Shift+S',
      holdDuration: 5000
    });
  });

  ipcMain.handle('set-preferences', (event, preferences) => {
    const Store = require('electron-store');
    const store = new Store();
    store.set('preferences', preferences);
    return true;
  });

  // Handle app info
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  createTray();
  setupGlobalShortcuts();
  setupIpcHandlers();

  // Set the app to stay active even when all windows are closed
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running in the tray
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  // In development, ignore certificate errors
  if (process.argv.includes('--dev')) {
    event.preventDefault();
    callback(true);
  } else {
    // In production, use default behavior
    callback(false);
  }
});

// Prevent window from being garbage collected
app.on('before-quit', () => {
  isQuitting = true;
});