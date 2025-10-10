/**
 * Workflow Step Management Routes
 * Handles step approvals, conversations, tasks, and file management
 */

import { Router } from 'express';
import { WorkflowStepApprovalService } from '../services/workflow-step-approval.service';
import { AgentProfileService } from '../services/agent-profile.service';
import { ProjectFileService } from '../services/project-file.service';
import multer from 'multer';

const router = Router();
const approvalService = new WorkflowStepApprovalService();
const profileService = new AgentProfileService();
const fileService = new ProjectFileService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// ================================
// WORKFLOW STEP APPROVALS
// ================================

/**
 * Create workflow step approval
 */
router.post('/approvals', async (req, res) => {
  try {
    const result = await approvalService.createStepApproval(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Step approval created successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error creating step approval:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get workflow step approvals for a workflow run
 */
router.get('/workflow-runs/:workflowRunId/approvals', async (req, res) => {
  try {
    const { workflowRunId } = req.params;
    const result = await approvalService.getWorkflowStepApprovals(
      workflowRunId
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching workflow step approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get specific step approval with full context
 */
router.get('/approvals/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const result = await approvalService.getStepApproval(approvalId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching step approval:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Update step approval status
 */
router.patch('/approvals/:approvalId', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const result = await approvalService.updateStepApproval(
      approvalId,
      req.body
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Step approval updated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error updating step approval:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ================================
// CONVERSATION MANAGEMENT
// ================================

/**
 * Add message to step conversation
 */
router.post('/approvals/:approvalId/messages', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const messageData = {
      ...req.body,
      approvalId,
    };

    const result = await approvalService.addConversationMessage(messageData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Message added successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error adding conversation message:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get step conversation history
 */
router.get('/approvals/:approvalId/messages', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await approvalService.getStepConversation(
      approvalId,
      limit,
      offset
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching step conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ================================
// TASK MANAGEMENT
// ================================

/**
 * Create step task
 */
router.post('/approvals/:approvalId/tasks', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const taskData = {
      ...req.body,
      approvalId,
    };

    const result = await approvalService.createStepTask(taskData);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Task created successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error creating step task:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get step tasks with filtering
 */
router.get('/approvals/:approvalId/tasks', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const filters = {
      status: req.query.status as string,
      assignedTo: req.query.assignedTo as string,
      type: req.query.type as string,
    };

    const result = await approvalService.getStepTasks(approvalId, filters);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching step tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Update step task
 */
router.patch('/tasks/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const result = await approvalService.updateStepTask(taskId, req.body);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Task updated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error updating step task:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Check if step can be approved
 */
router.get('/approvals/:approvalId/can-approve', async (req, res) => {
  try {
    const { approvalId } = req.params;
    const result = await approvalService.canApproveStep(approvalId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error checking step approval eligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ================================
// AGENT PROFILES MANAGEMENT
// ================================

/**
 * Get all agent profiles
 */
router.get('/agents/profiles', async (req, res) => {
  try {
    const result = await profileService.getAllAgentProfiles();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching agent profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get specific agent profile
 */
router.get('/agents/:agentId/profile', async (req, res) => {
  try {
    const { agentId } = req.params;
    const result = await profileService.getAgentProfile(agentId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Update agent profile
 */
router.patch('/agents/:agentId/profile', async (req, res) => {
  try {
    const { agentId } = req.params;
    const result = await profileService.updateAgentProfile(agentId, req.body);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Agent profile updated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error updating agent profile:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Initialize all agent profiles
 */
router.post('/agents/profiles/initialize', async (req, res) => {
  try {
    const result = await profileService.initializeAllAgentProfiles();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Agent profiles initialized successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error initializing agent profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get available colors for agents
 */
router.get('/agents/colors', async (req, res) => {
  try {
    const result = await profileService.getAvailableColors();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching available colors:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// ================================
// PROJECT FILE MANAGEMENT
// ================================

/**
 * Upload files to project (supports multiple files and ZIP)
 */
router.post(
  '/projects/:projectId/files',
  upload.array('files', 20),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const files = req.files as any[];
      const { category = 'input', uploadedBy } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided',
        });
      }

      const results = [];
      const errors = [];

      for (const file of files) {
        try {
          const uploadResult = await fileService.uploadFile({
            projectId,
            filename: `${Date.now()}_${file.originalname}`,
            originalName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
            category,
            uploadedBy,
            buffer: file.buffer,
          });

          if (uploadResult.success) {
            results.push(uploadResult.data);
          } else {
            errors.push({
              filename: file.originalname,
              error: uploadResult.error,
            });
          }
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error instanceof Error ? error.message : 'Upload failed',
          });
        }
      }

      res.status(results.length > 0 ? 201 : 400).json({
        success: results.length > 0,
        data: {
          uploaded: results,
          errors,
          totalUploaded: results.length,
          totalErrors: errors.length,
        },
        message: `${results.length} files uploaded successfully${
          errors.length > 0 ? `, ${errors.length} failed` : ''
        }`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
);

/**
 * Get project files with filtering
 */
router.get('/projects/:projectId/files', async (req, res) => {
  try {
    const { projectId } = req.params;
    const filters = {
      category: req.query.category as string,
      status: req.query.status as string,
      mimeType: req.query.mimeType as string,
      limit: parseInt(req.query.limit as string) || 50,
      offset: parseInt(req.query.offset as string) || 0,
    };

    const result = await fileService.getProjectFiles(projectId, filters);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get project file summary
 */
router.get('/projects/:projectId/files/summary', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await fileService.getProjectFileSummary(projectId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching project file summary:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Check if project has files
 */
router.get('/projects/:projectId/has-files', async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await fileService.hasProjectFiles(projectId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error checking project files:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Update file information
 */
router.patch('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await fileService.updateFile(fileId, req.body);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'File updated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error updating file:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Delete file
 */
router.delete('/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await fileService.deleteFile(fileId);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'File deleted successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * Get file content
 */
router.get('/files/:fileId/content', async (req, res) => {
  try {
    const { fileId } = req.params;
    const result = await fileService.getFileContent(fileId);

    if (result.success) {
      const { file, buffer, content } = result.data || {};

      if (!file) {
        return res.status(404).json({
          success: false,
          error: 'File data not found',
        });
      }

      // Set appropriate headers
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${file.originalName}"`
      );

      // For text files, return content, for binary files return buffer
      if (content && file.mimeType.startsWith('text/')) {
        res.json({
          success: true,
          data: {
            file,
            content,
            type: 'text',
          },
        });
      } else {
        res.send(buffer);
      }
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error fetching file content:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;
