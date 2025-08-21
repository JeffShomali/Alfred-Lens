/**
 * Main Process Entry Point
 * Initializes and coordinates all main process modules
 */

const { app, globalShortcut } = require('electron');
const WindowManager = require('./windowManager');
const TrayManager = require('./trayManager');
const IpcHandlers = require('./ipcHandlers');
const SnippetsLoader = require('./snippetsLoader');
const ShortcutManager = require('./shortcutManager');
const SettingsManager = require('./settingsManager');

class Application {
  constructor() {
    this.windowManager = null;
    this.trayManager = null;
    this.ipcHandlers = null;
    this.snippetsLoader = null;
    this.shortcutManager = null;
    this.settingsManager = null;
    this.isDev = process.argv.includes('--dev');
  }

  /**
   * Initialize the application
   */
  async init() {
    // Prevent multiple instances
    if (!this.requestSingleInstance()) {
      app.quit();
      return;
    }

    // Set up app event handlers
    this.setupAppEvents();

    // Wait for app to be ready
    await app.whenReady();

    // Initialize all modules
    this.initializeModules();

    // Enable dev tools if in development mode
    if (this.isDev) {
      this.enableDevMode();
    }
  }

  /**
   * Request single instance lock
   */
  requestSingleInstance() {
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock) {
      return false;
    }

    app.on('second-instance', () => {
      // Someone tried to run a second instance, focus our window instead
      if (this.windowManager) {
        this.windowManager.showWindow();
      }
    });

    return true;
  }

  /**
   * Initialize all application modules
   */
  initializeModules() {
    // Create settings manager first
    this.settingsManager = new SettingsManager();
    
    // Create snippets loader
    this.snippetsLoader = new SnippetsLoader();

    // Create window manager with settings
    this.windowManager = new WindowManager(this.settingsManager);
    this.windowManager.createWindow();

    // Create tray manager
    this.trayManager = new TrayManager(this.windowManager);
    this.trayManager.createTray();

    // Set up IPC handlers with settings manager
    this.ipcHandlers = new IpcHandlers(this.windowManager, this.snippetsLoader, this.settingsManager);
    this.ipcHandlers.registerHandlers();

    // Set up global shortcuts with settings
    this.shortcutManager = new ShortcutManager(this.windowManager, this.settingsManager);
    this.shortcutManager.registerShortcuts();
    
    // Initialize settings manager with other managers
    this.settingsManager.init(this.windowManager, this.shortcutManager);
  }

  /**
   * Set up application event handlers
   */
  setupAppEvents() {
    // Handle app activation (macOS)
    app.on('activate', () => {
      if (this.windowManager && !this.windowManager.getWindow()) {
        this.windowManager.createWindow();
      }
    });

    // Handle window-all-closed event
    app.on('window-all-closed', () => {
      // On macOS, keep the app running in the tray
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle before-quit event
    app.on('before-quit', () => {
      if (this.windowManager) {
        this.windowManager.setQuitting(true);
      }
    });

    // Handle will-quit event
    app.on('will-quit', () => {
      this.cleanup();
    });

    // Handle certificate errors (development)
    app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
      if (this.isDev) {
        event.preventDefault();
        callback(true);
      } else {
        callback(false);
      }
    });
  }

  /**
   * Enable development mode features
   */
  enableDevMode() {
    // Enable live reload
    try {
      require('electron-reload')(__dirname, {
        electron: require('path').join(__dirname, '../../node_modules/.bin/electron'),
        hardResetMethod: 'exit'
      });
    } catch (error) {
      console.log('Failed to enable electron-reload:', error);
    }

    // Open DevTools
    if (this.windowManager) {
      this.windowManager.openDevTools();
    }
  }

  /**
   * Clean up resources before quitting
   */
  cleanup() {
    // Unregister all shortcuts
    if (this.shortcutManager) {
      this.shortcutManager.unregisterShortcuts();
    }
    globalShortcut.unregisterAll();

    // Unregister IPC handlers
    if (this.ipcHandlers) {
      this.ipcHandlers.unregisterHandlers();
    }

    // Destroy tray
    if (this.trayManager) {
      this.trayManager.destroy();
    }
  }
}

// Start the application
const application = new Application();
application.init().catch(error => {
  console.error('Failed to initialize application:', error);
  app.quit();
});

// Export for testing purposes
module.exports = Application;