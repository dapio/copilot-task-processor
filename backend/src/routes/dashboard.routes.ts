/**
 * Dashboard API Routes
 * Obsługa endpointów dla dashboard
 */

import express, { Request, Response } from 'express';

const router = express.Router();

/**
 * GET /api/dashboard/metrics
 * Pobiera metryki dla dashboard
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    // Mock data for now - in production connect to real services
    const metrics = {
      totalProjects: 12,
      activeAgents: 8,
      tasksCompleted: 156,
      tasksInProgress: 24,
      systemHealth: 95,
      uptime: Math.floor(process.uptime()),
      lastUpdate: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'METRICS_ERROR',
      message: 'Failed to fetch dashboard metrics',
    });
  }
});

/**
 * GET /api/dashboard/status
 * Pobiera status systemu
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    const status = {
      system: 'online',
      database: 'connected',
      ai_services: 'active',
      queue: 'processing',
      storage: 'available',
    };

    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard status error:', error);
    res.status(500).json({
      success: false,
      error: 'STATUS_ERROR',
      message: 'Failed to fetch system status',
    });
  }
});

export default router;
