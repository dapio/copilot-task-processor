import { Router, Request, Response } from 'express';
import { RealWorkflowService } from '../services/real-workflow-service';

/**
 * Handle GET /templates - List all workflow templates
 */
async function handleGetTemplates(req: Request, res: Response) {
  try {
    const workflowService = new RealWorkflowService();
    const status = req.query.status as any;
    const category = req.query.category as any;
    const priority = req.query.priority as any;
    const sortBy = req.query.sortBy as any;
    const sortOrder = req.query.sortOrder as any;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;

    const workflows = await workflowService.getWorkflows({
      status,
      category,
      priority,
      sortBy,
      sortOrder,
      limit,
    });

    res.json({
      success: true,
      data: workflows,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Failed to get workflows: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Handle GET /templates/:id - Get specific workflow template
 */
async function handleGetTemplate(req: Request, res: Response) {
  try {
    const workflowService = new RealWorkflowService();
    const workflow = await workflowService.getWorkflowById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
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
}

/**
 * Create workflow template routes using real workflow service
 */
export function createTemplateRoutes(): Router {
  const router = Router();

  /**
   * GET /templates - List all workflow templates (workflows)
   */
  router.get('/', handleGetTemplates);

  /**
   * GET /templates/:id - Get specific workflow template
   */
  router.get('/:id', handleGetTemplate);

  return router;
}
