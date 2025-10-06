/**
 * Human-in-the-Loop Service
 * Manages task escalation to humans when AI agents need assistance
 * Provides workflow for human intervention, feedback collection, and task resumption
 */

import { PrismaClient } from '@prisma/client';
import { Result, MLError } from '../providers/ml-provider.interface';
import { EventEmitter } from 'events';

export interface HumanEscalationRequest {
  taskId: string;
  fromAgentId: string;
  escalationType:
    | 'clarification'
    | 'approval'
    | 'technical_issue'
    | 'business_decision';
  priority: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  context: any;
  suggestedSolution?: string;
  attachments?: string[];
  timeoutMs?: number; // Auto-resume timeout if no human response
}

export interface HumanResponse {
  assignmentId: string;
  userId: string;
  action: 'approve' | 'reject' | 'modify' | 'clarify';
  feedback: string;
  modifications?: any;
  followUpInstructions?: string;
  timestamp: Date;
}

export interface EscalationStatus {
  assignmentId: string;
  taskId: string;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'timed_out';
  assignedToUser?: string;
  createdAt: Date;
  responseDeadline?: Date;
  lastActivity?: Date;
}

export interface TaskResumptionContext {
  originalTaskId: string;
  humanFeedback: string;
  modifications?: any;
  newInstructions?: string;
  resumeFromStep?: string;
}

