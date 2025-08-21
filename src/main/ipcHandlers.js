/**
 * IPC Handlers
 * Manages inter-process communication between main and renderer
 */

const { ipcMain, clipboard, app } = require('electron');
const Store = require('electron-store');
const config = require('../config/app.config');

class IpcHandlers {
  constructor(windowManager, snippetsLoader, settingsManager) {
    this.windowManager = windowManager;
    this.snippetsLoader = snippetsLoader;
    this.settingsManager = settingsManager;
    this.store = new Store();
  }

  /**
   * Register all IPC handlers
   */
  registerHandlers() {
    this.registerWindowHandlers();
    this.registerClipboardHandlers();
    this.registerSnippetHandlers();
    this.registerPreferenceHandlers();
    this.registerAppHandlers();
    this.registerSettingsHandlers();
  }

  /**
   * Register window control handlers
   */
  registerWindowHandlers() {
    ipcMain.handle('hide-window', () => {
      this.windowManager.hideWindow();
      return true;
    });

    ipcMain.handle('show-window', () => {
      this.windowManager.showWindow();
      return true;
    });

    ipcMain.handle('toggle-window', () => {
      this.windowManager.toggleWindow();
      return true;
    });
  }

  /**
   * Register clipboard handlers
   */
  registerClipboardHandlers() {
    ipcMain.handle('copy-to-clipboard', (event, text) => {
      try {
        clipboard.writeText(text);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-clipboard', () => {
      try {
        return { success: true, content: clipboard.readText() };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register snippet handlers
   */
  registerSnippetHandlers() {
    ipcMain.handle('load-snippets', async () => {
      try {
        const snippets = await this.snippetsLoader.loadSnippets();
        return { success: true, data: snippets };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('search-snippets', async (event, query) => {
      try {
        const results = await this.snippetsLoader.searchSnippets(query);
        return { success: true, data: results };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-snippet-by-id', async (event, id) => {
      try {
        const snippet = await this.snippetsLoader.getSnippetById(id);
        return { success: true, data: snippet };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register preference handlers
   */
  registerPreferenceHandlers() {
    ipcMain.handle('get-preferences', () => {
      try {
        const preferences = this.store.get(
          config.storage.preferences,
          config.defaultPreferences
        );
        return { success: true, data: preferences };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('set-preferences', (event, preferences) => {
      try {
        this.store.set(config.storage.preferences, preferences);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-favorites', () => {
      try {
        const favorites = this.store.get(config.storage.favorites, []);
        return { success: true, data: favorites };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('set-favorites', (event, favorites) => {
      try {
        this.store.set(config.storage.favorites, favorites);
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('get-recent', () => {
      try {
        const recent = this.store.get(config.storage.recent, []);
        return { success: true, data: recent };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('add-to-recent', (event, snippetId) => {
      try {
        let recent = this.store.get(config.storage.recent, []);
        recent = recent.filter(id => id !== snippetId);
        recent.unshift(snippetId);
        recent = recent.slice(0, config.defaultPreferences.maxRecentItems);
        this.store.set(config.storage.recent, recent);
        return { success: true, data: recent };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Register app info handlers
   */
  registerAppHandlers() {
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('get-app-info', () => {
      return {
        name: app.getName(),
        version: app.getVersion(),
        platform: process.platform,
        electron: process.versions.electron,
        node: process.versions.node
      };
    });
  }

  /**
   * Register settings handlers
   */
  registerSettingsHandlers() {
    ipcMain.handle('open-settings', () => {
      if (this.settingsManager) {
        this.settingsManager.openSettingsWindow();
      }
      return { success: true };
    });

    ipcMain.handle('close-settings', () => {
      if (this.settingsManager) {
        this.settingsManager.closeSettingsWindow();
      }
      return { success: true };
    });

    ipcMain.handle('get-settings', () => {
      if (this.settingsManager) {
        return this.settingsManager.getSettings();
      }
      return {};
    });

    ipcMain.handle('save-settings', async (event, settings) => {
      if (this.settingsManager) {
        return await this.settingsManager.saveSettings(settings);
      }
      return { success: false };
    });

    ipcMain.handle('reset-settings', () => {
      if (this.settingsManager) {
        return this.settingsManager.resetSettings();
      }
      return { success: false };
    });

    ipcMain.handle('clear-cache', async () => {
      if (this.settingsManager) {
        return await this.settingsManager.clearCache();
      }
      return { success: false };
    });
  }

  /**
   * Unregister all handlers
   */
  unregisterHandlers() {
    const channels = [
      'hide-window', 'show-window', 'toggle-window',
      'copy-to-clipboard', 'get-clipboard',
      'load-snippets', 'search-snippets', 'get-snippet-by-id',
      'get-preferences', 'set-preferences',
      'get-favorites', 'set-favorites',
      'get-recent', 'add-to-recent',
      'get-app-version', 'get-app-info'
    ];

    channels.forEach(channel => {
      ipcMain.removeHandler(channel);
    });
  }
}

module.exports = IpcHandlers;