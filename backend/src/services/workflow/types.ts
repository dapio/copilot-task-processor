/**
 * Workflow Engine Types and Interfaces
 * Core type definitions for the workflow system
 */

// Core Enums
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMEOUT = 'timeout',
  CANCELLED = 'cancelled',
}

export enum EventType {
  STARTED = 'started',
  STEP_STARTED = 'step_started',
  STEP_COMPLETED = 'step_completed',
  STEP_FAILED = 'step_failed',
  PAUSED = 'paused',
  RESUMED = 'resumed',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum StepType {
  ACTION = 'action',
  CONDITION = 'condition',
  LOOP = 'loop',
  PARALLEL = 'parallel',
  DELAY = 'delay',
  APPROVAL = 'approval',
}

export enum HandlerType {
  BUILTIN = 'builtin',
  CUSTOM = 'custom',
  AGENT = 'agent',
  EXTERNAL = 'external',
}

// Core Interfaces
export interface WorkflowTemplate {
  id?: string;
  name: string;
  description?: string;
  version: string;
  type: string;
  category?: string;
  priority?: string;
  steps: WorkflowStep[];
  conditions?: WorkflowCondition[];
  variables?: Record<string, any>;
  metadata?: Record<string, any>;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  active?: boolean;
  validated?: boolean;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
  tags?: string[];
}

export interface WorkflowStep {
  stepId: string;
  name: string;
  description?: string;
  type: StepType;
  category?: string;
  handler: string;
  handlerConfig?: Record<string, any>;
  order: number;
  dependencies?: string[];
  conditions?: WorkflowCondition[];
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  inputMapping?: Record<string, any>;
  outputMapping?: Record<string, any>;
  onError?: 'continue' | 'halt' | 'retry' | 'skip';
  errorHandler?: string;
}

export interface WorkflowCondition {
  field: string;
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'greater_than'
    | 'less_than'
    | 'exists'
    | 'not_exists';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RetryPolicy {
  maxAttempts: number;
  delay: number;
  backoffMultiplier?: number;
  maxDelay?: number;
}

export interface WorkflowExecution {
  id?: string;
  workflowId: string;
  projectId?: string;
  status: WorkflowStatus;
  currentStep: number;
  currentStepId?: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  context?: Record<string, any>;
  variables?: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, any>;
  priority: string;
  executor?: string;
  executorType?: string;
}

export interface StepExecution {
  id?: string;
  workflowRunId: string;
  stepId: string;
  status: StepStatus;
  attempt: number;
  maxAttempts: number;
  input?: Record<string, any>;
  output?: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  errorCode?: string;
  errorDetails?: Record<string, any>;
  retryCount: number;
  nextRetryAt?: Date;
}

export interface WorkflowHandler {
  name: string;
  type: HandlerType;
  category: string;
  description?: string;
  handlerClass?: string;
  handlerMethod?: string;
  configSchema?: Record<string, any>;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  requirements?: Record<string, any>;
  dependencies?: string[];
  enabled: boolean;
  version: string;
  documentation?: string;
  examples?: Record<string, any>[];
}

export interface WorkflowExecutionContext {
  workflowId: string;
  runId: string;
  stepId?: string;
  variables: Record<string, any>;
  input: Record<string, any>;
  output: Record<string, any>;
  metadata: Record<string, any>;
  logger: WorkflowLogger;
  services: {
    prisma: any;
    [key: string]: any;
  };
}

export interface WorkflowLogger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: any): void;
}

export interface WorkflowSchedule {
  id?: string;
  workflowId: string;
  name: string;
  description?: string;
  enabled: boolean;
  scheduleType: 'cron' | 'interval' | 'once' | 'manual';
  cronExpression?: string;
  interval?: number;
  scheduledAt?: Date;
  input?: Record<string, any>;
  context?: Record<string, any>;
  priority: string;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successCount: number;
  failureCount: number;
}

export interface WorkflowStats {
  totalTemplates: number;
  activeTemplates: number;
  totalRuns: number;
  runningWorkflows: number;
  completedRuns: number;
  failedRuns: number;
  avgExecutionTime: number;
  statusDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  recentActivity: WorkflowActivityItem[];
}

export interface WorkflowActivityItem {
  id: string;
  type: EventType;
  workflowId: string;
  workflowName: string;
  status: WorkflowStatus | StepStatus;
  message: string;
  timestamp: Date;
  duration?: number;
}

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface WorkflowMetrics {
  executionTime: number;
  stepCount: number;
  failedSteps: number;
  retryCount: number;
  memoryUsage: number;
  cpuUsage: number;
}

// Handler Function Type
export type HandlerFunction = (
  input: any,
  context: WorkflowExecutionContext
) => Promise<any>;

// Start Options
export interface StartWorkflowOptions {
  projectId?: string;
  priority?: string;
  executor?: string;
  executorType?: string;
  skipValidation?: boolean;
  dryRun?: boolean;
}

// Template Options
export interface CreateTemplateOptions {
  validateSteps?: boolean;
  autoActivate?: boolean;
  skipExisting?: boolean;
}

// Search Options
export interface SearchTemplatesOptions {
  category?: string;
  type?: string;
  active?: boolean;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
}

// Error Classes
export class WorkflowEngineError extends Error {
  public code: string;
  public stepId?: string;
  public details?: any;

  constructor(message: string, code: string, stepId?: string, details?: any) {
    super(message);
    this.name = 'WorkflowEngineError';
    this.code = code;
    this.stepId = stepId;
    this.details = details;
  }
}

// API Request/Response Types
export interface CreateTemplateRequest {
  name: string;
  description?: string;
  steps: WorkflowStepTemplate[];
  variables?: Record<string, any>;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  steps?: WorkflowStepTemplate[];
  variables?: Record<string, any>;
  isActive?: boolean;
}

export interface StartExecutionRequest {
  templateId: string;
  input?: Record<string, any>;
  variables?: Record<string, any>;
}

export interface ExecutionStatus {
  id: string;
  templateId: string;
  status: ExecutionStatusEnum;
  progress: number;
  currentStepId?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  stepStatuses: StepExecutionStatus[];
}

export interface StepExecutionStatus {
  stepId: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface WorkflowStepTemplate {
  id: string;
  name: string;
  type: string;
  handlerType: string;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  configuration?: Record<string, any>;
}

export type ExecutionStatusEnum =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

// Export aliases for backwards compatibility
export type WorkflowTemplateData = WorkflowTemplate;
export type WorkflowRunData = WorkflowExecution;
export type WorkflowStepData = WorkflowStep;
