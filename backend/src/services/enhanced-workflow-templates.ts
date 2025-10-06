/**
 * Enhanced Workflow Templates - New Project vs Existing Project Workflows
 * ThinkCode AI Platform - Specialized workflow templates with approval mechanisms
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

  // Enhanced workflow features
  approvals: ApprovalStep[];
  iterations: IterationConfig;
  checkpoints: string[]; // Step IDs where manual checkpoints are required

  steps: EnhancedWorkflowStep[];
  providerStrategy: {
    primary: string;
    fallbacks: string[];
    loadBalancing?: boolean;
    costOptimization?: boolean;
    contextAffinity?: boolean;
  };

  estimatedDuration: number; // seconds
  requirements: {
    minimumProviders: string[];
    optionalProviders: string[];
    contextRequired: boolean;
    workspaceAccess: boolean;
    stakeholderApproval?: boolean;
  };

  // Integration settings
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

    // Approval-specific config
    approvalRequired?: boolean;
    approverType?: ApprovalStep['approverType'];
    reviewCriteria?: ApprovalStep['reviewCriteria'];

    // Iteration-specific config
    allowIterations?: boolean;
    maxIterations?: number;
    iterationPrompt?: string;

    // Mockup/Design config
    mockupType?: 'wireframe' | 'prototype' | 'final_design';
    designTools?: string[];
    responsiveBreakpoints?: string[];
  };

  maxRetries: number;
}

/**
 * Enhanced Workflow Templates for different project scenarios
 */
