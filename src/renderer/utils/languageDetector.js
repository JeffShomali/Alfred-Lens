/**
 * Language Detector
 * Detects programming language from snippet content
 */

const LANGUAGE_PATTERNS = {
  javascript: {
    keywords: ['function', 'const', 'let', 'var', '=>', 'console.log'],
    patterns: [/function\s+\w+\s*\(/, /=>\s*{/, /console\.\w+/],
    extensions: ['.js', '.mjs']
  },
  jsx: {
    keywords: ['import React', 'useState', 'useEffect', 'jsx', 'className'],
    patterns: [/import\s+React/, /<\w+\s*\/?>/, /useState\(/, /useEffect\(/],
    extensions: ['.jsx', '.tsx']
  },
  typescript: {
    keywords: ['interface', 'type', 'enum', 'implements', ': string', ': number'],
    patterns: [/interface\s+\w+/, /type\s+\w+\s*=/, /:\s*(string|number|boolean)/],
    extensions: ['.ts', '.tsx']
  },
  python: {
    keywords: ['def ', 'import ', 'from ', 'print(', 'if __name__'],
    patterns: [/def\s+\w+\s*\(/, /import\s+\w+/, /print\s*\(/, /if\s+__name__/],
    extensions: ['.py']
  },
  java: {
    keywords: ['public class', 'private', 'protected', 'static void', 'System.out'],
    patterns: [/public\s+class/, /public\s+static\s+void/, /System\.out/],
    extensions: ['.java']
  },
  csharp: {
    keywords: ['namespace', 'using System', 'public class', 'static void Main'],
    patterns: [/namespace\s+\w+/, /using\s+System/, /public\s+class/],
    extensions: ['.cs']
  },
  cpp: {
    keywords: ['#include', 'std::', 'cout', 'int main()', 'nullptr'],
    patterns: [/#include\s*</, /std::/, /cout\s*<</],
    extensions: ['.cpp', '.cc', '.cxx']
  },
  go: {
    keywords: ['package main', 'func main()', 'import', 'fmt.'],
    patterns: [/package\s+\w+/, /func\s+\w+\s*\(/, /fmt\.\w+/],
    extensions: ['.go']
  },
  rust: {
    keywords: ['fn main()', 'let mut', 'impl', 'pub fn', 'use std'],
    patterns: [/fn\s+\w+\s*\(/, /let\s+mut/, /impl\s+\w+/],
    extensions: ['.rs']
  },
  swift: {
    keywords: ['func ', 'var ', 'let ', 'import Foundation', '->'],
    patterns: [/func\s+\w+\s*\(/, /var\s+\w+\s*:/, /let\s+\w+\s*=/],
    extensions: ['.swift']
  },
  ruby: {
    keywords: ['def ', 'end', 'puts', 'require', 'class ', 'module'],
    patterns: [/def\s+\w+/, /puts\s+/, /require\s+['"]/, /class\s+\w+/],
    extensions: ['.rb']
  },
  php: {
    keywords: ['<?php', 'echo', 'function', '$', 'namespace'],
    patterns: [/<\?php/, /\$\w+/, /echo\s+/, /function\s+\w+/],
    extensions: ['.php']
  },
  sql: {
    keywords: ['SELECT', 'FROM', 'WHERE', 'INSERT INTO', 'CREATE TABLE', 'JOIN'],
    patterns: [/SELECT\s+.+\s+FROM/i, /INSERT\s+INTO/i, /CREATE\s+TABLE/i],
    extensions: ['.sql']
  },
  bash: {
    keywords: ['#!/bin/bash', 'echo ', 'if [', 'for ', 'while ', 'sudo'],
    patterns: [/^#!/, /echo\s+/, /if\s+\[/, /for\s+\w+\s+in/],
    extensions: ['.sh', '.bash']
  },
  html: {
    keywords: ['<!DOCTYPE', '<html', '<head>', '<body>', '<div', '<script'],
    patterns: [/<!DOCTYPE/i, /<html/i, /<\/\w+>/],
    extensions: ['.html', '.htm']
  },
  css: {
    keywords: ['color:', 'margin:', 'padding:', 'display:', '@media', '.class'],
    patterns: [/\w+\s*:\s*[\w#]+;/, /@media/, /\.\w+\s*{/],
    extensions: ['.css', '.scss', '.sass']
  },
  json: {
    keywords: ['{', '}', '":', '[', ']'],
    patterns: [/^\s*{[\s\S]*}\s*$/, /^\s*\[[\s\S]*\]\s*$/],
    extensions: ['.json']
  },
  yaml: {
    keywords: ['---', ':', '-', 'name:', 'version:'],
    patterns: [/^---/, /^\w+:/, /^-\s+/m],
    extensions: ['.yml', '.yaml']
  },
  markdown: {
    keywords: ['#', '##', '```', '**', '[', ']('],
    patterns: [/^#+\s+/, /```\w*/, /\[.+\]\(.+\)/],
    extensions: ['.md', '.markdown']
  }
};

/**
 * Detect language from snippet
 */
export function detectLanguage(snippet) {
  const content = snippet.content?.toLowerCase() || '';
  const category = snippet.category?.toLowerCase() || '';
  const name = snippet.name?.toLowerCase() || '';
  const keyword = snippet.keyword?.toLowerCase() || '';
  
  // Check category and name hints first
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    if (category.includes(lang) || name.includes(lang)) {
      return lang;
    }
  }
  
  // Score each language based on pattern matches
  const scores = {};
  
  for (const [lang, config] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    
    // Check keywords
    for (const kw of config.keywords) {
      if (content.includes(kw.toLowerCase())) {
        score += 2;
      }
    }
    
    // Check regex patterns
    for (const pattern of config.patterns) {
      if (pattern.test(content)) {
        score += 3;
      }
    }
    
    // Check file extensions in name or keyword
    for (const ext of config.extensions) {
      if (name.includes(ext) || keyword.includes(ext)) {
        score += 5;
      }
    }
    
    if (score > 0) {
      scores[lang] = score;
    }
  }
  
  // Return language with highest score
  if (Object.keys(scores).length > 0) {
    return Object.entries(scores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  }
  
  // Default to plaintext
  return 'plaintext';
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language) {
  const displayNames = {
    javascript: 'JavaScript',
    jsx: 'React JSX',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    csharp: 'C#',
    cpp: 'C++',
    go: 'Go',
    rust: 'Rust',
    swift: 'Swift',
    ruby: 'Ruby',
    php: 'PHP',
    sql: 'SQL',
    bash: 'Bash',
    html: 'HTML',
    css: 'CSS',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    plaintext: 'Plain Text'
  };
  
  return displayNames[language] || language;
}

/**
 * Get language color for syntax highlighting
 */
export function getLanguageColor(language) {
  const colors = {
    javascript: '#f7df1e',
    jsx: '#61dafb',
    typescript: '#3178c6',
    python: '#3776ab',
    java: '#007396',
    csharp: '#239120',
    cpp: '#00599c',
    go: '#00add8',
    rust: '#dea584',
    swift: '#fa7343',
    ruby: '#cc342d',
    php: '#777bb4',
    sql: '#336791',
    bash: '#4eaa25',
    html: '#e34c26',
    css: '#1572b6',
    json: '#292929',
    yaml: '#cb171e',
    markdown: '#083fa1'
  };
  
  return colors[language] || '#666666';
}