/**
 * Project Dashboard Component with Real-time Updates
 * ThinkCode AI Platform - Main Project Interface with WebSocket integration
 */

import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { Project } from '../types/project';
import { useProject } from '../contexts/ProjectContext';
import EnhancedAssistant from './EnhancedAssistant';
import RestructuredWorkflow from './RestructuredWorkflow';
import EnhancedFileUpload from './EnhancedFileUpload';
import { MICROSOFT_SDL_WORKFLOW } from '../constants/microsoftWorkflow';
import { agentApiService } from '../services/agentApiService';
import { apiService } from '../services/apiService';
import { useWebSocket, AgentMessage } from '../hooks/useWebSocket';
import styles from '../styles/project-dashboard.module.css';

// Mapowanie ID agentów na ładne nazwy
const AGENT_NAMES: Record<string, string> = {
  'business-analyst': 'Business Analyst',
  'system-architect': 'System Architect',
  'backend-developer': 'Backend Developer',
  'frontend-developer': 'Frontend Developer',
  'qa-engineer': 'QA Engineer',
  'devops-engineer': 'DevOps Engineer',
  'ui-ux-designer': 'UI/UX Designer',
  'technical-writer': 'Technical Writer',
  'project-manager': 'Project Manager',
};

// Funkcja do mapowania nazwy agenta
const getAgentDisplayName = (agentId: string, agentName?: string): string => {
  // Jeśli agent ma już ładną nazwę z API, użyj jej
  if (agentName && !agentName.includes('-')) {
    return agentName;
  }

  // Spróbuj zmapować z ID
  const mappedName = AGENT_NAMES[agentId];
  if (mappedName) {
    return mappedName;
  }

  // Fallback - sformatuj ID
  return agentId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface ProjectContext {
  projectId: string;
  project: Project;
  hasFiles: boolean;
  inputFileCount: number;
  state: string;
  routing: {
    canProceedToDashboard: boolean;
    nextStep: { action: string; message: string };
    recommendedRoute: 'dashboard' | 'upload';
  };
}

interface ProjectDashboardProps {
  project: Project;
  onBackToProjects: () => void;
  projectContext?: ProjectContext;
}

export default function ProjectDashboard({
  project,
  onBackToProjects,
  projectContext,
}: ProjectDashboardProps) {
  const { setCurrentProject } = useProject();
  const [projectStarted, setProjectStarted] = useState(false);

  // Real-time WebSocket connection
  const { isConnected, lastWorkflowUpdate, lastAgentMessage, clearMessages } =
    useWebSocket({
      projectId: project.id,
      autoConnect: true,
    });

  // State for real-time updates
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [liveMessages, setLiveMessages] = useState<AgentMessage[]>([]);
  const [isAssistantVisible, setIsAssistantVisible] = useState(false);

  // Workflow state
  const [currentStepId, setCurrentStepId] = useState('requirements-gathering');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [agentStatuses, setAgentStatuses] = useState({
    'business-analyst': { status: 'available' as const },
    'system-architect': { status: 'available' as const },
    'backend-developer': { status: 'available' as const },
    'frontend-developer': { status: 'available' as const },
    'qa-engineer': { status: 'available' as const },
  });

  // Handle real-time updates
  useEffect(() => {
    if (lastWorkflowUpdate) {
      console.log('📊 New workflow update:', lastWorkflowUpdate);

      // Update workflow status if this update is for our project
      if (lastWorkflowUpdate.projectId === project.id) {
        setWorkflowStatus({
          workflowId: lastWorkflowUpdate.workflowId,
          status: lastWorkflowUpdate.status,
          message: lastWorkflowUpdate.message,
          progress: lastWorkflowUpdate.progress || 0,
          stepId: lastWorkflowUpdate.stepId,
          agentId: lastWorkflowUpdate.agentId,
          timestamp: lastWorkflowUpdate.timestamp,
          data: lastWorkflowUpdate.data,
        });
      }
    }
  }, [lastWorkflowUpdate, project.id]);

  useEffect(() => {
    if (lastAgentMessage) {
      console.log('🤖 New agent message:', lastAgentMessage);

      // Add agent message to live messages if it's for our project
      if (lastAgentMessage.projectId === project.id) {
        setLiveMessages((prev: AgentMessage[]) => [
          ...prev.slice(-19),
          lastAgentMessage,
        ]); // Keep last 20 messages
      }
    }
  }, [lastAgentMessage, project.id]);

  // Connection status effect
  useEffect(() => {
    console.log(
      `🔌 WebSocket connection status: ${
        isConnected ? 'Connected' : 'Disconnected'
      }`
    );
  }, [isConnected]);

  // Auto-start project if it already has files
  useEffect(() => {
    if (project.hasFiles && !projectStarted) {
      console.log('🚀 Auto-starting project with existing files');
      setProjectStarted(true);
      // Optional: Auto-start workflow for projects with files
      // handleStartProject();
    }
  }, [project.hasFiles, projectStarted]);

  const handleSwitchProject = () => {
    setCurrentProject(null);
    onBackToProjects();
  };

  const handleStartProject = async (description?: string, files?: FileList) => {
    console.log('🎯 handleStartProject called', {
      projectId: project.id,
      description,
      files,
      filesLength: files?.length,
      hasFiles: project.hasFiles,
    });

    try {
      // Upload files if provided and project doesn't have files yet
      if (files && files.length > 0) {
        console.log('📤 Uploading files...');
        const uploadResponse = await agentApiService.uploadFiles(
          project.id,
          files
        );
        console.log('📤 Upload response:', uploadResponse);
        if (!uploadResponse.success) {
          console.error('Failed to upload files:', uploadResponse.error);
          alert(`Błąd uploadu plików: ${uploadResponse.error}`);
          return;
        }
      } else if (!project.hasFiles) {
        console.log('⚠️  No files provided and project has no existing files');
        // Możemy tutaj pokazać komunikat albo pozwolić na kontynuację bez plików
      }

      // Start REAL project workflow with analysis
      console.log('⚡ Starting REAL-TIME workflow...');
      clearMessages(); // Clear previous messages
      const response = await agentApiService.startWorkflow(
        project.id,
        'project_analysis'
      );
      console.log('⚡ Real-time workflow response:', response);

      if (response.success) {
        console.log(
          '✅ Real-time workflow started successfully!',
          response.data
        );
        setProjectStarted(true);

        // Set initial workflow status
        if (response.data.workflow) {
          setWorkflowStatus({
            workflowId: response.data.workflowId,
            status: 'started',
            message: 'Workflow started - agents are beginning analysis',
            progress: 0,
            stepId: 'initialization',
            agentId: 'system',
            timestamp: response.data.timestamp,
          });
        }

        // Send initial project data to agents for analysis
        const projectData = [
          `Rozpocznij analizę projektu: ${project.name}`,
          `Opis: ${description || project.description || 'Brak opisu'}`,
          `Status: ${project.status}`,
          `Tagi: ${project.tags.join(', ') || 'Brak tagów'}`,
          `Pliki: ${files?.length || 0} załączonych plików`,
        ].join('\n');

        console.log('💬 Sending initial message...');
        const messageResponse = await agentApiService.sendMessage(
          project.id,
          projectData
        );
        console.log('💬 Message response:', messageResponse);

        // alert('✅ Projekt rozpoczęty pomyślnie!');
      } else {
        console.error('❌ Failed to start project workflow:', response.error);

        // FALLBACK: If backend is not available, still show the UI
        if (
          response.error?.includes('fetch') ||
          response.error?.includes('connection') ||
          response.error?.includes('ECONNREFUSED')
        ) {
          console.log('🔄 Backend not available, enabling demo mode...');
          setProjectStarted(true);
          alert('⚠️ Backend nie jest dostępny. Uruchamianie w trybie demo...');
        } else {
          alert(`❌ Błąd uruchomienia workflow: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('💥 Error starting project:', error);
      alert(
        `💥 Błąd: ${error instanceof Error ? error.message : 'Nieznany błąd'}`
      );
    }
  };

  // ============ WORKFLOW API HANDLERS ============

  const handleStepApprove = async (stepId: string) => {
    try {
      console.log('✅ Approving step:', stepId);
      const response = await apiService.approveWorkflowStep(project.id, stepId);

      if (response.data) {
        console.log('✅ Step approved successfully:', response.data);
        setCompletedSteps((prev: string[]) => [...prev, stepId]);
        // TODO: Move to next step if needed
      }
    } catch (error) {
      console.error('💥 Error approving step:', error);
      alert(
        `Błąd zatwierdzania kroku: ${
          error instanceof Error ? error.message : 'Nieznany błąd'
        }`
      );
    }
  };

  const handleStepRevoke = async (stepId: string) => {
    try {
      console.log('❌ Revoking step approval:', stepId);
      const response = await apiService.revokeWorkflowStep(project.id, stepId);

      if (response.data) {
        console.log('❌ Step approval revoked successfully:', response.data);
        setCompletedSteps((prev: string[]) => prev.filter(id => id !== stepId));
      }
    } catch (error) {
      console.error('💥 Error revoking step:', error);
      alert(
        `Błąd cofania zatwierdzenia: ${
          error instanceof Error ? error.message : 'Nieznany błąd'
        }`
      );
    }
  };

  const handleStepReject = async (stepId: string, reason: string) => {
    try {
      console.log('🚫 Rejecting step:', stepId, 'Reason:', reason);

      const response = await fetch(
        `/api/projects/${project.id}/workflow/steps/${stepId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Step rejected successfully:', result);

      // Update workflow status to reflect rejection
      setWorkflowStatus((prev: any) => ({
        ...prev,
        status: 'step_rejected',
        message: `Krok ${stepId} został odrzucony: ${reason}`,
        stepId,
        timestamp: new Date().toISOString(),
      }));

      alert('Krok został pomyślnie odrzucony');
    } catch (error) {
      console.error('💥 Error rejecting step:', error);
      alert(
        `Błąd odrzucania kroku: ${
          error instanceof Error ? error.message : 'Nieznany błąd'
        }`
      );
    }
  };

  const handleAgentAction = async (agentId: string, action: string) => {
    try {
      console.log('🤖 Agent action:', agentId, action);

      const response = await fetch(
        `/api/projects/${project.id}/agents/${agentId}/actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Agent action executed successfully:', result);

      // Update agent status based on action
      setAgentStatuses((prev: any) => ({
        ...prev,
        [agentId]: {
          ...prev[agentId as keyof typeof prev],
          status:
            action === 'start'
              ? 'working'
              : action === 'pause'
              ? 'paused'
              : action === 'stop'
              ? 'available'
              : action === 'resume'
              ? 'working'
              : 'available',
        },
      }));

      // Show confirmation message
      const actionMessages = {
        start: 'uruchomiony',
        pause: 'wstrzymany',
        resume: 'wznowiony',
        stop: 'zatrzymany',
        chat: 'rozpoczął komunikację',
      };

      const message =
        actionMessages[action as keyof typeof actionMessages] ||
        'wykonał akcję';
      alert(`Agent ${getAgentDisplayName(agentId)} został ${message}`);
    } catch (error) {
      console.error('💥 Error handling agent action:', error);
      alert(
        `Błąd akcji agenta: ${
          error instanceof Error ? error.message : 'Nieznany błąd'
        }`
      );
    }
  };

  const handleStepSelect = (stepId: string) => {
    console.log('🎯 Selecting step:', stepId);
    setCurrentStepId(stepId);
  };

  // Smart routing based on project context
  const shouldShowUploadPrompt =
    projectContext && !projectContext.routing.canProceedToDashboard;
  const projectState = projectContext?.state || 'unknown';

  return (
    <div className={styles.container}>
      <ProjectHeader project={project} onSwitchProject={handleSwitchProject} />

      {/* Project State Banner - show routing guidance */}
      {shouldShowUploadPrompt && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 m-4 rounded-lg">
          <div className="flex items-center">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Project Setup Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{projectContext?.routing.nextStep.message}</p>
                <p className="mt-1">
                  <strong>Project State:</strong> {projectState} |
                  <strong> Files:</strong> {projectContext?.inputFileCount || 0}{' '}
                  uploaded
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant - warunkowo widoczny */}
      {isAssistantVisible && (
        <EnhancedAssistant
          workflowStep={workflowStatus}
          conversations={liveMessages}
          onAssistRequest={message => {
            // Handle assistant request
            console.log('Assistant request:', message);
          }}
          isLoading={!isConnected}
        />
      )}

      {/* Ikona żarówki w prawym dolnym rogu */}
      <button
        className={styles.assistantToggle}
        onClick={() => setIsAssistantVisible(!isAssistantVisible)}
        title={isAssistantVisible ? 'Ukryj asystenta' : 'Pokaż asystenta AI'}
      >
        <Lightbulb size={24} color="white" />
      </button>

      <div className={styles.content}>
        {!projectStarted ? (
          /* Projekt nie rozpoczęty - pokaż guide */
          <div className={styles.mainContent}>
            <ProjectGuide
              project={project}
              onStartProject={handleStartProject}
            />
          </div>
        ) : (
          /* Projekt w toku - pokaż nowy Microsoft Workflow */
          <>
            <div className={styles.mainContent}>
              <RestructuredWorkflow
                currentStepId={currentStepId}
                completedSteps={completedSteps}
                agentStatuses={agentStatuses}
                onStepApprove={handleStepApprove}
                onStepRevoke={handleStepRevoke}
                onStepReject={handleStepReject}
                onStepSelect={handleStepSelect}
                onAgentAction={handleAgentAction}
              />
            </div>

            {/* Sidebar z krokami workflow */}
            <div className={styles.sidebar}>
              <WorkflowStepsList
                currentStepId={currentStepId}
                completedSteps={completedSteps}
                onStepSelect={handleStepSelect}
                onStepRevoke={handleStepRevoke}
              />
            </div>
          </>
        )}
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

// Project Guide Component - First time user experience with real-time updates
function ProjectGuide({
  project,
  onStartProject,
}: {
  project: Project;
  onStartProject: (description?: string, files?: FileList) => void;
}) {
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

  const handleStart = () => {
    onStartProject(description, selectedFiles || undefined);
  };
  return (
    <div className={styles.guideContainer}>
      <div className={styles.guideHeader}>
        <h2 className={styles.guideTitle}>
          🚀 Rozpocznij Projekt: {project.name}
        </h2>
        <p className={styles.guideDescription}>
          Zacznijmy od podstaw. Pierwszym krokiem jest przygotowanie
          specyfikacji projektu.
        </p>
      </div>

      <div className={styles.guideSteps}>
        <div className={styles.guideStep}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Prześlij opis projektu</h3>
            <p className={styles.stepText}>
              Załaduj plik ze specyfikacją (PDF, DOC, TXT) lub wpisz opis
              projektu
            </p>
            <div className={styles.stepActions}>
              <EnhancedFileUpload
                projectId={project.id}
                acceptedFiles="image/*,.pdf,.doc,.docx,.txt,.md,.zip,.png,.jpg,.jpeg,.gif,.svg"
                maxFiles={20}
                maxFileSize={50}
                multiple={true}
                uploadUrl={`${
                  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'
                }/api/projects/${project.id}/files`}
                onFilesUploaded={files => {
                  console.log('Files uploaded:', files);
                  setSelectedFiles(files as any);
                }}
                onError={error => {
                  console.error('Upload error:', error);
                  alert(`Błąd uploadu: ${error}`);
                }}
                title="Prześlij pliki projektu"
                description="Przeciągnij dokumenty, zdjęcia, mockupy lub kliknij aby wybrać"
                showPreview={true}
                className={styles.enhancedUpload}
              />
              <div className={styles.uploadDivider}>
                <span>lub</span>
              </div>
              <textarea
                placeholder="Opisz swój projekt w detalach..."
                className={styles.descriptionInput}
                rows={6}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.guideStep}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>AI przeanalizuje wymagania</h3>
            <p className={styles.stepText}>
              Nasze agenci przeanalizują specyfikację i zaproponują workflow
            </p>
          </div>
        </div>

        <div className={styles.guideStep}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepContent}>
            <h3 className={styles.stepTitle}>Startujemy realizację</h3>
            <p className={styles.stepText}>
              Możesz monitorować postęp i komunikować się z agentami
            </p>
          </div>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button
          className={styles.startButton}
          onClick={handleStart}
          type="button"
        >
          Rozpocznij analizę projektu
        </button>
      </div>
    </div>
  );
}

// Komponent listy kroków workflow dla sidebar
interface WorkflowStepsListProps {
  currentStepId?: string;
  completedSteps?: string[];
  onStepSelect?: (stepId: string) => void;
  onStepRevoke?: (stepId: string) => void;
}

function WorkflowStepsList({
  currentStepId,
  completedSteps = [],
  onStepSelect,
  onStepRevoke,
}: WorkflowStepsListProps) {
  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStepId) return 'current';
    return 'pending';
  };

  const canNavigateToStep = (stepId: string) => {
    const stepIndex = MICROSOFT_SDL_WORKFLOW.findIndex(s => s.id === stepId);
    const currentIndex = MICROSOFT_SDL_WORKFLOW.findIndex(
      s => s.id === currentStepId
    );
    return stepIndex <= currentIndex + 1;
  };

  const handleStepClick = (stepId: string) => {
    if (canNavigateToStep(stepId)) {
      onStepSelect?.(stepId);
    }
  };

  const handleRevokeApproval = (stepId: string) => {
    onStepRevoke?.(stepId);
  };

  return (
    <div className={styles.workflowSteps}>
      <h4 className={styles.stepsTitle}>Kroki Workflow</h4>
      <div className={styles.stepsList}>
        {MICROSOFT_SDL_WORKFLOW.map((step, index) => {
          const status = getStepStatus(step.id);
          const isAccessible = canNavigateToStep(step.id);
          const isCurrent = step.id === currentStepId;

          return (
            <div key={step.id} className={styles.stepItem}>
              <button
                className={`${styles.stepButton} ${styles[status]} ${
                  isCurrent ? styles.active : ''
                }`}
                onClick={() => handleStepClick(step.id)}
                disabled={!isAccessible}
              >
                <div className={styles.stepNumber}>{index + 1}</div>
                <div className={styles.stepDetails}>
                  <span className={styles.stepName}>{step.name}</span>
                  <span className={styles.stepPhase}>
                    {step.phase.toUpperCase()}
                  </span>
                </div>
                <div className={styles.stepStatus}>
                  {status === 'completed' ? (
                    <div className={styles.stepStatusText}>Completed</div>
                  ) : status === 'current' ? (
                    <div className={styles.stepStatusText}>In_progress</div>
                  ) : (
                    <div className={styles.stepStatusText}>Pending</div>
                  )}
                </div>
              </button>

              {/* Wymaga zatwierdzenia badge */}
              {(status === 'current' ||
                (status === 'pending' && step.requiredApproval)) && (
                <div className={styles.approvalBadge}>Wymaga zatwierdzenia</div>
              )}

              {/* Przycisk wycofania zatwierdzenia */}
              {status === 'completed' && (
                <button
                  className={styles.revokeBtn}
                  onClick={e => {
                    e.stopPropagation();
                    handleRevokeApproval(step.id);
                  }}
                  title="Wycofaj zatwierdzenie tego kroku"
                >
                  Wycofaj
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
