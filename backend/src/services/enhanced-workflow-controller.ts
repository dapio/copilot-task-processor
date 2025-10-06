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

    console.log('🚀 Enhanced Workflow Controller initialized with modular architecture');
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
      const validationResult = await this.templateManager.validateTemplateRequirements(
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
      const startResult = await this.executionManager.startExecution(executionId);
      if (!startResult.success) {
        return {
          success: false,
          error: startResult.error?.message || 'Błąd rozpoczęcia wykonania',
        };
      }

      // TODO: Implementacja faktycznego wykonywania kroków
      // Na razie symulujemy sukces
      setTimeout(() => {
        this.executionManager.completeExecution(executionId, true, {
          message: 'Workflow wykonany pomyślnie (symulacja)',
          steps: template.steps.length,
        });
      }, 1000);

      return { success: true, executionId };
    } catch (error) {
      return {
        success: false,
        error: `Błąd wykonania workflow: ${error instanceof Error ? error.message : 'Nieznany błąd'}`,
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
}

export default EnhancedWorkflowController;