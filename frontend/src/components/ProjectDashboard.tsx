/**
 * Project Dashboard Component
 * ThinkCode AI Platform - Main Project Interface
 */

import React, { useState } from 'react';
import { Project } from '../types/project';
import { useProject } from '../contexts/ProjectContext';
import AgentManagement from './AgentManagement';
import TaskManagement from './TaskManagement';
import WorkflowManagement from './WorkflowManagement';
import MockupManagement from './MockupManagement';
import Configuration from './Configuration';
import ProjectProgress from './ProjectProgress';
import styles from '../styles/project-dashboard.module.css';

interface ProjectDashboardProps {
  project: Project;
  onBackToProjects: () => void;
}

export default function ProjectDashboard({
  project,
  onBackToProjects,
}: ProjectDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'agents' | 'tasks' | 'workflows' | 'mockups' | 'config'
  >('overview');
  const { setCurrentProject } = useProject();

  const handleSwitchProject = () => {
    setCurrentProject(null);
    onBackToProjects();
  };

  return (
    <div className={styles.container}>
      <ProjectHeader project={project} onSwitchProject={handleSwitchProject} />

      <div className={styles.content}>
        {/* Lewa strona - główna zawartość z zakładkami */}
        <div className={styles.mainContent}>
          <ProjectNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <div className={styles.tabContent}>
            {activeTab === 'overview' && <ProjectOverview project={project} />}
            {activeTab === 'agents' && (
              <AgentManagement projectId={project.id} />
            )}
            {activeTab === 'tasks' && <TaskManagement projectId={project.id} />}
            {activeTab === 'workflows' && (
              <WorkflowManagement projectId={project.id} />
            )}
            {activeTab === 'mockups' && (
              <MockupManagement projectId={project.id} />
            )}
            {activeTab === 'config' && <Configuration projectId={project.id} />}
          </div>
        </div>

        {/* Sidebar z Progress i Chat - zawsze widoczny */}
        <div className={styles.sidebar}>
          <ProjectProgress projectId={project.id} />
        </div>
      </div>
    </div>
  );
}

function ProjectHeader({
  project,
  onSwitchProject,
}: {
  project: Project;
  onSwitchProject: () => void;
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.backButton}
          onClick={onSwitchProject}
          aria-label="Wróć do listy projektów"
        >
          ← Projekty
        </button>

        <div className={styles.projectInfo}>
          <div
            className={styles.projectIcon}
            data-project-color={project.color}
          >
            📂
          </div>

          <div className={styles.projectDetails}>
            <h1 className={styles.projectTitle}>{project.name}</h1>
            <p className={styles.projectDescription}>
              {project.description || 'Brak opisu projektu'}
            </p>
          </div>
        </div>
      </div>

      <div className={styles.headerRight}>
        <div className={styles.projectStats}>
          <div className={styles.statItem}>
            <span className={styles.statIcon}>🤖</span>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>
                {project.stats.totalAgents}
              </div>
              <div className={styles.statLabel}>Agentów</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statIcon}>📋</span>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>
                {project.stats.totalTasks}
              </div>
              <div className={styles.statLabel}>Zadań</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statIcon}>⚡</span>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>
                {project.stats.activeWorkflows}
              </div>
              <div className={styles.statLabel}>Workflow</div>
            </div>
          </div>

          <div className={styles.statItem}>
            <span className={styles.statIcon}>📊</span>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>
                {Math.round(project.stats.successRate)}%
              </div>
              <div className={styles.statLabel}>Sukces</div>
            </div>
          </div>
        </div>

        <button className={styles.settingsButton}>⚙️ Ustawienia</button>
      </div>
    </div>
  );
}

function ProjectNavigation({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (
    tab: 'overview' | 'agents' | 'tasks' | 'workflows' | 'mockups' | 'config'
  ) => void;
}) {
  const tabs = [
    { id: 'overview' as const, label: 'Przegląd', icon: '📊' },
    { id: 'agents' as const, label: 'Agenci AI', icon: '🤖' },
    { id: 'tasks' as const, label: 'Zadania', icon: '📋' },
    { id: 'workflows' as const, label: 'Workflow', icon: '⚡' },
    { id: 'mockups' as const, label: 'Mockupy', icon: '🎨' },
    { id: 'config' as const, label: 'Konfiguracja', icon: '⚙️' },
  ];

  return (
    <div className={styles.navigation}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`${styles.navTab} ${
            activeTab === tab.id ? styles.active : ''
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProjectOverview({ project }: { project: Project }) {
  return (
    <div className={styles.overview}>
      <div className={styles.overviewGrid}>
        <div className={styles.overviewCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📈</span>
              Aktywność Projektu
            </h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.activityStats}>
              <div className={styles.activityStat}>
                <div className={styles.activityNumber}>
                  {project.stats.completedTasks}
                </div>
                <div className={styles.activityLabel}>Ukończone zadania</div>
              </div>
              <div className={styles.activityStat}>
                <div className={styles.activityNumber}>
                  {project.stats.totalTasks - project.stats.completedTasks}
                </div>
                <div className={styles.activityLabel}>Zadania w toku</div>
              </div>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                data-progress={
                  project.stats.totalTasks > 0
                    ? (project.stats.completedTasks /
                        project.stats.totalTasks) *
                      100
                    : 0
                }
              />
            </div>
            <div className={styles.progressLabel}>
              Postęp:{' '}
              {project.stats.totalTasks > 0
                ? Math.round(
                    (project.stats.completedTasks / project.stats.totalTasks) *
                      100
                  )
                : 0}
              %
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🚀</span>
              Ostatnia Aktywność
            </h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.lastActivity}>
              <div className={styles.activityDate}>
                {project.stats.lastActivity.toLocaleDateString('pl-PL', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className={styles.activityDescription}>
                Ostatnia aktywność w projekcie
              </div>
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>⚙️</span>
              Konfiguracja
            </h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.configItems}>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Model AI:</span>
                <span className={styles.configValue}>
                  {project.settings.aiModel}
                </span>
              </div>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Max tokeny:</span>
                <span className={styles.configValue}>
                  {project.settings.maxTokens}
                </span>
              </div>
              <div className={styles.configItem}>
                <span className={styles.configLabel}>Temperatura:</span>
                <span className={styles.configValue}>
                  {project.settings.temperature}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.overviewCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>🏷️</span>
              Tagi Projektu
            </h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.tagList}>
              {project.tags.length > 0 ? (
                project.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))
              ) : (
                <span className={styles.noTags}>Brak tagów</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
