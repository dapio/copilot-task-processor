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
          // Generuj przykładowe projekty z progress i tasks
          const sampleProjects: Project[] = [
            {
              id: 'project-1',
              name: 'E-commerce Platform',
              description: 'Nowoczesna platforma e-commerce z React i Node.js',
              status: 'active',
              createdAt: new Date('2024-01-15'),
              updatedAt: new Date(),
              progress: 75,
              tasks: [
                {
                  id: 'task-1',
                  projectId: 'project-1',
                  title: 'Setup authentication',
                  type: 'automation',
                  status: 'in-progress',
                  priority: 'high',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-15'),
                  updatedAt: new Date('2024-01-15'),
                  progress: 60,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 8,
                    actualDuration: 5,
                    complexity: 'moderate',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-2',
                  projectId: 'project-1',
                  title: 'Product catalog API',
                  type: 'automation',
                  status: 'completed',
                  priority: 'medium',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-16'),
                  updatedAt: new Date('2024-01-20'),
                  completedAt: new Date('2024-01-20'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 12,
                    actualDuration: 10,
                    complexity: 'complex',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-3',
                  projectId: 'project-1',
                  title: 'Payment integration',
                  type: 'automation',
                  status: 'pending',
                  priority: 'high',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-17'),
                  updatedAt: new Date('2024-01-17'),
                  progress: 0,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 16,
                    complexity: 'very-complex',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-4',
                  projectId: 'project-1',
                  title: 'User dashboard',
                  type: 'automation',
                  status: 'completed',
                  priority: 'medium',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-18'),
                  updatedAt: new Date('2024-01-22'),
                  completedAt: new Date('2024-01-22'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 14,
                    actualDuration: 12,
                    complexity: 'complex',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-5',
                  projectId: 'project-1',
                  title: 'Shopping cart',
                  type: 'automation',
                  status: 'completed',
                  priority: 'low',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-19'),
                  updatedAt: new Date('2024-01-25'),
                  completedAt: new Date('2024-01-25'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 10,
                    actualDuration: 8,
                    complexity: 'moderate',
                    resources: [],
                    executionLog: [],
                  },
                },
              ],
              settings: {
                aiModel: 'gpt-4',
                maxTokens: 4000,
                temperature: 0.7,
                enabledFeatures: ['agents', 'workflows', 'tasks'],
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
                totalTasks: 5,
                completedTasks: 3,
                activeWorkflows: 2,
                totalAgents: 3,
                lastActivity: new Date(),
                successRate: 85,
              },
              color: '#667eea',
              tags: ['react', 'nodejs', 'ecommerce'],
              fileStructure: {
                rootPath: '/projects/ecommerce',
                sourceCode: {
                  backend: 'src/backend',
                  frontend: 'src/frontend',
                },
                analysis: {
                  codeAnalysis: 'analysis/code',
                  documentAnalysis: 'analysis/docs',
                  reports: 'analysis/reports',
                  metrics: 'analysis/metrics',
                },
                tasks: {
                  active: 'tasks/active',
                  completed: 'tasks/completed',
                  archived: 'tasks/archived',
                  templates: 'tasks/templates',
                },
                workflows: {
                  definitions: 'workflows/defs',
                  executions: 'workflows/exec',
                  logs: 'workflows/logs',
                },
                mockups: {
                  wireframes: 'mockups/wires',
                  prototypes: 'mockups/proto',
                  assets: 'mockups/assets',
                },
                documentation: {
                  api: 'docs/api',
                  userGuides: 'docs/user',
                  technical: 'docs/tech',
                  generated: 'docs/gen',
                },
                backups: {
                  daily: 'backups/daily',
                  weekly: 'backups/weekly',
                  monthly: 'backups/monthly',
                },
              },
              hasFiles: true,
            },
            {
              id: 'project-2',
              name: 'Mobile Banking App',
              description: 'Bezpieczna aplikacja bankowa dla iOS i Android',
              status: 'paused',
              createdAt: new Date('2024-01-10'),
              updatedAt: new Date(),
              progress: 45,
              tasks: [
                {
                  id: 'task-6',
                  projectId: 'project-2',
                  title: 'Security audit',
                  type: 'automation',
                  status: 'in-progress',
                  priority: 'critical',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-10'),
                  updatedAt: new Date('2024-01-10'),
                  progress: 30,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 20,
                    actualDuration: 6,
                    complexity: 'very-complex',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-7',
                  projectId: 'project-2',
                  title: 'UI/UX design',
                  type: 'automation',
                  status: 'completed',
                  priority: 'medium',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-11'),
                  updatedAt: new Date('2024-01-15'),
                  completedAt: new Date('2024-01-15'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 15,
                    actualDuration: 12,
                    complexity: 'moderate',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-8',
                  projectId: 'project-2',
                  title: 'API endpoints',
                  type: 'automation',
                  status: 'draft',
                  priority: 'high',
                  createdBy: 'user',
                  createdAt: new Date('2024-01-12'),
                  updatedAt: new Date('2024-01-12'),
                  progress: 0,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 18,
                    complexity: 'complex',
                    resources: [],
                    executionLog: [],
                  },
                },
              ],
              settings: {
                aiModel: 'gpt-4',
                maxTokens: 4000,
                temperature: 0.7,
                enabledFeatures: ['agents', 'workflows', 'tasks'],
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
                totalTasks: 3,
                completedTasks: 1,
                activeWorkflows: 1,
                totalAgents: 2,
                lastActivity: new Date(),
                successRate: 65,
              },
              color: '#feca57',
              tags: ['mobile', 'banking', 'security'],
              fileStructure: {
                rootPath: '/projects/banking-app',
                sourceCode: { backend: 'src/api', frontend: 'src/mobile' },
                analysis: {
                  codeAnalysis: 'analysis/code',
                  documentAnalysis: 'analysis/docs',
                  reports: 'analysis/reports',
                  metrics: 'analysis/metrics',
                },
                tasks: {
                  active: 'tasks/active',
                  completed: 'tasks/completed',
                  archived: 'tasks/archived',
                  templates: 'tasks/templates',
                },
                workflows: {
                  definitions: 'workflows/defs',
                  executions: 'workflows/exec',
                  logs: 'workflows/logs',
                },
                mockups: {
                  wireframes: 'mockups/wires',
                  prototypes: 'mockups/proto',
                  assets: 'mockups/assets',
                },
                documentation: {
                  api: 'docs/api',
                  userGuides: 'docs/user',
                  technical: 'docs/tech',
                  generated: 'docs/gen',
                },
                backups: {
                  daily: 'backups/daily',
                  weekly: 'backups/weekly',
                  monthly: 'backups/monthly',
                },
              },
              hasFiles: false,
            },
            {
              id: 'project-3',
              name: 'Data Analytics Dashboard',
              description:
                'Dashboard analityczny z wizualizacją danych biznesowych',
              status: 'completed',
              createdAt: new Date('2023-12-01'),
              updatedAt: new Date(),
              progress: 100,
              tasks: [
                {
                  id: 'task-9',
                  projectId: 'project-3',
                  title: 'Data pipeline',
                  type: 'automation',
                  status: 'completed',
                  priority: 'high',
                  createdBy: 'user',
                  createdAt: new Date('2023-12-01'),
                  updatedAt: new Date('2023-12-10'),
                  completedAt: new Date('2023-12-10'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 20,
                    actualDuration: 18,
                    complexity: 'very-complex',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-10',
                  projectId: 'project-3',
                  title: 'Charts implementation',
                  type: 'automation',
                  status: 'completed',
                  priority: 'medium',
                  createdBy: 'user',
                  createdAt: new Date('2023-12-05'),
                  updatedAt: new Date('2023-12-15'),
                  completedAt: new Date('2023-12-15'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 16,
                    actualDuration: 14,
                    complexity: 'complex',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-11',
                  projectId: 'project-3',
                  title: 'Export functionality',
                  type: 'automation',
                  status: 'completed',
                  priority: 'low',
                  createdBy: 'user',
                  createdAt: new Date('2023-12-10'),
                  updatedAt: new Date('2023-12-20'),
                  completedAt: new Date('2023-12-20'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 8,
                    actualDuration: 7,
                    complexity: 'simple',
                    resources: [],
                    executionLog: [],
                  },
                },
                {
                  id: 'task-12',
                  projectId: 'project-3',
                  title: 'User permissions',
                  type: 'automation',
                  status: 'completed',
                  priority: 'medium',
                  createdBy: 'user',
                  createdAt: new Date('2023-12-12'),
                  updatedAt: new Date('2023-12-22'),
                  completedAt: new Date('2023-12-22'),
                  progress: 100,
                  tags: [],
                  dependencies: [],
                  attachments: [],
                  comments: [],
                  metadata: {
                    estimatedDuration: 12,
                    actualDuration: 10,
                    complexity: 'moderate',
                    resources: [],
                    executionLog: [],
                  },
                },
              ],
              settings: {
                aiModel: 'gpt-4',
                maxTokens: 4000,
                temperature: 0.7,
                enabledFeatures: ['agents', 'workflows', 'tasks'],
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
                totalTasks: 4,
                completedTasks: 4,
                activeWorkflows: 0,
                totalAgents: 1,
                lastActivity: new Date(),
                successRate: 100,
              },
              color: '#00b894',
              tags: ['analytics', 'dashboard', 'visualization'],
              fileStructure: {
                rootPath: '/projects/analytics-dashboard',
                sourceCode: {
                  backend: 'src/backend',
                  frontend: 'src/dashboard',
                },
                analysis: {
                  codeAnalysis: 'analysis/code',
                  documentAnalysis: 'analysis/docs',
                  reports: 'analysis/reports',
                  metrics: 'analysis/metrics',
                },
                tasks: {
                  active: 'tasks/active',
                  completed: 'tasks/completed',
                  archived: 'tasks/archived',
                  templates: 'tasks/templates',
                },
                workflows: {
                  definitions: 'workflows/defs',
                  executions: 'workflows/exec',
                  logs: 'workflows/logs',
                },
                mockups: {
                  wireframes: 'mockups/wires',
                  prototypes: 'mockups/proto',
                  assets: 'mockups/assets',
                },
                documentation: {
                  api: 'docs/api',
                  userGuides: 'docs/user',
                  technical: 'docs/tech',
                  generated: 'docs/gen',
                },
                backups: {
                  daily: 'backups/daily',
                  weekly: 'backups/weekly',
                  monthly: 'backups/monthly',
                },
              },
              hasFiles: true,
            },
          ];
          dispatch({ type: 'SET_PROJECTS', payload: sampleProjects });
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
