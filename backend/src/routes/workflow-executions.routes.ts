import { Router, Request, Response } from 'express';
import { createMockWorkflowEngine } from '../services/mock-workflow-engine.service';

/**
 * Create workflow execution routes using mock engine
 */
export function createExecutionRoutes(): Router {
  const router = Router();

  // Use mock engine for now
  const mockEngine = createMockWorkflowEngine();

  /**
   * GET /executions - List all workflow executions
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const result = await mockEngine.getExecutionHistory();

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to load executions',
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
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
      const result = await mockEngine.getExecution(id);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Execution not found',
          timestamp: new Date().toISOString(),
        });
      }
    } catch {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
