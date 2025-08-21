/**
 * Window Manager
 * Handles window creation and lifecycle
 */

const { BrowserWindow, screen } = require('electron');
const path = require('path');
const config = require('../config/app.config');

class WindowManager {
  constructor(settingsManager) {
    this.mainWindow = null;
    this.isQuitting = false;
    this.settingsManager = settingsManager;
  }

  /**
   * Create the main application window
   */
  createWindow() {
    const { window: windowConfig } = config;
    const dimensions = this.calculateWindowDimensions();

    this.mainWindow = new BrowserWindow({
      width: dimensions.width,
      height: dimensions.height,
      x: dimensions.x,
      y: dimensions.y,
      show: false,
      frame: windowConfig.frame,
      transparent: windowConfig.transparent,
      alwaysOnTop: windowConfig.alwaysOnTop,
      resizable: windowConfig.resizable,
      movable: windowConfig.movable,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      hasShadow: windowConfig.hasShadow,
      backgroundColor: '#ffffff',
      titleBarStyle: 'hiddenInset',
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true
      }
    });

    this.setupWindowEvents();
    this.loadContent();

    return this.mainWindow;
  }

  /**
   * Calculate window dimensions based on screen size
   */
  calculateWindowDimensions() {
    const { window: windowConfig } = config;
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    const width = Math.min(
      Math.floor(screenWidth * windowConfig.widthRatio),
      windowConfig.maxWidth
    );
    const height = Math.min(
      Math.floor(screenHeight * windowConfig.heightRatio),
      windowConfig.maxHeight
    );

    const x = Math.floor((screenWidth - width) / 2);
    const y = Math.floor((screenHeight - height) / 2);

    return { width, height, x, y };
  }

  /**
   * Set up window event listeners
   */
  setupWindowEvents() {
    // Hide window when it loses focus
    this.mainWindow.on('blur', () => {
      this.hideWindow();
    });

    // Prevent window from being destroyed, just hide it
    this.mainWindow.on('close', (event) => {
      if (!this.isQuitting) {
        event.preventDefault();
        this.hideWindow();
      }
    });
  }

  /**
   * Load the window content
   */
  loadContent() {
    const indexPath = path.join(__dirname, '../../renderer/index.html');
    this.mainWindow.loadFile(indexPath);
  }

  /**
   * Show the window
   */
  showWindow() {
    if (this.mainWindow) {
      this.mainWindow.show();
      this.mainWindow.focus();
      this.mainWindow.webContents.send('window-shown');
    }
  }

  /**
   * Hide the window
   */
  hideWindow() {
    if (this.mainWindow) {
      this.mainWindow.hide();
      this.mainWindow.webContents.send('window-hidden');
    }
  }

  /**
   * Toggle window visibility
   */
  toggleWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isVisible()) {
        this.hideWindow();
      } else {
        this.showWindow();
      }
    }
  }

  /**
   * Set quitting state
   */
  setQuitting(value) {
    this.isQuitting = value;
  }

  /**
   * Open DevTools (for development)
   */
  openDevTools() {
    if (this.mainWindow) {
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  }

  /**
   * Get the main window instance
   */
  getWindow() {
    return this.mainWindow;
  }
}

module.exports = WindowManager;