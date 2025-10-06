/**
 * Workflow Step Executor - comprehensive step execution with retry logic
 */

import { PrismaClient } from '../../generated/prisma';
import {
  WorkflowStep,
  StepExecution,
  StepStatus,
  WorkflowEngineError,
} from './types';
import { Result } from '../../providers/ml-provider.interface';
import { HandlerRegistry } from './registry';
import { WorkflowMonitor } from './monitor';

export interface StepExecutionContext {
  stepId: string;
  workflowRunId: string;
  input: any;
  variables: Record<string, any>;
  metadata: Record<string, any>;
  attempt: number;
  maxAttempts: number;
}

export interface StepExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
  nextStepId?: string;
  shouldContinue: boolean;
  updatedVariables?: Record<string, any>;
}

export interface StepExecutorOptions {
  timeout?: number;
  retryDelay?: number;
  continueOnError?: boolean;
  skipDependencyCheck?: boolean;
}

/**
 * Workflow Step Executor - executes steps with error handling and retry logic
 */
export class WorkflowStepExecutor {
  private prisma: PrismaClient;
  private handlerRegistry: HandlerRegistry;
  private monitor: WorkflowMonitor;
  private activeSteps = new Map<string, StepExecutionContext>();

  constructor(
    prisma: PrismaClient,
    handlerRegistry: HandlerRegistry,
    monitor: WorkflowMonitor
  ) {
    this.prisma = prisma;
    this.handlerRegistry = handlerRegistry;
    this.monitor = monitor;
  }

