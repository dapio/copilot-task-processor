/**
 * Template Workflow dla Istniejącego Projektu
 * ThinkCode AI Platform - Workflow dla modyfikacji i rozbudowy istniejących aplikacji
 */

import {
  WorkflowTemplateEnhanced,
  ApprovalStep,
  IterationConfig,
  EnhancedWorkflowStep,
} from '../types/workflow-template.types';

export class ExistingProjectTemplate {
  /**
   * Workflow dla modyfikacji ISTNIEJĄCEGO PROJEKTU
   */
  static create(): WorkflowTemplateEnhanced {
    return {
      id: 'existing-project-enhancement',
      name: 'Workflow Rozbudowy Istniejącego Projektu',
      description:
        'Workflow dla modyfikacji i rozbudowy istniejących aplikacji',
      category: 'existing_project',
      projectType: 'generic',
      complexity: 'medium',
      approvals: this.createApprovals(),
      iterations: this.createIterations(),
      checkpoints: this.createCheckpoints(),
      steps: this.createSteps(),
      providerStrategy: this.createProviderStrategy(),
      estimatedDuration: 2400, // 40 minut dla generacji AI
      requirements: this.createRequirements(),
      frontendIntegration: this.createFrontendIntegration(),
    };
  }

  private static createApprovals(): ApprovalStep[] {
    return [
      {
        id: 'impact-analysis-approval',
        stepName: 'analyze-impact',
        approverType: 'tech_lead',
        approvalRequired: true,
        timeoutMinutes: 240, // 4 godziny
        fallbackAction: 'escalate',
        reviewCriteria: {
          technical: [
            'Dokładność oceny wpływu',
            'Ocena ryzyka',
            'Strategia testowania',
          ],
          business: ['Zgodność zakresu zmian', 'Oszacowanie czasu'],
        },
      },
      {
        id: 'implementation-plan-approval',
        stepName: 'create-implementation-plan',
        approverType: 'stakeholder',
        approvalRequired: true,
        timeoutMinutes: 480, // 8 godzin
        fallbackAction: 'auto_reject',
        reviewCriteria: {
          technical: [
            'Strategia implementacji',
            'Plan rollback',
            'Podejście do testowania',
          ],
          business: [
            'Ciągłość biznesowa',
            'Minimalizacja wpływu na użytkowników',
          ],
        },
      },
    ];
  }

  private static createIterations(): IterationConfig {
    return {
      maxIterations: 5, // Więcej iteracji dla istniejących projektów
      iterationTriggers: [
        'user_feedback',
        'validation_failed',
        'approval_rejected',
      ],
      iterationScope: 'current_step',
    };
  }

  private static createCheckpoints(): string[] {
    return [
      'analyze-codebase',
      'analyze-impact',
      'implement-changes',
      'validate-changes',
    ];
  }

  private static createSteps(): EnhancedWorkflowStep[] {
    return [
      this.createCodebaseAnalysisStep(),
      this.createImpactAnalysisStep(),
      this.createImplementationPlanStep(),
      this.createChangesImplementationStep(),
      this.createValidationStep(),
    ];
  }

  private static createCodebaseAnalysisStep(): EnhancedWorkflowStep {
    return {
      name: 'analyze-codebase',
      description: 'Kompleksowa analiza istniejącej bazy kodu',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: [],
      configuration: {
        prompt: `Przeprowadź kompleksową analizę bazy kodu: struktura, wzorce, zależności`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 3500,
        temperature: 0.3,
      },
      maxRetries: 2,
    };
  }

  private static createImpactAnalysisStep(): EnhancedWorkflowStep {
    return {
      name: 'analyze-impact',
      description: 'Analiza wpływu proponowanych zmian',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: ['analyze-codebase'],
      configuration: {
        prompt: `Przeanalizuj wpływ proponowanych zmian na istniejący system`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 2500,
        temperature: 0.4,
        approvalRequired: true,
        approverType: 'tech_lead',
      },
      maxRetries: 2,
    };
  }

  private static createImplementationPlanStep(): EnhancedWorkflowStep {
    return {
      name: 'create-implementation-plan',
      description: 'Tworzenie szczegółowego planu implementacji',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: ['analyze-impact'],
      configuration: {
        prompt: `Stwórz szczegółowy plan implementacji zmian w istniejącym kodzie`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 3000,
        temperature: 0.5,
        approvalRequired: true,
        approverType: 'stakeholder',
      },
      maxRetries: 2,
    };
  }

  private static createChangesImplementationStep(): EnhancedWorkflowStep {
    return {
      name: 'implement-changes',
      description: 'Implementacja zaplanowanych zmian',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: ['create-implementation-plan'],
      configuration: {
        prompt: `Implementuj zaplanowane zmiany zgodnie z planem i wzorcami kodu`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 4000,
        temperature: 0.6,
      },
      maxRetries: 3,
    };
  }

  private static createValidationStep(): EnhancedWorkflowStep {
    return {
      name: 'validate-changes',
      description: 'Walidacja i testowanie wprowadzonych zmian',
      type: 'validation',
      provider: 'github-copilot',
      dependencies: ['implement-changes'],
      configuration: {
        prompt: `Przeprowadź walidację i testowanie wprowadzonych zmian`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 2500,
        temperature: 0.4,
      },
      maxRetries: 1,
    };
  }

  private static createProviderStrategy() {
    return {
      primary: 'github-copilot',
      fallbacks: ['openai'],
      contextAffinity: true,
      loadBalancing: false,
    };
  }

  private static createRequirements() {
    return {
      minimumProviders: ['github-copilot'],
      optionalProviders: ['openai'],
      contextRequired: true,
      workspaceAccess: true,
      stakeholderApproval: true,
    };
  }

  private static createFrontendIntegration() {
    return {
      showProgress: true,
      allowUserInteraction: true,
      notificationEndpoints: ['/api/notifications/workflow-update'],
    };
  }
}
