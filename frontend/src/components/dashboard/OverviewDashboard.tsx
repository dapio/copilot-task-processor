/**
 * Overview Dashboard - Główny widok przeglądu
 * @description Wyświetla kluczowe metryki i aktywne projekty
 */

import React, { memo } from 'react';
import Image from 'next/image';
import {
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Target,
} from 'lucide-react';
import type {
  DashboardMetrics,
  ProjectData,
  Agent,
} from '../../types/dashboard.types';
import styles from '../../styles/dashboard-overview.module.css';

interface OverviewDashboardProps {
  metrics: DashboardMetrics | null;
  projects: ProjectData[];
  agents: Agent[];
}

export const OverviewDashboard = memo<OverviewDashboardProps>(
  ({ metrics, projects, agents }) => {
    const activeProjects = projects.filter(p => p.status === 'active');
    const urgentProjects = projects.filter(p => p.priority === 'urgent');
    const onlineAgents = agents.filter(
      a => a.status === 'online' || a.status === 'busy'
    );

    const metricCards = [
      {
        title: 'Aktywne Projekty',
        value: activeProjects.length,
        total: projects.length,
        icon: Activity,
        color: 'blue',
        trend: '+12%',
      },
      {
        title: 'Zespół Online',
        value: onlineAgents.length,
        total: agents.length,
        icon: Users,
        color: 'green',
        trend: '100%',
      },
      {
        title: 'Ukończone w tym miesiącu',
        value: metrics?.monthlyProjectsCompleted || 0,
        total: null,
        icon: CheckCircle,
        color: 'success',
        trend: '+8%',
      },
      {
        title: 'Średni postęp',
        value: Math.round(metrics?.averageProjectCompletion || 0),
        total: 100,
        icon: Target,
        color: 'purple',
        trend: '+5%',
      },
    ];

    return (
      <div className={styles.overview}>
        {/* Header */}
        <div className={styles.header}>
          <h2>Przegląd Platformy</h2>
          <div className={styles.subtitle}>
            Aktualny status projektów i zespołu agentów
          </div>
        </div>

        {/* Metrics Cards */}
        <div className={styles.metricsGrid}>
          {metricCards.map((metric, index) => {
            const IconComponent = metric.icon;
            return (
              <div
                key={index}
                className={`${styles.metricCard} ${styles[metric.color]}`}
              >
                <div className={styles.metricHeader}>
                  <IconComponent size={24} className={styles.metricIcon} />
                  <span className={styles.metricTrend}>{metric.trend}</span>
                </div>
                <div className={styles.metricContent}>
                  <div className={styles.metricValue}>
                    {metric.value}
                    {metric.total && (
                      <span className={styles.metricTotal}>
                        /{metric.total}
                      </span>
                    )}
                    {metric.title === 'Średni postęp' && (
                      <span className={styles.metricUnit}>%</span>
                    )}
                  </div>
                  <div className={styles.metricTitle}>{metric.title}</div>
                </div>
                {metric.total && metric.title !== 'Średni postęp' && (
                  <div className={styles.metricProgress}>
                    <div
                      className={`${styles.metricProgressBar} ${
                        styles[
                          `metricProgressBar${Math.round(
                            (metric.value / metric.total) * 100
                          )}`
                        ] || styles.metricProgressBar0
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Active Projects & Team Status */}
        <div className={styles.contentGrid}>
          {/* Active Projects */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Aktywne Projekty</h3>
              <span className={styles.badge}>{activeProjects.length}</span>
            </div>
            <div className={styles.projectsList}>
              {activeProjects.length === 0 ? (
                <div className={styles.emptyState}>
                  <Clock size={48} />
                  <p>Brak aktywnych projektów</p>
                </div>
              ) : (
                activeProjects.slice(0, 5).map(project => (
                  <div key={project.id} className={styles.projectItem}>
                    <div className={styles.projectInfo}>
                      <h4>{project.name}</h4>
                      <p>{project.description}</p>
                      <div className={styles.projectMeta}>
                        <span
                          className={`${styles.status} ${
                            styles[project.status]
                          }`}
                        >
                          {project.status}
                        </span>
                        <span
                          className={`${styles.priority} ${
                            styles[project.priority]
                          }`}
                        >
                          {project.priority}
                        </span>
                      </div>
                    </div>
                    <div className={styles.projectProgress}>
                      <div className={styles.progressValue}>
                        {project.progress}%
                      </div>
                      <div className={styles.progressBar}>
                        <div
                          className={`${styles.progressFill} ${
                            styles[`progressFill${project.progress}`] ||
                            styles.progressFill0
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team Status */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Status Zespołu</h3>
              <span className={styles.badge}>{onlineAgents.length} online</span>
            </div>
            <div className={styles.agentsList}>
              {onlineAgents.length === 0 ? (
                <div className={styles.emptyState}>
                  <Users size={48} />
                  <p>Wszyscy agenci offline</p>
                </div>
              ) : (
                onlineAgents.slice(0, 6).map(agent => (
                  <div key={agent.id} className={styles.agentItem}>
                    <div className={styles.agentAvatar}>
                      {agent.avatar ? (
                        <Image
                          src={agent.avatar}
                          alt={agent.name}
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {agent.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')}
                        </div>
                      )}
                      <span
                        className={`${styles.statusIndicator} ${
                          styles[agent.status]
                        }`}
                      />
                    </div>
                    <div className={styles.agentInfo}>
                      <h4>{agent.name}</h4>
                      <p>{agent.role}</p>
                      {agent.currentTask && (
                        <div className={styles.currentTask}>
                          <Clock size={14} />
                          <span>{agent.currentTask}</span>
                        </div>
                      )}
                    </div>
                    <div className={styles.agentStats}>
                      {agent.successRate && (
                        <div className={styles.stat}>
                          <TrendingUp size={16} />
                          <span>{agent.successRate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Urgent Projects Alert */}
        {urgentProjects.length > 0 && (
          <div className={styles.alertSection}>
            <div className={styles.alert}>
              <AlertTriangle size={24} />
              <div className={styles.alertContent}>
                <h4>Pilne Projekty</h4>
                <p>
                  {urgentProjects.length} projekt
                  {urgentProjects.length > 1 ? 'y' : ''} wymaga
                  {urgentProjects.length === 1 ? '' : 'ją'} natychmiastowej
                  uwagi
                </p>
              </div>
              <div className={styles.alertProjects}>
                {urgentProjects.map(project => (
                  <span key={project.id} className={styles.urgentProject}>
                    {project.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

OverviewDashboard.displayName = 'OverviewDashboard';
