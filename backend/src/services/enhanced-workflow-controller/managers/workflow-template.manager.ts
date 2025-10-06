/**
 * Workflow Template Manager
 * Zarządzanie szablonami workflow dla Enhanced Workflow Controller
 */

import {
  WorkflowTemplate,
  WorkflowStep,
} from '../types/workflow-controller.types';

export class WorkflowTemplateManager {
  private templates: Map<string, WorkflowTemplate> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * Tworzy nowy template workflow
   */
  async createWorkflowTemplate(
    template: Omit<WorkflowTemplate, 'id'>
  ): Promise<string> {
    const templateId = `template_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const fullTemplate: WorkflowTemplate = {
      id: templateId,
      ...template,
    };

    this.templates.set(templateId, fullTemplate);

    console.log(
      `✅ Created workflow template: ${template.name} (${templateId})`
    );
    return templateId;
  }

  /**
   * Pobiera wszystkie templates
   */
  getWorkflowTemplates(): WorkflowTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Pobiera template po ID
   */
  getWorkflowTemplate(templateId: string): WorkflowTemplate | null {
    return this.templates.get(templateId) || null;
  }

  /**
   * Usuwa template
   */
  deleteWorkflowTemplate(templateId: string): boolean {
    const exists = this.templates.has(templateId);
    if (exists) {
      this.templates.delete(templateId);
      console.log(`🗑️ Deleted workflow template: ${templateId}`);
    }
    return exists;
  }

  /**
   * Waliduje wymagania template
   */
  async validateTemplateRequirements(
    template: WorkflowTemplate,
    availableProviders: string[]
  ): Promise<{ success: boolean; error?: any }> {
    // Sprawdź minimalne wymagania providerów
    const missingProviders = template.requirements.minimumProviders.filter(
      provider => !availableProviders.includes(provider)
    );

    if (missingProviders.length > 0) {
      return {
        success: false,
        error: {
          code: 'MISSING_PROVIDERS',
          message: `Brakujące wymagane providery: ${missingProviders.join(
            ', '
          )}`,
          retryable: false,
          missingProviders,
        },
      };
    }

    // Waliduj konfigurację kroków
    for (const step of template.steps) {
      const validationResult = this.validateStepConfiguration(step);
      if (!validationResult.success) {
        return validationResult;
      }
    }

    return { success: true };
  }

  /**
   * Waliduje konfigurację kroku
   */
  private validateStepConfiguration(
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
  ): { success: boolean; error?: any } {
    // Sprawdź wymagane pola
    if (!step.name || !step.type) {
      return {
        success: false,
        error: {
          code: 'INVALID_STEP_CONFIG',
          message: 'Krok musi mieć nazwę i typ',
          retryable: false,
        },
      };
    }

    // Waliduj typ kroku
    const validTypes = [
      'ai_generation',
      'human_review',
      'data_processing',
      'integration',
      'validation',
    ];
    if (!validTypes.includes(step.type)) {
      return {
        success: false,
        error: {
          code: 'INVALID_STEP_TYPE',
          message: `Nieprawidłowy typ kroku: ${step.type}`,
          retryable: false,
        },
      };
    }

    return { success: true };
  }

  /**
   * Inicjalizuje domyślne templates
   */
  private async initializeDefaultTemplates(): Promise<void> {
    await this.createCodeGenerationTemplate();
    await this.createDocumentationTemplate();
    console.log('🚀 Zainicjalizowano domyślne templates workflow');
  }

  /**
   * Tworzy template do generowania kodu
   */
  private async createCodeGenerationTemplate(): Promise<void> {
    await this.createWorkflowTemplate({
      name: 'Generowanie Kodu',
      description:
        'Podstawowy template do generowania kodu z analizą i walidacją',
      category: 'code_generation',
      complexity: 'medium',
      estimatedDuration: 300000, // 5 minut
      providerStrategy: {
        primary: 'openai',
        fallbacks: ['anthropic', 'gemini'],
        costOptimization: true,
      },
      requirements: {
        minimumProviders: ['openai'],
        optionalProviders: ['anthropic', 'gemini'],
        contextRequired: true,
        workspaceAccess: true,
      },
      steps: [
        {
          name: 'Analiza Wymagań',
          description: 'Analiza wymagań i kontekstu projektu',
          type: 'ai_generation',
          dependencies: [],
          configuration: {
            prompt: 'Przeanalizuj wymagania i kontekst projektu',
            temperature: 0.3,
            maxTokens: 2000,
            contextRequired: true,
            workspaceAccess: true,
          },
          maxRetries: 2,
        },
        {
          name: 'Generowanie Kodu',
          description: 'Generowanie kodu na podstawie analizy',
          type: 'ai_generation',
          dependencies: ['Analiza Wymagań'],
          configuration: {
            prompt: 'Wygeneruj kod na podstawie analizy',
            temperature: 0.1,
            maxTokens: 4000,
            contextRequired: true,
            workspaceAccess: true,
          },
          maxRetries: 3,
        },
        {
          name: 'Walidacja Kodu',
          description: 'Walidacja wygenerowanego kodu',
          type: 'validation',
          dependencies: ['Generowanie Kodu'],
          configuration: {
            contextRequired: true,
          },
          maxRetries: 1,
        },
      ],
    });
  }

  /**
   * Tworzy template do analizy dokumentacji
   */
  private async createDocumentationTemplate(): Promise<void> {
    await this.createWorkflowTemplate({
      name: 'Analiza Dokumentacji',
      description: 'Kompleksowa analiza i dokumentowanie projektu',
      category: 'documentation',
      complexity: 'simple',
      estimatedDuration: 180000, // 3 minuty
      providerStrategy: {
        primary: 'openai',
        fallbacks: ['anthropic'],
        contextAffinity: true,
      },
      requirements: {
        minimumProviders: ['openai'],
        optionalProviders: ['anthropic'],
        contextRequired: true,
        workspaceAccess: true,
      },
      steps: [
        {
          name: 'Skanowanie Projektu',
          description: 'Skanowanie struktury projektu',
          type: 'data_processing',
          dependencies: [],
          configuration: {
            workspaceAccess: true,
          },
          maxRetries: 1,
        },
        {
          name: 'Generowanie Dokumentacji',
          description: 'Generowanie dokumentacji projektu',
          type: 'ai_generation',
          dependencies: ['Skanowanie Projektu'],
          configuration: {
            prompt: 'Wygeneruj dokumentację dla projektu',
            temperature: 0.2,
            maxTokens: 3000,
            contextRequired: true,
          },
          maxRetries: 2,
        },
      ],
    });
  }
}
