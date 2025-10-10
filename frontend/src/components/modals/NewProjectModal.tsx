/**
 * New Project Modal - Piękny wizard tworzenia projektów
 * @description Elegancki wizard z krokami: wybór typu → konfiguracja
 */

import React, { memo, useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Rocket,
  FolderPlus,
  GitBranch,
  Settings,
  Database,
  Globe,
  Smartphone,
  Code,
} from 'lucide-react';
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

type ProjectType = 'new' | 'existing';
type WizardStep = 'type' | 'config';

export const NewProjectModal = memo<NewProjectModalProps>(
  ({ isOpen, onClose, onSubmit, isLoading }) => {
    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('type');
    const [projectType, setProjectType] = useState<ProjectType>('new');

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
          technologies:
            formData.technologies.length > 0
              ? formData.technologies
              : undefined,
        });

        if (result.success) {
          resetWizard();
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

    if (!isOpen) return null;

    const resetWizard = () => {
      setCurrentStep('type');
      setProjectType('new');
      setFormData({
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
    };

    const handleNext = () => {
      if (currentStep === 'type') {
        setCurrentStep('config');
      }
    };

    const handleBack = () => {
      if (currentStep === 'config') {
        setCurrentStep('type');
      }
    };

    const handleCloseModal = () => {
      resetWizard();
      onClose();
    };

    return (
      <div className={styles.overlay} onClick={handleCloseModal}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <h2>🚀 Kreator Nowego Projektu</h2>
            <button
              className={styles.closeButton}
              onClick={handleCloseModal}
              title="Zamknij"
            >
              <X size={24} />
            </button>
          </div>

          {/* Progress Steps */}
          <div className={styles.wizardProgress}>
            <div
              className={`${styles.step} ${
                currentStep === 'type' ? styles.active : ''
              } ${currentStep === 'config' ? styles.completed : ''}`}
            >
              <div className={styles.stepNumber}>1</div>
              <span>Typ Projektu</span>
            </div>
            <div className={styles.stepLine}></div>
            <div
              className={`${styles.step} ${
                currentStep === 'config' ? styles.active : ''
              }`}
            >
              <div className={styles.stepNumber}>2</div>
              <span>Konfiguracja</span>
            </div>
          </div>

          {/* Wizard Content */}
          {currentStep === 'type' && (
            <div className={styles.wizardStep}>
              <h3>📋 Wybierz typ projektu</h3>
              <p className={styles.stepDescription}>
                Wybierz czy chcesz stworzyć nową aplikację od zera, czy pracować
                z istniejącym projektem.
              </p>

              <div className={styles.projectTypeCards}>
                <div
                  className={`${styles.typeCard} ${
                    projectType === 'new' ? styles.selected : ''
                  }`}
                  onClick={() => setProjectType('new')}
                >
                  <Rocket size={40} className={styles.cardIcon} />
                  <h4>Nowa Aplikacja</h4>
                  <p>Stworzę nową aplikację od podstaw z pełnym AI workflow</p>
                  <ul>
                    <li>🎨 Projektowanie UI/UX</li>
                    <li>⚡ Generowanie kodu</li>
                    <li>🧪 Automatyczne testy</li>
                    <li>🚀 Deployment</li>
                  </ul>
                </div>

                <div
                  className={`${styles.typeCard} ${
                    projectType === 'existing' ? styles.selected : ''
                  }`}
                  onClick={() => setProjectType('existing')}
                >
                  <FolderPlus size={40} className={styles.cardIcon} />
                  <h4>Istniejący Projekt</h4>
                  <p>Zaimportuję i rozwinę istniejący kod</p>
                  <ul>
                    <li>📂 Import repozytorium</li>
                    <li>🔍 Analiza kodu</li>
                    <li>✨ Refaktoryzacja</li>
                    <li>➕ Nowe funkcje</li>
                  </ul>
                </div>
              </div>

              <div className={styles.wizardActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={handleCloseModal}
                >
                  Anuluj
                </button>
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handleNext}
                  disabled={!projectType}
                >
                  Dalej <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {currentStep === 'config' && (
            <form onSubmit={handleSubmit} className={styles.wizardStep}>
              <h3>
                <Settings size={20} />
                Konfiguracja{' '}
                {projectType === 'new'
                  ? 'nowej aplikacji'
                  : 'istniejącego projektu'}
              </h3>

              {projectType === 'new' && (
                <div className={styles.newProjectConfig}>
                  <div className={styles.formGroup}>
                    <label htmlFor="projectName">Nazwa aplikacji *</label>
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
                    <label htmlFor="projectDescription">
                      Opis funkcjonalności *
                    </label>
                    <textarea
                      id="projectDescription"
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Opisz czego potrzebujesz w aplikacji... np. sklep internetowy z płatnościami, system zarządzania projektami z zadaniami i teamem, portal społecznościowy z czatem..."
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

                  <div className={styles.technologySelector}>
                    <label>Preferowane technologie (opcjonalnie)</label>
                    <div className={styles.techGrid}>
                      {[
                        { name: 'React', icon: Globe },
                        { name: 'Vue', icon: Globe },
                        { name: 'Angular', icon: Globe },
                        { name: 'Node.js', icon: Database },
                        { name: 'Python', icon: Code },
                        { name: 'Java', icon: Code },
                        { name: 'PHP', icon: Code },
                        { name: 'Mobile', icon: Smartphone },
                      ].map(tech => (
                        <button
                          key={tech.name}
                          type="button"
                          className={`${styles.techButton} ${
                            formData.technologies.includes(tech.name)
                              ? styles.selected
                              : ''
                          }`}
                          onClick={() => {
                            const techs = formData.technologies.includes(
                              tech.name
                            )
                              ? formData.technologies.filter(
                                  t => t !== tech.name
                                )
                              : [...formData.technologies, tech.name];
                            setFormData(prev => ({
                              ...prev,
                              technologies: techs,
                            }));
                          }}
                        >
                          <tech.icon size={16} />
                          {tech.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {projectType === 'existing' && (
                <div className={styles.existingProjectConfig}>
                  <div className={styles.formGroup}>
                    <label htmlFor="projectName">Nazwa projektu *</label>
                    <input
                      id="projectName"
                      type="text"
                      value={formData.name}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="np. Moja aplikacja"
                      className={errors.name ? styles.error : ''}
                      required
                    />
                    {errors.name && (
                      <span className={styles.errorMessage}>{errors.name}</span>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="repositoryUrl">
                      URL repozytorium (opcjonalnie)
                    </label>
                    <div className={styles.inputWithIcon}>
                      <GitBranch size={16} />
                      <input
                        id="repositoryUrl"
                        type="url"
                        placeholder="https://github.com/user/repo"
                      />
                    </div>
                    <small>
                      Jeśli podasz link do repo, przeanalizuję kod automatycznie
                    </small>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="projectDescription">
                      Obecny stan i potrzeby *
                    </label>
                    <textarea
                      id="projectDescription"
                      value={formData.description}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Opisz obecny projekt i co chcesz ulepszyć... np. Mam sklep w PHP, chcę dodać płatności i panel administracyjny. Lub: Aplikacja React działa, ale potrzebuję optymalizacji i nowych funkcji."
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
                </div>
              )}

              {submitError && (
                <div className={styles.errorMessage}>{submitError}</div>
              )}

              <div className={styles.wizardActions}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Wstecz
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Tworzenie...' : '🚀 Stwórz projekt'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
);

NewProjectModal.displayName = 'NewProjectModal';
