/**
 * Workflow Execution Manager
 * Handles workflow execution orchestration with database persistence
 * Part 1: Core execution management (< 500 lines)
 */

import { PrismaClient } from '@prisma/client';
import {
  WorkflowTemplate,
  WorkflowExecution,
  WorkflowEngineError,
} from './types';
import { Result } from '../../providers/ml-provider.interface';
import { WorkflowValidator } from './validator';
import { WorkflowMonitor } from './monitor';
import { HandlerRegistry } from './registry';
import {
  mapPrismaToTemplate,
  mapPrismaToExecution,
  executionToCreateData,
  stepsToExecutionData,
} from './mappers';

export interface ExecutionContext {
  workflowId: string;
  runId: string;
  input: any;
  variables: Record<string, any>;
  metadata: Record<string, any>;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionId: string;
  duration: number;
  completedSteps: number;
  totalSteps: number;
}

export interface ExecutionOptions {
  priority?: 'low' | 'medium' | 'high' | 'critical';
  timeout?: number;
  maxRetries?: number;
  continueOnError?: boolean;
  executor?: string;
  executorType?: 'user' | 'system' | 'schedule' | 'webhook';
}

/**
 * Workflow Execution Manager
 * Orchestrates workflow execution with full database persistence
 */
export class WorkflowExecutionManager {
  private prisma: PrismaClient;
  private validator: WorkflowValidator;
  private monitor: WorkflowMonitor;
  private handlerRegistry: HandlerRegistry;
  private activeExecutions = new Map<string, ExecutionContext>();

  constructor(
    prisma: PrismaClient,
    monitor: WorkflowMonitor,
    handlerRegistry: HandlerRegistry
  ) {
    this.prisma = prisma;
    this.validator = new WorkflowValidator();
    this.monitor = monitor;
    this.handlerRegistry = handlerRegistry;
  }

