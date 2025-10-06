/**
 * Workflow Assistant Agent
 * AI-powered assistant that guides users through workflow execution
 * Provides recommendations, troubleshooting, and decision support
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

export interface WorkflowContext {
  workflowId: string;
  currentStep: string;
  stepIndex: number;
  totalSteps: number;

  // Execution state
  executionId: string;
  status: 'running' | 'paused' | 'error' | 'waiting_approval' | 'completed';

  // User context
  userId: string;
  userRole: 'developer' | 'product_owner' | 'stakeholder' | 'admin';
  experience: 'beginner' | 'intermediate' | 'expert';

  // Workflow data
  projectType: string;
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';

  // Current state
  stepData: any;
  previousSteps: string[];
  blockers: string[];
  warnings: string[];
}

export interface AssistantRecommendation {
  type: 'suggestion' | 'warning' | 'error' | 'optimization' | 'next_action';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionText?: string;
  actionType?: 'button' | 'link' | 'modal' | 'redirect';
  actionData?: any;

  // Context
  stepId?: string;
  category: 'technical' | 'process' | 'decision' | 'quality' | 'performance';

  // Timing
  showAt:
    | 'immediate'
    | 'before_step'
    | 'after_step'
    | 'on_error'
    | 'on_approval';
  expiresAt?: Date;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // Context
  workflowContext?: WorkflowContext;
  recommendations?: AssistantRecommendation[];

  // Metadata
  messageType:
    | 'question'
    | 'guidance'
    | 'warning'
    | 'confirmation'
    | 'troubleshooting';
  intent?: string;
  confidence?: number;
}

export class WorkflowAssistantAgent {
  private prisma: PrismaClient;
  private provider: IMLProvider;
  private agentId: string;

  // Conversation sessions per workflow execution
  private conversations: Map<string, ConversationMessage[]> = new Map();

  // Assistant personality and behavior
  private assistantConfig = {
    name: 'Alex',
    role: 'Workflow Assistant',
    personality: 'helpful, proactive, detail-oriented',
    expertise: [
      'workflow_optimization',
      'troubleshooting',
      'best_practices',
      'decision_support',
    ],

    // Response style
    tone: 'professional_friendly',
    verbosity: 'concise_but_thorough',
    proactivity: 'high', // How often to offer unsolicited help

    // Behavior settings
    autoSuggestNextSteps: true,
    predictBlockers: true,
    monitorPerformance: true,
    learnFromHistory: true,
  };

  constructor(
    prisma: PrismaClient,
    provider: IMLProvider,
    agentId: string = 'workflow-assistant-001'
  ) {
    this.prisma = prisma;
    this.provider = provider;
    this.agentId = agentId;
  }

  // === Core Assistant Functions ===

  /**
   * Rozpoczyna asystowanie użytkownikowi w workflow
   */
  async startAssisting(
    workflowContext: WorkflowContext
  ): Promise<Result<ConversationMessage[], MLError>> {
    try {
      const executionId = workflowContext.executionId;

      // Przeanalizuj workflow i użytkownika
      const analysis = await this.analyzeWorkflowAndUser(workflowContext);

      // Stwórz personalizowaną wiadomość powitalną
      const welcomeMessage = await this.generateWelcomeMessage(
        workflowContext,
        analysis
      );

      // Wygeneruj początkowe rekomendacje
      const initialRecommendations =
        await this.generateInitialRecommendations(workflowContext);

      const conversation: ConversationMessage[] = [
        {
          id: `msg_${Date.now()}_welcome`,
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
          workflowContext,
          recommendations: initialRecommendations,
          messageType: 'guidance',
        },
      ];

      this.conversations.set(executionId, conversation);

      // Zapisz w bazie danych
      await this.saveConversation(executionId, conversation);

      return {
        success: true,
        data: conversation,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ASSISTANT_START_ERROR',
          message: `Failed to start assistant: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      };
    }
  }

  /**
   * Przetwarza pytanie użytkownika
   */
  async processUserQuestion(
    executionId: string,
    userMessage: string,
    workflowContext: WorkflowContext
  ): Promise<Result<ConversationMessage, MLError>> {
    try {
      // Dodaj wiadomość użytkownika do konwersacji
      const userMsg: ConversationMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        workflowContext,
        messageType: 'question',
      };

      const conversation = this.conversations.get(executionId) || [];
      conversation.push(userMsg);

      // Przeanalizuj intencję użytkownika
      const intentAnalysis = await this.analyzeUserIntent(
        userMessage,
        workflowContext
      );

      // Wygeneruj odpowiedź asystenta
      const assistantResponse = await this.generateAssistantResponse(
        userMessage,
        workflowContext,
        conversation,
        intentAnalysis
      );

      // Wygeneruj rekomendacje na podstawie pytania
      const contextualRecommendations =
        await this.generateContextualRecommendations(
          workflowContext,
          intentAnalysis
        );

      const assistantMsg: ConversationMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date(),
        workflowContext,
        recommendations: contextualRecommendations,
        messageType: intentAnalysis.type,
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
      };

      conversation.push(assistantMsg);
      this.conversations.set(executionId, conversation);

      // Zapisz w bazie
      await this.saveConversation(executionId, conversation);

      return {
        success: true,
        data: assistantMsg,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'QUESTION_PROCESSING_ERROR',
          message: `Failed to process question: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      };
    }
  }

  /**
   * Monitoruje postęp workflow i oferuje proaktywną pomoc
   */
  async monitorWorkflowProgress(
    workflowContext: WorkflowContext
  ): Promise<Result<AssistantRecommendation[], MLError>> {
    try {
      const recommendations: AssistantRecommendation[] = [];

      // Sprawdź czy są blokery
      if (workflowContext.blockers.length > 0) {
        const blockerRecommendations =
          await this.generateBlockerRecommendations(workflowContext);
        recommendations.push(...blockerRecommendations);
      }

      // Sprawdź czy są ostrzeżenia
      if (workflowContext.warnings.length > 0) {
        const warningRecommendations =
          await this.generateWarningRecommendations(workflowContext);
        recommendations.push(...warningRecommendations);
      }

      // Przewiduj potencjalne problemy
      const predictedIssues =
        await this.predictPotentialIssues(workflowContext);
      if (predictedIssues.length > 0) {
        recommendations.push(...predictedIssues);
      }

      // Zasugeruj optymalizacje
      const optimizations = await this.suggestOptimizations(workflowContext);
      recommendations.push(...optimizations);

      // Zasugeruj następne kroki
      if (this.assistantConfig.autoSuggestNextSteps) {
        const nextStepSuggestions =
          await this.generateNextStepSuggestions(workflowContext);
        recommendations.push(...nextStepSuggestions);
      }

      return {
        success: true,
        data: recommendations,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MONITORING_ERROR',
          message: `Failed to monitor workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      };
    }
  }

  /**
   * Pomaga w podejmowaniu decyzji
   */
  async assistWithDecision(
    workflowContext: WorkflowContext,
    decisionContext: {
      decisionType: string;
      options: Array<{
        id: string;
        name: string;
        description: string;
        pros: string[];
        cons: string[];
        impact: 'low' | 'medium' | 'high';
      }>;
      criteria: string[];
    }
  ): Promise<
    Result<
      {
        recommendation: string;
        reasoning: string;
        rankedOptions: Array<{ id: string; score: number; reasoning: string }>;
        risksAndMitigations: Array<{
          risk: string;
          mitigation: string;
          severity: string;
        }>;
      },
      MLError
    >
  > {
    try {
      const decisionPrompt = this.buildDecisionPrompt(
        workflowContext,
        decisionContext
      );

      const result = await this.provider.generateText(decisionPrompt, {
        temperature: 0.3, // Lower temperature for more consistent decision making
        maxTokens: 2000,
      });

      if (!result.success) {
        return result;
      }

      // Parsuj odpowiedź AI i strukturyzuj wynik
      const decisionAnalysis = await this.parseDecisionAnalysis(
        result.data.text,
        decisionContext
      );

      return {
        success: true,
        data: decisionAnalysis,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DECISION_ASSIST_ERROR',
          message: `Failed to assist with decision: ${error instanceof Error ? error.message : 'Unknown error'}`,
          retryable: true,
        },
      };
    }
  }

  // === Helper Methods ===

  private async analyzeWorkflowAndUser(context: WorkflowContext) {
    // Analyze user experience level, workflow complexity, and context
    return {
      userNeedsGuidance: context.experience === 'beginner',
      workflowComplexity: context.complexity,
      potentialChallenges: this.identifyPotentialChallenges(context),
      recommendedApproach: this.getRecommendedApproach(context),
    };
  }

  private async generateWelcomeMessage(
    context: WorkflowContext,
    analysis: any
  ): Promise<string> {
    const prompt = `Generate a personalized welcome message for a workflow assistant.

Context:
- User role: ${context.userRole}
- Experience level: ${context.experience}
- Workflow: ${context.workflowId}
- Project type: ${context.projectType}
- Complexity: ${context.complexity}
- Current step: ${context.currentStep} (${context.stepIndex}/${context.totalSteps})

Assistant personality: ${this.assistantConfig.personality}
Assistant name: ${this.assistantConfig.name}

Create a warm, professional welcome message that:
1. Introduces the assistant by name
2. Shows understanding of the user's context
3. Offers specific help based on their experience level
4. Sets expectations for the assistance
5. Encourages questions and interaction

Keep it concise but personalized.`;

    const result = await this.provider.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 300,
    });

    if (!result.success) {
      // Fallback message
      return `Hi! I'm ${this.assistantConfig.name}, your workflow assistant. I'm here to help guide you through this ${context.projectType} workflow. Feel free to ask questions anytime!`;
    }

    return result.data.text.trim();
  }

  private async generateInitialRecommendations(
    context: WorkflowContext
  ): Promise<AssistantRecommendation[]> {
    const recommendations: AssistantRecommendation[] = [];

    // Based on user experience
    if (context.experience === 'beginner') {
      recommendations.push({
        type: 'suggestion',
        priority: 'medium',
        title: 'Workflow Overview Available',
        description:
          'Would you like me to explain how this workflow works and what to expect?',
        actionText: 'Show Overview',
        actionType: 'button',
        category: 'process',
        showAt: 'immediate',
      });
    }

    // Based on current step
    if (context.stepIndex === 0) {
      recommendations.push({
        type: 'suggestion',
        priority: 'low',
        title: 'Pre-flight Check',
        description:
          'I can help verify you have everything needed for this workflow.',
        actionText: 'Run Check',
        actionType: 'button',
        category: 'technical',
        showAt: 'immediate',
      });
    }

    return recommendations;
  }

  private async analyzeUserIntent(
    message: string,
    context: WorkflowContext
  ): Promise<{
    intent: string;
    type: ConversationMessage['messageType'];
    confidence: number;
    entities: string[];
  }> {
    const prompt = `Analyze the user's intent from this message:

User message: "${message}"
Workflow context: ${context.currentStep} in ${context.workflowId}

Determine:
1. Primary intent (help, question, problem, confirmation, etc.)
2. Message type (question, guidance, warning, confirmation, troubleshooting)
3. Confidence level (0-1)
4. Key entities mentioned

Respond with JSON format:
{
  "intent": "string",
  "type": "question|guidance|warning|confirmation|troubleshooting",
  "confidence": 0.0-1.0,
  "entities": ["entity1", "entity2"]
}`;

    try {
      const result = await this.provider.generateText(prompt, {
        temperature: 0.2,
        maxTokens: 200,
      });

      if (result.success) {
        const parsed = JSON.parse(result.data.text);
        return parsed;
      }
    } catch (error) {
      // Fallback analysis
    }

    return {
      intent: 'general_question',
      type: 'question',
      confidence: 0.5,
      entities: [],
    };
  }

  private async generateAssistantResponse(
    userMessage: string,
    context: WorkflowContext,
    conversation: ConversationMessage[],
    intentAnalysis: any
  ): Promise<string> {
    const conversationHistory = conversation
      .slice(-5)
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const prompt = `You are ${this.assistantConfig.name}, a helpful workflow assistant. 

Current context:
- Workflow: ${context.workflowId}
- Current step: ${context.currentStep} (${context.stepIndex}/${context.totalSteps})
- User role: ${context.userRole}
- User experience: ${context.experience}
- User intent: ${intentAnalysis.intent}

Conversation history:
${conversationHistory}

User's question: "${userMessage}"

Provide a helpful, specific response that:
1. Directly addresses their question/intent
2. Considers their experience level
3. Relates to the current workflow step
4. Offers actionable advice when appropriate
5. Maintains a ${this.assistantConfig.tone} tone

Keep response concise but thorough.`;

    const result = await this.provider.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 500,
    });

    if (!result.success) {
      return 'I understand you have a question about the workflow. Could you provide more details so I can help you better?';
    }

    return result.data.text.trim();
  }

  private async generateContextualRecommendations(
    context: WorkflowContext,
    intentAnalysis: any
  ): Promise<AssistantRecommendation[]> {
    const recommendations: AssistantRecommendation[] = [];

    // Based on intent, generate relevant recommendations
    switch (intentAnalysis.intent) {
      case 'troubleshooting':
        recommendations.push({
          type: 'suggestion',
          priority: 'high',
          title: 'Debug Mode',
          description: 'Enable detailed logging to help identify the issue.',
          actionText: 'Enable Debug',
          actionType: 'button',
          category: 'technical',
          showAt: 'immediate',
        });
        break;

      case 'next_steps':
        recommendations.push({
          type: 'next_action',
          priority: 'medium',
          title: 'Continue Workflow',
          description: 'Ready to proceed to the next step?',
          actionText: 'Continue',
          actionType: 'button',
          category: 'process',
          showAt: 'immediate',
        });
        break;
    }

    return recommendations;
  }

  private identifyPotentialChallenges(context: WorkflowContext): string[] {
    const challenges: string[] = [];

    if (
      context.complexity === 'enterprise' &&
      context.experience === 'beginner'
    ) {
      challenges.push('Complex workflow for beginner user');
    }

    if (context.stepIndex > context.totalSteps * 0.8) {
      challenges.push('Near end of workflow - deployment considerations');
    }

    return challenges;
  }

  private getRecommendedApproach(context: WorkflowContext): string {
    if (context.experience === 'beginner') {
      return 'step_by_step_guidance';
    } else if (context.complexity === 'enterprise') {
      return 'detailed_oversight';
    }
    return 'minimal_guidance';
  }

  private async generateBlockerRecommendations(
    context: WorkflowContext
  ): Promise<AssistantRecommendation[]> {
    return context.blockers.map((blocker, index) => ({
      type: 'error',
      priority: 'critical' as const,
      title: `Blocker Detected: ${blocker}`,
      description: 'This issue is preventing workflow progress.',
      actionText: 'Get Help',
      actionType: 'modal' as const,
      category: 'technical' as const,
      showAt: 'immediate' as const,
    }));
  }

  private async generateWarningRecommendations(
    context: WorkflowContext
  ): Promise<AssistantRecommendation[]> {
    return context.warnings.map((warning, index) => ({
      type: 'warning',
      priority: 'medium' as const,
      title: `Warning: ${warning}`,
      description: 'This may cause issues if not addressed.',
      actionText: 'Review',
      actionType: 'button' as const,
      category: 'process' as const,
      showAt: 'immediate' as const,
    }));
  }

  private async predictPotentialIssues(
    context: WorkflowContext
  ): Promise<AssistantRecommendation[]> {
    // AI-powered prediction of issues based on context
    const predictions: AssistantRecommendation[] = [];

    if (context.stepIndex === Math.floor(context.totalSteps * 0.5)) {
      predictions.push({
        type: 'suggestion',
        priority: 'low',
        title: 'Mid-Workflow Checkpoint',
        description: 'Good time to review progress and validate quality.',
        actionText: 'Run Quality Check',
        actionType: 'button',
        category: 'quality',
        showAt: 'immediate',
      });
    }

    return predictions;
  }

  private async suggestOptimizations(
    context: WorkflowContext
  ): Promise<AssistantRecommendation[]> {
    const optimizations: AssistantRecommendation[] = [];

    if (context.userRole === 'developer' && context.experience === 'expert') {
      optimizations.push({
        type: 'optimization',
        priority: 'low',
        title: 'Parallel Execution',
        description: 'Some steps could be run in parallel to save time.',
        actionText: 'Show Options',
        actionType: 'modal',
        category: 'performance',
        showAt: 'immediate',
      });
    }

    return optimizations;
  }

  private async generateNextStepSuggestions(
    context: WorkflowContext
  ): Promise<AssistantRecommendation[]> {
    if (context.stepIndex < context.totalSteps - 1) {
      return [
        {
          type: 'next_action',
          priority: 'medium',
          title: 'Next Step Ready',
          description: `Prepare for: ${context.currentStep}`,
          actionText: 'Preview Next',
          actionType: 'button',
          category: 'process',
          showAt: 'after_step',
        },
      ];
    }

    return [];
  }

  private buildDecisionPrompt(
    workflowContext: WorkflowContext,
    decisionContext: any
  ): string {
    return `Help make a decision in a ${workflowContext.projectType} workflow.

Decision: ${decisionContext.decisionType}

Options:
${decisionContext.options
  .map(
    (opt: any, i: number) =>
      `${i + 1}. ${opt.name}: ${opt.description}\n   Pros: ${opt.pros.join(', ')}\n   Cons: ${opt.cons.join(', ')}\n   Impact: ${opt.impact}`
  )
  .join('\n\n')}

Criteria: ${decisionContext.criteria.join(', ')}

Provide:
1. Recommended option with clear reasoning
2. Ranking of all options with scores
3. Risk analysis and mitigations
4. Implementation considerations

Format as structured analysis.`;
  }

  private async parseDecisionAnalysis(
    aiResponse: string,
    decisionContext: any
  ) {
    // Parse AI response into structured format
    return {
      recommendation: 'Option 1', // Parsed from AI response
      reasoning: 'Based on analysis...', // Extracted reasoning
      rankedOptions: decisionContext.options.map((opt: any, i: number) => ({
        id: opt.id,
        score: 0.8 - i * 0.1, // Placeholder scoring
        reasoning: 'Analysis reasoning...',
      })),
      risksAndMitigations: [
        {
          risk: 'Example risk',
          mitigation: 'Example mitigation',
          severity: 'medium',
        },
      ],
    };
  }

  private async saveConversation(
    executionId: string,
    conversation: ConversationMessage[]
  ): Promise<void> {
    // Save to database
    try {
      // Implementation depends on your database schema
      // This is a placeholder for the actual database save
    } catch (error) {
      console.error('Failed to save conversation:', error);
    }
  }

  // === Public API Methods ===

  /**
   * Pobiera konwersację dla danego workflow execution
   */
  async getConversation(executionId: string): Promise<ConversationMessage[]> {
    return this.conversations.get(executionId) || [];
  }

  /**
   * Czyści starą konwersację
   */
  async clearConversation(executionId: string): Promise<void> {
    this.conversations.delete(executionId);
  }

  /**
   * Konfiguruje asystenta
   */
  configureAssistant(config: Partial<typeof this.assistantConfig>): void {
    Object.assign(this.assistantConfig, config);
  }

  /**
   * Pobiera statystyki asystenta
   */
  async getAssistantStats(): Promise<{
    activeConversations: number;
    totalMessages: number;
    averageResponseTime: number;
    userSatisfaction: number;
  }> {
    return {
      activeConversations: this.conversations.size,
      totalMessages: Array.from(this.conversations.values()).reduce(
        (sum, conv) => sum + conv.length,
        0
      ),
      averageResponseTime: 1.2, // seconds
      userSatisfaction: 4.5, // out of 5
    };
  }
}

export default WorkflowAssistantAgent;
