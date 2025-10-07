import React, { useMemo } from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import styles from './TaskListView.module.css';

export interface Task {
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
  assignedAgentId?: string;
  category?: 'setup' | 'development' | 'testing' | 'deployment';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface TaskListViewProps {
  tasks: Task[];
  onTaskSelect?: (task: Task) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  isLoading?: boolean;
}

const getStatusIcon = (status: Task['status']) => {
  switch (status) {
    case 'completed':
      return React.createElement(CheckCircle, { size: 16, color: '#10B981' });
    case 'failed':
      return React.createElement(AlertCircle, { size: 16, color: '#EF4444' });
    case 'in_progress':
      return React.createElement(Clock, { size: 16, color: '#3B82F6' });
    default:
      return React.createElement(Clock, { size: 16, color: '#6B7280' });
  }
};

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskSelect,
  isLoading = false,
}) => {
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      // Sort by priority first, then by updated date
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [tasks]);

  if (isLoading) {
    return <div className={styles.loadingContainer}>Loading tasks...</div>;
  }

  if (tasks.length === 0 && !isLoading) {
    return (
      <div className={styles.emptyState}>
        <p>No tasks found.</p>
        <p>Create a new task to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableHeader}>
        <div>Task</div>
        <div>Status</div>
        <div>Priority</div>
        <div>Hours</div>
        <div>Updated</div>
      </div>

      {sortedTasks.map(task => (
        <div
          key={task.id}
          onClick={() => onTaskSelect?.(task)}
          className={`${styles.taskRow} ${
            onTaskSelect ? styles.clickable : ''
          }`}
        >
          <div>
            <h4 className={styles.taskTitle}>{task.title}</h4>
            {task.description && (
              <p className={styles.taskDescription}>{task.description}</p>
            )}
            {task.tags && task.tags.length > 0 && (
              <div className={styles.tagsContainer}>
                {task.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.statusContainer}>
            {getStatusIcon(task.status)}
            <span className={styles.statusText}>
              {task.status.replace('_', ' ')}
            </span>
          </div>

          <div className={styles.priorityContainer}>
            <span
              className={`${styles.priorityBadge} ${styles[task.priority]}`}
            >
              {task.priority}
            </span>
          </div>

          <div className={styles.hoursField}>
            {task.estimatedHours ? `${task.estimatedHours}h` : '-'}
          </div>

          <div className={styles.dateField}>
            {formatDate(new Date(task.updatedAt))}
          </div>
        </div>
      ))}
    </div>
  );
};

const MemoizedTaskListView = React.memo(TaskListView);
export default MemoizedTaskListView;
