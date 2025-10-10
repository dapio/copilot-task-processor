/**
 * Workflow Step Approval Service
 * Manages step approvals, conversations, and tasks in workflow
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const CreateApprovalSchema = z.object({
  projectId: z.string().cuid(),
  workflowRunId: z.string().cuid(),
  stepId: z.string(),
  stepName: z.string(),
});

const UpdateApprovalSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'needs_revision']),
  approvedBy: z.string().optional(),
  comments: z.string().optional(),
});

const AddConversationMessageSchema = z.object({
  approvalId: z.string().cuid(),
  agentId: z.string().cuid().optional(),
  role: z.enum(['user', 'agent', 'system']),
  agentType: z.string().optional(),
  content: z.string(),
  messageType: z
    .enum(['text', 'task', 'question', 'analysis', 'file'])
    .default('text'),
  attachments: z.array(z.any()).optional(),
  parentId: z.string().cuid().optional(),
  isImportant: z.boolean().default(false),
  metadata: z.record(z.string(), z.any()).optional(),
});

const CreateStepTaskSchema = z.object({
  approvalId: z.string().cuid(),
  agentId: z.string().cuid().optional(),
  title: z.string(),
  description: z.string().optional(),
  type: z
    .enum(['analysis', 'review', 'question', 'approval', 'generation'])
    .default('analysis'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignedTo: z.string().optional(),
  questions: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  deliverables: z.array(z.string()).optional(),
  estimatedTime: z.number().optional(),
});

export type CreateApprovalInput = z.infer<typeof CreateApprovalSchema>;
export type UpdateApprovalInput = z.infer<typeof UpdateApprovalSchema>;
export type AddConversationMessageInput = z.infer<
  typeof AddConversationMessageSchema
>;
export type CreateStepTaskInput = z.infer<typeof CreateStepTaskSchema>;

export class WorkflowStepApprovalService {
  /**
   * Create a new workflow step approval
   */
  async createStepApproval(input: CreateApprovalInput) {
    try {
      const validatedInput = CreateApprovalSchema.parse(input);

      const approval = await prisma.workflowStepApproval.create({
        data: {
          ...validatedInput,
          status: 'pending',
        },
        include: {
          project: true,
          workflowRun: true,
          conversations: {
            orderBy: { timestamp: 'asc' },
            include: {
              agent: { include: { profile: true } },
            },
          },
          tasks: {
            orderBy: { createdAt: 'asc' },
            include: {
              agent: { include: { profile: true } },
            },
          },
        },
      });

      return { success: true, data: approval };
    } catch (error) {
      console.error('Error creating step approval:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create step approval',
      };
    }
  }

  /**
   * Get step approval by ID with full context
   */
  async getStepApproval(approvalId: string) {
    try {
      const approval = await prisma.workflowStepApproval.findUnique({
        where: { id: approvalId },
        include: {
          project: true,
          workflowRun: true,
          conversations: {
            orderBy: { timestamp: 'asc' },
            include: {
              agent: { include: { profile: true } },
              replies: {
                include: {
                  agent: { include: { profile: true } },
                },
              },
            },
          },
          tasks: {
            orderBy: { createdAt: 'asc' },
            include: {
              agent: { include: { profile: true } },
            },
          },
        },
      });

      if (!approval) {
        return { success: false, error: 'Step approval not found' };
      }

      return { success: true, data: approval };
    } catch (error) {
      console.error('Error fetching step approval:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch step approval',
      };
    }
  }

  /**
   * Get all step approvals for a workflow run
   */
  async getWorkflowStepApprovals(workflowRunId: string) {
    try {
      const approvals = await prisma.workflowStepApproval.findMany({
        where: { workflowRunId },
        orderBy: { createdAt: 'asc' },
        include: {
          conversations: {
            orderBy: { timestamp: 'desc' },
            take: 1,
            include: {
              agent: { include: { profile: true } },
            },
          },
          tasks: {
            where: { status: { not: 'completed' } },
            orderBy: { priority: 'desc' },
            take: 3,
            include: {
              agent: { include: { profile: true } },
            },
          },
          _count: {
            select: {
              conversations: true,
              tasks: true,
            },
          },
        },
      });

      return { success: true, data: approvals };
    } catch (error) {
      console.error('Error fetching workflow step approvals:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch workflow step approvals',
      };
    }
  }

  /**
   * Update step approval status
   */
  async updateStepApproval(approvalId: string, input: UpdateApprovalInput) {
    try {
      const validatedInput = UpdateApprovalSchema.parse(input);

      const updateData: any = {
        ...validatedInput,
        updatedAt: new Date(),
      };

      if (validatedInput.status === 'approved') {
        updateData.approvedAt = new Date();
        updateData.rejectedAt = null;
      } else if (validatedInput.status === 'rejected') {
        updateData.rejectedAt = new Date();
        updateData.approvedAt = null;
      } else if (validatedInput.status === 'needs_revision') {
        updateData.revisionCount = { increment: 1 };
        updateData.approvedAt = null;
        updateData.rejectedAt = null;
      }

      const approval = await prisma.workflowStepApproval.update({
        where: { id: approvalId },
        data: updateData,
        include: {
          project: true,
          workflowRun: true,
          conversations: {
            orderBy: { timestamp: 'asc' },
            include: {
              agent: { include: { profile: true } },
            },
          },
          tasks: {
            orderBy: { createdAt: 'asc' },
            include: {
              agent: { include: { profile: true } },
            },
          },
        },
      });

      return { success: true, data: approval };
    } catch (error) {
      console.error('Error updating step approval:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update step approval',
      };
    }
  }

  /**
   * Add conversation message to step
   */
  async addConversationMessage(input: AddConversationMessageInput) {
    try {
      const validatedInput = AddConversationMessageSchema.parse(input);

      const message = await prisma.workflowStepConversation.create({
        data: validatedInput,
        include: {
          agent: { include: { profile: true } },
          parent: true,
          replies: {
            include: {
              agent: { include: { profile: true } },
            },
          },
        },
      });

      return { success: true, data: message };
    } catch (error) {
      console.error('Error adding conversation message:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to add conversation message',
      };
    }
  }

  /**
   * Get conversation history for a step
   */
  async getStepConversation(approvalId: string, limit = 50, offset = 0) {
    try {
      const messages = await prisma.workflowStepConversation.findMany({
        where: { approvalId },
        orderBy: { timestamp: 'asc' },
        skip: offset,
        take: limit,
        include: {
          agent: { include: { profile: true } },
          parent: true,
          replies: {
            include: {
              agent: { include: { profile: true } },
            },
          },
        },
      });

      const total = await prisma.workflowStepConversation.count({
        where: { approvalId },
      });

      return {
        success: true,
        data: {
          messages,
          total,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      console.error('Error fetching step conversation:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch step conversation',
      };
    }
  }

  /**
   * Create step task
   */
  async createStepTask(input: CreateStepTaskInput) {
    try {
      const validatedInput = CreateStepTaskSchema.parse(input);

      const task = await prisma.workflowStepTask.create({
        data: {
          ...validatedInput,
          questions: validatedInput.questions || [],
          requirements: validatedInput.requirements || [],
          deliverables: validatedInput.deliverables || [],
        },
        include: {
          agent: { include: { profile: true } },
          approval: true,
        },
      });

      return { success: true, data: task };
    } catch (error) {
      console.error('Error creating step task:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create step task',
      };
    }
  }

  /**
   * Update step task status and progress
   */
  async updateStepTask(
    taskId: string,
    updates: {
      status?:
        | 'pending'
        | 'in_progress'
        | 'completed'
        | 'blocked'
        | 'cancelled';
      progress?: number;
      assignedTo?: string;
      blockedReason?: string;
      actualTime?: number;
      metadata?: Record<string, any>;
    }
  ) {
    try {
      const updateData: any = { ...updates };

      if (updates.status === 'in_progress' && !updates.progress) {
        updateData.startedAt = new Date();
      } else if (updates.status === 'completed') {
        updateData.completedAt = new Date();
        updateData.progress = 100;
      }

      const task = await prisma.workflowStepTask.update({
        where: { id: taskId },
        data: updateData,
        include: {
          agent: { include: { profile: true } },
          approval: true,
        },
      });

      return { success: true, data: task };
    } catch (error) {
      console.error('Error updating step task:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update step task',
      };
    }
  }

  /**
   * Get step tasks with filtering
   */
  async getStepTasks(
    approvalId: string,
    filters?: {
      status?: string;
      assignedTo?: string;
      type?: string;
    }
  ) {
    try {
      const where: any = { approvalId };

      if (filters?.status) where.status = filters.status;
      if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
      if (filters?.type) where.type = filters.type;

      const tasks = await prisma.workflowStepTask.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        include: {
          agent: { include: { profile: true } },
        },
      });

      return { success: true, data: tasks };
    } catch (error) {
      console.error('Error fetching step tasks:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch step tasks',
      };
    }
  }

  /**
   * Check if step can be approved (all critical tasks completed)
   */
  async canApproveStep(approvalId: string) {
    try {
      const criticalTasks = await prisma.workflowStepTask.findMany({
        where: {
          approvalId,
          priority: 'critical',
          status: { not: 'completed' },
        },
      });

      const blockedTasks = await prisma.workflowStepTask.findMany({
        where: {
          approvalId,
          status: 'blocked',
        },
      });

      return {
        success: true,
        data: {
          canApprove: criticalTasks.length === 0 && blockedTasks.length === 0,
          pendingCriticalTasks: criticalTasks.length,
          blockedTasks: blockedTasks.length,
        },
      };
    } catch (error) {
      console.error('Error checking step approval eligibility:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check step approval eligibility',
      };
    }
  }

  /**
   * Get all approvals for a specific project
   */
  async getProjectApprovals(projectId: string) {
    try {
      const approvals = await prisma.workflowStepApproval.findMany({
        where: {
          projectId,
        },
        include: {
          conversations: {
            orderBy: {
              timestamp: 'desc',
            },
            take: 5, // Latest 5 messages per approval
          },
          tasks: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return { success: true, data: approvals || [] };
    } catch (error) {
      console.error('Error fetching project approvals:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch project approvals',
      };
    }
  }
}
