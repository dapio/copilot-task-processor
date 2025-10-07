import { useState, useEffect } from 'react';
import React from 'react';
import styles from '../styles/management-components.module.css';

interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'condition' | 'delay' | 'webhook';
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  category: string;
  triggers: string[];
  steps: WorkflowStep[];
  createdAt: Date;
  lastRun?: Date;
  runCount: number;
  successRate: number;
  tags: string[];
}

interface WorkflowManagementProps {
  projectId: string;
}

export default function WorkflowManagement({
  projectId,
}: WorkflowManagementProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    loadWorkflows();
  }, [projectId]);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockData: Workflow[] = [
        {
          id: '1',
          name: 'Automatyczne przetwarzanie dokumentów',
          description:
            'Kompletny workflow do automatycznego przetwarzania i analizy dokumentów PDF.',
          status: 'active',
          category: 'Document Processing',
          triggers: ['file_upload', 'schedule'],
          steps: [
            {
              id: 'step1',
              name: 'Odbierz dokument',
              type: 'agent',
              config: { agentId: 'document-processor' },
              position: { x: 100, y: 100 },
            },
            {
              id: 'step2',
              name: 'Analiza treści',
              type: 'agent',
              config: { agentId: 'text-analyzer' },
              position: { x: 300, y: 100 },
            },
            {
              id: 'step3',
              name: 'Zapisz wyniki',
              type: 'webhook',
              config: { url: '/api/save-results' },
              position: { x: 500, y: 100 },
            },
          ],
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000),
          runCount: 145,
          successRate: 94.5,
          tags: ['PDF', 'Automation', 'AI'],
        },
        {
          id: '2',
          name: 'Monitorowanie jakości kodu',
          description:
            'Workflow do automatycznego przeglądu i oceny jakości kodu w repozytorium.',
          status: 'active',
          category: 'Code Analysis',
          triggers: ['git_push', 'pull_request'],
          steps: [
            {
              id: 'step1',
              name: 'Pobierz zmiany',
              type: 'webhook',
              config: { url: '/api/git-webhook' },
              position: { x: 100, y: 100 },
            },
            {
              id: 'step2',
              name: 'Analiza kodu',
              type: 'agent',
              config: { agentId: 'code-analyzer' },
              position: { x: 300, y: 100 },
            },
            {
              id: 'step3',
              name: 'Generuj raport',
              type: 'agent',
              config: { agentId: 'report-generator' },
              position: { x: 500, y: 100 },
            },
          ],
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          lastRun: new Date(Date.now() - 30 * 60 * 1000),
          runCount: 89,
          successRate: 98.9,
          tags: ['Code', 'Quality', 'Git'],
        },
        {
          id: '3',
          name: 'Backup danych',
          description: 'Automatyczny backup bazy danych i plików projektu.',
          status: 'inactive',
          category: 'Maintenance',
          triggers: ['schedule'],
          steps: [
            {
              id: 'step1',
              name: 'Backup bazy danych',
              type: 'agent',
              config: { agentId: 'db-backup' },
              position: { x: 100, y: 100 },
            },
            {
              id: 'step2',
              name: 'Backup plików',
              type: 'agent',
              config: { agentId: 'file-backup' },
              position: { x: 300, y: 100 },
            },
          ],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          runCount: 12,
          successRate: 100,
          tags: ['Backup', 'Maintenance'],
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setWorkflows(mockData);
    } catch (error) {
      console.error('Error loading workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (workflowData: Partial<Workflow>) => {
    // TODO: Replace with actual API call
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: workflowData.name || 'Nowy workflow',
      description: workflowData.description || '',
      status: 'draft',
      category: workflowData.category || 'General',
      triggers: workflowData.triggers || [],
      steps: [],
      createdAt: new Date(),
      runCount: 0,
      successRate: 0,
      tags: workflowData.tags || [],
    };

    setWorkflows(prev => [newWorkflow, ...prev]);
    setShowCreateModal(false);
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten workflow?')) {
      setWorkflows(prev => prev.filter(workflow => workflow.id !== workflowId));
    }
  };

  const handleToggleStatus = async (workflowId: string) => {
    setWorkflows(prev =>
      prev.map(workflow =>
        workflow.id === workflowId
          ? {
              ...workflow,
              status: workflow.status === 'active' ? 'inactive' : 'active',
            }
          : workflow
      )
    );
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    // Simulate workflow execution
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      setWorkflows(prev =>
        prev.map(w =>
          w.id === workflowId
            ? {
                ...w,
                lastRun: new Date(),
                runCount: w.runCount + 1,
              }
            : w
        )
      );

      // Show success message or handle execution result
      alert(`Workflow "${workflow.name}" został uruchomiony pomyślnie!`);
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      filterStatus === 'all' || workflow.status === filterStatus;
    const matchesCategory =
      filterCategory === 'all' || workflow.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(workflows.map(w => w.category)));

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>🔄</div>
        <p className={styles.loadingText}>Ładowanie workflow...</p>
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
              placeholder="Szukaj workflow..."
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
              <option value="active">Aktywne</option>
              <option value="inactive">Nieaktywne</option>
              <option value="draft">Wersje robocze</option>
            </select>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className={styles.filterSelect}
              title="Filtruj według kategorii"
            >
              <option value="all">Wszystkie kategorie</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statsContainer}>
            <div className={styles.statBadge} data-status="active">
              <span className={styles.statNumber}>
                {workflows.filter(w => w.status === 'active').length}
              </span>
              <span className={styles.statLabel}>Aktywne</span>
            </div>
            <div className={styles.statBadge} data-status="inactive">
              <span className={styles.statNumber}>
                {workflows.filter(w => w.status === 'inactive').length}
              </span>
              <span className={styles.statLabel}>Nieaktywne</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
            title="Utwórz nowy workflow"
          >
            <span className={styles.buttonIcon}>➕</span>
            Nowy Workflow
          </button>
        </div>
      </div>

      {/* Workflows Grid */}
      {filteredWorkflows.length > 0 ? (
        <div className={styles.itemsGrid}>
          {filteredWorkflows.map(workflow => (
            <div
              key={workflow.id}
              className={styles.itemCard}
              data-status={workflow.status}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <span className={styles.itemIcon}>🔄</span>
                  <span className={styles.itemName}>{workflow.name}</span>
                </div>
                <div className={styles.cardActions}>
                  {workflow.status === 'active' && (
                    <button
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                      className={styles.executeButton}
                      title="Uruchom workflow"
                    >
                      ▶️
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleStatus(workflow.id)}
                    className={styles.statusToggle}
                    data-status={workflow.status}
                    title={
                      workflow.status === 'active'
                        ? 'Dezaktywuj workflow'
                        : 'Aktywuj workflow'
                    }
                  >
                    {workflow.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => setSelectedWorkflow(workflow)}
                    className={styles.editButton}
                    title="Edytuj workflow"
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className={styles.deleteButton}
                    title="Usuń workflow"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.itemMeta}>
                  <span className={styles.itemType}>{workflow.category}</span>
                  <span className={styles.lastUsed}>
                    {workflow.lastRun
                      ? `Ostatni run: ${workflow.lastRun.toLocaleDateString(
                          'pl-PL'
                        )}`
                      : 'Nie uruchamiany'}
                  </span>
                </div>

                <p className={styles.itemDescription}>{workflow.description}</p>

                <div className={styles.workflowStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Kroki:</span>
                    <span className={styles.statValue}>
                      {workflow.steps.length}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Uruchomienia:</span>
                    <span className={styles.statValue}>
                      {workflow.runCount}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Skuteczność:</span>
                    <span className={styles.statValue}>
                      {workflow.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className={styles.triggersList}>
                  <span className={styles.triggersLabel}>Wyzwalacze:</span>
                  <div className={styles.triggers}>
                    {workflow.triggers.map(trigger => (
                      <span key={trigger} className={styles.triggerTag}>
                        {trigger.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {workflow.tags.length > 0 && (
                  <div className={styles.tagsList}>
                    {workflow.tags.map(tag => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Utworzony:</span>
                  <span className={styles.configCount}>
                    {workflow.createdAt.toLocaleDateString('pl-PL')}
                  </span>
                </div>
                <div
                  className={styles.statusIndicator}
                  data-status={workflow.status}
                >
                  {workflow.status === 'active' && '🟢 Aktywny'}
                  {workflow.status === 'inactive' && '⭕ Nieaktywny'}
                  {workflow.status === 'draft' && '📝 Wersja robocza'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔄</div>
          <h3 className={styles.emptyTitle}>Brak workflow</h3>
          <p className={styles.emptyDescription}>
            {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'Nie znaleziono workflow pasujących do wybranych filtrów'
              : 'Nie masz jeszcze żadnych workflow w tym projekcie. Utwórz swój pierwszy workflow, aby zautomatyzować procesy.'}
          </p>
          {!searchTerm &&
            filterStatus === 'all' &&
            filterCategory === 'all' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className={styles.emptyAction}
              >
                Utwórz pierwszy workflow
              </button>
            )}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <CreateWorkflowModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateWorkflow}
        />
      )}

      {/* Workflow Details Modal */}
      {selectedWorkflow && (
        <WorkflowDetailsModal
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
        />
      )}
    </div>
  );
}

// Create Workflow Modal Component
interface CreateWorkflowModalProps {
  onClose: () => void;
  onCreate: (data: Partial<Workflow>) => void;
}

function CreateWorkflowModal({ onClose, onCreate }: CreateWorkflowModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'General',
    triggers: [] as string[],
    tags: [] as string[],
  });
  const [currentTag, setCurrentTag] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);

  const availableCategories = [
    'General',
    'Document Processing',
    'Code Analysis',
    'Data Processing',
    'Monitoring',
    'Maintenance',
    'Integration',
    'Communication',
  ];

  const availableTriggers = [
    'manual',
    'schedule',
    'file_upload',
    'git_push',
    'pull_request',
    'webhook',
    'email',
    'api_call',
  ];

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

  const handleToggleTrigger = (trigger: string) => {
    const updatedTriggers = selectedTriggers.includes(trigger)
      ? selectedTriggers.filter(t => t !== trigger)
      : [...selectedTriggers, trigger];

    setSelectedTriggers(updatedTriggers);
    setFormData(prev => ({ ...prev, triggers: updatedTriggers }));
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
          <h3 className={styles.modalTitle}>Utwórz nowy workflow</h3>
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
            <label htmlFor="workflow-name" className={styles.formLabel}>
              Nazwa workflow
            </label>
            <input
              id="workflow-name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className={styles.formInput}
              placeholder="Wprowadź nazwę workflow..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="workflow-description" className={styles.formLabel}>
              Opis
            </label>
            <textarea
              id="workflow-description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={styles.formTextarea}
              placeholder="Opisz co robi workflow..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="workflow-category" className={styles.formLabel}>
              Kategoria
            </label>
            <select
              id="workflow-category"
              value={formData.category}
              onChange={e =>
                setFormData(prev => ({ ...prev, category: e.target.value }))
              }
              className={styles.formSelect}
            >
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Wyzwalacze</label>
            <div className={styles.triggerGrid}>
              {availableTriggers.map(trigger => (
                <label key={trigger} className={styles.triggerOption}>
                  <input
                    type="checkbox"
                    checked={selectedTriggers.includes(trigger)}
                    onChange={() => handleToggleTrigger(trigger)}
                    className={styles.triggerCheckbox}
                  />
                  <span className={styles.triggerLabel}>
                    {trigger.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
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
              Utwórz workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Workflow Details Modal Component
interface WorkflowDetailsModalProps {
  workflow: Workflow;
  onClose: () => void;
}

function WorkflowDetailsModal({
  workflow,
  onClose,
}: WorkflowDetailsModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Szczegóły workflow: {workflow.name}
          </h3>
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
                <span className={styles.detailValue}>{workflow.status}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Kategoria:</span>
                <span className={styles.detailValue}>{workflow.category}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Utworzony:</span>
                <span className={styles.detailValue}>
                  {workflow.createdAt.toLocaleString('pl-PL')}
                </span>
              </div>
              {workflow.lastRun && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Ostatni run:</span>
                  <span className={styles.detailValue}>
                    {workflow.lastRun.toLocaleString('pl-PL')}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Opis</h4>
            <p className={styles.taskDescription}>{workflow.description}</p>
          </div>

          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Statystyki</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Liczba kroków:</span>
                <span className={styles.detailValue}>
                  {workflow.steps.length}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Uruchomienia:</span>
                <span className={styles.detailValue}>{workflow.runCount}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Skuteczność:</span>
                <span className={styles.detailValue}>
                  {workflow.successRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Kroki workflow</h4>
            <div className={styles.stepsList}>
              {workflow.steps.map((step, index) => (
                <div key={step.id} className={styles.stepItem}>
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepName}>{step.name}</div>
                    <div className={styles.stepType}>{step.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Wyzwalacze</h4>
            <div className={styles.triggersList}>
              {workflow.triggers.map(trigger => (
                <span key={trigger} className={styles.triggerTag}>
                  {trigger.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
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
