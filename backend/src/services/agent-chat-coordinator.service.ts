/**
 * Agent Chat Coordinator Service
 * @description Coordinates communication between agents and chat system
 */

import { PrismaClient } from '@prisma/client';
import { ChatIntegrationService } from './chat-integration.service';
import { realTimeOrchestrator } from './realtime-orchestrator.service';
import { Result, ServiceError, createServiceError } from '../utils/result';

export interface AgentChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  agentType?:
    | 'business-analyst'
    | 'system-architect'
    | 'frontend-developer'
    | 'backend-developer'
    | 'qa-engineer';
  agentName?: string;
  content: string;
  timestamp: Date;
  projectId: string;
  sessionId: string;
  metadata?: {
    taskId?: string;
    workflowId?: string;
    documentIds?: string[];
    actionType?: 'analysis' | 'suggestion' | 'question' | 'result';
  };
}

export interface AgentCommunicationContext {
  projectId: string;
  sessionId: string;
  activeAgents: string[];
  currentTask?: string;
  workflowContext?: any;
}

/**
 * Coordinates chat communication between agents
 */
export class AgentChatCoordinator {
  private chatService: ChatIntegrationService;
  private prisma: PrismaClient;
  private activeSessions = new Map<string, AgentCommunicationContext>();

  constructor(prisma: PrismaClient, chatService: ChatIntegrationService) {
    this.prisma = prisma;
    this.chatService = chatService;
  }

