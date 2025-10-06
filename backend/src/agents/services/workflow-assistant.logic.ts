/**
 * Workflow Assistant Agent Business Logic
 * Core business operations for workflow assistance
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../../providers/ml-provider.interface';
import type {
  WorkflowContext,
  ConversationMessage,
  AssistantRecommendation,
  WorkflowAnalysis,
  TroubleshootingResult,
  GuidanceResult,
  AssistingResult,
  PerformanceMetrics,
  OptimizationSuggestion,
  AssistantConfig,
} from '../types/workflow-assistant.types';
import { WorkflowAssistantPrompts } from '../prompts/workflow-assistant.prompts';

export class WorkflowAssistantLogic {
  private prisma: PrismaClient;
  private provider: IMLProvider;
  private conversations: Map<string, ConversationMessage[]> = new Map();

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Start assisting user with workflow execution
   */
  async startAssisting(
    context: WorkflowContext
  ): Promise<Result<AssistingResult, MLError>> {
    try {
      // Analyze workflow and user
      const analysis = await this.analyzeWorkflowAndUser(context);
      if (!analysis.success) return analysis;

      // Generate welcome message
      const welcomeMessage = await this.generateWelcomeMessage(
        context,
        analysis.data
      );
      if (!welcomeMessage.success) return welcomeMessage;

      // Generate initial recommendations
      const recommendations = await this.generateInitialRecommendations(
        context
      );
      if (!recommendations.success) return recommendations;

      const conversation = [welcomeMessage.data];
      this.conversations.set(context.executionId, conversation);

      return {
        success: true,
        data: {
          conversation,
          recommendations: recommendations.data,
          nextSuggestedActions: this.extractActionSuggestions(
            recommendations.data
          ),
        },
      };
    } catch (error) {
      return this.createError(
        'ASSISTING_FAILED',
        'Failed to start workflow assistance',
        error
      );
    }
  }

  /**
   * Handle user question or request for help
   */
  async handleUserQuestion(
    query: string,
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    try {
      const prompt = WorkflowAssistantPrompts.buildGuidancePrompt(
        query,
        context
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 2000,
      });

      if (!response.success) return response;

      const guidanceData = this.parseGuidanceResponse(response.data.text);
      if (!guidanceData.success) return guidanceData;

      // Create conversation message
      const message: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: guidanceData.data.content,
        timestamp: new Date(),
        workflowContext: context,
        messageType: 'guidance',
      };

      // Update conversation
      this.addToConversation(context.executionId, message);

      return {
        success: true,
        data: {
          message,
          actionSuggestions: guidanceData.data.actionSuggestions || [],
          contextualHelp: guidanceData.data.contextualHelp || [],
        },
      };
    } catch (error) {
      return this.createError(
        'GUIDANCE_FAILED',
        'Failed to provide guidance',
        error
      );
    }
  }

  /**
   * Troubleshoot workflow issue
   */
  async troubleshootIssue(
    issue: string,
    context: WorkflowContext
  ): Promise<Result<TroubleshootingResult, MLError>> {
    try {
      const prompt = WorkflowAssistantPrompts.buildTroubleshootingPrompt(
        issue,
        context
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 2500,
      });

      if (!response.success) return response;

      const troubleshootingData = this.parseTroubleshootingResponse(
        response.data.text
      );
      if (!troubleshootingData.success) return troubleshootingData;

      return {
        success: true,
        data: troubleshootingData.data,
      };
    } catch (error) {
      return this.createError(
        'TROUBLESHOOTING_FAILED',
        'Failed to troubleshoot issue',
        error
      );
    }
  }

  /**
   * Provide step-specific guidance
   */
  async provideStepGuidance(
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    try {
      const stepQuery = `Guidance for step: ${context.currentStep}`;
      return await this.handleUserQuestion(stepQuery, context);
    } catch (error) {
      return this.createError(
        'STEP_GUIDANCE_FAILED',
        'Failed to provide step guidance',
        error
      );
    }
  }

  /**
   * Generate optimization suggestions
   */
  async suggestOptimizations(
    metrics: PerformanceMetrics,
    context: WorkflowContext
  ): Promise<Result<OptimizationSuggestion[], MLError>> {
    try {
      const prompt = WorkflowAssistantPrompts.buildOptimizationPrompt(
        metrics,
        context
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 2000,
      });

      if (!response.success) return response;

      const optimizationData = this.parseOptimizationResponse(
        response.data.text
      );
      return optimizationData;
    } catch (error) {
      return this.createError(
        'OPTIMIZATION_FAILED',
        'Failed to generate optimizations',
        error
      );
    }
  }

  /**
   * Support decision making
   */
  async supportDecision(
    decision: string,
    options: any[],
    context: WorkflowContext
  ): Promise<Result<GuidanceResult, MLError>> {
    try {
      const prompt = WorkflowAssistantPrompts.buildDecisionSupportPrompt(
        decision,
        options,
        context
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 2000,
      });

      if (!response.success) return response;

      const decisionData = this.parseDecisionResponse(response.data.text);
      if (!decisionData.success) return decisionData;

      const message: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: decisionData.data.content,
        timestamp: new Date(),
        workflowContext: context,
        messageType: 'guidance',
      };

      return {
        success: true,
        data: {
          message,
          actionSuggestions: decisionData.data.actionSuggestions || [],
          contextualHelp: [],
        },
      };
    } catch (error) {
      return this.createError(
        'DECISION_SUPPORT_FAILED',
        'Failed to support decision',
        error
      );
    }
  }

  // Private helper methods

  /**
   * Analyze workflow and user context
   */
  private async analyzeWorkflowAndUser(
    context: WorkflowContext
  ): Promise<Result<WorkflowAnalysis, MLError>> {
    try {
      const prompt = WorkflowAssistantPrompts.buildAnalysisPrompt(context);

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 1500,
      });

      if (!response.success) return response;

      const analysisData = this.parseAnalysisResponse(response.data.text);
      return analysisData;
    } catch (error) {
      return this.createError(
        'ANALYSIS_FAILED',
        'Failed to analyze workflow',
        error
      );
    }
  }

  /**
   * Generate personalized welcome message
   */
  private async generateWelcomeMessage(
    context: WorkflowContext,
    analysis: WorkflowAnalysis
  ): Promise<Result<ConversationMessage, MLError>> {
    try {
      const prompt = WorkflowAssistantPrompts.buildWelcomePrompt(
        context,
        analysis
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.5,
        maxTokens: 800,
      });

      if (!response.success) return response;

      const message: ConversationMessage = {
        id: `welcome_${Date.now()}`,
        role: 'assistant',
        content: response.data.text,
        timestamp: new Date(),
        workflowContext: context,
        messageType: 'guidance',
      };

      return { success: true, data: message };
    } catch (error) {
      return this.createError(
        'WELCOME_FAILED',
        'Failed to generate welcome message',
        error
      );
    }
  }

  /**
   * Generate initial recommendations
   */
  private async generateInitialRecommendations(
    context: WorkflowContext
  ): Promise<Result<AssistantRecommendation[], MLError>> {
    try {
      const prompt =
        WorkflowAssistantPrompts.buildRecommendationsPrompt(context);

      const response = await this.provider.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 1500,
      });

      if (!response.success) return response;

      const recommendationsData = this.parseRecommendationsResponse(
        response.data.text
      );
      return recommendationsData;
    } catch (error) {
      return this.createError(
        'RECOMMENDATIONS_FAILED',
        'Failed to generate recommendations',
        error
      );
    }
  }

  // Response parsing methods

  private parseAnalysisResponse(
    text: string
  ): Result<WorkflowAnalysis, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data: data.analysis || data };
    } catch (error) {
      return this.createError(
        'ANALYSIS_PARSE_ERROR',
        'Failed to parse analysis',
        error
      );
    }
  }

  private parseGuidanceResponse(text: string): Result<any, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'GUIDANCE_PARSE_ERROR',
        'Failed to parse guidance',
        error
      );
    }
  }

  private parseTroubleshootingResponse(
    text: string
  ): Result<TroubleshootingResult, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'TROUBLESHOOTING_PARSE_ERROR',
        'Failed to parse troubleshooting',
        error
      );
    }
  }

  private parseOptimizationResponse(
    text: string
  ): Result<OptimizationSuggestion[], MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data: data.suggestions || data };
    } catch (error) {
      return this.createError(
        'OPTIMIZATION_PARSE_ERROR',
        'Failed to parse optimization',
        error
      );
    }
  }

  private parseRecommendationsResponse(
    text: string
  ): Result<AssistantRecommendation[], MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data: data.recommendations || data };
    } catch (error) {
      return this.createError(
        'RECOMMENDATIONS_PARSE_ERROR',
        'Failed to parse recommendations',
        error
      );
    }
  }

  private parseDecisionResponse(text: string): Result<any, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'DECISION_PARSE_ERROR',
        'Failed to parse decision response',
        error
      );
    }
  }

  // Utility methods

  private addToConversation(
    executionId: string,
    message: ConversationMessage
  ): void {
    const conversation = this.conversations.get(executionId) || [];
    conversation.push(message);
    this.conversations.set(executionId, conversation);
  }

  private extractActionSuggestions(
    recommendations: AssistantRecommendation[]
  ): string[] {
    return recommendations
      .filter(rec => rec.actionText)
      .map(rec => rec.actionText!)
      .slice(0, 3);
  }

  private createError(
    code: string,
    message: string,
    error?: any
  ): Result<any, MLError> {
    return {
      success: false,
      error: {
        code,
        message,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }

  /**
   * Get assistant configuration
   */
  static getAssistantConfig(): AssistantConfig {
    return {
      name: 'Alex',
      role: 'Workflow Assistant',
      personality: 'helpful, proactive, detail-oriented',
      expertise: [
        'workflow_optimization',
        'troubleshooting',
        'best_practices',
        'decision_support',
      ],
      tone: 'professional_friendly',
      verbosity: 'concise_but_thorough',
      proactivity: 'high',
      autoSuggestNextSteps: true,
      predictBlockers: true,
      monitorPerformance: true,
      learnFromHistory: true,
    };
  }
}
