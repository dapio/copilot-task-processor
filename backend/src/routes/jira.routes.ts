/**
 * Jira Integration API Routes
 *
 * API endpoints for Jira integration management and synchronization
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import JiraIntegrationService from '../services/jira-integration.service';

const router = Router();
const prisma = new PrismaClient();
const jiraService = new JiraIntegrationService(prisma);

// Validation schemas
const createIssueSchema = z.object({
  taskId: z.string(),
});

const syncTasksSchema = z.object({
  taskIds: z.array(z.string()).optional(),
});

const importIssuesSchema = z.object({
  jql: z.string().optional(),
});

/**
 * GET /api/jira/test-connection
 * Test Jira connection and configuration
 */
router.get('/test-connection', async (req: Request, res: Response) => {
  try {
    const result = await jiraService.testConnection();
    res.json(result);
  } catch (error: any) {
    console.error('Jira connection test failed:', error);
    res.status(500).json({
      error: 'Failed to test Jira connection',
      details: error.message,
    });
  }
});

/**
 * POST /api/jira/create-issue
 * Create a new Jira issue from a platform task
 */
router.post('/create-issue', async (req: Request, res: Response) => {
  try {
    const validatedData = createIssueSchema.parse(req.body);
    const result = await jiraService.createJiraIssue(validatedData.taskId);

    if (result.action === 'error') {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Failed to create Jira issue:', error);
    return res.status(500).json({
      error: 'Failed to create Jira issue',
      details: error.message,
    });
  }
});

/**
 * POST /api/jira/sync-tasks
 * Sync platform tasks with Jira issues
 */
router.post('/sync-tasks', async (req: Request, res: Response) => {
  try {
    const validatedData = syncTasksSchema.parse(req.body);

    if (validatedData.taskIds && validatedData.taskIds.length > 0) {
      // Sync specific tasks
      const results = [];
      for (const taskId of validatedData.taskIds) {
        const result = await jiraService.updateJiraIssue(taskId);
        results.push(result);
      }
      res.json({ results });
    } else {
      // Sync all tasks
      const results = await jiraService.syncAllTasks();
      res.json({ results });
    }
  } catch (error: any) {
    console.error('Failed to sync tasks:', error);
    res.status(500).json({
      error: 'Failed to sync tasks',
      details: error.message,
    });
  }
});

/**
 * POST /api/jira/import-issues
 * Import Jira issues to platform tasks
 */
router.post('/import-issues', async (req: Request, res: Response) => {
  try {
    const validatedData = importIssuesSchema.parse(req.body);
    const results = await jiraService.importJiraIssues(validatedData.jql);

    res.json({ results });
  } catch (error: any) {
    console.error('Failed to import Jira issues:', error);
    res.status(500).json({
      error: 'Failed to import Jira issues',
      details: error.message,
    });
  }
});

/**
 * POST /api/jira/webhook
 * Handle Jira webhook events
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const result = await jiraService.handleWebhook(req.body);

    if (!result.processed) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Failed to handle Jira webhook:', error);
    return res.status(500).json({
      error: 'Failed to handle webhook',
      details: error.message,
    });
  }
});

/**
 * GET /api/jira/boards
 * Get available Jira boards
 */
router.get('/boards', async (req: Request, res: Response) => {
  try {
    const boards = await jiraService.getBoards();
    res.json(boards);
  } catch (error: any) {
    console.error('Failed to fetch Jira boards:', error);
    res.status(500).json({
      error: 'Failed to fetch boards',
      details: error.message,
    });
  }
});

/**
 * GET /api/jira/boards/:boardId/sprints
 * Get sprints for a specific board
 */
router.get('/boards/:boardId/sprints', async (req: Request, res: Response) => {
  try {
    const boardId = parseInt(req.params.boardId);
    const sprints = await jiraService.getSprints(boardId);
    res.json(sprints);
  } catch (error: any) {
    console.error('Failed to fetch sprints:', error);
    res.status(500).json({
      error: 'Failed to fetch sprints',
      details: error.message,
    });
  }
});

/**
 * POST /api/jira/issues/:jiraKey/comments
 * Add comment to Jira issue
 */
router.post(
  '/issues/:jiraKey/comments',
  async (req: Request, res: Response) => {
    try {
      const jiraKey = req.params.jiraKey;
      const { comment } = req.body;

      if (!comment) {
        return res.status(400).json({
          error: 'Comment is required',
        });
      }

      const result = await jiraService.addComment(jiraKey, comment);
      return res.json(result);
    } catch (error: any) {
      console.error('Failed to add comment:', error);
      return res.status(500).json({
        error: 'Failed to add comment',
        details: error.message,
      });
    }
  }
);

/**
 * GET /api/jira/issues/:jiraKey/comments
 * Get comments for Jira issue
 */
router.get('/issues/:jiraKey/comments', async (req: Request, res: Response) => {
  try {
    const jiraKey = req.params.jiraKey;
    const comments = await jiraService.getComments(jiraKey);
    res.json(comments);
  } catch (error: any) {
    console.error('Failed to fetch comments:', error);
    res.status(500).json({
      error: 'Failed to fetch comments',
      details: error.message,
    });
  }
});

/**
 * GET /api/jira/sync-logs
 * Get Jira synchronization logs
 */
router.get('/sync-logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const logs = await prisma.jiraSyncLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.jiraSyncLog.count();

    res.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch sync logs:', error);
    res.status(500).json({
      error: 'Failed to fetch sync logs',
      details: error.message,
    });
  }
});

export default router;
