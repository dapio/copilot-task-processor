/**
 * Mock Workflow Engine Service
 *
 * Complete mock implementation of workflow engine for testing and development.
 * Provides realistic simulation of workflow execution with proper fallback behavior.
 */

import {
  MockWorkflowTemplate,
  MockWorkflowExecution,
  MockHealthCheck,
  MockStatistics,
} from './workflow/mock/mock-types';
import { MockTemplateFactory } from './workflow/mock/mock-template-factory';
import { MockExecutionSimulator } from './workflow/mock/mock-execution-simulator';
import { MockHealthMonitor } from './workflow/mock/mock-health-monitor';

import {
  WorkflowTemplate,
  WorkflowExecution,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  StartExecutionRequest,
  ExecutionStatus,
  ExecutionStatusEnum,
} from './workflow/types';

import { Result, ServiceError, createServiceError } from '../utils/result';

/**
 * Mock Workflow Engine Service
 */
export class MockWorkflowEngineService {
  private templates = new Map<string, MockWorkflowTemplate>();
  private executions = new Map<string, MockWorkflowExecution>();
  private isInitialized = false;

  private templateFactory: MockTemplateFactory;
  private executionSimulator: MockExecutionSimulator;
  private healthMonitor: MockHealthMonitor;

  private executionCounter = 0;
  private templateCounter = 0;

  constructor() {
    this.templateFactory = new MockTemplateFactory();
    this.executionSimulator = new MockExecutionSimulator();
    this.healthMonitor = new MockHealthMonitor(this.templates, this.executions);

    this.initialize();
  }

