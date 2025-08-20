// Main application logic for Alfred Snippets Overflow
class SnippetsApp {
  constructor() {
    this.snippetsData = null;
    this.currentSnippets = [];
    this.selectedSnippetIndex = 0;
    this.selectedCategory = 'all';
    this.searchTerm = '';
    this.favorites = new Set();
    this.recentSnippets = [];
    
    this.init();
  }

  async init() {
    // Load snippets on startup
    await this.loadSnippets();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up keyboard navigation
    this.setupKeyboardNavigation();
    
    // Listen for window events
    this.setupWindowListeners();
    
    // Focus search on load
    this.focusSearch();
  }

  async loadSnippets() {
    try {
      const data = await window.electronAPI.loadSnippets();
      this.snippetsData = data;
      this.currentSnippets = data.snippets || [];
      this.renderCategories();
      this.renderSnippets();
      
      // Select first snippet if available
      if (this.currentSnippets.length > 0) {
        this.selectSnippet(0);
      }
    } catch (error) {
      console.error('Failed to load snippets:', error);
      this.showError('Failed to load snippets');
    }
  }

  renderCategories() {
    const sidebar = document.querySelector('.sidebar');
    if (!this.snippetsData || !this.snippetsData.categories) return;
    
    // Clear existing categories
    const categoriesSection = sidebar.querySelector('.sidebar-section:first-child');
    if (!categoriesSection) return;
    
    // Keep the section title
    const sectionTitle = categoriesSection.querySelector('.section-title');
    categoriesSection.innerHTML = '';
    if (sectionTitle) {
      categoriesSection.appendChild(sectionTitle);
    } else {
      categoriesSection.innerHTML = '<div class="section-title">Categories</div>';
    }
    
    // Add "All Snippets" option
    const allItem = this.createCategoryElement({
      id: 'all',
      name: 'All Snippets',
      icon: '📚',
      count: this.snippetsData.totalCount || 0
    });
    allItem.classList.add('active');
    categoriesSection.appendChild(allItem);
    
    // Add categories
    for (const [categoryName, categoryData] of Object.entries(this.snippetsData.categories)) {
      const categoryItem = this.createCategoryElement({
        id: categoryName,
        name: categoryData.name || categoryName,
        icon: categoryData.icon || '📁',
        count: categoryData.snippets ? categoryData.snippets.length : 0
      });
      categoriesSection.appendChild(categoryItem);
    }
  }

  createCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.dataset.category = category.id;
    div.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <span class="category-name">${category.name}</span>
      <span class="category-count">(${category.count})</span>
    `;
    
    div.addEventListener('click', () => {
      this.selectCategory(category.id);
    });
    
    return div;
  }

  selectCategory(categoryId) {
    // Update active state
    document.querySelectorAll('.category-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const selectedItem = document.querySelector(`.category-item[data-category="${categoryId}"]`);
    if (selectedItem) {
      selectedItem.classList.add('active');
    }
    
    this.selectedCategory = categoryId;
    
    // Filter snippets
    if (categoryId === 'all') {
      this.currentSnippets = this.snippetsData.snippets || [];
    } else if (categoryId === 'favorites') {
      this.currentSnippets = this.getFavoriteSnippets();
    } else if (categoryId === 'recent') {
      this.currentSnippets = this.recentSnippets;
    } else {
      const category = this.snippetsData.categories[categoryId];
      this.currentSnippets = category ? category.snippets : [];
    }
    
    // Re-render snippets
    this.renderSnippets();
    
    // Select first snippet
    if (this.currentSnippets.length > 0) {
      this.selectSnippet(0);
    }
  }

  renderSnippets() {
    const snippetList = document.querySelector('.snippet-list');
    if (!snippetList) return;
    
    snippetList.innerHTML = '';
    
    if (this.currentSnippets.length === 0) {
      snippetList.innerHTML = '<div class="no-snippets">No snippets found</div>';
      return;
    }
    
    this.currentSnippets.forEach((snippet, index) => {
      const snippetCard = this.createSnippetCard(snippet, index);
      snippetList.appendChild(snippetCard);
    });
  }

  createSnippetCard(snippet, index) {
    const div = document.createElement('div');
    div.className = 'snippet-card';
    div.dataset.index = index;
    div.dataset.id = snippet.id;
    
    const isFavorite = this.favorites.has(snippet.id) || snippet.isFavorite;
    
    div.innerHTML = `
      <div class="snippet-header">
        <div class="snippet-title">${this.escapeHtml(snippet.name)}</div>
        <button class="star-button ${isFavorite ? 'favorited' : ''}" data-id="${snippet.id}">
          ${isFavorite ? '★' : '☆'}
        </button>
      </div>
      <div class="snippet-meta">
        ${snippet.keyword ? `<span class="keyword-badge">${this.escapeHtml(snippet.keyword)}</span>` : ''}
        <span class="category-badge">${this.escapeHtml(snippet.category)}</span>
      </div>
      <div class="snippet-preview">${this.escapeHtml(this.truncateContent(snippet.content))}</div>
    `;
    
    // Add click handler
    div.addEventListener('click', (e) => {
      if (!e.target.classList.contains('star-button')) {
        this.selectSnippet(index);
      }
    });
    
    // Add favorite toggle handler
    const starButton = div.querySelector('.star-button');
    starButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleFavorite(snippet.id);
    });
    
    return div;
  }

  selectSnippet(index) {
    if (index < 0 || index >= this.currentSnippets.length) return;
    
    this.selectedSnippetIndex = index;
    const snippet = this.currentSnippets[index];
    
    // Update active state
    document.querySelectorAll('.snippet-card').forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });
    
    // Update detail view
    this.renderSnippetDetail(snippet);
    
    // Scroll into view if needed
    const activeCard = document.querySelector('.snippet-card.active');
    if (activeCard) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  renderSnippetDetail(snippet) {
    const detailView = document.querySelector('.snippet-detail');
    if (!detailView || !snippet) return;
    
    const isFavorite = this.favorites.has(snippet.id) || snippet.isFavorite;
    
    detailView.innerHTML = `
      <h2 class="detail-title">${this.escapeHtml(snippet.name)}</h2>
      
