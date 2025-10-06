/**
 * Projects Dashboard - Zarządzanie projektami
 * @description Wyświetla listę projektów z możliwością tworzenia, edycji i zarządzania
 */

import React, { memo, useState, useMemo } from 'react';
import {
  Plus,
  Calendar,
  Users,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  Play,
  MoreVertical,
} from 'lucide-react';
import type { ProjectData } from '../../types/dashboard.types';
import styles from '../../styles/dashboard-projects.module.css';

interface ProjectsDashboardProps {
  projects: ProjectData[];
  onSelectProject: (project: ProjectData) => void;
  onUpdateProject: (updates: any) => void;
  searchTerm: string;
}

export const ProjectsDashboard = memo<ProjectsDashboardProps>(
  ({ projects, onSelectProject, onUpdateProject, searchTerm }) => {
    const [selectedFilter, setSelectedFilter] = useState<
      'all' | 'active' | 'completed' | 'pending'
    >('all');
    const [selectedPriority, setSelectedPriority] = useState<
      'all' | 'urgent' | 'high' | 'medium' | 'low'
    >('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Filtrowanie projektów
    const filteredProjects = useMemo(() => {
      return projects.filter(project => {
        const matchesSearch =
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter =
          selectedFilter === 'all' || project.status === selectedFilter;
        const matchesPriority =
          selectedPriority === 'all' || project.priority === selectedPriority;

        return matchesSearch && matchesFilter && matchesPriority;
      });
    }, [projects, searchTerm, selectedFilter, selectedPriority]);

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'active':
          return React.createElement(Play, { size: 16 });
        case 'completed':
          return React.createElement(CheckCircle, { size: 16 });
        case 'pending':
          return React.createElement(Clock, { size: 16 });
        case 'cancelled':
          return React.createElement(AlertCircle, { size: 16 });
        default:
          return React.createElement(Clock, { size: 16 });
      }
    };

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'urgent':
          return 'red';
        case 'high':
          return 'orange';
        case 'medium':
          return 'yellow';
        case 'low':
          return 'green';
        default:
          return 'gray';
      }
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('pl-PL');
    };

    const calculateDaysRemaining = (endDate?: string) => {
      if (!endDate) return null;
      const today = new Date();
      const end = new Date(endDate);
      const diffTime = end.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    };

    return (
      <div className={styles.projectsDashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2>Zarządzanie Projektami</h2>
            <div className={styles.stats}>
              <span>{projects.length} projektów</span>
              <span>•</span>
              <span>
                {projects.filter(p => p.status === 'active').length} aktywnych
              </span>
              <span>•</span>
              <span>
                {projects.filter(p => p.status === 'completed').length}{' '}
                ukończonych
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.newProjectBtn}
              onClick={() => onUpdateProject({ showNewProjectModal: true })}
            >
              <Plus size={20} />
              Nowy Projekt
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              value={selectedFilter}
              onChange={e => setSelectedFilter(e.target.value as any)}
              className={styles.filterSelect}
              aria-label="Filtr statusu projektu"
              title="Wybierz status do filtrowania projektów"
            >
              <option value="all">Wszystkie</option>
              <option value="active">Aktywne</option>
              <option value="pending">Oczekujące</option>
              <option value="completed">Ukończone</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Priorytet:</label>
            <select
              value={selectedPriority}
              onChange={e => setSelectedPriority(e.target.value as any)}
              className={styles.filterSelect}
              aria-label="Filtr priorytetu projektu"
              title="Wybierz priorytet do filtrowania projektów"
            >
              <option value="all">Wszystkie</option>
              <option value="urgent">Pilny</option>
              <option value="high">Wysoki</option>
              <option value="medium">Średni</option>
              <option value="low">Niski</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Widok:</label>
            <div className={styles.viewToggle}>
              <button
                className={viewMode === 'grid' ? styles.active : ''}
                onClick={() => setViewMode('grid')}
              >
                Kafelki
              </button>
              <button
                className={viewMode === 'list' ? styles.active : ''}
                onClick={() => setViewMode('list')}
              >
                Lista
              </button>
            </div>
          </div>
        </div>

        {/* Projects Content */}
        {filteredProjects.length === 0 ? (
          <div className={styles.emptyState}>
            <Target size={64} />
            <h3>Brak projektów</h3>
            <p>
              {searchTerm ||
              selectedFilter !== 'all' ||
              selectedPriority !== 'all'
                ? 'Brak projektów spełniających kryteria wyszukiwania'
                : 'Rozpocznij od utworzenia pierwszego projektu'}
            </p>
            {!searchTerm &&
              selectedFilter === 'all' &&
              selectedPriority === 'all' && (
                <button
                  className={styles.createFirstProject}
                  onClick={() => onUpdateProject({ showNewProjectModal: true })}
                >
                  <Plus size={20} />
                  Utwórz pierwszy projekt
                </button>
              )}
          </div>
        ) : (
          <div className={`${styles.projectsContainer} ${styles[viewMode]}`}>
            {filteredProjects.map(project => {
              const daysRemaining = calculateDaysRemaining(project.endDate);

              return (
                <div
                  key={project.id}
                  className={styles.projectCard}
                  onClick={() => onSelectProject(project)}
                >
                  {/* Project Header */}
                  <div className={styles.projectHeader}>
                    <div className={styles.projectTitle}>
                      <h3>{project.name}</h3>
                      <button
                        className={styles.menuButton}
                        title="Menu opcji projektu"
                        aria-label={`Menu opcji dla projektu ${project.name}`}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>

                    <div className={styles.projectMeta}>
                      <span
                        className={`${styles.status} ${styles[project.status]}`}
                      >
                        {getStatusIcon(project.status)}
                        {project.status}
                      </span>
                      <span
                        className={`${styles.priority} ${
                          styles[getPriorityColor(project.priority)]
                        }`}
                      >
                        {project.priority}
                      </span>
                    </div>
                  </div>

                  {/* Project Content */}
                  <div className={styles.projectContent}>
                    <p className={styles.description}>{project.description}</p>

                    {/* Progress */}
                    <div className={styles.progressSection}>
                      <div className={styles.progressHeader}>
                        <span>Postęp</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={`${styles.progressFill} ${
                            styles[`progressFill${project.progress}`] ||
                            styles.progressFill0
                          }`}
                        />
                      </div>
                    </div>

                    {/* Project Info */}
                    <div className={styles.projectInfo}>
                      <div className={styles.infoItem}>
                        <Calendar size={16} />
                        <span>Start: {formatDate(project.startDate)}</span>
                      </div>

                      {project.endDate && (
                        <div className={styles.infoItem}>
                          <Clock size={16} />
                          <span>
                            {daysRemaining !== null && daysRemaining > 0
                              ? `${daysRemaining} dni pozostało`
                              : daysRemaining === 0
                              ? 'Ostatni dzień'
                              : 'Przekroczony termin'}
                          </span>
                        </div>
                      )}

                      <div className={styles.infoItem}>
                        <Users size={16} />
                        <span>{project.team.length} członków zespołu</span>
                      </div>

                      {project.client && (
                        <div className={styles.infoItem}>
                          <Target size={16} />
                          <span>{project.client}</span>
                        </div>
                      )}
                    </div>

                    {/* Technologies */}
                    {project.technologies &&
                      project.technologies.length > 0 && (
                        <div className={styles.technologies}>
                          {project.technologies.slice(0, 3).map(tech => (
                            <span key={tech} className={styles.techBadge}>
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 3 && (
                            <span className={styles.moreTech}>
                              +{project.technologies.length - 3} więcej
                            </span>
                          )}
                        </div>
                      )}

                    {/* Budget */}
                    {project.budget && (
                      <div className={styles.budget}>
                        Budżet: {project.budget.toLocaleString('pl-PL')} PLN
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

ProjectsDashboard.displayName = 'ProjectsDashboard';
