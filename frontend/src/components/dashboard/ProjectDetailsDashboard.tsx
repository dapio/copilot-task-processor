/**
 * Project Details Dashboard - Szczegółowy widok projektu (SERCE PLATFORMY)
 * @description Kompletny dashboard do zarządzania wszystkimi aspektami projektu
 */

import React, { memo, useState, useEffect, useCallback } from 'react';
import { ProjectOverviewSection } from './ProjectOverviewSection';
import { ProjectTasksSection } from './ProjectTasksSection';
import { ProjectAgentsSection } from './ProjectAgentsSection';
import { ProjectChatSection } from './ProjectChatSection';
import { ProjectWorkflowSection } from './ProjectWorkflowSection';
import { ProjectMockupsSection } from './ProjectMockupsSection';
import { ProjectHistorySection } from './ProjectHistorySection';
import {
  ArrowLeft,
  MessageSquare,
  Workflow,
  FileImage,
  History,
  Play,
  CheckCircle,
  AlertCircle,
  Clock,
  GitBranch,
  Bot,
  Home,
} from 'lucide-react';
import type {
  ProjectData,
  TaskData,
  Agent,
  WorkflowData,
} from '../../types/dashboard.types';
import { useBackendApi } from '../../hooks/useBackendApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorMessage } from '../ui/ErrorMessage';
import styles from '../../styles/project-details-dashboard.module.css';

interface ProjectDetailsDashboardProps {
  project: ProjectData;
  onBack: () => void;
  onProjectUpdate?: (updatedProject: ProjectData) => void;
}

type ProjectSection =
  | 'overview'
  | 'tasks'
  | 'workflow'
  | 'agents'
  | 'chat'
  | 'mockups'
  | 'iterations'
  | 'history';

