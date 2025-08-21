/**
 * Toast Component
 * Shows temporary notification messages
 */

import { createElement } from '../utils/index.js';

export class Toast {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  /**
   * Initialize toast container
   */
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = createElement('div', {
        id: 'toast-container',
        className: 'toast-container'
      });
      document.body.appendChild(this.container);
    }
  }

  /**
   * Show a toast message
   */
  show(message, options = {}) {
    const config = {
      type: 'success',
      duration: 2000,
      closable: true,
      ...options
    };

    const toast = this.createToast(message, config);
    this.container.appendChild(toast);

    // Auto remove after duration
    if (config.duration > 0) {
      setTimeout(() => {
        this.remove(toast);
      }, config.duration);
    }

    return toast;
  }

  /**
   * Create toast element
   */
  createToast(message, config) {
    const toast = createElement('div', {
      className: `toast toast-${config.type} toast-enter`
    });

    // Icon
    const icon = this.getIcon(config.type);
    const iconElement = createElement('span', {
      className: 'toast-icon'
    }, icon);

    // Message
    const messageElement = createElement('span', {
      className: 'toast-message'
    }, message);

    toast.appendChild(iconElement);
    toast.appendChild(messageElement);

    // Close button
    if (config.closable) {
      const closeBtn = createElement('button', {
        className: 'toast-close',
        'aria-label': 'Close'
      }, '✕');
      
      closeBtn.addEventListener('click', () => {
        this.remove(toast);
      });
      
      toast.appendChild(closeBtn);
    }

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.remove('toast-enter');
    });

    return toast;
  }

  /**
   * Get icon for toast type
   */
  getIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }

  /**
   * Remove a toast
   */
  remove(toast) {
    if (!toast || !toast.parentElement) return;

    toast.classList.add('toast-exit');
    
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 300);
  }

  /**
   * Show success toast
   */
  success(message, options = {}) {
    return this.show(message, { ...options, type: 'success' });
  }

  /**
   * Show error toast
   */
  error(message, options = {}) {
    return this.show(message, { ...options, type: 'error' });
  }

  /**
   * Show warning toast
   */
  warning(message, options = {}) {
    return this.show(message, { ...options, type: 'warning' });
  }

  /**
   * Show info toast
   */
  info(message, options = {}) {
    return this.show(message, { ...options, type: 'info' });
  }

  /**
   * Clear all toasts
   */
  clear() {
    const toasts = this.container.querySelectorAll('.toast');
    toasts.forEach(toast => this.remove(toast));
  }

  /**
   * Destroy the toast system
   */
  destroy() {
    this.clear();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Export singleton instance
export const toast = new Toast();