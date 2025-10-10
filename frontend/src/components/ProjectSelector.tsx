import React, { useState } from 'react';
import { Project, CreateProjectForm } from '../types/project';
import { useProject } from '../contexts/ProjectContext';
import { NewProjectModal } from './modals/NewProjectModal';
import ProjectSettingsModal from './ProjectSettingsModal';
import { ProviderConfigManager } from './ProviderConfigManager';
import type { ProjectData } from '../types/dashboard.types';
import styles from '../styles/project-selector.module.css';

interface ProjectSelectorProps {
  onProjectSelected: (project: Project) => void;
}

export default function ProjectSelector({
  onProjectSelected,
}: ProjectSelectorProps) {
  const { projects, loading, error, createProject, updateProject } =
    useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [settingsProject, setSettingsProject] = useState<Project | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProviderConfig, setShowProviderConfig] = useState(false);

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

  const handleOpenSettings = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent project selection
    setSettingsProject(project);
    setShowSettingsModal(true);
  };

  const handleSaveSettings = async (updates: Partial<Project>) => {
    if (!settingsProject) return;

    try {
      await updateProject({
        id: settingsProject.id,
        ...updates,
      });
      setShowSettingsModal(false);
      setSettingsProject(null);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.loadingSpinner}>⏳</div>
        <p>Ładowanie projektów...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <div className={styles.errorIcon}>⚠️</div>
        <p>Wystąpił błąd: {error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon}>🚀</span>
              Wybierz Projekt
            </h1>
            <p className={styles.subtitle}>
              Wybierz istniejący projekt lub utwórz nowy
            </p>
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>📊</span>
              <div className={styles.statInfo}>
                <div className={styles.statNumber}>{projects.length}</div>
                <div className={styles.statLabel}>Projektów</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statIcon}>⚡</span>
              <div className={styles.statInfo}>
                <div className={styles.statNumber}>
                  {projects.filter(p => p.status === 'active').length}
                </div>
                <div className={styles.statLabel}>Aktywnych</div>
              </div>
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

      <div className={styles.content}>
        {filteredProjects.length === 0 && searchQuery === '' ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📂</div>
            <h3>Brak projektów</h3>
            <p>Zacznij swoją przygodę z AI - utwórz pierwszy projekt!</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className={styles.emptyStateButton}
            >
              <span className={styles.buttonIcon}>✨</span>
              Utwórz pierwszy projekt
            </button>
          </div>
        ) : (
          <div className={styles.projectGrid}>
            <div
              className={styles.createCard}
              onClick={() => setShowCreateForm(true)}
            >
              <div className={styles.createIcon}>✨</div>
              <h3 className={styles.createTitle}>Nowy Projekt</h3>
              <p className={styles.createDescription}>
                Utwórz nowy projekt AI z pięknym wizardem
              </p>
            </div>

            <div
              className={styles.createCard}
              onClick={() => setShowProviderConfig(true)}
            >
              <div className={styles.createIcon}>🤖</div>
              <h3 className={styles.createTitle}>AI Providerzy</h3>
              <p className={styles.createDescription}>
                Konfiguruj tokeny i ustawienia AI
              </p>
            </div>
            {filteredProjects.map(project => (
              <div
                key={project.id}
                className={styles.projectCard}
                onClick={() => onProjectSelected(project)}
                data-project-color={project.color}
              >
                <div className={styles.cardHeader}>
                  <div
                    className={styles.cardIcon}
                    data-project-color={project.color}
                  >
                    {project.icon || '🚀'}
                  </div>
                  <div
                    className={`${styles.cardStatus} ${
                      styles[`status-${project.status}`]
                    }`}
                  >
                    {project.status === 'active'
                      ? '🟢 Aktywny'
                      : project.status === 'in-progress'
                      ? '🔄 W trakcie'
                      : project.status === 'pending'
                      ? '⏳ Oczekuje'
                      : project.status === 'draft'
                      ? '📝 Szkic'
                      : project.status === 'paused'
                      ? '🟡 Wstrzymany'
                      : project.status === 'completed'
                      ? '✅ Ukończony'
                      : project.status === 'archived'
                      ? '📦 Archiwum'
                      : `❓ Nieznany (${project.status || 'undefined'})`}
                  </div>
                  <button
                    className={styles.settingsButton}
                    onClick={e => handleOpenSettings(project, e)}
                    title="Ustawienia projektu"
                    aria-label="Ustawienia projektu"
                  >
                    <i className="fas fa-cog" />
                  </button>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.cardTitle}>{project.name}</h3>
                  {project.description && (
                    <p className={styles.cardDescription}>
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                <div className={styles.cardProgress}>
                  <div className={styles.progressBar}>
                    <div
                      className={`${styles.progressFill} ${
                        styles[
                          `progress${
                            Math.round((project.progress || 0) / 5) * 5
                          }`
                        ] || styles.progress0
                      }`}
                    ></div>
                  </div>
                  <span className={styles.progressText}>
                    {project.progress || 0}% ukończone
                  </span>
                </div>

                <div className={styles.cardStats}>
                  <div className={styles.cardStat}>
                    <span className={styles.cardStatIcon}>✅</span>
                    <span className={styles.cardStatValue}>
                      {project.tasks?.filter(t => t.status === 'completed')
                        .length || 0}
                    </span>
                    <span className={styles.cardStatLabel}>Ukończone</span>
                  </div>

                  <div className={styles.cardStat}>
                    <span className={styles.cardStatIcon}>📋</span>
                    <span className={styles.cardStatValue}>
                      {project.tasks?.length || 0}
                    </span>
                    <span className={styles.cardStatLabel}>Zadania</span>
                  </div>

                  <div className={styles.cardStat}>
                    <span className={styles.cardStatIcon}>📅</span>
                    <span className={styles.cardStatValue}>
                      {new Date(project.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                    <span className={styles.cardStatLabel}>Utworzony</span>
                  </div>

                  {project.hasFiles && (
                    <div className={styles.cardStat}>
                      <span className={styles.cardStatIcon}>📁</span>
                      <span className={styles.cardStatValue}>Tak</span>
                      <span className={styles.cardStatLabel}>Pliki</span>
                    </div>
                  )}
                </div>

                {project.tags.length > 0 && (
                  <div className={styles.cardTags}>
                    {project.tags.slice(0, 3).map(tag => (
                      <span key={tag} className={styles.cardTag}>
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 3 && (
                      <span className={styles.cardTag}>
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredProjects.length === 0 && projects.length > 0 && (
          <div className={styles.noResultsState}>
            <div className={styles.noResultsIcon}>🔍</div>
            <h3>Brak wyników</h3>
            <p>
              Nie znaleziono projektów dla:{' '}
              <strong>&quot;{searchQuery}&quot;</strong>
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className={styles.clearSearchButton}
            >
              Wyczyść wyszukiwanie
            </button>
          </div>
        )}
      </div>

      {showCreateForm && (
        <NewProjectModal
          isOpen={showCreateForm}
          onSubmit={async (projectData: Omit<ProjectData, 'id'>) => {
            try {
              // Convert ProjectData to CreateProjectForm format
              const projectForm: CreateProjectForm = {
                name: projectData.name,
                description: projectData.description,
                tags: projectData.technologies || [],
                settings: {
                  aiModel: 'gpt-4',
                  maxTokens: 4000,
                  temperature: 0.7,
                  enabledFeatures: ['workflow', 'agents'],
                  defaultAgentType: 'task-automation',
                  workflowTimeout: 30000,
                  notifications: {
                    email: true,
                    taskCompletion: true,
                    workflowErrors: true,
                    agentUpdates: false,
                  },
                },
              };

              await handleCreateProject(projectForm);
              return { success: true };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Błąd podczas tworzenia projektu',
              };
            }
          }}
          onClose={() => setShowCreateForm(false)}
          isLoading={isCreating}
        />
      )}

      {showSettingsModal && settingsProject && (
        <ProjectSettingsModal
          isOpen={showSettingsModal}
          project={settingsProject}
          onSave={handleSaveSettings}
          onClose={() => {
            setShowSettingsModal(false);
            setSettingsProject(null);
          }}
        />
      )}

      {showProviderConfig && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.8)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 1001,
            }}
          >
            <button
              onClick={() => setShowProviderConfig(false)}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                fontSize: '24px',
                cursor: 'pointer',
              }}
            >
              ❌
            </button>
          </div>
          <ProviderConfigManager />
        </div>
      )}
    </div>
  );
}
