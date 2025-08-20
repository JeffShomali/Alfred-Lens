const { globalShortcut } = require('electron');

class ShortcutManager {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
    this.commandKeyTimer = null;
    this.commandKeyPressed = false;
    this.commandKeyStartTime = null;
    this.holdDuration = 5000; // 5 seconds default
    this.isMonitoring = false;
  }

  initialize(preferences = {}) {
    this.holdDuration = preferences.holdDuration || 5000;
    
    // Register primary shortcut
    this.registerMainShortcut(preferences.shortcut || 'Command+Shift+S');
    
    // Start monitoring for long press (simplified version)
    this.startMonitoring();
  }

  registerMainShortcut(shortcut) {
    try {
      // Unregister if already registered
      if (globalShortcut.isRegistered(shortcut)) {
        globalShortcut.unregister(shortcut);
      }
      
      // Register new shortcut
      const success = globalShortcut.register(shortcut, () => {
        if (this.mainWindow) {
          if (this.mainWindow.isVisible()) {
            this.mainWindow.hide();
          } else {
            this.mainWindow.show();
            this.mainWindow.focus();
          }
        }
      });
      
      if (!success) {
        console.error('Failed to register shortcut:', shortcut);
        return false;
      }
      
      console.log('Registered shortcut:', shortcut);
      return true;
    } catch (error) {
      console.error('Error registering shortcut:', error);
      return false;
    }
  }

  startMonitoring() {
    // Note: For production, you would need to use a native module like 'iohook'
    // or 'node-global-key-listener' to properly detect key hold events.
    // This is a simplified implementation for demonstration.
    
    this.isMonitoring = true;
    
    // Alternative approach: Use multiple shortcuts for common patterns
    this.registerAlternativeShortcuts();
  }

  registerAlternativeShortcuts() {
    // Register some alternative shortcuts
    const alternatives = [
      'Command+Option+S',
      'Command+Control+S',
      'Shift+Command+Space'
    ];
    
    alternatives.forEach(shortcut => {
      try {
        if (!globalShortcut.isRegistered(shortcut)) {
          globalShortcut.register(shortcut, () => {
            if (this.mainWindow && !this.mainWindow.isVisible()) {
              this.mainWindow.show();
              this.mainWindow.focus();
            }
          });
        }
      } catch (error) {
        console.error(`Failed to register alternative shortcut ${shortcut}:`, error);
      }
    });
  }

  stopMonitoring() {
    this.isMonitoring = false;
    if (this.commandKeyTimer) {
      clearTimeout(this.commandKeyTimer);
      this.commandKeyTimer = null;
    }
  }

  updatePreferences(preferences) {
    if (preferences.holdDuration) {
      this.holdDuration = preferences.holdDuration;
    }
    
    if (preferences.shortcut) {
      // Unregister all shortcuts
      globalShortcut.unregisterAll();
      
      // Re-register with new shortcut
      this.registerMainShortcut(preferences.shortcut);
      this.registerAlternativeShortcuts();
    }
  }

  destroy() {
    this.stopMonitoring();
    // Don't unregister all shortcuts here as it's handled by the main process
  }
}

module.exports = ShortcutManager;