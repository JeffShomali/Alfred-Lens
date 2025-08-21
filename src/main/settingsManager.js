/**
 * Settings Manager
 * Handles settings storage and management using electron-store
 */

const Store = require('electron-store');
const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

class SettingsManager {
  constructor() {
    this.store = new Store({
      name: 'alfred-lens-settings',
      defaults: this.getDefaultSettings()
    });
    
    this.settingsWindow = null;
    this.mainWindowManager = null;
    this.shortcutManager = null;
  }

  /**
   * Get default settings
   */
  getDefaultSettings() {
    return {
      shortcuts: {
        global: 'Command+Shift+S',
        copyClose: 'Enter',
        copy: 'Command+C',
        search: 'Command+F',
        close: 'Escape'
      },
      window: {
        size: 'medium', // small, medium, large, fullscreen
        position: 'center', // center, top, bottom, left, right
        opacity: 98,
        alwaysOnTop: true,
        hideOnBlur: true,
        widthRatio: 0.7,
        heightRatio: 0.8
      },
      appearance: {
        theme: 'auto', // auto, light, dark
        fontSize: 'medium', // small, medium, large
        showFavorites: true,
        showRecent: true
      },
      behavior: {
        autoStart: false,
        showNotifications: true,
        soundEffects: false,
        searchDelay: 150
      },
      advanced: {
        snippetsPath: path.join(
          app.getPath('home'),
          'Library/Application Support/Alfred/Alfred.alfredpreferences/snippets'
        )
      }
    };
  }

  /**
   * Initialize with window managers
   */
  init(mainWindowManager, shortcutManager) {
    this.mainWindowManager = mainWindowManager;
    this.shortcutManager = shortcutManager;
  }

  /**
   * Get all settings
   */
  getSettings() {
    return this.store.store;
  }

  /**
   * Get a specific setting
   */
  getSetting(key) {
    return this.store.get(key);
  }

  /**
   * Save settings
   */
  async saveSettings(newSettings) {
    const oldSettings = this.getSettings();
    
    // Save new settings
    Object.keys(newSettings).forEach(key => {
      this.store.set(key, newSettings[key]);
    });

    // Apply settings changes
    await this.applySettings(newSettings, oldSettings);
    
    return { success: true };
  }

  /**
   * Apply settings changes
   */
  async applySettings(newSettings, oldSettings) {
    // Update global shortcut
    if (newSettings.shortcuts && newSettings.shortcuts.global !== oldSettings.shortcuts.global) {
      if (this.shortcutManager) {
        globalShortcut.unregister(oldSettings.shortcuts.global);
        this.shortcutManager.registerGlobalShortcut(newSettings.shortcuts.global);
      }
    }

    // Update window settings
    if (newSettings.window && this.mainWindowManager) {
      const window = this.mainWindowManager.getWindow();
      if (window) {
        // Update always on top
        if (newSettings.window.alwaysOnTop !== undefined) {
          window.setAlwaysOnTop(newSettings.window.alwaysOnTop);
        }

        // Update opacity
        if (newSettings.window.opacity !== undefined) {
          window.setOpacity(newSettings.window.opacity / 100);
        }

        // Update window size
        if (newSettings.window.size !== oldSettings.window.size) {
          this.updateWindowSize(newSettings.window.size);
        }

        // Update window position
        if (newSettings.window.position !== oldSettings.window.position) {
          this.updateWindowPosition(newSettings.window.position);
        }
      }
    }

    // Update auto-start
    if (newSettings.behavior && newSettings.behavior.autoStart !== oldSettings.behavior.autoStart) {
      app.setLoginItemSettings({
        openAtLogin: newSettings.behavior.autoStart,
        openAsHidden: true
      });
    }
  }

  /**
   * Update window size based on setting
   */
  updateWindowSize(size) {
    if (!this.mainWindowManager) return;
    
    const window = this.mainWindowManager.getWindow();
    if (!window) return;

    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

    let widthRatio, heightRatio;
    switch (size) {
      case 'small':
        widthRatio = 0.6;
        heightRatio = 0.7;
        break;
      case 'medium':
        widthRatio = 0.7;
        heightRatio = 0.8;
        break;
      case 'large':
        widthRatio = 0.8;
        heightRatio = 0.9;
        break;
      case 'fullscreen':
        window.setFullScreen(true);
        return;
      default:
        widthRatio = 0.7;
        heightRatio = 0.8;
    }

    const width = Math.floor(screenWidth * widthRatio);
    const height = Math.floor(screenHeight * heightRatio);
    
    window.setSize(width, height);
    this.updateWindowPosition(this.getSetting('window.position'));
  }

  /**
   * Update window position
   */
  updateWindowPosition(position) {
    if (!this.mainWindowManager) return;
    
    const window = this.mainWindowManager.getWindow();
    if (!window) return;

    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const [windowWidth, windowHeight] = window.getSize();

    let x, y;
    switch (position) {
      case 'top':
        x = Math.floor((screenWidth - windowWidth) / 2);
        y = 50;
        break;
      case 'bottom':
        x = Math.floor((screenWidth - windowWidth) / 2);
        y = screenHeight - windowHeight - 50;
        break;
      case 'left':
        x = 50;
        y = Math.floor((screenHeight - windowHeight) / 2);
        break;
      case 'right':
        x = screenWidth - windowWidth - 50;
        y = Math.floor((screenHeight - windowHeight) / 2);
        break;
      case 'center':
      default:
        x = Math.floor((screenWidth - windowWidth) / 2);
        y = Math.floor((screenHeight - windowHeight) / 2);
    }

    window.setPosition(x, y);
  }

  /**
   * Reset settings to default
   */
  resetSettings() {
    this.store.clear();
    const defaults = this.getDefaultSettings();
    Object.keys(defaults).forEach(key => {
      this.store.set(key, defaults[key]);
    });
    return { success: true };
  }

  /**
   * Clear cache
   */
  async clearCache() {
    // Clear electron cache
    const session = require('electron').session;
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData();
    return { success: true };
  }

  /**
   * Open settings window
   */
  openSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.focus();
      return;
    }

    this.settingsWindow = new BrowserWindow({
      width: 700,
      height: 800,
      title: 'Alfred Lens - Settings',
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      webPreferences: {
        preload: path.join(__dirname, '../preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    this.settingsWindow.loadFile(path.join(__dirname, '../../renderer/settings.html'));

    this.settingsWindow.on('closed', () => {
      this.settingsWindow = null;
    });
  }

  /**
   * Close settings window
   */
  closeSettingsWindow() {
    if (this.settingsWindow && !this.settingsWindow.isDestroyed()) {
      this.settingsWindow.close();
    }
  }
}

module.exports = SettingsManager;