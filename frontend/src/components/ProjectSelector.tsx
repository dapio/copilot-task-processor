/**
 * Project Selector Component
 * ThinkCode AI Platform - Beautiful Project Selection Interface
 */

import React, { useState } from 'react';
import { Project, CreateProjectForm } from '../types/project';
import { useProject } from '../contexts/ProjectContext';
import styles from '../styles/project-selector.module.css';

interface ProjectSelectorProps {
  onProjectSelected: (project: Project) => void;
}

export default function ProjectSelector({
  onProjectSelected,
}: ProjectSelectorProps) {
  const { projects, loading, error, createProject } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Filter projects based on search query
  const filteredProjects = projects.filter(
    project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags.some(tag =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  const handleCreateProject = async (projectForm: CreateProjectForm) => {
    setIsCreating(true);
    try {
      const newProject = await createProject(projectForm);
      setShowCreateForm(false);
      onProjectSelected(newProject);
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>🚀</span>
              ThinkCode AI Platform
            </h1>
            <p className={styles.subtitle}>
              Wybierz projekt lub utwórz nowy, aby rozpocząć pracę z agentami AI
            </p>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>📂</span>
              <div className={styles.statInfo}>
                <div className={styles.statNumber}>{projects.length}</div>
                <div className={styles.statLabel}>Projektów</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>🤖</span>
              <div className={styles.statInfo}>
                <div className={styles.statNumber}>
                  {projects.reduce((sum, p) => sum + p.stats.totalAgents, 0)}
                </div>
                <div className={styles.statLabel}>Agentów</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>✅</span>
              <div className={styles.statInfo}>
                <div className={styles.statNumber}>
                  {projects.reduce((sum, p) => sum + p.stats.completedTasks, 0)}
                </div>
                <div className={styles.statLabel}>Zadań</div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Szukaj projektów..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {projects.length === 0 ? (
          <EmptyState onCreateFirst={() => setShowCreateForm(true)} />
        ) : (
          <div className={styles.projectGrid}>
            <CreateProjectCard
              onClick={() => setShowCreateForm(true)}
              disabled={isCreating}
            />

            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => onProjectSelected(project)}
                animationDelay={index * 100}
              />
            ))}
          </div>
        )}

        {filteredProjects.length === 0 && projects.length > 0 && (
          <NoResultsState
            query={searchQuery}
            onClearSearch={() => setSearchQuery('')}
          />
        )}
      </div>

      {showCreateForm && (
        <CreateProjectModal
          onSubmit={handleCreateProject}
          onClose={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onClick,
  animationDelay = 0,
}: {
  project: Project;
  onClick: () => void;
  animationDelay?: number;
}) {
  const statusLabels = {
    active: 'Aktywny',
    paused: 'Wstrzymany',
    completed: 'Ukończony',
    archived: 'Zarchiwizowany',
  };

  return (
    <div
      className={styles.projectCard}
      onClick={onClick}
      data-project-color={project.color || '#667eea'}
      data-animation-delay={animationDelay}
    >
      <div className={styles.cardHeader}>
        <div
          className={styles.cardIcon}
          data-project-color={project.color || '#667eea'}
        >
          📂
        </div>
        <div
          className={`${styles.cardStatus} ${
            styles[`status-${project.status}`]
          }`}
        >
          {statusLabels[project.status]}
        </div>
      </div>

      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{project.name}</h3>
        <p className={styles.cardDescription}>
          {project.description || 'Brak opisu'}
        </p>
      </div>

      <div className={styles.cardStats}>
        <div className={styles.cardStat}>
          <span className={styles.cardStatIcon}>🤖</span>
          <span className={styles.cardStatValue}>
            {project.stats.totalAgents}
          </span>
          <span className={styles.cardStatLabel}>Agentów</span>
        </div>
        <div className={styles.cardStat}>
          <span className={styles.cardStatIcon}>📋</span>
          <span className={styles.cardStatValue}>
            {project.stats.totalTasks}
          </span>
          <span className={styles.cardStatLabel}>Zadań</span>
        </div>
        <div className={styles.cardStat}>
          <span className={styles.cardStatIcon}>⚡</span>
          <span className={styles.cardStatValue}>
            {project.stats.activeWorkflows}
          </span>
          <span className={styles.cardStatLabel}>Workflow</span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.cardTags}>
          {project.tags.slice(0, 2).map((tag, index) => (
            <span key={index} className={styles.cardTag}>
              {tag}
            </span>
          ))}
          {project.tags.length > 2 && (
            <span className={styles.cardTag}>+{project.tags.length - 2}</span>
          )}
        </div>

        <div className={styles.cardDate}>
          {project.stats.lastActivity.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      </div>
    </div>
  );
}

function CreateProjectCard({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`${styles.createCard} ${disabled ? styles.disabled : ''}`}
      onClick={disabled ? undefined : onClick}
    >
      <div className={styles.createIcon}>{disabled ? '⏳' : '➕'}</div>
      <h3 className={styles.createTitle}>
        {disabled ? 'Tworzenie...' : 'Nowy Projekt'}
      </h3>
      <p className={styles.createDescription}>
        {disabled
          ? 'Proszę czekać, projekt jest tworzony'
          : 'Kliknij, aby utworzyć nowy projekt i rozpocząć pracę'}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className={styles.loadingState}>
      <div className={styles.loadingIcon}>⏳</div>
      <h2 className={styles.loadingTitle}>Ładowanie projektów...</h2>
      <p className={styles.loadingDescription}>
        Proszę czekać, pobieramy Twoje projekty
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.errorState}>
      <div className={styles.errorIcon}>❌</div>
      <h2 className={styles.errorTitle}>Wystąpił błąd</h2>
      <p className={styles.errorDescription}>{message}</p>
      <button
        className={styles.errorButton}
        onClick={() => window.location.reload()}
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}

function EmptyState({ onCreateFirst }: { onCreateFirst: () => void }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>🚀</div>
      <h2 className={styles.emptyTitle}>Witaj w ThinkCode AI Platform!</h2>
      <p className={styles.emptyDescription}>
        Zacznij swoją przygodę z AI tworząc pierwszy projekt. Każdy projekt to
        oddzielna przestrzeń dla Twoich agentów, zadań i automatyzacji.
      </p>
      <button className={styles.emptyButton} onClick={onCreateFirst}>
        <span className={styles.buttonIcon}>➕</span>
        Utwórz pierwszy projekt
      </button>
    </div>
  );
}

