/**
 * Workflow Step Control Service
 * Integrates step approval system with workflow engine
 */

import { PrismaClient } from '@prisma/client';
import { WorkflowStepApprovalService } from './workflow-step-approval.service';
import { AgentProfileService } from './agent-profile.service';
import { webSocketService, WorkflowUpdate } from './websocket.service';

const prisma = new PrismaClient();

export interface StepControlInput {
  projectId: string;
  workflowRunId: string;
  stepId: string;
  action: 'start' | 'approve' | 'reject' | 'request_revision';
  comments?: string;
  userId?: string;
}

export interface WorkflowStepInfo {
  id: string;
  stepName: string;
  stepNumber: number;
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'needs_revision'
    | 'running'
    | 'completed';
  isActive: boolean;
  canProceed: boolean;
  hasActivity: boolean;
  assignedAgents: any[];
  conversationCount: number;
  taskCount: number;
  lastActivity: string;
  description?: string;
  workflowRunId: string;
  approvalId?: string;
}

export class WorkflowStepControlService {
  private approvalService: WorkflowStepApprovalService;
  private agentService: AgentProfileService;

  constructor() {
    this.approvalService = new WorkflowStepApprovalService();
    this.agentService = new AgentProfileService();
  }

  /**
   * Get workflow steps information with approval status
   */
  async getWorkflowSteps(projectId: string, workflowRunId: string) {
    try {
      // Get workflow run details
      const workflowRun = await prisma.workflowRun.findUnique({
        where: { id: workflowRunId },
        include: {
          workflow: true,
          project: true,
        },
      });

      if (!workflowRun) {
        return {
          success: false,
          error: 'Workflow run not found',
        };
      }

      // Get all approvals for this workflow run
      const approvalsResult =
        await this.approvalService.getWorkflowStepApprovals(workflowRunId);
      if (!approvalsResult.success) {
        return {
          success: false,
          error: 'Failed to fetch step approvals',
        };
      }

      const approvals = approvalsResult.data || [];
      const approvalMap = new Map(
        approvals.map(approval => [approval.stepId, approval])
      );

      // Get agents for this project
      const agentsResult = await this.agentService.getAgentsByProject(
        projectId
      );
      const agents = agentsResult.success ? agentsResult.data || [] : [];

      // Parse workflow steps from JSON
      const workflowSteps = Array.isArray(workflowRun.workflow.steps)
        ? (workflowRun.workflow.steps as any[])
        : [];

      // Build step information
      const stepsInfo: WorkflowStepInfo[] = workflowSteps.map(
        (step: any, index: number) => {
          const approval = approvalMap.get(step.id);
          const stepAgents = agents.filter(
            agent =>
              agent.profile?.specialties &&
              JSON.parse(JSON.stringify(agent.profile?.specialties || [])).some(
                (specialty: string) =>
                  step.requiredCapabilities?.includes(specialty)
              )
          );

          return {
            id: step.id,
            stepName: step.name,
            stepNumber: step.stepNumber || index + 1,
            status: (approval?.status as any) || 'pending',
            isActive: workflowRun.currentStep === index,
            canProceed: approval?.status === 'approved',
            hasActivity: !!approval,
            assignedAgents: stepAgents.map(agent => ({
              id: agent.id,
              name: agent.name,
              type: agent.type,
              profile: agent.profile,
            })),
            conversationCount: approval?.conversations?.length || 0,
            taskCount: approval?.tasks?.length || 0,
            lastActivity: approval?.updatedAt?.toISOString() || '',
            description: step.description,
            workflowRunId,
            approvalId: approval?.id,
          };
        }
      );

      return { success: true, data: stepsInfo };
    } catch (error) {
      console.error('Error fetching workflow steps:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch workflow steps',
      };
    }
  }

