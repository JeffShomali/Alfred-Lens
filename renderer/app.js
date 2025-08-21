// Main application logic for Alfred Lens
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
      const response = await window.electronAPI.loadSnippets();
      console.log('Load snippets response:', response);
      
      // Handle the response format from IPC
      let data;
      if (response && response.success && response.data) {
        data = response.data;
      } else if (response && response.snippets) {
        data = response;
      } else {
        console.warn('Unexpected response format, using mock data');
        this.loadMockData();
        return;
      }
      
      console.log('Snippets data:', data);
      
      this.snippetsData = data;
      this.currentSnippets = data.snippets || [];
      
      // Render categories in sidebar
      this.renderCategories();
      
      // Select "All Snippets" by default
      this.selectCategory('all');
      
    } catch (error) {
      console.error('Failed to load snippets:', error);
      this.showError('Failed to load snippets');
      
      // Show mock data if loading fails
      this.loadMockData();
    }
  }
  
  loadMockData() {
    // Load mock data for testing
    this.snippetsData = {
      categories: {
        'React': {
          name: 'React',
          snippets: [
            {
              id: 'mock-1',
              name: 'React Functional Component',
              keyword: 'rfc',
              content: 'import React from \'react\';\n\nconst Component = () => {\n  return <div>Component</div>;\n};\n\nexport default Component;',
              category: 'React'
            },
            {
              id: 'mock-2',
              name: 'useState Hook',
              keyword: 'rstate',
              content: 'const [state, setState] = useState(initialValue);',
              category: 'React'
            }
          ]
        },
        'JavaScript': {
          name: 'JavaScript',
          snippets: [
            {
              id: 'mock-3',
              name: 'Console Log',
              keyword: 'cl',
              content: 'console.log($1);',
              category: 'JavaScript'
            }
          ]
        }
      },
      snippets: [],
      totalCount: 0
    };
    
    // Flatten all snippets
    const allSnippets = [];
    Object.values(this.snippetsData.categories).forEach(cat => {
      allSnippets.push(...cat.snippets);
    });
    this.snippetsData.snippets = allSnippets;
    this.snippetsData.totalCount = allSnippets.length;
    
    this.currentSnippets = allSnippets;
    this.renderCategories();
    this.selectCategory('all');
  }

  renderCategories() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      console.error('Sidebar not found');
      return;
    }
    
    if (!this.snippetsData || !this.snippetsData.categories) {
      console.warn('No categories data available');
      return;
    }
    
    // Find or create categories section
    let categoriesSection = sidebar.querySelector('.sidebar-section:first-child');
    if (!categoriesSection) {
      categoriesSection = document.createElement('div');
      categoriesSection.className = 'sidebar-section';
      sidebar.insertBefore(categoriesSection, sidebar.firstChild);
    }
    
    // Clear and rebuild
    categoriesSection.innerHTML = '<div class="section-title">CATEGORIES</div>';
    
    // Add "All Snippets" option
    const allItem = this.createCategoryElement({
      id: 'all',
      name: 'All Snippets',
      count: this.snippetsData.totalCount || 0
    });
    categoriesSection.appendChild(allItem);
    
    // Add categories
    for (const [categoryName, categoryData] of Object.entries(this.snippetsData.categories || {})) {
      const categoryItem = this.createCategoryElement({
        id: categoryName,
        name: categoryData.name || categoryName,
        count: categoryData.snippets ? categoryData.snippets.length : 0
      });
      categoriesSection.appendChild(categoryItem);
    }
    
    // Find or create special sections
    let specialSection = sidebar.querySelector('.sidebar-section:last-child');
    if (!specialSection || specialSection === categoriesSection) {
      specialSection = document.createElement('div');
      specialSection.className = 'sidebar-section';
      specialSection.innerHTML = `
        <div class="section-title">QUICK ACCESS</div>
        <div class="special-section" data-category="favorites">
          <span class="category-name">Favorites</span>
        </div>
        <div class="special-section" data-category="recent">
          <span class="category-name">Recent</span>
        </div>
      `;
      sidebar.appendChild(specialSection);
      
      // Add click handlers to special sections
      specialSection.querySelectorAll('.special-section').forEach(section => {
        section.addEventListener('click', () => {
          const categoryId = section.dataset.category;
          this.selectCategory(categoryId);
        });
      });
    }
  }

  createCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.dataset.category = category.id;
    div.innerHTML = `
      <span class="category-name">${category.name}</span>
      <span class="category-count">(${category.count})</span>
    `;
    
    div.addEventListener('click', () => {
      this.selectCategory(category.id);
    });
    
    return div;
  }

  selectCategory(categoryId) {
    console.log('Selecting category:', categoryId);
    
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
      // Look for category by name (case-insensitive)
      const category = Object.entries(this.snippetsData.categories || {})
        .find(([key, val]) => key.toLowerCase() === categoryId.toLowerCase());
      
      if (category) {
        this.currentSnippets = category[1].snippets || [];
      } else {
        console.warn('Category not found:', categoryId);
        this.currentSnippets = [];
      }
    }
    
    console.log('Current snippets:', this.currentSnippets.length);
    
    // Re-render snippets
    this.renderSnippets();
    
    // Select first snippet
    if (this.currentSnippets.length > 0) {
      this.selectSnippet(0);
    } else {
      // Clear detail view if no snippets
      const detailView = document.querySelector('.snippet-detail');
      if (detailView) {
        detailView.innerHTML = '<div style="text-align: center; padding: 40px; color: #8e8e93;">Select a category with snippets</div>';
      }
    }
  }

  renderSnippets() {
    // Check if we're using accordion layout
    const accordionContainer = document.querySelector('.snippets-accordion');
    if (accordionContainer) {
      // Render accordion items
      this.renderAccordionSnippets(accordionContainer);
      return;
    }
    
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

  renderAccordionSnippets(container) {
    container.innerHTML = '';
    
    if (this.currentSnippets.length === 0) {
      container.innerHTML = '<div class="no-snippets" style="text-align: center; padding: 40px; color: #8e8e93;">No snippets found in this category</div>';
      return;
    }
    
    this.currentSnippets.forEach((snippet, index) => {
      const accordionItem = this.createAccordionItem(snippet, index);
      container.appendChild(accordionItem);
    });
  }

  createAccordionItem(snippet, index) {
    const div = document.createElement('div');
    div.className = 'accordion-item';
    
    const isFavorite = this.favorites.has(snippet.id) || snippet.isFavorite;
    
    // Process the content to handle escape characters properly
    const processedContent = this.processSnippetContent(snippet.content);
    
    div.innerHTML = `
      <div class="accordion-header" onclick="window.toggleAccordion(this)">
        <div class="accordion-title">
          <span class="snippet-name">${this.escapeHtml(snippet.name)}</span>
          <span class="snippet-folder">${this.escapeHtml(snippet.category)}</span>
          ${snippet.keyword ? `<span class="keyword-badge">${this.escapeHtml(snippet.keyword)}</span>` : ''}
        </div>
        <button class="star-button ${isFavorite ? 'favorited' : ''}" onclick="event.stopPropagation(); window.app.toggleFavorite('${snippet.id}')">
          ${isFavorite ? '★' : '☆'}
        </button>
      </div>
      <div class="accordion-content">
        <div class="accordion-body">
          <div class="snippet-info">
            ${snippet.keyword ? `<div>Keyword: <span>${this.escapeHtml(snippet.keyword)}</span></div>` : ''}
            <div>Folder: <span>${this.escapeHtml(snippet.category)}</span></div>
          </div>
          <div class="code-preview">
            <pre class="code-content">${processedContent}</pre>
          </div>
          <div class="action-buttons">
            <button class="btn btn-primary" onclick="window.app.copySnippetById('${snippet.id}')">Copy to Clipboard</button>
            <button class="btn btn-secondary" onclick="window.app.copyAndCloseById('${snippet.id}')">Copy & Close</button>
          </div>
        </div>
      </div>
    `;
    
    return div;
  }

  processSnippetContent(content) {
    // First, handle the actual escape sequences in the string
    // This converts literal \n in the JSON to actual newlines
    let processed = content
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
    
    // Then escape HTML entities for display
    return this.escapeHtml(processed);
  }

  async copySnippetById(snippetId) {
    const snippet = this.currentSnippets.find(s => s.id === snippetId);
    if (snippet) {
      await this.copySnippet(snippet);
    }
  }

  async copyAndCloseById(snippetId) {
    const snippet = this.currentSnippets.find(s => s.id === snippetId);
    if (snippet) {
      await this.copySnippet(snippet);
      this.closeWindow();
    }
  }

  createSnippetCard(snippet, index) {
    const div = document.createElement('div');
    div.className = 'snippet-card';
    div.dataset.index = index;
    div.dataset.id = snippet.id;
    
    const isFavorite = this.favorites.has(snippet.id) || snippet.isFavorite;
    const language = this.detectLanguage(snippet);
    
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
        <span class="category-badge" style="background: rgba(0, 122, 255, 0.1); color: #007aff;">${language}</span>
      </div>
      <div class="snippet-preview"><code>${this.escapeHtml(this.truncateContent(snippet.content))}</code></div>
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
    const language = this.detectLanguage(snippet);
    const processedContent = this.processSnippetContent(snippet.content);
    
    detailView.innerHTML = `
      <h2 class="detail-title">${this.escapeHtml(snippet.name)}</h2>
      
      <div class="detail-meta">
        ${snippet.keyword ? `<div>Keyword: <span>${this.escapeHtml(snippet.keyword)}</span></div>` : ''}
        <div>Category: <span>${this.escapeHtml(snippet.category)}</span></div>
      </div>
      
      <div class="code-preview">
        <div class="code-header">
          <span class="code-language">${language}</span>
          <button class="code-copy-btn" data-action="quick-copy">Copy</button>
        </div>
        <pre class="code-content">${processedContent}</pre>
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
    
    // Quick copy button in code header
    const quickCopyBtn = detailView.querySelector('[data-action="quick-copy"]');
    if (quickCopyBtn) {
      quickCopyBtn.addEventListener('click', () => {
        this.copySnippet(snippet);
      });
    }
  }

  async copySnippet(snippet) {
    try {
      // Process snippet content (expand variables if needed)
      let content = snippet.content;
      
      // Replace common variables
      content = await this.expandVariables(content);
      
      // Copy to clipboard
      const response = await window.electronAPI.copyToClipboard(content);
      
      if (!response || !response.success) {
        throw new Error('Failed to copy to clipboard');
      }
      
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
      const response = await window.electronAPI.getClipboard();
      let clipboardContent = '';
      
      if (response && response.success && response.content) {
        clipboardContent = response.content;
      } else if (typeof response === 'string') {
        clipboardContent = response;
      }
      
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
    
    // Close button - handle both the header close button
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
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
      const response = await window.electronAPI.searchSnippets(query);
      
      // Handle the response format
      let results;
      if (response && response.success && response.data) {
        results = response.data;
      } else if (response && response.snippets) {
        results = response;
      } else {
        console.warn('Unexpected search response format');
        results = { snippets: [] };
      }
      
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

  detectLanguage(snippet) {
    const content = snippet.content.toLowerCase();
    const category = snippet.category.toLowerCase();
    const name = snippet.name.toLowerCase();
    
    // Check category and name first
    if (category.includes('react') || name.includes('react') || name.includes('jsx')) {
      return 'jsx';
    }
    if (category.includes('vue') || name.includes('vue')) {
      return 'javascript';
    }
    if (category.includes('python') || name.includes('python') || name.includes('py')) {
      return 'python';
    }
    if (category.includes('bash') || category.includes('shell') || category.includes('linux')) {
      return 'bash';
    }
    if (category.includes('sql') || name.includes('sql')) {
      return 'sql';
    }
    if (category.includes('html') || name.includes('html')) {
      return 'html';
    }
    if (category.includes('css') || name.includes('css') || name.includes('style')) {
      return 'css';
    }
    if (category.includes('java') && !category.includes('javascript')) {
      return 'java';
    }
    if (category.includes('swift') || name.includes('swift')) {
      return 'swift';
    }
    if (category.includes('go') || name.includes('golang')) {
      return 'go';
    }
    if (category.includes('rust') || name.includes('rust')) {
      return 'rust';
    }
    if (category.includes('typescript') || name.includes('ts')) {
      return 'typescript';
    }
    
    // Check content patterns
    if (content.includes('import react') || content.includes('jsx') || content.includes('usestate') || content.includes('useeffect')) {
      return 'jsx';
    }
    if (content.includes('<!doctype') || content.includes('<html') || content.includes('<div') || content.includes('<body')) {
      return 'html';
    }
    if (content.includes('def ') || content.includes('import ') && content.includes('from ') || content.includes('print(')) {
      return 'python';
    }
    if (content.includes('select ') || content.includes('from ') && content.includes('where ') || content.includes('insert into')) {
      return 'sql';
    }
    if (content.includes('#!/bin/bash') || content.includes('echo ') || content.includes('sudo ') || content.includes('apt-get')) {
      return 'bash';
    }
    if (content.includes('function') || content.includes('const ') || content.includes('let ') || content.includes('var ') || content.includes('=>')) {
      return 'javascript';
    }
    if (content.includes('{') && content.includes('}') && (content.includes('color:') || content.includes('margin:') || content.includes('padding:'))) {
      return 'css';
    }
    if (content.includes('package main') || content.includes('func main()')) {
      return 'go';
    }
    if (content.includes('fn main()') || content.includes('let mut')) {
      return 'rust';
    }
    if (content.includes('public class') || content.includes('public static void main')) {
      return 'java';
    }
    if (content.includes('func ') && content.includes('->') && content.includes('swift')) {
      return 'swift';
    }
    
    // Default to javascript as it's most common
    return 'javascript';
  }

}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new SnippetsApp();
  });
} else {
  window.app = new SnippetsApp();
}