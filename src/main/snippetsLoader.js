/**
 * Snippets Loader
 * Handles loading and searching Alfred snippets
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/app.config');

class SnippetsLoader {
  constructor() {
    this.snippetsCache = null;
    this.lastLoadTime = null;
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Load all snippets from Alfred preferences
   */
  async loadSnippets() {
    // Check cache
    if (this.isCacheValid()) {
      return this.snippetsCache;
    }

    try {
      const snippetsPath = config.paths.alfredSnippets;
      const categories = await this.loadCategories(snippetsPath);
      const allSnippets = [];
      const categoriesData = {};

      for (const category of categories) {
        const categorySnippets = await this.loadCategorySnippets(
          path.join(snippetsPath, category)
        );
        
        categoriesData[category] = {
          name: category,
          icon: this.getCategoryIcon(category),
          snippets: categorySnippets
        };

        allSnippets.push(...categorySnippets);
      }

      this.snippetsCache = {
        categories: categoriesData,
        snippets: allSnippets,
        totalCount: allSnippets.length,
        lastUpdated: new Date().toISOString()
      };

      this.lastLoadTime = Date.now();
      return this.snippetsCache;
    } catch (error) {
      console.error('Failed to load snippets:', error);
      throw new Error('Failed to load snippets: ' + error.message);
    }
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    return (
      this.snippetsCache &&
      this.lastLoadTime &&
      Date.now() - this.lastLoadTime < this.cacheTimeout
    );
  }

  /**
   * Load categories (folders) from snippets directory
   */
  async loadCategories(snippetsPath) {
    try {
      const items = await fs.readdir(snippetsPath, { withFileTypes: true });
      return items
        .filter(item => item.isDirectory())
        .map(item => item.name);
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [];
    }
  }

  /**
   * Load snippets from a category folder
   */
  async loadCategorySnippets(categoryPath) {
    try {
      const snippets = [];
      const files = await fs.readdir(categoryPath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        const snippet = await this.loadSnippetFile(
          path.join(categoryPath, file),
          path.basename(categoryPath)
        );
        if (snippet) {
          snippets.push(snippet);
        }
      }

      return snippets;
    } catch (error) {
      console.error('Failed to load category snippets:', error);
      return [];
    }
  }

  /**
   * Load a single snippet file
   */
  async loadSnippetFile(filePath, category) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (data.alfredsnippet) {
        return {
          id: data.alfredsnippet.uid,
          name: data.alfredsnippet.name,
          keyword: data.alfredsnippet.keyword,
          content: data.alfredsnippet.snippet,
          category: category,
          filePath: filePath
        };
      }
    } catch (error) {
      console.error(`Failed to load snippet file ${filePath}:`, error);
    }
    return null;
  }

  /**
   * Search snippets by query
   */
  async searchSnippets(query) {
    const snippets = await this.loadSnippets();
    
    if (!query || query.trim() === '') {
      return snippets;
    }

    const searchTerm = query.toLowerCase();
    const filtered = snippets.snippets.filter(snippet => {
      return (
        snippet.name.toLowerCase().includes(searchTerm) ||
        snippet.keyword.toLowerCase().includes(searchTerm) ||
        snippet.content.toLowerCase().includes(searchTerm) ||
        snippet.category.toLowerCase().includes(searchTerm)
      );
    });

    return {
      ...snippets,
      snippets: filtered,
      totalCount: filtered.length,
      searchQuery: query
    };
  }

  /**
   * Get snippet by ID
   */
  async getSnippetById(id) {
    const snippets = await this.loadSnippets();
    return snippets.snippets.find(snippet => snippet.id === id);
  }

  /**
   * Get category icon based on name
   */
  getCategoryIcon(categoryName) {
    const name = categoryName.toLowerCase();
    
    if (name.includes('react')) return '⚛️';
    if (name.includes('vue')) return '💚';
    if (name.includes('angular')) return '🅰️';
    if (name.includes('javascript') || name.includes('js')) return '📜';
    if (name.includes('typescript') || name.includes('ts')) return '📘';
    if (name.includes('python')) return '🐍';
    if (name.includes('java')) return '☕';
    if (name.includes('swift')) return '🦉';
    if (name.includes('go')) return '🐹';
    if (name.includes('rust')) return '🦀';
    if (name.includes('ruby')) return '💎';
    if (name.includes('php')) return '🐘';
    if (name.includes('sql')) return '🗄️';
    if (name.includes('docker')) return '🐳';
    if (name.includes('kubernetes') || name.includes('k8s')) return '☸️';
    if (name.includes('git')) return '🔀';
    if (name.includes('linux') || name.includes('bash')) return '🐧';
    if (name.includes('windows')) return '🪟';
    if (name.includes('mac') || name.includes('apple')) return '🍎';
    if (name.includes('test')) return '🧪';
    if (name.includes('debug')) return '🐛';
    if (name.includes('interview')) return '💼';
    if (name.includes('email')) return '📧';
    if (name.includes('html')) return '🌐';
    if (name.includes('css')) return '🎨';
    
    return '📁'; // Default folder icon
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.snippetsCache = null;
    this.lastLoadTime = null;
  }
}

module.exports = SnippetsLoader;