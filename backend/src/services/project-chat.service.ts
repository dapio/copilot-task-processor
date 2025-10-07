/**
 * Project Chat Service
 * Handles ML-powered chat conversations at project level with context management
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  agentType?: string;
  metadata?: any;
  timestamp: Date;
  isImportant: boolean;
}

export interface ChatSession {
  sessionId: string;
  projectId: string;
  messages: ChatMessage[];
  context: ProjectContext;
  activeAgents: string[];
}

export interface ProjectContext {
  projectId: string;
  projectName: string;
  projectType?: string;
  currentWorkflow?: string;
  activeTasks: any[];
  recentFiles: string[];
  techStack: string[];
  requirements: any[];
  architecture: any;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actions?: ChatAction[];
  agentRecommendation?: string;
}

export interface ChatAction {
  type:
    | 'create_task'
    | 'assign_agent'
    | 'start_workflow'
    | 'generate_code'
    | 'review_code';
  description: string;
  params: any;
}

export class ProjectChatService {
  private prisma: PrismaClient;
  private mlProvider: IMLProvider;

  constructor(prisma: PrismaClient, mlProvider: IMLProvider) {
    this.prisma = prisma;
    this.mlProvider = mlProvider;
  }

  /**
   * Send message to project chat and get AI response
   */
  async sendMessage(
    projectId: string,
    message: string,
    role: 'user' | 'agent' = 'user',
    agentType?: string,
    sessionId?: string
  ): Promise<Result<ChatResponse, MLError>> {
    try {
      // Get or create session
      const session = sessionId || this.generateSessionId();

      // Store user message
      await this.storeMessage(projectId, session, role, message, agentType);

      // Get project context
      const contextResult = await this.getProjectContext(projectId);
      if (!contextResult.success) {
        return contextResult;
      }

      // Get conversation history
      const historyResult = await this.getConversationHistory(
        projectId,
        session,
        20
      );
      if (!historyResult.success) {
        return historyResult;
      }

      // Generate AI response
      const prompt = this.buildChatPrompt(
        message,
        contextResult.data,
        historyResult.data
      );

      const response = await this.mlProvider.generateText(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      // Parse AI response
      const parsedResponse = this.parseAIResponse(response.data.text);

      // Store AI response
      await this.storeMessage(
        projectId,
        session,
        'assistant',
        parsedResponse.message,
        undefined,
        parsedResponse
      );

      return {
        success: true,
        data: parsedResponse,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHAT_ERROR',
          message: 'Failed to process chat message',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get conversation history for a project
   */
  async getConversationHistory(
    projectId: string,
    sessionId?: string,
    limit: number = 50
  ): Promise<Result<ChatMessage[], MLError>> {
    try {
      const whereClause: any = { projectId };
      if (sessionId) {
        whereClause.sessionId = sessionId;
      }

      const messages = await this.prisma.projectChat.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      const chatMessages: ChatMessage[] = messages.reverse().map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant' | 'agent',
        content: msg.content,
        agentType: msg.agentType || undefined,
        metadata: msg.metadata,
        timestamp: msg.timestamp,
        isImportant: msg.isImportant,
      }));

      return {
        success: true,
        data: chatMessages,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_HISTORY_ERROR',
          message: 'Failed to get conversation history',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get project context for chat
   */
  async getProjectContext(
    projectId: string
  ): Promise<Result<ProjectContext, MLError>> {
    try {
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            where: { status: { in: ['pending', 'in_progress'] } },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          workflows: {
            where: { status: 'active' },
            take: 5,
          },
        },
      });

      if (!project) {
        return {
          success: false,
          error: {
            code: 'PROJECT_NOT_FOUND',
            message: 'Project not found',
            details: `Project with id ${projectId} does not exist`,
          },
        };
      }

      const context: ProjectContext = {
        projectId: project.id,
        projectName: project.name,
        projectType: project.type || undefined,
        currentWorkflow: project.workflows[0]?.name,
        activeTasks: project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          assignedAgent: task.assignedAgentId,
        })),
        recentFiles: this.getRecentFiles(project.id), // Track recent project files
        techStack: (project.metadata as any)?.techStack || [],
        requirements: (project.metadata as any)?.requirements || [],
        architecture: (project.metadata as any)?.architecture || {},
      };

      return {
        success: true,
        data: context,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_CONTEXT_ERROR',
          message: 'Failed to get project context',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Store chat message in database
   */
  private async storeMessage(
    projectId: string,
    sessionId: string,
    role: 'user' | 'assistant' | 'agent',
    content: string,
    agentType?: string,
    metadata?: any
  ): Promise<void> {
    await this.prisma.projectChat.create({
      data: {
        projectId,
        sessionId,
        role,
        content,
        agentType,
        metadata,
        isImportant: role === 'agent' && metadata?.actions?.length > 0,
      },
    });
  }

  /**
   * Build chat prompt with context
   */
  private buildChatPrompt(
    message: string,
    context: ProjectContext,
    history: ChatMessage[]
  ): string {
    const systemPrompt = `You are an AI assistant for the ThinkCode AI Platform, helping with project "${
      context.projectName
    }".

PROJECT CONTEXT:
- Type: ${context.projectType || 'Not specified'}
- Active Tasks: ${context.activeTasks.length}
- Current Workflow: ${context.currentWorkflow || 'None'}
- Tech Stack: ${context.techStack.join(', ') || 'Not specified'}

ACTIVE TASKS:
${context.activeTasks
  .map(task => `- ${task.title} (${task.status})`)
  .join('\n')}

You can help with:
1. Project analysis and planning
2. Code generation and review
3. Task management and workflows
4. Architecture decisions
5. Best practices guidance
6. Agent coordination

CONVERSATION HISTORY:
${history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Provide helpful, actionable responses. If you recommend actions like creating tasks or assigning agents, include them in your response.

USER MESSAGE: ${message}

RESPONSE (in JSON format):
{
  "message": "Your helpful response here",
  "suggestions": ["Optional suggestions array"],
  "actions": [
    {
      "type": "action_type",
      "description": "What this action does",
      "params": {}
    }
  ],
  "agentRecommendation": "Which agent type would be best for this task"
}`;

    return systemPrompt;
  }

  /**
   * Parse AI response from JSON
   */
  private parseAIResponse(responseText: string): ChatResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.message || responseText,
          suggestions: parsed.suggestions,
          actions: parsed.actions,
          agentRecommendation: parsed.agentRecommendation,
        };
      }

      // Fall back to plain text
      return {
        message: responseText,
      };
    } catch {
      return {
        message: responseText,
      };
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear old chat messages (cleanup)
   */
  async cleanupOldMessages(
    daysOld: number = 30
  ): Promise<Result<number, MLError>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.prisma.projectChat.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate,
          },
          isImportant: false,
        },
      });

      return {
        success: true,
        data: result.count,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Failed to cleanup old messages',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Tracks recent files for a project
   */
  private getRecentFiles(projectId: string): string[] {
    // Mock implementation for development - in production, integrate with file system monitoring
    const mockFiles = [
      '/src/main.ts',
      '/config/config.json',
      '/README.md',
      '/src/services/api.service.ts',
      '/tests/unit.test.ts',
    ];

    console.log(
      `📁 Tracking recent files for project ${projectId}: ${mockFiles.length} files`
    );
    return mockFiles;
  }
}

export default ProjectChatService;
