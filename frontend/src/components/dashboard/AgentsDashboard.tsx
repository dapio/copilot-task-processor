/**
 * Agents Dashboard - Zarządzanie zespołem agentów
 * @description Panel do monitorowania i zarządzania agentami AI
 */

import React, { memo, useState } from 'react';
import {
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Bot,
  Settings,
  Eye,
  MessageSquare,
  Zap,
} from 'lucide-react';
import type { Agent } from '../../types/dashboard.types';
import styles from '../../styles/dashboard-agents.module.css';

interface AgentsDashboardProps {
  agents: Agent[];
  onSelectAgent: (agent: Agent) => void;
  searchTerm: string;
}

export const AgentsDashboard = memo<AgentsDashboardProps>(
  ({ agents, onSelectAgent, searchTerm }) => {
    const [selectedStatus, setSelectedStatus] = useState<
      'all' | 'online' | 'busy' | 'offline'
    >('all');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    // Unique roles for filter
    const uniqueRoles = Array.from(new Set(agents.map(agent => agent.role)));

    // Filter agents
    const filteredAgents = agents.filter(agent => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.specialty?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatus === 'all' || agent.status === selectedStatus;
      const matchesRole = selectedRole === 'all' || agent.role === selectedRole;

      return matchesSearch && matchesStatus && matchesRole;
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'online':
          return 'green';
        case 'busy':
          return 'orange';
        case 'offline':
          return 'gray';
        default:
          return 'gray';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'online':
          return React.createElement(CheckCircle, { size: 16 });
        case 'busy':
          return React.createElement(Clock, { size: 16 });
        case 'offline':
          return React.createElement(AlertCircle, { size: 16 });
        default:
          return React.createElement(AlertCircle, { size: 16 });
      }
    };

    return (
      <div className={styles.agentsDashboard}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h2>Zespół Agentów AI</h2>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <Users size={16} />
                <span>{agents.length} agentów</span>
              </div>
              <div className={styles.statItem}>
                <Activity size={16} />
                <span>
                  {agents.filter(a => a.status === 'online').length} online
                </span>
              </div>
              <div className={styles.statItem}>
                <Clock size={16} />
                <span>
                  {agents.filter(a => a.status === 'busy').length} pracujących
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label>Status:</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as any)}
              className={styles.filterSelect}
              title="Filtruj według statusu agenta"
            >
              <option value="all">Wszystkie</option>
              <option value="online">Online</option>
              <option value="busy">Zajęty</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Rola:</label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className={styles.filterSelect}
              title="Filtruj według roli agenta"
            >
              <option value="all">Wszystkie role</option>
              {uniqueRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Agents Grid */}
        {filteredAgents.length === 0 ? (
          <div className={styles.emptyState}>
            <Bot size={64} />
            <h3>Brak agentów</h3>
            <p>
              {searchTerm || selectedStatus !== 'all' || selectedRole !== 'all'
                ? 'Brak agentów spełniających kryteria wyszukiwania'
                : 'Nie znaleziono żadnych agentów w systemie'}
            </p>
          </div>
        ) : (
          <div className={styles.agentsGrid}>
            {filteredAgents.map(agent => (
              <div
                key={agent.id}
                className={styles.agentCard}
                onClick={() => onSelectAgent(agent)}
              >
                {/* Agent Header */}
                <div className={styles.agentHeader}>
                  <div className={styles.agentAvatar}>
                    {agent.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={agent.avatar} alt={agent.name} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {agent.name
                          .split(' ')
                          .map(n => n[0])
                          .join('')}
                      </div>
                    )}
                    <div
                      className={`${styles.statusIndicator} ${
                        styles[getStatusColor(agent.status)]
                      }`}
                    />
                  </div>

                  <div className={styles.agentInfo}>
                    <h3>{agent.name}</h3>
                    <p className={styles.role}>{agent.role}</p>
                    <div className={styles.status}>
                      {getStatusIcon(agent.status)}
                      <span>{agent.status}</span>
                    </div>
                  </div>

                  <div className={styles.agentActions}>
                    <button
                      className={styles.actionButton}
                      title="Zobacz szczegóły agenta"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      title="Wyślij wiadomość"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button
                      className={styles.actionButton}
                      title="Ustawienia agenta"
                    >
                      <Settings size={16} />
                    </button>
                  </div>
                </div>

                {/* Agent Details */}
                <div className={styles.agentDetails}>
                  {agent.description && (
                    <p className={styles.description}>{agent.description}</p>
                  )}

                  {agent.specialty && (
                    <div className={styles.specialty}>
                      <h4>Specjalizacja:</h4>
                      <p>{agent.specialty}</p>
                    </div>
                  )}

                  {agent.currentTask && (
                    <div className={styles.currentTask}>
                      <h4>Obecne zadanie:</h4>
                      <div className={styles.taskInfo}>
                        <Zap size={14} />
                        <span>{agent.currentTask}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Stats */}
                <div className={styles.agentStats}>
                  {agent.completedTasks && (
                    <div className={styles.stat}>
                      <CheckCircle size={16} />
                      <div>
                        <span className={styles.statValue}>
                          {agent.completedTasks}
                        </span>
                        <span className={styles.statLabel}>Ukończone</span>
                      </div>
                    </div>
                  )}

                  {agent.successRate && (
                    <div className={styles.stat}>
                      <TrendingUp size={16} />
                      <div>
                        <span className={styles.statValue}>
                          {agent.successRate}%
                        </span>
                        <span className={styles.statLabel}>Skuteczność</span>
                      </div>
                    </div>
                  )}

                  <div className={styles.stat}>
                    <Activity size={16} />
                    <div>
                      <span className={styles.statValue}>
                        {agent.status === 'online'
                          ? 'Dostępny'
                          : agent.status === 'busy'
                          ? 'Zajęty'
                          : 'Offline'}
                      </span>
                      <span className={styles.statLabel}>Status</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className={styles.quickActions}>
                  <button className={styles.primaryAction}>
                    {agent.status === 'online'
                      ? 'Przydziel zadanie'
                      : agent.status === 'busy'
                      ? 'Zobacz zadanie'
                      : 'Aktywuj agenta'}
                  </button>
                  <button className={styles.secondaryAction}>
                    Zobacz historię
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className={styles.summaryStats}>
          <div className={styles.summaryCard}>
            <h3>Wydajność zespołu</h3>
            <div className={styles.summaryMetrics}>
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  {Math.round(
                    agents.reduce((sum, a) => sum + (a.successRate || 0), 0) /
                      agents.length
                  ) || 0}
                  %
                </span>
                <span className={styles.metricLabel}>Średnia skuteczność</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  {agents.reduce((sum, a) => sum + (a.completedTasks || 0), 0)}
                </span>
                <span className={styles.metricLabel}>Ukończone zadania</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue}>
                  {Math.round(
                    (agents.filter(
                      a => a.status === 'online' || a.status === 'busy'
                    ).length /
                      agents.length) *
                      100
                  )}
                  %
                </span>
                <span className={styles.metricLabel}>Dostępność</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

AgentsDashboard.displayName = 'AgentsDashboard';
