const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const chokidar = require('chokidar');

class SnippetsManager {
  constructor() {
    this.snippetsPath = path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Alfred',
      'Alfred.alfredpreferences',
      'snippets'
    );
    
    this.snippetsCache = new Map();
    this.categoriesCache = new Map();
    this.watcher = null;
    this.lastModified = new Date();
  }

  async initialize() {
    try {
      await this.loadAllSnippets();
      this.startWatching();
      return true;
    } catch (error) {
      console.error('Failed to initialize snippets manager:', error);
      return false;
    }
  }

  async loadAllSnippets() {
    try {
      // Check if Alfred snippets directory exists
      const exists = await this.checkDirectoryExists(this.snippetsPath);
      if (!exists) {
        console.log('Alfred snippets directory not found:', this.snippetsPath);
        return this.getMockSnippets(); // Return mock data for development
      }

      // Clear caches
      this.snippetsCache.clear();
      this.categoriesCache.clear();

      // Read all snippet collections
      const collections = await fs.readdir(this.snippetsPath);
      
      for (const collection of collections) {
        const collectionPath = path.join(this.snippetsPath, collection);
        const stats = await fs.stat(collectionPath);
        
        if (stats.isDirectory()) {
          await this.loadCollection(collectionPath, collection);
        }
      }

      this.lastModified = new Date();
      return this.formatSnippetsForUI();
    } catch (error) {
      console.error('Error loading snippets:', error);
      return this.getMockSnippets();
    }
  }

  async loadCollection(collectionPath, collectionName) {
    try {
      // Read collection metadata if exists
      const metadataPath = path.join(collectionPath, 'info.plist');
      let collectionInfo = {
        name: collectionName,
        icon: '📁',
        color: '#007AFF'
      };

      // Try to read collection info
      if (await this.fileExists(metadataPath)) {
        // Parse plist file for collection info
        // For now, use default values
      }

      // Create category
      this.categoriesCache.set(collectionName, collectionInfo);

      // Read all snippet files in the collection
      const files = await fs.readdir(collectionPath);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const snippetPath = path.join(collectionPath, file);
          await this.loadSnippet(snippetPath, collectionName);
        }
      }
    } catch (error) {
      console.error(`Error loading collection ${collectionName}:`, error);
    }
  }

  async loadSnippet(snippetPath, category) {
    try {
      const content = await fs.readFile(snippetPath, 'utf8');
      const data = JSON.parse(content);
      
      if (data.alfredsnippet) {
        const snippet = {
          id: data.alfredsnippet.uid || this.generateId(),
          name: data.alfredsnippet.name || 'Untitled Snippet',
          keyword: data.alfredsnippet.keyword || '',
          content: data.alfredsnippet.snippet || '',
          category: category,
          dontautoexpand: data.alfredsnippet.dontautoexpand || false,
          path: snippetPath,
          createdAt: new Date(),
          isFavorite: false,
          lastUsed: null
        };

        this.snippetsCache.set(snippet.id, snippet);
      }
    } catch (error) {
      console.error(`Error loading snippet ${snippetPath}:`, error);
    }
  }

  startWatching() {
    if (this.watcher) {
      this.watcher.close();
    }

    this.watcher = chokidar.watch(this.snippetsPath, {
      persistent: true,
      ignoreInitial: true,
      depth: 3
    });

    this.watcher.on('change', async (path) => {
      console.log('Snippet changed:', path);
      await this.loadAllSnippets();
    });

    this.watcher.on('add', async (path) => {
      console.log('Snippet added:', path);
      await this.loadAllSnippets();
    });

    this.watcher.on('unlink', async (path) => {
      console.log('Snippet removed:', path);
      await this.loadAllSnippets();
    });
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  formatSnippetsForUI() {
    const categories = {};
    const snippets = [];

    // Group snippets by category
    for (const [id, snippet] of this.snippetsCache) {
      if (!categories[snippet.category]) {
        const categoryInfo = this.categoriesCache.get(snippet.category) || {
          name: snippet.category,
          icon: '📁',
          color: '#007AFF'
        };
        
        categories[snippet.category] = {
          ...categoryInfo,
          snippets: []
        };
      }
      
      categories[snippet.category].snippets.push(snippet);
      snippets.push(snippet);
    }

    // Sort snippets within each category
    for (const category of Object.values(categories)) {
      category.snippets.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      categories,
      snippets,
      totalCount: snippets.length,
      lastModified: this.lastModified
    };
  }

  searchSnippets(query) {
    if (!query || query.trim() === '') {
      return this.formatSnippetsForUI();
    }

    const searchTerm = query.toLowerCase();
    const results = [];

    for (const [id, snippet] of this.snippetsCache) {
      const nameMatch = snippet.name.toLowerCase().includes(searchTerm);
      const keywordMatch = snippet.keyword.toLowerCase().includes(searchTerm);
      const contentMatch = snippet.content.toLowerCase().includes(searchTerm);
      const categoryMatch = snippet.category.toLowerCase().includes(searchTerm);

      if (nameMatch || keywordMatch || contentMatch || categoryMatch) {
        results.push({
          ...snippet,
          relevance: this.calculateRelevance(snippet, searchTerm)
        });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance);

    return {
      categories: this.groupByCategory(results),
      snippets: results,
      totalCount: results.length,
      searchTerm: query
    };
  }

  calculateRelevance(snippet, searchTerm) {
    let score = 0;
    
    // Exact keyword match gets highest score
    if (snippet.keyword.toLowerCase() === searchTerm) score += 100;
    else if (snippet.keyword.toLowerCase().includes(searchTerm)) score += 50;
    
    // Name match
    if (snippet.name.toLowerCase() === searchTerm) score += 80;
    else if (snippet.name.toLowerCase().startsWith(searchTerm)) score += 40;
    else if (snippet.name.toLowerCase().includes(searchTerm)) score += 20;
    
    // Content match
    if (snippet.content.toLowerCase().includes(searchTerm)) score += 10;
    
    // Category match
    if (snippet.category.toLowerCase().includes(searchTerm)) score += 5;
    
    // Boost favorites
    if (snippet.isFavorite) score += 25;
    
    // Boost recently used
    if (snippet.lastUsed) {
      const hoursSinceUse = (Date.now() - snippet.lastUsed) / (1000 * 60 * 60);
      if (hoursSinceUse < 1) score += 20;
      else if (hoursSinceUse < 24) score += 10;
      else if (hoursSinceUse < 168) score += 5; // Within a week
    }
    
    return score;
  }

  groupByCategory(snippets) {
    const categories = {};
    
    for (const snippet of snippets) {
      if (!categories[snippet.category]) {
        const categoryInfo = this.categoriesCache.get(snippet.category) || {
          name: snippet.category,
          icon: '📁',
          color: '#007AFF'
        };
        
        categories[snippet.category] = {
          ...categoryInfo,
          snippets: []
        };
      }
      
      categories[snippet.category].snippets.push(snippet);
    }
    
    return categories;
  }

  async checkDirectoryExists(dirPath) {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  generateId() {
    return `snippet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mock data for development/demo
  getMockSnippets() {
    const mockCategories = {
      'React': {
        name: 'React',
        icon: '⚛️',
        color: '#61DAFB',
        snippets: [
          {
            id: 'mock-1',
            name: 'React Functional Component',
            keyword: 'rfc',
            content: `import React from 'react';

const ComponentName = () => {
  return (
    <div>
      Component Content
    </div>
  );
};

export default ComponentName;`,
            category: 'React',
            isFavorite: true,
            lastUsed: Date.now() - 3600000
          },
          {
            id: 'mock-2',
            name: 'useState Hook',
            keyword: 'rstate',
            content: `const [state, setState] = useState(initialValue);`,
            category: 'React',
            isFavorite: true,
            lastUsed: Date.now() - 7200000
          },
          {
            id: 'mock-3',
            name: 'useEffect Hook',
            keyword: 'reffect',
            content: `useEffect(() => {
  // Effect code here
  
  return () => {
    // Cleanup code
  };
}, [dependencies]);`,
            category: 'React',
            isFavorite: false,
            lastUsed: null
          }
        ]
      },
      'JavaScript': {
        name: 'JavaScript',
        icon: '📜',
        color: '#F7DF1E',
        snippets: [
          {
            id: 'mock-4',
            name: 'Console Log',
            keyword: 'cl',
            content: `console.log($1);`,
            category: 'JavaScript',
            isFavorite: true,
            lastUsed: Date.now() - 1800000
          },
          {
            id: 'mock-5',
            name: 'Arrow Function',
            keyword: 'af',
            content: `const functionName = ($1) => {
  $2
};`,
            category: 'JavaScript',
            isFavorite: false,
            lastUsed: null
          }
        ]
      },
      'HTML': {
        name: 'HTML',
        icon: '🌐',
        color: '#E34C26',
        snippets: [
          {
            id: 'mock-6',
            name: 'HTML5 Boilerplate',
            keyword: 'html5',
            content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>$1</title>
</head>
<body>
    $2
</body>
</html>`,
            category: 'HTML',
            isFavorite: false,
            lastUsed: null
          }
        ]
      }
    };

    const allSnippets = [];
    for (const category of Object.values(mockCategories)) {
      allSnippets.push(...category.snippets);
    }

    return {
      categories: mockCategories,
      snippets: allSnippets,
      totalCount: allSnippets.length,
      lastModified: new Date()
    };
  }

  // Additional utility methods
  getSnippetById(id) {
    return this.snippetsCache.get(id);
  }

  getFavorites() {
    const favorites = [];
    for (const [id, snippet] of this.snippetsCache) {
      if (snippet.isFavorite) {
        favorites.push(snippet);
      }
    }
    return favorites;
  }

  getRecent(limit = 10) {
    const recent = [];
    for (const [id, snippet] of this.snippetsCache) {
      if (snippet.lastUsed) {
        recent.push(snippet);
      }
    }
    
    recent.sort((a, b) => b.lastUsed - a.lastUsed);
    return recent.slice(0, limit);
  }

  markAsUsed(snippetId) {
    const snippet = this.snippetsCache.get(snippetId);
    if (snippet) {
      snippet.lastUsed = Date.now();
    }
  }

  toggleFavorite(snippetId) {
    const snippet = this.snippetsCache.get(snippetId);
    if (snippet) {
      snippet.isFavorite = !snippet.isFavorite;
      return snippet.isFavorite;
    }
    return false;
  }

  destroy() {
    this.stopWatching();
    this.snippetsCache.clear();
    this.categoriesCache.clear();
  }
}

// Create singleton instance
const snippetsManager = new SnippetsManager();

module.exports = {
  loadSnippets: async () => {
    await snippetsManager.initialize();
    return snippetsManager.formatSnippetsForUI();
  },
  
  searchSnippets: async (query) => {
    return snippetsManager.searchSnippets(query);
  },
  
  getSnippetById: (id) => {
    return snippetsManager.getSnippetById(id);
  },
  
  getFavorites: () => {
    return snippetsManager.getFavorites();
  },
  
  getRecent: (limit) => {
    return snippetsManager.getRecent(limit);
  },
  
  markAsUsed: (id) => {
    return snippetsManager.markAsUsed(id);
  },
  
  toggleFavorite: (id) => {
    return snippetsManager.toggleFavorite(id);
  },
  
  destroy: () => {
    return snippetsManager.destroy();
  }
};