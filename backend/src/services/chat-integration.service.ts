/**
 * Chat Integration System - Integracja z chatem na poziomie projektu
 * ThinkCode AI Platform - Enterprise-grade chat integration with context awareness
 */

import ContextManager, {
  AgentContext,
  ProjectContext,
  ContextMessage,
} from './context-manager';
import {
  IMLProvider,
  Result,
  MLError,
  GenerationResult,
} from '../providers/ml-provider.interface';
import { PrismaClient } from '@prisma/client';

export interface ChatMessage {
  id: string;
  sessionId: string;
  contextId: string;
  contextType: 'project' | 'agent';
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider?: string;
  agentId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  parentMessageId?: string;
  reactions?: ChatReaction[];
  attachments?: ChatAttachment[];
}

export interface ChatReaction {
  userId: string;
  type: 'like' | 'dislike' | 'helpful' | 'needs_work';
  timestamp: Date;
}

export interface ChatAttachment {
  id: string;
  type: 'file' | 'image' | 'code' | 'workspace';
  name: string;
  content: string;
  mimeType?: string;
  size?: number;
}

export interface ChatSession {
  id: string;
  contextId: string;
  contextType: 'project' | 'agent';
  title: string;
  participants: string[]; // user IDs or agent IDs
  activeProviders: string[];
  currentWorkflow?: string;
  settings: {
    autoSave: boolean;
    contextAware: boolean;
    multiProvider: boolean;
    workspaceAccess: boolean;
  };
  metadata: Record<string, any>;
  createdAt: Date;
  lastActivityAt: Date;
  lastMessageAt?: Date;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  contextId?: string;
  provider?: string;
  agentId?: string;
  attachments?: ChatAttachment[];
  settings?: {
    includeContext?: boolean;
    includeWorkspace?: boolean;
    maxContextMessages?: number;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface ChatResponse {
  messageId: string;
  sessionId: string;
  content: string;
  provider: string;
  agentId?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  contextUsed?: {
    projectContext?: boolean;
    agentContext?: boolean;
    messagesCount: number;
    workspaceFiles?: string[];
  };
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class ChatIntegrationService {
  private prisma: PrismaClient;
  private contextManager: ContextManager;
  private providers: Map<string, IMLProvider> = new Map();
  private sessions: Map<string, ChatSession> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map(); // sessionId -> messages

  constructor(prisma: PrismaClient, contextManager: ContextManager) {
    this.prisma = prisma;
    this.contextManager = contextManager;
  }

  /**
   * Rejestruje provider AI
   */
  registerProvider(name: string, provider: IMLProvider): void {
    this.providers.set(name, provider);
    console.log(`Registered AI provider: ${name}`);
  }

  /**
   * Usuwa provider AI
   */
  unregisterProvider(name: string): boolean {
    return this.providers.delete(name);
  }

  /**
   * Pobiera listę dostępnych providerów
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // === Session Management ===

  /**
   * Tworzy nową sesję chatu
   */
  async createChatSession(options: {
    contextId: string;
    contextType: 'project' | 'agent';
    title: string;
    participants?: string[];
    activeProviders?: string[];
    settings?: Partial<ChatSession['settings']>;
  }): Promise<string> {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: ChatSession = {
      id: sessionId,
      contextId: options.contextId,
      contextType: options.contextType,
      title: options.title,
      participants: options.participants || [],
      activeProviders: options.activeProviders || ['github-copilot'],
      settings: {
        autoSave: true,
        contextAware: true,
        multiProvider: false,
        workspaceAccess: true,
        ...options.settings,
      },
      metadata: {
        version: '1.0.0',
        chatType: 'integrated',
      },
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.messages.set(sessionId, []);

    // Dodaj wiadomość systemową z kontekstem
    await this.addSystemMessage(
      sessionId,
      await this.generateSystemWelcomeMessage(session)
    );

    return sessionId;
  }

  /**
   * Pobiera sesję chatu
   */
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivityAt = new Date();
    }
    return session || null;
  }

  /**
   * Aktualizuje sesję chatu
   */
  async updateChatSession(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    Object.assign(session, updates, { lastActivityAt: new Date() });
    return true;
  }

  /**
   * Usuwa sesję chatu
   */
  async deleteChatSession(sessionId: string): Promise<boolean> {
    this.sessions.delete(sessionId);
    this.messages.delete(sessionId);
    return true;
  }

  // === Message Management ===

  /**
   * Przetwarza wiadomość użytkownika i generuje odpowiedź
   */
  async processMessage(
    request: ChatRequest
  ): Promise<Result<ChatResponse, MLError>> {
    try {
      const session = await this.getChatSession(request.sessionId);
      if (!session) {
        return {
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: `Chat session ${request.sessionId} not found`,
            retryable: false,
          },
        };
      }

      // Dodaj wiadomość użytkownika
      const userMessageId = await this.addUserMessage(request);

      // Przygotuj kontekst dla providera
      const context = await this.buildProviderContext(session, request);

      // Wybierz provider
      const providerName =
        request.provider || session.activeProviders[0] || 'github-copilot';
      const provider = this.providers.get(providerName);

      if (!provider) {
        return {
          success: false,
          error: {
            code: 'PROVIDER_NOT_AVAILABLE',
            message: `Provider ${providerName} is not available`,
            retryable: false,
          },
        };
      }

      // Generuj odpowiedź
      const generationResult = await provider.generateText(request.message, {
        temperature: request.settings?.temperature,
        maxTokens: request.settings?.maxTokens,
      });

      if (!generationResult.success) {
        return generationResult;
      }

      // Dodaj odpowiedź asystenta
      const assistantMessageId = await this.addAssistantMessage(
        request.sessionId,
        generationResult.data.text,
        providerName,
        request.agentId
      );

      // Aktualizuj kontekst agenta jeśli dotyczy
      if (session.contextType === 'agent' && session.settings.contextAware) {
        await this.updateAgentContextFromChat(
          session.contextId,
          userMessageId,
          assistantMessageId
        );
      }

      // Przygotuj odpowiedź
      const response: ChatResponse = {
        messageId: assistantMessageId,
        sessionId: request.sessionId,
        content: generationResult.data.text,
        provider: providerName,
        agentId: request.agentId,
        usage: generationResult.data.usage,
        contextUsed: context.metadata,
        metadata: generationResult.data.metadata,
        timestamp: new Date(),
      };

      // Aktualizuj sesję
      session.lastMessageAt = new Date();
      session.lastActivityAt = new Date();

      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHAT_PROCESSING_ERROR',
          message: `Failed to process chat message: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: error,
          retryable: true,
        },
      };
    }
  }

  /**
   * Pobiera historię wiadomości w sesji
   */
  async getMessageHistory(
    sessionId: string,
    options?: {
      limit?: number;
      offset?: number;
      fromMessageId?: string;
      includeSystem?: boolean;
    }
  ): Promise<ChatMessage[]> {
    const messages = this.messages.get(sessionId) || [];

    let filteredMessages = [...messages];

    // Filtruj wiadomości systemowe jeśli nie wymagane
    if (options?.includeSystem === false) {
      filteredMessages = filteredMessages.filter(m => m.role !== 'system');
    }

    // Znajdź punkt początkowy
    if (options?.fromMessageId) {
      const index = filteredMessages.findIndex(
        m => m.id === options.fromMessageId
      );
      if (index > -1) {
        filteredMessages = filteredMessages.slice(index);
      }
    }

    // Zastosuj offset i limit
    const offset = options?.offset || 0;
    const limit = options?.limit;

    if (limit) {
      filteredMessages = filteredMessages.slice(offset, offset + limit);
    } else if (offset > 0) {
      filteredMessages = filteredMessages.slice(offset);
    }

    return filteredMessages;
  }

  /**
   * Dodaje reakcję do wiadomości
   */
  async addReaction(
    messageId: string,
    reaction: Omit<ChatReaction, 'timestamp'>
  ): Promise<boolean> {
    // Znajdź wiadomość
    for (const messages of this.messages.values()) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        if (!message.reactions) {
          message.reactions = [];
        }

        // Usuń poprzednią reakcję tego użytkownika
        message.reactions = message.reactions.filter(
          r => r.userId !== reaction.userId
        );

        // Dodaj nową reakcję
        message.reactions.push({
          ...reaction,
          timestamp: new Date(),
        });

        return true;
      }
    }

    return false;
  }

  // === Context Integration ===

  /**
   * Synchronizuje chat z kontekstem agenta
   */
  async syncWithAgentContext(
    sessionId: string,
    agentContextId: string
  ): Promise<boolean> {
    const session = await this.getChatSession(sessionId);
    const messages = await this.getMessageHistory(sessionId, {
      includeSystem: false,
    });

    if (!session || session.contextType !== 'agent') {
      return false;
    }

    // Synchronizuj wiadomości z kontekstem agenta
    for (const message of messages) {
      await this.contextManager.addMessage(agentContextId, {
        role: message.role,
        content: message.content,
        provider: message.provider,
        metadata: message.metadata,
      });
    }

    return true;
  }

  /**
   * Tworzy chat session z istniejącego kontekstu agenta
   */
  async createSessionFromAgentContext(
    agentContextId: string,
    title: string
  ): Promise<string> {
    const agentContext =
      await this.contextManager.getAgentContext(agentContextId);
    if (!agentContext) {
      throw new Error(`Agent context ${agentContextId} not found`);
    }

    const sessionId = await this.createChatSession({
      contextId: agentContextId,
      contextType: 'agent',
      title: title || `Chat with ${agentContext.name}`,
      activeProviders: ['github-copilot'],
    });

    // Załaduj historię z kontekstu agenta
    const history =
      await this.contextManager.getConversationHistory(agentContextId);

    for (const contextMessage of history) {
      if (contextMessage.role !== 'system') {
        const chatRole: 'user' | 'assistant' =
          contextMessage.role === 'function'
            ? 'assistant'
            : contextMessage.role;
        await this.addChatMessage(sessionId, {
          role: chatRole,
          content: contextMessage.content,
          provider: contextMessage.provider,
          metadata: contextMessage.metadata,
        });
      }
    }

    return sessionId;
  }

  // === Private Methods ===

  private async addUserMessage(request: ChatRequest): Promise<string> {
    return await this.addChatMessage(request.sessionId, {
      role: 'user',
      content: request.message,
      attachments: request.attachments,
      metadata: {
        settings: request.settings,
        agentId: request.agentId,
      },
    });
  }

  private async addAssistantMessage(
    sessionId: string,
    content: string,
    provider: string,
    agentId?: string
  ): Promise<string> {
    return await this.addChatMessage(sessionId, {
      role: 'assistant',
      content,
      provider,
      agentId,
      metadata: {
        generatedBy: provider,
        agentId,
      },
    });
  }

  private async addSystemMessage(
    sessionId: string,
    content: string
  ): Promise<string> {
    return await this.addChatMessage(sessionId, {
      role: 'system',
      content,
      metadata: {
        type: 'system',
        automated: true,
      },
    });
  }

  private async addChatMessage(
    sessionId: string,
    message: Omit<
      ChatMessage,
      'id' | 'sessionId' | 'contextId' | 'contextType' | 'timestamp'
    >
  ): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const chatMessage: ChatMessage = {
      id: messageId,
      sessionId,
      contextId: session.contextId,
      contextType: session.contextType,
      timestamp: new Date(),
      ...message,
    };

    const sessionMessages = this.messages.get(sessionId) || [];
    sessionMessages.push(chatMessage);
    this.messages.set(sessionId, sessionMessages);

    return messageId;
  }

  private async buildProviderContext(
    session: ChatSession,
    request: ChatRequest
  ): Promise<{ prompt: string; metadata: any }> {
    const context = {
      messages: [] as string[],
      workspace: [] as string[],
      projectInfo: null as any,
      agentInfo: null as any,
    };

    // Dodaj historię wiadomości jeśli wymagane
    if (request.settings?.includeContext !== false) {
      const history = await this.getMessageHistory(session.id, {
        limit: request.settings?.maxContextMessages || 20,
        includeSystem: false,
      });

      context.messages = history.map(m => `${m.role}: ${m.content}`);
    }

    // Dodaj kontekst projektu/agenta jeśli wymagane
    if (session.settings.contextAware) {
      if (session.contextType === 'agent') {
        const fullContext = await this.contextManager.getFullAgentContext(
          session.contextId
        );
        if (fullContext) {
          context.projectInfo = fullContext.projectContext;
          context.agentInfo = fullContext.agentContext;
        }
      } else if (session.contextType === 'project') {
        context.projectInfo = await this.contextManager.getProjectContext(
          session.contextId
        );
      }
    }

    // Dodaj informacje o workspace jeśli wymagane
    if (
      request.settings?.includeWorkspace &&
      session.settings.workspaceAccess
    ) {
      // TODO: Dodaj informacje o workspace
      context.workspace = ['workspace context would be added here'];
    }

    const prompt = this.formatContextForProvider(request.message, context);

    return {
      prompt,
      metadata: {
        projectContext: !!context.projectInfo,
        agentContext: !!context.agentInfo,
        messagesCount: context.messages.length,
        workspaceFiles: context.workspace,
      },
    };
  }

  private formatContextForProvider(userMessage: string, context: any): string {
    const sections = [];

    if (context.projectInfo) {
      sections.push(
        `**PROJECT CONTEXT:**\nProject: ${context.projectInfo.name}\n${context.projectInfo.description || ''}`
      );
    }

    if (context.agentInfo) {
      sections.push(
        `**AGENT CONTEXT:**\nAgent: ${context.agentInfo.name}\n${context.agentInfo.description || ''}`
      );
    }

    if (context.messages.length > 0) {
      sections.push(
        `**CONVERSATION HISTORY:**\n${context.messages.slice(-10).join('\n')}`
      );
    }

    if (context.workspace.length > 0) {
      sections.push(`**WORKSPACE:**\n${context.workspace.join('\n')}`);
    }

    sections.push(`**USER MESSAGE:**\n${userMessage}`);

    return sections.join('\n\n---\n\n');
  }

  private async updateAgentContextFromChat(
    agentContextId: string,
    userMessageId: string,
    assistantMessageId: string
  ): Promise<void> {
    // TODO: Synchronizuj specyficzne wiadomości z kontekstem agenta
    console.log(
      `Updating agent context ${agentContextId} with messages ${userMessageId}, ${assistantMessageId}`
    );
  }

  private async generateSystemWelcomeMessage(
    session: ChatSession
  ): Promise<string> {
    const contextInfo = [];

    if (session.contextType === 'project') {
      const projectContext = await this.contextManager.getProjectContext(
        session.contextId
      );
      if (projectContext) {
        contextInfo.push(`Project: ${projectContext.name}`);
      }
    } else if (session.contextType === 'agent') {
      const agentContext = await this.contextManager.getAgentContext(
        session.contextId
      );
      if (agentContext) {
        contextInfo.push(`Agent: ${agentContext.name}`);
      }
    }

    contextInfo.push(`Active Providers: ${session.activeProviders.join(', ')}`);

    return `🚀 **ThinkCode AI Platform - Chat Integration**

**Session:** ${session.title}
${contextInfo.join(' | ')}

Witaj w zintegrowanym systemie chat z pełnym dostępem do kontekstu projektu. Masz dostęp do:

✅ **Kontekst projektu** - Pełna historia i stan projektu
✅ **Multi-provider AI** - GitHub Copilot i inne providery
✅ **Workspace integration** - Dostęp do plików i kodu
✅ **Agent collaboration** - Współpraca z specjalistycznymi agentami
✅ **Workflow orchestration** - Centralne zarządzanie zadaniami

**Jak mogę Ci pomóc?**`;
  }

  // === Utility Methods ===

  /**
   * Pobiera statystyki sesji
   */
  async getSessionStats(sessionId: string): Promise<{
    messagesCount: number;
    participantsCount: number;
    providersUsed: string[];
    duration: number;
    lastActivity: Date;
  } | null> {
    const session = await this.getChatSession(sessionId);
    const messages = await this.getMessageHistory(sessionId);

    if (!session) {
      return null;
    }

    const providersUsed = [
      ...new Set(messages.filter(m => m.provider).map(m => m.provider!)),
    ];

    const duration =
      session.lastActivityAt.getTime() - session.createdAt.getTime();

    return {
      messagesCount: messages.length,
      participantsCount: session.participants.length,
      providersUsed,
      duration,
      lastActivity: session.lastActivityAt,
    };
  }

  /**
   * Eksportuje historię chatu
   */
  async exportChatHistory(
    sessionId: string,
    format: 'json' | 'markdown' | 'text' = 'json'
  ): Promise<string> {
    const session = await this.getChatSession(sessionId);
    const messages = await this.getMessageHistory(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    switch (format) {
      case 'markdown':
        return this.exportToMarkdown(session, messages);
      case 'text':
        return this.exportToText(session, messages);
      default:
        return JSON.stringify({ session, messages }, null, 2);
    }
  }

  private exportToMarkdown(
    session: ChatSession,
    messages: ChatMessage[]
  ): string {
    const lines = [
      `# ${session.title}`,
      '',
      `**Session ID:** ${session.id}`,
      `**Created:** ${session.createdAt.toISOString()}`,
      `**Context:** ${session.contextType} - ${session.contextId}`,
      `**Providers:** ${session.activeProviders.join(', ')}`,
      '',
      '## Messages',
      '',
    ];

    for (const message of messages) {
      lines.push(
        `### ${message.role.toUpperCase()} - ${message.timestamp.toISOString()}`
      );
      if (message.provider) {
        lines.push(`**Provider:** ${message.provider}`);
      }
      lines.push('');
      lines.push(message.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  private exportToText(session: ChatSession, messages: ChatMessage[]): string {
    const lines = [
      `CHAT SESSION: ${session.title}`,
      `ID: ${session.id}`,
      `Created: ${session.createdAt.toISOString()}`,
      `Context: ${session.contextType} - ${session.contextId}`,
      `Providers: ${session.activeProviders.join(', ')}`,
      '',
      'MESSAGES:',
      '========',
    ];

    for (const message of messages) {
      lines.push('');
      lines.push(
        `[${message.timestamp.toISOString()}] ${message.role.toUpperCase()}${message.provider ? ` (${message.provider})` : ''}:`
      );
      lines.push(message.content);
      lines.push('--------');
    }

    return lines.join('\n');
  }
}

export default ChatIntegrationService;
