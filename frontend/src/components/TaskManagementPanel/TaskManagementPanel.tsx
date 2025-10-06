/**
 * Task Management Panel - Main dashboard for task operations
 * Includes task board, filters, and Jira sync controls
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Result, MLError } from '../../types/common';
import TaskFiltersComponent from './TaskFilters';
import TaskBoardView from './TaskBoardView';
import TaskListView from './TaskListView';
import styles from './TaskManagementPanel.module.css';
import {
  ClipboardList,
  Zap,
  Eye,
  TestTube,
  CheckCircle,
  XCircle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Flame,
  AlertTriangle,
  Grid3x3,
  List,
  RefreshCw,
  Link,
  BarChart3,
  Link2,
  Timer,
} from 'lucide-react';

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
  category?: 'setup' | 'development' | 'testing' | 'deployment';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  jiraIntegration?: {
    jiraKey: string;
    syncStatus: 'active' | 'paused' | 'error';
    lastSyncAt: Date;
  };
}

interface SyncStats {
  synced: number;
  pending: number;
  failed: number;
  total: number;
}

interface TaskFilters {
  status: string[];
  priority: string[];
  search: string;
  assignedAgent?: string;
  showJiraOnly: boolean;
}

const TaskManagementPanel: React.FC<{ projectId?: string }> = ({
  projectId,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [filters, setFilters] = useState<TaskFilters>({
    status: [],
    priority: [],
    search: '',
    showJiraOnly: false,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Status configuration
  const statusConfig = {
    pending: { label: 'To Do', color: '#6B7280', icon: ClipboardList },
    in_progress: { label: 'In Progress', color: '#3B82F6', icon: Zap },
    review: { label: 'Review', color: '#F59E0B', icon: Eye },
    testing: { label: 'Testing', color: '#8B5CF6', icon: TestTube },
    completed: { label: 'Done', color: '#10B981', icon: CheckCircle },
    failed: { label: 'Failed', color: '#EF4444', icon: XCircle },
  };

  const priorityConfig = {
    low: { label: 'Low', color: '#6B7280', icon: ArrowDown },
    medium: { label: 'Medium', color: '#F59E0B', icon: ArrowRight },
    high: { label: 'High', color: '#EF4444', icon: ArrowUp },
    critical: { label: 'Critical', color: '#DC2626', icon: Flame },
  };

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = projectId
        ? `/api/tasks?projectId=${projectId}`
        : '/api/tasks';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: Result<Task[], MLError> = await response.json();

      if (result.success && result.data) {
        setTasks(result.data);
      } else {
        setError(result.error?.message || 'Błąd pobierania zadań');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Fetch sync stats
  const fetchSyncStats = useCallback(async () => {
    if (!projectId) return;

    try {
      const response = await fetch(
        `/api/tasks/sync/stats?projectId=${projectId}`
      );

      if (!response.ok) return;

      const result: Result<SyncStats, MLError> = await response.json();

      if (result.success && result.data) {
        setSyncStats(result.data);
      }
    } catch (err) {
      console.warn('Failed to fetch sync stats:', err);
    }
  }, [projectId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...tasks];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        task =>
          task.title.toLowerCase().includes(searchLower) ||
          (task.description &&
            task.description.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (filters.status.length > 0) {
      filtered = filtered.filter(task => filters.status.includes(task.status));
    }

    // Priority filter
    if (filters.priority.length > 0) {
      filtered = filtered.filter(task =>
        filters.priority.includes(task.priority)
      );
    }

    // Jira filter
    if (filters.showJiraOnly) {
      filtered = filtered.filter(task => task.jiraIntegration);
    }

    setFilteredTasks(filtered);
  }, [tasks, filters]);

  // Initial data fetch
  useEffect(() => {
    fetchTasks();
    fetchSyncStats();
  }, [fetchTasks, fetchSyncStats]);

  // Sync actions
  const handleSyncTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchTasks();
        await fetchSyncStats();
      }
    } catch (err) {
      console.error('Sync failed:', err);
    }
  };

  const handleBatchSync = async () => {
    if (!projectId) return;

    setSyncing(true);

    try {
      const response = await fetch(`/api/tasks/sync/project/${projectId}`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchTasks();
        await fetchSyncStats();
      }
    } catch (err) {
      setError(
        `Batch sync failed: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleForceSync = async () => {
    setSyncing(true);

    try {
      const response = await fetch('/api/tasks/sync/force', { method: 'POST' });

      if (response.ok) {
        await fetchTasks();
        await fetchSyncStats();
      }
    } catch (err) {
      setError(
        `Force sync failed: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    } finally {
      setSyncing(false);
    }
  };

  // Task status update
  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading} role="status" aria-label="Loading tasks">
        <div className={styles.loadingSkeleton}>
          <div className={styles.skeletonHeader}></div>
          <div className={styles.skeletonGrid}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error} role="alert">
        <h3>Failed to load tasks</h3>
        <p>{error}</p>
        <button
          onClick={fetchTasks}
          className={styles.retryButton}
          aria-label="Retry loading tasks"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2>Task Management</h2>
          {syncStats && (
            <div className={styles.statsChips}>
              <span
                className={styles.statChip}
                title={`${syncStats.total} total tasks`}
              >
                <BarChart3 size={14} /> {syncStats.total} tasks
              </span>
              <span
                className={styles.statChip}
                title={`${syncStats.synced} synced with Jira`}
              >
                <Link2 size={14} /> {syncStats.synced} synced
              </span>
              {syncStats.pending > 0 && (
                <span
                  className={styles.statChip}
                  title={`${syncStats.pending} pending sync`}
                >
                  <Timer size={14} /> {syncStats.pending} pending
                </span>
              )}
              {syncStats.failed > 0 && (
                <span
                  className={styles.statChip}
                  title={`${syncStats.failed} sync failed`}
                >
                  <AlertTriangle size={14} /> {syncStats.failed} failed
                </span>
              )}
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <div className={styles.viewToggle}>
            <button
              onClick={() => setViewMode('board')}
              className={`${styles.viewButton} ${
                viewMode === 'board' ? styles.active : ''
              }`}
              aria-label="Board view"
            >
              <Grid3x3 size={16} /> Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`${styles.viewButton} ${
                viewMode === 'list' ? styles.active : ''
              }`}
              aria-label="List view"
            >
              <List size={16} /> List
            </button>
          </div>

          <div className={styles.syncActions}>
            {projectId && (
              <button
                onClick={handleBatchSync}
                disabled={syncing}
                className={styles.syncButton}
                title="Sync all project tasks with Jira"
              >
                {syncing ? <RefreshCw size={16} /> : <Link size={16} />} Sync
                Project
              </button>
            )}

            <button
              onClick={handleForceSync}
              disabled={syncing}
              className={styles.forceButton}
              title="Force sync all tasks"
            >
              {syncing ? <RefreshCw size={16} /> : <Zap size={16} />} Force Sync
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <TaskFiltersComponent
        onFilterChange={criteria => {
          setFilters({
            status: criteria.status || [],
            priority: criteria.priority || [],
            search: criteria.search || '',
            assignedAgent: criteria.assignedAgentId?.[0],
            showJiraOnly: filters.showJiraOnly,
          });
        }}
        initialFilters={{
          search: filters.search,
          status: filters.status,
          priority: filters.priority,
          assignedAgentId: filters.assignedAgent ? [filters.assignedAgent] : [],
        }}
      />

      {/* Content */}
      {viewMode === 'board' ? (
        <TaskBoardView
          tasks={filteredTasks}
          statusConfig={statusConfig}
          priorityConfig={priorityConfig}
          onStatusUpdate={handleStatusUpdate}
          onSyncTask={handleSyncTask}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          onTaskSelect={task => console.log('Selected task:', task)}
        />
      )}
    </div>
  );
};

export default TaskManagementPanel;
