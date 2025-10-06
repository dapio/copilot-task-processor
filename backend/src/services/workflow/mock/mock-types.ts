/**
 * Mock Workflow Engine Types
 *
 * Type definitions for mock workflow implementation
 */

export interface MockWorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  steps: MockWorkflowStepTemplate[];
  variables: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockWorkflowStepTemplate {
  id: string;
  name: string;
  type: string;
  handlerType: string;
  dependencies?: string[];
  timeout?: number;
  retries?: number;
  configuration?: Record<string, any>;
}

export interface MockWorkflowExecution {
  id: string;
  templateId: string;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'paused';
  progress: number;
  currentStepId?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  input: Record<string, any>;
  output?: Record<string, any>;
  stepExecutions: MockStepExecution[];
}

export interface MockStepExecution {
  id: string;
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  retryCount: number;
}

export interface MockHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  details: {
    templatesCount: number;
    executionsCount: number;
    activeExecutions: number;
    lastExecutionTime?: Date;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
}

export interface MockStatistics {
  templates: {
    total: number;
    active: number;
    inactive: number;
  };
  executions: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  performance: {
    averageExecutionTime: number;
    successRate: number;
    totalStepsExecuted: number;
  };
  system: {
    uptime: number;
    memoryUsage: number;
    lastRestart?: Date;
  };
}

export interface MockExecutionConfig {
  simulateDelay: boolean;
  delayRange: [number, number];
  failureRate: number;
  enableProgressTracking: boolean;
  maxConcurrentExecutions: number;
}

/**
 * Mock workflow template factory interface
 */
export interface IMockTemplateFactory {
  createDataProcessingTemplate(): MockWorkflowTemplate;
  createEmailNotificationTemplate(): MockWorkflowTemplate;
  createSampleTemplates(): MockWorkflowTemplate[];
}

/**
 * Mock execution simulator interface
 */
export interface IMockExecutionSimulator {
  simulateExecution(execution: MockWorkflowExecution): Promise<void>;
  simulateStepExecution(
    stepExecution: MockStepExecution,
    stepTemplate: MockWorkflowStepTemplate
  ): Promise<void>;
}

/**
 * Mock health monitor interface
 */
export interface IMockHealthMonitor {
  checkHealth(): MockHealthCheck;
  getStatistics(): MockStatistics;
}
