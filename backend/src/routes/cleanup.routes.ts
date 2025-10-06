/**
 import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import CleanupService from '../services/cleanup.service';eanup Service API Routes
 *
 * API endpoints for system maintenance and cleanup operations
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { CleanupService } from '../services/cleanup.service';

const router = Router();
const prisma = new PrismaClient();
const cleanupService = new CleanupService(prisma);

// Validation schemas
const createCleanupTaskSchema = z.object({
  name: z.string().min(1),
  type: z.enum([
    'data_retention',
    'file_cleanup',
    'database_maintenance',
    'performance_optimization',
  ]),
  configuration: z.object({
    retentionDays: z.number().optional(),
    targetPaths: z.array(z.string()).optional(),
    filePatterns: z.array(z.string()).optional(),
    maxFileSize: z.number().optional(),
    tables: z.array(z.string()).optional(),
    operations: z.array(z.string()).optional(),
  }),
  schedule: z.string(),
  status: z.string().default('pending'),
});

const executeTaskSchema = z.object({
  taskId: z.string(),
  dryRun: z.boolean().default(false),
});

/**
 * GET /api/cleanup/tasks
 * Get all cleanup tasks
 */
router.get('/tasks', async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.cleanupTask.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        results: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    res.json(tasks);
  } catch (error: any) {
    console.error('Failed to fetch cleanup tasks:', error);
    res.status(500).json({
      error: 'Failed to fetch cleanup tasks',
      details: error.message,
    });
  }
});

/**
 * POST /api/cleanup/tasks
 * Create a new cleanup task
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const validatedData = createCleanupTaskSchema.parse(req.body);

    const task = await prisma.cleanupTask.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        configuration: validatedData.configuration,
        schedule: validatedData.schedule,
        status: validatedData.status,
      },
    });

    res.json(task);
  } catch (error: any) {
    console.error('Failed to create cleanup task:', error);
    res.status(500).json({
      error: 'Failed to create cleanup task',
      details: error.message,
    });
  }
});

/**
 * POST /api/cleanup/execute
 * Execute a cleanup task
 */
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const validatedData = executeTaskSchema.parse(req.body);

    const task = await prisma.cleanupTask.findUnique({
      where: { id: validatedData.taskId },
    });

    if (!task) {
      return res.status(404).json({
        error: 'Cleanup task not found',
      });
    }

    const result = await cleanupService.executeCleanupTask(
      validatedData.taskId
    );

    return res.json(result);
  } catch (error: any) {
    console.error('Failed to execute cleanup task:', error);
    return res.status(500).json({
      error: 'Failed to execute cleanup task',
      details: error.message,
    });
  }
});

/**
 * GET /api/cleanup/results
 * Get cleanup execution results
 */
router.get('/results', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const taskId = req.query.taskId as string;

    const where = taskId ? { taskId } : {};

    const results = await prisma.cleanupResult.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        task: true,
      },
    });

    const total = await prisma.cleanupResult.count({ where });

    res.json({
      results,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch cleanup results:', error);
    res.status(500).json({
      error: 'Failed to fetch cleanup results',
      details: error.message,
    });
  }
});

/**
 * GET /api/cleanup/metrics
 * Get cleanup system metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Get basic metrics from database
    const tasksCount = await prisma.cleanupTask.count();

    const recentResults = await prisma.cleanupResult.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    const totalSpaceSaved = recentResults.reduce(
      (sum, r) => sum + r.spaceSaved,
      0
    );
    const totalItemsRemoved = recentResults.reduce(
      (sum, r) => sum + r.itemsRemoved,
      0
    );

    const metrics = {
      tasks: {
        total: tasksCount,
        recentExecutions: recentResults.length,
      },
      performance: {
        totalSpaceSaved,
        totalItemsRemoved,
        averageDuration:
          recentResults.length > 0
            ? recentResults.reduce((sum, r) => sum + r.duration, 0) /
              recentResults.length
            : 0,
      },
    };

    res.json(metrics);
  } catch (error: any) {
    console.error('Failed to fetch cleanup metrics:', error);
    res.status(500).json({
      error: 'Failed to fetch cleanup metrics',
      details: error.message,
    });
  }
});

/**
 * POST /api/cleanup/schedule
 * Schedule cleanup tasks
 */
router.post('/schedule', async (req: Request, res: Response) => {
  try {
    // Update next run times for all enabled tasks
    const tasks = await prisma.cleanupTask.findMany({
      where: { status: { not: 'running' } },
    });

    // Basic scheduling logic - can be enhanced with cron parsing
    for (const task of tasks) {
      const nextRun = new Date(Date.now() + 24 * 60 * 60 * 1000); // Default: 24 hours

      await prisma.cleanupTask.update({
        where: { id: task.id },
        data: { nextRun },
      });
    }

    res.json({
      success: true,
      message: 'Cleanup tasks scheduled successfully',
      scheduledTasks: tasks.length,
    });
  } catch (error: any) {
    console.error('Failed to schedule cleanup tasks:', error);
    res.status(500).json({
      error: 'Failed to schedule cleanup tasks',
      details: error.message,
    });
  }
});

/**
 * PUT /api/cleanup/tasks/:id
 * Update a cleanup task
 */
router.put('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const updateData = createCleanupTaskSchema.partial().parse(req.body);

    const task = await prisma.cleanupTask.update({
      where: { id: taskId },
      data: updateData,
    });

    res.json(task);
  } catch (error: any) {
    console.error('Failed to update cleanup task:', error);
    res.status(500).json({
      error: 'Failed to update cleanup task',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/cleanup/tasks/:id
 * Delete a cleanup task
 */
router.delete('/tasks/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;

    await prisma.cleanupTask.delete({
      where: { id: taskId },
    });

    res.json({
      success: true,
      message: 'Cleanup task deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete cleanup task:', error);
    res.status(500).json({
      error: 'Failed to delete cleanup task',
      details: error.message,
    });
  }
});

/**
 * GET /api/cleanup/system-status
 * Get system cleanup status and health
 */
router.get('/system-status', async (req: Request, res: Response) => {
  try {
    // Get basic system statistics
    const tasksCount = await prisma.cleanupTask.count();
    const activeTasksCount = await prisma.cleanupTask.count({
      where: { status: 'running' },
    });

    const recentResults = await prisma.cleanupResult.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const successfulResults = recentResults.filter(r => r.success === true);
    const failedResults = recentResults.filter(r => r.success === false);

    res.json({
      tasks: {
        total: tasksCount,
        active: activeTasksCount,
        idle: tasksCount - activeTasksCount,
      },
      recentExecution: {
        total: recentResults.length,
        successful: successfulResults.length,
        failed: failedResults.length,
        successRate:
          recentResults.length > 0
            ? (successfulResults.length / recentResults.length) * 100
            : 0,
      },
      lastExecution: recentResults[0] || null,
    });
  } catch (error: any) {
    console.error('Failed to fetch system status:', error);
    res.status(500).json({
      error: 'Failed to fetch system status',
      details: error.message,
    });
  }
});

export default router;
