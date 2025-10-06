import React from 'react';
import { Activity, Bot, Settings, Target, Users } from 'lucide-react';
import styles from '../../styles/project-details-dashboard.module.css';
import type { ProjectData, TaskData, Agent } from '../../types/dashboard.types';

interface ProjectOverviewSectionProps {
  project: ProjectData;
  projectTasks: TaskData[];
  projectAgents: Agent[];
  projectHistory: any[];
  formatDate: (dateString: string) => string;
  getStatusIcon: (status: string) => React.ReactNode;
  getPriorityColor: (priority: string) => string;
}

export const ProjectOverviewSection: React.FC<ProjectOverviewSectionProps> = ({
  project,
  projectTasks,
  projectAgents,
  projectHistory,
  formatDate,
  getStatusIcon,
  getPriorityColor,
}) => (
  <div className={styles.overviewSection}>
    {/* Project Header */}
    <div className={styles.projectHeader}>
      <div className={styles.projectTitleSection}>
        <h1>{project.name}</h1>
        <div className={styles.projectMeta}>
          <span className={`${styles.status} ${styles[project.status]}`}>
            {getStatusIcon(project.status)}
            {project.status}
          </span>
          <span
            className={`${styles.priority} ${
              styles[getPriorityColor(project.priority)]
            }`}
          >
            {project.priority}
          </span>
        </div>
      </div>
      <div className={styles.projectActions}>
        <button className={styles.editButton}>Edytuj projekt</button>
      </div>
    </div>
    {/* Project Info Grid */}
    <div className={styles.infoGrid}>
      <div className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <Target size={20} />
          <h3>Informacje podstawowe</h3>
        </div>
        <div className={styles.infoContent}>
          <p>
            <strong>Opis:</strong> {project.description}
          </p>
          {project.client && (
            <p>
              <strong>Klient:</strong> {project.client}
            </p>
          )}
          <p>
            <strong>Data rozpoczęcia:</strong> {formatDate(project.startDate)}
          </p>
          {project.endDate && (
            <p>
              <strong>Planowane zakończenie:</strong>{' '}
              {formatDate(project.endDate)}
            </p>
          )}
          {project.budget && (
            <p>
              <strong>Budżet:</strong> {project.budget.toLocaleString('pl-PL')}{' '}
              PLN
            </p>
          )}
        </div>
      </div>
      <div className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <Activity size={20} />
          <h3>Postęp projektu</h3>
        </div>
        <div className={styles.infoContent}>
          <div className={styles.progressSection}>
            <div className={styles.progressHeader}>
              <span>Ogólny postęp</span>
              <span>{project.progress}%</span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                data-progress={project.progress}
              />
            </div>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{projectTasks.length}</span>
              <span className={styles.statLabel}>Zadania</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {projectTasks.filter(t => t.status === 'done').length}
              </span>
              <span className={styles.statLabel}>Ukończone</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{projectAgents.length}</span>
              <span className={styles.statLabel}>Agenci</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.infoCard}>
        <div className={styles.infoHeader}>
          <Users size={20} />
          <h3>Zespół projektu</h3>
        </div>
        <div className={styles.infoContent}>
          <div className={styles.teamList}>
            {projectAgents.slice(0, 5).map(agent => (
              <div key={agent.id} className={styles.teamMember}>
                <Bot size={16} />
                <span>{agent.name}</span>
                <span
                  className={`${styles.agentStatus} ${styles[agent.status]}`}
                >
                  {agent.status}
                </span>
              </div>
            ))}
            {projectAgents.length > 5 && (
              <div className={styles.moreMembers}>
                +{projectAgents.length - 5} więcej...
              </div>
            )}
          </div>
        </div>
      </div>
      {project.technologies && (
        <div className={styles.infoCard}>
          <div className={styles.infoHeader}>
            <Settings size={20} />
            <h3>Technologie</h3>
          </div>
          <div className={styles.infoContent}>
            <div className={styles.technologiesList}>
              {project.technologies.map(tech => (
                <span key={tech} className={styles.techBadge}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    {/* Recent Activity */}
    <div className={styles.recentActivity}>
      <h3>Ostatnia aktywność</h3>
      <div className={styles.activityList}>
        {projectHistory.slice(0, 5).map((event, index) => (
          <div key={index} className={styles.activityItem}>
            <div className={styles.activityIcon}>
              <Activity size={16} />
            </div>
            <div className={styles.activityContent}>
              <span className={styles.activityText}>{event.description}</span>
              <span className={styles.activityTime}>{event.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
