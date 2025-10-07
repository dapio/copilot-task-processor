/**
 * Project Management Types
 * ThinkCode AI Platform - Frontend Project Context System
 */

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  stats: ProjectStats;
  color?: string;
  tags: string[];
  repository?: RepositoryConfig;
  fileStructure: ProjectFileStructure;
}

export interface ProjectSettings {
  aiModel: string;
  maxTokens: number;
  temperature: number;
  enabledFeatures: string[];
  defaultAgentType: string;
  workflowTimeout: number;
  notifications: NotificationSettings;
}

export interface NotificationSettings {
  email: boolean;
  taskCompletion: boolean;
  workflowErrors: boolean;
  agentUpdates: boolean;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  activeWorkflows: number;
  totalAgents: number;
  lastActivity: Date;
  successRate: number;
}

export interface Agent {
  id: string;
  projectId: string;
  name: string;
  type:
    | 'document-processor'
    | 'task-automation'
    | 'workflow-manager'
    | 'data-analyst'
    | 'custom';
  status: 'active' | 'inactive' | 'error' | 'training';
  description?: string;
  configuration: AgentConfiguration;
  metrics: AgentMetrics;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface AgentConfiguration {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt: string;
  tools: string[];
  capabilities: string[];
  constraints: AgentConstraints;
}

export interface AgentConstraints {
  maxExecutionTime: number;
  maxMemoryUsage: number;
  allowedDomains: string[];
  rateLimits: RateLimit[];
}

export interface RateLimit {
  operation: string;
  requestsPerMinute: number;
  requestsPerHour: number;
}

export interface AgentMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecution: Date | null;
  errorRate: number;
}

export interface Task {
  id: string;
  projectId: string;
  agentId?: string;
  title: string;
  description?: string;
  type:
    | 'document-processing'
    | 'data-analysis'
    | 'automation'
    | 'workflow-execution'
    | 'custom';
  status:
    | 'draft'
    | 'pending'
    | 'in-progress'
    | 'completed'
    | 'failed'
    | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  progress: number;
  tags: string[];
  dependencies: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  metadata: TaskMetadata;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskComment {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TaskMetadata {
  estimatedDuration?: number;
  actualDuration?: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  resources: string[];
  executionLog: ExecutionLogEntry[];
}

export interface ExecutionLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  data?: any;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  version: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  triggers: WorkflowTrigger[];
  steps: WorkflowStep[];
  settings: WorkflowSettings;
  metrics: WorkflowMetrics;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  tags: string[];
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'scheduled' | 'event' | 'webhook' | 'file-upload';
  configuration: TriggerConfiguration;
  enabled: boolean;
}

export interface TriggerConfiguration {
  schedule?: string; // cron expression
  event?: string;
  conditions?: TriggerCondition[];
  webhookUrl?: string;
  filePattern?: string;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater-than' | 'less-than' | 'exists';
  value: any;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type:
    | 'agent-execution'
    | 'data-processing'
    | 'notification'
    | 'condition'
    | 'delay'
    | 'custom';
  agentId?: string;
  configuration: StepConfiguration;
  position: { x: number; y: number };
  connections: StepConnection[];
  retryPolicy: RetryPolicy;
}

export interface StepConfiguration {
  timeout?: number;
  parameters: Record<string, any>;
  outputMapping?: Record<string, string>;
  errorHandling: ErrorHandling;
}

export interface ErrorHandling {
  strategy: 'stop' | 'continue' | 'retry' | 'fallback';
  fallbackStepId?: string;
  maxRetries?: number;
  retryDelay?: number;
}

export interface StepConnection {
  targetStepId: string;
  condition?: ConnectionCondition;
  label?: string;
}

export interface ConnectionCondition {
  type: 'success' | 'error' | 'custom';
  expression?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  baseDelay: number;
  maxDelay: number;
}

export interface WorkflowSettings {
  maxExecutionTime: number;
  concurrencyLimit: number;
  notifyOnCompletion: boolean;
  notifyOnError: boolean;
  logLevel: 'minimal' | 'standard' | 'verbose' | 'debug';
  dataRetention: number; // days
}

export interface WorkflowMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: number;
  successRate: number;
}

export interface Mockup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  type: 'wireframe' | 'prototype' | 'design' | 'component' | 'flow';
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'archived';
  version: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  files: MockupFile[];
  comments: MockupComment[];
  tags: string[];
  metadata: MockupMetadata;
}