export class EnhancedWorkflowTemplates {
  /**
   * Workflow for NEW PROJECT development
   */
  static getNewProjectWorkflow(): WorkflowTemplateEnhanced {
    return {
      id: 'new-project-development',
      name: 'New Project Development Workflow',
      description:
        'Complete workflow for developing new applications from requirements to deployment',
      category: 'new_project',
      projectType: 'web_app',
      complexity: 'complex',

      approvals: [
        {
          id: 'requirements-approval',
          stepName: 'validate-requirements',
          approverType: 'product_owner',
          approvalRequired: true,
          timeoutMinutes: 1440, // 24 hours
          fallbackAction: 'escalate',
          reviewCriteria: {
            business: [
              'Requirements completeness',
              'Business value alignment',
              'Feasibility assessment',
            ],
            technical: ['Technical feasibility', 'Architecture considerations'],
          },
        },
        {
          id: 'design-approval',
          stepName: 'generate-mockups',
          approverType: 'stakeholder',
          approvalRequired: true,
          timeoutMinutes: 720, // 12 hours
          fallbackAction: 'auto_reject',
          reviewCriteria: {
            design: [
              'UI/UX compliance',
              'Brand guidelines',
              'Accessibility standards',
            ],
            business: ['User experience alignment', 'Feature completeness'],
          },
        },
        {
          id: 'architecture-approval',
          stepName: 'design-architecture',
          approverType: 'tech_lead',
          approvalRequired: true,
          timeoutMinutes: 480, // 8 hours
          fallbackAction: 'escalate',
          reviewCriteria: {
            technical: [
              'Scalability',
              'Security',
              'Performance',
              'Maintainability',
            ],
            business: ['Cost efficiency', 'Timeline feasibility'],
          },
        },
      ],

      iterations: {
        maxIterations: 3,
        iterationTriggers: [
          'user_feedback',
          'validation_failed',
          'approval_rejected',
        ],
        iterationScope: 'from_specific_step',
      },

      checkpoints: [
        'validate-requirements',
        'generate-mockups',
        'design-architecture',
        'implement-core-features',
      ],

      steps: [
        {
          name: 'analyze-requirements',
          description:
            'Analyze business requirements and create detailed specification',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: [],
          configuration: {
            prompt: `Analyze the following project requirements and create a comprehensive specification including:
            - Functional requirements breakdown
            - Non-functional requirements
            - User stories with acceptance criteria
            - Technical constraints and considerations
            - Suggested technology stack
            - Project timeline estimation`,
            contextRequired: true,
            workspaceAccess: false,
            maxTokens: 4000,
            temperature: 0.7,
          },
          maxRetries: 2,
        },
        {
          name: 'validate-requirements',
          description: 'Stakeholder validation of analyzed requirements',
          type: 'approval_gate',
          dependencies: ['analyze-requirements'],
          configuration: {
            approvalRequired: true,
            approverType: 'product_owner',
            reviewCriteria: {
              business: [
                'Requirements completeness',
                'Business value',
                'Feasibility',
              ],
              technical: ['Technical constraints', 'Resource requirements'],
            },
            allowIterations: true,
            maxIterations: 2,
            iterationPrompt:
              'Revise requirements based on stakeholder feedback:',
          },
          maxRetries: 1,
        },
        {
          name: 'generate-mockups',
          description: 'Generate UI mockups and wireframes',
          type: 'mockup_generation',
          provider: 'github-copilot',
          dependencies: ['validate-requirements'],
          configuration: {
            prompt: `Based on the validated requirements, generate:
            - Wireframes for all major screens
            - User flow diagrams
            - Interactive prototype specifications
            - Responsive design considerations
            - Component hierarchy and reusability plan`,
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
        },
        {
          name: 'design-architecture',
          description:
            'Design system architecture and technical specifications',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['generate-mockups'],
          configuration: {
            prompt: `Design comprehensive system architecture including:
            - High-level system design
            - Database schema design
            - API specifications and endpoints
            - Security architecture
            - Deployment and infrastructure plan
            - Performance optimization strategy
            - Monitoring and logging setup`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 4000,
            temperature: 0.6,
            approvalRequired: true,
            approverType: 'tech_lead',
          },
          maxRetries: 2,
        },
        {
          name: 'setup-project-structure',
          description: 'Generate project scaffolding and initial setup',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['design-architecture'],
          configuration: {
            prompt: `Create complete project setup including:
            - Project folder structure
            - Configuration files (package.json, tsconfig, etc.)
            - Development environment setup
            - CI/CD pipeline configuration
            - Testing framework setup
            - Code quality tools configuration`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 2500,
            temperature: 0.5,
          },
          maxRetries: 2,
        },
        {
          name: 'implement-core-features',
          description: 'Implement core application features',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['setup-project-structure'],
          configuration: {
            prompt: `Implement core features based on specifications:
            - Core business logic implementation
            - Database models and repositories
            - API endpoints and controllers
            - Frontend components and pages
            - Authentication and authorization
            - Error handling and validation`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 6000,
            temperature: 0.7,
            allowIterations: true,
            maxIterations: 2,
          },
          maxRetries: 3,
        },
        {
          name: 'implement-tests',
          description: 'Generate comprehensive test suite',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['implement-core-features'],
          configuration: {
            prompt: `Create comprehensive test coverage:
            - Unit tests for all business logic
            - Integration tests for API endpoints
            - Frontend component tests
            - End-to-end test scenarios
            - Performance and load tests
            - Security tests`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 4000,
            temperature: 0.6,
          },
          maxRetries: 2,
        },
        {
          name: 'validate-implementation',
          description: 'Validate implementation against requirements',
          type: 'validation',
          dependencies: ['implement-tests'],
          configuration: {
            contextRequired: true,
            workspaceAccess: true,
            allowIterations: true,
            maxIterations: 1,
          },
          maxRetries: 1,
        },
        {
          name: 'deployment-setup',
          description: 'Setup deployment and production environment',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['validate-implementation'],
          configuration: {
            prompt: `Setup production deployment:
            - Production environment configuration
            - Database migration scripts
            - Deployment automation
            - Monitoring and alerting setup
            - Backup and recovery procedures
            - Performance optimization`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 3000,
            temperature: 0.5,
          },
          maxRetries: 2,
        },
      ],

      providerStrategy: {
        primary: 'github-copilot',
        fallbacks: ['openai'],
        contextAffinity: true,
        loadBalancing: false,
      },

      estimatedDuration: 3600, // 1 hour for AI generation, more for approvals

      requirements: {
        minimumProviders: ['github-copilot'],
        optionalProviders: ['openai'],
        contextRequired: true,
        workspaceAccess: true,
        stakeholderApproval: true,
      },

      frontendIntegration: {
        showProgress: true,
        allowUserInteraction: true,
        notificationEndpoints: ['/api/notifications/workflow-update'],
      },
    };
  }

  /**
   * Workflow for EXISTING PROJECT modifications
   */
  static getExistingProjectWorkflow(): WorkflowTemplateEnhanced {
    return {
      id: 'existing-project-enhancement',
      name: 'Existing Project Enhancement Workflow',
      description: 'Workflow for modifying and enhancing existing applications',
      category: 'existing_project',
      projectType: 'generic',
      complexity: 'medium',

      approvals: [
        {
          id: 'impact-analysis-approval',
          stepName: 'analyze-impact',
          approverType: 'tech_lead',
          approvalRequired: true,
          timeoutMinutes: 240, // 4 hours
          fallbackAction: 'escalate',
          reviewCriteria: {
            technical: [
              'Impact assessment accuracy',
              'Risk evaluation',
              'Testing strategy',
            ],
            business: ['Change scope alignment', 'Timeline estimation'],
          },
        },
        {
          id: 'implementation-plan-approval',
          stepName: 'create-implementation-plan',
          approverType: 'stakeholder',
          approvalRequired: true,
          timeoutMinutes: 480, // 8 hours
          fallbackAction: 'auto_reject',
          reviewCriteria: {
            technical: [
              'Implementation strategy',
              'Rollback plan',
              'Testing approach',
            ],
            business: ['Business continuity', 'User impact minimization'],
          },
        },
      ],

      iterations: {
        maxIterations: 5, // More iterations for existing projects
        iterationTriggers: [
          'user_feedback',
          'validation_failed',
          'approval_rejected',
        ],
        iterationScope: 'current_step',
      },

      checkpoints: [
        'analyze-codebase',
        'analyze-impact',
        'implement-changes',
        'validate-changes',
      ],

      steps: [
        {
          name: 'analyze-codebase',
          description: 'Comprehensive analysis of existing codebase',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: [],
          configuration: {
            prompt: `Perform comprehensive codebase analysis:
            - Code structure and architecture analysis
            - Identify existing patterns and conventions
            - Dependencies and third-party libraries audit
            - Code quality assessment
            - Performance bottlenecks identification
            - Security vulnerabilities scan
            - Technical debt assessment
            - Documentation review`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 5000,
            temperature: 0.6,
          },
          maxRetries: 2,
        },
        {
          name: 'understand-requirements',
          description:
            'Analyze change requirements in context of existing system',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['analyze-codebase'],
          configuration: {
            prompt: `Analyze change requirements considering existing system:
            - Parse and understand requested changes
            - Map requirements to existing code components
            - Identify affected modules and dependencies
            - Assess compatibility with current architecture
            - Suggest optimal implementation approaches
            - Highlight potential conflicts or issues`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 3500,
            temperature: 0.7,
          },
          maxRetries: 2,
        },
        {
          name: 'analyze-impact',
          description: 'Analyze impact of changes on existing system',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['understand-requirements'],
          configuration: {
            prompt: `Conduct thorough impact analysis:
            - Breaking changes identification
            - Backward compatibility assessment
            - Performance impact evaluation
            - Security implications
            - Database schema changes needed
            - API changes and versioning requirements
            - User experience impact
            - Testing requirements and scope
            - Risk assessment and mitigation strategies`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 4000,
            temperature: 0.5,
            approvalRequired: true,
            approverType: 'tech_lead',
          },
          maxRetries: 2,
        },
        {
          name: 'create-implementation-plan',
          description:
            'Create detailed implementation plan with rollback strategy',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['analyze-impact'],
          configuration: {
            prompt: `Create comprehensive implementation plan:
            - Step-by-step implementation sequence
            - Database migration plan (if needed)
            - Feature flag strategy for gradual rollout
            - Testing plan (unit, integration, E2E)
            - Deployment strategy (blue-green, rolling, etc.)
            - Monitoring and alerting setup
            - Rollback procedures and criteria
            - Communication plan for stakeholders
            - Timeline with milestones`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 4000,
            temperature: 0.6,
            approvalRequired: true,
            approverType: 'stakeholder',
            allowIterations: true,
            maxIterations: 3,
          },
          maxRetries: 2,
        },
        {
          name: 'backup-current-state',
          description: 'Create backup and save point of current system',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['create-implementation-plan'],
          configuration: {
            prompt: `Create system backup and rollback preparation:
            - Database backup scripts
            - Code repository tagging
            - Configuration backup
            - Documentation of current state
            - Environment snapshots
            - Rollback automation scripts`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 2000,
            temperature: 0.4,
          },
          maxRetries: 1,
        },
        {
          name: 'implement-changes',
          description: 'Implement changes following the approved plan',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['backup-current-state'],
          configuration: {
            prompt: `Implement changes following the approved plan:
            - Follow existing code patterns and conventions
            - Implement changes incrementally
            - Add comprehensive error handling
            - Update existing tests and add new ones
            - Update documentation
            - Implement logging and monitoring hooks
            - Ensure backward compatibility where required`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 6000,
            temperature: 0.7,
            allowIterations: true,
            maxIterations: 3,
            iterationPrompt: 'Refine implementation based on feedback:',
          },
          maxRetries: 3,
        },
        {
          name: 'update-tests',
          description: 'Update and extend test suite for changes',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['implement-changes'],
          configuration: {
            prompt: `Update and extend test coverage:
            - Update existing tests affected by changes
            - Add new unit tests for new functionality
            - Create integration tests for modified workflows
            - Add regression tests to prevent future issues
            - Update E2E tests for UI changes
            - Performance tests for critical paths`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 3500,
            temperature: 0.6,
          },
          maxRetries: 2,
        },
        {
          name: 'validate-changes',
          description: 'Comprehensive validation of implemented changes',
          type: 'validation',
          dependencies: ['update-tests'],
          configuration: {
            contextRequired: true,
            workspaceAccess: true,
            allowIterations: true,
            maxIterations: 2,
          },
          maxRetries: 2,
        },
        {
          name: 'update-documentation',
          description: 'Update system documentation',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['validate-changes'],
          configuration: {
            prompt: `Update all relevant documentation:
            - API documentation updates
            - User guide modifications
            - Developer documentation
            - Deployment guide updates
            - Changelog entries
            - Architecture documentation updates`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 2500,
            temperature: 0.5,
          },
          maxRetries: 1,
        },
        {
          name: 'prepare-deployment',
          description: 'Prepare for production deployment',
          type: 'ai_generation',
          provider: 'github-copilot',
          dependencies: ['update-documentation'],
          configuration: {
            prompt: `Prepare production deployment:
            - Final deployment checklist
            - Database migration scripts (if needed)
            - Environment configuration updates
            - Monitoring alerts setup
            - Feature flag configuration
            - Communication templates for deployment
            - Post-deployment validation checklist`,
            contextRequired: true,
            workspaceAccess: true,
            maxTokens: 2500,
            temperature: 0.4,
          },
          maxRetries: 1,
        },
      ],

      providerStrategy: {
        primary: 'github-copilot',
        fallbacks: ['openai'],
        contextAffinity: true,
        loadBalancing: false,
      },

      estimatedDuration: 2400, // 40 minutes for AI generation

      requirements: {
        minimumProviders: ['github-copilot'],
        optionalProviders: ['openai'],
        contextRequired: true,
        workspaceAccess: true,
        stakeholderApproval: true,
      },

      frontendIntegration: {
        showProgress: true,
        allowUserInteraction: true,
        notificationEndpoints: ['/api/notifications/workflow-update'],
      },
    };
  }

  /**
   * Get all available workflow templates
   */
  static getAllTemplates(): WorkflowTemplateEnhanced[] {
    return [this.getNewProjectWorkflow(), this.getExistingProjectWorkflow()];
  }

  /**
   * Get template by ID
   */
  static getTemplate(templateId: string): WorkflowTemplateEnhanced | null {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === templateId) || null;
  }
}

export default EnhancedWorkflowTemplates;
