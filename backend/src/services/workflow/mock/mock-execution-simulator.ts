/**
 * Mock Execution Simulator
 *
 * Simulates workflow execution with realistic timing and failure scenarios
 */

import {
  MockWorkflowExecution,
  MockStepExecution,
  MockWorkflowStepTemplate,
  MockExecutionConfig,
  IMockExecutionSimulator,
} from './mock-types';

export class MockExecutionSimulator implements IMockExecutionSimulator {
  private config: MockExecutionConfig = {
    simulateDelay: true,
    delayRange: [500, 2000],
    failureRate: 0.1,
    enableProgressTracking: true,
    maxConcurrentExecutions: 10,
  };

  /**
   * Simulate workflow execution
   */
  async simulateExecution(execution: MockWorkflowExecution): Promise<void> {
    execution.status = 'running';
    execution.progress = 0;

    try {
      const template = await this.getTemplateForExecution(execution.templateId);
      if (!template) {
        throw new Error(`Template ${execution.templateId} not found`);
      }

      // Simulate step-by-step execution
      for (let i = 0; i < execution.stepExecutions.length; i++) {
        const stepExecution = execution.stepExecutions[i];
        const stepTemplate = template.steps.find(
          (s: any) => s.id === stepExecution.stepId
        );

        if (!stepTemplate) {
          throw new Error(`Step template ${stepExecution.stepId} not found`);
        }

        execution.currentStepId = stepExecution.stepId;

        await this.simulateStepExecution(stepExecution, stepTemplate);

        if (stepExecution.status === 'failed') {
          execution.status = 'failed';
          execution.error = stepExecution.error;
          return;
        }

        // Update progress
        execution.progress = Math.round(
          ((i + 1) / execution.stepExecutions.length) * 100
        );
      }

      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.output = this.generateMockOutput(execution);
    } catch (error) {
      execution.status = 'failed';
      execution.error =
        error instanceof Error ? error.message : 'Unknown error';
      execution.completedAt = new Date();
    }
  }

  /**
   * Simulate individual step execution
   */
  async simulateStepExecution(
    stepExecution: MockStepExecution,
    stepTemplate: MockWorkflowStepTemplate
  ): Promise<void> {
    stepExecution.status = 'running';
    stepExecution.startedAt = new Date();

    try {
      // Simulate processing delay
      if (this.config.simulateDelay) {
        const delay = this.getRandomDelay();
        await this.sleep(delay);
      }

      // Simulate random failures
      if (this.shouldSimulateFailure()) {
        throw new Error(`Simulated failure in step ${stepTemplate.name}`);
      }

      // Generate mock output
      stepExecution.output = this.generateStepOutput(stepTemplate);
      stepExecution.status = 'completed';
      stepExecution.completedAt = new Date();

      if (stepExecution.startedAt && stepExecution.completedAt) {
        stepExecution.duration =
          stepExecution.completedAt.getTime() -
          stepExecution.startedAt.getTime();
      }
    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error =
        error instanceof Error ? error.message : 'Unknown error';
      stepExecution.completedAt = new Date();

      // Simulate retry logic
      if (stepExecution.retryCount < (stepTemplate.retries || 0)) {
        stepExecution.retryCount++;
        stepExecution.status = 'pending';
        await this.sleep(1000); // Wait before retry
        return this.simulateStepExecution(stepExecution, stepTemplate);
      }
    }
  }

  /**
   * Get random delay within configured range
   */
  private getRandomDelay(): number {
    const [min, max] = this.config.delayRange;
    return Math.random() * (max - min) + min;
  }

  /**
   * Check if should simulate failure
   */
  private shouldSimulateFailure(): boolean {
    return Math.random() < this.config.failureRate;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate mock step output based on step type
   */
  private generateStepOutput(
    stepTemplate: MockWorkflowStepTemplate
  ): Record<string, any> {
    const baseOutput = {
      stepId: stepTemplate.id,
      stepName: stepTemplate.name,
      executedAt: new Date().toISOString(),
      success: true,
    };

    switch (stepTemplate.type) {
      case 'validation':
        return {
          ...baseOutput,
          validationResult: {
            isValid: true,
            errors: [],
            warnings: [],
          },
          processedRecords: Math.floor(Math.random() * 1000) + 100,
        };

      case 'transformation':
        return {
          ...baseOutput,
          transformationResult: {
            inputRecords: Math.floor(Math.random() * 1000) + 100,
            outputRecords: Math.floor(Math.random() * 1000) + 100,
            transformationRules: ['rule1', 'rule2', 'rule3'],
          },
        };

      case 'storage':
        return {
          ...baseOutput,
          storageResult: {
            recordsSaved: Math.floor(Math.random() * 1000) + 100,
            tableName: 'workflow_data',
            transactionId: `txn_${Date.now()}`,
          },
        };

      case 'notification':
        return {
          ...baseOutput,
          notificationResult: {
            messagesSent: Math.floor(Math.random() * 10) + 1,
            deliveryStatus: 'delivered',
            messageId: `msg_${Date.now()}`,
          },
        };

      default:
        return baseOutput;
    }
  }

  /**
   * Generate mock workflow output
   */
  private generateMockOutput(
    execution: MockWorkflowExecution
  ): Record<string, any> {
    return {
      executionId: execution.id,
      templateId: execution.templateId,
      completedAt: new Date().toISOString(),
      totalDuration:
        execution.completedAt && execution.startedAt
          ? execution.completedAt.getTime() - execution.startedAt.getTime()
          : 0,
      stepsCompleted: execution.stepExecutions.filter(
        s => s.status === 'completed'
      ).length,
      totalSteps: execution.stepExecutions.length,
      summary: {
        success: execution.status === 'completed',
        message:
          execution.status === 'completed'
            ? 'Workflow completed successfully'
            : execution.error || 'Workflow failed',
      },
    };
  }

  /**
   * Mock method to get template (in real implementation this would query database)
   */
  private async getTemplateForExecution(templateId: string): Promise<any> {
    // This is a mock - in real implementation would fetch from database
    return {
      id: templateId,
      steps: [
        {
          id: 'step_001',
          name: 'Mock Step 1',
          type: 'validation',
          handlerType: 'mock',
          retries: 3,
        },
        {
          id: 'step_002',
          name: 'Mock Step 2',
          type: 'transformation',
          handlerType: 'mock',
          retries: 2,
        },
        {
          id: 'step_003',
          name: 'Mock Step 3',
          type: 'storage',
          handlerType: 'mock',
          retries: 1,
        },
      ],
    };
  }

  /**
   * Update simulation configuration
   */
  updateConfig(newConfig: Partial<MockExecutionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): MockExecutionConfig {
    return { ...this.config };
  }
}
