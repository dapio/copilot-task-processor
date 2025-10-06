import React from 'react';
import { Bot, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import styles from '../../styles/project-details-dashboard.module.css';
import type { Agent } from '../../types/dashboard.types';

interface ProjectAgentsSectionProps {
  projectAgents: Agent[];
  onAgentSelect?: (agentId: string) => void;
  onAgentAssign?: (agentId: string, taskId: string) => void;
}

export const ProjectAgentsSection: React.FC<ProjectAgentsSectionProps> = ({
  projectAgents,
  onAgentSelect,
  // onAgentAssign - TODO: Implementation
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return React.createElement(CheckCircle, {
          size: 16,
          className: styles.statusOnline,
        });
      case 'busy':
        return React.createElement(Activity, {
          size: 16,
          className: styles.statusBusy,
        });
      case 'offline':
        return React.createElement(Clock, {
          size: 16,
          className: styles.statusOffline,
        });
      case 'error':
        return React.createElement(AlertCircle, {
          size: 16,
          className: styles.statusError,
        });
      default:
        return React.createElement(Clock, { size: 16 });
    }
  };

  const getAgentStatusStats = () => {
    const stats = projectAgents.reduce((acc, agent) => {
      acc[agent.status] = (acc[agent.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: projectAgents.length,
      online: stats.online || 0,
      busy: stats.busy || 0,
      offline: stats.offline || 0,
      error: stats.error || 0,
    };
  };

  const agentStats = getAgentStatusStats();

  return (
    <div className={styles.agentsSection}>
      <div className={styles.sectionHeader}>
        <h2>Zespół agentów</h2>
        <div className={styles.agentStats}>
          <span className={styles.stat}>
            <span className={styles.statValue}>{agentStats.total}</span>
            <span className={styles.statLabel}>Wszyscy</span>
          </span>
          <span className={styles.stat}>
            <span className={`${styles.statValue} ${styles.online}`}>
              {agentStats.online}
            </span>
            <span className={styles.statLabel}>Dostępni</span>
          </span>
          <span className={styles.stat}>
            <span className={`${styles.statValue} ${styles.busy}`}>
              {agentStats.busy}
            </span>
            <span className={styles.statLabel}>Zajęci</span>
          </span>
          {agentStats.offline > 0 && (
            <span className={styles.stat}>
              <span className={`${styles.statValue} ${styles.offline}`}>
                {agentStats.offline}
              </span>
              <span className={styles.statLabel}>Offline</span>
            </span>
          )}
          {agentStats.error > 0 && (
            <span className={styles.stat}>
              <span className={`${styles.statValue} ${styles.error}`}>
                {agentStats.error}
              </span>
              <span className={styles.statLabel}>Błędy</span>
            </span>
          )}
        </div>
      </div>

      {projectAgents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Brak agentów przypisanych do projektu</p>
          <button className={styles.addButton}>Przypisz agentów</button>
        </div>
      ) : (
        <div className={styles.agentsList}>
          {projectAgents.map(agent => (
            <div
              key={agent.id}
              className={`${styles.agentCard} ${styles[agent.status]}`}
              onClick={() => onAgentSelect?.(agent.id)}
            >
              <div className={styles.agentHeader}>
                <div className={styles.agentAvatar}>
                  <Bot size={24} />
                </div>
                <div className={styles.agentInfo}>
                  <h4>{agent.name}</h4>
                  <span className={styles.agentRole}>{agent.role}</span>
                </div>
                <div className={styles.agentStatus}>
                  {getStatusIcon(agent.status)}
                  <span>{agent.status}</span>
                </div>
              </div>

              <div className={styles.agentBody}>
                <p className={styles.agentDescription}>{agent.description}</p>

                <div className={styles.agentSpecialty}>
                  <strong>Specjalizacja:</strong> {agent.specialty}
                </div>

                {agent.currentTask && (
                  <div className={styles.currentTask}>
                    <strong>Aktualne zadanie:</strong>
                    <span className={styles.taskName}>{agent.currentTask}</span>
                  </div>
                )}

                <div className={styles.agentMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {agent.completedTasks}
                    </span>
                    <span className={styles.metricLabel}>
                      Ukończone zadania
                    </span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {agent.successRate}%
                    </span>
                    <span className={styles.metricLabel}>Wskaźnik sukcesu</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricValue}>
                      {agent.status === 'busy' ? 'Zajęty' : 'Dostępny'}
                    </span>
                    <span className={styles.metricLabel}>Status</span>
                  </div>
                </div>
              </div>

              <div className={styles.agentActions}>
                <button
                  className={styles.assignButton}
                  disabled={agent.status !== 'online'}
                  onClick={e => {
                    e.stopPropagation();
                    // onAgentAssign?.(agent.id, ''); // TODO: Select task to assign
                  }}
                  title={
                    agent.status !== 'online'
                      ? 'Agent nie jest dostępny'
                      : 'Przypisz zadanie'
                  }
                >
                  Przypisz zadanie
                </button>
                <button
                  className={styles.chatButton}
                  onClick={e => {
                    e.stopPropagation();
                    // TODO: Open chat with agent
                  }}
                >
                  Czat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
