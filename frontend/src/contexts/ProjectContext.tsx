/**
 * Project Context Provider
 * ThinkCode AI Platform - Global Project State Management
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from 'react';
import {
  Project,
  ProjectContextState,
  ProjectContextActions,
  CreateProjectForm,
  UpdateProjectForm,
  RepositoryConfig,
} from '../types/project';

interface ProjectContextValue
  extends ProjectContextState,
    ProjectContextActions {}

const ProjectContext = createContext<ProjectContextValue | null>(null);

// Actions
type ProjectAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'SET_CURRENT_PROJECT'; payload: Project | null }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'REMOVE_PROJECT'; payload: string };

// Reducer
function projectReducer(
  state: ProjectContextState,
  action: ProjectAction
): ProjectContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_PROJECTS':
      return {
        ...state,
        projects: action.payload,
        loading: false,
        error: null,
      };

    case 'SET_CURRENT_PROJECT':
      return { ...state, currentProject: action.payload };

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
        error: null,
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
        currentProject:
          state.currentProject?.id === action.payload.id
            ? action.payload
            : state.currentProject,
        error: null,
      };

    case 'REMOVE_PROJECT': {
      const updatedProjects = state.projects.filter(
        p => p.id !== action.payload
      );
      return {
        ...state,
        projects: updatedProjects,
        currentProject:
          state.currentProject?.id === action.payload
            ? null
            : state.currentProject,
        error: null,
      };
    }

    default:
      return state;
  }
}

// Initial state
const initialState: ProjectContextState = {
  currentProject: null,
  projects: [],
  loading: false,
  error: null,
};

interface ProjectProviderProps {
  children: React.ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // Load projects from localStorage and API
  const loadProjects = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Try to load from localStorage first
      const cachedProjects = localStorage.getItem('thinkcode_projects');
      if (cachedProjects) {
        const projects = JSON.parse(cachedProjects).map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          stats: {
            ...p.stats,
            lastActivity: new Date(p.stats.lastActivity),
          },
        }));
        dispatch({ type: 'SET_PROJECTS', payload: projects });
      }

      // TODO: Load from API
      // const response = await projectService.getProjects();
      // dispatch({ type: 'SET_PROJECTS', payload: response.projects });
    } catch (error) {
      console.error('Error loading projects:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Nie udało się załadować projektów',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Create new project
  const createProject = useCallback(
    async (projectForm: CreateProjectForm): Promise<Project> => {
      try {
        const projectId = `project_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        const newProject: Project = {
          id: projectId,
          name: projectForm.name,
          description: projectForm.description,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            aiModel: 'gpt-4',
            maxTokens: 4096,
            temperature: 0.7,
            enabledFeatures: ['agents', 'workflows', 'tasks', 'mockups'],
            defaultAgentType: 'document-processor',
            workflowTimeout: 3600,
            notifications: {
              email: true,
              taskCompletion: true,
              workflowErrors: true,
              agentUpdates: false,
            },
            ...projectForm.settings,
          },
          stats: {
            totalTasks: 0,
            completedTasks: 0,
            activeWorkflows: 0,
            totalAgents: 0,
            lastActivity: new Date(),
            successRate: 100,
          },
          color: projectForm.color || '#667eea',
          tags: projectForm.tags || [],
          repository:
            projectForm.repository && projectForm.repository.type
              ? (projectForm.repository as RepositoryConfig)
              : undefined,
          fileStructure: {
            rootPath: `projects/${projectId}`,
            sourceCode: {
              backend: 'backend/',
              frontend: 'frontend/',
              shared: 'shared/',
              database: 'database/',
              config: 'config/',
            },
            analysis: {
              codeAnalysis: 'analysis/code/',
              documentAnalysis: 'analysis/docs/',
              reports: 'analysis/reports/',
              metrics: 'analysis/metrics/',
            },
            tasks: {
              active: 'tasks/active/',
              completed: 'tasks/completed/',
              archived: 'tasks/archived/',
              templates: 'tasks/templates/',
            },
            workflows: {
              definitions: 'workflows/definitions/',
              executions: 'workflows/executions/',
              logs: 'workflows/logs/',
            },
            mockups: {
              wireframes: 'mockups/wireframes/',
              prototypes: 'mockups/prototypes/',
              assets: 'mockups/assets/',
            },
            documentation: {
              api: 'docs/api/',
              userGuides: 'docs/user/',
              technical: 'docs/technical/',
              generated: 'docs/generated/',
            },
            backups: {
              daily: 'backups/daily/',
              weekly: 'backups/weekly/',
              monthly: 'backups/monthly/',
            },
          },
        };

        // Create project directory structure
        const fileService = await import('../services/projectFileService');
        const fileResult =
          await fileService.projectFileService.createProjectStructure(
            newProject
          );

        if (!fileResult.success) {
          console.warn(
            'Failed to create project structure:',
            fileResult.message
          );
        }

        // Save to localStorage
        const currentProjects = JSON.parse(
          localStorage.getItem('thinkcode_projects') || '[]'
        );
        const updatedProjects = [...currentProjects, newProject];
        localStorage.setItem(
          'thinkcode_projects',
          JSON.stringify(updatedProjects)
        );

        dispatch({ type: 'ADD_PROJECT', payload: newProject });

        // TODO: Save to API
        // const savedProject = await projectService.createProject(newProject);

        return newProject;
      } catch (error) {
        console.error('Error creating project:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Nie udało się utworzyć projektu',
        });
        throw error;
      }
    },
    []
  );

  // Update project
  const updateProject = useCallback(
    async (projectForm: UpdateProjectForm): Promise<Project> => {
      try {
        const currentProjects = JSON.parse(
          localStorage.getItem('thinkcode_projects') || '[]'
        );
        const projectIndex = currentProjects.findIndex(
          (p: Project) => p.id === projectForm.id
        );

        if (projectIndex === -1) {
          throw new Error('Projekt nie został znaleziony');
        }

        const updatedProject = {
          ...currentProjects[projectIndex],
          ...projectForm,
          updatedAt: new Date(),
        };

        currentProjects[projectIndex] = updatedProject;
        localStorage.setItem(
          'thinkcode_projects',
          JSON.stringify(currentProjects)
        );

        dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });

        // TODO: Update in API
        // const savedProject = await projectService.updateProject(updatedProject);

        return updatedProject;
      } catch (error) {
        console.error('Error updating project:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Nie udało się zaktualizować projektu',
        });
        throw error;
      }
    },
    []
  );

  // Delete project
  const deleteProject = useCallback(
    async (projectId: string): Promise<void> => {
      try {
        const currentProjects = JSON.parse(
          localStorage.getItem('thinkcode_projects') || '[]'
        );
        const filteredProjects = currentProjects.filter(
          (p: Project) => p.id !== projectId
        );
        localStorage.setItem(
          'thinkcode_projects',
          JSON.stringify(filteredProjects)
        );

        dispatch({ type: 'REMOVE_PROJECT', payload: projectId });

        // TODO: Delete from API
        // await projectService.deleteProject(projectId);
      } catch (error) {
        console.error('Error deleting project:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Nie udało się usunąć projektu',
        });
        throw error;
      }
    },
    []
  );

  // Set current project
  const setCurrentProject = useCallback((project: Project | null) => {
    dispatch({ type: 'SET_CURRENT_PROJECT', payload: project });

    // Save current project to localStorage
    if (project) {
      localStorage.setItem('thinkcode_current_project', project.id);
    } else {
      localStorage.removeItem('thinkcode_current_project');
    }
  }, []);

  // Refresh current project
  const refreshCurrentProject = useCallback(async () => {
    if (!state.currentProject) return;

    try {
      // TODO: Refresh from API
      // const refreshedProject = await projectService.getProject(state.currentProject.id);
      // dispatch({ type: 'SET_CURRENT_PROJECT', payload: refreshedProject });
    } catch (error) {
      console.error('Error refreshing current project:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Nie udało się odświeżyć projektu',
      });
    }
  }, [state.currentProject]);

  // Load projects and current project on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Restore current project from localStorage
  useEffect(() => {
    const currentProjectId = localStorage.getItem('thinkcode_current_project');
    if (currentProjectId && state.projects.length > 0) {
      const currentProject = state.projects.find(
        p => p.id === currentProjectId
      );
      if (currentProject && !state.currentProject) {
        setCurrentProject(currentProject);
      }
    }
  }, [state.projects, state.currentProject, setCurrentProject]);

  const contextValue: ProjectContextValue = {
    ...state,
    setCurrentProject,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    refreshCurrentProject,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook to use project context
export function useProject() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

// Hook to get current project (throws if no project selected)
export function useCurrentProject() {
  const { currentProject } = useProject();
  if (!currentProject) {
    throw new Error('No project selected. Please select a project first.');
  }
  return currentProject;
}