export interface MockupFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  dimensions?: { width: number; height: number };
  uploadedAt: Date;
}

export interface MockupComment {
  id: string;
  content: string;
  position?: { x: number; y: number };
  author: string;
  createdAt: Date;
  resolved: boolean;
}

export interface MockupMetadata {
  platform: string[];
  resolution: string;
  colorPalette: string[];
  fonts: string[];
  components: string[];
}

// API Response Types
export interface ProjectListResponse {
  projects: Project[];
  total: number;
  page: number;
  limit: number;
}

export interface ProjectResponse {
  project: Project;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface WorkflowListResponse {
  workflows: Workflow[];
  total: number;
}

export interface MockupListResponse {
  mockups: Mockup[];
  total: number;
}

// Form Types
export interface CreateProjectForm {
  name: string;
  description?: string;
  color?: string;
  tags: string[];
  settings: Partial<ProjectSettings>;
  repository?: Partial<RepositoryConfig>;
}

export interface UpdateProjectForm extends Partial<CreateProjectForm> {
  id: string;
}

export interface CreateAgentForm {
  projectId: string;
  name: string;
  type: Agent['type'];
  description?: string;
  configuration: Partial<AgentConfiguration>;
  tags: string[];
}

export interface CreateTaskForm {
  projectId: string;
  title: string;
  description?: string;
  type: Task['type'];
  priority: Task['priority'];
  assignedTo?: string;
  dueDate?: Date;
  tags: string[];
  agentId?: string;
}

export interface CreateWorkflowForm {
  projectId: string;
  name: string;
  description?: string;
  tags: string[];
}

// Search and Filter Types
export interface ProjectSearchQuery {
  query?: string;
  status?: Project['status'];
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastActivity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TaskSearchQuery {
  projectId: string;
  query?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  type?: Task['type'];
  assignedTo?: string;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'priority' | 'dueDate';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AgentSearchQuery {
  projectId: string;
  query?: string;
  type?: Agent['type'];
  status?: Agent['status'];
  tags?: string[];
  sortBy?: 'name' | 'createdAt' | 'lastExecution';
  sortOrder?: 'asc' | 'desc';
}

// Context and State Types
export interface ProjectContextState {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  error: string | null;
}

export interface ProjectContextActions {
  setCurrentProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  createProject: (project: CreateProjectForm) => Promise<Project>;
  updateProject: (project: UpdateProjectForm) => Promise<Project>;
  deleteProject: (projectId: string) => Promise<void>;
  refreshCurrentProject: () => Promise<void>;
}

// Repository Integration Types
export interface RepositoryConfig {
  type: 'github' | 'bitbucket' | 'gitlab' | 'azure-devops' | 'custom';
  url: string;
  branch?: string;
  accessToken?: string;
  username?: string;
  isPrivate: boolean;
  syncEnabled: boolean;
  lastSync?: Date;
  webhookUrl?: string;
  deploymentConfig?: DeploymentConfig;
}

export interface DeploymentConfig {
  autoDeployEnabled: boolean;
  targetEnvironment: 'development' | 'staging' | 'production';
  buildCommand?: string;
  deployCommand?: string;
  environmentVariables?: Record<string, string>;
}

// Project File Structure Types
export interface ProjectFileStructure {
  rootPath: string;
  sourceCode: SourceCodeStructure;
  analysis: AnalysisStructure;
  tasks: TasksStructure;
  workflows: WorkflowsStructure;
  mockups: MockupsStructure;
  documentation: DocumentationStructure;
  backups: BackupsStructure;
}

export interface SourceCodeStructure {
  backend?: string;
  frontend?: string;
  shared?: string;
  database?: string;
  config?: string;
}

export interface AnalysisStructure {
  codeAnalysis: string;
  documentAnalysis: string;
  reports: string;
  metrics: string;
}

export interface TasksStructure {
  active: string;
  completed: string;
  archived: string;
  templates: string;
}

export interface WorkflowsStructure {
  definitions: string;
  executions: string;
  logs: string;
}

export interface MockupsStructure {
  wireframes: string;
  prototypes: string;
  assets: string;
}

export interface DocumentationStructure {
  api: string;
  userGuides: string;
  technical: string;
  generated: string;
}

export interface BackupsStructure {
  daily: string;
  weekly: string;
  monthly: string;
}
