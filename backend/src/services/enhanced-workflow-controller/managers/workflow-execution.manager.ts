/**
 * Workflow Execution Manager
 * Zarządzanie wykonywaniem workflow i kroków
 */

import { WorkflowExecution } from '../types/workflow-controller.types';

export class WorkflowExecutionManager {
  private executions: Map<string, WorkflowExecution> = new Map();

  constructor() {}

  /**
   * Tworzy nowe wykonanie workflow
   */
  async createWorkflowExecution(options: {
    templateId: string;
    contextId: string;
    contextType: 'project' | 'agent';
    projectId?: string;
    chatSessionId?: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    triggeredBy?: string;
  }): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const execution: WorkflowExecution = {
      id: executionId,
      workflowId: options.templateId,
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
      activeProviders: [],
      providerUsage: {},
      metadata: {
        triggeredBy: options.triggeredBy,
        priority: options.priority,
        tags: [],
      },
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.executions.set(executionId, execution);

    console.log(`🎯 Created workflow execution: ${executionId}`);
    return executionId;
  }

  /**
   * Rozpoczyna wykonanie workflow
   */
  async startExecution(
    executionId: string
  ): Promise<{ success: boolean; error?: any }> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return {
        success: false,
        error: {
          code: 'EXECUTION_NOT_FOUND',
          message: `Execution ${executionId} not found`,
        },
      };
    }

    execution.status = 'running';
    execution.startedAt = new Date();
    execution.lastActivityAt = new Date();

    console.log(`🚀 Started workflow execution: ${executionId}`);
    return { success: true };
  }

  /**
   * Pobiera status wykonania workflow
   */
  getExecutionStatus(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null;
  }

  /**
   * Pobiera wszystkie aktywne wykonania
   */
  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(execution =>
      ['running', 'paused'].includes(execution.status)
    );
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

    console.log(`⏸️ Paused workflow execution: ${executionId}`);
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

    console.log(`▶️ Resumed workflow execution: ${executionId}`);
    return true;
  }

  /**
   * Anuluje wykonanie workflow
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    const execution = this.executions.get(executionId);
    if (
      !execution ||
      ['completed', 'failed', 'cancelled'].includes(execution.status)
    ) {
      return false;
    }

    execution.status = 'cancelled';
    execution.completedAt = new Date();
    execution.lastActivityAt = new Date();

    console.log(`❌ Cancelled workflow execution: ${executionId}`);
    return true;
  }

  /**
   * Aktualizuje postęp wykonania
   */
  updateExecutionProgress(
    executionId: string,
    progress: {
      totalSteps?: number;
      completedSteps?: number;
      currentStep?: string;
    }
  ): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return false;
    }

    if (progress.totalSteps !== undefined) {
      execution.progress.totalSteps = progress.totalSteps;
    }
    if (progress.completedSteps !== undefined) {
      execution.progress.completedSteps = progress.completedSteps;
    }
    if (progress.currentStep !== undefined) {
      execution.progress.currentStep = progress.currentStep;
    }

    // Oblicz procent
    if (execution.progress.totalSteps > 0) {
      execution.progress.percentage = Math.round(
        (execution.progress.completedSteps / execution.progress.totalSteps) *
          100
      );
    }

    execution.lastActivityAt = new Date();
    return true;
  }

  /**
   * Dodaje użycie providera do statystyk
   */
  recordProviderUsage(
    executionId: string,
    provider: string,
    success: boolean,
    tokens?: number
  ): void {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return;
    }

    if (!execution.providerUsage[provider]) {
      execution.providerUsage[provider] = {
        requestCount: 0,
        successCount: 0,
        errorCount: 0,
        totalTokens: 0,
      };
    }

    const usage = execution.providerUsage[provider];
    usage.requestCount++;

    if (success) {
      usage.successCount++;
    } else {
      usage.errorCount++;
    }

    if (tokens) {
      usage.totalTokens = (usage.totalTokens || 0) + tokens;
    }

    execution.lastActivityAt = new Date();
  }

  /**
   * Oznacza wykonanie jako zakończone
   */
  completeExecution(
    executionId: string,
    success: boolean,
    result?: any,
    error?: string
  ): boolean {
    const execution = this.executions.get(executionId);
    if (!execution) {
      return false;
    }

    execution.status = success ? 'completed' : 'failed';
    execution.completedAt = new Date();
    execution.lastActivityAt = new Date();

    if (result) {
      execution.metadata.result = result;
    }
    if (error) {
      execution.metadata.error = error;
    }

    console.log(
      `${success ? '✅' : '❌'} ${
        success ? 'Completed' : 'Failed'
      } workflow execution: ${executionId}`
    );
    return true;
  }

  /**
   * Pobiera statystyki wykonań
   */
  getExecutionStats(): {
    total: number;
    running: number;
    completed: number;
    failed: number;
    paused: number;
    cancelled: number;
  } {
    const executions = Array.from(this.executions.values());

    return {
      total: executions.length,
      running: executions.filter(e => e.status === 'running').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      paused: executions.filter(e => e.status === 'paused').length,
      cancelled: executions.filter(e => e.status === 'cancelled').length,
    };
  }
}
