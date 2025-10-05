import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  FolderOpen,
  GitBranch,
  Activity,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  MessageSquare,
  BarChart3,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Play,
  Pause,
  Square,
} from 'lucide-react';

// Types
interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  capabilities: string;
  isActive: boolean;
  currentWorkload: number;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  workflows: Workflow[];
  _count: {
    workflows: number;
    feedback: number;
    ruleChecks: number;
  };
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  status: string;
  assignedAgent?: Agent;
  startedAt?: string;
  completedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
  timestamp: string;
}

// Custom hooks for API calls
function useAgentsApi() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3003/api/agents');
      const result: ApiResponse<Agent[]> = await response.json();

      if (result.success) {
        setAgents(result.data);
      } else {
        setError('Failed to fetch agents');
      }
    } catch (err) {
      setError(
        `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      // Fallback to mock data for development
      setAgents([
        {
          id: '1',
          name: 'Sarah Chen',
          role: 'Business Analyst',
          description:
            'Requirements analysis and stakeholder management specialist',
          capabilities: 'Requirements Engineering, Stakeholder Communication',
          isActive: true,
          currentWorkload: 0.3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Alex Thompson',
          role: 'Backend Developer',
          description: 'Node.js and database architecture expert',
          capabilities: 'Node.js, TypeScript, Database Design',
          isActive: true,
          currentWorkload: 0.7,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  }, []);

  const updateAgentStatus = useCallback(
    async (agentId: string, isActive: boolean, currentWorkload?: number) => {
      try {
        const response = await fetch(
          `http://localhost:3003/api/agents/${agentId}/status`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isActive, currentWorkload }),
          }
        );

        const result = await response.json();
        if (result.success) {
          await fetchAgents(); // Refresh agents list
        }
        return result;
      } catch (err) {
        console.error('Error updating agent status:', err);
        return { success: false, error: err };
      }
    },
    [fetchAgents]
  );

  return { agents, loading, error, fetchAgents, updateAgentStatus };
}

function useProjectsApi() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3003/api/projects');
      const result: ApiResponse<Project[]> = await response.json();

      if (result.success) {
        setProjects(result.data);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      setError(
        `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      // Fallback to mock data
      setProjects([
        {
          id: '1',
          name: 'E-commerce Platform',
          description: 'Modern e-commerce solution with AI recommendations',
          type: 'web-application',
          status: 'in-progress',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workflows: [],
          _count: { workflows: 3, feedback: 2, ruleChecks: 15 },
        },
        {
          id: '2',
          name: 'Mobile Banking App',
          description: 'Secure mobile banking application',
          type: 'mobile-app',
          status: 'planning',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          workflows: [],
          _count: { workflows: 1, feedback: 0, ruleChecks: 5 },
        },
      ]);
    }
    setLoading(false);
  }, []);

  const createProject = useCallback(
    async (projectData: {
      name: string;
      description: string;
      type: string;
    }) => {
      try {
        const response = await fetch('http://localhost:3003/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(projectData),
        });

        const result = await response.json();
        if (result.success) {
          await fetchProjects(); // Refresh projects list
        }
        return result;
      } catch (err) {
        console.error('Error creating project:', err);
        return { success: false, error: err };
      }
    },
    [fetchProjects]
  );

  const updateProjectStatus = useCallback(
    async (projectId: string, status: string) => {
      try {
        const response = await fetch(
          `http://localhost:3003/api/projects/${projectId}/status`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          }
        );

        const result = await response.json();
        if (result.success) {
          await fetchProjects(); // Refresh projects list
        }
        return result;
      } catch (err) {
        console.error('Error updating project status:', err);
        return { success: false, error: err };
      }
    },
    [fetchProjects]
  );

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProjectStatus,
  };
}

