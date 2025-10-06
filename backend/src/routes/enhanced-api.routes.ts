/**
 * Enhanced API Routes - Refactored Main Router
 * ThinkCode AI Platform - Enterprise-grade API endpoints with modular architecture
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import GitHubCopilotProvider from '../providers/github-copilot.provider';
import ContextManager from '../services/context-manager';
import ChatIntegrationService from '../services/chat-integration.service';
import EnhancedWorkflowController from '../services/enhanced-workflow-controller';

// Handlers
import { ProviderRoutesHandler } from './enhanced-api-routes/handlers/provider.handler';
import { ContextRoutesHandler } from './enhanced-api-routes/handlers/context.handler';
import { ChatRoutesHandler } from './enhanced-api-routes/handlers/chat.handler';
import { WorkflowRoutesHandler } from './enhanced-api-routes/handlers/workflow.handler';

// Types
import { EnhancedApiDependencies } from './enhanced-api-routes/types/api.types';

/**
 * Enhanced API Routes Setup
 * Centralna konfiguracja wszystkich endpointów API z delegacją do handlerów
 */
class EnhancedApiRoutes {
  private router: Router;
  private dependencies: EnhancedApiDependencies;
  
  // Handlers
  private providerHandler!: ProviderRoutesHandler;
  private contextHandler!: ContextRoutesHandler;
  private chatHandler!: ChatRoutesHandler;
  private workflowHandler!: WorkflowRoutesHandler;

  constructor() {
    this.router = Router();
    this.dependencies = this.initializeDependencies();
    this.initializeHandlers();
    this.setupRoutes();
  }

  /**
   * Inicjalizuje zależności systemu
   */
  private initializeDependencies(): EnhancedApiDependencies {
    const prisma = new PrismaClient();
    const contextManager = new ContextManager(prisma);
    const chatService = new ChatIntegrationService(prisma, contextManager);
    const workflowController = new EnhancedWorkflowController(
      prisma,
      contextManager,
      chatService
    );

    // Inicjalizacja GitHub Copilot Provider
    const copilotProvider = new GitHubCopilotProvider({
      apiKey: process.env.GITHUB_COPILOT_API_KEY,
      defaultSystemPrompt:
        'Jesteś GitHub Copilot zintegrowany z ThinkCode AI Platform.',
    });

    // Rejestracja providera w workflow controller
    workflowController.registerProvider('github-copilot', copilotProvider);

    console.log('🚀 Enhanced API dependencies initialized');

    return {
      prisma,
      contextManager,
      chatService,
      workflowController,
      copilotProvider,
    };
  }

  /**
   * Inicjalizuje handlery
   */
  private initializeHandlers(): void {
    this.providerHandler = new ProviderRoutesHandler(this.dependencies);
    this.contextHandler = new ContextRoutesHandler(this.dependencies);
    this.chatHandler = new ChatRoutesHandler(this.dependencies);
    this.workflowHandler = new WorkflowRoutesHandler(this.dependencies);

    console.log('📋 Route handlers initialized');
  }

  /**
   * Konfiguruje wszystkie endpointy API
   */
  private setupRoutes(): void {
    // === Provider Management Routes ===
    this.router.get('/providers', this.providerHandler.getProviders.bind(this.providerHandler));
    this.router.post('/providers/:name/test', this.providerHandler.testProvider.bind(this.providerHandler));
    this.router.get('/providers/:name/health', this.providerHandler.getProviderHealth.bind(this.providerHandler));
    this.router.get('/providers/stats', this.providerHandler.getProviderStats.bind(this.providerHandler));

    // === Context Management Routes ===
    this.router.post('/contexts/project', this.contextHandler.createProjectContext.bind(this.contextHandler));
    this.router.post('/contexts/agent', this.contextHandler.createAgentContext.bind(this.contextHandler));
    this.router.get('/contexts/:contextId', this.contextHandler.getContext.bind(this.contextHandler));
    this.router.delete('/contexts/:contextId', this.contextHandler.deleteContext.bind(this.contextHandler));

    // === Chat Management Routes ===
    this.router.post('/chat/sessions', this.chatHandler.createChatSession.bind(this.chatHandler));
    this.router.post('/chat/sessions/:sessionId/message', this.chatHandler.sendMessage.bind(this.chatHandler));
    this.router.get('/chat/sessions/:sessionId/messages', this.chatHandler.getMessages.bind(this.chatHandler));
    this.router.get('/chat/sessions/:sessionId', this.chatHandler.getSession.bind(this.chatHandler));
    this.router.delete('/chat/sessions/:sessionId', this.chatHandler.deleteSession.bind(this.chatHandler));

    // === Workflow Management Routes ===
    this.router.get('/workflows/templates', this.workflowHandler.getWorkflowTemplates.bind(this.workflowHandler));
    this.router.post('/workflows/templates', this.workflowHandler.createWorkflowTemplate.bind(this.workflowHandler));
    this.router.get('/workflows/templates/:templateId', this.workflowHandler.getWorkflowTemplate.bind(this.workflowHandler));
    this.router.post('/workflows/execute', this.workflowHandler.executeWorkflow.bind(this.workflowHandler));
    this.router.get('/workflows/executions/:executionId', this.workflowHandler.getWorkflowExecution.bind(this.workflowHandler));
    this.router.post('/workflows/executions/:executionId/pause', this.workflowHandler.pauseWorkflowExecution.bind(this.workflowHandler));
    this.router.get('/workflows/stats', this.workflowHandler.getWorkflowStats.bind(this.workflowHandler));

    // === Health Check Route ===
    this.router.get('/health', async (req, res) => {
      try {
        const systemStats = await this.dependencies.workflowController.getSystemStats();
        
        res.json({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            ...systemStats,
          },
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Health check failed',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      }
    });

    console.log('🛣️ All Enhanced API routes configured');
  }

  /**
   * Pobiera skonfigurowany router
   */
  getRouter(): Router {
    return this.router;
  }
}

// Tworzy i konfiguruje Enhanced API Routes
const enhancedApiRoutes = new EnhancedApiRoutes();
export default enhancedApiRoutes.getRouter();