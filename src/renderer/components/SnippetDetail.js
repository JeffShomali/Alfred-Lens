/**
 * Snippet Detail Component
 * Shows full snippet content and actions
 */

import { createElement, escapeHtml } from '../utils/index.js';
import { detectLanguage, getLanguageDisplayName, getLanguageColor } from '../utils/languageDetector.js';

export class SnippetDetail {
  constructor(options = {}) {
    this.options = {
      snippet: null,
      isFavorite: false,
      onCopy: () => {},
      onCopyAndClose: () => {},
      onToggleFavorite: () => {},
      ...options
    };
    this.element = null;
  }

  /**
   * Render the snippet detail view
   */
  render() {
    this.element = createElement('div', { className: 'snippet-detail' });

    if (!this.options.snippet) {
      this.renderEmpty();
    } else {
      this.renderSnippet();
    }

    return this.element;
  }

  /**
   * Render empty state
   */
  renderEmpty() {
    this.element.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-message">Select a snippet to view details</div>
      </div>
    `;
  }

  /**
   * Render snippet content
   */
  renderSnippet() {
    const snippet = this.options.snippet;
    const language = detectLanguage(snippet);
    const languageName = getLanguageDisplayName(language);
    const languageColor = getLanguageColor(language);

    // Title
    const title = createElement('h2', {
      className: 'detail-title'
    }, escapeHtml(snippet.name));

    // Meta information
    const meta = createElement('div', { className: 'detail-meta' });
    
    if (snippet.keyword) {
      const keywordItem = createElement('div', {}, 
        `Keyword: <span class="meta-value">${escapeHtml(snippet.keyword)}</span>`
      );
      meta.appendChild(keywordItem);
    }
    
    const categoryItem = createElement('div', {},
      `Category: <span class="meta-value">${escapeHtml(snippet.category)}</span>`
    );
    meta.appendChild(categoryItem);

    // Code preview
    const codePreview = this.renderCodePreview(snippet.content, language, languageName, languageColor);

    // Action buttons
    const actions = this.renderActions();

    // Assemble detail view
    this.element.appendChild(title);
    this.element.appendChild(meta);
    this.element.appendChild(codePreview);
    this.element.appendChild(actions);

    // Apply syntax highlighting if available
    if (window.Prism) {
      Prism.highlightAllUnder(this.element);
    }
  }

  /**
   * Render code preview section
   */
  renderCodePreview(content, language, languageName, languageColor) {
    const preview = createElement('div', { className: 'code-preview' });

    // Code header
    const header = createElement('div', { className: 'code-header' });
    
    const languageBadge = createElement('span', {
      className: 'code-language',
      style: `background: ${languageColor}15; color: ${languageColor}`
    }, languageName);
    
    const copyBtn = createElement('button', {
      className: 'code-copy-btn'
    }, 'Copy');

    header.appendChild(languageBadge);
    header.appendChild(copyBtn);

    // Code content
    const codeContent = createElement('pre', { className: 'code-content' });
    const code = createElement('code', {
      className: `language-${language}`
    }, escapeHtml(content));
    codeContent.appendChild(code);

    preview.appendChild(header);
    preview.appendChild(codeContent);

    // Copy button handler
    copyBtn.addEventListener('click', () => {
      this.handleCopy();
    });

    return preview;
  }

  /**
   * Render action buttons
   */
  renderActions() {
    const actions = createElement('div', { className: 'action-buttons' });

    // Copy button
    const copyBtn = createElement('button', {
      className: 'btn btn-primary'
    }, 'Copy to Clipboard');
    copyBtn.addEventListener('click', () => this.handleCopy());

    // Copy and close button
    const copyCloseBtn = createElement('button', {
      className: 'btn btn-secondary'
    }, 'Copy & Close');
    copyCloseBtn.addEventListener('click', () => this.handleCopyAndClose());

    // Favorite button
    const favoriteBtn = createElement('button', {
      className: 'btn btn-tertiary'
    }, this.options.isFavorite ? 'Remove from Favorites' : 'Add to Favorites');
    favoriteBtn.addEventListener('click', () => this.handleToggleFavorite());

    actions.appendChild(copyBtn);
    actions.appendChild(copyCloseBtn);
    actions.appendChild(favoriteBtn);

    return actions;
  }

  /**
   * Handle copy action
   */
  handleCopy() {
    if (this.options.snippet) {
      this.options.onCopy(this.options.snippet);
      this.showCopyFeedback();
    }
  }

  /**
   * Handle copy and close action
   */
  handleCopyAndClose() {
    if (this.options.snippet) {
      this.options.onCopyAndClose(this.options.snippet);
    }
  }

  /**
   * Handle toggle favorite
   */
  handleToggleFavorite() {
    this.options.isFavorite = !this.options.isFavorite;
    if (this.options.snippet) {
      this.options.onToggleFavorite(this.options.snippet.id, this.options.isFavorite);
      this.updateFavoriteButton();
    }
  }

  /**
   * Update favorite button text
   */
  updateFavoriteButton() {
    const btn = this.element.querySelector('.btn-tertiary');
    if (btn) {
      btn.textContent = this.options.isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    }
  }

  /**
   * Show copy feedback
   */
  showCopyFeedback() {
    const copyBtns = this.element.querySelectorAll('.btn-primary, .code-copy-btn');
    copyBtns.forEach(btn => {
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('success');
      
      setTimeout(() => {
        btn.textContent = originalText;
        btn.classList.remove('success');
      }, 2000);
    });
  }

  /**
   * Update with new snippet
   */
  update(snippet, isFavorite = false) {
    this.options.snippet = snippet;
    this.options.isFavorite = isFavorite;
    this.element.innerHTML = '';
    
    if (snippet) {
      this.renderSnippet();
    } else {
      this.renderEmpty();
    }
  }

  /**
   * Clear the detail view
   */
  clear() {
    this.update(null);
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