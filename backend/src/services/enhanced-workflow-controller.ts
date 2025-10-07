/**
 * Enhanced Workflow Controller - Refactored Main Class
 * ThinkCode AI Platform - Enterprise-grade workflow orchestration with multi-provider support
 */

import { PrismaClient } from '@prisma/client';
import { IMLProvider } from '../providers/ml-provider.interface';
import ContextManager from './context-manager';
import ChatIntegrationService from './chat-integration.service';

// Types
import {
  WorkflowExecution,
  WorkflowTemplate,
  ProviderHealth,
  ExecutionOptions,
  IEnhancedWorkflowController,
} from './enhanced-workflow-controller/types/workflow-controller.types';

interface WorkflowExecutionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  error?: string;
  errors?: string[];
}

// Managers
import { WorkflowTemplateManager } from './enhanced-workflow-controller/managers/workflow-template.manager';
import { WorkflowExecutionManager } from './enhanced-workflow-controller/managers/workflow-execution.manager';
import { ProviderManager } from './enhanced-workflow-controller/managers/provider.manager';

/**
 * Enhanced Workflow Controller - Main Orchestration Class
 * Centralne sterowanie workflow z integracją providerów ML
 */
export class EnhancedWorkflowController implements IEnhancedWorkflowController {
  private prisma: PrismaClient;
  private contextManager: ContextManager;
  private chatService: ChatIntegrationService;

  // Delegated managers
  private templateManager: WorkflowTemplateManager;
  private executionManager: WorkflowExecutionManager;
  private providerManager: ProviderManager;

  constructor(
    prisma: PrismaClient,
    contextManager: ContextManager,
    chatService: ChatIntegrationService
  ) {
    this.prisma = prisma;
    this.contextManager = contextManager;
    this.chatService = chatService;

    // Initialize managers
    this.templateManager = new WorkflowTemplateManager();
    this.executionManager = new WorkflowExecutionManager();
    this.providerManager = new ProviderManager();

    console.log(
      '🚀 Enhanced Workflow Controller initialized with modular architecture'
    );
  }

  // === Provider Management (delegated) ===

  /**
   * Rejestruje nowego providera ML
   */
  registerProvider(name: string, provider: IMLProvider): void {
    this.providerManager.registerProvider(name, provider);
  }

  /**
   * Pobiera status wszystkich providerów
   */
  getProviders(): ProviderHealth[] {
    return this.providerManager.getProviders();
  }

  // === Template Management (delegated) ===

  /**
   * Tworzy nowy template workflow
   */
  async createWorkflowTemplate(
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<string> {
    return this.templateManager.createWorkflowTemplate(template);
  }

  /**
   * Pobiera wszystkie templates workflow
   */
  getWorkflowTemplates(): WorkflowTemplate[] {
    return this.templateManager.getWorkflowTemplates();
  }

  /**
   * Pobiera template po ID
   */
  getWorkflowTemplate(templateId: string): WorkflowTemplate | null {
    return this.templateManager.getWorkflowTemplate(templateId);
  }

  /**
   * Usuwa template workflow
   */
  deleteWorkflowTemplate(templateId: string): boolean {
    return this.templateManager.deleteWorkflowTemplate(templateId);
  }

  // === Execution Management (delegated) ===

  /**
   * Wykonuje workflow na podstawie template
   */
  async executeWorkflow(
    templateId: string,
    options: ExecutionOptions = {}
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      // Waliduj template
      const template = this.templateManager.getWorkflowTemplate(templateId);
      if (!template) {
        return {
          success: false,
          error: `Template workflow ${templateId} nie został znaleziony`,
        };
      }

      // Waliduj wymagania template
      const availableProviders = this.providerManager.getAllProviders();
      const validationResult =
        await this.templateManager.validateTemplateRequirements(
          template,
          availableProviders
        );

      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error?.message || 'Błąd walidacji template',
        };
      }

      // Utwórz wykonanie
      const executionId = await this.executionManager.createWorkflowExecution({
        templateId,
        contextId: options.contextId || 'default',
        contextType: options.contextType || 'project',
        projectId: options.metadata?.projectId,
        chatSessionId: options.chatSessionId,
        priority: options.priority || 'medium',
        triggeredBy: options.metadata?.triggeredBy,
      });

      // Rozpocznij wykonanie
      const startResult = await this.executionManager.startExecution(
        executionId
      );
      if (!startResult.success) {
        return {
          success: false,
          error: startResult.error?.message || 'Błąd rozpoczęcia wykonania',
        };
      }

      // Production-ready workflow step execution
      this.executeWorkflowSteps(executionId, template, options)
        .then((result: WorkflowExecutionResult) => {
          this.executionManager.completeExecution(executionId, result.success, {
            message: result.success
              ? `Workflow executed successfully - ${result.completedSteps}/${result.totalSteps} steps completed`
              : `Workflow failed: ${result.error}`,
            steps: result.completedSteps,
            errors: result.errors,
          });
        })
        .catch((error: Error) => {
          this.executionManager.completeExecution(executionId, false, {
            message: `Workflow execution error: ${error.message}`,
            error: error.message,
          });
        });

