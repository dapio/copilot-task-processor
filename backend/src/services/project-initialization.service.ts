/**
 * Project Initialization Service
 * Kompleksowa obsługa inicjalizacji projektów z wyborem ścieżki i konfiguracji providerów
 */

import { PrismaClient } from '@prisma/client';
import { Result, ServiceError, createServiceError } from '../utils/result';
import { ChatIntegrationService } from './chat-integration.service';
import { DocumentProcessor } from '../document-processor';

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
    private documentProcessor: DocumentProcessor
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
      const providers: ProviderConfig[] = [
        {
          id: 'github-copilot',
          name: 'GitHub Copilot',
          type: 'copilot',
          enabled: !!process.env.GITHUB_COPILOT_API_KEY,
        },
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

      return { success: true, data: providers };
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

    const agentTypes = [
      'business-analyst',
      'system-architect',
      'frontend-developer',
      'backend-developer',
      'qa-engineer',
      'document-processor',
    ];

    return agentTypes.map(agentType => ({
      agentType,
      providerId: primaryProvider?.id || 'github-copilot',
      fallbackProviders: fallbacks,
    }));
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
        await this.setupProjectResources(project, request, configuredProviders);

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
    request: ProjectInitializationRequest,
    configuredProviders: string[]
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
}
