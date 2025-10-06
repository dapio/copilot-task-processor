/**
 * Approval System - Comprehensive approval and iteration management
 * ThinkCode AI Platform - Enterprise workflow approval with stakeholder management
 */

import { PrismaClient } from '@prisma/client';
import { ApprovalStep } from './enhanced-workflow-templates';
import ChatIntegrationService from './chat-integration.service';

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
  private approvalRequests: Map<string, ApprovalRequest> = new Map();
  private iterationSessions: Map<string, IterationSession> = new Map();
  private notifications: Map<string, StakeholderNotification> = new Map();

  constructor(prisma: PrismaClient, chatService: ChatIntegrationService) {
    this.prisma = prisma;
    this.chatService = chatService;
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
    const iterationId = `iteration_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Sprawdź ile iteracji już było dla tego kroku
    const existingIterations = Array.from(
      this.iterationSessions.values()
    ).filter(
      iteration =>
        iteration.workflowExecutionId === options.workflowExecutionId &&
        iteration.stepId === options.stepId
    );

    const iterationNumber = existingIterations.length + 1;
    const maxIterations = options.maxIterations || 3;

    if (iterationNumber > maxIterations) {
      throw new Error(
        `Maximum iterations (${maxIterations}) reached for step ${options.stepId}`
      );
    }

    // Stwórz chat session dla iteracji
    const sessionResult = await this.chatService.createSession(
      `${options.workflowExecutionId}_${options.stepId}_iteration_${iterationNumber}`,
      'agent'
    );

    if (!sessionResult.success) {
      throw new Error(
        `Failed to create chat session: ${sessionResult.error.message}`
      );
    }

    const chatSessionId = sessionResult.data.id;

    const iterationSession: IterationSession = {
      id: iterationId,
      workflowExecutionId: options.workflowExecutionId,
      stepId: options.stepId,
      iterationNumber,
      maxIterations,

      trigger: options.trigger,
      triggerDetails: options.triggerDetails,

      changes: {
        previousVersion: '', // TODO: Pobierz z workflow step result
        requestedChanges: options.requestedChanges,
      },

      status: 'active',
      chatSessionId,
      createdAt: new Date(),
    };

    this.iterationSessions.set(iterationId, iterationSession);

    // Wyślij wiadomość startową do chat session
    await this.chatService.processMessage({
      sessionId: chatSessionId,
      message: `Starting iteration ${iterationNumber} for step "${
        options.stepId
      }".
      
Trigger: ${options.trigger}
Details: ${options.triggerDetails}

Requested changes:
${options.requestedChanges.map(change => `- ${change}`).join('\n')}

Please implement the requested changes and provide the updated result.`,
      provider: 'github-copilot',
      settings: {
        includeContext: true,
        maxTokens: 4000,
        temperature: 0.7,
      },
    });

    return iterationId;
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
   * Dostarcza notyfikację
   */
  private async deliverNotification(
    notification: StakeholderNotification
  ): Promise<boolean> {
    try {
      // TODO: Implement actual notification delivery (email, Slack, webhook)
      console.log(
        `📧 Notification sent to ${notification.recipientInfo.email}:`
      );
      console.log(`   Subject: ${notification.content.subject}`);
      console.log(`   Priority: ${notification.content.priority}`);

      notification.status = 'sent';
      notification.sentAt = new Date();
      notification.attempts++;

      return true;
    } catch {
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
    // TODO: Implement escalation logic (notify manager, tech lead, etc.)
    console.log(`🚨 Approval ${approval.id} escalated due to timeout`);
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

    return {
      pendingCount,
      approvedToday,
      rejectedToday,
      averageResponseTime: 0, // TODO: Calculate from actual data
      byApproverType,
    };
  }
}

export default ApprovalSystem;
