/**
 * Chat Integration Service - Refactored Main Class
 * Enterprise-grade chat integration with context awareness
 */

import { PrismaClient } from '@prisma/client';
import ContextManager from './context-manager';
import { IMLProvider } from '../providers/ml-provider.interface';
import CopilotFunctionCallingProvider from '../providers/copilot-function-calling.provider';

import {
  ChatSession,
  ChatRequest,
  ChatResponse,
  ChatConfig,
  IChatSessionManager,
} from './types/chat-integration.types';

import { ChatSessionManager } from './managers/chat-session.manager';
import { Result, ServiceError, createServiceError } from '../utils/result';

/**
 * Main Chat Integration Service - Refactored Architecture
 */
export class ChatIntegrationService {
  private sessionManager: IChatSessionManager;
  private contextManager: ContextManager;
  private providers = new Map<string, IMLProvider>();
  private config: ChatConfig;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient, contextManager: ContextManager) {
    this.prisma = prisma;
    this.contextManager = contextManager;

    this.config = {
      defaultProvider: 'copilot',
      enableContextAwareness: true,
      enableWorkspaceAccess: true,
      maxSessionHistory: 50,
      autoSaveInterval: 30000, // 30 seconds
      supportedProviders: ['copilot', 'openai', 'anthropic'],
    };

    // Initialize managers
    this.sessionManager = new ChatSessionManager(prisma);

    // Initialize providers
    this.initializeProviders();
  }

  /**
   * Initialize ML providers
   */
  private initializeProviders(): void {
    try {
      // Initialize Copilot provider
      const copilotProvider = new CopilotFunctionCallingProvider(
        this.prisma,
        process.env.GITHUB_COPILOT_API_KEY || '',
        process.env.GITHUB_COPILOT_ENDPOINT
      );

      this.providers.set('copilot', copilotProvider);

      console.log('Chat providers initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chat providers:', error);
    }
  }

  /**
   * Create new chat session
   */
  async createSession(
    contextId: string,
    contextType: 'project' | 'agent'
  ): Promise<Result<ChatSession, ServiceError>> {
    try {
      const session = await this.sessionManager.createSession(
        contextId,
        contextType
      );

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'SESSION_CREATION_ERROR',
          `Nie udało się utworzyć sesji czatu: ${
            error instanceof Error ? error.message : 'Nieznany błąd'
          }`,
          { contextId, contextType, originalError: error }
        ),
      };
    }
  }

  /**
   * Get chat session
   */
  async getSession(
    sessionId: string
  ): Promise<Result<ChatSession | null, ServiceError>> {
    try {
      const session = await this.sessionManager.getSession(sessionId);

      return {
        success: true,
        data: session,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'SESSION_FETCH_ERROR',
          `Nie udało się pobrać sesji czatu: ${
            error instanceof Error ? error.message : 'Nieznany błąd'
          }`,
          { sessionId, originalError: error }
        ),
      };
    }
  }

  /**
   * Process chat message
   */
  async processMessage(
    request: ChatRequest
  ): Promise<Result<ChatResponse, ServiceError>> {
    try {
      // Get or validate session
      const sessionResult = await this.getSession(request.sessionId);
      if (!sessionResult.success || !sessionResult.data) {
        return {
          success: false,
          error: createServiceError(
            'SESSION_NOT_FOUND',
            `Sesja czatu ${request.sessionId} nie została znaleziona`,
            { sessionId: request.sessionId }
          ),
        };
      }

      const session = sessionResult.data;

      // Get provider
      const providerName =
        request.provider ||
        session.activeProviders[0] ||
        this.config.defaultProvider;
      const provider = this.providers.get(providerName);

      if (!provider) {
        return {
          success: false,
          error: createServiceError(
            'PROVIDER_NOT_FOUND',
            `Provider ${providerName} nie jest dostępny`,
            {
              provider: providerName,
              availableProviders: Array.from(this.providers.keys()),
            }
          ),
        };
      }

      // Build context if needed
      let contextMessages: any[] = [];
      if (
        request.settings?.includeContext !== false &&
        this.config.enableContextAwareness
      ) {
        contextMessages = await this.buildContextMessages(
          session,
          request.settings?.maxContextMessages
        );
      }

      // Prepare generation prompt
      let prompt = request.message;
      if (contextMessages.length > 0) {
        const contextText = contextMessages
          .map((msg: any) => `${msg.role}: ${msg.content}`)
          .join('\n');
        prompt = `${contextText}\n\nuser: ${request.message}`;
      }

      const generationOptions = {
        temperature: request.settings?.temperature || 0.7,
        maxTokens: request.settings?.maxTokens || 4000,
        ...request.settings,
      };

      // Generate response
      const generationResult = await provider.generateText(
        prompt,
        generationOptions
      );

      if (!generationResult.success) {
        return {
          success: false,
          error: createServiceError(
            'GENERATION_ERROR',
            `Nie udało się wygenerować odpowiedzi: ${
              generationResult.error?.message || 'Nieznany błąd'
            }`,
            { provider: providerName, originalError: generationResult.error }
          ),
        };
      }

      // Create response
      const response: ChatResponse = {
        messageId: this.generateMessageId(),
        sessionId: request.sessionId,
        content: generationResult.data.text || '',
        provider: providerName,
        agentId: request.agentId,
        toolsUsed: [], // No tools used for basic generation
        contextUsed:
          contextMessages.length > 0
            ? { messagesCount: contextMessages.length }
            : undefined,
        metadata: {
          tokensUsed: generationResult.data.usage?.totalTokens || 0,
          processingTime: 0, // Not available from provider
        },
        timestamp: new Date(),
      };

      // Update session stats
      await this.sessionManager.updateSession(request.sessionId, {
        stats: {
          messagesCount: session.stats.messagesCount + 1,
          toolsUsed: [
            ...new Set([...session.stats.toolsUsed, ...response.toolsUsed]),
          ],
          tokensUsed:
            (session.stats.tokensUsed || 0) +
            (response.metadata?.tokensUsed || 0),
        },
        lastActivityAt: new Date(),
        lastMessageAt: new Date(),
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'MESSAGE_PROCESSING_ERROR',
          `Nie udało się przetworzyć wiadomości: ${
            error instanceof Error ? error.message : 'Nieznany błąd'
          }`,
          { request, originalError: error }
        ),
      };
    }
  }

  /**
   * List user sessions
   */
  async listSessions(
    contextId?: string
  ): Promise<Result<ChatSession[], ServiceError>> {
    try {
      const sessions = await this.sessionManager.listSessions(contextId);

      return {
        success: true,
        data: sessions,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'SESSIONS_LIST_ERROR',
          `Nie udało się pobrać listy sesji: ${
            error instanceof Error ? error.message : 'Nieznany błąd'
          }`,
          { contextId, originalError: error }
        ),
      };
    }
  }

  /**
   * Delete chat session
   */
  async deleteSession(
    sessionId: string
  ): Promise<Result<boolean, ServiceError>> {
    try {
      const deleted = await this.sessionManager.deleteSession(sessionId);

      return {
        success: true,
        data: deleted,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'SESSION_DELETE_ERROR',
          `Nie udało się usunąć sesji: ${
            error instanceof Error ? error.message : 'Nieznany błąd'
          }`,
          { sessionId, originalError: error }
        ),
      };
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(providerName: string): boolean {
    return this.providers.has(providerName);
  }

  /**
   * Get service configuration
   */
  getConfig(): ChatConfig {
    return { ...this.config };
  }

  /**
   * Update service configuration
   */
  updateConfig(updates: Partial<ChatConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
    };
  }

  /**
   * Get service statistics
   */
  async getServiceStats(): Promise<Result<any, ServiceError>> {
    try {
      const sessions = await this.sessionManager.listSessions();

      const stats = {
        totalSessions: sessions.length,
        activeSessions: sessions.filter(s => {
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
          return s.lastActivityAt > hourAgo;
        }).length,
        totalMessages: sessions.reduce(
          (sum, s) => sum + s.stats.messagesCount,
          0
        ),
        totalTokens: sessions.reduce(
          (sum, s) => sum + (s.stats.tokensUsed || 0),
          0
        ),
        providerUsage: this.getProviderUsageStats(sessions),
        topTools: this.getTopToolsStats(sessions),
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'STATS_ERROR',
          `Nie udało się pobrać statystyk: ${
            error instanceof Error ? error.message : 'Nieznany błąd'
          }`,
          { originalError: error }
        ),
      };
    }
  }

  /**
   * Cleanup old sessions
   */
  async cleanup(
    olderThanHours: number = 24
  ): Promise<Result<number, ServiceError>> {
    try {
      // Implement cleanup of old sessions
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - olderThanHours);

      let deletedCount = 0;
      const sessionsToDelete: string[] = [];

      // Find and delete old sessions through session manager
      // Note: ChatSession model doesn't exist in current schema
      try {
        console.log(
          `🧹 Attempting to cleanup chat sessions older than ${olderThanHours} hours`
        );

        // In a real implementation with ChatSession model:
        // const deleteResult = await this.prisma.chatSession.deleteMany({
        //   where: { updatedAt: { lt: cutoffTime } }
        // });
        // deletedCount = deleteResult.count;

        deletedCount = 0; // No actual cleanup without proper model
      } catch (error) {
        console.warn(
          'Database cleanup not available, using fallback method:',
          error
        );

        // Fallback: cleanup sessions manually if needed
        // In a real implementation, we would iterate through sessionManager
        deletedCount = 0;
      }

      console.log(`🧹 Cleaned up ${deletedCount} old chat sessions`);

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error) {
      return {
        success: false,
        error: createServiceError(
          'CLEANUP_ERROR',
          `Nie udało się wyczyścić starych sesji: ${
            error instanceof Error ? error.message : 'Nieznany błąd'
          }`,
          { olderThanHours, originalError: error }
        ),
      };
    }
  }

  /**
   * Private helper methods
   */
  private async buildContextMessages(
    session: ChatSession,
    maxMessages?: number
  ): Promise<any[]> {
    try {
      // Get context from context manager
      let context = null;
      try {
        // Try to get project context if available
        if (session.contextId) {
          context = await this.contextManager.getProjectContext(
            session.contextId
          );
        }
      } catch (error) {
        console.warn('Failed to get context from context manager:', error);
      }

      // Build context messages array
      const contextMessages: any[] = [];

      if (context) {
        contextMessages.push({
          role: 'system',
          content: `Kontekst ${session.contextType}: ${JSON.stringify(
            context,
            null,
            2
          )}`,
        });
      }

      return contextMessages.slice(
        0,
        maxMessages || this.config.maxSessionHistory
      );
    } catch (error) {
      console.warn('Failed to build context messages:', error);
      return [];
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getProviderUsageStats(
    sessions: ChatSession[]
  ): Record<string, number> {
    const usage: Record<string, number> = {};

    sessions.forEach(session => {
      session.activeProviders.forEach(provider => {
        usage[provider] = (usage[provider] || 0) + session.stats.messagesCount;
      });
    });

    return usage;
  }

  private getTopToolsStats(
    sessions: ChatSession[]
  ): Array<{ tool: string; usage: number }> {
    const toolUsage: Record<string, number> = {};

    sessions.forEach(session => {
      session.stats.toolsUsed.forEach(tool => {
        toolUsage[tool] = (toolUsage[tool] || 0) + 1;
      });
    });

    return Object.entries(toolUsage)
      .map(([tool, usage]) => ({ tool, usage }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
  }
}

export default ChatIntegrationService;
