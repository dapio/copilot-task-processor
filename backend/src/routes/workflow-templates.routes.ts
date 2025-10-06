import { Router, Request, Response } from 'express';
import { createMockWorkflowEngine } from '../services/mock-workflow-engine.service';

/**
 * Create workflow template routes using mock engine
 */
export function createTemplateRoutes(): Router {
  const router = Router();

  // Use mock engine for now - will be replaced with real engine interface
  const mockEngine = createMockWorkflowEngine();

  /**
   * GET /templates - List all workflow templates
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const result = await mockEngine.listTemplates();

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Failed to load templates',
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
   * GET /templates/:id - Get specific workflow template
   */
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await mockEngine.getTemplate(id);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          timestamp: new Date().toISOString(),
        });
      } else {
        res.status(404).json({
          success: false,
          error: 'Template not found',
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
