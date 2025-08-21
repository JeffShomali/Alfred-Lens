/**
 * Search Bar Component
 * Handles search input and filtering
 */

import { createElement, debounce } from '../utils/index.js';

export class SearchBar {
  constructor(options = {}) {
    this.options = {
      placeholder: '🔍 Search snippets...',
      debounceDelay: 150,
      onSearch: () => {},
      onClose: () => {},
      ...options
    };
    this.element = null;
    this.searchInput = null;
    this.clearButton = null;
    this.debouncedSearch = null;
  }

  /**
   * Render the search bar
   */
  render() {
    this.element = createElement('header', { className: 'header-bar' });

    // Search input container
    const searchContainer = createElement('div', { className: 'search-container' });

    // Search input
    this.searchInput = createElement('input', {
      type: 'text',
      className: 'search-input',
      placeholder: this.options.placeholder,
      'aria-label': 'Search snippets'
    });

    // Clear button (hidden by default)
    this.clearButton = createElement('button', {
      className: 'clear-button',
      style: 'display: none',
      'aria-label': 'Clear search'
    }, '✕');

    searchContainer.appendChild(this.searchInput);
    searchContainer.appendChild(this.clearButton);

    // Close window button
    const closeButton = createElement('button', {
      className: 'close-button',
      'aria-label': 'Close window'
    }, '✕');

    this.element.appendChild(searchContainer);
    this.element.appendChild(closeButton);

    // Set up event listeners
    this.attachEventListeners();

    return this.element;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Create debounced search function
    this.debouncedSearch = debounce((value) => {
      this.options.onSearch(value);
    }, this.options.debounceDelay);

    // Search input events
    this.searchInput.addEventListener('input', (e) => {
      const value = e.target.value;
      this.handleSearch(value);
    });

    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.searchInput.value) {
          this.clear();
        } else {
          this.options.onClose();
        }
      }
    });

    // Clear button
    this.clearButton.addEventListener('click', () => {
      this.clear();
    });

    // Close button
    const closeButton = this.element.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      this.options.onClose();
    });
  }

  /**
   * Handle search input
   */
  handleSearch(value) {
    // Show/hide clear button
    this.clearButton.style.display = value ? 'block' : 'none';

    // Perform search
    this.debouncedSearch(value);
  }

  /**
   * Clear search
   */
  clear() {
    this.searchInput.value = '';
    this.clearButton.style.display = 'none';
    this.options.onSearch('');
    this.focus();
  }

  /**
   * Focus the search input
   */
  focus() {
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }

  /**
   * Blur the search input
   */
  blur() {
    if (this.searchInput) {
      this.searchInput.blur();
    }
  }

  /**
   * Get search value
   */
  getValue() {
    return this.searchInput ? this.searchInput.value : '';
  }

  /**
   * Set search value
   */
  setValue(value) {
    if (this.searchInput) {
      this.searchInput.value = value;
      this.handleSearch(value);
    }
  }

  /**
   * Enable/disable search input
   */
  setEnabled(enabled) {
    if (this.searchInput) {
      this.searchInput.disabled = !enabled;
    }
  }

  /**
   * Show loading state
   */
  showLoading() {
    this.searchInput.classList.add('loading');
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.searchInput.classList.remove('loading');
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
    this.searchInput = null;
    this.clearButton = null;
    this.debouncedSearch = null;
  }
}