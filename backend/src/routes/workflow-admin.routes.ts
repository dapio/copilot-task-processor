/**
 * Workflow Admin API Routes
 * Express routes for managing workflow creation sessions
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import WorkflowAdminPanel from '../services/workflow-admin-panel';
import ChatIntegrationService from '../services/chat-integration.service';
import ContextManager from '../services/context-manager';
// import { EnhancedMultiProviderSystem } from '../services/enhanced-multi-provider-system';

const router = Router();

interface CreateSessionRequest {
  title: string;
  initialPrompt?: string;
  createdBy: string;
}

interface SendMessageRequest {
  sessionId: string;
  message: string;
}

interface GenerateWorkflowRequest {
  sessionId: string;
}

interface FinalizeWorkflowRequest {
  sessionId: string;
  approvals?: {
    approvedBy: string;
    notes?: string;
  };
}

/**
 * Initialize admin panel dependencies
 */
let workflowAdminPanel: WorkflowAdminPanel;

const initializeAdminPanel = async () => {
  if (!workflowAdminPanel) {
    const prisma = new PrismaClient();
    const contextManager = new ContextManager(prisma);
    const chatService = new ChatIntegrationService(prisma, contextManager);

    // Mock provider for now - replace with actual provider system
    const mockProvider = {
      generateText: async () => ({
        success: true as const,
        data: { text: 'Mock response from AI assistant' },
      }),
    };

    workflowAdminPanel = new WorkflowAdminPanel(
      prisma,
      chatService,
      contextManager,
      mockProvider as any
    );
  }
  return workflowAdminPanel;
};

// === Session Management Routes ===

/**
 * POST /api/admin/workflow/sessions
 * Tworzy nową sesję tworzenia workflow
 */
router.post(
  '/sessions',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { title, initialPrompt, createdBy }: CreateSessionRequest =
        req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Title is required',
        });
      }

      if (!createdBy || !createdBy.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Created by user ID is required',
        });
      }

      const adminPanel = await initializeAdminPanel();

      const sessionId = await adminPanel.startWorkflowCreation({
        title,
        initialPrompt,
        createdBy,
      });

      res.json({
        success: true,
        data: { sessionId },
      });
    } catch (error) {
      console.error('Failed to create workflow session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create workflow session',
      });
    }
  }
);

/**
 * GET /api/admin/workflow/sessions
 * Pobiera listę aktywnych sesji tworzenia workflow
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const adminPanel = await initializeAdminPanel();
    const sessions = await adminPanel.getActiveCreationSessions();

    res.json({
      success: true,
      data: { sessions },
    });
  } catch (error) {
    console.error('Failed to get workflow sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workflow sessions',
    });
  }
});

/**
 * GET /api/admin/workflow/sessions/:sessionId
 * Pobiera szczegóły sesji tworzenia workflow
 */
router.get(
  '/sessions/:sessionId',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { sessionId } = req.params;

      const adminPanel = await initializeAdminPanel();
      const session = await adminPanel.getCreationSession(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      res.json({
        success: true,
        data: { session },
      });
    } catch (error) {
      console.error('Failed to get workflow session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow session',
      });
    }
  }
);

/**
 * DELETE /api/admin/workflow/sessions/:sessionId
 * Anuluje sesję tworzenia workflow
 */
router.delete(
  '/sessions/:sessionId',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { sessionId } = req.params;

      const adminPanel = await initializeAdminPanel();
      const success = await adminPanel.cancelCreationSession(sessionId);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: 'Session not found',
        });
      }

      res.json({
        success: true,
        data: { message: 'Session cancelled successfully' },
      });
    } catch (error) {
      console.error('Failed to cancel workflow session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel workflow session',
      });
    }
  }
);

// === Chat Interaction Routes ===

/**
 * POST /api/admin/workflow/chat/message
 * Wysyła wiadomość w sesji tworzenia workflow
 */
router.post(
  '/chat/message',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { sessionId, message }: SendMessageRequest = req.body;

      if (!sessionId || !sessionId.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
        });
      }

      const adminPanel = await initializeAdminPanel();
      const result = await adminPanel.processWorkflowCreationMessage(
        sessionId,
        message
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Failed to process chat message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process chat message',
      });
    }
  }
);

// === Workflow Generation Routes ===

/**
 * POST /api/admin/workflow/generate
 * Generuje workflow na podstawie zebranych informacji
 */
router.post(
  '/generate',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { sessionId }: GenerateWorkflowRequest = req.body;

      if (!sessionId || !sessionId.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      const adminPanel = await initializeAdminPanel();
      const result = await adminPanel.generateWorkflow(sessionId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Failed to generate workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate workflow',
      });
    }
  }
);

/**
 * POST /api/admin/workflow/finalize
 * Zatwierdza i zapisuje utworzony workflow
 */
router.post(
  '/finalize',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { sessionId }: FinalizeWorkflowRequest = req.body;

      if (!sessionId || !sessionId.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Session ID is required',
        });
      }

      const adminPanel = await initializeAdminPanel();
      const result = await adminPanel.finalizeWorkflow(sessionId);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Failed to finalize workflow:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to finalize workflow',
      });
    }
  }
);

// === Health Check ===

/**
 * GET /api/admin/workflow/health
 * Sprawdza stan admin panelu
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const adminPanel = await initializeAdminPanel();
    const activeSessions = await adminPanel.getActiveCreationSessions();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        activeSessions: activeSessions.length,
        timestamp: new Date().toISOString(),
        services: {
          adminPanel: 'running',
          chatService: 'running',
          contextManager: 'running',
          primaryProvider: 'github-copilot',
        },
      },
    });
  } catch (error) {
    console.error('Admin panel health check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Admin panel health check failed',
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        errorDetails: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
});

export default router;
