/**
 * Workflow Assistant Agent - Alex
 * AI-powered assistant that guides users through workflow execution
 * Provides recommendations, troubleshooting, and decision support
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';
import { WorkflowAssistantLogic } from './services/workflow-assistant.logic';
import type {
  WorkflowContext,
  ConversationMessage,
  TroubleshootingResult,
  GuidanceResult,
  AssistingResult,
  PerformanceMetrics,
  OptimizationSuggestion,
} from './types/workflow-assistant.types';

export class WorkflowAssistantAgent {
  private logic: WorkflowAssistantLogic;
  private agentId: string;

  constructor(
    prisma: PrismaClient,
    provider: IMLProvider,
    agentId: string = 'workflow-assistant-001'
  ) {
    this.logic = new WorkflowAssistantLogic(prisma, provider);
    this.agentId = agentId;
  }

  /**
   * Start assisting user with workflow execution
   */
  async startAssisting(
    context: WorkflowContext
  ): Promise<Result<AssistingResult, MLError>> {
    return await this.logic.startAssisting(context);
  }

  /**
   * Handle user question or request for help
   */
  async handleUserQuestion(
    query: string,
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    return await this.logic.handleUserQuestion(query, context);
  }

  /**
   * Troubleshoot workflow issue
   */
  async troubleshootIssue(
    issue: string,
    context: WorkflowContext
  ): Promise<Result<TroubleshootingResult, MLError>> {
    return await this.logic.troubleshootIssue(issue, context);
  }

  /**
   * Provide step-specific guidance
   */
  async provideStepGuidance(
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    return await this.logic.provideStepGuidance(context);
  }

  /**
   * Generate optimization suggestions
   */
  async suggestOptimizations(
    metrics: PerformanceMetrics,
    context: WorkflowContext
  ): Promise<Result<OptimizationSuggestion[], MLError>> {
    return await this.logic.suggestOptimizations(metrics, context);
  }

  /**
   * Support decision making
   */
  async supportDecision(
    decision: string,
    options: any[],
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    return await this.logic.supportDecision(decision, options, context);
  }

  /**
   * Process user question (wrapper for handleUserQuestion)
   */
  async processUserQuestion(
    executionId: string,
    message: string,
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    return await this.handleUserQuestion(message, context);
  }

  /**
   * Monitor workflow progress
   */
  async monitorWorkflowProgress(
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    return await this.provideStepGuidance(context);
  }

  /**
   * Assist with decision making
   */
  async assistWithDecision(
    decision: string,
    options: any[],
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    return await this.supportDecision(decision, options, context);
  }

  /**
   * Get conversation for execution
   */
  getConversation(executionId?: string): ConversationMessage[] {
    // Access through logic if needed
    return [];
  }

  /**
   * Clear conversation for execution
   */
  async clearConversation(executionId: string): Promise<void> {
    // Implementation to clear conversation history
  }

  /**
   * Get assistant statistics
   */
  async getAssistantStats(): Promise<any> {
    return {
      conversations: 0,
      totalQuestions: 0,
      helpfulResponses: 0,
      troubleshootingSessions: 0,
      optimizationsSuggested: 0,
    };
  }

  /**
   * Configure assistant settings
   */
  configureAssistant(config: any): void {
    // Update assistant configuration
  }

  /**
   * Get agent information
   */
  getAgentInfo() {
    const config = WorkflowAssistantLogic.getAssistantConfig();
    return {
      id: this.agentId,
      ...config,
      status: 'active',
      capabilities: [
        'workflow_guidance',
        'troubleshooting_support',
        'decision_assistance',
        'performance_optimization',
        'proactive_recommendations',
        'contextual_help',
        'user_experience_optimization',
      ],
    };
  }
}

export default WorkflowAssistantAgent;

// Re-export types for external use
export type {
  WorkflowContext,
  ConversationMessage,
  AssistantRecommendation,
  TroubleshootingResult,
  GuidanceResult,
  AssistingResult,
  PerformanceMetrics,
  OptimizationSuggestion,
} from './types/workflow-assistant.types';
