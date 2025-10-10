/**
 * Advanced Task Management API Routes
 * Provides comprehensive task management endpoints including:
 * - Task currentness validation
 * - Agent task assignment
 * - Multi-agent collaboration
 * - Task management analytics
 */

import { Router } from 'express';
import {
  MasterTaskManagementService,
  WorkflowStepContext,
} from '../services/master-task-management.service';

import { AgentTaskAssignmentService } from '../services/agent-task-assignment.service';
import { MultiAgentCollaborationService } from '../services/multi-agent-collaboration.service';
import { z } from 'zod';

const router = Router();
const masterTaskManager = new MasterTaskManagementService();

const agentAssignmentService = new AgentTaskAssignmentService();
const collaborationService = new MultiAgentCollaborationService();

// Validation schemas
const InitializeStepTasksSchema = z.object({
  projectId: z.string().cuid(),
  stepId: z.string(),
  stepName: z.string(),
  agentType: z.string(),
  approvalId: z.string().cuid(),
  uploadedFiles: z.array(z.string()).default([]),
  stepConfiguration: z.any().default({}),
  projectFiles: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  complexity: z.enum(['simple', 'medium', 'complex']).default('medium'),
});

const AgentPickupTaskSchema = z.object({
  taskId: z.string().cuid(),
  agentId: z.string().cuid(),
});

const AgentCompleteTaskSchema = z.object({
  taskId: z.string().cuid(),
  agentId: z.string().cuid(),
  completedWork: z.string(),
  deliverables: z.array(z.string()),
  nextSteps: z.array(z.string()).optional(),
  needsHandoff: z.boolean().default(false),
  nextAgentType: z.string().optional(),
  actualTimeSpent: z.number().positive().optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  handoffNotes: z.string().optional(),
});

const CreateCollaborativeTaskSchema = z.object({
  approvalId: z.string().cuid(),
  taskTitle: z.string(),
  description: z.string(),
  taskType: z
    .enum(['full-stack-development', 'comprehensive-analysis'])
    .default('comprehensive-analysis'),
});

/**
 * POST /api/task-management/initialize-step
 * Initialize comprehensive task management for a workflow step
 */
router.post('/initialize-step', async (req, res) => {
  try {
    const data = InitializeStepTasksSchema.parse(req.body);

    const result = await masterTaskManager.initializeStepTasks(
      data as WorkflowStepContext
    );

    res.json({
      success: true,
      data: result,
      message: 'Task management initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing step tasks:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Task initialization failed',
    });
  }
});

/**
 * GET /api/task-management/step-status/:approvalId
 * Get comprehensive task status for a workflow step
 */
router.get('/step-status/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;

    if (!approvalId) {
      return res.status(400).json({
        success: false,
        error: 'Approval ID is required',
      });
    }

    const status = await masterTaskManager.getStepTaskStatus(approvalId);

    res.json({
      success: true,
      data: status,
      message: 'Task status retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting step task status:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get task status',
    });
  }
});

/**
 * POST /api/task-management/agent-pickup
 * Agent picks up a task
 */
router.post('/agent-pickup', async (req, res) => {
  try {
    const data = AgentPickupTaskSchema.parse(req.body);

    const success = await masterTaskManager.agentPickupTask(
      data.taskId,
      data.agentId
    );

    if (success) {
      res.json({
        success: true,
        message: 'Task picked up successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error:
          'Task pickup failed - task may not be available or agent not qualified',
      });
    }
  } catch (error) {
    console.error('Error in agent task pickup:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Task pickup failed',
    });
  }
});

/**
 * POST /api/task-management/agent-complete
 * Agent completes a task
 */
router.post('/agent-complete', async (req, res) => {
  try {
    const data = AgentCompleteTaskSchema.parse(req.body);

    await masterTaskManager.agentCompleteTask(data.taskId, data.agentId, {
      completedWork: data.completedWork,
      deliverables: data.deliverables,
      nextSteps: data.nextSteps,
      needsHandoff: data.needsHandoff,
      nextAgentType: data.nextAgentType,
      actualTimeSpent: data.actualTimeSpent,
      qualityScore: data.qualityScore,
      handoffNotes: data.handoffNotes,
    });

    res.json({
      success: true,
      message: 'Task completed successfully',
    });
  } catch (error) {
    console.error('Error in agent task completion:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Task completion failed',
    });
  }
});

/**
 * POST /api/task-management/create-collaborative
 * Create a collaborative task with multiple agents
 */
router.post('/create-collaborative', async (req, res) => {
  try {
    const data = CreateCollaborativeTaskSchema.parse(req.body);

    const templates = collaborationService.getCollaborationPlanTemplates();
    const plan = templates[data.taskType];

    if (!plan) {
      return res.status(400).json({
        success: false,
        error: `Unknown collaboration plan type: ${data.taskType}`,
      });
    }

    const taskId = await collaborationService.createCollaborativeTask(
      data.approvalId,
      data.taskTitle,
      data.description,
      plan
    );

    res.json({
      success: true,
      data: { taskId },
      message: 'Collaborative task created successfully',
    });
  } catch (error) {
    console.error('Error creating collaborative task:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Collaborative task creation failed',
    });
  }
});

/**
 * GET /api/task-management/collaboration-status/:taskId
 * Get collaboration status for a task
 */
router.get('/collaboration-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    const status = await collaborationService.getCollaborationStatus(taskId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Collaborative task not found',
      });
    }

    res.json({
      success: true,
      data: status,
      message: 'Collaboration status retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting collaboration status:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get collaboration status',
    });
  }
});

/**
 * PUT /api/task-management/reassign/:taskId
 * Reassign a blocked or failed task
 */
router.put('/reassign/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { newAgentType } = req.body;

    const success = await masterTaskManager.reassignTask(taskId, newAgentType);

    if (success) {
      res.json({
        success: true,
        message: 'Task reassigned successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Task reassignment failed',
      });
    }
  } catch (error) {
    console.error('Error reassigning task:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error ? error.message : 'Task reassignment failed',
    });
  }
});

/**
 * GET /api/task-management/analytics
 * Get comprehensive task management analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const { projectId } = req.query;

    const analytics = await masterTaskManager.getTaskManagementAnalytics(
      projectId ? String(projectId) : undefined
    );

    res.json({
      success: true,
      data: analytics,
      message: 'Analytics retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting task management analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    });
  }
});

/**
 * GET /api/task-management/agent-assignments/:projectId?
 * Get agent assignment statistics
 */
router.get('/agent-assignments/:projectId?', async (req, res) => {
  try {
    const { projectId } = req.params;

    const stats = await agentAssignmentService.getTaskAssignmentStats(
      projectId
    );

    res.json({
      success: true,
      data: stats,
      message: 'Agent assignment statistics retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting agent assignment stats:', error);
    res.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get assignment statistics',
    });
  }
});

/**
 * GET /api/task-management/collaboration-templates
 * Get available collaboration plan templates
 */
router.get('/collaboration-templates', async (req, res) => {
  try {
    const templates = collaborationService.getCollaborationPlanTemplates();

    res.json({
      success: true,
      data: templates,
      message: 'Collaboration templates retrieved successfully',
    });
  } catch (error) {
    console.error('Error getting collaboration templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get templates',
    });
  }
});

export default router;
