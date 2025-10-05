// Git providers
export type GitProvider = 'github' | 'bitbucket' | 'azure-repos' | 'gitlab';

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  provider: GitProvider;
  repositoryUrl: string;
  branch: string;
  lastUpdate: string;
  status: 'active' | 'archived' | 'paused';
  tasksCount: number;
  completedTasks: number;
  language?: string;
  tags?: string[];
}

// Task types
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  labels?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

// Project creation form data
export interface ProjectFormData {
  name: string;
  description: string;
  provider: GitProvider;
  repositoryUrl: string;
  branch: string;
  language: string;
  tags: string[];
}

// Git provider info
export interface GitProviderInfo {
  id: GitProvider;
  name: string;
  icon: string;
  color: string;
  baseUrl: string;
}

// Filter and pagination
export interface ProjectFilters {
  provider?: GitProvider;
  status?: Project['status'];
  language?: string;
  search?: string;
}

export interface TaskFilters {
  projectId?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  assignee?: string;
  search?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Repository connection settings
export interface Repository {
  id: string;
  name: string;
  provider: GitProvider;
  url: string;
  accessToken?: string;
  username?: string;
  isConnected: boolean;
  lastSync?: string;
  branches?: string[];
  defaultBranch: string;
  description?: string;
  isPrivate: boolean;
  owner: string;
}

// Provider connection config
export interface ProviderConfig {
  provider: GitProvider;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  baseUrl?: string;
  isConfigured: boolean;
  lastConnected?: string;
}

// User settings
export interface UserSettings {
  id: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'pl' | 'en';
  notifications: {
    email: boolean;
    browser: boolean;
    taskAssignments: boolean;
    projectUpdates: boolean;
    weeklyReports: boolean;
  };
  defaultView: 'dashboard' | 'projects' | 'tasks';
  itemsPerPage: number;
}
