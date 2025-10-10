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
import { agentsApiService } from '../services/agentsApiService';

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
  const loadProjects = useCallback(async (retryCount = 0) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      console.log(
        `🔄 Loading projects from API... (attempt ${retryCount + 1})`
      );

      // Add small delay to allow backend to fully start
      if (retryCount === 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Load projects from backend API - backend returns array directly, not ApiResponse wrapper
      const projects = await agentsApiService.getProjects();
      console.log('📦 API response:', projects);

      if (projects && Array.isArray(projects)) {
        // Transform API response to match our Project interface
        const transformedProjects = projects.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          settings: p.settings || {
            aiModel: 'gpt-4',
            maxTokens: 4000,
            temperature: 0.7,
            enabledFeatures: [],
            defaultAgentType: 'general',
            workflowTimeout: 300,
            notifications: {
              email: true,
              taskCompletion: true,
              workflowErrors: true,
              agentUpdates: false,
            },
          },
          stats: {
            ...(p.stats ?? {}),
            totalTasks: p.stats?.totalTasks ?? 0,
            completedTasks: p.stats?.completedTasks ?? 0,
            activeWorkflows: p.stats?.activeWorkflows ?? 0,
            totalAgents: p.stats?.totalAgents ?? 0,
            lastActivity: p.stats?.lastActivity
              ? new Date(p.stats.lastActivity)
              : new Date(p.updatedAt ?? p.createdAt ?? Date.now()),
            successRate: p.stats?.successRate ?? 0,
          },
          color: p.color || '#667eea',
          tags: p.tags || [],
          fileStructure: p.fileStructure || {
            rootPath: '',
            sourceCode: {},
            analysis: {},
            tasks: {},
            workflows: {},
            mockups: {},
            documentation: {},
            backups: {},
          },
        }));

        console.log('✅ Loaded', transformedProjects.length, 'projects');
        dispatch({ type: 'SET_PROJECTS', payload: transformedProjects });

        // Cache in localStorage for faster loading
        localStorage.setItem(
          'thinkcode_projects',
          JSON.stringify(transformedProjects)
        );
      } else {
        console.warn('⚠️ API returned unexpected format:', projects);
        dispatch({ type: 'SET_PROJECTS', payload: [] });
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);

      // Retry up to 3 times with exponential backoff
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 2000; // 2s, 4s delays
        console.log(`⏳ Retrying in ${delay}ms...`);
        setTimeout(() => {
          loadProjects(retryCount + 1);
        }, delay);
        return; // Don't set error state yet, we're retrying
      }

      dispatch({
        type: 'SET_ERROR',
        payload: 'Nie udało się załadować projektów z serwera',
      });

      // Try to fall back to localStorage
      try {
        const cachedProjects = localStorage.getItem('thinkcode_projects');
        if (cachedProjects) {
          const projects = JSON.parse(cachedProjects);
          console.log('📦 Using cached projects as fallback');
          dispatch({ type: 'SET_PROJECTS', payload: projects });
        } else {
          dispatch({ type: 'SET_PROJECTS', payload: [] });
        }
      } catch (cacheError) {
        console.error('❌ Cache fallback failed:', cacheError);
        dispatch({ type: 'SET_PROJECTS', payload: [] });
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Create new project
  const createProject = useCallback(
    async (projectForm: CreateProjectForm): Promise<Project> => {
      try {
        console.log('🚀 Creating new project:', projectForm.name);

        // Create project via API - backend returns project directly
        const apiProject = await agentsApiService.createProject({
          name: projectForm.name,
          description: projectForm.description,
          type: 'new-application',
        });

        console.log('✅ Project created via API:', apiProject);

        // Convert API response to our Project format with full structure
        const newProject: Project = {
          id: apiProject.id,
          name: apiProject.name,
          description: apiProject.description || '',
          status: 'active',
          createdAt: new Date(apiProject.createdAt),
          updatedAt: new Date(apiProject.updatedAt || apiProject.createdAt),
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
          hasFiles: false, // New project has no files initially
          fileStructure: {
            rootPath: `projects/${apiProject.id}`,
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
        const fileService = await import('../services/projectFileManager');
        const fileResult =
          await fileService.projectFileManager.createProjectStructure(
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
