/**
 * Enhanced Task Management Section Component
 *
 * Displays comprehensive task information including:
 * - Task validation status
 * - Agent assignments and handoffs
 * - Collaborative task progress
 * - Real-time task updates
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  ArrowRight,
  AlertTriangle,
  Zap,
  TrendingUp,
  FileCheck,
  UserCheck,
} from 'lucide-react';
import styles from '../styles/enhanced-task-section.module.css';

interface TaskAgent {
  id: string;
  name: string;
  displayName: string;
  avatar?: string;
  color: string;
}

interface CollaborativeTask {
  taskId: string;
  agentChain: AgentChainLink[];
  currentAgentIndex: number;
  overallProgress: number;
  collaborationStatus: 'pending' | 'in-progress' | 'completed' | 'blocked';
}

interface AgentChainLink {
  agentId: string;
  agentType: string;
  role: string;
  sequence: number;
  estimatedTime: number;
  status:
    | 'pending'
    | 'assigned'
    | 'in-progress'
    | 'completed'
    | 'blocked'
    | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  actualTime?: number;
  handoffNotes?: string;
}

interface TaskDetails {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  progress: number;
  estimatedTime?: number;
  actualTime?: number;
  assignedAgent?: TaskAgent;
  isCollaborative: boolean;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface TaskSectionProps {
  approvalId: string;
  stepName?: string;
  onTaskAction?: (taskId: string, action: string) => void;
}

export default function EnhancedTaskSection({
  approvalId,
  onTaskAction,
}: TaskSectionProps) {
  const [taskStatus, setTaskStatus] = useState<{
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    blockedTasks: number;
    collaborativeTasks: number;
    taskDetails: TaskDetails[];
  } | null>(null);

  const [collaborativeTasks, setCollaborativeTasks] = useState<
    CollaborativeTask[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/task-management/step-status/${approvalId}`
      );
      const data = await response.json();

      if (data.success) {
        setTaskStatus(data.data);

        // Fetch collaborative task details
        const collaborativeTaskIds = data.data.taskDetails
          .filter((task: TaskDetails) => task.isCollaborative)
          .map((task: TaskDetails) => task.id);

        if (collaborativeTaskIds.length > 0) {
          const collabTasks = await Promise.all(
            collaborativeTaskIds.map(async (taskId: string) => {
              const collabResponse = await fetch(
                `/api/task-management/collaboration-status/${taskId}`
              );
              const collabData = await collabResponse.json();
              return collabData.success ? collabData.data : null;
            })
          );
          setCollaborativeTasks(collabTasks.filter(Boolean));
        }
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Error fetching task status:', error);
      setError('Failed to load task information');
    } finally {
      setLoading(false);
    }
  }, [approvalId]);

  useEffect(() => {
    fetchTaskStatus();
  }, [fetchTaskStatus]);

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={styles.statusCompleted} />;
      case 'in_progress':
        return <Clock className={styles.statusInProgress} />;
      case 'blocked':
        return <AlertCircle className={styles.statusBlocked} />;
      case 'pending':
        return <AlertTriangle className={styles.statusPending} />;
      default:
        return <Clock className={styles.statusPending} />;
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleTaskAction = (taskId: string, action: string) => {
    onTaskAction?.(taskId, action);
    // Refresh task status after action
    setTimeout(fetchTaskStatus, 1000);
  };

  if (loading) {
    return (
      <div className={styles.taskSection}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner} />
          <p>Ładowanie zadań...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.taskSection}>
        <div className={styles.errorContainer}>
          <AlertCircle size={24} />
          <p>{error}</p>
          <button onClick={fetchTaskStatus} className={styles.retryButton}>
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  if (!taskStatus) {
    return (
      <div className={styles.taskSection}>
        <p>Brak danych o zadaniach</p>
      </div>
    );
  }

  return (
    <div className={styles.taskSection}>
      {/* Task Overview */}
      <div className={styles.taskOverview}>
        <h3 className={styles.sectionTitle}>
          <FileCheck size={18} />
          Zarządzanie Zadaniami ({taskStatus.totalTasks})
        </h3>

        <div className={styles.taskStats}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <CheckCircle className={styles.iconCompleted} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>
                {taskStatus.completedTasks}
              </div>
              <div className={styles.statLabel}>Ukończone</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <Clock className={styles.iconInProgress} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>
                {taskStatus.inProgressTasks}
              </div>
              <div className={styles.statLabel}>W trakcie</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <AlertTriangle className={styles.iconPending} />
            </div>
            <div className={styles.statInfo}>
              <div className={styles.statNumber}>{taskStatus.pendingTasks}</div>
              <div className={styles.statLabel}>Oczekujące</div>
            </div>
          </div>

          {taskStatus.collaborativeTasks > 0 && (
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Users className={styles.iconCollaborative} />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statNumber}>
                  {taskStatus.collaborativeTasks}
                </div>
                <div className={styles.statLabel}>Współdzielone</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className={styles.taskList}>
        {taskStatus.taskDetails.map(task => (
          <div key={task.id} className={styles.taskCard}>
            <div className={styles.taskHeader}>
              <div className={styles.taskTitleSection}>
                <div className={styles.taskTitle}>{task.title}</div>
                <div className={styles.taskMeta}>
                  <span
                    className={`${styles.taskPriority} ${
                      styles[
                        `priority${
                          task.priority.charAt(0).toUpperCase() +
                          task.priority.slice(1)
                        }`
                      ]
                    }`}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                  <span className={styles.taskType}>{task.type}</span>
                  {task.isCollaborative && (
                    <span className={styles.collaborativeTag}>
                      <Users size={12} />
                      WSPÓŁDZIELONE
                    </span>
                  )}
                </div>
              </div>
              <div className={styles.taskStatus}>
                {getTaskStatusIcon(task.status)}
                <span className={styles.taskStatusText}>
                  {task.status === 'completed' && 'Ukończone'}
                  {task.status === 'in_progress' && 'W trakcie'}
                  {task.status === 'pending' && 'Oczekuje'}
                  {task.status === 'blocked' && 'Zablokowane'}
                </span>
              </div>
            </div>

            <div className={styles.taskBody}>
              <div className={styles.taskDescription}>{task.description}</div>

              {/* Progress Bar */}
              <div className={styles.taskProgress}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    data-progress={task.progress}
                  />
                </div>
                <span className={styles.progressText}>{task.progress}%</span>
              </div>

              {/* Agent Assignment */}
              {task.assignedAgent && (
                <div className={styles.taskAgent}>
                  <div className={styles.agentInfo}>
                    <div
                      className={styles.agentAvatar}
                      data-agent-color={task.assignedAgent.color}
                    >
                      {task.assignedAgent.displayName.charAt(0)}
                    </div>
                    <div className={styles.agentDetails}>
                      <div className={styles.agentName}>
                        {task.assignedAgent.displayName}
                      </div>
                      <div className={styles.agentRole}>Przypisany agent</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Information */}
              <div className={styles.taskTiming}>
                <div className={styles.timeInfo}>
                  <span className={styles.timeLabel}>Szacowany czas:</span>
                  <span className={styles.timeValue}>
                    {formatTime(task.estimatedTime)}
                  </span>
                </div>
                {task.actualTime && (
                  <div className={styles.timeInfo}>
                    <span className={styles.timeLabel}>Rzeczywisty czas:</span>
                    <span className={styles.timeValue}>
                      {formatTime(task.actualTime)}
                    </span>
                  </div>
                )}
              </div>

              {/* Task Actions */}
              <div className={styles.taskActions}>
                {task.status === 'blocked' && (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleTaskAction(task.id, 'reassign')}
                  >
                    <Zap size={14} />
                    Przypisz ponownie
                  </button>
                )}
                {task.status === 'pending' && (
                  <button
                    className={styles.actionButton}
                    onClick={() => handleTaskAction(task.id, 'priority-boost')}
                  >
                    <TrendingUp size={14} />
                    Zwiększ priorytet
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collaborative Tasks Section */}
      {collaborativeTasks.length > 0 && (
        <div className={styles.collaborativeSection}>
          <h4 className={styles.collaborativeTitle}>
            <Users size={16} />
            Zadania współdzielone ({collaborativeTasks.length})
          </h4>

          {collaborativeTasks.map(collabTask => (
            <div key={collabTask.taskId} className={styles.collaborativeTask}>
              <div className={styles.collaborativeHeader}>
                <div className={styles.collaborativeProgress}>
                  <div className={styles.progressLabel}>
                    Postęp ogólny: {collabTask.overallProgress}%
                  </div>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      data-progress={collabTask.overallProgress}
                    />
                  </div>
                </div>
                <div className={styles.collaborativeStatus}>
                  Status: {collabTask.collaborationStatus}
                </div>
              </div>

              <div className={styles.agentChain}>
                {collabTask.agentChain.map((link, index) => (
                  <div key={link.sequence} className={styles.chainLink}>
                    <div
                      className={`${styles.chainStep} ${styles[link.status]}`}
                    >
                      <div className={styles.stepNumber}>{index + 1}</div>
                      <div className={styles.stepInfo}>
                        <div className={styles.stepRole}>{link.role}</div>
                        <div className={styles.stepType}>{link.agentType}</div>
                        <div className={styles.stepTime}>
                          {formatTime(link.actualTime || link.estimatedTime)}
                        </div>
                      </div>
                      <div className={styles.stepStatus}>
                        {getTaskStatusIcon(link.status)}
                      </div>
                    </div>
                    {index < collabTask.agentChain.length - 1 && (
                      <ArrowRight className={styles.chainArrow} />
                    )}
                  </div>
                ))}
              </div>

              {/* Current Agent Highlight */}
              {collabTask.currentAgentIndex < collabTask.agentChain.length && (
                <div className={styles.currentAgentInfo}>
                  <UserCheck size={16} />
                  <span>
                    Aktualnie pracuje:{' '}
                    {collabTask.agentChain[collabTask.currentAgentIndex].role}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
