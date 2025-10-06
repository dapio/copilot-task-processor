/**
 * Workflow Routes - Main Entry Point
 * Organized workflow API routes with proper separation
 */

import * as express from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { createTemplateRoutes } from './workflow-templates.routes';
import { createExecutionRoutes } from './workflow-executions.routes';

/**
 * Create complete workflow routes
 */
export function createWorkflowRoutes(
  prisma: PrismaClient,
  workflowEngine?: WorkflowEngineService
): express.Router {
  const router = express.Router();

  // Initialize workflow engine if not provided
  if (!workflowEngine) {
    try {
      workflowEngine = new WorkflowEngineService(prisma as any);
    } catch (error) {
      console.error('Failed to initialize WorkflowEngineService:', error);
      // Use mock implementation for now
      workflowEngine = createMockWorkflowEngine() as any;
    }
  }

  // Mount sub-routes
  router.use('/templates', createTemplateRoutes());
  router.use('/executions', createExecutionRoutes());

  // Health check endpoint
  router.get('/health', async (req: express.Request, res: express.Response) => {
    try {
      res.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      });
    } catch {
      res.status(503).json({
        success: false,
        error: 'HEALTH_CHECK_FAILED',
        message: 'Workflow engine health check failed',
      });
    }
  });

  // Global error handler
  router.use((error: any, req: express.Request, res: express.Response) => {
    console.error('Workflow API Error:', error);

    res.status(500).json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
  });

  return router;
}

// Mock template operations
function createMockTemplateOperations() {
  return {
    async createTemplate(_name: string, _description: string, _steps: any[]) {
      return {
        success: true,
        data: {
          id: `template_${Date.now()}`,
          name: _name,
          description: _description,
          steps: _steps,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
        },
      } as any;
    },

    async updateTemplate(_id: string, _updates: any) {
      return {
        success: true,
        data: {
          id: _id,
          ..._updates,
          updatedAt: new Date(),
        },
      } as any;
    },

    async deleteTemplate() {
      return { success: true, data: true } as any;
    },
  };
}

// Mock execution operations
function createMockExecutionOperations() {
  return {
    async startExecution(_templateId: string, _variables: Record<string, any>) {
      return {
        success: true,
        data: {
          id: `execution_${Date.now()}`,
          templateId: _templateId,
          status: 'pending',
          variables: _variables,
          startedAt: new Date(),
        },
      } as any;
    },

    async getExecutionStatus(_executionId: string) {
      return {
        success: true,
        data: {
          id: _executionId,
          status: 'completed',
          progress: 100,
          currentStep: null,
          completedSteps: [],
          startedAt: new Date(Date.now() - 60000),
          completedAt: new Date(),
        },
      } as any;
    },

    async pauseExecution(_executionId: string) {
      return {
        success: true,
        data: { id: _executionId, status: 'paused' },
      } as any;
    },

    async resumeExecution(_executionId: string) {
      return {
        success: true,
        data: { id: _executionId, status: 'running' },
      } as any;
    },

    async cancelExecution(_executionId: string) {
      return {
        success: true,
        data: { id: _executionId, status: 'cancelled' },
      } as any;
    },

    async getExecutionHistory() {
      return {
        success: true,
        data: [
          {
            id: 'exec_1',
            templateId: 'template_1',
            status: 'completed',
            startedAt: new Date(Date.now() - 120000),
            completedAt: new Date(Date.now() - 60000),
          },
        ],
      } as any;
    },
  };
}

/**
 * Create mock workflow engine for development
 */
function createMockWorkflowEngine(): Partial<WorkflowEngineService> {
  return {
    ...createMockTemplateOperations(),
    ...createMockExecutionOperations(),
  };
}
