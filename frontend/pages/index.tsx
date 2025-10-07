/**
 * Main Home Page
 * ThinkCode AI Platform - Project-based AI Platform
 */

import React, { useState } from 'react';
import { ProjectProvider } from '../src/contexts/ProjectContext';
import ProjectSelector from '../src/components/ProjectSelector';
import ProjectDashboard from '../src/components/ProjectDashboard';
import { Project } from '../src/types/project';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleProjectSelected = (project: Project) => {
    setSelectedProject(project);
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
  };

  return (
    <ProjectProvider>
      <div className={styles.container}>
        {!selectedProject ? (
          <ProjectSelector onProjectSelected={handleProjectSelected} />
        ) : (
          <ProjectDashboard
            project={selectedProject}
            onBackToProjects={handleBackToProjects}
          />
        )}
      </div>
    </ProjectProvider>
  );
}