  /**
   * Initialize with sample data
   */
  private initialize(): void {
    if (this.isInitialized) return;

    const sampleTemplates = this.templateFactory.createSampleTemplates();

    sampleTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });

    this.isInitialized = true;
  }

  /**
   * Create new workflow template
   */
  async createTemplate(
    request: CreateTemplateRequest
  ): Promise<Result<WorkflowTemplate, ServiceError>> {
    try {
      const templateId = `mock_template_${++this
        .templateCounter}_${Date.now()}`;

      const mockTemplate: MockWorkflowTemplate = {
        id: templateId,
        name: request.name,
        description: request.description,
        steps: request.steps.map((step: any) => ({
          id: step.id,
          name: step.name,
          type: step.type,
          handlerType: step.handlerType,
          dependencies: step.dependencies,
          timeout: step.timeout,
          retries: step.retries,
          configuration: step.configuration,
        })),
        variables: request.variables || {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.templates.set(templateId, mockTemplate);

      return {
        success: true,
        data: this.convertToWorkflowTemplate(mockTemplate),
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_CREATION_FAILED',
          'Failed to create workflow template',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Update existing workflow template
   */
  async updateTemplate(
    templateId: string,
    request: UpdateTemplateRequest
  ): Promise<Result<WorkflowTemplate, ServiceError>> {
    try {
      const mockTemplate = this.templates.get(templateId);
      if (!mockTemplate) {
        return {
          success: false,
          error: createServiceError(
            'TEMPLATE_NOT_FOUND',
            `Template ${templateId} not found`
          ),
        };
      }

      // Update template properties
      if (request.name !== undefined) mockTemplate.name = request.name;
      if (request.description !== undefined)
        mockTemplate.description = request.description;
      if (request.steps !== undefined) {
        mockTemplate.steps = request.steps.map((step: any) => ({
          id: step.id,
          name: step.name,
          type: step.type,
          handlerType: step.handlerType,
          dependencies: step.dependencies,
          timeout: step.timeout,
          retries: step.retries,
          configuration: step.configuration,
        }));
      }
      if (request.variables !== undefined)
        mockTemplate.variables = request.variables;
      if (request.isActive !== undefined)
        mockTemplate.isActive = request.isActive;

      mockTemplate.updatedAt = new Date();

      this.templates.set(templateId, mockTemplate);

      return {
        success: true,
        data: this.convertToWorkflowTemplate(mockTemplate),
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_UPDATE_FAILED',
          'Failed to update workflow template',
          { templateId, originalError: error }
        ),
      };
    }
  }

  /**
   * Delete workflow template
   */
  async deleteTemplate(
    templateId: string
  ): Promise<Result<void, ServiceError>> {
    try {
      if (!this.templates.has(templateId)) {
        return {
          success: false,
          error: createServiceError(
            'TEMPLATE_NOT_FOUND',
            `Template ${templateId} not found`
          ),
        };
      }

      this.templates.delete(templateId);
      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_DELETION_FAILED',
          'Failed to delete workflow template',
          { templateId, originalError: error }
        ),
      };
    }
  }

  /**
   * Get workflow template by ID
   */
  async getTemplate(
    templateId: string
  ): Promise<Result<WorkflowTemplate, ServiceError>> {
    try {
      const mockTemplate = this.templates.get(templateId);
      if (!mockTemplate) {
        return {
          success: false,
          error: createServiceError(
            'TEMPLATE_NOT_FOUND',
            `Template ${templateId} not found`
          ),
        };
      }

      return {
        success: true,
        data: this.convertToWorkflowTemplate(mockTemplate),
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_FETCH_FAILED',
          'Failed to fetch workflow template',
          { templateId, originalError: error }
        ),
      };
    }
  }

  /**
   * List all workflow templates
   */
  async listTemplates(): Promise<Result<WorkflowTemplate[], ServiceError>> {
    try {
      const templates = Array.from(this.templates.values()).map(mockTemplate =>
        this.convertToWorkflowTemplate(mockTemplate)
      );

      return { success: true, data: templates };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATES_LIST_FAILED',
          'Failed to list workflow templates',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Start workflow execution
   */
  async startExecution(
    request: StartExecutionRequest
  ): Promise<Result<WorkflowExecution, ServiceError>> {
    try {
      const template = this.templates.get(request.templateId);
      if (!template) {
        return {
          success: false,
          error: createServiceError(
            'TEMPLATE_NOT_FOUND',
            `Template ${request.templateId} not found`
          ),
        };
      }

      const executionId = `mock_execution_${++this
        .executionCounter}_${Date.now()}`;

      const mockExecution: MockWorkflowExecution = {
        id: executionId,
        templateId: request.templateId,
        status: 'pending',
        progress: 0,
        startedAt: new Date(),
        input: request.input || {},
        stepExecutions: template.steps.map(step => ({
          id: `${executionId}_${step.id}`,
          stepId: step.id,
          status: 'pending',
          retryCount: 0,
        })),
      };

      this.executions.set(executionId, mockExecution);

      // Start async simulation
      this.executionSimulator.simulateExecution(mockExecution).catch(error => {
        console.error(
          `Mock execution ${executionId} simulation failed:`,
          error
        );
      });

      return {
        success: true,
        data: this.convertToWorkflowExecution(mockExecution),
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'EXECUTION_START_FAILED',
          'Failed to start workflow execution',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(
    executionId: string
  ): Promise<Result<ExecutionStatus, ServiceError>> {
    try {
      const mockExecution = this.executions.get(executionId);
      if (!mockExecution) {
        return {
          success: false,
          error: createServiceError(
            'EXECUTION_NOT_FOUND',
            `Execution ${executionId} not found`
          ),
        };
      }

      const executionStatus: ExecutionStatus = {
        id: mockExecution.id,
        templateId: mockExecution.templateId,
        status: mockExecution.status as ExecutionStatusEnum,
        progress: mockExecution.progress,
        currentStepId: mockExecution.currentStepId,
        startedAt: mockExecution.startedAt,
        completedAt: mockExecution.completedAt,
        error: mockExecution.error,
        stepStatuses: mockExecution.stepExecutions.map(step => ({
          stepId: step.stepId,
          status: step.status,
          startedAt: step.startedAt,
          completedAt: step.completedAt,
          error: step.error,
        })),
      };

      return { success: true, data: executionStatus };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'EXECUTION_STATUS_FAILED',
          'Failed to get execution status',
          { executionId, originalError: error }
        ),
      };
    }
  }

  /**
   * Get service health check
   */
  async getHealthCheck(): Promise<Result<MockHealthCheck, ServiceError>> {
    try {
      const health = this.healthMonitor.checkHealth();
      return { success: true, data: health };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'HEALTH_CHECK_FAILED',
          'Failed to perform health check',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Get service statistics
   */
  async getStatistics(): Promise<Result<MockStatistics, ServiceError>> {
    try {
      const stats = this.healthMonitor.getStatistics();
      return { success: true, data: stats };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'STATISTICS_FAILED',
          'Failed to get statistics',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Convert mock template to workflow template
   */
  private convertToWorkflowTemplate(
    mockTemplate: MockWorkflowTemplate
  ): WorkflowTemplate {
    return {
      id: mockTemplate.id,
      name: mockTemplate.name,
      description: mockTemplate.description,
      version: '1.0.0',
      type: 'standard',
      steps: mockTemplate.steps.map((step: any, index: number) => ({
        stepId: step.id,
        name: step.name,
        type: 'ACTION' as any,
        handler: step.handlerType,
        handlerConfig: step.configuration,
        order: index + 1,
        dependencies: step.dependencies,
        timeout: step.timeout,
        retries: step.retries,
      })),
      variables: mockTemplate.variables,
      active: mockTemplate.isActive,
      metadata: {
        createdAt: mockTemplate.createdAt,
        updatedAt: mockTemplate.updatedAt,
      },
    };
  }

  /**
   * Convert mock execution to workflow execution
   */
  private convertToWorkflowExecution(
    mockExecution: MockWorkflowExecution
  ): WorkflowExecution {
    // Map mock status to WorkflowStatus
    const statusMap: Record<string, any> = {
      pending: 'PENDING',
      running: 'RUNNING',
      paused: 'PAUSED',
      completed: 'COMPLETED',
      failed: 'FAILED',
      cancelled: 'CANCELLED',
    };

    return {
      id: mockExecution.id,
      workflowId: mockExecution.templateId,
      status: statusMap[mockExecution.status] || 'PENDING',
      currentStep: 0,
      currentStepId: mockExecution.currentStepId,
      input: mockExecution.input,
      output: mockExecution.output,
      variables: {},
      startTime: mockExecution.startedAt,
      endTime: mockExecution.completedAt,
      totalSteps: mockExecution.stepExecutions.length,
      completedSteps: mockExecution.stepExecutions.filter(
        s => s.status === 'completed'
      ).length,
      failedSteps: mockExecution.stepExecutions.filter(
        s => s.status === 'failed'
      ).length,
      skippedSteps: mockExecution.stepExecutions.filter(
        s => s.status === 'skipped'
      ).length,
      error: mockExecution.error,
      priority: 'normal',
    };
  }

  // Additional methods for pause/resume/cancel
  async pauseExecution(
    executionId: string
  ): Promise<Result<void, ServiceError>> {
    const mockExecution = this.executions.get(executionId);
    if (!mockExecution) {
      return {
        success: false,
        error: createServiceError(
          'EXECUTION_NOT_FOUND',
          `Execution ${executionId} not found`
        ),
      };
    }

    if (mockExecution.status === 'running') {
      mockExecution.status = 'paused';
    }

    return { success: true, data: undefined };
  }

  async resumeExecution(
    executionId: string
  ): Promise<Result<void, ServiceError>> {
    const mockExecution = this.executions.get(executionId);
    if (!mockExecution) {
      return {
        success: false,
        error: createServiceError(
          'EXECUTION_NOT_FOUND',
          `Execution ${executionId} not found`
        ),
      };
    }

    if (mockExecution.status === 'paused') {
      mockExecution.status = 'running';
      this.executionSimulator.simulateExecution(mockExecution);
    }

    return { success: true, data: undefined };
  }

  async cancelExecution(
    executionId: string
  ): Promise<Result<void, ServiceError>> {
    const mockExecution = this.executions.get(executionId);
    if (!mockExecution) {
      return {
        success: false,
        error: createServiceError(
          'EXECUTION_NOT_FOUND',
          `Execution ${executionId} not found`
        ),
      };
    }

    mockExecution.status = 'cancelled';
    mockExecution.completedAt = new Date();

    return { success: true, data: undefined };
  }

  async getExecutionHistory(): Promise<
    Result<WorkflowExecution[], ServiceError>
  > {
    try {
      const executions = Array.from(this.executions.values()).map(
        mockExecution => this.convertToWorkflowExecution(mockExecution)
      );

      return { success: true, data: executions };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'EXECUTION_HISTORY_FAILED',
          'Failed to get execution history',
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Get execution by ID
   */
  async getExecution(
    executionId: string
  ): Promise<Result<WorkflowExecution, ServiceError>> {
    try {
      const mockExecution = this.executions.get(executionId);
      if (!mockExecution) {
        return {
          success: false,
          error: createServiceError(
            'EXECUTION_NOT_FOUND',
            `Execution ${executionId} not found`
          ),
        };
      }

      return {
        success: true,
        data: this.convertToWorkflowExecution(mockExecution),
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'EXECUTION_FETCH_FAILED',
          'Failed to fetch workflow execution',
          { executionId, originalError: error }
        ),
      };
    }
  }

  /**
   * Get step execution details
   */
  async getStepExecution(
    executionId: string,
    stepId: string
  ): Promise<Result<any, ServiceError>> {
    try {
      const mockExecution = this.executions.get(executionId);
      if (!mockExecution) {
        return {
          success: false,
          error: createServiceError(
            'EXECUTION_NOT_FOUND',
            `Execution ${executionId} not found`
          ),
        };
      }

      const stepExecution = mockExecution.stepExecutions.find(
        s => s.stepId === stepId
      );
      if (!stepExecution) {
        return {
          success: false,
          error: createServiceError(
            'STEP_NOT_FOUND',
            `Step ${stepId} not found in execution ${executionId}`
          ),
        };
      }

      return { success: true, data: stepExecution };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'STEP_FETCH_FAILED',
          'Failed to fetch step execution',
          { executionId, stepId, originalError: error }
        ),
      };
    }
  }

  /**
   * Retry failed step
   */
  async retryStep(
    executionId: string,
    stepId: string
  ): Promise<Result<void, ServiceError>> {
    try {
      const mockExecution = this.executions.get(executionId);
      if (!mockExecution) {
        return {
          success: false,
          error: createServiceError(
            'EXECUTION_NOT_FOUND',
            `Execution ${executionId} not found`
          ),
        };
      }

      const stepExecution = mockExecution.stepExecutions.find(
        s => s.stepId === stepId
      );
      if (!stepExecution) {
        return {
          success: false,
          error: createServiceError(
            'STEP_NOT_FOUND',
            `Step ${stepId} not found`
          ),
        };
      }

      if (stepExecution.status !== 'failed') {
        return {
          success: false,
          error: createServiceError(
            'STEP_NOT_FAILED',
            `Step ${stepId} is not in failed state`
          ),
        };
      }

      // Reset step for retry
      stepExecution.status = 'pending';
      stepExecution.error = undefined;
      stepExecution.retryCount++;

      // Simulate retry
      const template = this.templates.get(mockExecution.templateId);
      if (template) {
        const stepTemplate = template.steps.find(s => s.id === stepId);
        if (stepTemplate) {
          this.executionSimulator.simulateStepExecution(
            stepExecution,
            stepTemplate
          );
        }
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createServiceError('STEP_RETRY_FAILED', 'Failed to retry step', {
          executionId,
          stepId,
          originalError: error,
        }),
      };
    }
  }

  /**
   * Skip failed step
   */
  async skipStep(
    executionId: string,
    stepId: string
  ): Promise<Result<void, ServiceError>> {
    try {
      const mockExecution = this.executions.get(executionId);
      if (!mockExecution) {
        return {
          success: false,
          error: createServiceError(
            'EXECUTION_NOT_FOUND',
            `Execution ${executionId} not found`
          ),
        };
      }

      const stepExecution = mockExecution.stepExecutions.find(
        s => s.stepId === stepId
      );
      if (!stepExecution) {
        return {
          success: false,
          error: createServiceError(
            'STEP_NOT_FOUND',
            `Step ${stepId} not found`
          ),
        };
      }

      stepExecution.status = 'skipped';
      stepExecution.completedAt = new Date();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createServiceError('STEP_SKIP_FAILED', 'Failed to skip step', {
          executionId,
          stepId,
          originalError: error,
        }),
      };
    }
  }

  /**
   * Update execution variables
   */
  async updateExecutionVariables(
    executionId: string,
    variables: Record<string, any>
  ): Promise<Result<void, ServiceError>> {
    try {
      const mockExecution = this.executions.get(executionId);
      if (!mockExecution) {
        return {
          success: false,
          error: createServiceError(
            'EXECUTION_NOT_FOUND',
            `Execution ${executionId} not found`
          ),
        };
      }

      mockExecution.input = { ...mockExecution.input, ...variables };

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'VARIABLES_UPDATE_FAILED',
          'Failed to update execution variables',
          { executionId, originalError: error }
        ),
      };
    }
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(
    executionId: string
  ): Promise<Result<any[], ServiceError>> {
    try {
      const mockExecution = this.executions.get(executionId);
      if (!mockExecution) {
        return {
          success: false,
          error: createServiceError(
            'EXECUTION_NOT_FOUND',
            `Execution ${executionId} not found`
          ),
        };
      }

      // Generate mock logs
      const logs = [];
      logs.push({
        id: `log_${Date.now()}_1`,
        timestamp: mockExecution.startedAt,
        level: 'info',
        message: `Workflow execution ${executionId} started`,
        context: { executionId, templateId: mockExecution.templateId },
      });

      for (const step of mockExecution.stepExecutions) {
        if (step.startedAt) {
          logs.push({
            id: `log_${Date.now()}_step_${step.stepId}`,
            timestamp: step.startedAt,
            level: step.status === 'failed' ? 'error' : 'info',
            message: `Step ${step.stepId} ${step.status}`,
            context: {
              executionId,
              stepId: step.stepId,
              status: step.status,
              error: step.error,
            },
          });
        }
      }

      if (mockExecution.completedAt) {
        logs.push({
          id: `log_${Date.now()}_end`,
          timestamp: mockExecution.completedAt,
          level: mockExecution.status === 'failed' ? 'error' : 'info',
          message: `Workflow execution ${executionId} ${mockExecution.status}`,
          context: {
            executionId,
            status: mockExecution.status,
            error: mockExecution.error,
          },
        });
      }

      return { success: true, data: logs };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'LOGS_FETCH_FAILED',
          'Failed to fetch execution logs',
          { executionId, originalError: error }
        ),
      };
    }
  }

  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(
    templateId?: string
  ): Promise<Result<any, ServiceError>> {
    try {
      let executions = Array.from(this.executions.values());

      if (templateId) {
        executions = executions.filter(e => e.templateId === templateId);
      }

      const metrics = {
        totalExecutions: executions.length,
        completedExecutions: executions.filter(e => e.status === 'completed')
          .length,
        failedExecutions: executions.filter(e => e.status === 'failed').length,
        runningExecutions: executions.filter(e => e.status === 'running')
          .length,
        averageExecutionTime: this.calculateAverageExecutionTime(executions),
        successRate:
          executions.length > 0
            ? (executions.filter(e => e.status === 'completed').length /
                executions.length) *
              100
            : 0,
        executionsByDay: this.groupExecutionsByDay(executions),
        stepMetrics: this.calculateStepMetrics(executions),
        performanceStats: {
          minExecutionTime: this.getMinExecutionTime(executions),
          maxExecutionTime: this.getMaxExecutionTime(executions),
          medianExecutionTime: this.getMedianExecutionTime(executions),
        },
      };

      return { success: true, data: metrics };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'METRICS_CALCULATION_FAILED',
          'Failed to calculate workflow metrics',
          { templateId, originalError: error }
        ),
      };
    }
  }

  /**
   * Validate workflow template
   */
  async validateTemplate(
    templateData: any
  ): Promise<Result<any, ServiceError>> {
    try {
      const validationResult = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        suggestions: [] as string[],
      };

      this.validateBasicTemplateStructure(templateData, validationResult);

      if (templateData.steps) {
        this.validateTemplateSteps(templateData.steps, validationResult);
        this.validateStepDependencies(templateData.steps, validationResult);
        this.addPerformanceSuggestions(templateData.steps, validationResult);
      }

      return { success: true, data: validationResult };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_VALIDATION_FAILED',
          'Failed to validate workflow template',
          { originalError: error }
        ),
      };
    }
  }

  private validateBasicTemplateStructure(templateData: any, result: any): void {
    if (!templateData.name || templateData.name.trim() === '') {
      result.isValid = false;
      result.errors.push('Template name is required');
    }

    if (
      !templateData.steps ||
      !Array.isArray(templateData.steps) ||
      templateData.steps.length === 0
    ) {
      result.isValid = false;
      result.errors.push('Template must have at least one step');
    }
  }

  private validateTemplateSteps(steps: any[], result: any): void {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepPrefix = `Step ${i + 1}`;

      if (!step.id || step.id.trim() === '') {
        result.isValid = false;
        result.errors.push(`${stepPrefix}: Step ID is required`);
      }

      if (!step.name || step.name.trim() === '') {
        result.isValid = false;
        result.errors.push(`${stepPrefix}: Step name is required`);
      }

      if (!step.handlerType || step.handlerType.trim() === '') {
        result.isValid = false;
        result.errors.push(`${stepPrefix}: Handler type is required`);
      }

      this.validateStepConfiguration(step, stepPrefix, result);
    }
  }

  private validateStepConfiguration(
    step: any,
    stepPrefix: string,
    result: any
  ): void {
    if (step.dependencies && step.dependencies.includes(step.id)) {
      result.isValid = false;
      result.errors.push(`${stepPrefix}: Step cannot depend on itself`);
    }

    if (step.timeout && (step.timeout < 1000 || step.timeout > 3600000)) {
      result.warnings.push(
        `${stepPrefix}: Timeout should be between 1s and 1h`
      );
    }

    if (step.retries && (step.retries < 0 || step.retries > 10)) {
      result.warnings.push(`${stepPrefix}: Retries should be between 0 and 10`);
    }
  }

  private validateStepDependencies(steps: any[], result: any): void {
    const dependencyGraph = this.buildDependencyGraph(steps);
    if (this.hasCycles(dependencyGraph)) {
      result.isValid = false;
      result.errors.push('Template has circular dependencies');
    }
  }

  private addPerformanceSuggestions(steps: any[], result: any): void {
    if (steps.length > 20) {
      result.suggestions.push(
        'Consider breaking down large workflows into smaller ones'
      );
    }
  }

  /**
   * Clone workflow template
   */
  async cloneTemplate(
    templateId: string,
    newName?: string
  ): Promise<Result<WorkflowTemplate, ServiceError>> {
    try {
      const originalTemplate = this.templates.get(templateId);
      if (!originalTemplate) {
        return {
          success: false,
          error: createServiceError(
            'TEMPLATE_NOT_FOUND',
            `Template ${templateId} not found`
          ),
        };
      }

      const clonedTemplate: MockWorkflowTemplate = {
        id: `clone_${++this.templateCounter}_${Date.now()}`,
        name: newName || `${originalTemplate.name} (Copy)`,
        description: originalTemplate.description,
        steps: originalTemplate.steps.map(step => ({
          ...step,
          id: `${step.id}_clone_${Date.now()}`,
        })),
        variables: { ...originalTemplate.variables },
        isActive: false, // Clone starts as inactive
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.templates.set(clonedTemplate.id, clonedTemplate);

      return {
        success: true,
        data: this.convertToWorkflowTemplate(clonedTemplate),
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_CLONE_FAILED',
          'Failed to clone workflow template',
          { templateId, originalError: error }
        ),
      };
    }
  }

  /**
   * Bulk operations for templates
   */
  async bulkUpdateTemplates(
    templateIds: string[],
    updates: Partial<UpdateTemplateRequest>
  ): Promise<Result<WorkflowTemplate[], ServiceError>> {
    try {
      const updatedTemplates: WorkflowTemplate[] = [];
      const errors: string[] = [];

      for (const templateId of templateIds) {
        const result = await this.updateTemplate(templateId, updates);
        if (result.success) {
          updatedTemplates.push(result.data);
        } else {
          errors.push(`${templateId}: Update failed`);
        }
      }

      if (errors.length > 0 && updatedTemplates.length === 0) {
        return {
          success: false,
          error: createServiceError(
            'BULK_UPDATE_FAILED',
            'All bulk updates failed',
            { errors }
          ),
        };
      }

      return { success: true, data: updatedTemplates };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'BULK_UPDATE_ERROR',
          'Bulk update operation failed',
          { templateIds, originalError: error }
        ),
      };
    }
  }

  /**
   * Search templates
   */
  async searchTemplates(
    query: string
  ): Promise<Result<WorkflowTemplate[], ServiceError>> {
    try {
      const searchQuery = query.toLowerCase();
      const matchingTemplates = Array.from(this.templates.values())
        .filter(
          template =>
            template.name.toLowerCase().includes(searchQuery) ||
            (template.description &&
              template.description.toLowerCase().includes(searchQuery)) ||
            template.steps.some(
              step =>
                step.name.toLowerCase().includes(searchQuery) ||
                step.type.toLowerCase().includes(searchQuery) ||
                step.handlerType.toLowerCase().includes(searchQuery)
            )
        )
        .map(template => this.convertToWorkflowTemplate(template));

      return { success: true, data: matchingTemplates };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_SEARCH_FAILED',
          'Failed to search workflow templates',
          { query, originalError: error }
        ),
      };
    }
  }

  /**
   * Export template as JSON
   */
  async exportTemplate(
    templateId: string
  ): Promise<Result<string, ServiceError>> {
    try {
      const template = this.templates.get(templateId);
      if (!template) {
        return {
          success: false,
          error: createServiceError(
            'TEMPLATE_NOT_FOUND',
            `Template ${templateId} not found`
          ),
        };
      }

      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        template: this.convertToWorkflowTemplate(template),
      };

      return { success: true, data: JSON.stringify(exportData, null, 2) };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_EXPORT_FAILED',
          'Failed to export workflow template',
          { templateId, originalError: error }
        ),
      };
    }
  }

  /**
   * Import template from JSON
   */
  async importTemplate(
    templateJson: string
  ): Promise<Result<WorkflowTemplate, ServiceError>> {
    try {
      const importData = JSON.parse(templateJson);

      if (!importData.template) {
        return {
          success: false,
          error: createServiceError(
            'INVALID_IMPORT',
            'Invalid import format - missing template'
          ),
        };
      }

      const template = importData.template;

      // Create new template with imported data
      const createRequest: CreateTemplateRequest = {
        name: `${template.name} (Imported)`,
        description: template.description,
        steps: template.steps || [],
        variables: template.variables || {},
      };

      return await this.createTemplate(createRequest);
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TEMPLATE_IMPORT_FAILED',
          'Failed to import workflow template',
          { originalError: error }
        ),
      };
    }
  }

  // Helper methods for metrics and validation
  private calculateAverageExecutionTime(
    executions: MockWorkflowExecution[]
  ): number {
    const completed = executions.filter(
      e => e.status === 'completed' && e.startedAt && e.completedAt
    );
    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, e) => {
      return sum + (e.completedAt!.getTime() - e.startedAt.getTime());
    }, 0);

    return totalTime / completed.length;
  }

  private groupExecutionsByDay(
    executions: MockWorkflowExecution[]
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    executions.forEach(e => {
      const day = e.startedAt.toISOString().split('T')[0];
      grouped[day] = (grouped[day] || 0) + 1;
    });

    return grouped;
  }

  private calculateStepMetrics(executions: MockWorkflowExecution[]): any {
    const stepStats: Record<string, any> = {};

    executions.forEach(e => {
      e.stepExecutions.forEach(step => {
        if (!stepStats[step.stepId]) {
          stepStats[step.stepId] = {
            totalExecutions: 0,
            successfulExecutions: 0,
            failedExecutions: 0,
            averageDuration: 0,
            totalDuration: 0,
          };
        }

        stepStats[step.stepId].totalExecutions++;

        if (step.status === 'completed') {
          stepStats[step.stepId].successfulExecutions++;
        } else if (step.status === 'failed') {
          stepStats[step.stepId].failedExecutions++;
        }

        if (step.duration) {
          stepStats[step.stepId].totalDuration += step.duration;
          stepStats[step.stepId].averageDuration =
            stepStats[step.stepId].totalDuration /
            stepStats[step.stepId].totalExecutions;
        }
      });
    });

    return stepStats;
  }

  private getMinExecutionTime(executions: MockWorkflowExecution[]): number {
    const times = this.getExecutionTimes(executions);
    return times.length > 0 ? Math.min(...times) : 0;
  }

  private getMaxExecutionTime(executions: MockWorkflowExecution[]): number {
    const times = this.getExecutionTimes(executions);
    return times.length > 0 ? Math.max(...times) : 0;
  }

  private getMedianExecutionTime(executions: MockWorkflowExecution[]): number {
    const times = this.getExecutionTimes(executions).sort((a, b) => a - b);
    if (times.length === 0) return 0;

    const mid = Math.floor(times.length / 2);
    return times.length % 2 === 0
      ? (times[mid - 1] + times[mid]) / 2
      : times[mid];
  }

  private getExecutionTimes(executions: MockWorkflowExecution[]): number[] {
    return executions
      .filter(e => e.status === 'completed' && e.startedAt && e.completedAt)
      .map(e => e.completedAt!.getTime() - e.startedAt.getTime());
  }

  private buildDependencyGraph(steps: any[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    steps.forEach(step => {
      graph.set(step.id, step.dependencies || []);
    });

    return graph;
  }

  private hasCycles(graph: Map<string, string[]>): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycleDFS = (node: string): boolean => {
      if (recursionStack.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const dependencies = graph.get(node) || [];
      for (const dep of dependencies) {
        if (hasCycleDFS(dep)) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    const nodes = Array.from(graph.keys());
    for (const node of nodes) {
      if (hasCycleDFS(node)) return true;
    }

    return false;
  }

  /**
   * Cleanup old executions
   */
  async cleanupOldExecutions(
    daysToKeep: number = 30
  ): Promise<Result<number, ServiceError>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const executionsToDelete = Array.from(this.executions.entries())
        .filter(([, execution]) => execution.startedAt < cutoffDate)
        .map(([id]) => id);

      executionsToDelete.forEach(id => {
        this.executions.delete(id);
      });

      return { success: true, data: executionsToDelete.length };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'CLEANUP_FAILED',
          'Failed to cleanup old executions',
          { daysToKeep, originalError: error }
        ),
      };
    }
  }

  /**
   * Reset all data (for testing)
   */
  async resetAllData(): Promise<Result<void, ServiceError>> {
    try {
      this.templates.clear();
      this.executions.clear();
      this.isInitialized = false;
      this.executionCounter = 0;
      this.templateCounter = 0;

      this.initialize();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createServiceError('RESET_FAILED', 'Failed to reset mock data', {
          originalError: error,
        }),
      };
    }
  }

  // Alias methods for compatibility with different naming conventions
  async getWorkflowTemplates(): Promise<
    Result<WorkflowTemplate[], ServiceError>
  > {
    // Ignore filters for now in mock implementation
    return this.listTemplates();
  }

  async getWorkflowTemplate(
    templateId: string
  ): Promise<Result<WorkflowTemplate, ServiceError>> {
    return this.getTemplate(templateId);
  }

  async isHealthy(): Promise<boolean> {
    const healthResult = await this.getHealthCheck();
    return healthResult.success && healthResult.data.status === 'healthy';
  }
}

/**
 * Factory function to create mock workflow engine
 */
export function createMockWorkflowEngine(): MockWorkflowEngineService {
  return new MockWorkflowEngineService();
}
