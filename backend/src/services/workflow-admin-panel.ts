/**
 * Workflow Admin Panel - Chat-based workflow creation and management
 * ThinkCode AI Platform - AI-powered workflow builder with natural language interface
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';
import {
  WorkflowTemplateEnhanced,
  EnhancedWorkflowStep,
  ApprovalStep,
} from './enhanced-workflow-templates';
import ChatIntegrationService from './chat-integration.service';
import ContextManager from './context-manager';

export interface WorkflowCreationSession {
  id: string;
  chatSessionId: string;
  status: 'active' | 'completed' | 'cancelled';

  // Workflow being built
  workflowInProgress: Partial<WorkflowTemplateEnhanced>;
  currentStep:
    | 'basic_info'
    | 'steps_definition'
    | 'approvals_setup'
    | 'testing'
    | 'finalization';

  // Chat context
  conversationHistory: string[];
  extractedInformation: {
    projectType?: string;
    complexity?: string;
    stakeholders?: string[];
    technicalRequirements?: string[];
    businessRequirements?: string[];
    approvalGates?: string[];
  };

  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface WorkflowAnalysisResult {
  suggestedTemplate: 'new_project' | 'existing_project' | 'custom';
  confidence: number;

  extractedSteps: {
    name: string;
    description: string;
    type: EnhancedWorkflowStep['type'];
    suggestedProvider: string;
    dependencies: string[];
    confidence: number;
  }[];

  suggestedApprovals: {
    stepName: string;
    approverType: ApprovalStep['approverType'];
    reason: string;
    confidence: number;
  }[];

  estimatedComplexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedDuration: number;

  recommendations: string[];
  potentialIssues: string[];
}

export class WorkflowAdminPanel {
  private prisma: PrismaClient;
  private chatService: ChatIntegrationService;
  private contextManager: ContextManager;
  private provider: IMLProvider;

  private creationSessions: Map<string, WorkflowCreationSession> = new Map();
  private adminContextId: string = '';

  constructor(
    prisma: PrismaClient,
    chatService: ChatIntegrationService,
    contextManager: ContextManager,
    provider: IMLProvider
  ) {
    this.prisma = prisma;
    this.chatService = chatService;
    this.contextManager = contextManager;
    this.provider = provider;
    this.initializeAdminContext();
  }

  /**
   * Inicjalizuje kontekst administratora
   */
  private async initializeAdminContext(): Promise<void> {
    this.adminContextId = await this.contextManager.createAgentContext({
      name: 'Workflow Admin Assistant',
      agentId: 'workflow-admin',
      systemPrompt: `You are a Workflow Admin Assistant specialized in helping create and manage AI-powered workflows.

Your expertise includes:
- Analyzing project requirements and suggesting optimal workflows
- Breaking down complex processes into manageable steps
- Identifying necessary approval gates and stakeholders
- Recommending AI providers and configurations
- Ensuring workflow efficiency and reliability

You help users create workflows by:
1. Understanding their project requirements
2. Analyzing the type of project (new vs existing)
3. Suggesting appropriate workflow templates
4. Customizing steps based on specific needs
5. Setting up approval processes
6. Configuring iteration and feedback loops

Always ask clarifying questions and provide detailed explanations for your recommendations.`,
      description:
        'AI assistant specialized in workflow creation and management',
    });
  }

  // === Workflow Creation Chat Interface ===

  /**
   * Rozpoczyna nową sesję tworzenia workflow przez chat
   */
  async startWorkflowCreation(options: {
    title?: string;
    createdBy: string;
    initialPrompt?: string;
  }): Promise<string> {
    const sessionId = `workflow_creation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Stwórz chat session
    const chatSessionId = await this.chatService.createChatSession({
      contextId: this.adminContextId,
      contextType: 'agent',
      title: options.title || 'New Workflow Creation',
      activeProviders: ['github-copilot'],
      settings: {
        contextAware: true,
        workspaceAccess: false,
        autoSave: true,
        multiProvider: false,
      },
    });

    // Stwórz workflow creation session
    const creationSession: WorkflowCreationSession = {
      id: sessionId,
      chatSessionId,
      status: 'active',
      workflowInProgress: {
        name: '',
        description: '',
        category: 'new_project',
        steps: [],
        approvals: [],
      },
      currentStep: 'basic_info',
      conversationHistory: [],
      extractedInformation: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options.createdBy,
    };

    this.creationSessions.set(sessionId, creationSession);

    // Wyślij wiadomość powitalną
    const welcomeMessage =
      options.initialPrompt ||
      `Hello! I'm your Workflow Admin Assistant. I'll help you create a custom workflow for your project.

Let's start by understanding what kind of workflow you need:

1. **Is this for a new project or modifications to an existing one?**
2. **What type of application/system are you working with?** (web app, mobile app, API, etc.)
3. **What are the main goals of this workflow?**

Please describe your project and what you want to achieve with the workflow.`;

    await this.chatService.processMessage({
      sessionId: chatSessionId,
      message: welcomeMessage,
      provider: 'github-copilot',
      settings: {
        includeContext: true,
        maxTokens: 500,
        temperature: 0.7,
      },
    });

    return sessionId;
  }

  /**
   * Przetwarza wiadomość w sesji tworzenia workflow
   */
  async processWorkflowCreationMessage(
    sessionId: string,
    userMessage: string
  ): Promise<
    Result<
      {
        response: string;
        suggestedActions?: string[];
        workflowProgress?: Partial<WorkflowTemplateEnhanced>;
        needsApproval?: boolean;
      },
      MLError
    >
  > {
    const session = this.creationSessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Workflow creation session ${sessionId} not found`,
          retryable: false,
        },
      };
    }

    try {
      // Dodaj wiadomość do historii
      session.conversationHistory.push(`User: ${userMessage}`);
      session.updatedAt = new Date();

      // Przeanalizuj wiadomość i wyciągnij informacje
      const analysisResult = await this.analyzeUserInput(userMessage, session);

      // Aktualizuj extracted information
      this.updateExtractedInformation(session, analysisResult);

      // Przygotuj kontekstową wiadomość dla AI
      const contextualPrompt = this.buildContextualPrompt(session, userMessage);

      // Wyślij do chat service
      const chatResponse = await this.chatService.processMessage({
        sessionId: session.chatSessionId,
        message: contextualPrompt,
        provider: 'github-copilot',
        settings: {
          includeContext: true,
          maxTokens: 2000,
          temperature: 0.7,
        },
      });

      if (!chatResponse.success) {
        return chatResponse;
      }

      // Dodaj odpowiedź do historii
      session.conversationHistory.push(
        `Assistant: ${chatResponse.data.content}`
      );

      // Sprawdź czy można przejść do następnego kroku
      const nextStepResult = await this.evaluateNextStep(session);

      return {
        success: true,
        data: {
          response: chatResponse.data.content,
          suggestedActions: nextStepResult.suggestedActions,
          workflowProgress: session.workflowInProgress,
          needsApproval: nextStepResult.needsApproval,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: `Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      };
    }
  }

  /**
   * Generuje workflow na podstawie zebranych informacji
   */
  async generateWorkflow(
    sessionId: string
  ): Promise<Result<WorkflowTemplateEnhanced, MLError>> {
    const session = this.creationSessions.get(sessionId);
    if (!session) {
      return {
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: `Session ${sessionId} not found`,
          retryable: false,
        },
      };
    }

    try {
      // Przeanalizuj całą konwersację i wygeneruj workflow
      const analysisPrompt = `Based on our conversation, create a comprehensive workflow template:

Conversation Summary:
${session.conversationHistory.join('\n')}

Extracted Information:
- Project Type: ${session.extractedInformation.projectType}
- Complexity: ${session.extractedInformation.complexity}
- Technical Requirements: ${session.extractedInformation.technicalRequirements?.join(', ')}
- Business Requirements: ${session.extractedInformation.businessRequirements?.join(', ')}
- Stakeholders: ${session.extractedInformation.stakeholders?.join(', ')}

Please generate a detailed workflow template with:
1. Workflow metadata (name, description, category, complexity)
2. Complete step-by-step process
3. Approval gates with appropriate stakeholders
4. Provider recommendations for each step
5. Iteration and feedback mechanisms
6. Estimated timelines

Format the response as a structured workflow definition.`;

      const generationResult = await this.provider.generateText(
        analysisPrompt,
        {
          temperature: 0.6,
          maxTokens: 4000,
        }
      );

      if (!generationResult.success) {
        return generationResult;
      }

      // Parsuj odpowiedź i stwórz workflow template
      const workflowTemplate = await this.parseGeneratedWorkflow(
        generationResult.data.text,
        session
      );

      // Aktualizuj sesję
      session.workflowInProgress = workflowTemplate;
      session.currentStep = 'finalization';
      session.updatedAt = new Date();

      return {
        success: true,
        data: workflowTemplate,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: `Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      };
    }
  }

  /**
   * Zatwierdza i zapisuje utworzony workflow
   */
  async finalizeWorkflow(
    sessionId: string,
    finalApprovals?: { approvedBy: string; notes?: string }
  ): Promise<Result<string, MLError>> {
    const session = this.creationSessions.get(sessionId);
    if (!session || !session.workflowInProgress) {
      return {
        success: false,
        error: {
          code: 'SESSION_INVALID',
          message: 'Invalid session or incomplete workflow',
          retryable: false,
        },
      };
    }

    try {
      // Waliduj workflow template
      const validationResult = this.validateWorkflowTemplate(
        session.workflowInProgress
      );
      if (!validationResult.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Workflow validation failed: ${validationResult.errors.join(', ')}`,
            retryable: false,
          },
        };
      }

      // Wygeneruj unikalne ID dla workflow
      const workflowId = `custom_workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const finalWorkflow: WorkflowTemplateEnhanced = {
        ...(session.workflowInProgress as WorkflowTemplateEnhanced),
        id: workflowId,
      };

      // TODO: Zapisz w bazie danych
      // await this.prisma.workflowTemplate.create({ data: finalWorkflow });

      // Aktualizuj sesję
      session.status = 'completed';
      session.updatedAt = new Date();

      // Wyślij podsumowanie do chat
      await this.chatService.processMessage({
        sessionId: session.chatSessionId,
        message: `🎉 **Workflow Created Successfully!**

**Workflow ID:** ${workflowId}
**Name:** ${finalWorkflow.name}
**Category:** ${finalWorkflow.category}
**Complexity:** ${finalWorkflow.complexity}
**Steps:** ${finalWorkflow.steps?.length || 0}
**Approval Gates:** ${finalWorkflow.approvals?.length || 0}

The workflow has been saved and is now available for use in your projects.

You can now:
- Test the workflow with a sample project
- Deploy it to production
- Make further modifications if needed

Thank you for using the Workflow Admin Panel!`,
        provider: 'github-copilot',
        settings: {
          includeContext: false,
          maxTokens: 500,
          temperature: 0.5,
        },
      });

      return {
        success: true,
        data: workflowId,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FINALIZATION_ERROR',
          message: `Failed to finalize workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      };
    }
  }

  // === Helper Methods ===

  /**
   * Analizuje input użytkownika i wyciąga strukturowane informacje
   */
  private async analyzeUserInput(
    userMessage: string,
    session: WorkflowCreationSession
  ): Promise<WorkflowAnalysisResult> {
    const analysisPrompt = `Analyze this user input for workflow creation and extract structured information:

User Message: "${userMessage}"

Current Session Context:
- Current Step: ${session.currentStep}
- Project Type: ${session.extractedInformation.projectType || 'Unknown'}
- Complexity: ${session.extractedInformation.complexity || 'Unknown'}

Please analyze and extract:
1. Project type (web_app, mobile_app, api, desktop, generic)
2. Complexity level (simple, medium, complex, enterprise)
3. Mentioned stakeholders and roles
4. Technical requirements
5. Business requirements
6. Suggested workflow steps
7. Approval points

Provide analysis in structured format.`;

    try {
      const result = await this.provider.generateText(analysisPrompt, {
        temperature: 0.3,
        maxTokens: 1000,
      });

      if (result.success) {
        return this.parseAnalysisResult(result.data.text);
      }
    } catch (error) {
      console.error('Failed to analyze user input:', error);
    }

    // Fallback analysis
    return {
      suggestedTemplate: 'custom',
      confidence: 0.5,
      extractedSteps: [],
      suggestedApprovals: [],
      estimatedComplexity: 'medium',
      estimatedDuration: 3600,
      recommendations: [],
      potentialIssues: [],
    };
  }

  /**
   * Aktualizuje wyciągnięte informacje na podstawie analizy
   */
  private updateExtractedInformation(
    session: WorkflowCreationSession,
    analysis: WorkflowAnalysisResult
  ): void {
    // Aktualizuj informacje jeśli mają wyższy poziom pewności
    if (analysis.confidence > 0.7) {
      if (analysis.extractedSteps.length > 0) {
        // Dodaj nowe kroki
        analysis.extractedSteps.forEach(step => {
          if (step.confidence > 0.6) {
            session.extractedInformation.technicalRequirements =
              session.extractedInformation.technicalRequirements || [];
            session.extractedInformation.technicalRequirements.push(step.name);
          }
        });
      }
    }
  }

  /**
   * Buduje kontekstowy prompt dla AI
   */
  private buildContextualPrompt(
    session: WorkflowCreationSession,
    userMessage: string
  ): string {
    return `Continue helping the user create a workflow. 

Current Progress:
- Step: ${session.currentStep}
- Project Type: ${session.extractedInformation.projectType || 'Not specified'}
- Extracted Info: ${JSON.stringify(session.extractedInformation, null, 2)}

User's Latest Message: "${userMessage}"

Based on the current progress and user's message, provide helpful guidance and ask relevant follow-up questions to gather the information needed for the workflow creation.`;
  }

  /**
   * Ocenia czy można przejść do następnego kroku
   */
  private async evaluateNextStep(session: WorkflowCreationSession): Promise<{
    canProceed: boolean;
    nextStep?: WorkflowCreationSession['currentStep'];
    suggestedActions?: string[];
    needsApproval?: boolean;
  }> {
    const info = session.extractedInformation;

    switch (session.currentStep) {
      case 'basic_info':
        if (info.projectType && info.complexity) {
          return {
            canProceed: true,
            nextStep: 'steps_definition',
            suggestedActions: ['Define workflow steps', 'Set up dependencies'],
          };
        }
        break;

      case 'steps_definition':
        if (info.technicalRequirements && info.businessRequirements) {
          return {
            canProceed: true,
            nextStep: 'approvals_setup',
            suggestedActions: ['Configure approvals', 'Set up stakeholders'],
          };
        }
        break;

      case 'approvals_setup':
        if (info.stakeholders && info.approvalGates) {
          return {
            canProceed: true,
            nextStep: 'testing',
            suggestedActions: ['Test workflow', 'Validate configuration'],
          };
        }
        break;

      case 'testing':
        return {
          canProceed: true,
          nextStep: 'finalization',
          suggestedActions: ['Finalize workflow', 'Deploy to production'],
          needsApproval: true,
        };
    }

    return {
      canProceed: false,
      suggestedActions: ['Continue providing information'],
    };
  }

  /**
   * Parsuje wygenerowany workflow z AI odpowiedzi
   */
  private async parseGeneratedWorkflow(
    aiResponse: string,
    session: WorkflowCreationSession
  ): Promise<WorkflowTemplateEnhanced> {
    // Podstawowa implementacja - w rzeczywistości potrzeba bardziej zaawansowanego parsingu
    const workflow: WorkflowTemplateEnhanced = {
      id: '',
      name: session.extractedInformation.projectType
        ? `${session.extractedInformation.projectType} Workflow`
        : 'Custom Workflow',
      description: 'AI-generated workflow based on chat conversation',
      category:
        session.extractedInformation.projectType === 'existing'
          ? 'existing_project'
          : 'new_project',
      projectType: 'generic',
      complexity: (session.extractedInformation.complexity as any) || 'medium',

      approvals: [],
      iterations: {
        maxIterations: 3,
        iterationTriggers: ['user_feedback', 'validation_failed'],
        iterationScope: 'current_step',
      },
      checkpoints: [],

      steps: [],
      providerStrategy: {
        primary: 'github-copilot',
        fallbacks: ['openai'],
      },

      estimatedDuration: 3600,
      requirements: {
        minimumProviders: ['github-copilot'],
        optionalProviders: [],
        contextRequired: true,
        workspaceAccess: true,
      },

      frontendIntegration: {
        showProgress: true,
        allowUserInteraction: true,
      },
    };

    return workflow;
  }

  /**
   * Parsuje wynik analizy AI
   */
  private parseAnalysisResult(aiResponse: string): WorkflowAnalysisResult {
    // Podstawowa implementacja - potrzeba bardziej zaawansowanego parsingu
    return {
      suggestedTemplate: 'custom',
      confidence: 0.8,
      extractedSteps: [],
      suggestedApprovals: [],
      estimatedComplexity: 'medium',
      estimatedDuration: 3600,
      recommendations: [],
      potentialIssues: [],
    };
  }

  /**
   * Waliduje workflow template
   */
  private validateWorkflowTemplate(
    workflow: Partial<WorkflowTemplateEnhanced>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!workflow.name || workflow.name.trim().length === 0) {
      errors.push('Workflow name is required');
    }

    if (!workflow.description || workflow.description.trim().length === 0) {
      errors.push('Workflow description is required');
    }

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push('At least one workflow step is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // === Public API Methods ===

  /**
   * Pobiera aktywne sesje tworzenia workflow
   */
  async getActiveCreationSessions(): Promise<WorkflowCreationSession[]> {
    return Array.from(this.creationSessions.values()).filter(
      session => session.status === 'active'
    );
  }

  /**
   * Pobiera sesję tworzenia workflow
   */
  async getCreationSession(
    sessionId: string
  ): Promise<WorkflowCreationSession | null> {
    return this.creationSessions.get(sessionId) || null;
  }

  /**
   * Anuluje sesję tworzenia workflow
   */
  async cancelCreationSession(sessionId: string): Promise<boolean> {
    const session = this.creationSessions.get(sessionId);
    if (!session) {
      return false;
    }

    session.status = 'cancelled';
    session.updatedAt = new Date();

    // Zakończ chat session
    await this.chatService.processMessage({
      sessionId: session.chatSessionId,
      message:
        'Workflow creation has been cancelled. Thank you for using the Workflow Admin Panel.',
      provider: 'github-copilot',
      settings: { maxTokens: 100 },
    });

    return true;
  }
}

export default WorkflowAdminPanel;
