import { Router, Request, Response } from 'express';
import { RealWorkflowService } from '../services/real-workflow-service';

/**
 * Create workflow template routes using real workflow service
 */
export function createTemplateRoutes(): Router {
  const router = Router();

  // Use real workflow service
  const workflowService = new RealWorkflowService();

  /**
   * GET /templates - List all workflow templates (workflows)
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as any;
      const category = req.query.category as any;
      const priority = req.query.priority as any;
      const sortBy = req.query.sortBy as any;
      const sortOrder = req.query.sortOrder as any;
      const limit = parseInt(req.query.limit as string);
      const offset = parseInt(req.query.offset as string);

      const result = await workflowService.getWorkflows({
        status,
        category,
        priority,
        sortBy,
        sortOrder,
        limit,
        offset,
      });

      res.json({
        success: true,
        data: result.workflows,
        total: result.total,
        statistics: result.statistics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to load workflows: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  /**
   * GET /templates/:id - Get specific workflow template
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const workflow = await workflowService.getWorkflowById(id);
      if (!workflow) {
        return res.status(404).json({
          success: false,
          error: 'Workflow template not found',
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: workflow,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: `Failed to get workflow: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  return router;
}
