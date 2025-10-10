/**
 * Restructured Workflow Component
 * Lewy panel: aktualny krok, prawy panel: lista kroków + chat
 */

import React from 'react';
import {
  CheckCircle,
  Clock,
  Users,
  Play,
  Pause,
  StopCircle,
  MessageSquare,
  FileText,
  RotateCcw,
} from 'lucide-react';
import {
  MICROSOFT_SDL_WORKFLOW,
  AGENT_STATUS_CONFIG,
  WorkflowHelpers,
} from '../constants/microsoftWorkflow';
import styles from '../styles/restructured-workflow.module.css';

interface RestructuredWorkflowProps {
  currentStepId?: string;
  completedSteps?: string[];
  agentStatuses?: Record<
    string,
    {
      status: keyof typeof AGENT_STATUS_CONFIG;
      currentTask?: string;
      progress?: number;
      messages?: Array<{
        id: string;
        content: string;
        timestamp: Date;
        type: 'analysis' | 'question' | 'task' | 'info';
      }>;
    }
  >;
  onStepSelect?: (stepId: string) => void;
  onStepApprove?: (stepId: string) => void;
  onStepReject?: (stepId: string, reason: string) => void;
  onStepRevoke?: (stepId: string) => void;
  onAgentAction?: (
    agentId: string,
    action: 'pause' | 'resume' | 'stop' | 'chat'
  ) => void;
}