      <div class="detail-meta">
        ${snippet.keyword ? `<div>Keyword: <span>${this.escapeHtml(snippet.keyword)}</span></div>` : ''}
        <div>Category: <span>${this.escapeHtml(snippet.category)}</span></div>
      </div>
      
      <div class="code-preview">
        <pre class="code-content">${this.escapeHtml(snippet.content)}</pre>
      </div>
      
      <div class="action-buttons">
        <button class="btn btn-primary" data-action="copy">Copy to Clipboard</button>
        <button class="btn btn-secondary" data-action="copy-close">Copy & Close</button>
        <button class="btn btn-tertiary" data-action="favorite">
          ${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
        </button>
      </div>
    `;
    
    // Add button handlers
    detailView.querySelector('[data-action="copy"]').addEventListener('click', () => {
      this.copySnippet(snippet);
    });
    
    detailView.querySelector('[data-action="copy-close"]').addEventListener('click', () => {
      this.copySnippet(snippet);
      this.closeWindow();
    });
    
    detailView.querySelector('[data-action="favorite"]').addEventListener('click', () => {
      this.toggleFavorite(snippet.id);
      this.renderSnippetDetail(snippet);
    });
  }

  async copySnippet(snippet) {
    try {
      // Process snippet content (expand variables if needed)
      let content = snippet.content;
      
      // Replace common variables
      content = await this.expandVariables(content);
      
      // Copy to clipboard
      await window.electronAPI.copyToClipboard(content);
      
      // Add to recent
      this.addToRecent(snippet);
      
      // Show success notification
      this.showToast('Copied to clipboard');
      
      // Mark as used
      // This would be saved to persistent storage in production
      snippet.lastUsed = Date.now();
    } catch (error) {
      console.error('Failed to copy snippet:', error);
      this.showToast('Failed to copy snippet', 'error');
    }
  }

  async expandVariables(content) {
    // Replace {clipboard} with clipboard content
    if (content.includes('{clipboard}')) {
      const clipboardContent = await window.electronAPI.getClipboard();
      content = content.replace(/{clipboard}/g, clipboardContent);
    }
    
    // Replace {cursor} with placeholder
    content = content.replace(/{cursor}/g, '');
    
    // Replace {date} with current date
    const date = new Date().toLocaleDateString();
    content = content.replace(/{date}/g, date);
    
    // Replace {time} with current time
    const time = new Date().toLocaleTimeString();
    content = content.replace(/{time}/g, time);
    
    return content;
  }

  toggleFavorite(snippetId) {
    if (this.favorites.has(snippetId)) {
      this.favorites.delete(snippetId);
    } else {
      this.favorites.add(snippetId);
    }
    
    // Update UI
    const starButtons = document.querySelectorAll(`.star-button[data-id="${snippetId}"]`);
    starButtons.forEach(button => {
      const isFavorite = this.favorites.has(snippetId);
      button.classList.toggle('favorited', isFavorite);
      button.textContent = isFavorite ? '★' : '☆';
    });
    
    // Save to persistent storage (would be implemented with electron-store)
    this.saveFavorites();
  }

  getFavoriteSnippets() {
    return this.currentSnippets.filter(snippet => 
      this.favorites.has(snippet.id) || snippet.isFavorite
    );
  }

  addToRecent(snippet) {
    // Remove if already in recent
    this.recentSnippets = this.recentSnippets.filter(s => s.id !== snippet.id);
    
    // Add to beginning
    this.recentSnippets.unshift(snippet);
    
    // Keep only last 20
    this.recentSnippets = this.recentSnippets.slice(0, 20);
  }

  setupEventListeners() {
    // Search input
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchSnippets(e.target.value);
      });
    }
    
    // Close button
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closeWindow();
      });
    }
    
    // Special sections
    document.querySelectorAll('.special-section').forEach(section => {
      section.addEventListener('click', () => {
        const text = section.querySelector('.category-name').textContent;
        if (text === 'Favorites') {
          this.selectCategory('favorites');
        } else if (text === 'Recent') {
          this.selectCategory('recent');
        }
      });
    });
  }

  setupKeyboardNavigation() {
    document.addEventListener('keydown', async (e) => {
      // ESC to close
      if (e.key === 'Escape') {
        this.closeWindow();
        return;
      }
      
      // Cmd+F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        this.focusSearch();
        return;
      }
      
      // Enter to copy and close
      if (e.key === 'Enter' && !e.target.classList.contains('search-input')) {
        e.preventDefault();
        const snippet = this.currentSnippets[this.selectedSnippetIndex];
        if (snippet) {
          await this.copySnippet(snippet);
          this.closeWindow();
        }
        return;
      }
      
      // Cmd+C to copy without closing
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !e.target.classList.contains('search-input')) {
        e.preventDefault();
        const snippet = this.currentSnippets[this.selectedSnippetIndex];
        if (snippet) {
          await this.copySnippet(snippet);
        }
        return;
      }
      
      // Arrow keys for navigation
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectSnippet(Math.min(this.selectedSnippetIndex + 1, this.currentSnippets.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectSnippet(Math.max(this.selectedSnippetIndex - 1, 0));
      }
      
      // Number keys for quick select (1-9)
      if (e.key >= '1' && e.key <= '9' && !e.target.classList.contains('search-input')) {
        const index = parseInt(e.key) - 1;
        if (index < this.currentSnippets.length) {
          this.selectSnippet(index);
        }
      }
      
      // Tab to switch focus between sidebar and content
      if (e.key === 'Tab') {
        e.preventDefault();
        this.switchFocus();
      }
    });
  }

  setupWindowListeners() {
    // Listen for window shown event
    window.electronAPI.onWindowShown(() => {
      this.focusSearch();
      this.loadSnippets(); // Refresh snippets
    });
    
    // Listen for window hidden event
    window.electronAPI.onWindowHidden(() => {
      // Clear search when window is hidden
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.value = '';
      }
      this.searchTerm = '';
    });
  }

  async searchSnippets(query) {
    this.searchTerm = query;
    
    if (!query || query.trim() === '') {
      // Reset to all snippets
      this.currentSnippets = this.snippetsData.snippets || [];
    } else {
      // Search snippets
      const results = await window.electronAPI.searchSnippets(query);
      this.currentSnippets = results.snippets || [];
    }
    
    this.renderSnippets();
    
    // Select first result
    if (this.currentSnippets.length > 0) {
      this.selectSnippet(0);
    }
  }

  focusSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  switchFocus() {
    const activeElement = document.activeElement;
    const searchInput = document.querySelector('.search-input');
    const snippetList = document.querySelector('.snippet-list');
    
    if (activeElement === searchInput) {
      // Focus on snippet list
      const activeCard = document.querySelector('.snippet-card.active');
      if (activeCard) {
        activeCard.focus();
      }
    } else {
      // Focus on search
      this.focusSearch();
    }
  }

  closeWindow() {
    window.electronAPI.hideWindow();
  }

  showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `${type === 'success' ? '✓' : '✕'} ${message}`;
    document.body.appendChild(toast);
    
    // Remove after animation
    setTimeout(() => {
      toast.remove();
    }, 2000);
  }

  showError(message) {
    this.showToast(message, 'error');
  }

  saveFavorites() {
    // This would save to electron-store in production
    localStorage.setItem('favorites', JSON.stringify(Array.from(this.favorites)));
  }

  loadFavorites() {
    // This would load from electron-store in production
    const saved = localStorage.getItem('favorites');
    if (saved) {
      this.favorites = new Set(JSON.parse(saved));
    }
  }

  truncateContent(content, maxLength = 100) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SnippetsApp();
  });
} else {
  new SnippetsApp();
}