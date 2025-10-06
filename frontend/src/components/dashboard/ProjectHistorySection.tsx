import React, { useState } from 'react';
import {
  History,
  Clock,
  User,
  Bot,
  GitCommit,
  FileText,
  MessageSquare,
  Settings,
  Play,
  CheckCircle,
} from 'lucide-react';
import styles from '../../styles/project-details-dashboard.module.css';

interface HistoryEvent {
  id: string;
  type: 'task' | 'workflow' | 'agent' | 'chat' | 'mockup' | 'system';
  action: string;
  description: string;
  actor: {
    id: string;
    name: string;
    type: 'user' | 'agent' | 'system';
  };
  timestamp: string;
  metadata?: Record<string, any>;
  relatedEntity?: {
    id: string;
    name: string;
    type: string;
  };
}

interface ProjectHistorySectionProps {
  projectHistory: HistoryEvent[];
  onEventSelect?: (eventId: string) => void;
  onFilterChange?: (filters: { type?: string; timeRange?: string }) => void;
  loading?: boolean;
}

export const ProjectHistorySection: React.FC<ProjectHistorySectionProps> = ({
  projectHistory,
  onEventSelect,
  onFilterChange,
  loading = false,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const getEventIcon = (type: string, action: string) => {
    switch (type) {
      case 'task':
        if (action.includes('completed'))
          return React.createElement(CheckCircle, {
            size: 16,
            className: styles.taskIcon,
          });
        if (action.includes('started'))
          return React.createElement(Play, {
            size: 16,
            className: styles.taskIcon,
          });
        return React.createElement(FileText, {
          size: 16,
          className: styles.taskIcon,
        });
      case 'workflow':
        return React.createElement(GitCommit, {
          size: 16,
          className: styles.workflowIcon,
        });
      case 'agent':
        return React.createElement(Bot, {
          size: 16,
          className: styles.agentIcon,
        });
      case 'chat':
        return React.createElement(MessageSquare, {
          size: 16,
          className: styles.chatIcon,
        });
      case 'mockup':
        return React.createElement(FileText, {
          size: 16,
          className: styles.mockupIcon,
        });
      case 'system':
        return React.createElement(Settings, {
          size: 16,
          className: styles.systemIcon,
        });
      default:
        return React.createElement(Clock, { size: 16 });
    }
  };

  const getActorIcon = (actorType: string) => {
    switch (actorType) {
      case 'user':
        return React.createElement(User, { size: 14 });
      case 'agent':
        return React.createElement(Bot, { size: 14 });
      case 'system':
        return React.createElement(Settings, { size: 14 });
      default:
        return React.createElement(Clock, { size: 14 });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes} min temu`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} godz. temu`;
    } else if (diffInHours < 168) {
      // 7 days
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dni temu`;
    } else {
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const filteredEvents = projectHistory.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;

    if (timeRange !== 'all') {
      const eventDate = new Date(event.timestamp);
      const now = new Date();
      const diffInDays =
        (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24);

      switch (timeRange) {
        case 'today':
          return diffInDays < 1;
        case 'week':
          return diffInDays < 7;
        case 'month':
          return diffInDays < 30;
        default:
          return true;
      }
    }

    return true;
  });

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleFilterChange = (type: string, range: string) => {
    onFilterChange?.({
      type: type === 'all' ? undefined : type,
      timeRange: range === 'all' ? undefined : range,
    });
  };

  const getEventTypeStats = () => {
    const stats = projectHistory.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: projectHistory.length,
      task: stats.task || 0,
      workflow: stats.workflow || 0,
      agent: stats.agent || 0,
      chat: stats.chat || 0,
      mockup: stats.mockup || 0,
      system: stats.system || 0,
    };
  };

  const historyStats = getEventTypeStats();

  return (
    <div className={styles.historySection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <h2>Historia projektu</h2>
          <div className={styles.historyStats}>
            <span className={styles.stat}>
              <span className={styles.statValue}>{historyStats.total}</span>
              <span className={styles.statLabel}>Wydarzenia</span>
            </span>
            <span className={styles.stat}>
              <span className={styles.statValue}>{historyStats.task}</span>
              <span className={styles.statLabel}>Zadania</span>
            </span>
            <span className={styles.stat}>
              <span className={styles.statValue}>{historyStats.agent}</span>
              <span className={styles.statLabel}>Agenci</span>
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <select
            value={filterType}
            onChange={e => {
              setFilterType(e.target.value);
              handleFilterChange(e.target.value, timeRange);
            }}
            className={styles.filterSelect}
            title="Filtruj typ wydarzenia"
          >
            <option value="all">Wszystkie typy</option>
            <option value="task">Zadania</option>
            <option value="workflow">Workflow</option>
            <option value="agent">Agenci</option>
            <option value="chat">Czat</option>
            <option value="mockup">Mockupy</option>
            <option value="system">System</option>
          </select>

          <select
            value={timeRange}
            onChange={e => {
              setTimeRange(e.target.value);
              handleFilterChange(filterType, e.target.value);
            }}
            className={styles.filterSelect}
            title="Filtruj okres"
          >
            <option value="all">Cały czas</option>
            <option value="today">Dzisiaj</option>
            <option value="week">Ostatni tydzień</option>
            <option value="month">Ostatni miesiąc</option>
          </select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <History size={48} />
          <h3>
            {filterType === 'all' && timeRange === 'all'
              ? 'Brak wydarzeń'
              : 'Brak wydarzeń dla wybranego filtru'}
          </h3>
          <p>
            {filterType === 'all' && timeRange === 'all'
              ? 'Historia projektu jest pusta'
              : 'Zmień filtr aby zobaczyć inne wydarzenia'}
          </p>
        </div>
      ) : (
        <div className={styles.historyTimeline}>
          {filteredEvents.map((event, index) => (
            <div
              key={event.id}
              className={`${styles.historyEvent} ${styles[event.type]} ${
                expandedEvents.has(event.id) ? styles.expanded : ''
              }`}
            >
              <div className={styles.eventIndicator}>
                <div className={styles.eventIcon}>
                  {getEventIcon(event.type, event.action)}
                </div>
                {index < filteredEvents.length - 1 && (
                  <div className={styles.timelineLine} />
                )}
              </div>

              <div
                className={styles.eventContent}
                onClick={() => {
                  toggleEventExpansion(event.id);
                  onEventSelect?.(event.id);
                }}
              >
                <div className={styles.eventHeader}>
                  <div className={styles.eventTitle}>
                    <span className={styles.eventAction}>{event.action}</span>
                    {event.relatedEntity && (
                      <span className={styles.entityName}>
                        {event.relatedEntity.name}
                      </span>
                    )}
                  </div>

                  <div className={styles.eventMeta}>
                    <span className={styles.eventActor}>
                      {getActorIcon(event.actor.type)}
                      {event.actor.name}
                    </span>
                    <span className={styles.eventTime}>
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                </div>

                <p className={styles.eventDescription}>{event.description}</p>

                {expandedEvents.has(event.id) && event.metadata && (
                  <div className={styles.eventDetails}>
                    <h5>Szczegóły:</h5>
                    <div className={styles.metadataList}>
                      {Object.entries(event.metadata).map(([key, value]) => (
                        <div key={key} className={styles.metadataItem}>
                          <span className={styles.metadataKey}>{key}:</span>
                          <span className={styles.metadataValue}>
                            {typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className={styles.loadingMore}>
          <Clock size={20} />
          <span>Ładowanie więcej wydarzeń...</span>
        </div>
      )}
    </div>
  );
};