export default function RestructuredWorkflow({
  currentStepId = 'requirements-gathering',
  completedSteps = [],
  agentStatuses = {},
  onStepSelect,
  onStepApprove,
  onStepReject,
  onStepRevoke,
  onAgentAction,
}: RestructuredWorkflowProps) {
  const currentStep = MICROSOFT_SDL_WORKFLOW.find(s => s.id === currentStepId);
  const currentStepIndex = MICROSOFT_SDL_WORKFLOW.findIndex(
    s => s.id === currentStepId
  );

  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStepId) return 'current';

    const stepIndex = MICROSOFT_SDL_WORKFLOW.findIndex(s => s.id === stepId);
    const currentIndex = MICROSOFT_SDL_WORKFLOW.findIndex(
      s => s.id === currentStepId
    );

    // Można wrócić do kroków poprzednich (już ukończonych lub bieżącego)
    if (stepIndex <= currentIndex) return 'accessible';

    // Sprawdzamy czy wszystkie poprzednie kroki są ukończone
    const previousStepsCompleted = MICROSOFT_SDL_WORKFLOW.slice(
      0,
      stepIndex
    ).every(step => completedSteps.includes(step.id));

    if (previousStepsCompleted) return 'accessible';
    return 'locked';
  };

  const canNavigateToStep = (stepId: string) => {
    const status = getStepStatus(stepId);
    return (
      status === 'completed' || status === 'current' || status === 'accessible'
    );
  };

  const handleRevokeApproval = (stepId: string) => {
    if (completedSteps.includes(stepId)) {
      onStepRevoke?.(stepId);
    }
  };

  const handleStepClick = (stepId: string) => {
    if (canNavigateToStep(stepId)) {
      onStepSelect?.(stepId);
    }
  };

  const renderAgentStatus = (agentType: string) => {
    const agent = agentStatuses[agentType];
    if (!agent) {
      return (
        <div className={styles.agentStatus}>
          <span className={styles.agentIcon}>⚪</span>
          <span className={styles.agentLabel}>Nieprzypisany</span>
        </div>
      );
    }

    const statusConfig = AGENT_STATUS_CONFIG[agent.status];

    return (
      <div className={styles.agentStatus}>
        <span className={styles.agentIcon}>{statusConfig.icon}</span>
        <span className={`${styles.agentLabel} agent-${agent.status}`}>
          {statusConfig.label}
        </span>
        {agent.status === 'working' && agent.progress && (
          <div className={styles.agentProgress}>
            <div
              className={styles.agentProgressBar}
              data-agent-progress={agent.progress}
            />
          </div>
        )}
        {agent.currentTask && (
          <span className={styles.agentTask}>{agent.currentTask}</span>
        )}
      </div>
    );
  };

  const renderAgentControls = (agentType: string) => {
    const agent = agentStatuses[agentType];
    if (!agent || agent.status === 'available') return null;

    return (
      <div className={styles.agentControls}>
        <button
          className={styles.agentControlBtn}
          onClick={() => onAgentAction?.(agentType, 'chat')}
          title="Chat z agentem"
        >
          <MessageSquare size={16} />
        </button>

        {agent.status === 'working' && (
          <button
            className={styles.agentControlBtn}
            onClick={() => onAgentAction?.(agentType, 'pause')}
            title="Wstrzymaj agenta"
          >
            <Pause size={16} />
          </button>
        )}

        {agent.status === 'paused' && (
          <button
            className={styles.agentControlBtn}
            onClick={() => onAgentAction?.(agentType, 'resume')}
            title="Wznów pracę agenta"
          >
            <Play size={16} />
          </button>
        )}

        <button
          className={styles.agentControlBtn}
          onClick={() => onAgentAction?.(agentType, 'stop')}
          title="Zatrzymaj agenta"
        >
          <StopCircle size={16} />
        </button>
      </div>
    );
  };

  return (
    <div className={styles.workflowContainer}>
      {/* Główny nagłówek */}
      <div className={styles.workflowHeader}>
        <h2 className={styles.workflowTitle}>
          Workflow Rozwoju Nowego Projektu
        </h2>
        <p className={styles.workflowSubtitle}>
          Kompletny workflow dla rozwoju nowych aplikacji od wymagań do
          wdrożenia
        </p>
        <div className={styles.workflowProgress}>
          <div className={styles.progressLabel}>
            Postęp: {WorkflowHelpers.calculateProgress(completedSteps)}%
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              data-progress={WorkflowHelpers.calculateProgress(completedSteps)}
            />
          </div>
          <div className={styles.progressLabel}>
            Aktualny krok: {currentStepIndex + 1} z{' '}
            {MICROSOFT_SDL_WORKFLOW.length}
          </div>
        </div>
      </div>

      <div className={styles.workflowBody}>
        {/* LEWY PANEL - Aktualny krok */}
        <div className={styles.leftPanel}>
          <div className={styles.leftPanelContent}>
            <div className={styles.mainStepContent}>
              <div className={styles.stepHeader}>
                <div className={styles.stepHeaderLeft}>
                  <div className={styles.stepIcon}>
                    {completedSteps.includes(currentStepId) ? (
                      <CheckCircle className={styles.iconCompleted} size={24} />
                    ) : (
                      <Clock className={styles.iconCurrent} size={24} />
                    )}
                  </div>
                  <div className={styles.stepInfo}>
                    <h3 className={styles.stepTitle}>{currentStep?.name}</h3>
                    <p className={styles.stepDescription}>
                      {currentStep?.description}
                    </p>
                    <div className={styles.stepMeta}>
                      <span className={styles.stepPhase}>
                        {currentStep?.phase}
                      </span>
                      <span className={styles.stepDuration}>
                        {currentStep?.estimatedDuration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Przyciski zatwierdzenia w nagłówku */}
                {currentStep?.requiredApproval && (
                  <div className={styles.stepHeaderRight}>
                    {!completedSteps.includes(currentStepId) ? (
                      <>
                        <button
                          className={styles.headerApproveBtn}
                          onClick={() => onStepApprove?.(currentStepId)}
                        >
                          ✅ Zatwierdź
                        </button>
                        <button
                          className={styles.headerRejectBtn}
                          onClick={() => {
                            const reason = prompt('Podaj powód odrzucenia:');
                            if (reason) onStepReject?.(currentStepId, reason);
                          }}
                        >
                          ❌ Poprawki
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.headerRevokeBtn}
                        onClick={() => onStepRevoke?.(currentStepId)}
                      >
                        <RotateCcw size={14} />
                        Wycofaj
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Przypisani agenci */}
              <div className={styles.stepAgents}>
                <h4 className={styles.sectionTitle}>
                  <Users size={16} />
                  Przypisani agenci
                </h4>
                <div className={styles.agentsList}>
                  {currentStep?.agentTypes.map(agentType => (
                    <div key={agentType} className={styles.agentItem}>
                      <div className={styles.agentInfo}>
                        <span className={styles.agentName}>{agentType}</span>
                        {renderAgentStatus(agentType)}
                      </div>
                      {renderAgentControls(agentType)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dostarczalne elementy */}
              <div className={styles.stepDeliverables}>
                <h4 className={styles.sectionTitle}>
                  Elementy do dostarczenia
                </h4>
                <ul className={styles.deliverablesList}>
                  {currentStep?.deliverables.map((deliverable, idx) => (
                    <li key={idx} className={styles.deliverableItem}>
                      <FileText size={14} />
                      {deliverable}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kryteria akceptacji */}
              <div className={styles.stepCriteria}>
                <h4 className={styles.sectionTitle}>Kryteria akceptacji</h4>
                <ul className={styles.criteriaList}>
                  {currentStep?.approvalCriteria.map((criteria, idx) => (
                    <li key={idx} className={styles.criteriaItem}>
                      <CheckCircle size={14} />
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Chat i Upload plików w osobnej kolumnie */}
            <div className={styles.chatColumn}>
              {/* Upload plików dla bieżącego kroku */}
              <div className={styles.stepFileUpload}>
                <h4 className={styles.sectionTitle}>📁 Dodaj Pliki</h4>
                <div className={styles.uploadArea}>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt,.md,.zip,.png,.jpg,.jpeg,.gif,.svg"
                    className={styles.fileInput}
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        console.log(
                          `Files for step ${currentStepId}:`,
                          e.target.files
                        );
                        // TODO: Handle file upload for current step
                      }
                    }}
                  />
                  <div className={styles.uploadHint}>
                    Prześlij dodatkowe pliki dla tego kroku
                  </div>
                </div>
              </div>

              <div className={styles.stepChat}>
                <h4 className={styles.sectionTitle}>💬 Chat z Agentami</h4>
                <div className={styles.chatMessages}>
                  <div className={styles.emptyChat}>
                    <MessageSquare size={24} />
                    <p>
                      Rozpocznij konwersację z agentami pracującymi nad tym
                      krokiem...
                    </p>
                  </div>
                </div>
                <div className={styles.chatInput}>
                  <input
                    type="text"
                    placeholder={`Napisz do agentów pracujących nad krokiem "${currentStep?.name}"...`}
                    className={styles.chatInputField}
                  />
                  <button className={styles.chatSendBtn}>Wyślij</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
