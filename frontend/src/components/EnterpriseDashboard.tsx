/**
 * Enterprise Dashboard - Główny interfejs zarządzania projektami
 * @description Kompletny dashboard do zarządzania projektami, agentami i workflow
 */

import React, { memo } from 'react';
import {
  FolderOpen,
  Activity,
  Plus,
  Search,
  Bell,
  Settings,
  Home,
  MessageSquare,
  FileImage,
  Workflow,
  Bot,
  CheckSquare,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import type { ProjectData } from '../types/dashboard.types';
import { OverviewDashboard } from './dashboard/OverviewDashboard';
import { ProjectsDashboard } from './dashboard/ProjectsDashboard';
import { AgentsDashboard } from './dashboard/AgentsDashboard';
import { ChatDashboard } from './dashboard/ChatDashboard';
import { MockupsDashboard } from './dashboard/MockupsDashboard';
import { WorkflowsDashboard } from './dashboard/WorkflowsDashboard';
import TaskManagementPanel from './TaskManagementPanel/TaskManagementPanel';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ErrorMessage } from './ui/ErrorMessage';
import { NewProjectModal } from './modals/NewProjectModal';
import { ProjectDetailsDashboard } from './dashboard/ProjectDetailsDashboard';
import styles from '../styles/enterprise-dashboard.module.css';

/**
 * Główny komponent Enterprise Dashboard
 */
export const EnterpriseDashboard = memo(() => {
  const {
    state,
    projects,
    agents,
    conversations,
    metrics,
    isConnected,
    setActiveView,
    selectProject,
    createProject,
    updateState,
    refreshData,
  } = useDashboard();

  const menuItems = [
    { id: 'overview', icon: Home, label: 'Przegląd', count: null },
    {
      id: 'projects',
      icon: FolderOpen,
      label: 'Projekty',
      count: projects.length,
    },
    {
      id: 'agents',
      icon: Bot,
      label: 'Zespół Agentów',
      count: agents.filter(a => a.status === 'online').length,
    },
    {
      id: 'chat',
      icon: MessageSquare,
      label: 'Komunikacja',
      count: conversations.filter(c => c.unreadCount > 0).length,
    },
    { id: 'tasks', icon: CheckSquare, label: 'Zadania', count: null },
    { id: 'workflows', icon: Workflow, label: 'Workflow', count: null },
    { id: 'mockups', icon: FileImage, label: 'Mockupy', count: null },
  ];

  const renderContent = () => {
    if (state.loading) {
      return <LoadingSpinner message="Ładowanie dashboard..." />;
    }

    if (state.error) {
      return (
        <ErrorMessage
          message={state.error}
          onRetry={refreshData}
          actionLabel="Odśwież dane"
        />
      );
    }

    // Jeśli wybrany projekt, pokaż szczegóły projektu
    if (state.selectedProject) {
      return (
        <ProjectDetailsDashboard
          project={state.selectedProject}
          onBack={() => selectProject(null)}
          onProjectUpdate={async updatedProject => {
            // Handle project update with API call and state management
            try {
              console.log('Updating project:', updatedProject.id);

              // Attempt to update project via API
              const response = await fetch(
                `/api/projects/${updatedProject.id}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(updatedProject),
                }
              );

              if (response.ok) {
                const updated = await response.json();
                selectProject(updated);
                console.log('Project updated successfully');
              } else {
                // Fallback - update local state only
                console.warn('API update failed, updating local state only');
                selectProject(updatedProject);
              }
            } catch (error) {
              console.error('Error updating project:', error);
              // Fallback - still update local state
              selectProject(updatedProject);
            }
          }}
        />
      );
    }

    switch (state.activeView) {
      case 'overview':
        return (
          <OverviewDashboard
            metrics={metrics}
            projects={projects}
            agents={agents}
          />
        );
      case 'projects':
        return (
          <ProjectsDashboard
            projects={projects}
            onSelectProject={selectProject}
            onUpdateProject={updateState}
            searchTerm={state.searchTerm}
          />
        );
      case 'agents':
        return (
          <AgentsDashboard
            agents={agents}
            onSelectAgent={agent => updateState({ selectedAgent: agent })}
            searchTerm={state.searchTerm}
          />
        );
      case 'chat':
        return (
          <ChatDashboard
            conversations={conversations}
            selectedProject={state.selectedProject}
            onSelectConversation={() => updateState({ selectedAgent: null })}
          />
        );
      case 'tasks':
        return state.selectedProject ? (
          <TaskManagementPanel
            projectId={(state.selectedProject as ProjectData).id}
          />
        ) : (
          <div>Please select a project to manage tasks.</div>
        );
      case 'workflows':
        return <WorkflowsDashboard projects={projects} />;
      case 'mockups':
        return <MockupsDashboard projects={projects} />;
      default:
        return (
          <OverviewDashboard
            metrics={metrics}
            projects={projects}
            agents={agents}
          />
        );
    }
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Activity className={styles.logoIcon} />
            <h1>ThinkCode AI Platform</h1>
            <span
              className={styles.connectionStatus}
              data-connected={isConnected}
            >
              {isConnected ? 'Połączono' : 'Rozłączono'}
            </span>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Szukaj projektów, agentów, zadań..."
                value={state.searchTerm}
                onChange={e => updateState({ searchTerm: e.target.value })}
                className={styles.searchInput}
              />
            </div>

            <button
              className={styles.actionButton}
              onClick={() => updateState({ showNewProjectModal: true })}
              title="Nowy projekt"
            >
              <Plus size={20} />
              <span>Nowy projekt</span>
            </button>

            <button className={styles.iconButton} title="Powiadomienia">
              <Bell size={20} />
            </button>

            <button className={styles.iconButton} title="Ustawienia">
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <nav className={styles.navigation}>
            {menuItems.map(item => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  className={`${styles.navItem} ${
                    state.activeView === item.id ? styles.active : ''
                  }`}
                  onClick={() => setActiveView(item.id as any)}
                >
                  <IconComponent size={20} />
                  <span>{item.label}</span>
                  {item.count !== null && (
                    <span className={styles.badge}>{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className={styles.content}>{renderContent()}</main>
      </div>

      {/* Modals */}
      {state.showNewProjectModal && (
        <NewProjectModal
          isOpen={state.showNewProjectModal}
          onClose={() => updateState({ showNewProjectModal: false })}
          onSubmit={createProject}
          isLoading={state.loading}
        />
      )}
    </div>
  );
});

EnterpriseDashboard.displayName = 'EnterpriseDashboard';

export default EnterpriseDashboard;
