/**
 * String Utilities
 * Helper functions for string manipulation
 */

/**
 * Escape HTML special characters
 */
export function escapeHtml(unsafe) {
  if (!unsafe) return '';
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Truncate string to specified length
 */
export function truncate(str, maxLength = 100, suffix = '...') {
  if (!str || str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Convert string to title case
 */
export function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

/**
 * Convert camelCase to kebab-case
 */
export function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 */
export function toCamelCase(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Highlight search terms in text
 */
export function highlightText(text, searchTerm) {
  if (!searchTerm) return escapeHtml(text);
  
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedTerm})`, 'gi');
  
  return escapeHtml(text).replace(regex, '<mark>$1</mark>');
}

/**
 * Format file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date relative to now
 */
export function formatRelativeDate(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return past.toLocaleDateString();
}

/**
 * Parse template variables
 */
export function parseVariables(template, variables = {}) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Fuzzy search scoring
 */
export function fuzzyScore(needle, haystack) {
  if (!needle || !haystack) return 0;
  
  needle = needle.toLowerCase();
  haystack = haystack.toLowerCase();
  
  if (haystack.includes(needle)) return 1;
  
  let score = 0;
  let needleIndex = 0;
  
  for (let i = 0; i < haystack.length; i++) {
    if (haystack[i] === needle[needleIndex]) {
      score++;
      needleIndex++;
      if (needleIndex === needle.length) break;
    }
  }
  
  return needleIndex === needle.length ? score / needle.length : 0;
}