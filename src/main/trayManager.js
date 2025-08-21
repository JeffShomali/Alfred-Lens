/**
 * Tray Manager
 * Handles system tray icon and menu
 */

const { Tray, Menu, nativeImage, app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

class TrayManager {
  constructor(windowManager) {
    this.tray = null;
    this.windowManager = windowManager;
  }

  /**
   * Create system tray icon
   */
  createTray() {
    const iconPath = this.getIconPath();
    this.tray = new Tray(iconPath);
    this.tray.setToolTip('Alfred Lens');
    this.setupTrayMenu();
    this.setupTrayEvents();
    return this.tray;
  }

  /**
   * Get tray icon path or create placeholder
   */
  getIconPath() {
    const iconPath = path.join(__dirname, '../../assets/tray-icon.png');
    
    if (!fs.existsSync(iconPath)) {
      const assetsDir = path.dirname(iconPath);
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }
      return nativeImage.createEmpty();
    }
    
    return iconPath;
  }

  /**
   * Setup tray context menu
   */
  setupTrayMenu() {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show Snippets',
        click: () => this.windowManager.showWindow()
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => this.openSettings()
      },
      {
        label: 'About',
        click: () => this.showAbout()
      },
      { type: 'separator' },
      {
        label: 'Launch at Startup',
        type: 'checkbox',
        checked: app.getLoginItemSettings().openAtLogin,
        click: (menuItem) => this.toggleAutoStart(menuItem.checked)
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => this.quitApp()
      }
    ]);

    this.tray.setContextMenu(contextMenu);
  }

  /**
   * Setup tray event listeners
   */
  setupTrayEvents() {
    this.tray.on('click', () => {
      this.windowManager.toggleWindow();
    });
  }

  /**
   * Open settings window
   */
  openSettings() {
    this.windowManager.showWindow();
    const window = this.windowManager.getWindow();
    if (window) {
      window.webContents.send('open-settings');
    }
  }

  /**
   * Show about dialog
   */
  showAbout() {
    dialog.showMessageBox({
      type: 'info',
      title: 'About Alfred Snippets Overflow',
      message: 'Alfred Snippets Overflow v1.0.0',
      detail: 'A lightweight macOS tray application for quick access to Alfred snippets.\n\nCreated for productivity enthusiasts',
      buttons: ['OK']
    });
  }

  /**
   * Toggle auto-start on login
   */
  toggleAutoStart(enabled) {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true
    });
  }

  /**
   * Quit the application
   */
  quitApp() {
    this.windowManager.setQuitting(true);
    app.quit();
  }

  /**
   * Destroy tray icon
   */
  destroy() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}

module.exports = TrayManager;