  /**
   * Start a workflow step
   */
  async startStep(input: StepControlInput) {
    try {
      // Check if approval already exists
      const existingApprovals =
        await this.approvalService.getWorkflowStepApprovals(
          input.workflowRunId
        );
      if (!existingApprovals.success) {
        return {
          success: false,
          error: 'Failed to check existing approvals',
        };
      }

      const existingApproval = existingApprovals.data?.find(
        a => a.stepId === input.stepId
      );

      if (existingApproval) {
        return { success: true, data: existingApproval };
      }

      // Get workflow step details
      const workflowRun = await prisma.workflowRun.findUnique({
        where: { id: input.workflowRunId },
        include: {
          workflow: true,
        },
      });

      if (!workflowRun) {
        return {
          success: false,
          error: 'Workflow run not found',
        };
      }

      const workflowSteps = Array.isArray(workflowRun.workflow.steps)
        ? (workflowRun.workflow.steps as any[])
        : [];
      const step = workflowSteps.find((s: any) => s.id === input.stepId);
      if (!step) {
        return {
          success: false,
          error: 'Workflow step not found',
        };
      }

      // Create new approval
      const createResult = await this.approvalService.createStepApproval({
        projectId: input.projectId,
        workflowRunId: input.workflowRunId,
        stepId: input.stepId,
        stepName: step.name,
      });

      if (!createResult.success) {
        return {
          success: false,
          error: createResult.error || 'Failed to create step approval',
        };
      }

      // Send WebSocket notification for step started
      webSocketService.sendWorkflowUpdate({
        workflowId: input.workflowRunId,
        projectId: input.projectId,
        stepId: input.stepId,
        agentId: 'system',
        status: 'started',
        message: `Step "${step.name}" has been started`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, data: createResult.data };
    } catch (error) {
      console.error('Error starting workflow step:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start workflow step',
      };
    }
  }

  /**
   * Approve a workflow step
   */
  async approveStep(input: StepControlInput) {
    try {
      // Get the approval
      const approvalsResult =
        await this.approvalService.getWorkflowStepApprovals(
          input.workflowRunId
        );
      if (!approvalsResult.success) {
        return {
          success: false,
          error: 'Failed to fetch step approvals',
        };
      }

      const approval = approvalsResult.data?.find(
        a => a.stepId === input.stepId
      );
      if (!approval) {
        return {
          success: false,
          error: 'Step approval not found',
        };
      }

      // Update approval status
      const updateResult = await this.approvalService.updateStepApproval(
        approval.id,
        {
          status: 'approved',
          approvedBy: input.userId || 'system',
          comments: input.comments,
        }
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to approve step',
        };
      }

      // Send WebSocket notification for step approved
      webSocketService.sendWorkflowUpdate({
        workflowId: input.workflowRunId,
        projectId: input.projectId,
        stepId: input.stepId,
        agentId: input.userId || 'system',
        status: 'completed',
        message: `Step has been approved${
          input.comments ? `: ${input.comments}` : ''
        }`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, data: updateResult.data };
    } catch (error) {
      console.error('Error approving workflow step:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to approve workflow step',
      };
    }
  }

  /**
   * Reject a workflow step
   */
  async rejectStep(input: StepControlInput) {
    try {
      // Get the approval
      const approvalsResult =
        await this.approvalService.getWorkflowStepApprovals(
          input.workflowRunId
        );
      if (!approvalsResult.success) {
        return {
          success: false,
          error: 'Failed to fetch step approvals',
        };
      }

      const approval = approvalsResult.data?.find(
        a => a.stepId === input.stepId
      );
      if (!approval) {
        return {
          success: false,
          error: 'Step approval not found',
        };
      }

      // Update approval status
      const updateResult = await this.approvalService.updateStepApproval(
        approval.id,
        {
          status: 'rejected',
          approvedBy: input.userId || 'system',
          comments: input.comments,
        }
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to reject step',
        };
      }

      // Send WebSocket notification for step rejected
      webSocketService.sendWorkflowUpdate({
        workflowId: input.workflowRunId,
        projectId: input.projectId,
        stepId: input.stepId,
        agentId: input.userId || 'system',
        status: 'error',
        message: `Step has been rejected${
          input.comments ? `: ${input.comments}` : ''
        }`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, data: updateResult.data };
    } catch (error) {
      console.error('Error rejecting workflow step:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to reject workflow step',
      };
    }
  }

  /**
   * Request revision for a workflow step
   */
  async requestRevision(input: StepControlInput) {
    try {
      // Get the approval
      const approvalsResult =
        await this.approvalService.getWorkflowStepApprovals(
          input.workflowRunId
        );
      if (!approvalsResult.success) {
        return {
          success: false,
          error: 'Failed to fetch step approvals',
        };
      }

      const approval = approvalsResult.data?.find(
        a => a.stepId === input.stepId
      );
      if (!approval) {
        return {
          success: false,
          error: 'Step approval not found',
        };
      }

      // Update approval status
      const updateResult = await this.approvalService.updateStepApproval(
        approval.id,
        {
          status: 'needs_revision',
          approvedBy: input.userId || 'system',
          comments: input.comments,
        }
      );

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to request revision',
        };
      }

      // Increment revision count
      await prisma.workflowStepApproval.update({
        where: { id: approval.id },
        data: {
          revisionCount: {
            increment: 1,
          },
        },
      });

      // Send WebSocket notification for revision requested
      webSocketService.sendWorkflowUpdate({
        workflowId: input.workflowRunId,
        projectId: input.projectId,
        stepId: input.stepId,
        agentId: input.userId || 'system',
        status: 'in-progress',
        message: `Revision requested for step${
          input.comments ? `: ${input.comments}` : ''
        }`,
        timestamp: new Date().toISOString(),
      });

      return { success: true, data: updateResult.data };
    } catch (error) {
      console.error('Error requesting workflow step revision:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to request workflow step revision',
      };
    }
  }

  /**
   * Get workflow status summary
   */
  async getWorkflowStatus(projectId: string, workflowRunId: string) {
    try {
      const workflowRun = await prisma.workflowRun.findUnique({
        where: { id: workflowRunId },
        include: {
          workflow: true,
        },
      });

      if (!workflowRun) {
        return {
          success: false,
          error: 'Workflow run not found',
        };
      }

      // Check if there's an active workflow
      const hasActiveWorkflow =
        workflowRun.status === 'running' || workflowRun.status === 'paused';
      const workflowSteps = Array.isArray(workflowRun.workflow.steps)
        ? (workflowRun.workflow.steps as any[])
        : [];
      const currentStep = workflowSteps[workflowRun.currentStep || 0];

      return {
        success: true,
        data: {
          hasActiveWorkflow,
          workflowRunId,
          currentStep: currentStep
            ? {
                id: currentStep.id,
                name: currentStep.name,
                stepNumber: currentStep.stepNumber,
                description: currentStep.description,
              }
            : null,
        },
      };
    } catch (error) {
      console.error('Error getting workflow status:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get workflow status',
      };
    }
  }
}
