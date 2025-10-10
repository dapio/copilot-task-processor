/**
 * Project Initialization Service
 * Kompleksowa obsługa inicjalizacji projektów z wyborem ścieżki i konfiguracji providerów
 */

import { PrismaClient } from '@prisma/client';
import { Result, ServiceError, createServiceError } from '../utils/result';
import { ChatIntegrationService } from './chat-integration.service';
import { RealDocumentAnalysisService } from './real-document-analysis.service';
import { RealGitHubCopilotIntegration } from './real-github-copilot.service';

export interface ProjectType {
  id: string;
  name: string;
  description: string;
  defaultProviders: string[];
  requiredConfig: string[];
}

export interface RepositoryConfig {
  provider: 'github' | 'bitbucket' | 'azure-repos';
  url: string;
  token: string;
  branch?: string;
  webhookSecret?: string;
}

export interface ProviderConfig {
  id: string;
  name: string;
  type: 'copilot' | 'openai' | 'anthropic' | 'azure-openai';
  apiKey?: string;
  endpoint?: string;
  model?: string;
  enabled: boolean;
}

export interface AgentProviderAssignment {
  agentType: string;
  providerId: string;
  fallbackProviders: string[];
}

export interface ProjectInitializationRequest {
  name: string;
  description: string;
  type: 'new-application' | 'existing-repository';

  // Repository configuration (dla existing-repository)
  repository?: RepositoryConfig;

  // Provider configuration
  providers: ProviderConfig[];
  agentAssignments: AgentProviderAssignment[];

  // Initial files
  files?: any[];

  // Project settings
  settings: {
    enableChat: boolean;
    enableRealTimeUpdates: boolean;
    autoCreateTasks: boolean;
    analysisDepth: 'shallow' | 'medium' | 'deep';
  };
}

export interface ProjectInitializationResult {
  projectId: string;
  chatSessionId: string;
  workflowId?: string;
  configuredProviders: string[];
  initialTasks: any[];
  status: 'initialized' | 'analyzing' | 'ready';
}

export class ProjectInitializationService {
  constructor(
    private prisma: PrismaClient,
    private chatService: ChatIntegrationService,
    private documentAnalysisService: RealDocumentAnalysisService
  ) {}

