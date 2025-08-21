/**
 * Application Configuration
 * Central configuration for all app settings
 */

const path = require('path');
const os = require('os');

module.exports = {
  // Window Configuration
  window: {
    defaultWidth: 900,
    defaultHeight: 600,
    widthRatio: 0.7,  // 70% of screen width
    heightRatio: 0.8, // 80% of screen height
    maxWidth: 1200,
    maxHeight: 900,
    minWidth: 600,
    minHeight: 400,
    transparent: false,
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    hasShadow: true,
    vibrancy: null
  },

  // Keyboard Shortcuts
  shortcuts: {
    defaultGlobalShortcut: 'Command+Shift+S',
    commandHoldDuration: 5000, // 5 seconds
    copyShortcut: 'Command+C',
    searchShortcut: 'Command+F',
    closeShortcut: 'Escape'
  },

  // Paths
  paths: {
    alfredSnippets: path.join(
      os.homedir(),
      'Library/Application Support/Alfred/Alfred.alfredpreferences/snippets'
    ),
    appData: path.join(os.homedir(), 'Library/Application Support/AlfredLens'),
    logs: path.join(os.homedir(), 'Library/Logs/AlfredLens')
  },

  // Storage Keys
  storage: {
    preferences: 'preferences',
    favorites: 'favorites',
    recent: 'recent',
    windowPosition: 'windowPosition'
  },

  // Default Preferences
  defaultPreferences: {
    theme: 'auto',
    shortcut: 'Command+Shift+S',
    holdDuration: 5000,
    maxRecentItems: 20,
    autoStart: false,
    showNotifications: true
  },

  // Search Configuration
  search: {
    debounceDelay: 150,
    maxResults: 50,
    fuzzyMatch: true
  },

  // UI Configuration
  ui: {
    animationDuration: 200,
    toastDuration: 2000,
    scrollBehavior: 'smooth',
    maxPreviewLength: 100
  }
};