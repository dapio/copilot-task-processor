import { useState, useEffect } from 'react';
import React from 'react';
import styles from '../styles/management-components.module.css';

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedAgent?: string;
  description: string;
  createdAt: Date;
  completedAt?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  dependencies: string[];
  tags: string[];
  progress: number; // 0-100
  results?: any;
  errorMessage?: string;
}

interface TaskManagementProps {
  projectId: string;
}

export default function TaskManagement({ projectId }: TaskManagementProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockData: Task[] = [
        {
          id: '1',
          name: 'Analiza dokumentów PDF',
          status: 'running',
          priority: 'high',
          assignedAgent: 'Document Processor',
          description:
            'Przetwarzanie i analiza zestawu dokumentów PDF w celu wyodrębnienia kluczowych informacji.',
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
          estimatedDuration: 45,
          dependencies: [],
          tags: ['PDF', 'Analysis', 'Documents'],
          progress: 65,
          results: null,
        },
        {
          id: '2',
          name: 'Przegląd kodu TypeScript',
          status: 'completed',
          priority: 'medium',
          assignedAgent: 'Code Analyzer',
          description:
            'Kompleksowa analiza jakości kodu TypeScript w projekcie frontend.',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          estimatedDuration: 30,
          actualDuration: 28,
          dependencies: [],
          tags: ['Code Review', 'TypeScript', 'Quality'],
          progress: 100,
          results: {
            issuesFound: 12,
            suggestions: 8,
            score: 85,
          },
        },
        {
          id: '3',
          name: 'Synchronizacja API',
          status: 'pending',
          priority: 'critical',
          assignedAgent: 'API Connector',
          description:
            'Synchronizacja danych z zewnętrznym API i aktualizacja lokalnej bazy danych.',
          createdAt: new Date(Date.now() - 30 * 60 * 1000),
          estimatedDuration: 60,
          dependencies: ['1'],
          tags: ['API', 'Sync', 'Database'],
          progress: 0,
        },
        {
          id: '4',
          name: 'Generowanie raportów',
          status: 'failed',
          priority: 'low',
          description:
            'Automatyczne generowanie raportów miesięcznych na podstawie zebranych danych.',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          estimatedDuration: 20,
          actualDuration: 5,
          dependencies: ['2'],
          tags: ['Reports', 'Monthly', 'Analytics'],
          progress: 25,
          errorMessage:
            'Błąd połączenia z bazą danych podczas generowania raportu',
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setTasks(mockData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    // TODO: Replace with actual API call
    const newTask: Task = {
      id: Date.now().toString(),
      name: taskData.name || 'Nowe zadanie',
      status: 'pending',
      priority: taskData.priority || 'medium',
      assignedAgent: taskData.assignedAgent,
      description: taskData.description || '',
      createdAt: new Date(),
      estimatedDuration: taskData.estimatedDuration || 30,
      dependencies: taskData.dependencies || [],
      tags: taskData.tags || [],
      progress: 0,
    };

    setTasks(prev => [newTask, ...prev]);
    setShowCreateModal(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zadanie?')) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
  };

  const handleExecuteTask = async (taskId: string) => {
    // Simulate task execution
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: 'running', progress: 10 } : task
      )
    );

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setTasks(prev =>
        prev.map(task => {
          if (task.id === taskId && task.status === 'running') {
            const newProgress = Math.min(
              task.progress + Math.random() * 20,
              100
            );
            return {
              ...task,
              progress: Math.round(newProgress),
              status: newProgress >= 100 ? 'completed' : 'running',
              completedAt: newProgress >= 100 ? new Date() : undefined,
              actualDuration:
                newProgress >= 100
                  ? task.estimatedDuration + Math.random() * 10 - 5
                  : undefined,
            };
          }
          return task;
        })
      );
    }, 2000);

    // Stop simulation after task completion
    setTimeout(() => {
      clearInterval(progressInterval);
    }, 15000);
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority =
      filterPriority === 'all' || task.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>📋</div>
        <p className={styles.loadingText}>Ładowanie zadań...</p>
      </div>
    );
  }

  return (
    <div className={styles.managementContainer}>
      {/* Header */}
      <div className={styles.managementHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Szukaj zadań..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          <div className={styles.filtersContainer}>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
              title="Filtruj według statusu"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="pending">Oczekujące</option>
              <option value="running">W trakcie</option>
              <option value="completed">Zakończone</option>
              <option value="failed">Nieudane</option>
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className={styles.filterSelect}
              title="Filtruj według priorytetu"
            >
              <option value="all">Wszystkie priorytety</option>
              <option value="critical">Krytyczny</option>
              <option value="high">Wysoki</option>
              <option value="medium">Średni</option>
              <option value="low">Niski</option>
            </select>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statsContainer}>
            <div className={styles.statBadge} data-status="running">
              <span className={styles.statNumber}>
                {tasks.filter(t => t.status === 'running').length}
              </span>
              <span className={styles.statLabel}>Aktywne</span>
            </div>
            <div className={styles.statBadge} data-status="pending">
              <span className={styles.statNumber}>
                {tasks.filter(t => t.status === 'pending').length}
              </span>
              <span className={styles.statLabel}>Oczekujące</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
            title="Utwórz nowe zadanie"
          >
            <span className={styles.buttonIcon}>➕</span>
            Nowe zadanie
          </button>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className={styles.tasksList}>
          {filteredTasks.map(task => (
            <div
              key={task.id}
              className={styles.taskCard}
              data-status={task.status}
            >
              <div className={styles.taskHeader}>
                <div className={styles.taskTitle}>
                  <span className={styles.taskIcon}>📋</span>
                  <span className={styles.taskName}>{task.name}</span>
                  <div
                    className={styles.priorityBadge}
                    data-priority={task.priority}
                  >
                    {task.priority}
                  </div>
                </div>
                <div className={styles.taskActions}>
                  {task.status === 'pending' && (
                    <button
                      onClick={() => handleExecuteTask(task.id)}
                      className={styles.executeButton}
                      title="Wykonaj zadanie"
                    >
                      ▶️
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTask(task)}
                    className={styles.viewButton}
                    title="Zobacz szczegóły"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className={styles.deleteButton}
                    title="Usuń zadanie"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.taskContent}>
                <p className={styles.taskDescription}>{task.description}</p>

                <div className={styles.taskMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Status:</span>
                    <span
                      className={styles.statusBadge}
                      data-status={task.status}
                    >
                      {task.status === 'pending' && 'Oczekuje'}
                      {task.status === 'running' && 'W trakcie'}
                      {task.status === 'completed' && 'Zakończone'}
                      {task.status === 'failed' && 'Nieudane'}
                    </span>
                  </div>

                  {task.assignedAgent && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Agent:</span>
                      <span className={styles.metaValue}>
                        {task.assignedAgent}
                      </span>
                    </div>
                  )}

                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Utworzone:</span>
                    <span className={styles.metaValue}>
                      {task.createdAt.toLocaleDateString('pl-PL')}
                    </span>
                  </div>
                </div>

                {task.progress > 0 && (
                  <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                      <span className={styles.progressLabel}>Postęp</span>
                      <span className={styles.progressValue}>
                        {task.progress}%
                      </span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        data-progress={task.progress}
                        data-status={task.status}
                      />
                    </div>
                  </div>
                )}

                {task.tags.length > 0 && (
                  <div className={styles.tagsList}>
                    {task.tags.map(tag => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {task.errorMessage && (
                  <div className={styles.errorMessage}>
                    <span className={styles.errorIcon}>⚠️</span>
                    {task.errorMessage}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3 className={styles.emptyTitle}>Brak zadań</h3>
          <p className={styles.emptyDescription}>
            {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
              ? 'Nie znaleziono zadań pasujących do wybranych filtrów'
              : 'Nie masz jeszcze żadnych zadań w tym projekcie. Utwórz swoje pierwsze zadanie, aby rozpocząć automatyzację.'}
          </p>
          {!searchTerm &&
            filterStatus === 'all' &&
            filterPriority === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className={styles.emptyAction}
              >
                Utwórz pierwsze zadanie
              </button>
            )}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
        />
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

// Create Task Modal Component
interface CreateTaskModalProps {
  onClose: () => void;
  onCreate: (data: Partial<Task>) => void;
}

function CreateTaskModal({ onClose, onCreate }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 'medium' as Task['priority'],
    estimatedDuration: 30,
    assignedAgent: '',
    tags: [] as string[],
    dependencies: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreate(formData);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Utwórz nowe zadanie</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            title="Zamknij"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="task-name" className={styles.formLabel}>
              Nazwa zadania
            </label>
            <input
              id="task-name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className={styles.formInput}
              placeholder="Wprowadź nazwę zadania..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="task-description" className={styles.formLabel}>
              Opis
            </label>
            <textarea
              id="task-description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={styles.formTextarea}
              placeholder="Opisz zadanie..."
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="task-priority" className={styles.formLabel}>
                Priorytet
              </label>
              <select
                id="task-priority"
                value={formData.priority}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    priority: e.target.value as Task['priority'],
                  }))
                }
                className={styles.formSelect}
              >
                <option value="low">Niski</option>
                <option value="medium">Średni</option>
                <option value="high">Wysoki</option>
                <option value="critical">Krytyczny</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="task-duration" className={styles.formLabel}>
                Szacowany czas (min)
              </label>
              <input
                id="task-duration"
                type="number"
                value={formData.estimatedDuration}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    estimatedDuration: parseInt(e.target.value) || 30,
                  }))
                }
                className={styles.formInput}
                min="1"
                max="1440"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="task-agent" className={styles.formLabel}>
              Przypisany agent (opcjonalnie)
            </label>
            <input
              id="task-agent"
              type="text"
              value={formData.assignedAgent}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  assignedAgent: e.target.value,
                }))
              }
              className={styles.formInput}
              placeholder="Wybierz agenta..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tagi</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={currentTag}
                onChange={e => setCurrentTag(e.target.value)}
                className={styles.formInput}
                placeholder="Dodaj tag..."
                onKeyPress={e =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                }
              />
              <button
                type="button"
                onClick={handleAddTag}
                className={styles.addTagButton}
                title="Dodaj tag"
              >
                ➕
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className={styles.tagsList}>
                {formData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={styles.removeTag}
                      title="Usuń tag"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Anuluj
            </button>
            <button type="submit" className={styles.submitButton}>
              Utwórz zadanie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Task Details Modal Component
interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
}

function TaskDetailsModal({ task, onClose }: TaskDetailsModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Szczegóły zadania: {task.name}</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            title="Zamknij"
          >
            ✕
          </button>
        </div>

        <div className={styles.taskDetails}>
          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Podstawowe informacje</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={styles.detailValue}>{task.status}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Priorytet:</span>
                <span className={styles.detailValue}>{task.priority}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Utworzone:</span>
                <span className={styles.detailValue}>
                  {task.createdAt.toLocaleString('pl-PL')}
                </span>
              </div>
              {task.completedAt && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Zakończone:</span>
                  <span className={styles.detailValue}>
                    {task.completedAt.toLocaleString('pl-PL')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {task.description && (
            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>Opis</h4>
              <p className={styles.taskDescription}>{task.description}</p>
            </div>
          )}

          {task.results && (
            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>Wyniki</h4>
              <pre className={styles.resultsCode}>
                {JSON.stringify(task.results, null, 2)}
              </pre>
            </div>
          )}

          {task.errorMessage && (
            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>Błąd</h4>
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {task.errorMessage}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