  /**
   * Pobierz dostępne typy projektów
   */
  async getProjectTypes(): Promise<Result<ProjectType[], ServiceError>> {
    try {
      const types: ProjectType[] = [
        {
          id: 'web-app',
          name: 'Aplikacja Web',
          description: 'Single Page Application lub Full-stack Web App',
          defaultProviders: ['copilot'],
          requiredConfig: ['frontend-framework', 'backend-framework'],
        },
        {
          id: 'mobile-app',
          name: 'Aplikacja Mobilna',
          description: 'React Native, Flutter lub natywna aplikacja mobilna',
          defaultProviders: ['copilot'],
          requiredConfig: ['platform', 'framework'],
        },
        {
          id: 'api-service',
          name: 'Serwis API',
          description: 'REST API, GraphQL lub microservice',
          defaultProviders: ['copilot'],
          requiredConfig: ['api-type', 'database'],
        },
        {
          id: 'desktop-app',
          name: 'Aplikacja Desktop',
          description: 'Electron, .NET WinForms/WPF, lub natywna aplikacja',
          defaultProviders: ['copilot'],
          requiredConfig: ['platform', 'framework'],
        },
        {
          id: 'data-science',
          name: 'Projekt Data Science',
          description: 'ML/AI projekt, analiza danych, jupyter notebooks',
          defaultProviders: ['copilot', 'openai'],
          requiredConfig: ['ml-framework', 'data-source'],
        },
        {
          id: 'legacy-migration',
          name: 'Migracja Legacy',
          description: 'Modernizacja istniejącego systemu',
          defaultProviders: ['copilot'],
          requiredConfig: ['current-tech', 'target-tech'],
        },
      ];

      return { success: true, data: types };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'PROJECT_TYPES_FETCH_ERROR',
          'Failed to fetch project types',
          error as Record<string, any>
        ),
      };
    }
  }

  /**
   * Pobierz dostępnych providerów AI
   */
  async getAvailableProviders(): Promise<
    Result<ProviderConfig[], ServiceError>
  > {
    try {
      // Start with base providers
      const baseProviders: ProviderConfig[] = [
        {
          id: 'openai-gpt4',
          name: 'OpenAI GPT-4',
          type: 'openai',
          model: 'gpt-4',
          enabled: !!process.env.OPENAI_API_KEY,
        },
        {
          id: 'openai-gpt35',
          name: 'OpenAI GPT-3.5',
          type: 'openai',
          model: 'gpt-3.5-turbo',
          enabled: !!process.env.OPENAI_API_KEY,
        },
        {
          id: 'azure-openai',
          name: 'Azure OpenAI',
          type: 'azure-openai',
          enabled: !!(
            process.env.AZURE_OPENAI_API_KEY &&
            process.env.AZURE_OPENAI_ENDPOINT
          ),
        },
      ];

      // Try to integrate real GitHub Copilot provider
      try {
        const githubToken = process.env.GITHUB_TOKEN;
        if (githubToken) {
          const realCopilotIntegration = new RealGitHubCopilotIntegration(
            githubToken
          );
          const enhancedResult = await realCopilotIntegration.enhanceProviders(
            baseProviders
          );

          if (enhancedResult.success) {
            console.info(
              '✅ Real GitHub Copilot provider integrated successfully'
            );
            return { success: true, data: enhancedResult.data };
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to integrate GitHub Copilot provider:', error);
      }

      // Return providers with Groq as primary (REAL, NOT MOCK)
      const providersWithGroq: ProviderConfig[] = [
        {
          id: 'groq',
          name: 'Groq (Darmowy, Szybki)',
          type: 'groq' as any,
          enabled: true,
        },
        ...baseProviders,
      ];

      return { success: true, data: providersWithGroq };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'PROVIDERS_FETCH_ERROR',
          'Failed to fetch available providers',
          error as Record<string, any>
        ),
      };
    }
  }

  /**
   * Pobierz domyślne przypisania agentów do providerów
   */
  getDefaultAgentAssignments(
    providers: ProviderConfig[]
  ): AgentProviderAssignment[] {
    const enabledProviders = providers.filter(p => p.enabled);
    const primaryProvider =
      enabledProviders.find(p => p.type === 'copilot') || enabledProviders[0];
    const fallbacks = enabledProviders
      .filter(p => p.id !== primaryProvider?.id)
      .map(p => p.id);

    // Enhanced assignments with real GitHub Copilot integration
    const baseAssignments = [
      'project-manager',
      'business-analyst',
      'system-architect',
      'frontend-developer',
      'backend-developer',
      'qa-engineer',
      'document-processor',
    ].map(agentType => ({
      agentType,
      providerId: primaryProvider?.id || 'github-copilot',
      fallbackProviders: fallbacks,
    }));

    // Try to enhance with real GitHub Copilot assignments
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken && primaryProvider?.id === 'real-github-copilot') {
        const realCopilotIntegration = new RealGitHubCopilotIntegration(
          githubToken
        );
        const enhancedAssignments =
          realCopilotIntegration.enhanceAgentAssignments(baseAssignments);
        console.info('✅ Enhanced agent assignments with real GitHub Copilot');
        return enhancedAssignments;
      }
    } catch (error) {
      console.warn(
        '⚠️ Failed to enhance agent assignments with real GitHub Copilot:',
        error
      );
    }

    return baseAssignments;
  }

  /**
   * Inicjalizuj nowy projekt
   */
  async initializeProject(
    request: ProjectInitializationRequest
  ): Promise<Result<ProjectInitializationResult, ServiceError>> {
    try {
      console.log('🎯 Initializing new project:', request.name);

      // 1. Utwórz projekt w bazie danych
      const project = await this.createProjectRecord(request);
      console.log('✅ Project created with ID:', project.id);

      // 2. Skonfiguruj providery AI
      const configuredProviders = await this.configureProviders(
        project.id,
        request.providers
      );

      // 3. Utwórz sesję czatu i przetwórz pliki
      const { chatSessionId, workflowId, initialTasks } =
        await this.setupProjectResources(project, request);

      const result: ProjectInitializationResult = {
        projectId: project.id,
        chatSessionId,
        workflowId,
        configuredProviders,
        initialTasks,
        status: workflowId ? 'analyzing' : 'ready',
      };

      console.log('🎉 Project initialization complete:', result);
      return { success: true, data: result };
    } catch (error) {
      console.error('❌ Project initialization failed:', error);
      return {
        success: false,
        error: createServiceError(
          'PROJECT_INITIALIZATION_ERROR',
          'Failed to initialize project',
          error as Record<string, any>
        ),
      };
    }
  }

  /**
   * Utwórz rekord projektu w bazie danych
   */
  private async createProjectRecord(request: ProjectInitializationRequest) {
    return await this.prisma.project.create({
      data: {
        name: request.name,
        description: request.description,
        type: request.type,
        status: 'active',
        config: {
          repository: request.repository as any,
          providers: request.providers as any,
          agentAssignments: request.agentAssignments as any,
          settings: request.settings as any,
        } as any,
      },
    });
  }

  /**
   * Skonfiguruj zasoby projektu (chat, pliki, zadania)
   */
  private async setupProjectResources(
    project: any,
    request: ProjectInitializationRequest
  ) {
    let chatSessionId = '';
    let workflowId: string | undefined;
    let initialTasks: any[] = [];

    // Utwórz sesję czatu jeśli włączona
    if (request.settings.enableChat) {
      const chatResult = await this.chatService.createSession(
        `session-${project.id}`,
        'project'
      );

      if (chatResult.success) {
        chatSessionId = chatResult.data.id;
        console.log('✅ Chat session created:', chatSessionId);
      }
    }

    // Przetwórz załączone pliki
    if (request.files && request.files.length > 0) {
      console.log('📄 Processing uploaded files:', request.files.length);

      await this.processUploadedFiles(project.id, request.files);

      if (request.settings.autoCreateTasks) {
        const analysisTask = await this.createDocumentAnalysisTask(
          project.id,
          request.files,
          chatSessionId
        );

        if (analysisTask.success) {
          initialTasks.push(analysisTask.data);
          workflowId = analysisTask.data.workflowId;
        }
      }
    }

    // Wyślij wiadomość powitalną
    if (chatSessionId) {
      await this.sendWelcomeMessage(chatSessionId, project, request);
    }

    return { chatSessionId, workflowId, initialTasks };
  }

  /**
   * Skonfiguruj providerów AI
   */
  private async configureProviders(
    projectId: string,
    providers: ProviderConfig[]
  ): Promise<string[]> {
    const configured: string[] = [];

    for (const provider of providers.filter(p => p.enabled)) {
      try {
        // Tutaj możesz dodać logikę weryfikacji połączenia z providerem
        console.log(`⚙️ Configuring provider: ${provider.name}`);
        configured.push(provider.id);
      } catch (error) {
        console.warn(
          `⚠️ Failed to configure provider ${provider.name}:`,
          error
        );
      }
    }

    return configured;
  }

  /**
   * Przetwórz uploade pliki
   */
  private async processUploadedFiles(
    projectId: string,
    files: any[]
  ): Promise<void> {
    for (const file of files) {
      try {
        // Zapisz informacje o pliku w bazie danych
        await this.prisma.document.create({
          data: {
            name: file.filename || file.originalname,
            originalName: file.originalname,
            path: file.path,
            size: file.size,
            mimeType: file.mimetype,
            status: 'uploaded',
            metadata: {
              projectId,
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        console.log('📄 File processed:', file.originalname);
      } catch (error) {
        console.error('❌ Failed to process file:', file.originalname, error);
      }
    }
  }

  /**
   * Utwórz zadanie analizy dokumentów
   */
  private async createDocumentAnalysisTask(
    projectId: string,
    files: any[],
    chatSessionId: string
  ): Promise<Result<any, ServiceError>> {
    try {
      // Utwórz zadanie w bazie danych
      const task = await this.prisma.task.create({
        data: {
          title: 'Analiza załączonych dokumentów',
          description: `Analiza ${files.length} dokumentów projektu`,
          status: 'pending',
          priority: 'high',
          category: 'analysis',
          projectId,
          assignedAgentId: null, // Będzie przypisane przez workflow
          metadata: {
            files: files.map(f => f.originalname),
            chatSessionId,
            taskType: 'document-analysis',
          },
        },
      });

      // Wyślij wiadomość do chatu o rozpoczęciu analizy
      if (chatSessionId) {
        await this.chatService.processMessage({
          sessionId: chatSessionId,
          message: `📄 **Rozpoczynam analizę dokumentów**\n\nPrzetworzy ${
            files.length
          } plików:\n${files
            .map(f => `• ${f.originalname}`)
            .join(
              '\n'
            )}\n\nAgent analizy dokumentów zostanie automatycznie przypisany do tego zadania.`,
          provider: 'github-copilot',
          agentId: 'document-processor',
        });
      }

      console.log('✅ Document analysis task created:', task.id);

      return {
        success: true,
        data: {
          taskId: task.id,
          workflowId: `workflow-${task.id}`,
          status: 'pending',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'TASK_CREATION_ERROR',
          'Failed to create document analysis task',
          error as Record<string, any>
        ),
      };
    }
  }

  /**
   * Wyślij wiadomość powitalną w chat
   */
  private async sendWelcomeMessage(
    chatSessionId: string,
    project: any,
    request: ProjectInitializationRequest
  ): Promise<void> {
    try {
      const welcomeMessage = `🎉 **Projekt "${project.name}" został utworzony!**

**Typ projektu:** ${this.getProjectTypeName(request.type)}
**Skonfigurowane providery:** ${request.providers
        .filter(p => p.enabled)
        .map(p => p.name)
        .join(', ')}
**Agenci gotowi do pracy:** ${request.agentAssignments.length}

${
  request.files && request.files.length > 0
    ? `📄 **Załączone dokumenty (${request.files.length}):**\n${request.files
        .map(f => `• ${f.originalname}`)
        .join('\n')}\n\n`
    : ''
}**Co mogę dla Ciebie zrobić?**
• Analizować dokumenty i wymagania
• Generować zadania i user stories  
• Planować architekturę systemu
• Pomagać w rozwoju projektu
• Odpowiadać na pytania techniczne

Napisz do mnie, jeśli masz pytania lub chcesz rozpocząć pracę nad konkretnym zadaniem!`;

      await this.chatService.processMessage({
        sessionId: chatSessionId,
        message: welcomeMessage,
        provider: 'github-copilot',
        agentId: 'assistant',
      });

      console.log('✅ Welcome message sent to chat');
    } catch (error) {
      console.error('❌ Failed to send welcome message:', error);
    }
  }

  private getProjectTypeName(type: string): string {
    const typeMap: Record<string, string> = {
      'web-app': 'Aplikacja Web',
      'mobile-app': 'Aplikacja Mobilna',
      'api-service': 'Serwis API',
      'desktop-app': 'Aplikacja Desktop',
      'data-science': 'Data Science',
      'legacy-migration': 'Migracja Legacy',
      'new-application': 'Nowa Aplikacja',
      'existing-repository': 'Istniejące Repozytorium',
    };
    return typeMap[type] || type;
  }

  // ================================
  // NEW WORKFLOW STEP MANAGEMENT
  // ================================

  /**
   * Get project with full context including files and workflow status
   */
  async getProjectWithContext(
    projectId: string
  ): Promise<Result<any, ServiceError>> {
    try {
      const project = await this.fetchProjectWithRelations(projectId);
      if (!project) {
        return {
          success: false,
          error: createServiceError('Project not found', 'NOT_FOUND'),
        };
      }

      const projectMetrics = await this.getProjectMetrics(projectId);
      const fileSummary = await this.getProjectFileSummary(projectId);
      const state = this.determineProjectState(
        project,
        projectMetrics.hasFiles
      );

      return {
        success: true,
        data: {
          project,
          ...projectMetrics,
          fileSummary: fileSummary.success ? fileSummary.data : null,
          state,
          currentWorkflow: project.workflowRuns[0] || null,
          recentFiles: project.files,
        },
      };
    } catch (error) {
      console.error('Error fetching project with context:', error);
      return {
        success: false,
        error: createServiceError(
          error instanceof Error
            ? error.message
            : 'Failed to fetch project context',
          'INTERNAL_ERROR'
        ),
      };
    }
  }

  private async fetchProjectWithRelations(projectId: string) {
    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        files: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        workflows: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            steps: {
              orderBy: { stepNumber: 'asc' },
            },
          },
        },
        workflowRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            stepApprovals: {
              orderBy: { createdAt: 'asc' },
              include: {
                _count: {
                  select: {
                    conversations: true,
                    tasks: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  private async getProjectMetrics(projectId: string) {
    const inputFileCount =
      (await this.prisma.projectFile?.count({
        where: {
          projectId,
          category: 'input',
        },
      })) || 0;

    return {
      hasFiles: inputFileCount > 0,
      inputFileCount,
    };
  }

  /**
   * Get project file summary
   */
  private async getProjectFileSummary(projectId: string) {
    try {
      const summary =
        (await this.prisma.projectFile?.groupBy({
          by: ['category', 'status'],
          where: { projectId },
          _count: true,
          _sum: { size: true },
        })) || [];

      const totalFiles =
        (await this.prisma.projectFile?.count({
          where: { projectId },
        })) || 0;

      const totalSize = await this.prisma.projectFile?.aggregate({
        where: { projectId },
        _sum: { size: true },
      });

      return {
        success: true,
        data: {
          summary,
          totalFiles,
          totalSize: totalSize?._sum.size || 0,
        },
      };
    } catch (error) {
      console.error('Error getting project file summary:', error);
      return {
        success: false,
        error: createServiceError(
          'Failed to get file summary',
          'INTERNAL_ERROR'
        ),
      };
    }
  }

  /**
   * Determine project state for UI routing
   */
  private determineProjectState(project: any, hasFiles: boolean): string {
    if (!hasFiles) {
      return 'upload_required'; // Show file upload screen
    }

    if (!project.workflowRuns || project.workflowRuns.length === 0) {
      return 'workflow_setup'; // Show workflow selection
    }

    const currentWorkflow = project.workflowRuns[0];

    if (currentWorkflow.status === 'pending') {
      return 'workflow_ready'; // Ready to start workflow
    }

    if (currentWorkflow.status === 'running') {
      return 'workflow_active'; // Show active workflow dashboard
    }

    if (currentWorkflow.status === 'completed') {
      return 'workflow_completed'; // Show results
    }

    return 'dashboard'; // Default dashboard view
  }

  /**
   * Check if project can proceed to dashboard (skip upload screen)
   */
  async canProceedToDashboard(projectId: string): Promise<
    Result<
      {
        canProceed: boolean;
        state: string;
        hasFiles: boolean;
        nextStep: { action: string; message: string };
      },
      ServiceError
    >
  > {
    try {
      const contextResult = await this.getProjectWithContext(projectId);

      if (!contextResult.success) {
        return contextResult as any;
      }

      const { hasFiles, state } = contextResult.data;

      return {
        success: true,
        data: {
          canProceed: hasFiles && state !== 'upload_required',
          state,
          hasFiles,
          nextStep: this.getNextStep(state),
        },
      };
    } catch (error) {
      console.error('Error checking dashboard eligibility:', error);
      return {
        success: false,
        error: createServiceError(
          error instanceof Error
            ? error.message
            : 'Failed to check dashboard eligibility',
          'INTERNAL_ERROR'
        ),
      };
    }
  }

  /**
   * Get next step recommendation based on project state
   */
  private getNextStep(state: string): { action: string; message: string } {
    switch (state) {
      case 'upload_required':
        return {
          action: 'upload_files',
          message: 'Upload project files to continue',
        };
      case 'workflow_setup':
        return {
          action: 'setup_workflow',
          message: 'Set up workflow to begin processing',
        };
      case 'workflow_ready':
        return {
          action: 'start_workflow',
          message: 'Start workflow processing',
        };
      case 'workflow_active':
        return {
          action: 'continue_workflow',
          message: 'Continue with active workflow',
        };
      case 'workflow_completed':
        return { action: 'view_results', message: 'Review workflow results' };
      default:
        return { action: 'dashboard', message: 'Proceed to project dashboard' };
    }
  }
}
