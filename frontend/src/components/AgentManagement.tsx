import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Agent } from '../types/project';
import { agentApiService } from '../services/agentApiService';
import styles from '../styles/management-components.module.css';

// Agent types based on API
const AGENT_TYPES = [
  'document-processor',
  'task-automation',
  'workflow-manager',
  'data-analyst',
  'custom',
] as const;

type AgentType = (typeof AGENT_TYPES)[number];
type AgentStatus = Agent['status'];

export default function AgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  // Load agents from API
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await agentApiService.getAgents();
      if (response.success && response.data) {
        setAgents(response.data);
      } else {
        setError('Błąd ładowania agentów');
        console.error('Error loading agents:', response.error);
      }
    } catch (err) {
      setError('Błąd połączenia z API agentów');
      console.error('Error loading agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreateAgent = async (agentData: {
    name: string;
    type: string;
    capabilities?: string[];
  }) => {
    try {
      const response = await agentApiService.createAgent(agentData);
      if (response.success && response.data) {
        setAgents(prev => [...prev, response.data!]);
        setShowCreateModal(false);
      } else {
        setError('Błąd tworzenia agenta');
        console.error('Error creating agent:', response.error);
      }
    } catch (err) {
      setError('Błąd połączenia z API podczas tworzenia agenta');
      console.error('Error creating agent:', err);
    }
  };

  const handleUpdateAgent = async (agentData: {
    name?: string;
    type?: string;
    status?: 'idle' | 'active' | 'busy' | 'error';
  }) => {
    if (!editingAgent) return;

    try {
      const response = await agentApiService.updateAgent(
        editingAgent.id,
        agentData
      );
      if (response.success && response.data) {
        setAgents(prev =>
          prev.map(agent =>
            agent.id === editingAgent.id ? response.data! : agent
          )
        );
        setShowEditModal(false);
        setEditingAgent(null);
      } else {
        setError('Błąd aktualizacji agenta');
        console.error('Error updating agent:', response.error);
      }
    } catch (err) {
      setError('Błąd połączenia z API podczas aktualizacji agenta');
      console.error('Error updating agent:', err);
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego agenta?')) return;

    try {
      const response = await agentApiService.deleteAgent(agentId);
      if (response.success) {
        setAgents(prev => prev.filter(agent => agent.id !== agentId));
      } else {
        setError('Błąd usuwania agenta');
        console.error('Error deleting agent:', response.error);
      }
    } catch (err) {
      setError('Błąd połączenia z API podczas usuwania agenta');
      console.error('Error deleting agent:', err);
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className={styles.statusActive} />;
      case 'inactive':
        return <AlertCircle size={16} className={styles.statusInactive} />;
      case 'error':
        return <Clock size={16} className={styles.statusBusy} />;
      default:
        return <Clock size={16} className={styles.statusInactive} />;
    }
  };

  const filteredAgents = agents.filter(
    agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Ładowanie agentów...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          {error}
          <button onClick={loadAgents} className={styles.retryButton}>
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h2 className={styles.title}>Zarządzanie Agentami AI</h2>
          <p className={styles.subtitle}>
            Konfiguruj i monitoruj agentów w Twoim projekcie
          </p>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`${styles.button} ${styles.primary}`}
          >
            <Plus size={16} />
            Dodaj Agenta
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Szukaj agentów..."
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {filteredAgents.map(agent => (
          <div key={agent.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.agentInfo}>
                <div className={styles.agentIcon}>
                  <User size={24} />
                </div>
                <div className={styles.agentDetails}>
                  <h3 className={styles.agentName}>{agent.name}</h3>
                  <span className={styles.agentType}>{agent.type}</span>
                </div>
              </div>

              <div className={styles.agentStatus}>
                {getStatusIcon(agent.status)}
                <span className={styles.statusText}>{agent.status}</span>
              </div>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.agentDescription}>
                {agent.description || 'Brak opisu'}
              </p>

              {/* Capabilities */}
              {agent.configuration?.capabilities &&
                agent.configuration.capabilities.length > 0 && (
                  <div className={styles.capabilities}>
                    <span className={styles.sectionLabel}>Możliwości:</span>
                    <div className={styles.capabilityTags}>
                      {agent.configuration.capabilities
                        .slice(0, 3)
                        .map((capability, index) => (
                          <span key={index} className={styles.capabilityTag}>
                            {capability}
                          </span>
                        ))}
                      {agent.configuration.capabilities.length > 3 && (
                        <span className={styles.moreCapabilities}>
                          +{agent.configuration.capabilities.length - 3} więcej
                        </span>
                      )}
                    </div>
                  </div>
                )}

              {/* Metrics */}
              {agent.metrics && (
                <div className={styles.metrics}>
                  <span className={styles.sectionLabel}>Statystyki:</span>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>
                        {agent.metrics.totalExecutions}
                      </span>
                      <span className={styles.metricLabel}>Wykonania</span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricValue}>
                        {(agent.metrics.errorRate * 100).toFixed(1)}%
                      </span>
                      <span className={styles.metricLabel}>Błędów</span>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.agentMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Model:</span>
                  <span className={styles.metaValue}>
                    {agent.configuration?.model || 'N/A'}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Utworzono:</span>
                  <span className={styles.metaValue}>
                    {new Date(agent.createdAt).toLocaleDateString('pl-PL')}
                  </span>
                </div>

                {agent.tags && agent.tags.length > 0 && (
                  <div className={styles.tags}>
                    {agent.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.cardActions}>
              <button
                onClick={() => {
                  setEditingAgent(agent);
                  setShowEditModal(true);
                }}
                className={`${styles.button} ${styles.secondary}`}
                title="Edytuj agenta"
              >
                <Edit size={16} />
              </button>

              <button
                onClick={() => handleDeleteAgent(agent.id)}
                className={`${styles.button} ${styles.danger}`}
                title="Usuń agenta"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className={styles.emptyState}>
          <User size={48} className={styles.emptyIcon} />
          <h3>Brak agentów</h3>
          <p>Nie znaleziono agentów pasujących do kryteriów wyszukiwania.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className={`${styles.button} ${styles.primary}`}
          >
            <Plus size={16} />
            Dodaj pierwszego agenta
          </button>
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAgent}
        />
      )}

      {/* Edit Agent Modal */}
      {showEditModal && editingAgent && (
        <EditAgentModal
          agent={editingAgent}
          onClose={() => {
            setShowEditModal(false);
            setEditingAgent(null);
          }}
          onUpdate={handleUpdateAgent}
        />
      )}
    </div>
  );
}

// Create Agent Modal Component
function CreateAgentModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    type: string;
    capabilities?: string[];
  }) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'document-processor' as AgentType,
    description: '',
    capabilities: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const agentData = {
      name: formData.name,
      type: formData.type,
      capabilities: formData.capabilities
        ? formData.capabilities.split(',').map(tag => tag.trim())
        : [],
    };

    onCreate(agentData);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Dodaj Nowego Agenta</h3>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nazwa Agenta</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="type">Typ Agenta</label>
            <select
              id="type"
              value={formData.type}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  type: e.target.value as AgentType,
                }))
              }
              className={styles.select}
            >
              {AGENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Opis</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={styles.textarea}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="capabilities">
              Capabilities (oddzielone przecinkami)
            </label>
            <input
              id="capabilities"
              type="text"
              value={formData.capabilities}
              onChange={e =>
                setFormData(prev => ({ ...prev, capabilities: e.target.value }))
              }
              placeholder="np: AI, analiza, badania"
              className={styles.input}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.secondary}`}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.primary}`}
            >
              Dodaj Agenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Agent Modal Component
