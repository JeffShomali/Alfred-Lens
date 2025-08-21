/**
 * DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Query selector with null check
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query selector all
 */
export function $$(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}

/**
 * Create element with attributes and content
 */
export function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else {
      element.setAttribute(key, value);
    }
  });
  
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (content instanceof Node) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(child => {
        if (child instanceof Node) {
          element.appendChild(child);
        }
      });
    }
  }
  
  return element;
}

/**
 * Add event listener with delegation support
 */
export function on(element, event, selectorOrHandler, handler) {
  if (typeof selectorOrHandler === 'function') {
    element.addEventListener(event, selectorOrHandler);
  } else {
    element.addEventListener(event, (e) => {
      const target = e.target.closest(selectorOrHandler);
      if (target) {
        handler.call(target, e);
      }
    });
  }
}

/**
 * Remove all children from element
 */
export function empty(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Toggle class on element
 */
export function toggleClass(element, className, force) {
  if (force !== undefined) {
    element.classList.toggle(className, force);
  } else {
    element.classList.toggle(className);
  }
}

/**
 * Show element
 */
export function show(element) {
  element.style.display = '';
  element.hidden = false;
}

/**
 * Hide element
 */
export function hide(element) {
  element.style.display = 'none';
}

/**
 * Check if element is visible
 */
export function isVisible(element) {
  return element.offsetParent !== null;
}

/**
 * Scroll element into view
 */
export function scrollIntoView(element, options = {}) {
  const defaultOptions = {
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest'
  };
  
  element.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * Get element offset relative to document
 */
export function getOffset(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  };
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}