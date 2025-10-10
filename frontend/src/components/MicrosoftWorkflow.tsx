/**
 * Microsoft SDL Workflow Component
 * Wyświetla prawdziwy workflow zgodny z Microsoft Software Development Lifecycle
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Play,
  Pause,
  StopCircle,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  MICROSOFT_SDL_WORKFLOW,
  AGENT_STATUS_CONFIG,
  WorkflowHelpers,
} from '../constants/microsoftWorkflow';
import styles from '../styles/microsoft-workflow.module.css';

interface MicrosoftWorkflowProps {
  currentStepId?: string;
  completedSteps?: string[];
  agentStatuses?: Record<
    string,
    {
      status: keyof typeof AGENT_STATUS_CONFIG;
      currentTask?: string;
      progress?: number;
    }
  >;
  onStepApprove?: (stepId: string) => void;
  onStepReject?: (stepId: string, reason: string) => void;
  onAgentAction?: (
    agentId: string,
    action: 'pause' | 'resume' | 'stop' | 'chat'
  ) => void;
}

export default function MicrosoftWorkflow({
  currentStepId,
  completedSteps = [],
  agentStatuses = {},
  onStepApprove,
  onStepReject,
  onAgentAction,
}: MicrosoftWorkflowProps) {
  const [expandedStep, setExpandedStep] = useState<string | null>(
    currentStepId || null
  );
  const [, setShowAgentDetails] = useState<string | null>(null);

  const getStepStatus = (stepId: string) => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (stepId === currentStepId) return 'current';

    const stepIndex = MICROSOFT_SDL_WORKFLOW.findIndex(s => s.id === stepId);
    const currentIndex = MICROSOFT_SDL_WORKFLOW.findIndex(
      s => s.id === currentStepId
    );

    return stepIndex < currentIndex ? 'completed' : 'pending';
  };

  const getStepIcon = (stepId: string) => {
    const status = getStepStatus(stepId);
    switch (status) {
      case 'completed':
        return <CheckCircle className={styles.stepIconCompleted} size={20} />;
      case 'current':
        return <Clock className={styles.stepIconCurrent} size={20} />;
      default:
        return <div className={styles.stepIconPending} />;
    }
  };

  const getCurrentProgress = () => {
    return WorkflowHelpers.calculateProgress(completedSteps);
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
      <div
        className={styles.agentStatus}
        onClick={() => setShowAgentDetails(agentType)}
      >
        <span className={styles.agentIcon}>{statusConfig.icon}</span>
        <span
          className={styles.agentLabel}
          style={{ color: statusConfig.color }}
        >
          {statusConfig.label}
        </span>
        {agent.status === 'working' && agent.progress && (
          <div className={styles.agentProgress}>
            <div
              className={styles.agentProgressBar}
              style={{ width: `${agent.progress}%` }}
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
      {/* Nagłówek workflow */}
      <div className={styles.workflowHeader}>
        <h2 className={styles.workflowTitle}>🚀 Wizard Rozwoju Aplikacji</h2>
        <div className={styles.workflowProgress}>
          <div className={styles.progressLabel}>
            Postęp: {getCurrentProgress()}%
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${getCurrentProgress()}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista kroków workflow */}
      <div className={styles.workflowSteps}>
        {MICROSOFT_SDL_WORKFLOW.map((step, index) => {
          const isExpanded = expandedStep === step.id;
          const status = getStepStatus(step.id);
          const isWaitingApproval =
            status === 'current' && step.requiredApproval;

          return (
            <div
              key={step.id}
              className={`${styles.workflowStep} ${styles[status]}`}
            >
              {/* Główny wiersz kroku */}
              <div
                className={styles.stepHeader}
                onClick={() => setExpandedStep(isExpanded ? null : step.id)}
              >
                <div className={styles.stepMain}>
                  {getStepIcon(step.id)}
                  <div className={styles.stepInfo}>
                    <h3 className={styles.stepTitle}>{step.name}</h3>
                    <p className={styles.stepDescription}>
                      {step.shortDescription}
                    </p>
                  </div>
                  <div className={styles.stepMeta}>
                    <span className={styles.stepPhase}>{step.phase}</span>
                    <span className={styles.stepDuration}>
                      {step.estimatedDuration}
                    </span>
                  </div>
                </div>
                <div className={styles.stepToggle}>
                  {isExpanded ? (
                    <ChevronUp size={20} />
                  ) : (
                    <ChevronDown size={20} />
                  )}
                </div>
              </div>

              {/* Rozszerzone detale kroku */}
              {isExpanded && (
                <div className={styles.stepDetails}>
                  <div className={styles.stepDescription}>
                    <p>{step.description}</p>
                  </div>

                  {/* Przypisani agenci */}
                  <div className={styles.stepAgents}>
                    <h4 className={styles.agentsTitle}>
                      <Users size={16} />
                      Przypisani agenci
                    </h4>
                    <div className={styles.agentsList}>
                      {step.agentTypes.map(agentType => (
                        <div key={agentType} className={styles.agentItem}>
                          <div className={styles.agentInfo}>
                            <span className={styles.agentName}>
                              {agentType}
                            </span>
                            {renderAgentStatus(agentType)}
                          </div>
                          {renderAgentControls(agentType)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dostarczalne elementy */}
                  <div className={styles.stepDeliverables}>
                    <h4 className={styles.deliverablesTitle}>
                      Elementy do dostarczenia
                    </h4>
                    <ul className={styles.deliverablesList}>
                      {step.deliverables.map((deliverable, idx) => (
                        <li key={idx} className={styles.deliverableItem}>
                          {deliverable}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Kryteria akceptacji */}
                  {step.approvalCriteria.length > 0 && (
                    <div className={styles.stepCriteria}>
                      <h4 className={styles.criteriaTitle}>
                        Kryteria akceptacji
                      </h4>
                      <ul className={styles.criteriaList}>
                        {step.approvalCriteria.map((criteria, idx) => (
                          <li key={idx} className={styles.criteriaItem}>
                            {criteria}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Przyciski akcji dla kroków wymagających zatwierdzenia */}
                  {isWaitingApproval && (
                    <div className={styles.stepActions}>
                      <div className={styles.approvalMessage}>
                        <AlertCircle size={16} />
                        <span>
                          Ten krok wymaga Twojego zatwierdzenia przed
                          kontynuacją
                        </span>
                      </div>
                      <div className={styles.approvalButtons}>
                        <button
                          className={styles.approveBtn}
                          onClick={() => onStepApprove?.(step.id)}
                        >
                          ✅ Zatwierdź i kontynuuj
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => {
                            const reason = prompt('Podaj powód odrzucenia:');
                            if (reason) onStepReject?.(step.id, reason);
                          }}
                        >
                          ❌ Wymaga poprawek
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Connector do następnego kroku */}
              {index < MICROSOFT_SDL_WORKFLOW.length - 1 && (
                <div className={styles.stepConnector}>
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
