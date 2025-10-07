/**
 * Approval System - Comprehensive approval and iteration management
 * ThinkCode AI Platform - Enterprise workflow approval with stakeholder management
 */

import { PrismaClient } from '@prisma/client';
import { ApprovalStep } from './enhanced-workflow-templates';
import ChatIntegrationService from './chat-integration.service';
import { NotificationService } from './notification.service';

export interface ApprovalRequest {
  id: string;
  workflowExecutionId: string;
  stepId: string;
  stepName: string;
  approverType: ApprovalStep['approverType'];
  status: 'pending' | 'approved' | 'rejected' | 'timeout' | 'escalated';

  // Approval content
  content: {
    title: string;
    description: string;
    artifactsToReview: {
      type: 'code' | 'mockup' | 'document' | 'design' | 'architecture';
      content: string;
      metadata?: Record<string, any>;
    }[];
    reviewCriteria: ApprovalStep['reviewCriteria'];
    contextInformation: string;
  };

  // Approval metadata
  timeoutAt?: Date;
  fallbackAction?: ApprovalStep['fallbackAction'];
  approverInfo?: {
    userId?: string;
    email?: string;
    role?: string;
  };

  // Response
  response?: {
    decision: 'approved' | 'rejected';
    feedback: string;
    suggestedChanges?: string[];
    iterationRequired?: boolean;
    approvedAt: Date;
    approvedBy: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface IterationSession {
  id: string;
  workflowExecutionId: string;
  stepId: string;
  iterationNumber: number;
  maxIterations: number;

  trigger: 'user_feedback' | 'validation_failed' | 'approval_rejected';
  triggerDetails: string;

  changes: {
    previousVersion: string;
    requestedChanges: string[];
    implementedChanges?: string[];
    newVersion?: string;
  };

  status: 'active' | 'completed' | 'failed' | 'max_iterations_reached';

  chatSessionId?: string; // For interactive feedback

  createdAt: Date;
  completedAt?: Date;
}

export interface StakeholderNotification {
  id: string;
  type:
    | 'approval_request'
    | 'iteration_started'
    | 'workflow_completed'
    | 'escalation';
  recipientType: ApprovalStep['approverType'];
  recipientInfo: {
    userId?: string;
    email?: string;
    slackChannel?: string;
    webhookUrl?: string;
  };

  content: {
    subject: string;
    message: string;
    actionUrl?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };

  status: 'pending' | 'sent' | 'delivered' | 'failed';
  attempts: number;
  maxAttempts: number;

  createdAt: Date;
  sentAt?: Date;
}

export class ApprovalSystem {
  private prisma: PrismaClient;
  private chatService: ChatIntegrationService;
  private notificationService: NotificationService;
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private iterationSessions: Map<string, IterationSession> = new Map();
  private notifications: Map<string, StakeholderNotification> = new Map();

  constructor(prisma: PrismaClient, chatService: ChatIntegrationService) {
    this.prisma = prisma;
    this.chatService = chatService;
    this.notificationService = new NotificationService(prisma);
    this.startApprovalTimeoutChecker();
  }

  // === Approval Management ===

  /**
   * Tworzy nowy request do zatwierdzenia
   */
  async createApprovalRequest(options: {
    workflowExecutionId: string;
    stepId: string;
    stepName: string;
    approvalConfig: ApprovalStep;
    artifactsToReview: ApprovalRequest['content']['artifactsToReview'];
    contextInformation: string;
    approverInfo?: ApprovalRequest['approverInfo'];
  }): Promise<string> {
    const approvalId = `approval_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const timeoutAt = options.approvalConfig.timeoutMinutes
      ? new Date(Date.now() + options.approvalConfig.timeoutMinutes * 60 * 1000)
      : undefined;

    const approvalRequest: ApprovalRequest = {
      id: approvalId,
      workflowExecutionId: options.workflowExecutionId,
      stepId: options.stepId,
      stepName: options.stepName,
      approverType: options.approvalConfig.approverType,
      status: 'pending',

      content: {
        title: `Approval Required: ${options.stepName}`,
        description: `Please review and approve the ${options.stepName} step in workflow execution ${options.workflowExecutionId}`,
        artifactsToReview: options.artifactsToReview,
        reviewCriteria: options.approvalConfig.reviewCriteria,
        contextInformation: options.contextInformation,
      },

      timeoutAt,
      fallbackAction: options.approvalConfig.fallbackAction,
      approverInfo: options.approverInfo,

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.approvalRequests.set(approvalId, approvalRequest);

    // Wyślij notyfikację do approver'a
    await this.sendApprovalNotification(approvalRequest);

    return approvalId;
  }

  /**
   * Przetwarza odpowiedź na request zatwierdzenia
   */
  async processApprovalResponse(
    approvalId: string,
    response: {
      decision: 'approved' | 'rejected';
      feedback: string;
      suggestedChanges?: string[];
      iterationRequired?: boolean;
      approvedBy: string;
    }
  ): Promise<{
    success: boolean;
    nextAction: 'continue' | 'iterate' | 'stop';
    iterationSessionId?: string;
  }> {
    const approval = this.approvalRequests.get(approvalId);
    if (!approval || approval.status !== 'pending') {
      return { success: false, nextAction: 'stop' };
    }

    approval.response = {
      ...response,
      approvedAt: new Date(),
    };
    approval.status =
      response.decision === 'approved' ? 'approved' : 'rejected';
    approval.updatedAt = new Date();

    if (response.decision === 'approved') {
      return { success: true, nextAction: 'continue' };
    }

    // Jeśli odrzucone i iteracja jest wymagana
    if (response.iterationRequired) {
      const iterationId = await this.startIteration({
        workflowExecutionId: approval.workflowExecutionId,
        stepId: approval.stepId,
        trigger: 'approval_rejected',
        triggerDetails: `Approval rejected by ${response.approvedBy}: ${response.feedback}`,
        requestedChanges: response.suggestedChanges || [response.feedback],
      });

      return {
        success: true,
        nextAction: 'iterate',
        iterationSessionId: iterationId,
      };
    }

    return { success: true, nextAction: 'stop' };
  }

  /**
   * Pobiera status approval request
   */
  async getApprovalStatus(approvalId: string): Promise<ApprovalRequest | null> {
    return this.approvalRequests.get(approvalId) || null;
  }

  /**
   * Pobiera wszystkie pending approvals dla workflow
   */
  async getPendingApprovals(
    workflowExecutionId: string
  ): Promise<ApprovalRequest[]> {
    return Array.from(this.approvalRequests.values()).filter(
      approval =>
        approval.workflowExecutionId === workflowExecutionId &&
        approval.status === 'pending'
    );
  }

  // === Iteration Management ===

  /**
   * Rozpoczyna nową iterację
   */
  async startIteration(options: {
    workflowExecutionId: string;
    stepId: string;
    trigger: IterationSession['trigger'];
    triggerDetails: string;
    requestedChanges: string[];
    maxIterations?: number;
  }): Promise<string> {
    const iterationId = this.generateIterationId();
    const { iterationNumber, maxIterations } =
      await this.validateIterationLimits(
        options.workflowExecutionId,
        options.stepId,
        options.maxIterations
      );

    const chatSessionId = await this.createIterationChatSession(
      options.workflowExecutionId,
      options.stepId,
      iterationNumber
    );

    const iterationSession = await this.createIterationSession(
      iterationId,
      options,
      iterationNumber,
      maxIterations,
      chatSessionId
    );

    this.iterationSessions.set(iterationId, iterationSession);

    await this.sendIterationStartMessage(
      chatSessionId,
      iterationNumber,
      options
    );

    return iterationId;
  }

  /**
   * Generate unique iteration ID
   */
  private generateIterationId(): string {
    return `iteration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate iteration limits and get current iteration number
   */
  private async validateIterationLimits(
    workflowExecutionId: string,
    stepId: string,
    maxIterations?: number
  ): Promise<{ iterationNumber: number; maxIterations: number }> {
    const existingIterations = Array.from(
      this.iterationSessions.values()
    ).filter(
      iteration =>
        iteration.workflowExecutionId === workflowExecutionId &&
        iteration.stepId === stepId
    );

    const iterationNumber = existingIterations.length + 1;
    const maxIterationsLimit = maxIterations || 3;

    if (iterationNumber > maxIterationsLimit) {
      throw new Error(
        `Maximum iterations (${maxIterationsLimit}) reached for step ${stepId}`
      );
    }

    return { iterationNumber, maxIterations: maxIterationsLimit };
  }

  /**
   * Create chat session for iteration
   */
  private async createIterationChatSession(
    workflowExecutionId: string,
    stepId: string,
    iterationNumber: number
  ): Promise<string> {
    const sessionResult = await this.chatService.createSession(
      `${workflowExecutionId}_${stepId}_iteration_${iterationNumber}`,
      'agent'
    );

    if (!sessionResult.success) {
      throw new Error(
        `Failed to create chat session: ${sessionResult.error.message}`
      );
    }

    return sessionResult.data.id;
  }

  /**
   * Create iteration session object
   */
  private async createIterationSession(
    iterationId: string,
    options: any,
    iterationNumber: number,
    maxIterations: number,
    chatSessionId: string
  ): Promise<IterationSession> {
    return {
      id: iterationId,
      workflowExecutionId: options.workflowExecutionId,
      stepId: options.stepId,
      iterationNumber,
      maxIterations,

      trigger: options.trigger,
      triggerDetails: options.triggerDetails,

      changes: {
        previousVersion: await this.getPreviousStepVersion(
          options.workflowExecutionId,
          options.stepId
        ),
        requestedChanges: options.requestedChanges,
      },

      status: 'active',
      chatSessionId,
      createdAt: new Date(),
    };
  }

  /**
   * Send iteration start message to chat session
   */
  private async sendIterationStartMessage(
    chatSessionId: string,
    iterationNumber: number,
    options: any
  ): Promise<void> {
    await this.chatService.processMessage({
      sessionId: chatSessionId,
      message: `Starting iteration ${iterationNumber} for step "${
        options.stepId
      }".
      
Trigger: ${options.trigger}
Details: ${options.triggerDetails}

Requested changes:
${options.requestedChanges.map((change: string) => `- ${change}`).join('\n')}

Please implement the requested changes and provide the updated result.`,
      provider: 'github-copilot',
      settings: {
        includeContext: true,
        maxTokens: 4000,
        temperature: 0.7,
      },
    });
  }

  /**
   * Aktualizuje iterację z nowymi zmianami
   */
  async updateIteration(
    iterationId: string,
    changes: {
      implementedChanges: string[];
      newVersion: string;
    }
  ): Promise<boolean> {
    const iteration = this.iterationSessions.get(iterationId);
    if (!iteration || iteration.status !== 'active') {
      return false;
    }

    iteration.changes.implementedChanges = changes.implementedChanges;
    iteration.changes.newVersion = changes.newVersion;
    iteration.status = 'completed';
    iteration.completedAt = new Date();

    return true;
  }

  /**
   * Kończy iterację
   */
  async completeIteration(
    iterationId: string,
    success: boolean = true
  ): Promise<boolean> {
    const iteration = this.iterationSessions.get(iterationId);
    if (!iteration) {
      return false;
    }

    iteration.status = success ? 'completed' : 'failed';
    iteration.completedAt = new Date();

    return true;
  }

  /**
   * Pobiera status iteracji
   */
  async getIterationStatus(
    iterationId: string
  ): Promise<IterationSession | null> {
    return this.iterationSessions.get(iterationId) || null;
  }

  /**
   * Pobiera wszystkie iteracje dla kroku workflow
   */
  async getStepIterations(
    workflowExecutionId: string,
    stepId: string
  ): Promise<IterationSession[]> {
    return Array.from(this.iterationSessions.values())
      .filter(
        iteration =>
          iteration.workflowExecutionId === workflowExecutionId &&
          iteration.stepId === stepId
      )
      .sort((a, b) => a.iterationNumber - b.iterationNumber);
  }

  // === Notification System ===

  /**
   * Wysyła notyfikację o approval request
   */
  private async sendApprovalNotification(
    approval: ApprovalRequest
  ): Promise<void> {
    const notificationId = `notif_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const notification: StakeholderNotification = {
      id: notificationId,
      type: 'approval_request',
      recipientType: approval.approverType,
      recipientInfo: {
        email:
          approval.approverInfo?.email ||
          `${approval.approverType}@company.com`,
        userId: approval.approverInfo?.userId,
      },

      content: {
        subject: `Approval Required: ${approval.content.title}`,
        message: `${approval.content.description}
        
Review Criteria:
${this.formatReviewCriteria(approval.content.reviewCriteria)}

Please review the attached artifacts and provide your decision.`,
        actionUrl: `/approvals/${approval.id}`,
        priority: 'medium',
      },

      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.notifications.set(notificationId, notification);
    await this.deliverNotification(notification);
  }

  /**
   * Dostarcza notyfikację używając NotificationService
   */
  private async deliverNotification(
    notification: StakeholderNotification
  ): Promise<boolean> {
    try {
      // Determine notification type based on available recipient info
      let notificationType: 'email' | 'slack' | 'webhook' = 'email';
      const recipient: any = {};

      if (notification.recipientInfo.email) {
        notificationType = 'email';
        recipient.email = notification.recipientInfo.email;
      } else if (notification.recipientInfo.slackChannel) {
        notificationType = 'slack';
        recipient.slackChannel = notification.recipientInfo.slackChannel;
      } else if (notification.recipientInfo.webhookUrl) {
        notificationType = 'webhook';
        recipient.webhookUrl = notification.recipientInfo.webhookUrl;
      }

      // Send through unified NotificationService
      const result = await this.notificationService.sendNotification({
        type: notificationType,
        recipient,
        content: {
          subject: notification.content.subject,
          message: notification.content.message,
          priority: notification.content.priority as
            | 'low'
            | 'medium'
            | 'high'
            | 'urgent',
          actionUrl: notification.content.actionUrl,
        },
        options: {
          retryAttempts: notification.maxAttempts - notification.attempts,
        },
      });

      if (result.success) {
        notification.status = 'delivered';
        notification.sentAt = new Date();
        notification.attempts++;
        return true;
      } else {
        notification.status = 'failed';
        notification.attempts++;
        console.error(`Notification delivery failed: ${result.error.message}`);
        return false;
      }
    } catch (error) {
      console.error('Error delivering notification:', error);
      notification.status = 'failed';
      notification.attempts++;

      if (notification.attempts < notification.maxAttempts) {
        // Ponów próbę za 5 minut
        setTimeout(() => {
          this.deliverNotification(notification);
        }, 5 * 60 * 1000);
      }

      return false;
    }
  }

  /**
   * Formatuje kryteria review
   */
  private formatReviewCriteria(
    criteria: ApprovalStep['reviewCriteria']
  ): string {
    let formatted = '';

    if (criteria.technical?.length) {
      formatted += `Technical: ${criteria.technical.join(', ')}\n`;
    }
    if (criteria.business?.length) {
      formatted += `Business: ${criteria.business.join(', ')}\n`;
    }
    if (criteria.design?.length) {
      formatted += `Design: ${criteria.design.join(', ')}\n`;
    }
    if (criteria.security?.length) {
      formatted += `Security: ${criteria.security.join(', ')}\n`;
    }

    return formatted;
  }

  // === Timeout Management ===

  /**
   * Sprawdza i przetwarza timeout'y dla approval requests
   */
  private startApprovalTimeoutChecker(): void {
    setInterval(() => {
      const now = new Date();

      for (const approval of this.approvalRequests.values()) {
        if (
          approval.status === 'pending' &&
          approval.timeoutAt &&
          now > approval.timeoutAt
        ) {
          this.handleApprovalTimeout(approval);
        }
      }
    }, 60 * 1000); // Sprawdzaj co minutę
  }

  /**
   * Obsługuje timeout approval request
   */
  private async handleApprovalTimeout(
    approval: ApprovalRequest
  ): Promise<void> {
    approval.status = 'timeout';
    approval.updatedAt = new Date();

    switch (approval.fallbackAction) {
      case 'auto_approve':
        approval.status = 'approved';
        approval.response = {
          decision: 'approved',
          feedback: 'Auto-approved due to timeout',
          approvedAt: new Date(),
          approvedBy: 'system',
        };
        break;

      case 'auto_reject':
        approval.status = 'rejected';
        approval.response = {
          decision: 'rejected',
          feedback: 'Auto-rejected due to timeout',
          approvedAt: new Date(),
          approvedBy: 'system',
        };
        break;

      case 'escalate':
        approval.status = 'escalated';
        await this.escalateApproval(approval);
        break;
    }
  }

  /**
   * Eskaluje approval do wyższego poziomu
   */
  private async escalateApproval(approval: ApprovalRequest): Promise<void> {
    console.log(`🚨 Escalating approval ${approval.id} due to timeout`);

    // Determine escalation hierarchy
    const escalationTarget = this.getEscalationTarget(approval.approverType);

    if (!escalationTarget) {
      console.warn(`No escalation target found for ${approval.approverType}`);
      return;
    }

    // Create escalation notification
    const escalationId = `escalation_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const escalationNotification: StakeholderNotification = {
      id: escalationId,
      type: 'escalation',
      recipientType: escalationTarget.type,
      recipientInfo: {
        userId: escalationTarget.userId,
        email: escalationTarget.email,
        slackChannel: escalationTarget.slackChannel,
      },
      content: {
        subject: `ESCALATED: ${approval.content.title}`,
        message:
          `An approval request has been escalated to you due to timeout.\n\n` +
          `Original Request: ${approval.content.title}\n` +
          `Description: ${approval.content.description}\n` +
          `Original Approver: ${approval.approverType}\n` +
          `Created: ${approval.createdAt.toISOString()}\n` +
          `Timeout: ${approval.timeoutAt?.toISOString() || 'N/A'}\n\n` +
          `Please review and take action immediately.`,
        actionUrl: `${
          process.env.FRONTEND_URL || 'http://localhost:3001'
        }/approvals/${approval.id}`,
        priority: 'urgent',
      },
      status: 'pending',
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date(),
    };

    // Send escalation notification
    this.notifications.set(escalationId, escalationNotification);
    await this.deliverNotification(escalationNotification);

    // Update approval to reflect escalation
    approval.approverType = escalationTarget.type;
    approval.approverInfo = {
      userId: escalationTarget.userId,
      email: escalationTarget.email,
      role: escalationTarget.name || `Escalated ${escalationTarget.type}`,
    };

    // Extend timeout for escalated approval
    if (approval.timeoutAt) {
      approval.timeoutAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    }

    console.log(
      `✅ Approval ${approval.id} escalated to ${escalationTarget.type}`
    );
  }

  /**
   * Get escalation target based on current approver type
   */
  private getEscalationTarget(
    currentApproverType: ApprovalStep['approverType']
  ): {
    type: ApprovalStep['approverType'];
    userId?: string;
    email?: string;
    slackChannel?: string;
    name?: string;
  } | null {
    // Define escalation hierarchy
    const escalationHierarchy: Record<string, any> = {
      human_reviewer: {
        type: 'tech_lead',
        email: process.env.TECH_LEAD_EMAIL || 'tech-lead@company.com',
        slackChannel: '#tech-leads',
        name: 'Tech Lead',
      },
      business_analyst: {
        type: 'project_manager',
        email: process.env.PROJECT_MANAGER_EMAIL || 'pm@company.com',
        slackChannel: '#project-managers',
        name: 'Project Manager',
      },
      tech_lead: {
        type: 'engineering_manager',
        email: process.env.ENGINEERING_MANAGER_EMAIL || 'em@company.com',
        slackChannel: '#engineering-managers',
        name: 'Engineering Manager',
      },
      project_manager: {
        type: 'senior_stakeholder',
        email: process.env.SENIOR_STAKEHOLDER_EMAIL || 'senior@company.com',
        slackChannel: '#senior-leadership',
        name: 'Senior Stakeholder',
      },
    };

    return escalationHierarchy[currentApproverType] || null;
  }

  // === Public API Methods ===

  /**
   * Pobiera wszystkie pending approvals dla użytkownika
   */
  async getUserPendingApprovals(
    userType: ApprovalStep['approverType']
  ): Promise<ApprovalRequest[]> {
    return Array.from(this.approvalRequests.values()).filter(
      approval =>
        approval.approverType === userType && approval.status === 'pending'
    );
  }

  /**
   * Pobiera dashboard data dla approvals
   */
  async getApprovalDashboard(): Promise<{
    pendingCount: number;
    approvedToday: number;
    rejectedToday: number;
    averageResponseTime: number;
    byApproverType: Record<string, number>;
  }> {
    const allApprovals = Array.from(this.approvalRequests.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingCount = allApprovals.filter(
      a => a.status === 'pending'
    ).length;
    const approvedToday = allApprovals.filter(
      a =>
        a.status === 'approved' &&
        a.response?.approvedAt &&
        a.response.approvedAt >= today
    ).length;
    const rejectedToday = allApprovals.filter(
      a =>
        a.status === 'rejected' &&
        a.response?.approvedAt &&
        a.response.approvedAt >= today
    ).length;

    const byApproverType = allApprovals.reduce((acc, approval) => {
      if (approval.status === 'pending') {
        acc[approval.approverType] = (acc[approval.approverType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate average response time from completed approvals
    const completedApprovals = allApprovals.filter(
      a => a.status !== 'pending' && a.response?.approvedAt
    );

    let averageResponseTime = 0;
    if (completedApprovals.length > 0) {
      const totalResponseTime = completedApprovals.reduce((sum, approval) => {
        if (approval.response?.approvedAt) {
          return (
            sum +
            (approval.response.approvedAt.getTime() -
              approval.createdAt.getTime())
          );
        }
        return sum;
      }, 0);
      averageResponseTime =
        totalResponseTime / completedApprovals.length / (1000 * 60); // Convert to minutes
    }

    return {
      pendingCount,
      approvedToday,
      rejectedToday,
      averageResponseTime,
      byApproverType,
    };
  }

  /**
   * Get previous step version from workflow execution results
   */
  private async getPreviousStepVersion(
    workflowExecutionId: string,
    stepId: string
  ): Promise<string> {
    try {
      // Try to get from database first
      const execution = await this.prisma.workflowExecution.findUnique({
        where: { id: workflowExecutionId },
      });

      if (execution?.result) {
        const result = execution.result as any;
        // Try to extract step-specific result
        const stepResult =
          result?.steps?.[stepId] || result?.stepResults?.[stepId];
        if (stepResult) {
          return (
            stepResult.artifacts?.[0] ||
            stepResult.output ||
            JSON.stringify(stepResult)
          );
        }
        // If no step-specific result, return general result
        return result.artifacts?.[0] || result.output || JSON.stringify(result);
      }

      // Fallback to checking iteration sessions for previous versions
      const relatedIterations = Array.from(this.iterationSessions.values())
        .filter(
          session =>
            session.workflowExecutionId === workflowExecutionId &&
            session.stepId === stepId &&
            session.status === 'completed'
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      if (relatedIterations.length > 0) {
        return relatedIterations[0].changes.previousVersion;
      }

      return 'No previous version available';
    } catch (error) {
      console.error('Error retrieving previous step version:', error);
      return 'Error retrieving previous version';
    }
  }

  // Notification methods moved to NotificationService for better modularity
}

export default ApprovalSystem;