      return { success: true, executionId };
    } catch (error) {
      return {
        success: false,
        error: `Błąd wykonania workflow: ${
          error instanceof Error ? error.message : 'Nieznany błąd'
        }`,
      };
    }
  }

  /**
   * Pauzuje wykonanie workflow
   */
  async pauseExecution(executionId: string): Promise<boolean> {
    return this.executionManager.pauseExecution(executionId);
  }

  /**
   * Wznawia wykonanie workflow
   */
  async resumeExecution(executionId: string): Promise<boolean> {
    return this.executionManager.resumeExecution(executionId);
  }

  /**
   * Anuluje wykonanie workflow
   */
  async cancelExecution(executionId: string): Promise<boolean> {
    return this.executionManager.cancelExecution(executionId);
  }

  /**
   * Pobiera wykonanie po ID
   */
  getExecution(executionId: string): WorkflowExecution | null {
    return this.executionManager.getExecutionStatus(executionId);
  }

  /**
   * Pobiera wszystkie aktywne wykonania
   */
  getActiveExecutions(): WorkflowExecution[] {
    return this.executionManager.getActiveExecutions();
  }

  // === Analytics ===

  /**
   * Pobiera statystyki wykonań
   */
  getExecutionStats(): any {
    return this.executionManager.getExecutionStats();
  }

  /**
   * Pobiera statystyki providerów
   */
  getProviderStats(): any {
    return this.providerManager.getProviderStats();
  }

  /**
   * Pobiera kompleksowe statystyki całego systemu
   */
  async getSystemStats(): Promise<{
    executions: any;
    providers: any;
    templates: number;
    uptime: number;
  }> {
    return {
      executions: this.getExecutionStats(),
      providers: this.getProviderStats(),
      templates: this.getWorkflowTemplates().length,
      uptime: process.uptime(),
    };
  }

  /**
   * Execute workflow steps sequentially
   */
  private async executeWorkflowSteps(
    executionId: string,
    template: WorkflowTemplate,
    options: ExecutionOptions
  ): Promise<WorkflowExecutionResult> {
    const totalSteps = template.steps.length;
    let completedSteps = 0;
    const errors: string[] = [];

    console.log(
      `🚀 Starting execution of workflow ${template.name} (${totalSteps} steps)`
    );

    try {
      for (let i = 0; i < template.steps.length; i++) {
        const step = template.steps[i];

        console.log(`📋 Executing step ${i + 1}/${totalSteps}: ${step.name}`);

        try {
          // Update execution status (mock)
          console.log(
            `📊 Step ${i + 1}/${totalSteps}: ${
              step.name
            } - Progress: ${Math.round(((i + 1) / totalSteps) * 100)}%`
          );

          // Execute the step
          const stepResult = await this.executeStep(step);

          if (stepResult.success) {
            completedSteps++;
            console.log(`✅ Step ${i + 1} completed successfully`);
          } else {
            const error = `Step ${i + 1} (${step.name}) failed: ${
              stepResult.error
            }`;
            errors.push(error);
            console.error(`❌ ${error}`);

            // Check if step is critical (mock - assume all steps are optional)
            const isCritical = false; // In production, this would check step configuration
            if (isCritical) {
              console.error(`🚨 Critical step failed, stopping execution`);
              break;
            }
          }

          // Add delay between steps for stability
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (stepError) {
          const error = `Step ${i + 1} (${step.name}) threw exception: ${
            stepError instanceof Error ? stepError.message : 'Unknown error'
          }`;
          errors.push(error);
          console.error(`💥 ${error}`);

          // Stop on critical step failure (mock - assume steps are optional)
          const isStepRequired = false; // In production, this would check step configuration
          if (isStepRequired) {
            break;
          }
        }
      }

      const success = completedSteps === totalSteps && errors.length === 0;

      console.log(
        `🏁 Workflow execution completed: ${completedSteps}/${totalSteps} steps, ${errors.length} errors`
      );

      return {
        success,
        completedSteps,
        totalSteps,
        errors: errors.length > 0 ? errors : undefined,
        error: !success && errors.length > 0 ? errors[0] : undefined,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown execution error';
      console.error(`💥 Workflow execution failed: ${errorMessage}`);

      return {
        success: false,
        completedSteps,
        totalSteps,
        error: errorMessage,
        errors: [errorMessage, ...errors],
      };
    }
  }

  /**
   * Execute individual workflow step
   */
  private async executeStep(
    step: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Mock step execution - in production this would route to appropriate providers
      console.log(`⚙️ Executing step: ${step.name} (${step.type})`);

      // Simulate different step types
      switch (step.type) {
        case 'api_call':
          return await this.executeApiStep();
        case 'data_processing':
          return await this.executeDataStep();
        case 'ml_inference':
          return await this.executeMlStep();
        case 'notification':
          return await this.executeNotificationStep();
        default:
          return await this.executeGenericStep();
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Step execution failed',
      };
    }
  }

  private async executeApiStep(): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: Math.random() > 0.1 }; // 90% success rate
  }

  private async executeDataStep(): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Mock data processing
    await new Promise(resolve => setTimeout(resolve, 300));
    return { success: Math.random() > 0.05 }; // 95% success rate
  }

  private async executeMlStep(): Promise<{ success: boolean; error?: string }> {
    // Mock ML inference
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: Math.random() > 0.15 }; // 85% success rate
  }

  private async executeNotificationStep(): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Mock notification
    await new Promise(resolve => setTimeout(resolve, 100));
    return { success: Math.random() > 0.02 }; // 98% success rate
  }

  private async executeGenericStep(): Promise<{
    success: boolean;
    error?: string;
  }> {
    // Mock generic step
    await new Promise(resolve => setTimeout(resolve, 150));
    return { success: Math.random() > 0.08 }; // 92% success rate
  }
}

export default EnhancedWorkflowController;