function EditAgentModal({
  agent,
  onClose,
  onUpdate,
}: {
  agent: Agent;
  onClose: () => void;
  onUpdate: (data: {
    name?: string;
    type?: string;
    status?: 'idle' | 'active' | 'busy' | 'error';
  }) => void;
}) {
  // Map Agent status to UpdateAgentRequest status
  const mapStatus = (
    agentStatus: string
  ): 'idle' | 'active' | 'busy' | 'error' => {
    switch (agentStatus) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'idle';
      case 'error':
        return 'error';
      case 'training':
        return 'busy';
      default:
        return 'idle';
    }
  };

  const [formData, setFormData] = useState({
    name: agent.name,
    type: agent.type,
    status: mapStatus(agent.status),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const agentData = {
      name: formData.name,
      type: formData.type,
      status: formData.status,
    };

    onUpdate(agentData);
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Edytuj Agenta</h3>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="edit-name">Nazwa Agenta</label>
            <input
              id="edit-name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              required
              className={styles.input}
            />
          </div>

          {/* Display read-only info */}
          <div className={styles.formGroup}>
            <label>Opis</label>
            <p className={styles.readOnlyText}>{agent.description}</p>
          </div>

          <div className={styles.formGroup}>
            <label>Model</label>
            <p className={styles.readOnlyText}>{agent.configuration?.model}</p>
          </div>

          <div className={styles.formGroup}>
            <label>Możliwości</label>
            <div className={styles.capabilityTags}>
              {agent.configuration?.capabilities?.map((capability, index) => (
                <span key={index} className={styles.capabilityTag}>
                  {capability}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Statystyki</label>
            <div className={styles.metricsGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>
                  {agent.metrics?.totalExecutions || 0}
                </span>
                <span className={styles.metricLabel}>Wykonania</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>
                  {agent.metrics?.successfulExecutions || 0}
                </span>
                <span className={styles.metricLabel}>Sukces</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricValue}>
                  {((agent.metrics?.errorRate || 0) * 100).toFixed(1)}%
                </span>
                <span className={styles.metricLabel}>Błędów</span>
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-type">Typ Agenta</label>
            <select
              id="edit-type"
              value={formData.type}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  type: e.target.value as AgentType,
                }))
              }
              className={styles.select}
            >
              {AGENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              value={formData.status}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  status: e.target.value as
                    | 'idle'
                    | 'active'
                    | 'busy'
                    | 'error',
                }))
              }
              className={styles.select}
            >
              <option value="idle">Idle</option>
              <option value="active">Active</option>
              <option value="busy">Busy</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={`${styles.button} ${styles.secondary}`}
            >
              Anuluj
            </button>
            <button
              type="submit"
              className={`${styles.button} ${styles.primary}`}
            >
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
