/**
 * Typy szablonów workflow - Enhanced Workflow Templates
 * ThinkCode AI Platform - Wyspecjalizowane szablony workflow z mechanizmami zatwierdzeń
 */

export interface ApprovalStep {
  id: string;
  stepName: string;
  approverType: 'user' | 'stakeholder' | 'tech_lead' | 'product_owner';
  approvalRequired: boolean;
  timeoutMinutes?: number;
  fallbackAction?: 'auto_approve' | 'auto_reject' | 'escalate';
  reviewCriteria: {
    technical?: string[];
    business?: string[];
    design?: string[];
    security?: string[];
  };
}

export interface IterationConfig {
  maxIterations: number;
  iterationTriggers: (
    | 'user_feedback'
    | 'validation_failed'
    | 'approval_rejected'
  )[];
  iterationScope: 'full_workflow' | 'current_step' | 'from_specific_step';
  fallbackStepId?: string;
}

export interface WorkflowTemplateEnhanced {
  id: string;
  name: string;
  description: string;
  category: 'new_project' | 'existing_project' | 'maintenance' | 'analysis';
  projectType: 'web_app' | 'mobile_app' | 'api' | 'desktop' | 'generic';
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';

  // Zaawansowane funkcje workflow
  approvals: ApprovalStep[];
  iterations: IterationConfig;
  checkpoints: string[]; // ID kroków gdzie wymagane są punkty kontrolne

  steps: EnhancedWorkflowStep[];
  providerStrategy: {
    primary: string;
    fallbacks: string[];
    loadBalancing?: boolean;
    costOptimization?: boolean;
    contextAffinity?: boolean;
  };

  estimatedDuration: number; // sekundy
  requirements: {
    minimumProviders: string[];
    optionalProviders: string[];
    contextRequired: boolean;
    workspaceAccess: boolean;
    stakeholderApproval?: boolean;
  };

  // Ustawienia integracji
  frontendIntegration: {
    showProgress: boolean;
    allowUserInteraction: boolean;
    notificationEndpoints?: string[];
  };
}

export interface EnhancedWorkflowStep {
  name: string;
  description: string;
  type:
    | 'ai_generation'
    | 'human_review'
    | 'approval_gate'
    | 'iteration_point'
    | 'validation'
    | 'integration'
    | 'mockup_generation';
  provider?: string;
  dependencies: string[];

  configuration: {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    contextRequired?: boolean;
    workspaceAccess?: boolean;
    fallbackProviders?: string[];

    // Konfiguracja specyficzna dla zatwierdzeń
    approvalRequired?: boolean;
    approverType?: ApprovalStep['approverType'];
    reviewCriteria?: ApprovalStep['reviewCriteria'];

    // Konfiguracja specyficzna dla iteracji
    allowIterations?: boolean;
    maxIterations?: number;
    iterationPrompt?: string;

    // Konfiguracja Mockup/Design
    mockupType?: 'wireframe' | 'prototype' | 'final_design';
    designTools?: string[];
    responsiveBreakpoints?: string[];
  };

  maxRetries: number;
}

export interface TemplateValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateSearchCriteria {
  category?: WorkflowTemplateEnhanced['category'];
  projectType?: WorkflowTemplateEnhanced['projectType'];
  complexity?: WorkflowTemplateEnhanced['complexity'];
  requiresApproval?: boolean;
  maxDuration?: number;
}
