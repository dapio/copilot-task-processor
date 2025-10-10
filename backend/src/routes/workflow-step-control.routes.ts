/**
 * Workflow Step Control Routes
 * API endpoints for managing workflow step approvals and control
 */

import express from 'express';
import { WorkflowStepControlService } from '../services/workflow-step-control.service';

const router = express.Router();
const stepControlService = new WorkflowStepControlService();

/**
 * GET /api/workflow/steps/:workflowRunId
 * Get workflow steps with approval status for a project
 */
router.get('/steps/:workflowRunId', async (req, res) => {
  try {
    const { workflowRunId } = req.params;
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required',
      });
    }

    const result = await stepControlService.getWorkflowSteps(
      projectId as string,
      workflowRunId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting workflow steps:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/workflow/step/start
 * Start a workflow step (creates approval if not exists)
 */
router.post('/step/start', async (req, res) => {
  try {
    const { projectId, workflowRunId, stepId, userId } = req.body;

    if (!projectId || !workflowRunId || !stepId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, workflow run ID, and step ID are required',
      });
    }

    const result = await stepControlService.startStep({
      projectId,
      workflowRunId,
      stepId,
      action: 'start',
      userId,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error starting workflow step:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/workflow/step/approve
 * Approve a workflow step
 */
router.post('/step/approve', async (req, res) => {
  try {
    const { projectId, workflowRunId, stepId, comments, userId } = req.body;

    if (!projectId || !workflowRunId || !stepId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, workflow run ID, and step ID are required',
      });
    }

    const result = await stepControlService.approveStep({
      projectId,
      workflowRunId,
      stepId,
      action: 'approve',
      comments,
      userId,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error approving workflow step:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/workflow/step/reject
 * Reject a workflow step
 */
router.post('/step/reject', async (req, res) => {
  try {
    const { projectId, workflowRunId, stepId, comments, userId } = req.body;

    if (!projectId || !workflowRunId || !stepId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, workflow run ID, and step ID are required',
      });
    }

    const result = await stepControlService.rejectStep({
      projectId,
      workflowRunId,
      stepId,
      action: 'reject',
      comments,
      userId,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error rejecting workflow step:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/workflow/step/revision
 * Request revision for a workflow step
 */
router.post('/step/revision', async (req, res) => {
  try {
    const { projectId, workflowRunId, stepId, comments, userId } = req.body;

    if (!projectId || !workflowRunId || !stepId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, workflow run ID, and step ID are required',
      });
    }

    const result = await stepControlService.requestRevision({
      projectId,
      workflowRunId,
      stepId,
      action: 'request_revision',
      comments,
      userId,
    });

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error requesting workflow step revision:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * GET /api/workflow/status/:projectId/:workflowRunId
 * Get workflow status summary
 */
router.get('/status/:projectId/:workflowRunId', async (req, res) => {
  try {
    const { projectId, workflowRunId } = req.params;

    const result = await stepControlService.getWorkflowStatus(
      projectId,
      workflowRunId
    );

    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('Error getting workflow status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
