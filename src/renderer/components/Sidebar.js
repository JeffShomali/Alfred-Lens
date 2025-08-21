/**
 * Sidebar Component
 * Manages categories and special sections
 */

import { createElement, $, $$, empty } from '../utils/index.js';

export class Sidebar {
  constructor(options = {}) {
    this.options = {
      categories: [],
      activeCategory: 'all',
      onCategorySelect: () => {},
      ...options
    };
    this.element = null;
  }

  /**
   * Render the sidebar
   */
  render() {
    this.element = createElement('aside', { className: 'sidebar' });

    // Categories section
    const categoriesSection = this.renderCategoriesSection();
    this.element.appendChild(categoriesSection);

    // Special sections
    const specialSections = this.renderSpecialSections();
    this.element.appendChild(specialSections);

    return this.element;
  }

  /**
   * Render categories section
   */
  renderCategoriesSection() {
    const section = createElement('div', { className: 'sidebar-section' });
    
    // Section title
    const title = createElement('div', {
      className: 'section-title'
    }, 'CATEGORIES');
    section.appendChild(title);

    // All snippets item
    const allItem = this.createCategoryItem({
      id: 'all',
      name: 'All Snippets',
      icon: '📚',
      count: this.getTotalCount()
    });
    section.appendChild(allItem);

    // Category items
    this.options.categories.forEach(category => {
      const item = this.createCategoryItem(category);
      section.appendChild(item);
    });

    return section;
  }

  /**
   * Render special sections
   */
  renderSpecialSections() {
    const section = createElement('div', { className: 'special-sections' });

    // Favorites
    const favoritesItem = this.createSpecialItem({
      id: 'favorites',
      name: 'Favorites',
      icon: '⭐'
    });
    section.appendChild(favoritesItem);

    // Recent
    const recentItem = this.createSpecialItem({
      id: 'recent',
      name: 'Recent',
      icon: '🕐'
    });
    section.appendChild(recentItem);

    return section;
  }

  /**
   * Create category item element
   */
  createCategoryItem(category) {
    const isActive = this.options.activeCategory === category.id;
    
    const item = createElement('div', {
      className: `category-item ${isActive ? 'active' : ''}`,
      dataset: { category: category.id }
    });

    const icon = createElement('span', {
      className: 'category-icon'
    }, category.icon);
    
    const name = createElement('span', {
      className: 'category-name'
    }, category.name);
    
    const count = createElement('span', {
      className: 'category-count'
    }, `(${category.count || 0})`);

    item.appendChild(icon);
    item.appendChild(name);
    item.appendChild(count);

    // Add expand icon if has subcategories
    if (category.subcategories) {
      const expandIcon = createElement('span', {
        className: 'expand-icon'
      }, '▶');
      item.appendChild(expandIcon);
      item.classList.add('expandable');
    }

    // Click handler
    item.addEventListener('click', () => {
      this.selectCategory(category.id);
    });

    return item;
  }

  /**
   * Create special section item
   */
  createSpecialItem(item) {
    const isActive = this.options.activeCategory === item.id;
    
    const element = createElement('div', {
      className: `category-item special-section ${isActive ? 'active' : ''}`,
      dataset: { category: item.id }
    });

    const icon = createElement('span', {
      className: 'category-icon'
    }, item.icon);
    
    const name = createElement('span', {
      className: 'category-name'
    }, item.name);

    element.appendChild(icon);
    element.appendChild(name);

    // Click handler
    element.addEventListener('click', () => {
      this.selectCategory(item.id);
    });

    return element;
  }

  /**
   * Select a category
   */
  selectCategory(categoryId) {
    // Update active state
    $$('.category-item', this.element).forEach(item => {
      item.classList.toggle('active', item.dataset.category === categoryId);
    });

    this.options.activeCategory = categoryId;
    this.options.onCategorySelect(categoryId);
  }

  /**
   * Get total snippet count
   */
  getTotalCount() {
    return this.options.categories.reduce((total, cat) => {
      return total + (cat.count || 0);
    }, 0);
  }

  /**
   * Update categories
   */
  updateCategories(categories) {
    this.options.categories = categories;
    this.refresh();
  }

  /**
   * Update active category
   */
  setActiveCategory(categoryId) {
    this.options.activeCategory = categoryId;
    $$('.category-item', this.element).forEach(item => {
      item.classList.toggle('active', item.dataset.category === categoryId);
    });
  }

  /**
   * Expand/collapse category
   */
  toggleCategory(categoryId) {
    const item = $(`.category-item[data-category="${categoryId}"]`, this.element);
    if (item && item.classList.contains('expandable')) {
      item.classList.toggle('expanded');
      const icon = $('.expand-icon', item);
      if (icon) {
        icon.textContent = item.classList.contains('expanded') ? '▼' : '▶';
      }
    }
  }

  /**
   * Refresh the sidebar
   */
  refresh() {
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