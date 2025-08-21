/**
 * Snippet Card Component
 * Displays a single snippet in the list
 */

import { createElement, escapeHtml, truncate } from '../utils/index.js';
import { detectLanguage, getLanguageDisplayName } from '../utils/languageDetector.js';

export class SnippetCard {
  constructor(snippet, options = {}) {
    this.snippet = snippet;
    this.options = {
      isActive: false,
      isFavorite: false,
      onSelect: () => {},
      onToggleFavorite: () => {},
      ...options
    };
    this.element = null;
  }

  /**
   * Render the snippet card
   */
  render() {
    const language = detectLanguage(this.snippet);
    const languageName = getLanguageDisplayName(language);
    
    this.element = createElement('div', {
      className: `snippet-card ${this.options.isActive ? 'active' : ''}`,
      dataset: {
        id: this.snippet.id,
        language: language
      }
    });

    // Header with title and favorite button
    const header = createElement('div', { className: 'snippet-header' });
    
    const title = createElement('div', {
      className: 'snippet-title'
    }, escapeHtml(this.snippet.name));
    
    const favoriteBtn = createElement('button', {
      className: `star-button ${this.options.isFavorite ? 'favorited' : ''}`,
      'aria-label': 'Toggle favorite'
    }, this.options.isFavorite ? '★' : '☆');
    
    header.appendChild(title);
    header.appendChild(favoriteBtn);

    // Meta information
    const meta = createElement('div', { className: 'snippet-meta' });
    
    if (this.snippet.keyword) {
      const keywordBadge = createElement('span', {
        className: 'keyword-badge'
      }, escapeHtml(this.snippet.keyword));
      meta.appendChild(keywordBadge);
    }
    
    const categoryBadge = createElement('span', {
      className: 'category-badge'
    }, escapeHtml(this.snippet.category));
    meta.appendChild(categoryBadge);
    
    const languageBadge = createElement('span', {
      className: 'language-badge',
      style: `background: ${this.getLanguageColor(language)}15; color: ${this.getLanguageColor(language)}`
    }, languageName);
    meta.appendChild(languageBadge);

    // Preview
    const preview = createElement('div', {
      className: 'snippet-preview'
    }, this.renderPreview());

    // Assemble card
    this.element.appendChild(header);
    this.element.appendChild(meta);
    this.element.appendChild(preview);

    // Add event listeners
    this.attachEventListeners();

    return this.element;
  }

  /**
   * Render snippet preview
   */
  renderPreview() {
    const content = truncate(this.snippet.content, 150);
    return createElement('code', {}, escapeHtml(content));
  }

  /**
   * Get language color
   */
  getLanguageColor(language) {
    const colors = {
      javascript: '#f7df1e',
      jsx: '#61dafb',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#007396',
      bash: '#4eaa25',
      html: '#e34c26',
      css: '#1572b6'
    };
    return colors[language] || '#007aff';
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Click to select
    this.element.addEventListener('click', (e) => {
      if (!e.target.classList.contains('star-button')) {
        this.options.onSelect(this.snippet);
      }
    });

    // Favorite button
    const favoriteBtn = this.element.querySelector('.star-button');
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite();
    });
  }

  /**
   * Toggle favorite state
   */
  toggleFavorite() {
    this.options.isFavorite = !this.options.isFavorite;
    const btn = this.element.querySelector('.star-button');
    btn.classList.toggle('favorited', this.options.isFavorite);
    btn.textContent = this.options.isFavorite ? '★' : '☆';
    this.options.onToggleFavorite(this.snippet.id, this.options.isFavorite);
  }

  /**
   * Set active state
   */
  setActive(active) {
    this.options.isActive = active;
    this.element.classList.toggle('active', active);
    
    if (active) {
      this.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Update snippet data
   */
  update(snippet) {
    this.snippet = snippet;
    const oldElement = this.element;
    this.render();
    oldElement.replaceWith(this.element);
  }

  /**
   * Destroy the component
   */
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}