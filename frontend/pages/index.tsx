import React, { useState } from 'react';
import { ProjectProvider } from '../src/contexts/ProjectContext';
import ProjectSelector from '../src/components/ProjectSelector';
import ProjectDashboard from '../src/components/ProjectDashboard';
import { Project } from '../src/types/project';

interface ProjectContext {
  projectId: string;
  project: Project;
  hasFiles: boolean;
  inputFileCount: number;
  state: string;
  routing: {
    canProceedToDashboard: boolean;
    nextStep: { action: string; message: string };
    recommendedRoute: 'dashboard' | 'upload';
  };
}

export default function HomePage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectContext, setProjectContext] = useState<ProjectContext | null>(
    null
  );
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  /**
   * Fetch project context to determine routing
   */
  const fetchProjectContext = async (
    projectId: string
  ): Promise<ProjectContext | null> => {
    try {
      setIsLoadingContext(true);
      setRoutingError(null);

      const response = await fetch(`/api/projects/${projectId}/context`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch project context: ${response.statusText}`
        );
      }

      const context = await response.json();
      console.log('📊 Project context loaded:', context);

      return context;
    } catch (error) {
      console.error('❌ Error fetching project context:', error);
      setRoutingError(error instanceof Error ? error.message : 'Unknown error');
      return null;
    } finally {
      setIsLoadingContext(false);
    }
  };

  /**
   * Handle project selection with intelligent routing
   */
  const handleProjectSelected = async (project: Project) => {
    console.log(
      '🎯 Project selected:',
      project.name,
      'hasFiles:',
      project.hasFiles
    );

    // Set selected project immediately for UI feedback
    setSelectedProject(project);

    // Fetch detailed context for routing decisions
    const context = await fetchProjectContext(project.id);

    if (context) {
      setProjectContext(context);

      // Log routing decision
      console.log('🚦 Routing decision:', {
        projectState: context.state,
        canProceedToDashboard: context.routing.canProceedToDashboard,
        recommendedRoute: context.routing.recommendedRoute,
        nextStep: context.routing.nextStep,
      });
    }
  };

  /**
   * Reset state and return to project selection
   */
  const handleBackToProjects = () => {
    setSelectedProject(null);
    setProjectContext(null);
    setRoutingError(null);
  };

  // Show loading state while fetching project context
  if (selectedProject && isLoadingContext) {
    return (
      <ProjectProvider>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900">
              Loading project...
            </h3>
            <p className="text-gray-600">Checking project state and files</p>
          </div>
        </div>
      </ProjectProvider>
    );
  }

  // Show error state if context loading failed
  if (selectedProject && routingError) {
    return (
      <ProjectProvider>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Error Loading Project
              </h3>
              <p className="text-red-600 mb-4">{routingError}</p>
              <button
                onClick={handleBackToProjects}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </ProjectProvider>
    );
  }

  // Render project dashboard if project is selected and context is loaded
  if (selectedProject && projectContext) {
    // Smart routing based on project state
    const shouldShowUpload = !projectContext.routing.canProceedToDashboard;

    if (shouldShowUpload) {
      console.log('📁 Redirecting to upload screen - project needs files');
      // For now, still show dashboard but with upload indication
      // In future, this could redirect to a dedicated upload component
    }

    return (
      <ProjectProvider>
        <ProjectDashboard
          project={selectedProject}
          onBackToProjects={handleBackToProjects}
          projectContext={projectContext} // Pass context for enhanced functionality
        />
      </ProjectProvider>
    );
  }

  // Default: show project selector
  return (
    <ProjectProvider>
      <ProjectSelector onProjectSelected={handleProjectSelected} />
    </ProjectProvider>
  );
}
