/**
 * New Project Modal - Modal do tworzenia nowych projektów
 * @description Formularz tworzenia nowego projektu z walidacją
 */

import React, { memo, useState } from 'react';
import { X, Plus, Calendar, Users, DollarSign, Code, Info } from 'lucide-react';
import type { ProjectData } from '../../types/dashboard.types';
import styles from '../../styles/new-project-modal.module.css';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    project: Omit<ProjectData, 'id'>
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export const NewProjectModal = memo<NewProjectModalProps>(
  ({ isOpen, onClose, onSubmit, isLoading }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      status: 'pending' as ProjectData['status'],
      priority: 'medium' as ProjectData['priority'],
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      team: [] as string[],
      tasks: [] as any[],
      client: '',
      budget: 0,
      technologies: [] as string[],
    });

    const [newTeamMember, setNewTeamMember] = useState('');
    const [newTechnology, setNewTechnology] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitError, setSubmitError] = useState('');

    const validateForm = () => {
      const newErrors: Record<string, string> = {};

      if (!formData.name.trim()) {
        newErrors.name = 'Nazwa projektu jest wymagana';
      }

      if (!formData.description.trim()) {
        newErrors.description = 'Opis projektu jest wymagany';
      }

      if (
        formData.endDate &&
        new Date(formData.endDate) <= new Date(formData.startDate)
      ) {
        newErrors.endDate =
          'Data zakończenia musi być później niż data rozpoczęcia';
      }

      if (formData.budget < 0) {
        newErrors.budget = 'Budżet nie może być ujemny';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitError('');

      if (!validateForm()) {
        return;
      }

      try {
        const result = await onSubmit({
          ...formData,
          endDate: formData.endDate || undefined,
          budget: formData.budget || undefined,
          technologies:
            formData.technologies.length > 0
              ? formData.technologies
              : undefined,
        });

        if (result.success) {
          // Reset form and close modal
          setFormData({
            name: '',
            description: '',
            status: 'pending',
            priority: 'medium',
            progress: 0,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            team: [],
            tasks: [],
            client: '',
            budget: 0,
            technologies: [],
          });
          setErrors({});
          onClose();
        } else {
          setSubmitError(
            result.error || 'Wystąpił błąd podczas tworzenia projektu'
          );
        }
      } catch (error) {
        setSubmitError(
          `Wystąpił nieoczekiwany błąd: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    };

    const addTeamMember = () => {
      if (
        newTeamMember.trim() &&
        !formData.team.includes(newTeamMember.trim())
      ) {
        setFormData(prev => ({
          ...prev,
          team: [...prev.team, newTeamMember.trim()],
        }));
        setNewTeamMember('');
      }
    };

    const removeTeamMember = (member: string) => {
      setFormData(prev => ({
        ...prev,
        team: prev.team.filter(m => m !== member),
      }));
    };

    const addTechnology = () => {
      if (
        newTechnology.trim() &&
        !formData.technologies.includes(newTechnology.trim())
      ) {
        setFormData(prev => ({
          ...prev,
          technologies: [...prev.technologies, newTechnology.trim()],
        }));
        setNewTechnology('');
      }
    };

    const removeTechnology = (tech: string) => {
      setFormData(prev => ({
        ...prev,
        technologies: prev.technologies.filter(t => t !== tech),
      }));
    };

    if (!isOpen) return null;

    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <h2>Nowy Projekt</h2>
            <button
              className={styles.closeButton}
              onClick={onClose}
              title="Zamknij"
            >
              <X size={24} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Basic Information */}
            <div className={styles.section}>
              <h3>
                <Info size={20} />
                Podstawowe informacje
              </h3>

              <div className={styles.formGroup}>
                <label htmlFor="projectName">Nazwa projektu *</label>
                <input
                  id="projectName"
                  type="text"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="np. Platforma e-commerce"
                  className={errors.name ? styles.error : ''}
                  required
                />
                {errors.name && (
                  <span className={styles.errorMessage}>{errors.name}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="projectDescription">Opis projektu *</label>
                <textarea
                  id="projectDescription"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Szczegółowy opis projektu..."
                  rows={4}
                  className={errors.description ? styles.error : ''}
                  required
                />
                {errors.description && (
                  <span className={styles.errorMessage}>
                    {errors.description}
                  </span>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="projectStatus">Status</label>
                  <select
                    id="projectStatus"
                    value={formData.status}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        status: e.target.value as ProjectData['status'],
                      }))
                    }
                  >
                    <option value="pending">Oczekujący</option>
                    <option value="active">Aktywny</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="projectPriority">Priorytet</label>
                  <select
                    id="projectPriority"
                    value={formData.priority}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        priority: e.target.value as ProjectData['priority'],
                      }))
                    }
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Średni</option>
                    <option value="high">Wysoki</option>
                    <option value="urgent">Pilny</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="projectClient">Klient</label>
                <input
                  id="projectClient"
                  type="text"
                  value={formData.client}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, client: e.target.value }))
                  }
                  placeholder="Nazwa klienta lub organizacji"
                />
              </div>
            </div>

            {/* Timeline & Budget */}
            <div className={styles.section}>
              <h3>
                <Calendar size={20} />
                Timeline i budżet
              </h3>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="startDate">Data rozpoczęcia</label>
                  <input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="endDate">Data zakończenia</label>
                  <input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className={errors.endDate ? styles.error : ''}
                  />
                  {errors.endDate && (
                    <span className={styles.errorMessage}>
                      {errors.endDate}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="budget">Budżet (PLN)</label>
                <div className={styles.inputWithIcon}>
                  <DollarSign size={20} />
                  <input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        budget: Number(e.target.value),
                      }))
                    }
                    placeholder="0"
                    min="0"
                    className={errors.budget ? styles.error : ''}
                  />
                </div>
                {errors.budget && (
                  <span className={styles.errorMessage}>{errors.budget}</span>
                )}
              </div>
            </div>

            {/* Team */}
            <div className={styles.section}>
              <h3>
                <Users size={20} />
                Zespół
              </h3>

              <div className={styles.formGroup}>
                <label>Członkowie zespołu</label>
                <div className={styles.addItemContainer}>
                  <input
                    type="text"
                    value={newTeamMember}
                    onChange={e => setNewTeamMember(e.target.value)}
                    placeholder="Nazwa agenta lub ID"
                    onKeyPress={e =>
                      e.key === 'Enter' && (e.preventDefault(), addTeamMember())
                    }
                  />
                  <button
                    type="button"
                    onClick={addTeamMember}
                    className={styles.addButton}
                    title="Dodaj członka zespołu"
                    aria-label="Dodaj członka zespołu"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className={styles.tagsList}>
                  {formData.team.map(member => (
                    <span key={member} className={styles.tag}>
                      {member}
                      <button
                        type="button"
                        onClick={() => removeTeamMember(member)}
                        className={styles.removeTag}
                        title={`Usuń ${member} z zespołu`}
                        aria-label={`Usuń ${member} z zespołu`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Technologies */}
            <div className={styles.section}>
              <h3>
                <Code size={20} />
                Technologie
              </h3>

              <div className={styles.formGroup}>
                <label>Technologie i narzędzia</label>
                <div className={styles.addItemContainer}>
                  <input
                    type="text"
                    value={newTechnology}
                    onChange={e => setNewTechnology(e.target.value)}
                    placeholder="np. React, Node.js, PostgreSQL"
                    onKeyPress={e =>
                      e.key === 'Enter' && (e.preventDefault(), addTechnology())
                    }
                  />
                  <button
                    type="button"
                    onClick={addTechnology}
                    className={styles.addButton}
                    title="Dodaj technologię"
                    aria-label="Dodaj technologię do projektu"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className={styles.tagsList}>
                  {formData.technologies.map(tech => (
                    <span key={tech} className={styles.tag}>
                      {tech}
                      <button
                        type="button"
                        onClick={() => removeTechnology(tech)}
                        className={styles.removeTag}
                        title={`Usuń technologię ${tech}`}
                        aria-label={`Usuń technologię ${tech} z projektu`}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {submitError && (
              <div className={styles.submitError}>{submitError}</div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
                disabled={isLoading}
              >
                Anuluj
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Tworzenie...' : 'Utwórz projekt'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
);

NewProjectModal.displayName = 'NewProjectModal';
