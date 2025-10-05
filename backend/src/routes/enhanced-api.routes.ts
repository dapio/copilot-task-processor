/**
 * Enhanced API Routes - Rozszerzone API dla systemu providerów i workflow
 * ThinkCode AI Platform - Enterprise-grade API endpoints
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import GitHubCopilotProvider from '../providers/github-copilot.provider';
import ContextManager from '../services/context-manager';
import ChatIntegrationService from '../services/chat-integration.service';
import EnhancedWorkflowController from '../services/enhanced-workflow-controller';

const router = Router();
const prisma = new PrismaClient();

// Inicializacja serwisów
const contextManager = new ContextManager(prisma);
const chatService = new ChatIntegrationService(prisma, contextManager);
const workflowController = new EnhancedWorkflowController(
  prisma,
  contextManager,
  chatService
);

// Rejestracja providerów
const copilotProvider = new GitHubCopilotProvider({
  apiKey: process.env.GITHUB_COPILOT_API_KEY,
  defaultSystemPrompt:
    'You are GitHub Copilot integrated with ThinkCode AI Platform.',
});

workflowController.registerProvider('github-copilot', copilotProvider);

// Validation schemas
const createContextSchema = z.object({
  name: z.string().min(1),
  projectId: z.string().optional(),
  agentId: z.string().optional(),
  systemPrompt: z.string().optional(),
  parentContextId: z.string().optional(),
  workspace: z
    .object({
      rootPath: z.string().optional(),
      includePatterns: z.array(z.string()).optional(),
      excludePatterns: z.array(z.string()).optional(),
    })
    .optional(),
});

const chatMessageSchema = z.object({
  message: z.string().min(1),
  contextId: z.string().optional(),
  provider: z.string().optional(),
  agentId: z.string().optional(),
  attachments: z
    .array(
      z.object({
        type: z.enum(['file', 'image', 'code', 'workspace']),
        name: z.string(),
        content: z.string(),
      })
    )
    .optional(),
  settings: z
    .object({
      includeContext: z.boolean().optional(),
      includeWorkspace: z.boolean().optional(),
      maxContextMessages: z.number().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxTokens: z.number().min(1).max(8000).optional(),
    })
    .optional(),
});

const workflowExecutionSchema = z.object({
  templateId: z.string().optional(),
  contextId: z.string(),
  contextType: z.enum(['project', 'agent']),
  projectId: z.string().optional(),
  parameters: z.record(z.any()).optional(),
  providerOverrides: z.record(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  enableChat: z.boolean().optional(),
  customSteps: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        type: z.enum([
          'ai_generation',
          'human_review',
          'data_processing',
          'integration',
          'validation',
        ]),
        provider: z.string().optional(),
        dependencies: z.array(z.string()),
        configuration: z.record(z.any()),
      })
    )
    .optional(),
});

// === Provider Management ===

/**
 * GET /api/enhanced/providers
 * Pobiera listę dostępnych providerów z ich statusem
 */
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const providers = await workflowController.getAvailableProviders();

    res.json({
      success: true,
      data: {
        providers,
        total: providers.length,
        healthy: providers.filter(p => p.status === 'healthy').length,
        degraded: providers.filter(p => p.status === 'degraded').length,
        unhealthy: providers.filter(p => p.status === 'unhealthy').length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get providers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/enhanced/providers/:name/test
 * Testuje konkretny provider
 */
router.post('/providers/:name/test', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { prompt = 'Test connection' } = req.body;

    // Pobierz provider z GitHub Copilot provider instance
    if (name === 'github-copilot') {
      const testResult = await copilotProvider.generateText(prompt, {
        maxTokens: 50,
        temperature: 0.7,
      });

      const healthResult = await copilotProvider.healthCheck();

      res.json({
        success: true,
        data: {
          provider: name,
          testResult: testResult.success,
          response: testResult.success
            ? testResult.data.text
            : testResult.error.message,
          health: healthResult.success ? healthResult.data : healthResult.error,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Provider not found',
        message: `Provider ${name} is not registered`,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Provider test failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === Context Management ===

/**
 * POST /api/enhanced/contexts/project
 * Tworzy nowy kontekst projektu
 */
router.post('/contexts/project', async (req: Request, res: Response) => {
  try {
    const validatedData = createContextSchema.parse(req.body);

    if (!validatedData.projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required for project context',
      });
    }

    const contextId = await contextManager.createProjectContext({
      projectId: validatedData.projectId,
      name: validatedData.name,
      systemPrompt: validatedData.systemPrompt,
      workspace: validatedData.workspace,
      createdBy: req.headers['x-user-id'] as string,
    });

    res.status(201).json({
      success: true,
      data: {
        contextId,
        type: 'project',
        name: validatedData.name,
        projectId: validatedData.projectId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create project context',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/enhanced/contexts/agent
 * Tworzy nowy kontekst agenta
 */
router.post('/contexts/agent', async (req: Request, res: Response) => {
  try {
    const validatedData = createContextSchema.parse(req.body);

    if (!validatedData.agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required for agent context',
      });
    }

    const contextId = await contextManager.createAgentContext({
      agentId: validatedData.agentId,
      parentProjectContextId: validatedData.parentContextId,
      name: validatedData.name,
      systemPrompt: validatedData.systemPrompt,
    });

    res.status(201).json({
      success: true,
      data: {
        contextId,
        type: 'agent',
        name: validatedData.name,
        agentId: validatedData.agentId,
        parentProjectContextId: validatedData.parentContextId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create agent context',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/enhanced/contexts/:contextId
 * Pobiera szczegóły kontekstu
 */
router.get('/contexts/:contextId', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;
    const { type = 'auto' } = req.query;

    let context = null;
    let contextType = type;

    if (type === 'project' || type === 'auto') {
      context = await contextManager.getProjectContext(contextId);
      if (context) contextType = 'project';
    }

    if (!context && (type === 'agent' || type === 'auto')) {
      context = await contextManager.getAgentContext(contextId);
      if (context) contextType = 'agent';
    }

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Context not found',
        message: `Context ${contextId} not found`,
      });
    }

    res.json({
      success: true,
      data: {
        context,
        type: contextType,
        contextId,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get context',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/enhanced/contexts/:contextId/full
 * Pobiera pełny kontekst agenta (z projektem)
 */
router.get('/contexts/:contextId/full', async (req: Request, res: Response) => {
  try {
    const { contextId } = req.params;

    const fullContext = await contextManager.getFullAgentContext(contextId);

    if (!fullContext) {
      return res.status(404).json({
        success: false,
        error: 'Agent context not found',
        message: `Agent context ${contextId} not found`,
      });
    }

    res.json({
      success: true,
      data: fullContext,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get full context',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === Chat Integration ===

/**
 * POST /api/enhanced/chat/sessions
 * Tworzy nową sesję chatu
 */
router.post('/chat/sessions', async (req: Request, res: Response) => {
  try {
    const { contextId, contextType, title, activeProviders } = req.body;

    if (!contextId || !contextType) {
      return res.status(400).json({
        success: false,
        error: 'contextId and contextType are required',
      });
    }

    const sessionId = await chatService.createChatSession({
      contextId,
      contextType,
      title: title || `Chat Session - ${new Date().toISOString()}`,
      activeProviders: activeProviders || ['github-copilot'],
    });

    res.status(201).json({
      success: true,
      data: {
        sessionId,
        contextId,
        contextType,
        title,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create chat session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/enhanced/chat/sessions/:sessionId/message
 * Wysyła wiadomość w sesji chatu
 */
router.post(
  '/chat/sessions/:sessionId/message',
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const validatedData = chatMessageSchema.parse(req.body);

      // Dodaj ID do attachments jeśli istnieją
      const attachments = validatedData.attachments?.map(att => ({
        ...att,
        id: `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }));

      const result = await chatService.processMessage({
        sessionId,
        message: validatedData.message,
        contextId: validatedData.contextId,
        provider: validatedData.provider,
        agentId: validatedData.agentId,
        attachments,
        settings: validatedData.settings,
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.message,
          code: result.error.code,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
      }

      res.status(500).json({
        success: false,
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/enhanced/chat/sessions/:sessionId/history
 * Pobiera historię wiadomości w sesji
 */
router.get(
  '/chat/sessions/:sessionId/history',
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { limit, offset, fromMessageId, includeSystem } = req.query;

      const messages = await chatService.getMessageHistory(sessionId, {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        fromMessageId: fromMessageId as string,
        includeSystem: includeSystem === 'true',
      });

      res.json({
        success: true,
        data: {
          messages,
          sessionId,
          total: messages.length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get message history',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /api/enhanced/chat/sessions/:sessionId/stats
 * Pobiera statystyki sesji chatu
 */
router.get(
  '/chat/sessions/:sessionId/stats',
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;

      const stats = await chatService.getSessionStats(sessionId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get session stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// === Workflow Management ===

/**
 * GET /api/enhanced/workflows/templates
 * Pobiera listę dostępnych template'ów workflow
 */
router.get('/workflows/templates', async (req: Request, res: Response) => {
  try {
    const { category, complexity } = req.query;

    const templates = workflowController.listWorkflowTemplates({
      category: category as any,
      complexity: complexity as any,
    });

    res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
        categories: [...new Set(templates.map(t => t.category))],
        complexities: [...new Set(templates.map(t => t.complexity))],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow templates',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/enhanced/workflows/execute
 * Wykonuje workflow z template lub custom
 */
router.post('/workflows/execute', async (req: Request, res: Response) => {
  try {
    const validatedData = workflowExecutionSchema.parse(req.body);

    let result;

    if (validatedData.templateId) {
      // Wykonaj z template
      result = await workflowController.executeWorkflowFromTemplate({
        templateId: validatedData.templateId,
        contextId: validatedData.contextId,
        contextType: validatedData.contextType,
        projectId: validatedData.projectId,
        parameters: validatedData.parameters,
        providerOverrides: validatedData.providerOverrides,
        priority: validatedData.priority,
        triggeredBy: req.headers['x-user-id'] as string,
      });
    } else if (validatedData.customSteps) {
      // Wykonaj custom workflow
      const customSteps = validatedData.customSteps.map(step => ({
        ...step,
        maxRetries: 2, // Domyślna wartość dla custom steps
      }));

      result = await workflowController.executeCustomWorkflow({
        name: `Custom Workflow - ${new Date().toISOString()}`,
        steps: customSteps,
        contextId: validatedData.contextId,
        contextType: validatedData.contextType,
        providerStrategy: {
          primary: 'github-copilot',
          fallbacks: ['openai'],
          contextAffinity: true,
        },
        projectId: validatedData.projectId,
        priority: validatedData.priority,
        triggeredBy: req.headers['x-user-id'] as string,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either templateId or customSteps must be provided',
      });
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.message,
        code: result.error.code,
      });
    }

    // Stwórz chat session jeśli wymagane
    let chatSessionId;
    if (validatedData.enableChat) {
      chatSessionId = await workflowController.createWorkflowSession({
        workflowExecutionId: result.data,
        enableChat: true,
        title: `Workflow Chat - ${result.data}`,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        executionId: result.data,
        chatSessionId,
        status: 'running',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to execute workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/enhanced/workflows/:executionId/status
 * Pobiera status wykonania workflow
 */
router.get(
  '/workflows/:executionId/status',
  async (req: Request, res: Response) => {
    try {
      const { executionId } = req.params;

      const execution =
        await workflowController.getExecutionStatus(executionId);

      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Workflow execution not found',
        });
      }

      const steps = await workflowController.getExecutionSteps(executionId);

      res.json({
        success: true,
        data: {
          execution,
          steps,
          totalSteps: steps.length,
          completedSteps: steps.filter(s => s.status === 'completed').length,
          failedSteps: steps.filter(s => s.status === 'failed').length,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow status',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /api/enhanced/workflows/:executionId/control
 * Kontroluje wykonanie workflow (pause/resume/cancel)
 */
router.post(
  '/workflows/:executionId/control',
  async (req: Request, res: Response) => {
    try {
      const { executionId } = req.params;
      const { action } = req.body;

      if (!['pause', 'resume', 'cancel'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid action. Must be pause, resume, or cancel',
        });
      }

      let result = false;

      switch (action) {
        case 'pause':
          result = await workflowController.pauseExecution(executionId);
          break;
        case 'resume':
          result = await workflowController.resumeExecution(executionId);
          break;
        case 'cancel':
          result = await workflowController.cancelExecution(executionId);
          break;
      }

      if (!result) {
        return res.status(400).json({
          success: false,
          error: `Failed to ${action} workflow execution`,
        });
      }

      res.json({
        success: true,
        data: {
          executionId,
          action,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to ${req.body.action} workflow`,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// === Health Check ===

/**
 * GET /api/enhanced/health
 * Sprawdza stan całego systemu
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const providers = await workflowController.getAvailableProviders();
    const healthyProviders = providers.filter(p => p.status === 'healthy');

    const systemHealth = {
      status: healthyProviders.length > 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        providers: {
          total: providers.length,
          healthy: healthyProviders.length,
          details: providers,
        },
        contextManager: {
          status: 'healthy',
          message: 'Context manager operational',
        },
        chatService: {
          status: 'healthy',
          message: 'Chat integration service operational',
        },
        workflowController: {
          status: 'healthy',
          message: 'Enhanced workflow controller operational',
        },
      },
      features: {
        multiProviderSupport: true,
        contextManagement: true,
        chatIntegration: true,
        workflowOrchestration: true,
        githubCopilotPrimary: true,
      },
    };

    const statusCode = systemHealth.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: systemHealth,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
