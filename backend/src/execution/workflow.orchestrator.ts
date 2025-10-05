/**
 * Workflow Orchestrator
 * ThinkCode AI Platform - Complete Workflow Execution Management
 */

import { PrismaClient, Workflow, WorkflowStep } from '@prisma/client';
import { TaskExecutionEngine, ExecutionResult, StepResult } from './task-execution.engine';

export interface WorkflowExecutionOptions {
  continueOnError?: boolean;
  parallelExecution?: boolean;
  maxConcurrentSteps?: number;
  timeoutMs?: number;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  status: 'completed' | 'failed' | 'partial';
  completedSteps: number;
  totalSteps: number;
  duration: number;
  stepResults: Map<string, StepResult>;
  errors?: any[];
}

export interface WorkflowExecutionError {
  code: string;
  message: string;
  workflowId: string;
  failedStepId?: string;
  details?: any;
}

/**
 * Workflow Orchestrator - Manages complete workflow execution
 */
export class WorkflowOrchestrator {
  private taskEngine: TaskExecutionEngine;
  private prisma: PrismaClient;
  private activeExecutions = new Map<string, any>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.taskEngine = new TaskExecutionEngine(prisma);
  }

  /**
   * Execute complete workflow
   */
  async executeWorkflow(
    workflowId: string,
    options: WorkflowExecutionOptions = {}
  ): Promise<ExecutionResult<WorkflowExecutionResult>> {
    const startTime = Date.now();

    try {
      // 1. Load workflow with steps
      const workflow = await this.loadWorkflowWithSteps(workflowId);
      if (!workflow.success) {
        return workflow;
      }

      const workflowData = workflow.data;
      const steps = workflowData.steps.sort((a, b) => a.stepNumber - b.stepNumber);

      // 2. Validate workflow execution readiness
      const validationResult = await this.validateWorkflowExecution(workflowData);
      if (!validationResult.success) {
        return validationResult;
      }

      // 3. Update workflow status to 'running'
      await this.updateWorkflowStatus(workflowId, 'running', { startedAt: new Date() });

      // 4. Execute steps based on execution mode
      const stepResults = new Map<string, StepResult>();
      let completedSteps = 0;
      let hasErrors = false;
      const errors: any[] = [];

      if (options.parallelExecution) {
        // Parallel execution (for independent steps)
        const parallelResult = await this.executeStepsInParallel(
          steps,
          options,
          stepResults,
          errors
        );
        completedSteps = parallelResult.completedSteps;
        hasErrors = parallelResult.hasErrors;
      } else {
        // Sequential execution (default)
        const sequentialResult = await this.executeStepsSequentially(
          steps,
          options,
          stepResults,
          errors
        );
        completedSteps = sequentialResult.completedSteps;
        hasErrors = sequentialResult.hasErrors;
      }

      // 5. Determine final status
      const finalStatus = this.determineFinalStatus(
        completedSteps,
        steps.length,
        hasErrors,
        options.continueOnError
      );

      // 6. Update workflow final status
      await this.updateWorkflowStatus(workflowId, finalStatus, { 
        completedAt: new Date() 
      });

      const duration = Date.now() - startTime;
      const result: WorkflowExecutionResult = {
        workflowId,
        status: finalStatus,
        completedSteps,
        totalSteps: steps.length,
        duration,
        stepResults,
        errors: errors.length > 0 ? errors : undefined,
      };

      return { success: true, data: result };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Update workflow to failed status
      await this.updateWorkflowStatus(workflowId, 'failed', {
        completedAt: new Date(),
      }).catch(console.error);

      return {
        success: false,
        error: {
          code: 'WORKFLOW_EXECUTION_ERROR',
          message: error.message,
          workflowId,
          details: { error, duration }
        }
      };
    }
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeStepsSequentially(
    steps: WorkflowStep[],
    options: WorkflowExecutionOptions,
    stepResults: Map<string, StepResult>,
    errors: any[]
  ): Promise<{ completedSteps: number; hasErrors: boolean }> {
    let completedSteps = 0;
    let hasErrors = false;

    for (const step of steps) {
      console.log(`Executing step ${step.stepNumber}: ${step.name}`);

      // Check if step has assigned agent
      if (!step.assignedAgentId) {
        const error = {
          stepId: step.id,
          stepName: step.name,
          error: 'No agent assigned to step',
        };
        errors.push(error);
        hasErrors = true;

        if (!options.continueOnError) {
          break;
        }
        continue;
      }

      // Execute step
      const stepResult = await this.taskEngine.executeWorkflowStep(step.id);

      if (stepResult.success) {
        stepResults.set(step.id, stepResult.data);
        completedSteps++;
        console.log(`✅ Step ${step.stepNumber} completed successfully`);
      } else {
        const error = {
          stepId: step.id,
          stepName: step.name,
          error: stepResult.error,
        };
        errors.push(error);
        hasErrors = true;
        console.error(`❌ Step ${step.stepNumber} failed:`, stepResult.error.message);

        if (!options.continueOnError) {
          break;
        }
      }

      // Check timeout
      if (options.timeoutMs && Date.now() > Date.now() + options.timeoutMs) {
        errors.push({
          error: 'Workflow execution timeout',
          timeoutMs: options.timeoutMs,
        });
        break;
      }
    }

    return { completedSteps, hasErrors };
  }

  /**
   * Execute workflow steps in parallel
   */
  private async executeStepsInParallel(
    steps: WorkflowStep[],
    options: WorkflowExecutionOptions,
    stepResults: Map<string, StepResult>,
    errors: any[]
  ): Promise<{ completedSteps: number; hasErrors: boolean }> {
    const maxConcurrent = options.maxConcurrentSteps || 3;
    let completedSteps = 0;
    let hasErrors = false;

    // Filter steps with assigned agents
    const executableSteps = steps.filter(step => step.assignedAgentId);

    // Execute in batches
    for (let i = 0; i < executableSteps.length; i += maxConcurrent) {
      const batch = executableSteps.slice(i, i + maxConcurrent);
      
      console.log(`Executing batch of ${batch.length} steps in parallel`);

      const batchPromises = batch.map(async (step) => {
        const stepResult = await this.taskEngine.executeWorkflowStep(step.id);
        return { step, result: stepResult };
      });

      const batchResults = await Promise.allSettled(batchPromises);

      // Process batch results
      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          const { step, result } = promiseResult.value;
          
          if (result.success) {
            stepResults.set(step.id, result.data);
            completedSteps++;
            console.log(`✅ Step ${step.stepNumber} completed successfully`);
          } else {
            const error = {
              stepId: step.id,
              stepName: step.name,
              error: result.error,
            };
            errors.push(error);
            hasErrors = true;
            console.error(`❌ Step ${step.stepNumber} failed:`, result.error.message);
          }
        } else {
          errors.push({
            error: 'Step execution promise rejected',
            reason: promiseResult.reason,
          });
          hasErrors = true;
        }
      }

      // Early termination on error if not continuing
      if (hasErrors && !options.continueOnError) {
        break;
      }
    }

    return { completedSteps, hasErrors };
  }

  /**
   * Load workflow with steps
   */
  private async loadWorkflowWithSteps(
    workflowId: string
  ): Promise<ExecutionResult<Workflow & { steps: WorkflowStep[] }>> {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: {
            orderBy: { stepNumber: 'asc' },
          },
        },
      });

      if (!workflow) {
        return {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: `Workflow ${workflowId} not found`,
            workflowId,
          }
        };
      }

      return { success: true, data: workflow };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WORKFLOW_LOAD_ERROR',
          message: `Failed to load workflow: ${error.message}`,
          workflowId,
          details: error
        }
      };
    }
  }

  /**
   * Validate workflow execution readiness
   */
  private async validateWorkflowExecution(
    workflow: Workflow & { steps: WorkflowStep[] }
  ): Promise<ExecutionResult<void>> {
    // Check if workflow has steps
    if (!workflow.steps || workflow.steps.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_STEPS_FOUND',
          message: 'Workflow has no steps to execute',
          workflowId: workflow.id,
        }
      };
    }

    // Check if workflow is already running
    if (workflow.status === 'running') {
      return {
        success: false,
        error: {
          code: 'WORKFLOW_ALREADY_RUNNING',
          message: 'Workflow is already running',
          workflowId: workflow.id,
        }
      };
    }

    // Validate step sequence
    const stepNumbers = workflow.steps.map(s => s.stepNumber).sort((a, b) => a - b);
    for (let i = 0; i < stepNumbers.length; i++) {
      if (stepNumbers[i] !== i + 1) {
        return {
          success: false,
          error: {
            code: 'INVALID_STEP_SEQUENCE',
            message: `Step sequence is invalid. Expected step ${i + 1}, found ${stepNumbers[i]}`,
            workflowId: workflow.id,
          }
        };
      }
    }

    return { success: true, data: undefined };
  }

  /**
   * Update workflow status
   */
  private async updateWorkflowStatus(
    workflowId: string,
    status: string,
    updates: Record<string, any> = {}
  ): Promise<void> {
    await this.prisma.workflow.update({
      where: { id: workflowId },
      data: {
        status,
        updatedAt: new Date(),
        ...updates,
      },
    });
  }

  /**
   * Determine final workflow status
   */
  private determineFinalStatus(
    completedSteps: number,
    totalSteps: number,
    hasErrors: boolean,
    continueOnError?: boolean
  ): 'completed' | 'failed' | 'partial' {
    if (completedSteps === totalSteps && !hasErrors) {
      return 'completed';
    }
    
    if (completedSteps === 0 || (!continueOnError && hasErrors)) {
      return 'failed';
    }

    return 'partial';
  }

  /**
   * Get active workflow executions
   */
  getActiveExecutions(): Map<string, any> {
    return this.activeExecutions;
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflowExecution(workflowId: string): Promise<ExecutionResult<void>> {
    try {
      await this.updateWorkflowStatus(workflowId, 'cancelled');
      this.activeExecutions.delete(workflowId);

      return { success: true, data: undefined };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CANCEL_ERROR',
          message: error.message,
          workflowId,
          details: error
        }
      };
    }
  }

  /**
   * Get workflow execution status
   */
  async getWorkflowStatus(workflowId: string): Promise<ExecutionResult<any>> {
    try {
      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
        include: {
          steps: {
            select: {
              id: true,
              stepNumber: true,
              name: true,
              status: true,
              startedAt: true,
              completedAt: true,
            },
            orderBy: { stepNumber: 'asc' },
          },
        },
      });

      if (!workflow) {
        return {
          success: false,
          error: {
            code: 'WORKFLOW_NOT_FOUND',
            message: `Workflow ${workflowId} not found`,
            workflowId,
          }
        };
      }

      const completedSteps = workflow.steps.filter(s => s.status === 'completed').length;
      const failedSteps = workflow.steps.filter(s => s.status === 'failed').length;
      const runningSteps = workflow.steps.filter(s => s.status === 'running').length;

      return {
        success: true,
        data: {
          ...workflow,
          progress: {
            total: workflow.steps.length,
            completed: completedSteps,
            failed: failedSteps,
            running: runningSteps,
            percentage: workflow.steps.length > 0 ? 
              Math.round((completedSteps / workflow.steps.length) * 100) : 0,
          }
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'STATUS_FETCH_ERROR',
          message: error.message,
          workflowId,
          details: error
        }
      };
    }
  }
}