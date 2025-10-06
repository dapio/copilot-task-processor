/**
 * Workflow Execution API Routes
 * ThinkCode AI Platform - RESTful Workflow Management
 */

import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WorkflowOrchestrator } from '../execution/workflow.orchestrator';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();
const orchestrator = new WorkflowOrchestrator(prisma);

// Validation schemas
const ExecuteWorkflowSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  options: z
    .object({
      continueOnError: z.boolean().optional().default(false),
      parallelExecution: z.boolean().optional().default(false),
      maxConcurrentSteps: z.number().min(1).max(10).optional().default(3),
      timeoutMs: z.number().min(1000).optional(),
    })
    .optional()
    .default({
      continueOnError: false,
      parallelExecution: false,
      maxConcurrentSteps: 3,
    }),
});

const ExecuteStepSchema = z.object({
  stepId: z.string().min(1, 'Step ID is required'),
  context: z
    .object({
      inputs: z.record(z.string(), z.any()).optional(),
      metadata: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
});

/**
 * POST /api/workflows/:workflowId/execute
 * Execute complete workflow
 */
router.post(
  '/workflows/:workflowId/execute',
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;
      const validationResult = ExecuteWorkflowSchema.safeParse({
        workflowId,
        options: req.body,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        });
      }

      const { options } = validationResult.data;

      console.log(`🚀 Starting workflow execution: ${workflowId}`);
      console.log('Execution options:', options);

      // Execute workflow
      const executionResult = await orchestrator.executeWorkflow(
        workflowId,
        options
      );

      if (executionResult.success) {
        const result = executionResult.data;

        console.log(`✅ Workflow execution completed: ${workflowId}`);
        console.log(
          `Status: ${result.status}, Steps: ${result.completedSteps}/${result.totalSteps}`
        );

        return res.json({
          success: true,
          data: {
            workflowId: result.workflowId,
            status: result.status,
            completedSteps: result.completedSteps,
            totalSteps: result.totalSteps,
            duration: result.duration,
            stepResults: Array.from(result.stepResults.entries()).map(
              (entry: any) => {
                const [stepId, stepResult] = entry;
                return {
                  stepId,
                  success: stepResult.success,
                  duration: stepResult.duration,
                  confidence: stepResult.confidence,
                  retryCount: stepResult.retryCount,
                  outputs: stepResult.outputs,
                };
              }
            ),
            errors: result.errors,
          },
          message: `Workflow execution ${result.status}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error(
          `❌ Workflow execution failed: ${workflowId}`,
          executionResult.error
        );

        return res.status(500).json({
          success: false,
          error: executionResult.error.message,
          code: executionResult.error.code,
          workflowId,
          details: executionResult.error.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Workflow execution endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /api/workflows/steps/:stepId/execute
 * Execute single workflow step
 */
router.post(
  '/workflows/steps/:stepId/execute',
  async (req: Request, res: Response) => {
    try {
      const { stepId } = req.params;
      const validationResult = ExecuteStepSchema.safeParse({
        stepId,
        context: req.body,
      });

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        });
      }

      const { context } = validationResult.data;

      console.log(`🚀 Starting step execution: ${stepId}`);

      // Create task execution engine for single step
      const taskEngine = (orchestrator as any).taskEngine;
      const executionResult = await taskEngine.executeWorkflowStep(
        stepId,
        context
      );

      if (executionResult.success) {
        const result = executionResult.data;

        console.log(`✅ Step execution completed: ${stepId}`);

        return res.json({
          success: true,
          data: {
            stepId,
            success: result.success,
            outputs: result.outputs,
            duration: result.duration,
            confidence: result.confidence,
            retryCount: result.retryCount,
            metadata: result.metadata,
          },
          message: 'Step execution completed successfully',
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error(
          `❌ Step execution failed: ${stepId}`,
          executionResult.error
        );

        return res.status(500).json({
          success: false,
          error: executionResult.error.message,
          code: executionResult.error.code,
          stepId,
          retryable: executionResult.error.retryable,
          details: executionResult.error.details,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Step execution endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/workflows/:workflowId/status
 * Get workflow execution status
 */
router.get(
  '/workflows/:workflowId/status',
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;

      const statusResult = await orchestrator.getWorkflowStatus(workflowId);

      if (statusResult.success) {
        return res.json({
          success: true,
          data: statusResult.data,
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(404).json({
          success: false,
          error: statusResult.error.message,
          code: statusResult.error.code,
          workflowId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Workflow status endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * POST /api/workflows/:workflowId/cancel
 * Cancel workflow execution
 */
router.post(
  '/workflows/:workflowId/cancel',
  async (req: Request, res: Response) => {
    try {
      const { workflowId } = req.params;

      const cancelResult = await orchestrator.cancelWorkflowExecution(
        workflowId
      );

      if (cancelResult.success) {
        console.log(`🛑 Workflow cancelled: ${workflowId}`);

        return res.json({
          success: true,
          message: 'Workflow execution cancelled successfully',
          workflowId,
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(500).json({
          success: false,
          error: cancelResult.error.message,
          code: cancelResult.error.code,
          workflowId,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Workflow cancel endpoint error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * GET /api/executions/active
 * Get active workflow executions
 */
router.get('/executions/active', async (req: Request, res: Response) => {
  try {
    const activeExecutions = orchestrator.getActiveExecutions();

    const executionsList = Array.from(activeExecutions.entries()).map(
      (entry: any) => {
        const [id, data] = entry;
        return {
          workflowId: id,
          ...data,
        };
      }
    );

    return res.json({
      success: true,
      data: {
        count: executionsList.length,
        executions: executionsList,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Active executions endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/providers/health
 * Check ML providers health
 */
router.get('/providers/health', async (req: Request, res: Response) => {
  try {
    // Import provider factory
    const { getDefaultProviderConfigs, createMLProvider } = await import(
      '../providers/ml-provider.factory.js'
    );

    const configs = getDefaultProviderConfigs();
    const healthChecks = [];

    for (const config of configs) {
      if (!config.enabled) continue;

      try {
        const providerResult = await createMLProvider(config);

        if (providerResult.success) {
          const healthResult = await providerResult.data.healthCheck();

          healthChecks.push({
            name: config.name,
            type: config.type,
            status: healthResult.success
              ? healthResult.data.status
              : 'unhealthy',
            details: healthResult.success
              ? healthResult.data.details
              : healthResult.error.message,
            priority: config.priority,
          });
        } else {
          healthChecks.push({
            name: config.name,
            type: config.type,
            status: 'unavailable',
            details: providerResult.error.message,
            priority: config.priority,
          });
        }
      } catch (error: any) {
        healthChecks.push({
          name: config.name,
          type: config.type,
          status: 'error',
          details: error.message,
          priority: config.priority,
        });
      }
    }

    const healthyCount = healthChecks.filter(
      h => h.status === 'healthy'
    ).length;
    const totalCount = healthChecks.length;

    return res.json({
      success: true,
      data: {
        overall: healthyCount > 0 ? 'operational' : 'degraded',
        healthy: healthyCount,
        total: totalCount,
        providers: healthChecks,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Providers health endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
