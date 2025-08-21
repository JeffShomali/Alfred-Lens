/**
 * Shortcut Manager
 * Handles global keyboard shortcuts
 */

const { globalShortcut } = require('electron');
const Store = require('electron-store');
const config = require('../config/app.config');

class ShortcutManager {
  constructor(windowManager, settingsManager) {
    this.windowManager = windowManager;
    this.settingsManager = settingsManager;
    this.store = new Store();
    this.registeredShortcuts = new Set();
    this.commandKeyTimer = null;
    this.commandKeyPressed = false;
    this.commandKeyStartTime = null;
  }

  /**
   * Register all shortcuts
   */
  registerShortcuts() {
    const preferences = this.getPreferences();
    
    // Register global shortcut
    this.registerGlobalShortcut(preferences.shortcut);
    
    // Register command hold detection if enabled
    if (preferences.enableCommandHold) {
      this.setupCommandHoldDetection(preferences.holdDuration);
    }
  }

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.store.get(
      config.storage.preferences,
      config.defaultPreferences
    );
  }

  /**
   * Register a global shortcut
   */
  registerGlobalShortcut(shortcut) {
    try {
      if (!shortcut) return false;

      const success = globalShortcut.register(shortcut, () => {
        this.windowManager.toggleWindow();
      });

      if (success) {
        this.registeredShortcuts.add(shortcut);
        console.log(`Registered global shortcut: ${shortcut}`);
      } else {
        console.error(`Failed to register shortcut: ${shortcut}`);
      }

      return success;
    } catch (error) {
      console.error('Error registering shortcut:', error);
      return false;
    }
  }

  /**
   * Setup command key hold detection
   */
  setupCommandHoldDetection(duration) {
    // This would require native module for key state detection
    // For now, we'll use the global shortcut as primary method
    console.log(`Command hold detection set for ${duration}ms`);
  }

  /**
   * Update shortcuts with new preferences
   */
  updateShortcuts(newPreferences) {
    // Unregister old shortcuts
    this.unregisterShortcuts();
    
    // Save new preferences
    this.store.set(config.storage.preferences, newPreferences);
    
    // Register new shortcuts
    this.registerShortcuts();
  }

  /**
   * Unregister all shortcuts
   */
  unregisterShortcuts() {
    this.registeredShortcuts.forEach(shortcut => {
      try {
        globalShortcut.unregister(shortcut);
        console.log(`Unregistered shortcut: ${shortcut}`);
      } catch (error) {
        console.error(`Failed to unregister shortcut ${shortcut}:`, error);
      }
    });
    
    this.registeredShortcuts.clear();
    
    // Clear command key timer
    if (this.commandKeyTimer) {
      clearTimeout(this.commandKeyTimer);
      this.commandKeyTimer = null;
    }
  }

  /**
   * Check if a shortcut is registered
   */
  isRegistered(shortcut) {
    return globalShortcut.isRegistered(shortcut);
  }

  /**
   * Get all registered shortcuts
   */
  getRegisteredShortcuts() {
    return Array.from(this.registeredShortcuts);
  }
}

module.exports = ShortcutManager;