/**
 * Snippets Loader
 * Handles loading and searching Alfred snippets from SQLite database
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config/app.config');
const { execSync } = require('child_process');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

class SnippetsLoader {
  constructor() {
    this.snippetsCache = null;
    this.lastLoadTime = null;
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Load all snippets from Alfred SQLite database
   */
  async loadSnippets() {
    // Check cache
    if (this.isCacheValid()) {
      return this.snippetsCache;
    }

    return new Promise(async (resolve, reject) => {
      const dbPath = path.join(
        os.homedir(),
        'Library',
        'Application Support',
        'Alfred',
        'Databases',
        'snippets.alfdb'
      );

      // Check if database exists before attempting to open
      try {
        await fs.access(dbPath, fs.constants.R_OK);
      } catch (error) {
        console.error('Alfred snippets database not found or not readable:', dbPath);
        reject(new Error('Alfred snippets database not found. Please ensure Alfred is installed and has snippets configured.'));
        return;
      }

      // IMPORTANT: Always open in read-only mode to protect Alfred's database
      // This ensures we never modify or delete the Alfred snippets database
      const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
          console.error('Failed to open database:', err);
          reject(new Error('Failed to open snippets database: ' + err.message));
          return;
        }
      });

      const query = `
        SELECT uid, name, keyword, snippet, collection, autoexpand
        FROM snippets
        ORDER BY collection, name
      `;

      db.all(query, [], (err, rows) => {
        if (err) {
          console.error('Failed to query snippets:', err);
          db.close();
          reject(new Error('Failed to query snippets: ' + err.message));
          return;
        }

        const allSnippets = [];
        const categoriesData = {};

        // Process each snippet
        rows.forEach(row => {
          const category = row.collection || 'Uncategorized';
          const snippet = {
            id: row.uid,
            name: row.name,
            keyword: row.keyword || '',
            content: row.snippet,
            category: category,
            autoexpand: row.autoexpand === 1
          };

          if (!categoriesData[category]) {
            categoriesData[category] = {
              name: category,
              icon: this.getCategoryIcon(category),
              snippets: []
            };
          }

          categoriesData[category].snippets.push(snippet);
          allSnippets.push(snippet);
        });

        // Also load snippets from .alfredsnippets bundle files
        this.loadBundleSnippets().then(bundleSnippets => {
          for (const [category, data] of Object.entries(bundleSnippets)) {
            if (!categoriesData[category]) {
              categoriesData[category] = data;
              allSnippets.push(...data.snippets);
            }
          }

          this.snippetsCache = {
            categories: categoriesData,
            snippets: allSnippets,
            totalCount: allSnippets.length,
            lastUpdated: new Date().toISOString()
          };

          this.lastLoadTime = Date.now();
          db.close();
          resolve(this.snippetsCache);
        }).catch(error => {
          console.error('Failed to load bundle snippets:', error);
          // Still resolve with database snippets even if bundle loading fails
          this.snippetsCache = {
            categories: categoriesData,
            snippets: allSnippets,
            totalCount: allSnippets.length,
            lastUpdated: new Date().toISOString()
          };

          this.lastLoadTime = Date.now();
          db.close();
          resolve(this.snippetsCache);
        });
      });
    });
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
   * Helper method to load snippets from a category folder (used for bundle files)
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
   * Load a single snippet file (used for bundle files)
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
          autoexpand: false
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
   * Load snippets from .alfredsnippets bundle files
   */
  async loadBundleSnippets() {
    const categoriesData = {};
    
    try {
      // Look for .alfredsnippets files in common locations
      const searchPaths = [
        path.join(os.homedir(), 'Downloads'),
        path.join(os.homedir(), 'Documents'),
        path.join(os.homedir(), 'Desktop')
      ];

      for (const searchPath of searchPaths) {
        try {
          const files = await fs.readdir(searchPath);
          const bundleFiles = files.filter(f => f.endsWith('.alfredsnippets'));
          
          for (const bundleFile of bundleFiles) {
            const bundlePath = path.join(searchPath, bundleFile);
            const categoryName = bundleFile.replace('.alfredsnippets', '');
            
            try {
              // Create temporary directory
              const tempDir = path.join(os.tmpdir(), 'alfred-lens-temp', categoryName);
              await fs.mkdir(path.join(os.tmpdir(), 'alfred-lens-temp'), { recursive: true });
              await fs.mkdir(tempDir, { recursive: true });
              
              // Extract bundle
              execSync(`unzip -q -o "${bundlePath}" -d "${tempDir}"`, { stdio: 'ignore' });
              
              // Load snippets from extracted files
              const snippets = await this.loadCategorySnippets(tempDir);
              
              if (snippets.length > 0) {
                categoriesData[categoryName] = {
                  name: categoryName,
                  icon: this.getCategoryIcon(categoryName),
                  snippets: snippets.map(s => ({ ...s, category: categoryName }))
                };
              }
              
              // Clean up temp directory
              try {
                execSync(`rm -rf "${tempDir}"`, { stdio: 'ignore' });
              } catch (e) {
                // Ignore cleanup errors
              }
            } catch (error) {
              console.error(`Failed to load bundle ${bundleFile}:`, error);
            }
          }
        } catch (error) {
          // Directory might not exist or be inaccessible
          console.log(`Could not access ${searchPath}`);
        }
      }
    } catch (error) {
      console.error('Failed to load bundle snippets:', error);
    }
    
    return categoriesData;
  }

  /**
   * Get category icon based on name
   */
  getCategoryIcon(categoryName) {
    const name = categoryName.toLowerCase();
    
    if (name.includes('laravel')) return '🔴';
    if (name.includes('dynamic')) return '🔄';
    if (name.includes('nextjs') || name.includes('next')) return '▲';
    if (name.includes('waimut')) return '🌰';
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