  /**
   * Start workflow execution
   */
  async startExecution(
    templateId: string,
    input: any = {}
  ): Promise<Result<ExecutionResult, WorkflowEngineError>> {
    try {
      // Get workflow template with validation
      const template = await this.getWorkflowTemplate(templateId);
      if (!template.success) return template as any;

      // Validate execution input
      const validation = await this.validateExecutionInput(
        template.data,
        input
      );
      if (!validation.success) return validation as any;

      // Create execution record
      const execution = await this.createExecution(template.data, input);
      if (!execution.success) return execution as any;

      // Start monitoring
      this.startExecutionMonitoring(execution.data);

      // Execute workflow in background
      this.executeWorkflowAsync(execution.data).catch(error => {
        console.error('Workflow execution failed:', error);
      });

      return {
        success: true,
        data: {
          success: true,
          executionId: execution.data.id || '',
          duration: 0,
          completedSteps: 0,
          totalSteps: template.data.steps?.length || 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'EXECUTION_START_FAILED',
          `Failed to start execution: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(
    runId: string
  ): Promise<Result<WorkflowExecution, WorkflowEngineError>> {
    try {
      const execution = await this.prisma.workflowRun.findUnique({
        where: { id: runId },
        include: {
          workflow: true,
          steps: {
            orderBy: { createdAt: 'asc' },
          },
          events: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!execution) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'EXECUTION_NOT_FOUND',
            `Execution not found: ${runId}`
          ),
        };
      }

      const result = mapPrismaToExecution(execution);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'EXECUTION_STATUS_FAILED',
          `Failed to get execution status: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /**
   * Pause workflow execution
   */
  async pauseExecution(
    runId: string
  ): Promise<Result<boolean, WorkflowEngineError>> {
    try {
      await this.prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: 'paused',
          updatedAt: new Date(),
        },
      });

      // Remove from active executions
      this.activeExecutions.delete(runId);

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'EXECUTION_PAUSE_FAILED',
          `Failed to pause execution: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /**
   * Resume workflow execution
   */
  async resumeExecution(
    runId: string
  ): Promise<Result<boolean, WorkflowEngineError>> {
    try {
      const execution = await this.prisma.workflowRun.findUnique({
        where: { id: runId },
        include: { workflow: true },
      });

      if (!execution) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'EXECUTION_NOT_FOUND',
            `Execution not found: ${runId}`
          ),
        };
      }

      if (execution.status !== 'paused') {
        return {
          success: false,
          error: new WorkflowEngineError(
            'INVALID_STATUS',
            'Execution is not paused'
          ),
        };
      }

      await this.prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: 'running',
          updatedAt: new Date(),
        },
      });

      // Resume execution
      const mappedExecution = mapPrismaToExecution(execution);
      this.executeWorkflowAsync(mappedExecution).catch(error => {
        console.error('Workflow resume failed:', error);
      });

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'EXECUTION_RESUME_FAILED',
          `Failed to resume execution: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /**
   * Cancel workflow execution
   */
  async cancelExecution(
    runId: string,
    reason?: string
  ): Promise<Result<boolean, WorkflowEngineError>> {
    try {
      await this.prisma.workflowRun.update({
        where: { id: runId },
        data: {
          status: 'cancelled',
          error: reason || 'Execution cancelled by user',
          endTime: new Date(),
          updatedAt: new Date(),
        },
      });

      // Remove from active executions
      this.activeExecutions.delete(runId);

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'EXECUTION_CANCEL_FAILED',
          `Failed to cancel execution: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    templateId?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Result<WorkflowExecution[], WorkflowEngineError>> {
    try {
      const where = templateId ? { workflowId: templateId } : {};

      const executions = await this.prisma.workflowRun.findMany({
        where,
        include: {
          workflow: true,
          steps: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const result = executions.map(execution =>
        mapPrismaToExecution(execution)
      );
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'EXECUTION_HISTORY_FAILED',
          `Failed to get execution history: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /**
   * Get active executions
   */
  async getActiveExecutions(): Promise<
    Result<WorkflowExecution[], WorkflowEngineError>
  > {
    try {
      const executions = await this.prisma.workflowRun.findMany({
        where: {
          status: { in: ['pending', 'running'] },
        },
        include: {
          workflow: true,
          steps: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const result = executions.map(execution =>
        mapPrismaToExecution(execution)
      );
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'ACTIVE_EXECUTIONS_FAILED',
          `Failed to get active executions: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  // Private helper methods for execution management

  private async getWorkflowTemplate(
    templateId: string
  ): Promise<Result<WorkflowTemplate, WorkflowEngineError>> {
    const template = await this.prisma.workflowTemplate.findUnique({
      where: { id: templateId },
      include: {
        stepTemplates: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'TEMPLATE_NOT_FOUND',
          `Template not found: ${templateId}`
        ),
      };
    }

    const result = mapPrismaToTemplate(template);
    return { success: true, data: result };
  }

  private async validateExecutionInput(
    template: WorkflowTemplate,
    input: any
  ): Promise<Result<boolean, WorkflowEngineError>> {
    try {
      // Validate against input schema if defined
      if (
        template.inputSchema &&
        Object.keys(template.inputSchema).length > 0
      ) {
        const validation = WorkflowValidator.validateInput(
          input,
          template.inputSchema as any
        );
        if (!validation.success) {
          return {
            success: false,
            error: new WorkflowEngineError(
              'INPUT_VALIDATION_FAILED',
              validation.errors.join(', ')
            ),
          };
        }
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'INPUT_VALIDATION_ERROR',
          `Input validation error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  private async createExecution(
    template: WorkflowTemplate,
    input: any
  ): Promise<Result<WorkflowExecution, WorkflowEngineError>> {
    try {
      const executionData = executionToCreateData(
        template.id || '',
        input,
        {},
        {},
        template.steps?.length || 0
      );

      const execution = await this.prisma.workflowRun.create({
        data: executionData,
        include: {
          workflow: true,
          steps: true,
        },
      });

      // Create step executions
      if (template.steps && template.steps.length > 0) {
        const stepData = stepsToExecutionData(template.steps, execution.id);
        await this.prisma.workflowStepExecution.createMany({
          data: stepData,
        });
      }

      // Create execution context
      const context: ExecutionContext = {
        workflowId: template.id || '',
        runId: execution.id,
        input,
        variables: (execution.variables as Record<string, any>) || {},
        metadata: {},
      };

      this.activeExecutions.set(execution.id, context);

      const result = mapPrismaToExecution(execution);
      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'EXECUTION_CREATE_FAILED',
          `Failed to create execution: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  private startExecutionMonitoring(execution: WorkflowExecution): void {
    // Start monitoring with existing monitor
    this.monitor.startMonitoring(execution as any);
  }

  private async executeWorkflowAsync(
    execution: WorkflowExecution
  ): Promise<void> {
    // This method will be implemented in workflow-executor.ts
    // For now, just update status to completed
    try {
      await this.prisma.workflowRun.update({
        where: { id: execution.id || '' },
        data: {
          status: 'completed',
          endTime: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Workflow execution error:', error);
    }
  }
}
