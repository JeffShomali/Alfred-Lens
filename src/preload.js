/**
 * Preload Script
 * Exposes safe APIs to the renderer process
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window control
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  toggleWindow: () => ipcRenderer.invoke('toggle-window'),

  // Clipboard operations
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),

  // Snippet operations
  loadSnippets: (forceReload = false) => ipcRenderer.invoke('load-snippets', forceReload),
  searchSnippets: (query) => ipcRenderer.invoke('search-snippets', query),
  getSnippetById: (id) => ipcRenderer.invoke('get-snippet-by-id', id),

  // Preferences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),

  // Favorites
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  setFavorites: (favorites) => ipcRenderer.invoke('set-favorites', favorites),

  // Recent items
  getRecent: () => ipcRenderer.invoke('get-recent'),
  addToRecent: (snippetId) => ipcRenderer.invoke('add-to-recent', snippetId),

  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),

  // Settings
  openSettings: () => ipcRenderer.invoke('open-settings'),
  closeSettings: () => ipcRenderer.invoke('close-settings'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  resetSettings: () => ipcRenderer.invoke('reset-settings'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  // Event listeners
  onWindowShown: (callback) => {
    ipcRenderer.on('window-shown', callback);
    return () => ipcRenderer.removeListener('window-shown', callback);
  },
  
  onWindowHidden: (callback) => {
    ipcRenderer.on('window-hidden', callback);
    return () => ipcRenderer.removeListener('window-hidden', callback);
  },
  
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
    return () => ipcRenderer.removeListener('open-settings', callback);
  }
});

// Log that preload script is loaded
console.log('Preload script loaded successfully');