export class HumanInTheLoopService extends EventEmitter {
  private prisma: PrismaClient;
  private pendingEscalations: Map<string, EscalationStatus> = new Map();
  private timeoutHandlers: Map<string, any> = new Map();
  private defaultTimeoutMs = 4 * 60 * 60 * 1000; // 4 hours
  private notificationService?: any; // TODO: Integrate notification service

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.initialize();
  }

  /**
   * Escalate task to human for intervention
   */
  async escalateToHuman(
    request: HumanEscalationRequest,
    targetUserId?: string
  ): Promise<Result<string, MLError>> {
    try {
      // Validate task and authorization
      const validationResult = await this.validateEscalationRequest(request);
      if (!validationResult.success) {
        return validationResult;
      }

      // Create assignment and update task
      const assignmentResult = await this.createHumanAssignment(
        request,
        targetUserId
      );
      if (!assignmentResult.success) {
        return assignmentResult;
      }

      const assignment = assignmentResult.data;

      // Setup tracking and notifications
      await this.setupEscalationTracking(assignment, request);

      return { success: true, data: assignment.id };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ESCALATION_ERROR',
          message: 'Failed to escalate task to human',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Validate escalation request
   */
  private async validateEscalationRequest(
    request: HumanEscalationRequest
  ): Promise<Result<any, MLError>> {
    const task = await this.prisma.task.findUnique({
      where: { id: request.taskId },
      include: { assignedAgent: true },
    });

    if (!task) {
      return {
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: `Task ${request.taskId} not found`,
        },
      };
    }

    if (task.assignedAgentId !== request.fromAgentId) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED_ESCALATION',
          message: 'Agent not authorized to escalate this task',
        },
      };
    }

    return { success: true, data: task };
  }

  /**
   * Create human assignment
   */
  private async createHumanAssignment(
    request: HumanEscalationRequest,
    targetUserId?: string
  ): Promise<Result<any, MLError>> {
    const assignment = await this.prisma.taskAssignment.create({
      data: {
        taskId: request.taskId,
        fromAgentId: request.fromAgentId,
        toUserId: targetUserId,
        type: 'escalation',
        priority: request.priority,
        message: this.formatEscalationMessage(request),
        dueDate: request.timeoutMs
          ? new Date(Date.now() + request.timeoutMs)
          : new Date(Date.now() + this.defaultTimeoutMs),
        metadata: {
          escalationType: request.escalationType,
          reason: request.reason,
          context: request.context,
          suggestedSolution: request.suggestedSolution,
          attachments: request.attachments,
        },
      },
    });

    await this.prisma.task.update({
      where: { id: request.taskId },
      data: { status: 'escalated' },
    });

    return { success: true, data: assignment };
  }

  /**
   * Setup escalation tracking and notifications
   */
  private async setupEscalationTracking(
    assignment: any,
    request: HumanEscalationRequest
  ): Promise<void> {
    const escalationStatus: EscalationStatus = {
      assignmentId: assignment.id,
      taskId: request.taskId,
      status: 'pending',
      assignedToUser: assignment.toUserId,
      createdAt: new Date(),
      responseDeadline: assignment.dueDate || undefined,
    };

    this.pendingEscalations.set(assignment.id, escalationStatus);
    this.setupTimeoutHandler(
      assignment.id,
      request.timeoutMs || this.defaultTimeoutMs
    );
    await this.notifyHuman(assignment.id, request);

    this.emit('task_escalated', {
      taskId: request.taskId,
      assignmentId: assignment.id,
      escalationType: request.escalationType,
      priority: request.priority,
    });
  }

  /**
   * Human provides response to escalated task
   */
  async provideHumanResponse(
    response: HumanResponse
  ): Promise<Result<TaskResumptionContext, MLError>> {
    try {
      // Get and validate assignment
      const assignment = await this.getAssignmentWithValidation(
        response.assignmentId
      );
      if (!assignment) {
        return {
          success: false,
          error: {
            code: 'ASSIGNMENT_NOT_FOUND',
            message: `Assignment ${response.assignmentId} not found`,
          },
        };
      }

      // Update assignment and status
      await this.updateAssignmentWithResponse(response, assignment);

      // Prepare resumption context
      const resumptionContext: TaskResumptionContext = {
        originalTaskId: assignment.taskId,
        humanFeedback: response.feedback,
        modifications: response.modifications,
        newInstructions: response.followUpInstructions,
      };

      // Process the response action
      await this.processHumanResponseAction(
        response,
        assignment,
        resumptionContext
      );

      this.emit('human_response_received', {
        assignmentId: response.assignmentId,
        taskId: assignment.taskId,
        action: response.action,
        userId: response.userId,
      });

      return { success: true, data: resumptionContext };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESPONSE_PROCESSING_ERROR',
          message: 'Failed to process human response',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get assignment with validation
   */
  private async getAssignmentWithValidation(
    assignmentId: string
  ): Promise<any> {
    return this.prisma.taskAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        task: true,
        fromAgent: true,
      },
    });
  }

  /**
   * Update assignment with human response
   */
  private async updateAssignmentWithResponse(
    response: HumanResponse,
    assignment: any
  ): Promise<void> {
    await this.prisma.taskAssignment.update({
      where: { id: response.assignmentId },
      data: {
        status: response.action === 'approve' ? 'completed' : 'accepted',
        acknowledgedAt: new Date(),
        metadata: {
          ...((assignment.metadata as object) || {}),
          humanResponse: {
            action: response.action,
            feedback: response.feedback,
            modifications: response.modifications,
            followUpInstructions: response.followUpInstructions,
            timestamp: response.timestamp,
            userId: response.userId,
          },
        },
      },
    });

    // Update local status
    const escalationStatus = this.pendingEscalations.get(response.assignmentId);
    if (escalationStatus) {
      escalationStatus.status = 'resolved';
      escalationStatus.lastActivity = new Date();
      this.pendingEscalations.set(response.assignmentId, escalationStatus);
    }

    this.clearTimeoutHandler(response.assignmentId);
  }

  /**
   * Process human response action
   */
  private async processHumanResponseAction(
    response: HumanResponse,
    assignment: any,
    resumptionContext: TaskResumptionContext
  ): Promise<void> {
    switch (response.action) {
      case 'approve':
        await this.resumeTaskExecution(resumptionContext, 'approved');
        break;
      case 'reject':
        await this.rejectTask(assignment.taskId, response.feedback);
        break;
      case 'modify':
        await this.resumeTaskExecution(resumptionContext, 'modified');
        break;
      case 'clarify':
        await this.resumeTaskExecution(resumptionContext, 'clarified');
        break;
    }
  }

  /**
   * Get pending escalations for a user or globally
   */
  async getPendingEscalations(
    userId?: string
  ): Promise<Result<EscalationStatus[], MLError>> {
    try {
      const assignments = await this.prisma.taskAssignment.findMany({
        where: {
          type: 'escalation',
          status: 'pending',
          toUserId: userId,
        },
        include: {
          task: true,
          fromAgent: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const escalations = assignments.map(assignment => {
        const status = this.pendingEscalations.get(assignment.id);
        return (
          status || {
            assignmentId: assignment.id,
            taskId: assignment.taskId,
            status: 'pending' as const,
            assignedToUser: assignment.toUserId || undefined,
            createdAt: assignment.createdAt,
            responseDeadline: assignment.dueDate || undefined,
          }
        );
      });

      return { success: true, data: escalations };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_ESCALATIONS_ERROR',
          message: 'Failed to get pending escalations',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Acknowledge escalation (human has seen it)
   */
  async acknowledgeEscalation(
    assignmentId: string,
    userId: string
  ): Promise<Result<void, MLError>> {
    try {
      await this.prisma.taskAssignment.update({
        where: { id: assignmentId },
        data: {
          acknowledgedAt: new Date(),
          status: 'accepted',
        },
      });

      const escalationStatus = this.pendingEscalations.get(assignmentId);
      if (escalationStatus) {
        escalationStatus.status = 'acknowledged';
        escalationStatus.lastActivity = new Date();
        this.pendingEscalations.set(assignmentId, escalationStatus);
      }

      this.emit('escalation_acknowledged', { assignmentId, userId });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ACKNOWLEDGE_ERROR',
          message: 'Failed to acknowledge escalation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Resume task execution with human feedback
   */
  private async resumeTaskExecution(
    context: TaskResumptionContext,
    resumeType: 'approved' | 'modified' | 'clarified'
  ): Promise<void> {
    // Update task with human feedback
    await this.prisma.task.update({
      where: { id: context.originalTaskId },
      data: {
        status: 'in_progress',
        metadata: {
          humanIntervention: {
            type: resumeType,
            feedback: context.humanFeedback,
            modifications: context.modifications,
            newInstructions: context.newInstructions,
            resumedAt: new Date(),
          },
        },
      },
    });

    this.emit('task_resumed', {
      taskId: context.originalTaskId,
      resumeType,
      humanFeedback: context.humanFeedback,
    });
  }

  /**
   * Reject task based on human decision
   */
  private async rejectTask(taskId: string, reason: string): Promise<void> {
    await this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'rejected',
        metadata: {
          rejection: {
            reason,
            rejectedAt: new Date(),
          },
        },
      },
    });

    this.emit('task_rejected', { taskId, reason });
  }

  /**
   * Format escalation message for human consumption
   */
  private formatEscalationMessage(request: HumanEscalationRequest): string {
    return `🤖➡️👤 TASK ESCALATION

Type: ${request.escalationType.toUpperCase()}
Priority: ${request.priority.toUpperCase()}

Reason: ${request.reason}

${
  request.suggestedSolution
    ? `Suggested Solution: ${request.suggestedSolution}`
    : ''
}

Context: ${JSON.stringify(request.context, null, 2)}

Agent ${request.fromAgentId} needs your assistance to proceed with this task.`;
  }

  /**
   * Setup timeout handler for escalation
   */
  private setupTimeoutHandler(assignmentId: string, timeoutMs: number): void {
    const timeoutHandler = setTimeout(() => {
      this.handleEscalationTimeout(assignmentId);
    }, timeoutMs);

    this.timeoutHandlers.set(assignmentId, timeoutHandler);
  }

  /**
   * Clear timeout handler
   */
  private clearTimeoutHandler(assignmentId: string): void {
    const handler = this.timeoutHandlers.get(assignmentId);
    if (handler) {
      clearTimeout(handler);
      this.timeoutHandlers.delete(assignmentId);
    }
  }

  /**
   * Handle escalation timeout
   */
  private async handleEscalationTimeout(assignmentId: string): Promise<void> {
    try {
      const escalationStatus = this.pendingEscalations.get(assignmentId);
      if (!escalationStatus || escalationStatus.status === 'resolved') {
        return;
      }

      // Mark as timed out
      escalationStatus.status = 'timed_out';
      this.pendingEscalations.set(assignmentId, escalationStatus);

      // Update assignment
      await this.prisma.taskAssignment.update({
        where: { id: assignmentId },
        data: { status: 'rejected' },
      });

      // Resume task with default action
      await this.resumeTaskExecution(
        {
          originalTaskId: escalationStatus.taskId,
          humanFeedback:
            'AUTO-RESUMED: No human response within timeout period. Proceeding with best-effort approach.',
        },
        'approved'
      );

      this.emit('escalation_timed_out', {
        assignmentId,
        taskId: escalationStatus.taskId,
      });
    } catch (error) {
      console.error('Error handling escalation timeout:', error);
    }
  }

  /**
   * Notify human about escalation
   */
  private async notifyHuman(
    assignmentId: string,
    request: HumanEscalationRequest
  ): Promise<void> {
    // TODO: Implement actual notification service integration
    // This could send email, Slack message, Teams notification, etc.
    console.log(`📨 Human notification sent for escalation ${assignmentId}`);

    // Placeholder for notification service integration
    if (this.notificationService) {
      await this.notificationService.sendEscalationNotification(
        assignmentId,
        request
      );
    }
  }

  /**
   * Initialize the service
   */
  private async initialize(): Promise<void> {
    try {
      // Load existing pending escalations from database
      const pendingAssignments = await this.prisma.taskAssignment.findMany({
        where: {
          type: 'escalation',
          status: 'pending',
        },
      });

      for (const assignment of pendingAssignments) {
        const escalationStatus: EscalationStatus = {
          assignmentId: assignment.id,
          taskId: assignment.taskId,
          status: 'pending',
          assignedToUser: assignment.toUserId || undefined,
          createdAt: assignment.createdAt,
          responseDeadline: assignment.dueDate || undefined,
        };

        this.pendingEscalations.set(assignment.id, escalationStatus);

        // Setup timeout if still within deadline
        if (assignment.dueDate && assignment.dueDate > new Date()) {
          const remainingTime = assignment.dueDate.getTime() - Date.now();
          this.setupTimeoutHandler(assignment.id, remainingTime);
        }
      }

      console.log(
        `💁 Human-in-the-Loop service initialized with ${pendingAssignments.length} pending escalations`
      );
    } catch (error) {
      console.error('Failed to initialize Human-in-the-Loop service:', error);
    }
  }

  /**
   * Get service statistics
   */
  async getStatistics(): Promise<Result<any, MLError>> {
    try {
      const totalEscalations = await this.prisma.taskAssignment.count({
        where: { type: 'escalation' },
      });

      const pendingCount = await this.prisma.taskAssignment.count({
        where: { type: 'escalation', status: 'pending' },
      });

      const resolvedCount = await this.prisma.taskAssignment.count({
        where: { type: 'escalation', status: 'completed' },
      });

      const avgResponseTime = await this.calculateAverageResponseTime();

      return {
        success: true,
        data: {
          totalEscalations,
          pendingCount,
          resolvedCount,
          avgResponseTimeMs: avgResponseTime,
          currentlyPending: this.pendingEscalations.size,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATISTICS_ERROR',
          message: 'Failed to get statistics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Calculate average response time for resolved escalations
   */
  private async calculateAverageResponseTime(): Promise<number> {
    // TODO: Implement proper calculation based on createdAt and acknowledgedAt
    return 0;
  }
}

export default HumanInTheLoopService;
