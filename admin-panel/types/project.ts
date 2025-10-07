/**
 * Project Types
 * ThinkCode AI Platform - Project Management Types
 */

export type ProjectStatus = 'active' | 'planning' | 'completed' | 'paused';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  mockupsCount: number;
  tasksCount: number;
  workflowsCount: number;
  lastModified: Date;
  createdAt: Date;
  tags: string[];
  progress: number; // 0-100
  color?: string;
  teamMembers?: ProjectMember[];
  settings?: ProjectSettings;
}

export interface ProjectMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  avatar?: string;
  joinedAt: Date;
}

export interface ProjectSettings {
  isPublic: boolean;
  allowComments: boolean;
  enableNotifications: boolean;
  defaultWorkflowTemplate?: string;
  mockupConfig?: MockupConfig;
  taskConfig?: TaskConfig;
}

export interface MockupConfig {
  defaultResolution: {
    width: number;
    height: number;
  };
  allowedFormats: string[];
  maxFileSize: number; // in MB
  enableVersioning: boolean;
}

export interface TaskConfig {
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent';
  enableTimeTracking: boolean;
  requireDescriptions: boolean;
  defaultAssignee?: string;
}

export interface Mockup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'archived';
  imageUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  fileSize: number;
  format: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  comments: MockupComment[];
  metadata?: MockupMetadata;
}

export interface MockupComment {
  id: string;
  mockupId: string;
  authorId: string;
  authorName: string;
  content: string;
  position?: {
    x: number;
    y: number;
  };
  createdAt: Date;
  resolved: boolean;
  parentId?: string; // for replies
}

export interface MockupMetadata {
  figmaUrl?: string;
  sketchUrl?: string;
  xdUrl?: string;
  originalFilename?: string;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  screenDensity?: '1x' | '2x' | '3x';
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  assigneeName?: string;
  reporterId: string;
  reporterName: string;
  estimatedHours?: number;
  actualHours?: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  dependencies: string[]; // task IDs
  subtasks: Subtask[];
  workflowId?: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  name: string;
  url: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  parentId?: string; // for replies
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  version: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  variables: WorkflowVariable[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  tags: string[];
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  type: 'action' | 'condition' | 'loop' | 'delay' | 'human-task';
  position: {
    x: number;
    y: number;
  };
  config: Record<string, any>;
  nextStepIds: string[];
  previousStepIds: string[];
  timeout?: number; // in seconds
  retryCount?: number;
  onError?: 'stop' | 'continue' | 'retry' | 'skip';
}

export interface WorkflowTrigger {
  id: string;
  workflowId: string;
  type: 'manual' | 'scheduled' | 'webhook' | 'event';
  config: Record<string, any>;
  isActive: boolean;
  lastTriggered?: Date;
}

export interface WorkflowVariable {
  id: string;
  workflowId: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  defaultValue?: any;
  isRequired: boolean;
  description?: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  projectId: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  triggeredBy: string;
  currentStepId?: string;
  variables: Record<string, any>;
  logs: WorkflowLog[];
  error?: {
    message: string;
    step: string;
    timestamp: Date;
  };
}

export interface WorkflowLog {
  id: string;
  executionId: string;
  stepId?: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  data?: Record<string, any>;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Search and Filter Types
export interface ProjectSearchQuery {
  query?: string;
  status?: ProjectStatus[];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'progress';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface MockupSearchQuery {
  projectId?: string;
  query?: string;
  status?: string[];
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'version';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface TaskSearchQuery {
  projectId?: string;
  query?: string;
  status?: string[];
  priority?: string[];
  assigneeId?: string;
  tags?: string[];
  dueBefore?: Date;
  dueAfter?: Date;
  createdAfter?: Date;
  createdBefore?: Date;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'dueDate' | 'priority';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Form Types
export interface CreateProjectForm {
  name: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  templateId?: string;
}

export interface UpdateProjectForm {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  settings?: Partial<ProjectSettings>;
}

export interface CreateMockupForm {
  name: string;
  description?: string;
  file: File;
  tags: string[];
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

export interface CreateTaskForm {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  estimatedHours?: number;
  dueDate?: Date;
  tags: string[];
  dependencies: string[];
}

export interface CreateWorkflowForm {
  name: string;
  description?: string;
  templateId?: string;
  tags: string[];
}
