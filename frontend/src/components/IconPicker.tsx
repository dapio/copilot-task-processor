/**
 * Icon Picker Component
 * ThinkCode AI Platform - Project Icon Selection
 */

import React, { useState } from 'react';
import styles from '../styles/icon-picker.module.css';
import {
  PROJECT_ICONS,
  PROJECT_ICON_CATEGORIES,
  ProjectIconOption,
  getIconsByCategory,
} from '../constants/projectIcons';

interface IconPickerProps {
  selectedIcon?: string;
  onIconSelect: (icon: ProjectIconOption) => void;
  className?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onIconSelect,
  className,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<string>('technology');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredIcons = searchQuery
    ? PROJECT_ICONS.filter(icon =>
        icon.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getIconsByCategory(selectedCategory);

  return (
    <div className={`${styles.iconPicker} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>Wybierz ikonę projektu</h3>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Szukaj ikon..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>
      </div>

      {!searchQuery && (
        <div className={styles.categories}>
          {PROJECT_ICON_CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`${styles.categoryButton} ${
                selectedCategory === category.id ? styles.active : ''
              }`}
              onClick={() => setSelectedCategory(category.id)}
              data-category-color={category.color}
              data-is-active={selectedCategory === category.id}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      <div className={styles.iconGrid}>
        {filteredIcons.map(icon => (
          <button
            key={icon.id}
            className={`${styles.iconButton} ${
              selectedIcon === icon.emoji ? styles.selected : ''
            }`}
            onClick={() => onIconSelect(icon)}
            title={icon.name}
          >
            <span className={styles.iconEmoji}>{icon.emoji}</span>
            <span className={styles.iconName}>{icon.name}</span>
          </button>
        ))}
      </div>

      {filteredIcons.length === 0 && (
        <div className={styles.noResults}>
          <span className={styles.noResultsIcon}>🔍</span>
          <p>Nie znaleziono ikon dla &ldquo;{searchQuery}&rdquo;</p>
        </div>
      )}
    </div>
  );
};

export default IconPicker;
