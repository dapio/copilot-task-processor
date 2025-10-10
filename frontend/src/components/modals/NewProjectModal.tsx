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
  Upload,
  Brain,
  Shield,
  Zap,
} from 'lucide-react';
import type { ProjectData } from '../../types/dashboard.types';
import EnhancedFileUpload, { UploadedFile } from '../EnhancedFileUpload';
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
type WizardStep = 'type' | 'config' | 'files';

export const NewProjectModal = memo<NewProjectModalProps>(
  ({ isOpen, onClose, onSubmit, isLoading }) => {
    // Wizard state
    const [currentStep, setCurrentStep] = useState<WizardStep>('type');
    const [projectType, setProjectType] = useState<ProjectType>('new');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

    const handleFilesUploaded = (files: UploadedFile[]) => {
      setUploadedFiles(prev => [...prev, ...files]);
    };

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
      icon: 'fas fa-rocket' as string,
      // Nowe parametry konfiguracyjne
      category: '',
      aiModel: 'gpt-4',
      maxTokens: 8000,
      temperature: 0.7,
      enabledFeatures: [] as string[],
      defaultAgentType: 'general',
      workflowTimeout: 300,
      autoBackup: true,
      notifications: {
        email: true,
        taskCompletion: true,
        workflowErrors: true,
        agentUpdates: false,
      },
      repository: {
        url: '',
        branch: 'main',
        accessToken: '',
        autoSync: false,
      },
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

    const handleSubmit = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
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
          uploadedFiles: uploadedFiles,
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
        icon: 'fas fa-rocket' as string,
        // Nowe parametry konfiguracyjne
        category: '',
        aiModel: 'gpt-4',
        maxTokens: 8000,
        temperature: 0.7,
        enabledFeatures: [] as string[],
        defaultAgentType: 'general',
        workflowTimeout: 300,
        autoBackup: true,
        notifications: {
          email: true,
          taskCompletion: true,
          workflowErrors: true,
          agentUpdates: false,
        },
        repository: {
          url: '',
          branch: 'main',
          accessToken: '',
          autoSync: false,
        },
      });
      setUploadedFiles([]);
    };

    const handleNext = () => {
      if (currentStep === 'type') {
        setCurrentStep('config');
      } else if (currentStep === 'config') {
        setCurrentStep('files');
      }
    };

    const handleBack = () => {
      if (currentStep === 'config') {
        setCurrentStep('type');
      } else if (currentStep === 'files') {
        setCurrentStep('config');
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
              } ${
                currentStep === 'config' || currentStep === 'files'
                  ? styles.completed
                  : ''
              }`}
            >
              <div className={styles.stepNumber}>1</div>
              <span>Typ Projektu</span>
            </div>
            <div className={styles.stepLine}></div>
            <div
              className={`${styles.step} ${
                currentStep === 'config' ? styles.active : ''
              } ${currentStep === 'files' ? styles.completed : ''}`}
            >
              <div className={styles.stepNumber}>2</div>
              <span>Konfiguracja</span>
            </div>
            <div className={styles.stepLine}></div>
            <div
              className={`${styles.step} ${
                currentStep === 'files' ? styles.active : ''
              }`}
            >
              <div className={styles.stepNumber}>3</div>
              <span>Pliki</span>
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

              {/* Nowe sekcje konfiguracyjne */}
              <div className={styles.configSections}>
                <div className={styles.configSection}>
                  <h4>
                    <Brain size={16} /> Konfiguracja AI
                  </h4>
                  <div className={styles.configGrid}>
                    <div className={styles.formGroup}>
                      <label>Model AI</label>
                      <select
                        value={formData.aiModel}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            aiModel: e.target.value,
                          }))
                        }
                        title="Wybierz model AI"
                      >
                        <option value="gpt-4">GPT-4 (Zalecany)</option>
                        <option value="gpt-3.5">GPT-3.5 Turbo</option>
                        <option value="claude-3">Claude 3</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Temperatura ({formData.temperature})</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.temperature}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            temperature: parseFloat(e.target.value),
                          }))
                        }
                        title="Ustaw temperaturę AI"
                      />
                      <small>
                        Większa wartość = bardziej kreatywne odpowiedzi
                      </small>
                    </div>
                  </div>
                </div>

                <div className={styles.configSection}>
                  <h4>
                    <Shield size={16} /> Bezpieczeństwo & Automatyzacja
                  </h4>
                  <div className={styles.checkboxGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.autoBackup}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            autoBackup: e.target.checked,
                          }))
                        }
                      />
                      Automatyczne backupy
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.notifications.email}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              email: e.target.checked,
                            },
                          }))
                        }
                      />
                      Powiadomienia email
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.notifications.workflowErrors}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              workflowErrors: e.target.checked,
                            },
                          }))
                        }
                      />
                      Alerty o błędach
                    </label>
                  </div>
                </div>

                <div className={styles.configSection}>
                  <h4>
                    <Zap size={16} /> Wydajność
                  </h4>
                  <div className={styles.configGrid}>
                    <div className={styles.formGroup}>
                      <label>Timeout workflow (sekundy)</label>
                      <input
                        type="number"
                        min="60"
                        max="3600"
                        value={formData.workflowTimeout}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            workflowTimeout: parseInt(e.target.value),
                          }))
                        }
                        title="Timeout workflow w sekundach"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Max tokenów</label>
                      <select
                        value={formData.maxTokens}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            maxTokens: parseInt(e.target.value),
                          }))
                        }
                        title="Wybierz limit tokenów"
                      >
                        <option value="4000">4K (Szybko)</option>
                        <option value="8000">8K (Zalecane)</option>
                        <option value="16000">16K (Dokładnie)</option>
                        <option value="32000">32K (Bardzo dokładnie)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.wizardActions}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Wstecz
                </button>
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handleNext}
                >
                  Dalej <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {currentStep === 'files' && (
            <div className={styles.wizardStep}>
              <h3>
                <Upload size={20} />
                📁 Ładowanie plików projektu
              </h3>
              <p className={styles.stepDescription}>
                Przesyłaj pliki źródłowe, dokumentację, mockupy i inne materiały
                potrzebne do realizacji projektu. System automatycznie analizuje
                i kategoryzuje przesłane pliki.
              </p>

              <div className={styles.fileUploadSection}>
                <EnhancedFileUpload
                  projectId="temp-project-id"
                  acceptedFiles="*"
                  maxFiles={50}
                  maxFileSize={50}
                  multiple={true}
                  uploadUrl="/api/upload"
                  onFilesUploaded={handleFilesUploaded}
                  title="Przeciągnij pliki tutaj lub kliknij aby wybrać"
                  description="Obsługujemy wszystkie formaty plików - kod, dokumenty, obrazy, archiwea"
                  showPreview={true}
                  className={styles.dropzoneContainer}
                />

                {uploadedFiles.length > 0 && (
                  <div className={styles.uploadedFilesPreview}>
                    <h4>📂 Przesłane pliki ({uploadedFiles.length})</h4>
                    <div className={styles.filesList}>
                      {uploadedFiles.map(file => (
                        <div key={file.id} className={styles.fileItem}>
                          <div className={styles.fileIcon}>
                            {file.type.startsWith('image/')
                              ? '🖼️'
                              : file.type.includes('pdf')
                              ? '📄'
                              : file.type.includes('text')
                              ? '📝'
                              : file.type.includes('zip')
                              ? '📦'
                              : '📄'}
                          </div>
                          <div className={styles.fileInfo}>
                            <span className={styles.fileName}>{file.name}</span>
                            <span className={styles.fileSize}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <div className={styles.fileCategory}>
                            {file.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.wizardActions}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBack}
                >
                  <ArrowLeft size={16} /> Wstecz
                </button>
                <button
                  type="button"
                  className={styles.submitButton}
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? '⏳ Tworzenie...' : '🚀 Stwórz projekt'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

NewProjectModal.displayName = 'NewProjectModal';
