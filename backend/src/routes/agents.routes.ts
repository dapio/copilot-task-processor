/**
 * Agent Management API Routes
 *
 * API endpoints for agent monitoring, control, and management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const agentControlSchema = z.object({
  action: z.enum(['start', 'pause', 'stop', 'restart']),
});

/**
 * GET /api/agents
 * Get all agents with their current status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json(agents);
  } catch (error: any) {
    console.error('Failed to fetch agents:', error);
    res.status(500).json({
      error: 'Failed to fetch agents',
      details: error.message,
    });
  }
});

/**
 * GET /api/agents/metrics
 * Get agent performance metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const agents = await prisma.agent.findMany({
      include: {
        tasks: {
          select: {
            status: true,
            completedAt: true,
            createdAt: true,
          },
        },
      },
    });

    const metrics = agents.map(agent => {
      const tasks = agent.tasks || [];
      const completedTasks = tasks.filter((t: any) => t.status === 'completed');
      const failedTasks = tasks.filter((t: any) => t.status === 'failed');

      const successRate =
        tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

      return {
        agentId: agent.id,
        tasksCompleted: completedTasks.length,
        tasksInProgress: tasks.filter((t: any) => t.status === 'in_progress')
          .length,
        tasksFailed: failedTasks.length,
        successRate,
        uptime: 0, // Would need to track this separately
        lastActive: agent.updatedAt,
      };
    });

    res.json(metrics);
  } catch (error: any) {
    console.error('Failed to fetch agent metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch agent metrics',
      details: error.message,
    });
  }
});

/**
 * GET /api/agents/activities
 * Get recent agent activities
 */
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Mock activities - in real implementation would come from activity logs
    const activities = [
      {
        id: '1',
        agentId: 'agent1',
        agentName: 'Document Processor',
        action: 'task_completed',
        status: 'success',
        message: 'Successfully processed document analysis',
        timestamp: new Date().toISOString(),
        duration: 1250,
      },
    ];

    res.json(activities.slice(0, limit));
  } catch (error: any) {
    console.error('Failed to fetch activities:', error);
    res.status(500).json({
      error: 'Failed to fetch activities',
      details: error.message,
    });
  }
});

/**
 * POST /api/agents/:id/control
 * Control agent (start/pause/stop/restart)
 */
router.post('/:id/control', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.id;
    const validatedData = agentControlSchema.parse(req.body);

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
      });
    }

    // Update agent status based on action
    let newStatus = agent.status;
    switch (validatedData.action) {
      case 'start':
        newStatus = 'active';
        break;
      case 'pause':
        newStatus = 'idle';
        break;
      case 'stop':
        newStatus = 'offline';
        break;
      case 'restart':
        newStatus = 'active';
        break;
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      message: `Agent ${validatedData.action} successful`,
      agent: updatedAgent,
    });
  } catch (error: any) {
    console.error('Failed to control agent:', error);
    return res.status(500).json({
      error: 'Failed to control agent',
      details: error.message,
    });
  }
});

/**
 * GET /api/agents/:id
 * Get specific agent details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const agentId = req.params.id;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        tasks: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!agent) {
      return res.status(404).json({
        error: 'Agent not found',
      });
    }

    return res.json(agent);
  } catch (error: any) {
    console.error('Failed to fetch agent:', error);
    return res.status(500).json({
      error: 'Failed to fetch agent',
      details: error.message,
    });
  }
});

export default router;