function NoResultsState({
  query,
  onClearSearch,
}: {
  query: string;
  onClearSearch: () => void;
}) {
  return (
    <div className={styles.noResultsState}>
      <div className={styles.noResultsIcon}>🔍</div>
      <h3 className={styles.noResultsTitle}>
        Nie znaleziono projektów dla &quot;{query}&quot;
      </h3>
      <p className={styles.noResultsDescription}>
        Spróbuj zmienić wyszukiwane hasło lub wyczyść filtr
      </p>
      <button className={styles.noResultsButton} onClick={onClearSearch}>
        Wyczyść wyszukiwanie
      </button>
    </div>
  );
}

function CreateProjectModal({
  onSubmit,
  onClose,
  isLoading = false,
}: {
  onSubmit: (project: CreateProjectForm) => void;
  onClose: () => void;
  isLoading?: boolean;
}) {
  const [formData, setFormData] = useState<CreateProjectForm>({
    name: '',
    description: '',
    color: '#667eea',
    tags: [],
    settings: {},
    repository: {
      type: 'github',
      url: '',
      branch: 'main',
      isPrivate: false,
      syncEnabled: false,
    },
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const colors = [
    '#667eea',
    '#764ba2',
    '#00d4aa',
    '#01a085',
    '#f093fb',
    '#f5576c',
    '#4facfe',
    '#00f2fe',
    '#43e97b',
    '#38f9d7',
    '#ffecd2',
    '#fcb69f',
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className={styles.modalIcon}>🚀</span>
            Nowy Projekt
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="projectName" className={styles.formLabel}>
              Nazwa projektu *
            </label>
            <input
              id="projectName"
              type="text"
              required
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              placeholder="Np. Analiza dokumentów HR"
              className={styles.formInput}
              disabled={isLoading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="projectDescription" className={styles.formLabel}>
              Opis projektu
            </label>
            <textarea
              id="projectDescription"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder="Krótki opis tego, czym będzie się zajmować projekt..."
              className={styles.formTextarea}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Kolor projektu</label>
            <div className={styles.colorPicker}>
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`${styles.colorOption} ${
                    formData.color === color ? styles.selected : ''
                  }`}
                  data-color={color}
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  disabled={isLoading}
                  title={`Wybierz kolor ${color}`}
                  aria-label={`Wybierz kolor ${color}`}
                />
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <span className={styles.labelIcon}>🔗</span>
              Repozytorium Git (opcjonalne)
            </label>
            <div className={styles.repositorySection}>
              <select
                id="repositoryType"
                title="Wybierz typ repozytorium"
                aria-label="Typ repozytorium"
                value={formData.repository?.type || ''}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    repository: {
                      ...prev.repository,
                      type: e.target.value as any,
                    },
                  }))
                }
                className={styles.formSelect}
                disabled={isLoading}
              >
                <option value="">Wybierz typ repozytorium</option>
                <option value="github">GitHub</option>
                <option value="bitbucket">Bitbucket</option>
                <option value="gitlab">GitLab</option>
                <option value="azure-devops">Azure DevOps</option>
                <option value="custom">Własne Git</option>
              </select>

              {formData.repository?.type && (
                <>
                  <input
                    id="repositoryUrl"
                    type="url"
                    title="URL repozytorium"
                    aria-label="URL repozytorium"
                    value={formData.repository?.url || ''}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        repository: {
                          ...prev.repository,
                          url: e.target.value,
                        },
                      }))
                    }
                    placeholder="https://github.com/username/repo.git"
                    className={styles.formInput}
                    disabled={isLoading}
                  />

                  <div className={styles.repositoryOptions}>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.repository?.isPrivate || false}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              repository: {
                                ...prev.repository,
                                isPrivate: e.target.checked,
                              },
                            }))
                          }
                          disabled={isLoading}
                        />
                        <span>Prywatne repozytorium</span>
                      </label>

                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.repository?.syncEnabled || false}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              repository: {
                                ...prev.repository,
                                syncEnabled: e.target.checked,
                              },
                            }))
                          }
                          disabled={isLoading}
                        />
                        <span>Automatyczna synchronizacja</span>
                      </label>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="projectTags" className={styles.formLabel}>
              Tagi
            </label>
            <div className={styles.tagInput}>
              <input
                id="projectTags"
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="Dodaj tag i naciśnij Enter"
                className={styles.formInput}
                disabled={isLoading}
              />
            </div>
            <div className={styles.tagList}>
              {formData.tags.map(tag => (
                <span key={tag} className={styles.tag}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className={styles.tagRemove}
                    disabled={isLoading}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className={styles.modalActions}>
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
              disabled={!formData.name.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <span className={styles.loadingSpinner}>⏳</span>
                  Tworzenie...
                </>
              ) : (
                <>
                  <span className={styles.buttonIcon}>✨</span>
                  Utwórz projekt
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
