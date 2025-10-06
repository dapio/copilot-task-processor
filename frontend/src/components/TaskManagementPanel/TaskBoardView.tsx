/**
 * Task Board View - Kanban-style board for tasks
 */

import React from 'react';
import { ClipboardList, Clock, Calendar, Link2, RotateCw } from 'lucide-react';
import styles from './TaskBoardView.module.css';

interface Task {
  id: string;
  title: string;
  description?: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'review'
    | 'testing'
    | 'completed'
    | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string;
  assignedAgentId?: string;
  createdAt: Date;
  updatedAt: Date;
  jiraIntegration?: {
    jiraKey: string;
    syncStatus: 'active' | 'paused' | 'error';
    lastSyncAt: Date;
  };
}

interface StatusConfig {
  [key: string]: {
    label: string;
    color: string;
    icon: React.ComponentType<{ size?: number }>;
  };
}

interface PriorityConfig {
  [key: string]: {
    label: string;
    color: string;
    icon: React.ComponentType<{ size?: number }>;
  };
}

interface TaskBoardViewProps {
  tasks: Task[];
  statusConfig: StatusConfig;
  priorityConfig: PriorityConfig;
  onStatusUpdate: (taskId: string, newStatus: string) => void;
  onSyncTask: (taskId: string) => void;
}

const TaskBoardView: React.FC<TaskBoardViewProps> = ({
  tasks,
  statusConfig,
  priorityConfig,
  onStatusUpdate,
  onSyncTask,
}) => {
  // Group tasks by status
  const tasksByStatus = Object.keys(statusConfig).reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusUpdate(taskId, targetStatus);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pl-PL', {
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + '...'
      : text;
  };

  return (
    <div className={styles.container}>
      <div className={styles.board}>
        {Object.entries(statusConfig).map(([status, config]) => (
          <div
            key={status}
            className={styles.column}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div
              className={`${styles.columnHeader} ${
                styles[
                  `columnHeader${
                    status.charAt(0).toUpperCase() + status.slice(1)
                  }`
                ]
              }`}
            >
              <div className={styles.columnTitle}>
                <span className={styles.columnIcon}>
                  {React.createElement(config.icon, { size: 16 })}
                </span>
                <span className={styles.columnLabel}>{config.label}</span>
                <span className={styles.taskCount}>
                  ({tasksByStatus[status]?.length || 0})
                </span>
              </div>
            </div>

            {/* Tasks */}
            <div className={styles.columnContent}>
              {tasksByStatus[status]?.map(task => (
                <div
                  key={task.id}
                  className={styles.taskCard}
                  draggable
                  onDragStart={e => handleDragStart(e, task)}
                  aria-label={`Task: ${task.title}`}
                >
                  {/* Task Header */}
                  <div className={styles.taskHeader}>
                    <div className={styles.taskPriority}>
                      <span
                        className={`${styles.priorityDot} ${
                          styles[
                            `priorityDot${
                              task.priority.charAt(0).toUpperCase() +
                              task.priority.slice(1)
                            }`
                          ]
                        }`}
                        title={`Priority: ${
                          priorityConfig[task.priority]?.label
                        }`}
                        aria-label={`Priority: ${
                          priorityConfig[task.priority]?.label
                        }`}
                      />
                    </div>

                    {task.jiraIntegration && (
                      <div className={styles.jiraIndicator}>
                        <span
                          className={`${styles.jiraIcon} ${
                            task.jiraIntegration.syncStatus === 'active'
                              ? styles.synced
                              : task.jiraIntegration.syncStatus === 'error'
                              ? styles.error
                              : styles.paused
                          }`}
                          title={`Jira: ${task.jiraIntegration.jiraKey} (${task.jiraIntegration.syncStatus})`}
                        >
                          <Link2 size={12} />
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Task Content */}
                  <div className={styles.taskContent}>
                    <h4 className={styles.taskTitle}>
                      {truncateText(task.title, 80)}
                    </h4>

                    {task.description && (
                      <p className={styles.taskDescription}>
                        {truncateText(task.description, 120)}
                      </p>
                    )}
                  </div>

                  {/* Task Footer */}
                  <div className={styles.taskFooter}>
                    <div className={styles.taskMeta}>
                      <span
                        className={styles.taskDate}
                        title={`Created: ${formatDate(task.createdAt)}`}
                      >
                        <Calendar size={12} /> {formatDate(task.createdAt)}
                      </span>

                      {task.estimatedHours && (
                        <span
                          className={styles.taskHours}
                          title={`Estimated: ${task.estimatedHours}h`}
                        >
                          <Clock size={12} /> {task.estimatedHours}h
                        </span>
                      )}
                    </div>

                    <div className={styles.taskActions}>
                      {task.jiraIntegration && (
                        <button
                          onClick={() => onSyncTask(task.id)}
                          className={styles.syncButton}
                          title="Sync with Jira"
                          aria-label="Sync task with Jira"
                        >
                          <RotateCw size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Jira Key Badge */}
                  {task.jiraIntegration && (
                    <div className={styles.jiraKey}>
                      {task.jiraIntegration.jiraKey}
                    </div>
                  )}
                </div>
              ))}

              {/* Empty State */}
              {(!tasksByStatus[status] ||
                tasksByStatus[status].length === 0) && (
                <div className={styles.emptyColumn}>
                  <span className={styles.emptyIcon}>
                    <ClipboardList size={24} color="#9CA3AF" />
                  </span>
                  <span className={styles.emptyText}>No tasks</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoardView;
