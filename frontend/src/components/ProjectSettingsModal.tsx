/**
 * Project Settings Modal Component
 * ThinkCode AI Platform - Project Configuration
 */

import React, { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { ProjectIconOption } from '../constants/projectIcons';
import IconPicker from './IconPicker';
import styles from '../styles/project-settings-modal.module.css';

interface ProjectSettingsModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Project>) => void;
}

const PROJECT_COLORS = [
  { name: 'Niebieski', value: '#667eea' },
  { name: 'Fioletowy', value: '#764ba2' },
  { name: 'Zielony', value: '#00b894' },
  { name: 'Żółty', value: '#feca57' },
  { name: 'Różowy', value: '#fd79a8' },
  { name: 'Pomarańczowy', value: '#fdcb6e' },
  { name: 'Czerwony', value: '#e84393' },
  { name: 'Turkusowy', value: '#00cec9' },
  { name: 'Indygo', value: '#a29bfe' },
  { name: 'Granatowy', value: '#0984e3' },
];

const PROJECT_STATUSES = [
  {
    value: 'active',
    label: '🟢 Aktywny',
    description: 'Projekt jest obecnie rozwijany',
  },
  {
    value: 'in-progress',
    label: '🔄 W trakcie',
    description: 'Projekt jest w trakcie realizacji',
  },
  {
    value: 'pending',
    label: '⏳ Oczekuje',
    description: 'Projekt oczekuje na rozpoczęcie',
  },
  {
    value: 'draft',
    label: '📝 Szkic',
    description: 'Projekt w fazie planowania',
  },
  {
    value: 'paused',
    label: '🟡 Wstrzymany',
    description: 'Projekt tymczasowo wstrzymany',
  },
  {
    value: 'completed',
    label: '✅ Ukończony',
    description: 'Projekt został zakończony pomyślnie',
  },
  {
    value: 'archived',
    label: '📦 Archiwum',
    description: 'Projekt zakończony i zarchiwizowany',
  },
];

export const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#667eea',
    icon: '🚀',
    status: 'active' as Project['status'],
    tags: [] as string[],
  });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        color: project.color || '#667eea',
        icon: project.icon || '🚀',
        status: project.status,
        tags: [...project.tags],
      });
    }
  }, [project]);

  const handleSave = () => {
    if (!project) return;

    const updates: Partial<Project> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      color: formData.color,
      icon: formData.icon,
      status: formData.status,
      tags: formData.tags,
      updatedAt: new Date(),
    };

    onSave(updates);
    onClose();
  };

  const handleIconSelect = (iconOption: ProjectIconOption) => {
    setFormData(prev => ({ ...prev, icon: iconOption.emoji }));
    setShowIconPicker(false);
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Ustawienia projektu</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.section}>
            <label className={styles.label}>Nazwa projektu</label>
            <input
              type="text"
              className={styles.input}
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Wprowadź nazwę projektu"
              maxLength={100}
            />
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Opis</label>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Opisz swój projekt..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.section}>
              <label className={styles.label}>Ikona</label>
              <div className={styles.iconSelector}>
                <button
                  className={styles.iconButton}
                  onClick={() => setShowIconPicker(!showIconPicker)}
                >
                  <span className={styles.selectedIcon}>{formData.icon}</span>
                  <span className={styles.iconButtonText}>Zmień ikonę</span>
                </button>
              </div>
              {showIconPicker && (
                <div className={styles.iconPickerContainer}>
                  <IconPicker
                    selectedIcon={formData.icon}
                    onIconSelect={handleIconSelect}
                  />
                </div>
              )}
            </div>

            <div className={styles.section}>
              <label className={styles.label}>Kolor wiodący</label>
              <div className={styles.colorGrid}>
                {PROJECT_COLORS.map(color => (
                  <button
                    key={color.value}
                    className={`${styles.colorButton} ${
                      formData.color === color.value ? styles.selected : ''
                    }`}
                    data-color={color.value}
                    onClick={() =>
                      setFormData(prev => ({ ...prev, color: color.value }))
                    }
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Status projektu</label>
            <div className={styles.statusGrid}>
              {PROJECT_STATUSES.map(status => (
                <button
                  key={status.value}
                  className={`${styles.statusButton} ${
                    formData.status === status.value ? styles.selected : ''
                  }`}
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      status: status.value as Project['status'],
                    }))
                  }
                >
                  <span className={styles.statusLabel}>{status.label}</span>
                  <span className={styles.statusDescription}>
                    {status.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>Tagi</label>
            <div className={styles.tagsContainer}>
              <div className={styles.tagsList}>
                {formData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      className={styles.removeTagButton}
                      onClick={() => removeTag(tag)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className={styles.addTagContainer}>
                <input
                  type="text"
                  className={styles.tagInput}
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Dodaj tag..."
                  maxLength={20}
                />
                <button
                  className={styles.addTagButton}
                  onClick={addTag}
                  disabled={!newTag.trim()}
                >
                  Dodaj
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Anuluj
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!formData.name.trim()}
          >
            Zapisz zmiany
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;