export const ProjectDetailsDashboard = memo<ProjectDetailsDashboardProps>(
  ({ project, onBack }) => {
    const [activeSection, setActiveSection] =
      useState<ProjectSection>('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dane szczegółowe projektu
    const [projectTasks, setProjectTasks] = useState<TaskData[]>([]);
    // const [projectWorkflow, setProjectWorkflow] = useState<WorkflowData | null>(null);
    const [projectAgents, setProjectAgents] = useState<Agent[]>([]);
    const [projectChatMessages, setProjectChatMessages] = useState<any[]>([]);
    const [projectMockups, setProjectMockups] = useState<any[]>([]);
    const [projectHistory, setProjectHistory] = useState<any[]>([]);

    const { executeWithRetry } = useBackendApi();

    // Ładowanie szczegółowych danych projektu
    useEffect(() => {
      loadProjectDetails();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.id]);

    const loadProjectDetails = useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        // Równoległe ładowanie wszystkich danych projektu
        const [
          tasksResult,
          ,
          agentsResult,
          chatResult,
          mockupsResult,
          historyResult,
        ] = await Promise.allSettled([
          loadProjectTasks(),
          loadProjectWorkflow(),
          loadProjectAgents(),
          loadProjectChat(),
          loadProjectMockups(),
          loadProjectHistory(),
        ]);

        // Przetwarzanie wyników
        if (tasksResult.status === 'fulfilled') {
          setProjectTasks(tasksResult.value);
        }
        // if (workflowResult.status === 'fulfilled') {
        //   setProjectWorkflow(workflowResult.value);
        // }
        if (agentsResult.status === 'fulfilled') {
          setProjectAgents(agentsResult.value);
        }
        if (chatResult.status === 'fulfilled') {
          setProjectChatMessages(chatResult.value);
        }
        if (mockupsResult.status === 'fulfilled') {
          setProjectMockups(mockupsResult.value);
        }
        if (historyResult.status === 'fulfilled') {
          setProjectHistory(historyResult.value);
        }
      } catch (err) {
        setError(
          `Błąd ładowania szczegółów projektu: ${
            err instanceof Error ? err.message : 'Nieznany błąd'
          }`
        );
      } finally {
        setLoading(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [project.id, executeWithRetry]);

    // Ładowanie zadań projektu
    const loadProjectTasks = useCallback(async (): Promise<TaskData[]> => {
      const result = await executeWithRetry(
        () => fetch(`/api/projects/${project.id}/tasks`),
        3
      );

      if (result.success && result.data) {
        const response = result.data as Response;
        if (response.ok) {
          return await response.json();
        }
      }

      // TODO: Implementacja obsługi błędów API
      return [];
    }, [project.id, executeWithRetry]);

    // Ładowanie workflow projektu
    const loadProjectWorkflow =
      useCallback(async (): Promise<WorkflowData | null> => {
        const result = await executeWithRetry(
          () => fetch(`/api/projects/${project.id}/workflow`),
          3
        );

        if (result.success && result.data) {
          const response = result.data as Response;
          if (response.ok) {
            return await response.json();
          }
        }

        // TODO: Implementacja obsługi błędów API
        return null;
      }, [project.id, executeWithRetry]);

    // Ładowanie agentów projektu
    const loadProjectAgents = useCallback(async (): Promise<Agent[]> => {
      const result = await executeWithRetry(
        () => fetch(`/api/projects/${project.id}/agents`),
        3
      );

      if (result.success && result.data) {
        const response = result.data as Response;
        if (response.ok) {
          return await response.json();
        }
      }

      // TODO: Implementacja obsługi błędów API
      return [];
    }, [project.id, executeWithRetry]);

    // Ładowanie czatu projektu
    const loadProjectChat = useCallback(async (): Promise<any[]> => {
      const result = await executeWithRetry(
        () => fetch(`/api/chat/conversations/project/${project.id}/messages`),
        3
      );

      if (result.success && result.data) {
        const response = result.data as Response;
        if (response.ok) {
          return await response.json();
        }
      }

      return [];
    }, [project.id, executeWithRetry]);

    // Ładowanie mockupów projektu
    const loadProjectMockups = useCallback(async (): Promise<any[]> => {
      const result = await executeWithRetry(
        () => fetch(`/api/projects/${project.id}/mockups`),
        3
      );

      if (result.success && result.data) {
        const response = result.data as Response;
        if (response.ok) {
          return await response.json();
        }
      }

      return [];
    }, [project.id, executeWithRetry]);

    // Ładowanie historii projektu
    const loadProjectHistory = useCallback(async (): Promise<any[]> => {
      const result = await executeWithRetry(
        () => fetch(`/api/projects/${project.id}/history`),
        3
      );

      if (result.success && result.data) {
        const response = result.data as Response;
        if (response.ok) {
          return await response.json();
        }
      }

      return [];
    }, [project.id, executeWithRetry]);

    // Menu nawigacyjne sekcji
    const sectionMenuItems = [
      { id: 'overview', icon: Home, label: 'Przegląd', count: null },
      {
        id: 'tasks',
        icon: CheckCircle,
        label: 'Zadania',
        count: projectTasks.length,
      },
      { id: 'workflow', icon: Workflow, label: 'Workflow', count: null },
      { id: 'agents', icon: Bot, label: 'Zespół', count: projectAgents.length },
      {
        id: 'chat',
        icon: MessageSquare,
        label: 'Chat',
        count: projectChatMessages.filter(m => !m.read).length,
      },
      {
        id: 'mockups',
        icon: FileImage,
        label: 'Mockupy',
        count: projectMockups.length,
      },
      { id: 'iterations', icon: GitBranch, label: 'Iteracje', count: null },
      {
        id: 'history',
        icon: History,
        label: 'Historia',
        count: projectHistory.length,
      },
    ];

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'active':
          return React.createElement(Play, {
            size: 16,
            className: styles.statusActive,
          });
        case 'completed':
          return React.createElement(CheckCircle, {
            size: 16,
            className: styles.statusCompleted,
          });
        case 'pending':
          return React.createElement(Clock, {
            size: 16,
            className: styles.statusPending,
          });
        case 'cancelled':
          return React.createElement(AlertCircle, {
            size: 16,
            className: styles.statusCancelled,
          });
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

    // Renderowanie zawartości sekcji
    const renderSectionContent = () => {
      if (loading) {
        return <LoadingSpinner message="Ładowanie szczegółów projektu..." />;
      }

      if (error) {
        return (
          <ErrorMessage
            message={error}
            onRetry={loadProjectDetails}
            actionLabel="Spróbuj ponownie"
          />
        );
      }

      switch (activeSection) {
        case 'overview':
          return renderOverviewSection();
        case 'tasks':
          return renderTasksSection();
        case 'workflow':
          return renderWorkflowSection();
        case 'agents':
          return renderAgentsSection();
        case 'chat':
          return renderChatSection();
        case 'mockups':
          return renderMockupsSection();
        case 'iterations':
          return renderIterationsSection();
        case 'history':
          return renderHistorySection();
        default:
          return renderOverviewSection();
      }
    };

    // Sekcja przeglądu projektu
    const renderOverviewSection = () => (
      <ProjectOverviewSection
        project={project}
        projectTasks={projectTasks}
        projectAgents={projectAgents}
        projectHistory={projectHistory}
        formatDate={formatDate}
        getStatusIcon={getStatusIcon}
        getPriorityColor={getPriorityColor}
      />
    );

    // TODO: Implementacja pozostałych sekcji
    const renderTasksSection = () => (
      <ProjectTasksSection
        projectTasks={projectTasks}
        onTaskSelect={taskId => {
          // TODO: Implementacja szczegółów zadania
          console.log('Selected task:', taskId);
        }}
        onTaskStatusChange={(taskId, newStatus) => {
          // TODO: Implementacja zmiany statusu zadania
          console.log('Change task status:', taskId, newStatus);
        }}
      />
    );

    const renderWorkflowSection = () => (
      <ProjectWorkflowSection
        projectWorkflow={null}
        onWorkflowAction={action => {
          // TODO: Implementacja akcji workflow
          console.log('Workflow action:', action);
        }}
        onStepAction={(stepId, action) => {
          // TODO: Implementacja akcji kroku
          console.log('Step action:', stepId, action);
        }}
      />
    );

    const renderAgentsSection = () => (
      <ProjectAgentsSection
        projectAgents={projectAgents}
        onAgentSelect={agentId => {
          // TODO: Implementacja szczegółów agenta
          console.log('Selected agent:', agentId);
        }}
        onAgentAssign={(agentId, taskId) => {
          // TODO: Implementacja przypisania zadania
          console.log('Assign task to agent:', agentId, taskId);
        }}
      />
    );

    const renderChatSection = () => (
      <ProjectChatSection
        projectChatMessages={projectChatMessages}
        onSendMessage={(content, attachments) => {
          // TODO: Implementacja wysyłania wiadomości
          console.log('Send message:', content, attachments);
        }}
        onMarkAsRead={messageId => {
          // TODO: Implementacja oznaczania jako przeczytane
          console.log('Mark as read:', messageId);
        }}
      />
    );

    const renderMockupsSection = () => (
      <ProjectMockupsSection
        projectMockups={projectMockups}
        onUploadMockup={files => {
          // TODO: Implementacja uploadu mockupów
          console.log('Upload mockups:', files);
        }}
        onMockupAction={(mockupId, action) => {
          // TODO: Implementacja akcji mockupów
          console.log('Mockup action:', mockupId, action);
        }}
        onMockupSelect={mockupId => {
          // TODO: Implementacja szczegółów mockupu
          console.log('Selected mockup:', mockupId);
        }}
      />
    );

    const renderIterationsSection = () => (
      <div className={styles.iterationsSection}>
        <h2>Iteracje i feedback - W IMPLEMENTACJI</h2>
        <p>Zarządzanie iteracjami, feedback loop, wersjonowanie...</p>
      </div>
    );

    const renderHistorySection = () => (
      <ProjectHistorySection
        projectHistory={projectHistory}
        onEventSelect={eventId => {
          // TODO: Implementacja szczegółów wydarzenia
          console.log('Selected event:', eventId);
        }}
        onFilterChange={filters => {
          // TODO: Implementacja filtrowania historii
          console.log('History filters:', filters);
        }}
      />
    );

    return (
      <div className={styles.projectDetailsDashboard}>
        {/* Top Navigation */}
        <div className={styles.topNav}>
          <button
            className={styles.backButton}
            onClick={onBack}
            title="Powrót do listy projektów"
          >
            <ArrowLeft size={20} />
            Powrót do projektów
          </button>

          <div className={styles.projectInfo}>
            <h1>{project.name}</h1>
            <span className={styles.projectId}>ID: {project.id}</span>
          </div>
        </div>

        <div className={styles.mainLayout}>
          {/* Section Navigation */}
          <aside className={styles.sectionNav}>
            <nav className={styles.sectionMenu}>
              {sectionMenuItems.map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    className={`${styles.sectionItem} ${
                      activeSection === item.id ? styles.active : ''
                    }`}
                    onClick={() => setActiveSection(item.id as ProjectSection)}
                  >
                    <IconComponent size={20} />
                    <span>{item.label}</span>
                    {item.count !== null && item.count > 0 && (
                      <span className={styles.sectionBadge}>{item.count}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className={styles.sectionContent}>
            {renderSectionContent()}
          </main>
        </div>
      </div>
    );
  }
);

ProjectDetailsDashboard.displayName = 'ProjectDetailsDashboard';

export default ProjectDetailsDashboard;
