import { useState, useEffect } from 'react';
import React from 'react';
import styles from '../styles/management-components.module.css';

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  capabilities: string[];
  description: string;
  lastUsed: Date;
  configuration: Record<string, any>;
}

interface AgentManagementProps {
  projectId: string;
}

export default function AgentManagement({ projectId }: AgentManagementProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAgents();
  }, [projectId]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockData: Agent[] = [
        {
          id: '1',
          name: 'Document Processor',
          type: 'Processing',
          status: 'active',
          capabilities: ['PDF Analysis', 'Text Extraction', 'OCR'],
          description:
            'Specialized agent for processing various document formats and extracting structured information.',
          lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
          configuration: {
            maxFileSize: '50MB',
            supportedFormats: ['PDF', 'DOC', 'TXT'],
          },
        },
        {
          id: '2',
          name: 'Code Analyzer',
          type: 'Analysis',
          status: 'active',
          capabilities: [
            'Code Review',
            'Bug Detection',
            'Performance Analysis',
          ],
          description:
            'Advanced AI agent for analyzing code quality, detecting bugs, and suggesting improvements.',
          lastUsed: new Date(Date.now() - 5 * 60 * 60 * 1000),
          configuration: {
            languages: ['TypeScript', 'Python', 'JavaScript'],
            complexity: 'high',
          },
        },
        {
          id: '3',
          name: 'API Connector',
          type: 'Integration',
          status: 'inactive',
          capabilities: ['REST API', 'GraphQL', 'Webhooks'],
          description:
            'Facilitates connections with external APIs and handles data synchronization.',
          lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
          configuration: {
            timeout: '30s',
            retries: 3,
            authentication: 'Bearer',
          },
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setAgents(mockData);
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = async (agentData: Partial<Agent>) => {
    // TODO: Replace with actual API call
    const newAgent: Agent = {
      id: Date.now().toString(),
      name: agentData.name || 'New Agent',
      type: agentData.type || 'Generic',
      status: 'inactive',
      capabilities: agentData.capabilities || [],
      description: agentData.description || '',
      lastUsed: new Date(),
      configuration: agentData.configuration || {},
    };

    setAgents(prev => [...prev, newAgent]);
    setShowCreateModal(false);
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć tego agenta?')) {
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
    }
  };

  const handleToggleStatus = async (agentId: string) => {
    setAgents(prev =>
      prev.map(agent =>
        agent.id === agentId
          ? {
              ...agent,
              status: agent.status === 'active' ? 'inactive' : 'active',
            }
          : agent
      )
    );
  };

  const filteredAgents = agents.filter(
    agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.capabilities.some(cap =>
        cap.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>⚙️</div>
        <p className={styles.loadingText}>Ładowanie agentów...</p>
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
              placeholder="Szukaj agentów..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statsContainer}>
            <div className={styles.statBadge} data-status="active">
              <span className={styles.statNumber}>
                {agents.filter(a => a.status === 'active').length}
              </span>
              <span className={styles.statLabel}>Aktywne</span>
            </div>
            <div className={styles.statBadge} data-status="inactive">
              <span className={styles.statNumber}>
                {agents.filter(a => a.status === 'inactive').length}
              </span>
              <span className={styles.statLabel}>Nieaktywne</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
            title="Utwórz nowego agenta"
          >
            <span className={styles.buttonIcon}>➕</span>
            Nowy Agent
          </button>
        </div>
      </div>

      {/* Agents Grid */}
      {filteredAgents.length > 0 ? (
        <div className={styles.itemsGrid}>
          {filteredAgents.map(agent => (
            <div
              key={agent.id}
              className={styles.itemCard}
              data-status={agent.status}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <span className={styles.itemIcon}>🤖</span>
                  <span className={styles.itemName}>{agent.name}</span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleToggleStatus(agent.id)}
                    className={styles.statusToggle}
                    data-status={agent.status}
                    title={
                      agent.status === 'active'
                        ? 'Dezaktywuj agenta'
                        : 'Aktywuj agenta'
                    }
                  >
                    {agent.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className={styles.editButton}
                    title="Edytuj agenta"
                  >
                    ⚙️
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className={styles.deleteButton}
                    title="Usuń agenta"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.itemMeta}>
                  <span className={styles.itemType}>{agent.type}</span>
                  <span className={styles.lastUsed}>
                    Ostatnio używany:{' '}
                    {agent.lastUsed.toLocaleDateString('pl-PL')}
                  </span>
                </div>

                <p className={styles.itemDescription}>{agent.description}</p>

                <div className={styles.capabilitiesList}>
                  {agent.capabilities.slice(0, 3).map(capability => (
                    <span key={capability} className={styles.capabilityTag}>
                      {capability}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className={styles.moreCapabilities}>
                      +{agent.capabilities.length - 3} więcej
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Konfiguracja:</span>
                  <span className={styles.configCount}>
                    {Object.keys(agent.configuration).length} parametrów
                  </span>
                </div>
                <div
                  className={styles.statusIndicator}
                  data-status={agent.status}
                >
                  {agent.status === 'active' ? '🟢 Aktywny' : '⭕ Nieaktywny'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🤖</div>
          <h3 className={styles.emptyTitle}>Brak agentów</h3>
          <p className={styles.emptyDescription}>
            {searchTerm
              ? `Nie znaleziono agentów pasujących do "${searchTerm}"`
              : 'Nie masz jeszcze żadnych agentów w tym projekcie. Utwórz swojego pierwszego agenta, aby rozpocząć automatyzację procesów.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={styles.emptyAction}
            >
              Utwórz pierwszego agenta
            </button>
          )}
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
      {selectedAgent && (
        <EditAgentModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onSave={updatedAgent => {
            setAgents(prev =>
              prev.map(a => (a.id === updatedAgent.id ? updatedAgent : a))
            );
            setSelectedAgent(null);
          }}
        />
      )}
    </div>
  );
}

// Create Agent Modal Component
interface CreateAgentModalProps {
  onClose: () => void;
  onCreate: (data: Partial<Agent>) => void;
}

function CreateAgentModal({ onClose, onCreate }: CreateAgentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'Generic',
    description: '',
    capabilities: [] as string[],
    configuration: {},
  });
  const [currentCapability, setCurrentCapability] = useState('');

  const agentTypes = [
    'Processing',
    'Analysis',
    'Integration',
    'Communication',
    'Monitoring',
    'Generic',
  ];

  const handleAddCapability = () => {
    if (
      currentCapability.trim() &&
      !formData.capabilities.includes(currentCapability.trim())
    ) {
      setFormData(prev => ({
        ...prev,
        capabilities: [...prev.capabilities, currentCapability.trim()],
      }));
      setCurrentCapability('');
    }
  };

  const handleRemoveCapability = (capability: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.filter(cap => cap !== capability),
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
          <h3 className={styles.modalTitle}>Utwórz nowego agenta</h3>
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
            <label htmlFor="agent-name" className={styles.formLabel}>
              Nazwa agenta
            </label>
            <input
              id="agent-name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className={styles.formInput}
              placeholder="Wprowadź nazwę agenta..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="agent-type" className={styles.formLabel}>
              Typ agenta
            </label>
            <select
              id="agent-type"
              value={formData.type}
              onChange={e =>
                setFormData(prev => ({ ...prev, type: e.target.value }))
              }
              className={styles.formSelect}
            >
              {agentTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="agent-description" className={styles.formLabel}>
              Opis
            </label>
            <textarea
              id="agent-description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={styles.formTextarea}
              placeholder="Opisz funkcjonalność agenta..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Możliwości</label>
            <div className={styles.capabilityInput}>
              <input
                type="text"
                value={currentCapability}
                onChange={e => setCurrentCapability(e.target.value)}
                className={styles.formInput}
                placeholder="Dodaj możliwość..."
                onKeyPress={e =>
                  e.key === 'Enter' &&
                  (e.preventDefault(), handleAddCapability())
                }
              />
              <button
                type="button"
                onClick={handleAddCapability}
                className={styles.addCapabilityButton}
                title="Dodaj możliwość"
              >
                ➕
              </button>
            </div>
            {formData.capabilities.length > 0 && (
              <div className={styles.capabilitiesList}>
                {formData.capabilities.map(capability => (
                  <span key={capability} className={styles.capabilityTag}>
                    {capability}
                    <button
                      type="button"
                      onClick={() => handleRemoveCapability(capability)}
                      className={styles.removeCapability}
                      title="Usuń możliwość"
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
              Utwórz agenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Agent Modal Component
interface EditAgentModalProps {
  agent: Agent;
  onClose: () => void;
  onSave: (agent: Agent) => void;
}

function EditAgentModal({ agent, onClose, onSave }: EditAgentModalProps) {
  const [formData, setFormData] = useState({ ...agent });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edytuj agenta: {agent.name}</h3>
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
            <label htmlFor="edit-agent-name" className={styles.formLabel}>
              Nazwa agenta
            </label>
            <input
              id="edit-agent-name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className={styles.formInput}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label
              htmlFor="edit-agent-description"
              className={styles.formLabel}
            >
              Opis
            </label>
            <textarea
              id="edit-agent-description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={styles.formTextarea}
              rows={3}
            />
          </div>

          <div className={styles.configSection}>
            <h4 className={styles.sectionTitle}>Konfiguracja</h4>
            <div className={styles.configGrid}>
              {Object.entries(formData.configuration).map(([key, value]) => (
                <div key={key} className={styles.configItem}>
                  <span className={styles.configKey}>{key}:</span>
                  <span className={styles.configValue}>
                    {JSON.stringify(value)}
                  </span>
                </div>
              ))}
            </div>
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
              Zapisz zmiany
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
