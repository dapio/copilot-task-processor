import { Router, Request, Response } from 'express';
import { RealWorkflowService } from '../services/real-workflow-service';

/**
 * Create workflow execution routes using real workflow service
 */
export function createExecutionRoutes(): Router {
  const router = Router();

  // Use real workflow service
  const workflowService = new RealWorkflowService();

  /**
   * GET /executions - List all workflow executions
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const workflowId = req.query.workflowId as string;
      const limit = parseInt(req.query.limit as string) || 50;

      const executions = await workflowService.getExecutions(workflowId, limit);

      res.json({
        success: true,
        data: executions,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to load executions: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /executions/:id - Get specific execution
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const execution = await workflowService.getExecutionById(id);
      if (!execution) {
        return res.status(404).json({
          success: false,
          error: 'Execution not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: execution,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get execution: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
