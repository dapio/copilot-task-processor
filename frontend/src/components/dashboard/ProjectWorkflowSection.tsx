import React, { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Settings,
  MoreVertical,
  RotateCcw,
} from 'lucide-react';
import styles from '../../styles/project-details-dashboard.module.css';
import type { WorkflowData } from '../../types/dashboard.types';

interface ProjectWorkflowSectionProps {
  projectWorkflow: WorkflowData | null;
  onWorkflowAction?: (
    action: 'start' | 'pause' | 'resume' | 'restart' | 'configure'
  ) => void;
  onStepAction?: (stepId: string, action: string) => void;
  loading?: boolean;
}

export const ProjectWorkflowSection: React.FC<ProjectWorkflowSectionProps> = ({
  projectWorkflow,
  onWorkflowAction,
  onStepAction,
  loading = false,
}) => {
  const [stepOptionsOpen, setStepOptionsOpen] = useState<string | null>(null);

  const handleStepOptions = (stepId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStepOptionsOpen(stepOptionsOpen === stepId ? null : stepId);
  };

  const handleStepOptionAction = (stepId: string, action: string) => {
    onStepAction?.(stepId, action);
    setStepOptionsOpen(null);
  };
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className={styles.statusCompleted} />;
      case 'running':
        return <Play size={20} className={styles.statusActive} />;
      case 'pending':
        return <Clock size={20} className={styles.statusPending} />;
      case 'failed':
        return <AlertCircle size={20} className={styles.statusError} />;
      default:
        return <Clock size={20} />;
    }
  };

  const getWorkflowProgress = () => {
    if (!projectWorkflow?.steps) return 0;
    const completedSteps = projectWorkflow.steps.filter(
      step => step.status === 'completed'
    ).length;
    return Math.round((completedSteps / projectWorkflow.steps.length) * 100);
  };

  const getCurrentStepIndex = () => {
    if (!projectWorkflow?.steps) return -1;
    return projectWorkflow.steps.findIndex(step => step.status === 'running');
  };

  const canStartWorkflow = () => {
    return (
      projectWorkflow?.status === 'paused' ||
      projectWorkflow?.status === 'failed'
    );
  };

  const canPauseWorkflow = () => {
    return projectWorkflow?.status === 'running';
  };

  if (!projectWorkflow) {
    return (
      <div className={styles.workflowSection}>
        <div className={styles.emptyState}>
          <Settings size={48} />
          <h3>Brak workflow</h3>
          <p>Projekt nie ma przypisanego workflow</p>
          <button
            className={styles.createButton}
            onClick={() => onWorkflowAction?.('configure')}
          >
            Skonfiguruj workflow
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.workflowSection}>
      <div className={styles.workflowHeader}>
        <div className={styles.workflowInfo}>
          <h2>{projectWorkflow.name}</h2>
          <span className={styles.workflowType}>{projectWorkflow.type}</span>
          <span
            className={`${styles.workflowStatus} ${
              styles[projectWorkflow.status]
            }`}
          >
            {projectWorkflow.status}
          </span>
        </div>

        <div className={styles.workflowActions}>
          {canStartWorkflow() && (
            <button
              onClick={() => onWorkflowAction?.('start')}
              className={styles.startButton}
              disabled={loading}
              title="Uruchom workflow"
            >
              <Play size={16} />
              Uruchom
            </button>
          )}

          {canPauseWorkflow() && (
            <button
              onClick={() => onWorkflowAction?.('pause')}
              className={styles.pauseButton}
              disabled={loading}
              title="Wstrzymaj workflow"
            >
              <Pause size={16} />
              Wstrzymaj
            </button>
          )}

          <button
            onClick={() => onWorkflowAction?.('restart')}
            className={styles.restartButton}
            disabled={loading}
            title="Uruchom ponownie"
          >
            <RotateCcw size={16} />
            Restart
          </button>

          <button
            onClick={() => onWorkflowAction?.('configure')}
            className={styles.configButton}
            disabled={loading}
            title="Konfiguracja workflow"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <div className={styles.workflowProgress}>
        <div className={styles.progressInfo}>
          <span>Postęp workflow: {getWorkflowProgress()}%</span>
          <span>
            Krok {getCurrentStepIndex() + 1} z {projectWorkflow.steps.length}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            data-progress={getWorkflowProgress()}
          />
        </div>
      </div>

      <div className={styles.workflowSteps}>
        {projectWorkflow.steps.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.workflowStep} ${styles[step.status]} ${
              expandedStep === step.id ? styles.expanded : ''
            }`}
          >
            <div
              className={styles.stepHeader}
              onClick={() =>
                setExpandedStep(expandedStep === step.id ? null : step.id)
              }
            >
              <div className={styles.stepIndicator}>
                <span className={styles.stepNumber}>{index + 1}</span>
                {index < projectWorkflow.steps.length - 1 && (
                  <div
                    className={`${styles.stepConnector} ${
                      projectWorkflow.steps[index + 1].status !== 'pending'
                        ? styles.completed
                        : ''
                    }`}
                  >
                    <ArrowRight size={16} />
                  </div>
                )}
              </div>

              <div className={styles.stepInfo}>
                <div className={styles.stepTitle}>
                  {getStepStatusIcon(step.status)}
                  <h4>{step.name}</h4>
                </div>
                <p className={styles.stepDescription}>{step.description}</p>
                {step.assignedAgent && (
                  <span className={styles.assignedAgent}>
                    Przypisany: {step.assignedAgent}
                  </span>
                )}
              </div>

              <div className={styles.stepActions}>
                <button
                  className={styles.stepOptionsButton}
                  onClick={e => {
                    e.stopPropagation();
                    handleStepOptions(step.id, e);
                  }}
                  title="Opcje kroku"
                >
                  <MoreVertical size={16} />
                </button>

                {stepOptionsOpen === step.id && (
                  <div className={styles.stepOptionsMenu}>
                    <button
                      onClick={() => handleStepOptionAction(step.id, 'restart')}
                    >
                      <RotateCcw size={14} /> Uruchom ponownie
                    </button>
                    <button
                      onClick={() => handleStepOptionAction(step.id, 'skip')}
                    >
                      <ArrowRight size={14} /> Pomiń krok
                    </button>
                    <button
                      onClick={() =>
                        handleStepOptionAction(step.id, 'configure')
                      }
                    >
                      <Settings size={14} /> Konfiguruj
                    </button>
                    <button
                      onClick={() =>
                        handleStepOptionAction(step.id, 'reassign')
                      }
                    >
                      Przypisz ponownie
                    </button>
                  </div>
                )}
              </div>
            </div>

            {expandedStep === step.id && (
              <div className={styles.stepDetails}>
                <div className={styles.stepMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Status</span>
                    <span className={styles.metricValue}>{step.status}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Agent</span>
                    <span className={styles.metricValue}>
                      {step.assignedAgent || 'Brak'}
                    </span>
                  </div>
                </div>

                <div className={styles.stepDetailActions}>
                  {step.status === 'pending' && (
                    <button
                      onClick={() => onStepAction?.(step.id, 'start')}
                      className={styles.startStepButton}
                    >
                      Uruchom krok
                    </button>
                  )}

                  {step.status === 'running' && (
                    <button
                      onClick={() => onStepAction?.(step.id, 'pause')}
                      className={styles.pauseStepButton}
                    >
                      Wstrzymaj krok
                    </button>
                  )}

                  {step.status === 'failed' && (
                    <button
                      onClick={() => onStepAction?.(step.id, 'retry')}
                      className={styles.retryStepButton}
                    >
                      Ponów krok
                    </button>
                  )}

                  <button
                    onClick={() => onStepAction?.(step.id, 'configure')}
                    className={styles.configStepButton}
                  >
                    Konfiguruj
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
