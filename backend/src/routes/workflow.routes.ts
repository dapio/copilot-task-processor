/**
 * Workflow API Routes
 * Complete REST API for workflow management with comprehensive error handling
 */

import express from 'express';
import { WorkflowEngineService } from '../services/workflow-engine.service';
import { PrismaClient } from '../generated/prisma';
import { z } from 'zod';
import { Result } from '../providers/ml-provider.interface';

// Validation schemas
const CreateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  category: z.string().default('general'),
  steps: z
    .array(
      z.object({
        name: z.string().min(1),
        type: z.string().min(1),
        handlerType: z.string().min(1),
        config: z.record(z.string(), z.any()).optional(),
        dependencies: z.array(z.string()).optional(),
        conditions: z
          .array(
            z.object({
              field: z.string(),
              operator: z.enum([
                'eq',
                'ne',
                'gt',
                'lt',
                'gte',
                'lte',
                'contains',
              ]),
              value: z.any(),
            })
          )
          .optional(),
        timeout: z.number().positive().optional(),
        retries: z.number().min(0).max(10).optional(),
        continueOnError: z.boolean().optional(),
      })
    )
    .min(1),
  variables: z.record(z.string(), z.any()).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

const UpdateWorkflowTemplateSchema = CreateWorkflowTemplateSchema.partial();

const StartWorkflowExecutionSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.string(), z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduledAt: z.string().datetime().optional(),
});

const QueryWorkflowsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  category: z.string().optional(),
  status: z
    .enum(['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'])
    .optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

/**
 * Create workflow routes with comprehensive API
 */
export function createWorkflowRoutes(
  prisma: PrismaClient,
  workflowEngine?: WorkflowEngineService
): express.Router {
  const router = express.Router();

  // Initialize workflow engine if not provided
  if (!workflowEngine) {
    workflowEngine = new WorkflowEngineService(prisma);
  }

  // Error handler middleware
  const handleAsync =
    (fn: Function) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };

  // Validation middleware
  const validate =
    (schema: z.ZodSchema) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        const result = schema.parse(req.body);
        req.body = result;
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.issues,
          });
        }
        next(error);
      }
    };

  // Query validation middleware
  const validateQuery =
    (schema: z.ZodSchema) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        const result = schema.parse(req.query);
        req.query = result as any;
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.issues,
          });
        }
        next(error);
      }
    };

  // GET /api/workflows/templates - List workflow templates
  router.get(
    '/templates',
    validateQuery(QueryWorkflowsSchema),
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { page, limit, category, isActive, search } = req.query as any;

      const result = await workflowEngine!.getWorkflowTemplates({
        limit,
        category,
        active: isActive,
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.data.length, // Note: Real implementation would need total count
        },
      });
    })
  );

  // GET /api/workflows/templates/:id - Get workflow template by ID
  router.get(
    '/templates/:id',
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { id } = req.params;

      const result = await workflowEngine!.getWorkflowTemplate(id);

      if (!result.success) {
        if (result.error.code === 'WORKFLOW_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error: result.error.code,
            message: result.error.message,
          });
        }

        return res.status(500).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  // POST /api/workflows/templates - Create workflow template
  router.post(
    '/templates',
    validate(CreateWorkflowTemplateSchema),
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { name, description, steps, metadata } = req.body;
      const result = await workflowEngine!.createTemplate(
        name,
        description,
        steps,
        metadata
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
          details: result.error.details,
        });
      }

      res.status(201).json({
        success: true,
        data: result.data,
      });
    })
  );

  // PUT /api/workflows/templates/:id - Update workflow template
  router.put(
    '/templates/:id',
    validate(UpdateWorkflowTemplateSchema),
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { id } = req.params;

      const result = await workflowEngine!.updateTemplate(id, req.body);

      if (!result.success) {
        if (result.error.code === 'WORKFLOW_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error: result.error.code,
            message: result.error.message,
          });
        }

        return res.status(400).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
          details: result.error.details,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  // DELETE /api/workflows/templates/:id - Delete workflow template
  router.delete(
    '/templates/:id',
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { id } = req.params;

      const result = await workflowEngine!.deleteTemplate(id);

      if (!result.success) {
        if (result.error.code === 'WORKFLOW_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error: result.error.code,
            message: result.error.message,
          });
        }

        return res.status(500).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.status(204).send();
    })
  );

  // POST /api/workflows/executions - Start workflow execution
  router.post(
    '/executions',
    validate(StartWorkflowExecutionSchema),
    handleAsync(async (req: express.Request, res: express.Response) => {
      const result = await workflowEngine!.startExecution(
        req.body.templateId,
        req.body.variables || {}
      );

      if (!result.success) {
        if (result.error.code === 'WORKFLOW_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error: result.error.code,
            message: result.error.message,
          });
        }

        return res.status(400).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
          details: result.error.details,
        });
      }

      res.status(201).json({
        success: true,
        data: result.data,
      });
    })
  );

  // GET /api/workflows/executions/:id - Get execution status
  router.get(
    '/executions/:id',
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { id } = req.params;

      const result = await workflowEngine!.getExecutionStatus(id);

      if (!result.success) {
        if (result.error.code === 'EXECUTION_NOT_FOUND') {
          return res.status(404).json({
            success: false,
            error: result.error.code,
            message: result.error.message,
          });
        }

        return res.status(500).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  // POST /api/workflows/executions/:id/pause - Pause execution
  router.post(
    '/executions/:id/pause',
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { id } = req.params;

      const result = await workflowEngine!.pauseExecution(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  // POST /api/workflows/executions/:id/resume - Resume execution
  router.post(
    '/executions/:id/resume',
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { id } = req.params;

      const result = await workflowEngine!.resumeExecution(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  // POST /api/workflows/executions/:id/cancel - Cancel execution
  router.post(
    '/executions/:id/cancel',
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { id } = req.params;

      const result = await workflowEngine!.cancelExecution(id);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
      });
    })
  );

  // GET /api/workflows/executions - List executions with history
  router.get(
    '/executions',
    validateQuery(QueryWorkflowsSchema),
    handleAsync(async (req: express.Request, res: express.Response) => {
      const { page, limit, status } = req.query as any;

      const result = await workflowEngine!.getExecutionHistory({
        status,
        limit,
      });

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error.code,
          message: result.error.message,
        });
      }

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.data.length,
        },
      });
    })
  );

  // GET /api/workflows/health - Health check endpoint
  router.get(
    '/health',
    handleAsync(async (req: express.Request, res: express.Response) => {
      try {
        // Check workflow engine health
        const isHealthy = await workflowEngine!.isHealthy();

        res.json({
          success: true,
          data: {
            status: isHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        });
      } catch (error) {
        res.status(503).json({
          success: false,
          error: 'HEALTH_CHECK_FAILED',
          message: 'Workflow engine health check failed',
        });
      }
    })
  );

  // Error handler
  router.use(
    (
      error: any,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error('Workflow API Error:', error);

      res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      });
    }
  );

  return router;
}
