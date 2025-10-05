/**
 * Enhanced Workflow Controller - Centralne sterowanie workflow z integracją providerów
 * ThinkCode AI Platform - Enterprise-grade workflow orchestration with multi-provider support
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';
import ContextManager, {
  AgentContext,
  ProjectContext,
} from './context-manager';
import ChatIntegrationService from './chat-integration.service';

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

export class EnhancedWorkflowController {
  private prisma: PrismaClient;
  private contextManager: ContextManager;
  private chatService: ChatIntegrationService;
  private providers: Map<string, IMLProvider> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private templates: Map<string, WorkflowTemplate> = new Map();
  private providerHealthCache: Map<
    string,
    { status: string; timestamp: Date }
  > = new Map();

  constructor(
    prisma: PrismaClient,
    contextManager: ContextManager,
    chatService: ChatIntegrationService
  ) {
    this.prisma = prisma;
    this.contextManager = contextManager;
    this.chatService = chatService;

    // Załaduj domyślne templaty
    this.loadDefaultTemplates();

    // Uruchom monitoring providerów
    this.startProviderMonitoring();
  }

  /**
   * Rejestruje provider AI w systemie workflow
   */
  registerProvider(name: string, provider: IMLProvider): void {
    this.providers.set(name, provider);
    this.chatService.registerProvider(name, provider);
    console.log(`Registered provider in workflow controller: ${name}`);
  }

  /**
   * Usuwa provider z systemu workflow
   */
  unregisterProvider(name: string): boolean {
    const result = this.providers.delete(name);
    this.chatService.unregisterProvider(name);
    this.providerHealthCache.delete(name);
    return result;
  }

  /**
   * Pobiera dostępne providery z informacją o statusie
   */
  async getAvailableProviders(): Promise<
    Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
      lastChecked?: Date;
      details?: any;
    }>
  > {
    const providers: Array<{
      name: string;
      status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
      lastChecked?: Date;
      details?: any;
    }> = [];

    for (const [name, provider] of this.providers.entries()) {
      const cachedHealth = this.providerHealthCache.get(name);

      // Jeśli cache jest świeży (< 5 min), użyj go
      if (
        cachedHealth &&
        Date.now() - cachedHealth.timestamp.getTime() < 5 * 60 * 1000
      ) {
        const status = ['healthy', 'degraded', 'unhealthy'].includes(
          cachedHealth.status
        )
          ? (cachedHealth.status as 'healthy' | 'degraded' | 'unhealthy')
          : 'unknown';
        providers.push({
          name,
          status,
          lastChecked: cachedHealth.timestamp,
        });
      } else {
        // Sprawdź health asynchronicznie
        provider.healthCheck().then(health => {
          const status = health.success ? health.data.status : 'unhealthy';
          this.providerHealthCache.set(name, {
            status,
            timestamp: new Date(),
          });
        });

        providers.push({
          name,
          status: 'unknown',
          lastChecked: cachedHealth?.timestamp,
        });
      }
    }

    return providers;
  }

  // === Workflow Template Management ===

  /**
   * Tworzy nowy template workflow
   */
  async createWorkflowTemplate(
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<string> {
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const fullTemplate: WorkflowTemplate = {
      id: templateId,
      ...template,
    };

    this.templates.set(templateId, fullTemplate);
    return templateId;
  }

  /**
   * Pobiera template workflow
   */
  getWorkflowTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Listuje dostępne templaty
   */
  listWorkflowTemplates(filter?: {
    category?: WorkflowTemplate['category'];
    complexity?: WorkflowTemplate['complexity'];
  }): WorkflowTemplate[] {
    let templates = Array.from(this.templates.values());

    if (filter) {
      if (filter.category) {
        templates = templates.filter(t => t.category === filter.category);
      }
      if (filter.complexity) {
        templates = templates.filter(t => t.complexity === filter.complexity);
      }
    }

    return templates;
  }

  // === Workflow Execution ===

  /**
   * Rozpoczyna wykonanie workflow z template
   */
  async executeWorkflowFromTemplate(options: {
    templateId: string;
    contextId: string;
    contextType: 'project' | 'agent';
    projectId?: string;
    chatSessionId?: string;
    parameters?: Record<string, any>;
    providerOverrides?: Record<string, string>; // stepName -> providerName
    priority?: 'low' | 'medium' | 'high' | 'critical';
    triggeredBy?: string;
  }): Promise<Result<string, MLError>> {
    const template = this.getWorkflowTemplate(options.templateId);
    if (!template) {
      return {
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: `Workflow template ${options.templateId} not found`,
          retryable: false,
        },
      };
    }

    // Sprawdź wymagania template
    const validationResult = await this.validateTemplateRequirements(template);
    if (!validationResult.success) {
      return validationResult;
    }

    // Stwórz workflow execution
    const executionId = await this.createWorkflowExecution({
      templateId: options.templateId,
      contextId: options.contextId,
      contextType: options.contextType,
      projectId: options.projectId,
      chatSessionId: options.chatSessionId,
      priority: options.priority || 'medium',
      triggeredBy: options.triggeredBy,
    });

    // Stwórz kroki z template
    await this.createStepsFromTemplate(
      executionId,
      template,
      options.parameters,
      options.providerOverrides
    );

    // Rozpocznij wykonanie
    const startResult = await this.startExecution(executionId);

    if (!startResult.success) {
      return startResult;
    }

    return { success: true, data: executionId };
  }

  /**
   * Rozpoczyna niestandardowy workflow
   */
  async executeCustomWorkflow(options: {
    name: string;
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
    contextId: string;
    contextType: 'project' | 'agent';
    providerStrategy: ProviderStrategy;
    projectId?: string;
    chatSessionId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    triggeredBy?: string;
  }): Promise<Result<string, MLError>> {
    // Stwórz execution
    const executionId = await this.createWorkflowExecution({
      contextId: options.contextId,
      contextType: options.contextType,
      projectId: options.projectId,
      chatSessionId: options.chatSessionId,
      priority: options.priority || 'medium',
      triggeredBy: options.triggeredBy,
    });

    // Dodaj kroki
    for (const [index, stepTemplate] of options.steps.entries()) {
      const provider =
        stepTemplate.provider ||
        (await this.selectProviderForStep(
          stepTemplate,
          options.providerStrategy
        ));
      await this.addStepToExecution(executionId, {
        ...stepTemplate,
        provider,
      });
    }

    // Rozpocznij wykonanie
    const startResult = await this.startExecution(executionId);

    if (!startResult.success) {
      return startResult;
    }

    return { success: true, data: executionId };
  }

  /**
   * Pobiera status wykonania workflow
   */
  async getExecutionStatus(
    executionId: string
  ): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null;
  }

  /**
   * Pobiera szczegóły kroków workflow
   */
  async getExecutionSteps(executionId: string): Promise<WorkflowStep[]> {
    // TODO: Załaduj kroki z bazy danych
    // Na razie zwracamy mock data
    return [];
  }

  /**
   * Pauzuje wykonanie workflow
   */
  async pauseExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') {
      return false;
    }

    execution.status = 'paused';
    execution.lastActivityAt = new Date();

    return true;
  }

  /**
   * Wznawia wykonanie workflow
   */
  async resumeExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'paused') {
      return false;
    }

    execution.status = 'running';
    execution.lastActivityAt = new Date();

    // Kontynuuj wykonanie
    this.continueExecution(executionId);

    return true;
  }

  /**
   * Anuluje wykonanie workflow
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (
      !execution ||
      !['pending', 'running', 'paused'].includes(execution.status)
    ) {
      return false;
    }

    execution.status = 'cancelled';
    execution.completedAt = new Date();
    execution.lastActivityAt = new Date();

    return true;
  }

  // === Context Integration ===

  /**
   * Tworzy workflow session z integracją chat
   */
  async createWorkflowSession(options: {
    workflowExecutionId: string;
    title?: string;
    enableChat?: boolean;
  }): Promise<string> {
    const execution = await this.getExecutionStatus(
      options.workflowExecutionId
    );
    if (!execution) {
      throw new Error(
        `Workflow execution ${options.workflowExecutionId} not found`
      );
    }

    // Stwórz chat session jeśli wymagane
    if (options.enableChat) {
      const chatSessionId = await this.chatService.createChatSession({
        contextId: execution.contextId,
        contextType: execution.contextType,
        title: options.title || `Workflow: ${options.workflowExecutionId}`,
        activeProviders: execution.activeProviders,
      });

      // Powiąż chat session z execution
      execution.chatSessionId = chatSessionId;

      return chatSessionId;
    }

    return execution.contextId;
  }

  /**
   * Integruje wyniki workflow z kontekstem
   */
  async integrateWorkflowResults(
    executionId: string,
    stepId: string,
    result: any
  ): Promise<void> {
    const execution = await this.getExecutionStatus(executionId);
    if (!execution) {
      return;
    }

    // Dodaj wynik do kontekstu agenta jeśli dotyczy
    if (execution.contextType === 'agent' && execution.contextId) {
      await this.contextManager.addMessage(execution.contextId, {
        role: 'assistant',
        content: `Workflow step completed: ${stepId}\nResult: ${JSON.stringify(result, null, 2)}`,
        provider: 'workflow-controller',
        metadata: {
          workflowExecutionId: executionId,
          stepId,
          type: 'workflow_result',
        },
      });
    }

    // Wyślij aktualizację do chat session jeśli istnieje
    if (execution.chatSessionId) {
      // TODO: Wyślij wiadomość do chat session
    }
  }

  // === Provider Selection & Load Balancing ===

  /**
   * Wybiera najlepszy provider dla kroku
   */
  private async selectProviderForStep(
    step: Partial<WorkflowStep>,
    strategy: ProviderStrategy
  ): Promise<string> {
    // Sprawdź primary provider
    if (await this.isProviderHealthy(strategy.primary)) {
      return strategy.primary;
    }

    // Sprawdź fallback providers
    for (const fallback of strategy.fallbacks) {
      if (await this.isProviderHealthy(fallback)) {
        return fallback;
      }
    }

    // Zwróć pierwszy dostępny provider
    for (const [name] of this.providers.entries()) {
      if (await this.isProviderHealthy(name)) {
        return name;
      }
    }

    throw new Error('No healthy providers available');
  }

  /**
   * Sprawdza czy provider jest zdrowy
   */
  private async isProviderHealthy(providerName: string): Promise<boolean> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return false;
    }

    try {
      return await provider.isAvailable();
    } catch {
      return false;
    }
  }

  // === Private Methods ===

  private async createWorkflowExecution(options: {
    templateId?: string;
    contextId: string;
    contextType: 'project' | 'agent';
    projectId?: string;
    chatSessionId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    triggeredBy?: string;
  }): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: options.templateId || 'custom',
      projectId: options.projectId,
      contextId: options.contextId,
      contextType: options.contextType,
      chatSessionId: options.chatSessionId,
      status: 'pending',
      progress: {
        totalSteps: 0,
        completedSteps: 0,
        percentage: 0,
      },
      activeProviders: ['github-copilot'],
      providerUsage: {},
      metadata: {
        triggeredBy: options.triggeredBy,
        priority: options.priority || 'medium',
        tags: [],
      },
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.executions.set(executionId, execution);
    return executionId;
  }

  private async createStepsFromTemplate(
    executionId: string,
    template: WorkflowTemplate,
    parameters?: Record<string, any>,
    providerOverrides?: Record<string, string>
  ): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return;
    }

    execution.progress.totalSteps = template.steps.length;

    for (const [index, stepTemplate] of template.steps.entries()) {
      const stepId = `${executionId}_step_${index}`;

      // TODO: Zapisz krok w bazie danych
      console.log(
        `Created step ${stepId} from template for execution ${executionId}`
      );
    }
  }

  private async addStepToExecution(
    executionId: string,
    step: Omit<
      WorkflowStep,
      | 'id'
      | 'workflowId'
      | 'status'
      | 'result'
      | 'error'
      | 'startedAt'
      | 'completedAt'
      | 'retryCount'
    >
  ): Promise<string> {
    const stepId = `${executionId}_step_${Date.now()}`;

    // TODO: Zapisz krok w bazie danych
    console.log(`Added step ${stepId} to execution ${executionId}`);

    return stepId;
  }

  private async startExecution(
    executionId: string
  ): Promise<Result<void, MLError>> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_NOT_FOUND',
          message: `Execution ${executionId} not found`,
          retryable: false,
        },
      };
    }

    execution.status = 'running';
    execution.startedAt = new Date();
    execution.lastActivityAt = new Date();

    // Rozpocznij wykonanie w tle
    this.continueExecution(executionId);

    return { success: true, data: undefined };
  }

  private async continueExecution(executionId: string): Promise<void> {
    // TODO: Zaimplementuj logikę wykonania kroków
    console.log(`Continuing execution ${executionId}`);
  }

  private async validateTemplateRequirements(
    template: WorkflowTemplate
  ): Promise<Result<void, MLError>> {
    // Sprawdź czy wymagane providery są dostępne
    for (const requiredProvider of template.requirements.minimumProviders) {
      if (!this.providers.has(requiredProvider)) {
        return {
          success: false,
          error: {
            code: 'REQUIRED_PROVIDER_MISSING',
            message: `Required provider ${requiredProvider} is not available`,
            retryable: false,
          },
        };
      }
    }

    return { success: true, data: undefined };
  }

  private loadDefaultTemplates(): void {
    // Template dla generowania kodu
    this.templates.set('code-generation', {
      id: 'code-generation',
      name: 'Code Generation Workflow',
      description:
        'Generates code based on requirements with review and validation',
      category: 'code_generation',
      steps: [
        {
          name: 'analyze-requirements',
          description: 'Analyze code generation requirements',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: [],
          configuration: {
            prompt:
              'Analyze the following requirements and create a detailed implementation plan:',
            contextRequired: true,
            workspaceAccess: true,
          },
          maxRetries: 2,
        },
        {
          name: 'generate-code',
          description: 'Generate code implementation',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['analyze-requirements'],
          configuration: {
            prompt: 'Generate code implementation based on the analysis:',
            contextRequired: true,
            workspaceAccess: true,
            fallbackProviders: ['openai'],
          },
          maxRetries: 3,
        },
        {
          name: 'validate-code',
          description: 'Validate generated code',
          type: 'validation',
          dependencies: ['generate-code'],
          configuration: {
            contextRequired: false,
            workspaceAccess: true,
          },
          maxRetries: 1,
        },
      ],
      providerStrategy: {
        primary: 'github-copilot',
        fallbacks: ['openai'],
        contextAffinity: true,
      },
      estimatedDuration: 180, // seconds
      complexity: 'medium',
      requirements: {
        minimumProviders: ['github-copilot'],
        optionalProviders: ['openai'],
        contextRequired: true,
        workspaceAccess: true,
      },
    });

    // Template dla analizy kodu
    this.templates.set('code-analysis', {
      id: 'code-analysis',
      name: 'Code Analysis Workflow',
      description:
        'Comprehensive code analysis with suggestions and documentation',
      category: 'analysis',
      steps: [
        {
          name: 'analyze-structure',
          description: 'Analyze code structure and architecture',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: [],
          configuration: {
            prompt:
              'Analyze the code structure and provide architectural insights:',
            contextRequired: true,
            workspaceAccess: true,
          },
          maxRetries: 2,
        },
        {
          name: 'identify-issues',
          description: 'Identify code issues and potential improvements',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['analyze-structure'],
          configuration: {
            prompt: 'Identify code issues, bugs, and potential improvements:',
            contextRequired: true,
            workspaceAccess: true,
          },
          maxRetries: 2,
        },
        {
          name: 'generate-report',
          description: 'Generate comprehensive analysis report',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['analyze-structure', 'identify-issues'],
          configuration: {
            prompt:
              'Generate a comprehensive analysis report with recommendations:',
            contextRequired: true,
          },
          maxRetries: 1,
        },
      ],
      providerStrategy: {
        primary: 'github-copilot',
        fallbacks: ['openai'],
        contextAffinity: true,
      },
      estimatedDuration: 120,
      complexity: 'simple',
      requirements: {
        minimumProviders: ['github-copilot'],
        optionalProviders: ['openai'],
        contextRequired: true,
        workspaceAccess: true,
      },
    });

    console.log('Loaded default workflow templates');
  }

  private startProviderMonitoring(): void {
    // Monitoruj providery co 5 minut
    setInterval(
      async () => {
        for (const [name, provider] of this.providers.entries()) {
          try {
            const health = await provider.healthCheck();
            this.providerHealthCache.set(name, {
              status: health.success ? health.data.status : 'unhealthy',
              timestamp: new Date(),
            });
          } catch (error) {
            this.providerHealthCache.set(name, {
              status: 'unhealthy',
              timestamp: new Date(),
            });
          }
        }
      },
      5 * 60 * 1000
    ); // 5 minut

    console.log('Started provider health monitoring');
  }
}

export default EnhancedWorkflowController;
