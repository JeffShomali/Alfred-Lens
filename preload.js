const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  hideWindow: () => ipcRenderer.invoke('hide-window'),
  showWindow: () => ipcRenderer.invoke('show-window'),
  
  // Clipboard operations
  copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
  getClipboard: () => ipcRenderer.invoke('get-clipboard'),
  
  // Snippet operations
  loadSnippets: () => ipcRenderer.invoke('load-snippets'),
  searchSnippets: (query) => ipcRenderer.invoke('search-snippets', query),
  
  // Preferences
  getPreferences: () => ipcRenderer.invoke('get-preferences'),
  setPreferences: (prefs) => ipcRenderer.invoke('set-preferences', prefs),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Event listeners
  onWindowShown: (callback) => {
    ipcRenderer.on('window-shown', callback);
  },
  
  onWindowHidden: (callback) => {
    ipcRenderer.on('window-hidden', callback);
  },
  
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Expose platform information
contextBridge.exposeInMainWorld('platform', {
  isMac: process.platform === 'darwin',
  isWindows: process.platform === 'win32',
  isLinux: process.platform === 'linux'
});