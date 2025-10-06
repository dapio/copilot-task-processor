/**
 * Enhanced Workflow Controller Types
 * Definicje typów dla EnhancedWorkflowController
 */

export interface WorkflowStep {
  id: string;
  workflowId: string;
  name: string;
  description?: string;
  type:
    | 'ai_generation'
    | 'human_review'
    | 'data_processing'
    | 'integration'
    | 'validation';
  agentId?: string;
  provider?: string; // Specific provider for this step
  dependencies: string[]; // Step IDs that must complete first
  configuration: {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    contextRequired?: boolean;
    workspaceAccess?: boolean;
    fallbackProviders?: string[];
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  retryCount: number;
  maxRetries: number;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  projectId?: string;
  contextId: string;
  contextType: 'project' | 'agent';
  chatSessionId?: string;
  status:
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'paused'
    | 'cancelled';
  progress: {
    totalSteps: number;
    completedSteps: number;
    currentStep?: string;
    percentage: number;
  };
  activeProviders: string[];
  providerUsage: Record<
    string,
    {
      requestCount: number;
      successCount: number;
      errorCount: number;
      totalTokens?: number;
    }
  >;
  metadata: {
    triggeredBy?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    tags?: string[];
    estimatedDuration?: number;
    result?: any;
    error?: string;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  lastActivityAt: Date;
}

export interface ProviderStrategy {
  primary: string;
  fallbacks: string[];
  loadBalancing?: boolean;
  costOptimization?: boolean;
  contextAffinity?: boolean; // Prefer provider that has worked with this context
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | 'code_generation'
    | 'analysis'
    | 'documentation'
    | 'review'
    | 'automation';
  steps: Omit<
    WorkflowStep,
    | 'id'
    | 'workflowId'
    | 'status'
    | 'result'
    | 'error'
    | 'startedAt'
    | 'completedAt'
    | 'retryCount'
  >[];
  providerStrategy: ProviderStrategy;
  estimatedDuration: number;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  requirements: {
    minimumProviders: string[];
    optionalProviders: string[];
    contextRequired: boolean;
    workspaceAccess: boolean;
  };
}

export interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastChecked?: Date;
}

export interface WorkflowDependencies {
  prisma: any;
  contextManager: any;
  chatService: any;
}

export interface ExecutionOptions {
  providerOverride?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  contextId?: string;
  contextType?: 'project' | 'agent';
  chatSessionId?: string;
  metadata?: Record<string, any>;
}

export interface StepExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  provider?: string;
  tokensUsed?: number;
}

/**
 * Interfejs głównej klasy Enhanced Workflow Controller
 */
export interface IEnhancedWorkflowController {
  // Provider Management
  registerProvider(name: string, provider: any): void;
  getProviders(): ProviderHealth[];

  // Template Management
  createWorkflowTemplate(
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<string>;
  getWorkflowTemplates(): WorkflowTemplate[];
  getWorkflowTemplate(templateId: string): WorkflowTemplate | null;
  deleteWorkflowTemplate(templateId: string): boolean;

  // Execution Management
  executeWorkflow(
    templateId: string,
    options?: ExecutionOptions
  ): Promise<{ success: boolean; executionId?: string; error?: string }>;

  pauseExecution(executionId: string): Promise<boolean>;
  resumeExecution(executionId: string): Promise<boolean>;
  cancelExecution(executionId: string): Promise<boolean>;

  getExecution(executionId: string): WorkflowExecution | null;
  getActiveExecutions(): WorkflowExecution[];

  // Analytics
  getExecutionStats(): any;
  getProviderStats(): any;
}
