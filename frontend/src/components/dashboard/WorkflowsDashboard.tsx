/**
 * Workflows Dashboard - Zarządzanie workflow
 * @description Panel do monitorowania i zarządzania workflow projektów
 */

import React, { memo } from 'react';
import { Workflow, Play, Pause, CheckCircle, AlertCircle } from 'lucide-react';
import type { ProjectData } from '../../types/dashboard.types';
import styles from '../../styles/dashboard-workflows.module.css';

interface WorkflowsDashboardProps {
  projects: ProjectData[];
}

export const WorkflowsDashboard = memo<WorkflowsDashboardProps>(
  ({ projects }) => {
    const projectsWithWorkflow = projects.filter(p => p.workflow);

    return (
      <div className={styles.workflowsDashboard}>
        <div className={styles.header}>
          <h2>Zarządzanie Workflow</h2>
          <div className={styles.stats}>
            <span>{projectsWithWorkflow.length} aktywnych workflow</span>
          </div>
        </div>

        <div className={styles.content}>
          {projectsWithWorkflow.length === 0 ? (
            <div className={styles.emptyState}>
              <Workflow size={64} />
              <h3>Brak aktywnych workflow</h3>
              <p>Rozpocznij projekt aby uruchomić workflow</p>
            </div>
          ) : (
            <div className={styles.workflowsList}>
              {projectsWithWorkflow.map(project => {
                if (!project.workflow) return null;

                return (
                  <div key={project.id} className={styles.workflowItem}>
                    <div className={styles.workflowHeader}>
                      <h3>{project.workflow.name}</h3>
                      <span
                        className={`${styles.status} ${
                          styles[project.workflow.status]
                        }`}
                      >
                        {project.workflow.status === 'running' && (
                          <Play size={16} />
                        )}
                        {project.workflow.status === 'paused' && (
                          <Pause size={16} />
                        )}
                        {project.workflow.status === 'completed' && (
                          <CheckCircle size={16} />
                        )}
                        {project.workflow.status === 'failed' && (
                          <AlertCircle size={16} />
                        )}
                        {project.workflow.status}
                      </span>
                    </div>

                    <div className={styles.workflowProgress}>
                      <div className={styles.progressBar}>
                        <div
                          className={`${styles.progressFill} ${
                            styles[
                              `progressFill${Math.round(
                                (project.workflow.currentStep /
                                  project.workflow.steps.length) *
                                  100
                              )}`
                            ] || styles.progressFill0
                          }`}
                        />
                      </div>
                      <span>
                        Krok {project.workflow.currentStep} z{' '}
                        {project.workflow.steps.length}
                      </span>
                    </div>

                    <div className={styles.currentStep}>
                      <h4>Obecny krok:</h4>
                      <p>
                        {
                          project.workflow.steps[
                            project.workflow.currentStep - 1
                          ]?.name
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
);

WorkflowsDashboard.displayName = 'WorkflowsDashboard';
