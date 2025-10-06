/**
 * Workflow Assistant API Routes
 * Endpoints for workflow assistant agent functionality
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import WorkflowAssistantAgent, {
  WorkflowContext,
} from '../agents/workflow-assistant.agent';
import { MLProviderFactory } from '../providers/ml-provider-factory';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize assistant agent
let assistantAgent: WorkflowAssistantAgent;

async function getAssistantAgent(): Promise<WorkflowAssistantAgent> {
  if (!assistantAgent) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    const mlProvider = await MLProviderFactory.createProvider('openai', {
      name: 'openai-main',
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      enabled: true,
      priority: 1,
      retryAttempts: 3,
      timeoutMs: 30000,
    });

    assistantAgent = new WorkflowAssistantAgent(prisma, mlProvider);
  }
  return assistantAgent;
}

/**
 * POST /api/assistant/start
 * Rozpoczyna asystowanie w workflow
 */
router.post(
  '/start',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const workflowContext: WorkflowContext = req.body;

      // Validate required fields
      if (!workflowContext.executionId || !workflowContext.workflowId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: executionId, workflowId',
        });
      }

      const agent = await getAssistantAgent();
      const result = await agent.startAssisting(workflowContext);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error.message,
        });
      }

      res.json({
        success: true,
        data: {
          conversation: result.data,
          assistantId: 'workflow-assistant-001',
        },
      });
    } catch (error) {
      console.error('Assistant start error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start assistant',
      });
    }
  }
);

/**
 * POST /api/assistant/ask
 * Zadaje pytanie asystentowi
 */
router.post(
  '/ask',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { executionId, message, workflowContext } = req.body;

      if (!executionId || !message) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: executionId, message',
        });
      }

      const agent = await getAssistantAgent();
      const result = await agent.processUserQuestion(
        executionId,
        message,
        workflowContext
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Assistant question error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process question',
      });
    }
  }
);

/**
 * GET /api/assistant/conversation/:executionId
 * Pobiera konwersację dla workflow execution
 */
router.get('/conversation/:executionId', async (req, res) => {
  try {
    const agent = await getAssistantAgent();
    const conversation = await agent.getConversation();

    res.json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation',
    });
  }
});

/**
 * POST /api/assistant/monitor
 * Monitoruje postęp workflow i zwraca rekomendacje
 */
router.post(
  '/monitor',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const workflowContext: WorkflowContext = req.body;

      if (!workflowContext.executionId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required field: executionId',
        });
      }

      const agent = await getAssistantAgent();
      const result = await agent.monitorWorkflowProgress(workflowContext);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Monitor workflow error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to monitor workflow',
      });
    }
  }
);

/**
 * POST /api/assistant/decision
 * Pomaga w podejmowaniu decyzji
 */
router.post(
  '/decision',
  async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const { workflowContext, decisionContext } = req.body;

      if (!workflowContext || !decisionContext) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: workflowContext, decisionContext',
        });
      }

      const agent = await getAssistantAgent();
      const result = await agent.assistWithDecision(
        decisionContext.decision || 'assistance',
        decisionContext.options || [],
        workflowContext
      );

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      console.error('Decision assistance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assist with decision',
      });
    }
  }
);

/**
 * DELETE /api/assistant/conversation/:executionId
 * Czyści konwersację
 */
router.delete('/conversation/:executionId', async (req, res) => {
  try {
    const agent = await getAssistantAgent();
    await agent.clearConversation();

    res.json({
      success: true,
      message: 'Conversation cleared',
    });
  } catch (error) {
    console.error('Clear conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear conversation',
    });
  }
});

/**
 * GET /api/assistant/stats
 * Pobiera statystyki asystenta
 */
router.get('/stats', async (req, res) => {
  try {
    const agent = await getAssistantAgent();
    const stats = await agent.getAssistantStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get assistant stats',
    });
  }
});

/**
 * PUT /api/assistant/configure
 * Konfiguruje asystenta
 */
router.put('/configure', async (req, res) => {
  try {
    const agent = await getAssistantAgent();
    agent.configureAssistant();

    res.json({
      success: true,
      message: 'Assistant configured successfully',
    });
  } catch (error) {
    console.error('Configure assistant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to configure assistant',
    });
  }
});

export default router;
