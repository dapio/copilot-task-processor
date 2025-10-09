/**
 * Project Dashboard Component with Real-time Updates
 * ThinkCode AI Platform - Main Project Interface with WebSocket integration
 */

import React, { useState, useEffect } from 'react';
import { Project } from '../types/project';
import { useProject } from '../contexts/ProjectContext';
import ProjectProgress from './ProjectProgress';
import EnhancedAssistant from './EnhancedAssistant';
import SmartHelpSystem from './SmartHelpSystem';
import { agentApiService } from '../services/agentApiService';
import {
  useWebSocket,
  WorkflowUpdate,
  AgentMessage,
} from '../hooks/useWebSocket';
import styles from '../styles/project-dashboard.module.css';

interface ProjectDashboardProps {
  project: Project;
  onBackToProjects: () => void;
}

export default function ProjectDashboard({
  project,
  onBackToProjects,
}: ProjectDashboardProps) {
  const { setCurrentProject } = useProject();
  const [projectStarted, setProjectStarted] = useState(false);

  // Real-time WebSocket connection
  const {
    isConnected,
    workflowUpdates,
    lastWorkflowUpdate,
    lastAgentMessage,
    clearMessages,
  } = useWebSocket({
    projectId: project.id,
    autoConnect: true,
  });

  // State for real-time updates
  const [workflowStatus, setWorkflowStatus] = useState<any>(null);
  const [liveMessages, setLiveMessages] = useState<AgentMessage[]>([]);
  const [isHelpVisible, setIsHelpVisible] = useState(false);

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
        setLiveMessages(prev => [...prev.slice(-19), lastAgentMessage]); // Keep last 20 messages
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
    });

    try {
      // Upload files if provided
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

  return (
    <div className={styles.container}>
      <ProjectHeader project={project} onSwitchProject={handleSwitchProject} />

      {/* AI Assistant - zawsze widoczny */}
      <EnhancedAssistant
        projectStarted={projectStarted}
        workflowStatus={workflowStatus}
        liveMessages={liveMessages}
        isConnected={isConnected}
        onStartProject={handleStartProject}
      />

      {/* Smart Help System */}
      <SmartHelpSystem
        context={{
          currentPage: 'dashboard',
          userRole: 'beginner',
          projectPhase: projectStarted
            ? workflowStatus?.status === 'running'
              ? 'analysis'
              : workflowStatus?.status === 'completed'
              ? 'development'
              : 'setup'
            : 'setup',
          lastActivity: liveMessages.length > 0 ? 'task-created' : undefined,
          strugglingWith: !isConnected ? ['connection'] : undefined,
        }}
        isVisible={isHelpVisible}
        onToggle={() => setIsHelpVisible(!isHelpVisible)}
      />

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
          /* Projekt w toku - pokaż workflow */
          <>
            <div className={styles.mainContent}>
              <ProjectWorkflowMain
                projectId={project.id}
                isConnected={isConnected}
                workflowStatus={workflowStatus}
                liveMessages={liveMessages}
                workflowUpdates={workflowUpdates}
              />
            </div>

            {/* Sidebar z Progress i Chat */}
            <div className={styles.sidebar}>
              <ProjectProgress projectId={project.id} />
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
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className={styles.fileInput}
                title="Wybierz plik ze specyfikacją"
                aria-label="Wybierz plik ze specyfikacją"
                onChange={e => setSelectedFiles(e.target.files)}
              />
              <span>lub</span>
              <textarea
                placeholder="Opisz swój projekt..."
                className={styles.descriptionInput}
                rows={4}
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

// Main Workflow Component - Heart of the project
function ProjectWorkflowMain({
  projectId,
  isConnected,
  workflowStatus,
  liveMessages,
  workflowUpdates,
}: {
  projectId: string;
  isConnected: boolean;
  workflowStatus: any;
  liveMessages: AgentMessage[];
  workflowUpdates: WorkflowUpdate[];
}) {
  const [workflow, setWorkflow] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflowData();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadWorkflowData = async () => {
    try {
      setLoading(true);

      // Load workflow data
      const workflowResponse = await agentApiService.getProjectWorkflow(
        projectId
      );
      if (workflowResponse.success) {
        setWorkflow(workflowResponse.data);
      }

      // Load agents data
      const agentsResponse = await agentApiService.getAgents();
      if (agentsResponse.success) {
        setAgents(agentsResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading workflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.workflowMain}>
        <div className={styles.loadingSpinner}>Ładowanie workflow...</div>
      </div>
    );
  }

  const currentStep = workflow?.steps?.[workflow.currentStep - 1];
  const activeAgents = agents.filter(agent => agent.status === 'active');

  return (
    <div className={styles.workflowMain} data-project-id={projectId}>
      <div className={styles.workflowHeader}>
        <h2 className={styles.workflowTitle}>
          ⚡ {workflow?.name || 'Workflow Projektu'}
        </h2>
        <div className={styles.workflowControls}>
          <button className={styles.pauseButton}>⏸️ Pauza</button>
          <button className={styles.settingsButton}>⚙️ Ustawienia</button>
        </div>
      </div>

      <div className={styles.currentPhase}>
        <h3 className={styles.phaseTitle}>
          Aktualny etap: {currentStep?.name || 'Oczekuje na rozpoczęcie'}
        </h3>
        <div className={styles.phaseProgress}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${
                !workflow?.progress || workflow.progress === 0
                  ? styles.progress0
                  : workflow.progress <= 10
                  ? styles.progress10
                  : workflow.progress <= 25
                  ? styles.progress25
                  : workflow.progress <= 50
                  ? styles.progress50
                  : workflow.progress <= 75
                  ? styles.progress75
                  : styles.progress100
              }`}
            />
          </div>
          <span className={styles.progressText}>
            {workflow?.progress || 0}% ukończone
          </span>
        </div>
      </div>

      <div className={styles.activeAgents}>
        <h4 className={styles.sectionTitle}>
          🤖 Aktywni Agenci ({activeAgents.length})
        </h4>
        <div className={styles.agentsList}>
          {activeAgents.length > 0 ? (
            activeAgents.map(agent => (
              <div key={agent.id} className={styles.agentCard}>
                <div className={styles.agentAvatar}>🤖</div>
                <div className={styles.agentInfo}>
                  <div className={styles.agentName}>{agent.name}</div>
                  <div className={styles.agentTask}>
                    {agent.currentTask || 'Oczekuje na zadanie...'}
                  </div>
                </div>
                <div className={styles.agentStatus}>
                  {agent.status === 'active' ? '🔄 Pracuje' : '💤 Bezczynny'}
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noAgents}>
              <p>Brak aktywnych agentów</p>
              <small>Agenci rozpoczną pracę po uruchomieniu workflow</small>
            </div>
          )}
        </div>
      </div>

      <div className={styles.recentActivity}>
        <h4 className={styles.sectionTitle}>📝 Ostatnia aktywność</h4>
        <div className={styles.activityFeed}>
          {workflow?.steps?.slice(-3).map((step: any) => (
            <div key={step.id} className={styles.activityItem}>
              <div className={styles.activityTime}>
                {step.completedAt
                  ? new Date(step.completedAt).toLocaleTimeString('pl-PL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '--:--'}
              </div>
              <div className={styles.activityText}>
                {step.status === 'completed'
                  ? `✅ Ukończono: ${step.name}`
                  : step.status === 'in_progress'
                  ? `🔄 W trakcie: ${step.name}`
                  : `⏳ Oczekuje: ${step.name}`}
              </div>
            </div>
          )) || (
            <div className={styles.activityItem}>
              <div className={styles.activityTime}>--:--</div>
              <div className={styles.activityText}>Brak aktywności</div>
            </div>
          )}
        </div>
      </div>

      {/* Live Updates for Active Workflow */}
      {(isConnected || workflowStatus || liveMessages.length > 0) && (
        <div className={styles.realTimeSection}>
          <h4 className={styles.sectionTitle}>
            🔴 Live Updates {isConnected ? '(Connected)' : '(Connecting...)'}
          </h4>

          {workflowStatus && (
            <div className={styles.workflowStatusCard}>
              <div className={styles.statusHeader}>
                <span className={styles.statusBadge}>
                  {workflowStatus.status}
                </span>
                <span className={styles.statusTime}>
                  {new Date(workflowStatus.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className={styles.statusMessage}>{workflowStatus.message}</p>
              {workflowStatus.progress > 0 && (
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    data-progress={workflowStatus.progress}
                  />
                  <span className={styles.progressText}>
                    {workflowStatus.progress}%
                  </span>
                </div>
              )}
            </div>
          )}

          {liveMessages.length > 0 && (
            <div className={styles.messagesContainer}>
              <h5>Agent Messages:</h5>
              <div className={styles.messagesList}>
                {liveMessages.slice(-5).map((message, index) => (
                  <div key={index} className={styles.messageCard}>
                    <div className={styles.messageHeader}>
                      <span className={styles.agentName}>
                        {message.agentId}
                      </span>
                      <span className={styles.messageType}>{message.type}</span>
                      <span className={styles.messageTime}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={styles.messageContent}>{message.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {workflowUpdates.length > 0 && (
            <div className={styles.updatesContainer}>
              <h5>Workflow Updates:</h5>
              <div className={styles.updatesList}>
                {workflowUpdates.slice(-3).map((update, index) => (
                  <div key={index} className={styles.updateCard}>
                    <div className={styles.updateHeader}>
                      <span className={styles.updateStep}>{update.stepId}</span>
                      <span className={styles.updateStatus}>
                        {update.status}
                      </span>
                      <span className={styles.updateTime}>
                        {new Date(update.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className={styles.updateMessage}>{update.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
