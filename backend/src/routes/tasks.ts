/**
 * Task Management API Routes
 * RESTful endpoints for task CRUD operations and Jira synchronization
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { TaskJiraProvider } from '../services/task-jira-provider';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const taskJiraProvider = new TaskJiraProvider();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'testing', 'completed', 'failed']).default('pending'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedHours: z.number().positive().optional(),
  projectId: z.string().optional(),
  assignedAgentId: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional() // JSON string
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'review', 'testing', 'completed', 'failed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  assignedAgentId: z.string().optional(),
  category: z.string().optional(),
  tags: z.string().optional()
});

const querySchema = z.object({
  projectId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assignedAgentId: z.string().optional(),
  search: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10) || 1),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '50', 10) || 50, 100)),
  sortBy: z.enum(['title', 'status', 'priority', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

/**
 * GET /api/tasks
 * List tasks with filtering, searching, and pagination
 */
router.get('/', async (req, res) => {
  try {
    const query = querySchema.parse(req.query);
    
    // Build where clause
    const where: any = {};
    
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.assignedAgentId) where.assignedAgentId = query.assignedAgentId;
    
    // Search functionality
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ];
    }

    // Calculate pagination
    const offset = (query.page - 1) * query.limit;

    // Execute query
    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          jiraIntegration: true,
          assignedAgent: {
            select: { id: true, name: true, type: true }
          },
          project: {
            select: { id: true, name: true }
          }
        },
        orderBy: { [query.sortBy]: query.sortOrder },
        skip: offset,
        take: query.limit
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: query.page,
          limit: query.limit,
          total: totalCount,
          pages: Math.ceil(totalCount / query.limit)
        }
      }
    });

  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch tasks'
      }
    });
  }
});

/**
 * GET /api/tasks/:id
 * Get single task by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        jiraIntegration: true,
        assignedAgent: {
          select: { id: true, name: true, type: true }
        },
        project: {
          select: { id: true, name: true }
        },
        executions: {
          orderBy: { startedAt: 'desc' },
          take: 5,
          include: {
            agent: {
              select: { id: true, name: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found'
        }
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Failed to fetch task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to fetch task'
      }
    });
  }
});

/**
 * POST /api/tasks
 * Create new task
 */
router.post('/', async (req, res) => {
  try {
    const data = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        ...data,
        metadata: {}
      },
      include: {
        jiraIntegration: true,
        assignedAgent: {
          select: { id: true, name: true, type: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Failed to create task:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.issues
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create task'
      }
    });
  }
});

/**
 * PATCH /api/tasks/:id
 * Update existing task
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateTaskSchema.parse(req.body);

    // Check if task exists
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found'
        }
      });
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        jiraIntegration: true,
        assignedAgent: {
          select: { id: true, name: true, type: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    console.error('Failed to update task:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.issues
        }
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to update task'
      }
    });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete task
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found'
        }
      });
    }

    await prisma.task.delete({ where: { id } });

    res.json({
      success: true,
      data: { message: 'Task deleted successfully' }
    });

  } catch (error) {
    console.error('Failed to delete task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to delete task'
      }
    });
  }
});

/**
 * POST /api/tasks/:id/sync
 * Sync individual task with Jira
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await taskJiraProvider.syncTask(id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Failed to sync task:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Failed to sync task'
      }
    });
  }
});

/**
 * POST /api/tasks/sync/project/:projectId
 * Sync all tasks for a project with Jira
 */
router.post('/sync/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await taskJiraProvider.syncProjectTasks(projectId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Failed to sync project tasks:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PROJECT_SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Failed to sync project tasks'
      }
    });
  }
});

/**
 * POST /api/tasks/sync/force
 * Force sync all tasks
 */
router.post('/sync/force', async (req, res) => {
  try {
    const result = await taskJiraProvider.forceSync();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Failed to force sync:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FORCE_SYNC_ERROR',
        message: error instanceof Error ? error.message : 'Failed to force sync'
      }
    });
  }
});

/**
 * GET /api/tasks/sync/stats
 * Get synchronization statistics
 */
router.get('/sync/stats', async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Project ID is required'
        }
      });
    }

    const result = await taskJiraProvider.getSyncStats(projectId as string);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Failed to get sync stats:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get sync stats'
      }
    });
  }
});

/**
 * GET /api/tasks/sync/logs
 * Get recent sync logs
 */
router.get('/sync/logs', async (req, res) => {
  try {
    const { limit = '50' } = req.query;
    
    const result = await taskJiraProvider.getSyncLogs(Number(limit));

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Failed to get sync logs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get sync logs'
      }
    });
  }
});

export default router;