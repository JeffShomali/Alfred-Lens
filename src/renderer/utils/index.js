/**
 * Utilities Index
 * Exports all utility functions
 */

// DOM utilities
export {
  $,
  $$,
  createElement,
  on,
  empty,
  toggleClass,
  show,
  hide,
  isVisible,
  scrollIntoView,
  getOffset,
  debounce,
  throttle
} from './domUtils.js';

// String utilities
export {
  escapeHtml,
  truncate,
  toTitleCase,
  toKebabCase,
  toCamelCase,
  generateId,
  highlightText,
  formatFileSize,
  formatRelativeDate,
  parseVariables,
  fuzzyScore
} from './stringUtils.js';

// Language detector
export {
  detectLanguage,
  getLanguageDisplayName,
  getLanguageColor
} from './languageDetector.js';