  /**
   * Initialize chat session for project with agents
   */
  async initializeProjectChat(
    projectId: string
  ): Promise<Result<AgentCommunicationContext, ServiceError>> {
    try {
      console.log(`🔄 Initializing project chat for project ${projectId}`);

      // Create chat session
      const sessionResult = await this.chatService.createSession(
        projectId,
        'project'
      );

      if (!sessionResult.success) {
        return {
          success: false,
          error: sessionResult.error,
        };
      }

      const session = sessionResult.data;

      // Initialize context
      const context: AgentCommunicationContext = {
        projectId,
        sessionId: session.id,
        activeAgents: [],
      };

      this.activeSessions.set(projectId, context);

      // Send welcome message
      await this.sendSystemMessage(
        projectId,
        '🤖 **System AI Platform** zostało zainicjowane!\n\nAgenci AI będą komunikować się tutaj podczas pracy nad projektem. Każda wiadomość będzie oznaczona rolą agenta.'
      );

      console.log(
        `✅ Project chat initialized for ${projectId}, session: ${session.id}`
      );

      return {
        success: true,
        data: context,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'CHAT_INIT_ERROR',
          `Failed to initialize project chat: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { projectId, originalError: error }
        ),
      };
    }
  }

  /**
   * Send message from agent to project chat
   */
  async sendAgentMessage(
    projectId: string,
    agentType: string,
    agentName: string,
    message: string,
    metadata?: AgentChatMessage['metadata']
  ): Promise<Result<AgentChatMessage, ServiceError>> {
    try {
      const context = this.activeSessions.get(projectId);
      if (!context) {
        return {
          success: false,
          error: createServiceError(
            'NO_ACTIVE_SESSION',
            `No active chat session for project ${projectId}`,
            { projectId }
          ),
        };
      }

      const agentMessage: AgentChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'agent',
        agentType: agentType as any,
        agentName,
        content: `**${agentName}** (${agentType}): ${message}`,
        timestamp: new Date(),
        projectId,
        sessionId: context.sessionId,
        metadata,
      };

      // Store in chat session
      await this.storeMessage(agentMessage);

      // Add to active agents if not already there
      if (!context.activeAgents.includes(agentType)) {
        context.activeAgents.push(agentType);
      }

      console.log(
        `💬 Agent message from ${agentName}: ${message.substring(0, 100)}...`
      );

      return {
        success: true,
        data: agentMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'AGENT_MESSAGE_ERROR',
          `Failed to send agent message: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { projectId, agentType, originalError: error }
        ),
      };
    }
  }

  /**
   * Send system message to project chat
   */
  async sendSystemMessage(
    projectId: string,
    message: string,
    metadata?: AgentChatMessage['metadata']
  ): Promise<Result<AgentChatMessage, ServiceError>> {
    try {
      const context = this.activeSessions.get(projectId);
      if (!context) {
        return {
          success: false,
          error: createServiceError(
            'NO_ACTIVE_SESSION',
            `No active chat session for project ${projectId}`,
            { projectId }
          ),
        };
      }

      const systemMessage: AgentChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'system',
        content: `🤖 **System**: ${message}`,
        timestamp: new Date(),
        projectId,
        sessionId: context.sessionId,
        metadata,
      };

      // Store in chat session
      await this.storeMessage(systemMessage);

      console.log(`🤖 System message: ${message.substring(0, 100)}...`);

      return {
        success: true,
        data: systemMessage,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'SYSTEM_MESSAGE_ERROR',
          `Failed to send system message: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { projectId, originalError: error }
        ),
      };
    }
  }

  /**
   * Process document upload and notify agents via chat
   */
  async processDocumentUpload(
    projectId: string,
    uploadedFiles: Array<{
      id: string;
      filename: string;
      originalName: string;
      path: string;
      type: string;
    }>
  ): Promise<Result<void, ServiceError>> {
    try {
      console.log(
        `📄 Processing document upload for project ${projectId}:`,
        uploadedFiles
      );

      await this.notifyDocumentUpload(projectId, uploadedFiles);
      const workflow = await this.startAnalysisWorkflow(
        projectId,
        uploadedFiles
      );
      await this.assignAgentsToAnalysis(projectId, workflow.id, uploadedFiles);

      return {
        success: true,
        data: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'DOCUMENT_PROCESSING_ERROR',
          `Failed to process document upload: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { projectId, uploadedFiles, originalError: error }
        ),
      };
    }
  }

  /**
   * Notify about document upload via chat
   */
  private async notifyDocumentUpload(
    projectId: string,
    uploadedFiles: Array<{ originalName: string; type: string }>
  ): Promise<void> {
    const filesList = uploadedFiles
      .map(file => `• **${file.originalName}** (${file.type})`)
      .join('\n');

    await this.sendSystemMessage(
      projectId,
      `📄 **Nowe dokumenty zostały przesłane:**\n\n${filesList}\n\n🔍 Rozpoczynam automatyczną analizę...`
    );
  }

  /**
   * Start analysis workflow for uploaded files
   */
  private async startAnalysisWorkflow(
    projectId: string,
    uploadedFiles: Array<{ id: string; path: string }>
  ): Promise<any> {
    const workflow = await realTimeOrchestrator.startProjectAnalysis(
      projectId,
      uploadedFiles.map(f => f.path)
    );

    await this.sendSystemMessage(
      projectId,
      `🚀 **Workflow analizy został rozpoczęty** (ID: ${workflow.id})\n\nAgenci AI rozpoczną analizę dokumentów i utworzą odpowiednie zadania.`,
      {
        workflowId: workflow.id,
        documentIds: uploadedFiles.map(f => f.id),
        actionType: 'analysis',
      }
    );

    return workflow;
  }

  /**
   * Assign agents to analysis tasks
   */
  private async assignAgentsToAnalysis(
    projectId: string,
    workflowId: string,
    uploadedFiles: Array<{ id: string }>
  ): Promise<void> {
    // Assign Business Analyst
    setTimeout(async () => {
      await this.sendAgentMessage(
        projectId,
        'business-analyst',
        'Anna Business Analyst',
        '📋 **Rozpoczynam analizę przesłanych dokumentów**\n\nPrzeanalizuję wymagania biznesowe i zidentyfikuję kluczowe funkcjonalności. Wyniki będą dostępne za kilka minut.',
        {
          workflowId,
          documentIds: uploadedFiles.map(f => f.id),
          actionType: 'analysis',
        }
      );
    }, 2000);

    // Notify System Architect
    setTimeout(async () => {
      await this.sendAgentMessage(
        projectId,
        'system-architect',
        'Piotr System Architect',
        '🏗️ **Przygotowuję się do projektowania architektury**\n\nPo zakończeniu analizy biznesowej zaproponuję architekturę systemu i wybór technologii.',
        {
          workflowId,
          actionType: 'suggestion',
        }
      );
    }, 4000);
  }

  /**
   * Get chat history for project
   */
  async getChatHistory(
    projectId: string
  ): Promise<Result<AgentChatMessage[], ServiceError>> {
    try {
      const context = this.activeSessions.get(projectId);
      if (!context) {
        return {
          success: true,
          data: [],
        };
      }

      // In real implementation, fetch from database
      // For now, return mock data
      const mockMessages: AgentChatMessage[] = [
        {
          id: 'msg_1',
          role: 'system',
          content:
            '🤖 **System**: Sesja czatu została zainicjowana dla projektu.',
          timestamp: new Date(Date.now() - 3600000),
          projectId,
          sessionId: context.sessionId,
        },
      ];

      return {
        success: true,
        data: mockMessages,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'CHAT_HISTORY_ERROR',
          `Failed to get chat history: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          { projectId, originalError: error }
        ),
      };
    }
  }

  /**
   * Get active communication context for project
   */
  getProjectContext(projectId: string): AgentCommunicationContext | null {
    return this.activeSessions.get(projectId) || null;
  }

  /**
   * Store message in persistent storage
   */
  private async storeMessage(message: AgentChatMessage): Promise<void> {
    try {
      // In real implementation, store in database
      // For now, just log
      console.log(`💾 Storing message:`, {
        id: message.id,
        role: message.role,
        agentType: message.agentType,
        content: message.content.substring(0, 100) + '...',
        projectId: message.projectId,
      });
    } catch (error) {
      console.error('Error storing message:', error);
    }
  }
}

// Export singleton instance
export const agentChatCoordinator = new AgentChatCoordinator(
  new PrismaClient(),
  // Note: This will be properly injected in routes
  null as any
);