  /**
   * Execute a workflow step
   */
  async executeStep(
    step: WorkflowStep,
    context: StepExecutionContext,
    options: StepExecutorOptions = {}
  ): Promise<Result<StepExecutionResult, WorkflowEngineError>> {
    try {
      // Validate prerequisites
      const prereqResult = await this.validateStepPrerequisites(
        step,
        context,
        options
      );
      if (!prereqResult.success) {
        return prereqResult as Result<StepExecutionResult, WorkflowEngineError>;
      }
      // Execute with retry logic
      return await this.executeStepWithRetry(step, context, options);
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'STEP_EXECUTION_ERROR',
          `Critical error executing step ${step.stepId}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    } finally {
      this.activeSteps.delete(`${context.workflowRunId}-${step.stepId}`);
    }
  }

  /**
   * Validate step prerequisites (dependencies and conditions)
   */
  private async validateStepPrerequisites(
    step: WorkflowStep,
    context: StepExecutionContext,
    options: StepExecutorOptions
  ): Promise<Result<boolean, WorkflowEngineError>> {
    // Validate dependencies
    if (!options.skipDependencyCheck) {
      const depCheck = await this.checkDependencies(
        step,
        context.workflowRunId
      );
      if (!depCheck.success) return depCheck;
    }

    // Check conditions
    const conditionCheck = await this.evaluateConditions(step, context);
    if (!conditionCheck.success) {
      // Conditions not met, skip step
      return {
        success: false,
        error: new WorkflowEngineError(
          'STEP_SKIPPED',
          'Step conditions not met'
        ),
      };
    }

    return { success: true, data: true };
  }

  /**
   * Execute step with retry logic
   */
  private async executeStepWithRetry(
    step: WorkflowStep,
    context: StepExecutionContext,
    options: StepExecutorOptions
  ): Promise<Result<StepExecutionResult, WorkflowEngineError>> {
    const startTime = new Date();
    const maxAttempts = context.maxAttempts || step.retries || 1;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await this.executeSingleStepAttempt(
          step,
          context,
          options,
          startTime,
          attempt
        );

        if (result.success) {
          return result;
        } else {
          lastError = new Error('Step execution failed');
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error('Unknown step error');

        if (attempt < maxAttempts) {
          await this.handleRetryDelay(step, options);
        }
      }
    }

    // All attempts failed
    return await this.handleStepFailure(
      step,
      context,
      startTime,
      lastError,
      options
    );
  }

  /**
   * Execute a single step attempt
   */
  private async executeSingleStepAttempt(
    step: WorkflowStep,
    context: StepExecutionContext,
    options: StepExecutorOptions,
    startTime: Date,
    attempt: number
  ): Promise<Result<StepExecutionResult, WorkflowEngineError>> {
    // Update step execution record
    await this.updateStepExecution(context.stepId, context.workflowRunId, {
      status: 'running',
      attempt,
      startTime,
      input: context.input,
    });

    // Execute the actual step
    const result = await this.executeStepHandler(step, context, options);

    if (result.success) {
      return await this.handleStepSuccess(
        step,
        context,
        startTime,
        result.data
      );
    }

    return result as Result<StepExecutionResult, WorkflowEngineError>;
  }

  /**
   * Execute multiple steps in parallel
   */
  async executeStepsInParallel(
    steps: WorkflowStep[],
    contexts: StepExecutionContext[],
    options: StepExecutorOptions = {}
  ): Promise<Result<StepExecutionResult[], WorkflowEngineError>> {
    try {
      const promises = steps.map((step, index) =>
        this.executeStep(step, contexts[index], options)
      );

      const results = await Promise.allSettled(promises);
      const stepResults: StepExecutionResult[] = [];
      let hasFailures = false;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];

        if (result.status === 'fulfilled' && result.value.success) {
          stepResults.push(result.value.data);
        } else {
          hasFailures = true;
          const errorMsg =
            result.status === 'rejected'
              ? result.reason?.message || 'Parallel step execution failed'
              : 'Parallel step execution failed';

          stepResults.push({
            success: false,
            error: errorMsg,
            duration: 0,
            shouldContinue: options.continueOnError || false,
          });
        }
      }

      if (hasFailures && !options.continueOnError) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'PARALLEL_EXECUTION_FAILED',
            'One or more parallel steps failed'
          ),
        };
      }

      return { success: true, data: stepResults };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'PARALLEL_EXECUTION_ERROR',
          `Failed to execute steps in parallel: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /**
   * Get step execution status
   */
  async getStepStatus(
    stepId: string,
    workflowRunId: string
  ): Promise<Result<StepExecution, WorkflowEngineError>> {
    try {
      const execution = await this.prisma.workflowStepExecution.findFirst({
        where: {
          stepId,
          workflowRunId,
        },
      });

      if (!execution) {
        return {
          success: false,
          error: new WorkflowEngineError(
            'STEP_EXECUTION_NOT_FOUND',
            `Step execution not found: ${stepId}`
          ),
        };
      }

      const result: StepExecution = {
        id: execution.id,
        workflowRunId: execution.workflowRunId,
        stepId: execution.stepId,
        status: execution.status as StepStatus,
        attempt: execution.attempt || 1,
        maxAttempts: execution.maxAttempts || 1,
        retryCount: execution.attempt ? execution.attempt - 1 : 0,
        input: execution.input as any,
        output: execution.output as any,
        startTime: execution.startTime || undefined,
        endTime: execution.endTime || undefined,
        duration: execution.duration || undefined,
        error: execution.error || undefined,
      };

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'STEP_STATUS_ERROR',
          `Failed to get step status: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  /** Handle step success */
  private async handleStepSuccess(
    step: WorkflowStep,
    context: StepExecutionContext,
    startTime: Date,
    stepResult: any
  ): Promise<Result<StepExecutionResult, WorkflowEngineError>> {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    await this.updateStepExecution(context.stepId, context.workflowRunId, {
      status: 'completed',
      endTime,
      duration,
      output: stepResult?.output,
    });

    return {
      success: true,
      data: {
        success: true,
        output: stepResult?.output,
        duration,
        shouldContinue: true,
        nextStepId: this.getNextStepId(step),
        updatedVariables: stepResult?.variables || {},
      },
    };
  }

  /** Handle step failure */
  private async handleStepFailure(
    step: WorkflowStep,
    context: StepExecutionContext,
    startTime: Date,
    lastError: Error | null,
    options: StepExecutorOptions
  ): Promise<Result<StepExecutionResult, WorkflowEngineError>> {
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    await this.updateStepExecution(context.stepId, context.workflowRunId, {
      status: 'failed',
      endTime,
      duration,
      error:
        lastError?.message || 'Step execution failed after all retry attempts',
    });

    const shouldContinue = this.shouldContinueOnError(step, options);

    if (shouldContinue) {
      return {
        success: true,
        data: {
          success: false,
          error: lastError?.message || 'Step execution failed',
          duration,
          shouldContinue,
          nextStepId: this.getNextStepId(step),
        },
      };
    } else {
      return {
        success: false,
        error: new WorkflowEngineError(
          'STEP_EXECUTION_FAILED',
          lastError?.message || 'Step execution failed'
        ),
      };
    }
  }

  /**
   * Handle retry delay
   */
  private async handleRetryDelay(
    step: WorkflowStep,
    options: StepExecutorOptions
  ): Promise<void> {
    const delay = options.retryDelay || step.retryDelay || 1000;
    await this.sleep(delay);
  }

  private async checkDependencies(
    step: WorkflowStep,
    workflowRunId: string
  ): Promise<Result<boolean, WorkflowEngineError>> {
    if (!step.dependencies || step.dependencies.length === 0) {
      return { success: true, data: true };
    }

    try {
      const dependencySteps = await this.prisma.workflowStepExecution.findMany({
        where: {
          workflowRunId,
          stepId: { in: step.dependencies },
        },
      });

      const completedDeps = dependencySteps.filter(
        dep => dep.status === 'completed'
      );

      if (completedDeps.length < step.dependencies.length) {
        const missingDeps = step.dependencies.filter(
          depId => !completedDeps.some(comp => comp.stepId === depId)
        );

        return {
          success: false,
          error: new WorkflowEngineError(
            'DEPENDENCY_NOT_MET',
            `Step dependencies not satisfied. Missing: ${missingDeps.join(
              ', '
            )}`
          ),
        };
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'DEPENDENCY_CHECK_ERROR',
          `Failed to check dependencies: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  private async evaluateConditions(
    step: WorkflowStep,
    context: StepExecutionContext
  ): Promise<Result<boolean, WorkflowEngineError>> {
    if (!step.conditions || step.conditions.length === 0) {
      return { success: true, data: true };
    }

    try {
      // Simple condition evaluation - can be extended with more complex logic
      for (const condition of step.conditions) {
        const fieldValue = this.getValueFromContext(condition.field, context);
        const conditionMet = this.evaluateCondition(
          fieldValue,
          condition.operator,
          condition.value
        );

        if (!conditionMet) {
          return {
            success: false,
            error: new WorkflowEngineError(
              'CONDITION_NOT_MET',
              `Condition not met for field ${condition.field}`
            ),
          };
        }
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'CONDITION_EVALUATION_ERROR',
          `Failed to evaluate conditions: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  private async executeStepHandler(
    step: WorkflowStep,
    context: StepExecutionContext,
    options: StepExecutorOptions
  ): Promise<
    Result<
      { output?: any; variables?: Record<string, any> },
      WorkflowEngineError
    >
  > {
    try {
      // Get handler from registry
      let handler: any;
      try {
        handler = this.handlerRegistry.get(step.handler);
      } catch {
        return {
          success: false,
          error: new WorkflowEngineError(
            'HANDLER_NOT_FOUND',
            `Handler not found: ${step.handler}`
          ),
        };
      }

      // Prepare handler input
      const handlerInput = {
        stepConfig: step.handlerConfig || {},
        input: context.input,
        variables: context.variables,
        metadata: context.metadata,
      };

      // Execute handler with timeout
      const timeout = options.timeout || step.timeout || 30000;
      const result = await this.executeWithTimeout(
        () => handler.execute(handlerInput),
        timeout
      );

      return {
        success: true,
        data: {
          output: (result as any)?.data || result,
          variables: (result as any)?.variables || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: new WorkflowEngineError(
          'HANDLER_EXECUTION_ERROR',
          `Handler execution failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        ),
      };
    }
  }

  private async updateStepExecution(
    stepId: string,
    workflowRunId: string,
    updates: any
  ): Promise<void> {
    await this.prisma.workflowStepExecution.updateMany({
      where: {
        stepId,
        workflowRunId,
      },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  private getNextStepId(step: WorkflowStep): string | undefined {
    // Simple linear progression - can be enhanced with conditional branching
    return step.stepId; // Placeholder - actual implementation would determine next step
  }

  private shouldContinueOnError(
    step: WorkflowStep,
    options: StepExecutorOptions
  ): boolean {
    return options.continueOnError || step.onError === 'continue';
  }

  private getValueFromContext(
    field: string,
    context: StepExecutionContext
  ): any {
    const parts = field.split('.');
    let value: any = {
      input: context.input,
      variables: context.variables,
      metadata: context.metadata,
    };

    for (const part of parts) {
      value = value?.[part];
    }

    return value;
  }

  private evaluateCondition(
    fieldValue: any,
    operator: string,
    expectedValue: any
  ): boolean {
    const ops: Record<string, (f: any, e: any) => boolean> = {
      eq: (f, e) => f === e,
      ne: (f, e) => f !== e,
      gt: (f, e) => f > e,
      lt: (f, e) => f < e,
      gte: (f, e) => f >= e,
      lte: (f, e) => f <= e,
      contains: (f, e) => String(f).includes(String(e)),
      exists: f => f !== undefined && f !== null,
    };
    return ops[operator]?.(fieldValue, expectedValue) ?? true;
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      fn()
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
