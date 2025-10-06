import { z } from 'zod';

/**
 * Workflow Step Schema
 */
export const workflowStepSchema = z.object({
  id: z.string().min(1, 'Step ID is required'),
  name: z.string().min(1, 'Step name is required'),
  description: z.string().optional(),
  type: z.string().default('action'),
  handlerType: z.enum([
    'http',
    'database',
    'email',
    'script',
    'condition',
    'parallel',
    'sequential',
  ]),
  handlerConfig: z.record(z.string(), z.any()).optional(),
  dependencies: z.array(z.string()).optional(),
  timeout: z.number().min(1000).max(3600000).optional(), // 1s to 1h
  retries: z.number().min(0).max(10).optional(),
  continueOnError: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
});

/**
 * Create Template Request Schema
 */
export const createTemplateRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  steps: z.array(workflowStepSchema).min(1, 'At least one step is required'),
  variables: z.record(z.string(), z.any()).optional().default({}),
  isActive: z.boolean().optional().default(true),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Update Template Request Schema
 */
export const updateTemplateRequestSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(255, 'Name too long')
    .optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  steps: z
    .array(workflowStepSchema)
    .min(1, 'At least one step is required')
    .optional(),
  variables: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Execute Workflow Request Schema
 */
export const executeWorkflowRequestSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  input: z.record(z.string(), z.any()).optional().default({}),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  timeout: z.number().min(1000).max(7200000).optional(), // 1s to 2h
  retryPolicy: z
    .object({
      maxRetries: z.number().min(0).max(5).optional(),
      backoffMultiplier: z.number().min(1).max(10).optional(),
      initialDelay: z.number().min(1000).max(60000).optional(),
    })
    .optional(),
  runMode: z.enum(['sync', 'async']).optional().default('async'),
});

/**
 * Workflow Template Interface
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  isActive: boolean;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  version?: number;
  createdBy?: string;
}

/**
 * Workflow Step Interface
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: string;
  handlerType: string;
  handlerConfig?: Record<string, any>;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  continueOnError?: boolean;
  isActive?: boolean;
  position?: {
    x: number;
    y: number;
  };
}

/**
 * Workflow Execution Interface
 */
export interface WorkflowExecution {
  id: string;
  templateId: string;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'timeout';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  progress: number;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  stepExecutions: StepExecution[];
  priority: 'low' | 'normal' | 'high';
  runMode: 'sync' | 'async';
  retryCount?: number;
  parentExecutionId?: string;
}

/**
 * Step Execution Interface
 */
export interface StepExecution {
  id: string;
  stepId: string;
  executionId: string;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'skipped'
    | 'cancelled';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  retryCount: number;
  logs?: ExecutionLog[];
}

/**
 * Execution Log Interface
 */
export interface ExecutionLog {
  id: string;
  executionId: string;
  stepId?: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
}

/**
 * Create Template Request Type
 */
export type CreateTemplateRequest = z.infer<typeof createTemplateRequestSchema>;

/**
 * Update Template Request Type
 */
export type UpdateTemplateRequest = z.infer<typeof updateTemplateRequestSchema>;

/**
 * Execute Workflow Request Type
 */
export type ExecuteWorkflowRequest = z.infer<
  typeof executeWorkflowRequestSchema
>;

/**
 * Workflow Filters Interface
 */
export interface WorkflowFilters {
  isActive?: boolean;
  category?: string;
  tags?: string[];
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Execution Filters Interface
 */
export interface ExecutionFilters {
  templateId?: string;
  status?: string;
  priority?: string;
  startedAfter?: Date;
  startedBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
  createdBy?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'startedAt' | 'completedAt' | 'duration' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Workflow Metrics Interface
 */
export interface WorkflowMetrics {
  totalExecutions: number;
  completedExecutions: number;
  failedExecutions: number;
  runningExecutions: number;
  averageExecutionTime: number;
  successRate: number;
  executionsByDay: Record<string, number>;
  stepMetrics: Record<string, StepMetrics>;
  performanceStats: {
    minExecutionTime: number;
    maxExecutionTime: number;
    medianExecutionTime: number;
  };
}

/**
 * Step Metrics Interface
 */
export interface StepMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageDuration: number;
  successRate: number;
}

/**
 * Template Validation Result Interface
 */
export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Workflow Health Status Interface
 */
export interface WorkflowHealthStatus {
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: Date;
  uptime: number;
  version: string;
}

/**
 * Health Check Interface
 */
export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration: number;
  timestamp: Date;
}

/**
 * Workflow Export Format Interface
 */
export interface WorkflowExportData {
  version: string;
  exportedAt: string;
  template: WorkflowTemplate;
  metadata?: {
    source: string;
    exportedBy?: string;
    description?: string;
  };
}