// Components
function Sidebar({
  currentView,
  setCurrentView,
}: {
  currentView: string;
  setCurrentView: (view: string) => void;
}) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'projects', label: 'Projects', icon: FolderOpen },
    { id: 'agents', label: 'AI Agents', icon: Users },
    { id: 'workflows', label: 'Workflows', icon: GitBranch },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ThinkCode AI</h1>
            <p className="text-xs text-gray-500">Project Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === item.id
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>System Status: Online</span>
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  const { agents, loading: agentsLoading } = useAgentsApi();
  const { projects, loading: projectsLoading } = useProjectsApi();

  const stats = [
    {
      label: 'Active Projects',
      value: projects.filter(p => p.status === 'in-progress').length,
      icon: Target,
      color: 'bg-blue-500',
    },
    {
      label: 'AI Agents',
      value: agents.filter(a => a.isActive).length,
      icon: Users,
      color: 'bg-green-500',
    },
    {
      label: 'Avg. Workload',
      value: `${Math.round((agents.reduce((sum, a) => sum + a.currentWorkload, 0) / agents.length) * 100)}%`,
      icon: BarChart3,
      color: 'bg-yellow-500',
    },
    {
      label: 'Completed Today',
      value: projects.filter(p => p.status === 'completed').length,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Overview of your AI-powered development platform
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Projects
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {projectsLoading ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              projects.slice(0, 3).map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {project.name}
                    </h3>
                    <p className="text-sm text-gray-500">{project.type}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      project.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : project.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Agent Status
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {agentsLoading ? (
              <div className="flex justify-center py-4">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              agents.slice(0, 4).map(agent => (
                <div
                  key={agent.id}
                  className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {agent.name}
                      </h3>
                      <p className="text-sm text-gray-500">{agent.role}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {Math.round(agent.currentWorkload * 100)}%
                    </div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                      <div
                        className="h-2 bg-blue-500 rounded-full transition-all"
                        style={{ width: `${agent.currentWorkload * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectsView() {
  const {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProjectStatus,
  } = useProjectsApi();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(project => {
    const matchesFilter =
      filterStatus === 'all' || project.status === filterStatus;
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateProject = async (formData: FormData) => {
    const projectData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
    };

    const result = await createProject(projectData);
    if (result.success) {
      setShowCreateForm(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-2">
            Manage your development projects and teams
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
        </select>
        <button
          onClick={fetchProjects}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? // Loading skeleton
            [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          : filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onUpdateStatus={updateProjectStatus}
              />
            ))}
      </div>

      {/* Create Project Modal */}
      {showCreateForm && (
        <CreateProjectModal
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onUpdateStatus,
}: {
  project: Project;
  onUpdateStatus: (id: string, status: string) => Promise<any>;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {project.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {project.description}
          </p>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <span className="capitalize">{project.type.replace('-', ' ')}</span>
        <span className="flex items-center space-x-1">
          <Calendar className="h-3 w-3" />
          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
        </span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            project.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : project.status === 'in-progress'
                ? 'bg-blue-100 text-blue-800'
                : project.status === 'on-hold'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {project.status.replace('-', ' ')}
        </span>
        <div className="flex space-x-2">
          {project.status === 'planning' && (
            <button
              onClick={() => onUpdateStatus(project.id, 'in-progress')}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <Play className="h-3 w-3" />
              <span>Start</span>
            </button>
          )}
          {project.status === 'in-progress' && (
            <button
              onClick={() => onUpdateStatus(project.id, 'on-hold')}
              className="flex items-center space-x-1 px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100"
            >
              <Pause className="h-3 w-3" />
              <span>Pause</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex space-x-4">
          <span className="flex items-center space-x-1">
            <GitBranch className="h-3 w-3" />
            <span>{project._count.workflows} workflows</span>
          </span>
          <span className="flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>{project._count.feedback} feedback</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function CreateProjectModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>×
          </button>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            onSubmit(new FormData(e.currentTarget));
          }}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter project name"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe your project"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Type
              </label>
              <select
                id="type"
                name="type"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select project type</option>
                <option value="web-application">Web Application</option>
                <option value="mobile-app">Mobile App</option>
                <option value="api-service">API Service</option>
                <option value="data-analysis">Data Analysis</option>
                <option value="automation">Automation</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgentsView() {
  const { agents, loading, error, fetchAgents, updateAgentStatus } =
    useAgentsApi();
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = agents.filter(agent => {
    const matchesRole = filterRole === 'all' || agent.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && agent.isActive) ||
      (filterStatus === 'inactive' && !agent.isActive);
    return matchesRole && matchesStatus;
  });

  const roles = [...new Set(agents.map(agent => agent.role))];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-500 mt-2">Manage your AI development team</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={fetchAgents}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 mb-6">
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading
          ? [...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))
          : filteredAgents.map(agent => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onUpdateStatus={updateAgentStatus}
              />
            ))}
      </div>
    </div>
  );
}

function AgentCard({
  agent,
  onUpdateStatus,
}: {
  agent: Agent;
  onUpdateStatus: (
    id: string,
    isActive: boolean,
    workload?: number
  ) => Promise<any>;
}) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`}
          />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {agent.name}
            </h3>
            <p className="text-blue-600 text-sm font-medium">{agent.role}</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {agent.description}
      </p>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Workload</span>
          <span className="text-sm font-semibold text-gray-900">
            {Math.round(agent.currentWorkload * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full">
          <div
            className={`h-2 rounded-full transition-all ${
              agent.currentWorkload > 0.8
                ? 'bg-red-500'
                : agent.currentWorkload > 0.6
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${agent.currentWorkload * 100}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>Capabilities: {agent.capabilities.split(',').length}</span>
        </div>
        <button
          onClick={() => onUpdateStatus(agent.id, !agent.isActive)}
          className={`px-3 py-1 rounded-lg text-xs font-medium ${
            agent.isActive
              ? 'bg-red-50 text-red-700 hover:bg-red-100'
              : 'bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {agent.isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
}

// Main Component
export default function EnterpriseManagementDashboard() {
  const [currentView, setCurrentView] = useState('dashboard');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'projects':
        return <ProjectsView />;
      case 'agents':
        return <AgentsView />;
      case 'workflows':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold">Workflows (Coming Soon)</h1>
          </div>
        );
      case 'communications':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold">Communications (Coming Soon)</h1>
          </div>
        );
      case 'settings':
        return (
          <div className="p-8">
            <h1 className="text-2xl font-bold">Settings (Coming Soon)</h1>
          </div>
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-auto">{renderView()}</main>
    </div>
  );
}
