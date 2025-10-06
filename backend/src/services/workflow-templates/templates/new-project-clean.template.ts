/**
 * Template Workflow dla Nowego Projektu
 * ThinkCode AI Platform - Kompletny workflow dla rozwoju nowych aplikacji
 */

import {
  WorkflowTemplateEnhanced,
  ApprovalStep,
  IterationConfig,
  EnhancedWorkflowStep,
} from '../types/workflow-template.types';

export class NewProjectTemplate {
  /**
   * Workflow dla rozwoju NOWEGO PROJEKTU
   */
  static create(): WorkflowTemplateEnhanced {
    return {
      id: 'new-project-development',
      name: 'Workflow Rozwoju Nowego Projektu',
      description:
        'Kompletny workflow dla rozwoju nowych aplikacji od wymagań do wdrożenia',
      category: 'new_project',
      projectType: 'web_app',
      complexity: 'complex',
      approvals: this.createApprovals(),
      iterations: this.createIterations(),
      checkpoints: this.createCheckpoints(),
      steps: this.createSteps(),
      providerStrategy: this.createProviderStrategy(),
      estimatedDuration: 7200, // 2 godziny dla kompletnego nowego projektu
      requirements: this.createRequirements(),
      frontendIntegration: this.createFrontendIntegration(),
    };
  }

  private static createApprovals(): ApprovalStep[] {
    return [
      {
        id: 'requirements-approval',
        stepName: 'validate-requirements',
        approverType: 'product_owner',
        approvalRequired: true,
        timeoutMinutes: 1440, // 24 godziny
        fallbackAction: 'escalate',
        reviewCriteria: {
          business: [
            'Kompletność wymagań',
            'Zgodność z wartością biznesową',
            'Ocena wykonalności',
          ],
          technical: ['Wykonalność techniczna', 'Rozważania architektoniczne'],
        },
      },
      {
        id: 'design-approval',
        stepName: 'generate-mockups',
        approverType: 'stakeholder',
        approvalRequired: true,
        timeoutMinutes: 720, // 12 godzin
        fallbackAction: 'auto_reject',
        reviewCriteria: {
          design: [
            'Zgodność z UX/UI guidelines',
            'Responsywność projektu',
            'Accessibility compliance',
          ],
          business: ['Zgodność z wymaganiami biznesowymi'],
        },
      },
      {
        id: 'architecture-approval',
        stepName: 'design-architecture',
        approverType: 'tech_lead',
        approvalRequired: true,
        timeoutMinutes: 480, // 8 godzin
        fallbackAction: 'escalate',
        reviewCriteria: {
          technical: [
            'Skalowalność architektury',
            'Bezpieczeństwo systemu',
            'Strategia wydajności',
          ],
          security: ['Architektura bezpieczeństwa', 'Compliance z regulacjami'],
        },
      },
    ];
  }

  private static createIterations(): IterationConfig {
    return {
      maxIterations: 3, // Mniej iteracji dla nowych projektów
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
      'validate-requirements',
      'generate-mockups',
      'design-architecture',
      'implement-backend',
      'implement-frontend',
    ];
  }

  private static createSteps(): EnhancedWorkflowStep[] {
    return [
      this.createValidationStep(),
      this.createMockupStep(),
      this.createArchitectureStep(),
      this.createBackendStep(),
      this.createFrontendStep(),
    ];
  }

  private static createValidationStep(): EnhancedWorkflowStep {
    return {
      name: 'validate-requirements',
      description: 'Walidacja i analiza wymagań projektowych',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: [],
      configuration: {
        prompt: `Przeprowadź kompleksową walidację wymagań projektowych`,
        contextRequired: true,
        workspaceAccess: false,
        maxTokens: 2000,
        temperature: 0.3,
        approvalRequired: true,
        approverType: 'product_owner',
      },
      maxRetries: 2,
    };
  }

  private static createMockupStep(): EnhancedWorkflowStep {
    return {
      name: 'generate-mockups',
      description: 'Generowanie mockupów i prototypów interfejsu',
      type: 'mockup_generation',
      provider: 'github-copilot',
      dependencies: ['validate-requirements'],
      configuration: {
        prompt: `Na podstawie zwalidowanych wymagań wygeneruj mockupy i prototypy`,
        contextRequired: true,
        workspaceAccess: true,
        mockupType: 'prototype',
        responsiveBreakpoints: ['mobile', 'tablet', 'desktop'],
        maxTokens: 3000,
        temperature: 0.8,
        approvalRequired: true,
        approverType: 'stakeholder',
      },
      maxRetries: 3,
    };
  }

  private static createArchitectureStep(): EnhancedWorkflowStep {
    return {
      name: 'design-architecture',
      description:
        'Projektowanie architektury systemu i specyfikacji technicznych',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: ['generate-mockups'],
      configuration: {
        prompt: `Zaprojektuj kompleksową architekturę systemu`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 4000,
        temperature: 0.6,
        approvalRequired: true,
        approverType: 'tech_lead',
      },
      maxRetries: 2,
    };
  }

  private static createBackendStep(): EnhancedWorkflowStep {
    return {
      name: 'implement-backend',
      description: 'Implementacja logiki backendowej i API',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: ['design-architecture'],
      configuration: {
        prompt: `Implementuj backend aplikacji zgodnie z architekturą`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 5000,
        temperature: 0.7,
      },
      maxRetries: 3,
    };
  }

  private static createFrontendStep(): EnhancedWorkflowStep {
    return {
      name: 'implement-frontend',
      description: 'Implementacja interfejsu użytkownika',
      type: 'ai_generation',
      provider: 'github-copilot',
      dependencies: ['implement-backend'],
      configuration: {
        prompt: `Implementuj frontend aplikacji zgodnie z mockupami`,
        contextRequired: true,
        workspaceAccess: true,
        maxTokens: 5000,
        temperature: 0.7,
      },
      maxRetries: 3,
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
