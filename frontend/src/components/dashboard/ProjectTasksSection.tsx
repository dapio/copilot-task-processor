import React from 'react';
import { CheckCircle, Clock, AlertCircle, Play, User } from 'lucide-react';
import styles from '../../styles/project-details-dashboard.module.css';
import type { TaskData } from '../../types/dashboard.types';

interface ProjectTasksSectionProps {
  projectTasks: TaskData[];
  onTaskSelect?: (taskId: string) => void;
  onTaskStatusChange?: (taskId: string, newStatus: string) => void;
}

export const ProjectTasksSection: React.FC<ProjectTasksSectionProps> = ({
  projectTasks,
  onTaskSelect,
  onTaskStatusChange,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return React.createElement(CheckCircle, { size: 16, className: styles.statusCompleted });
      case 'in-progress':
        return React.createElement(Play, { size: 16, className: styles.statusActive });
      case 'todo':
        return React.createElement(Clock, { size: 16, className: styles.statusPending });
      case 'blocked':
        return React.createElement(AlertCircle, { size: 16, className: styles.statusCancelled });
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

  const getTaskStatusStats = () => {
    const stats = projectTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: projectTasks.length,
      done: stats.done || 0,
      inProgress: stats['in-progress'] || 0,
      todo: stats.todo || 0,
      blocked: stats.blocked || 0,
    };
  };

  const taskStats = getTaskStatusStats();

  return (
    <div className={styles.tasksSection}>
      <div className={styles.sectionHeader}>
        <h2>Zadania projektu</h2>
        <div className={styles.taskStats}>
          <span className={styles.stat}>
            <span className={styles.statValue}>{taskStats.total}</span>
            <span className={styles.statLabel}>Wszystkie</span>
          </span>
          <span className={styles.stat}>
            <span className={`${styles.statValue} ${styles.completed}`}>
              {taskStats.done}
            </span>
            <span className={styles.statLabel}>Ukończone</span>
          </span>
          <span className={styles.stat}>
            <span className={`${styles.statValue} ${styles.active}`}>
              {taskStats.inProgress}
            </span>
            <span className={styles.statLabel}>W toku</span>
          </span>
          <span className={styles.stat}>
            <span className={`${styles.statValue} ${styles.pending}`}>
              {taskStats.todo}
            </span>
            <span className={styles.statLabel}>Do zrobienia</span>
          </span>
          {taskStats.blocked > 0 && (
            <span className={styles.stat}>
              <span className={`${styles.statValue} ${styles.blocked}`}>
                {taskStats.blocked}
              </span>
              <span className={styles.statLabel}>Zablokowane</span>
            </span>
          )}
        </div>
      </div>

      {projectTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Brak zadań w tym projekcie</p>
          <button className={styles.addButton}>Dodaj pierwsze zadanie</button>
        </div>
      ) : (
        <div className={styles.tasksList}>
          {projectTasks.map(task => (
            <div
              key={task.id}
              className={`${styles.taskCard} ${styles[task.status]}`}
              onClick={() => onTaskSelect?.(task.id)}
            >
              <div className={styles.taskHeader}>
                <div className={styles.taskTitle}>
                  <span className={styles.taskStatus}>
                    {getStatusIcon(task.status)}
                  </span>
                  <h4>{task.title}</h4>
                  <span
                    className={`${styles.priority} ${
                      styles[getPriorityColor(task.priority)]
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
                <div className={styles.taskMeta}>
                  <span className={styles.taskId}>#{task.id.slice(-8)}</span>
                </div>
              </div>

              <div className={styles.taskBody}>
                <p className={styles.taskDescription}>{task.description}</p>

                <div className={styles.taskDetails}>
                  <div className={styles.taskInfo}>
                    <span>
                      <User size={14} /> {task.assignee || 'Nieprzypisane'}
                    </span>
                    <span>
                      Termin:{' '}
                      {task.dueDate ? formatDate(task.dueDate) : 'Brak terminu'}
                    </span>
                  </div>

                  <div className={styles.taskProgress}>
                    <div className={styles.progressInfo}>
                      <span>Postęp: {task.progress}%</span>
                      <span>
                        {task.actualHours || 0}h / {task.estimatedHours}h
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        data-progress={task.progress}
                      />
                    </div>
                  </div>
                </div>

                {task.dependencies && task.dependencies.length > 0 && (
                  <div className={styles.taskDependencies}>
                    <span>Zależności: {task.dependencies.length} zadań</span>
                  </div>
                )}
              </div>

              <div className={styles.taskActions}>
                <select
                  value={task.status}
                  onChange={e => {
                    e.stopPropagation();
                    onTaskStatusChange?.(task.id, e.target.value);
                  }}
                  className={styles.statusSelect}
                  title={`Zmień status zadania: ${task.title}`}
                  aria-label={`Status zadania: ${task.title}`}
                >
                  <option value="todo">Do zrobienia</option>
                  <option value="in-progress">W toku</option>
                  <option value="done">Ukończone</option>
                  <option value="blocked">Zablokowane</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
