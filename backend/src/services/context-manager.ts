/**
 * Context Management System - Zarządzanie kontekstem projektów i agentów
 * ThinkCode AI Platform - Enterprise-grade context management
 */

import { PrismaClient } from '@prisma/client';

export interface ProjectContext {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  settings: {
    maxHistoryMessages: number;
    autoSave: boolean;
    persistentMemory: boolean;
    contextSharing: boolean;
  };
  workspace?: {
    rootPath: string;
    includePatterns: string[];
    excludePatterns: string[];
    activeFiles: string[];
    recentFiles: string[];
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  sharedWith: string[];
}

export interface AgentContext {
  id: string;
  agentId: string;
  parentProjectContextId?: string;
  name: string;
  description?: string;
  systemPrompt?: string;
  conversationHistory: ContextMessage[];
  state: Record<string, any>;
  settings: {
    maxHistoryMessages: number;
    inheritFromProject: boolean;
    autoCleanup: boolean;
    memoryRetention: number; // dni
  };
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt: Date;
}

export interface ContextMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  provider?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  parentMessageId?: string;
  edited?: boolean;
  editHistory?: {
    content: string;
    timestamp: Date;
    reason?: string;
  }[];
}

export interface ContextSession {
  id: string;
  contextId: string;
  contextType: 'project' | 'agent';
  sessionData: Record<string, any>;
  activeProviders: string[];
  currentWorkflow?: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt?: Date;
}

export class ContextManager {
  private prisma: PrismaClient;
  private projectContexts: Map<string, ProjectContext> = new Map();
  private agentContexts: Map<string, AgentContext> = new Map();
  private sessions: Map<string, ContextSession> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // === Project Context Management ===

  /**
   * Tworzy nowy kontekst projektu
   */
  async createProjectContext(options: {
    projectId: string;
    name: string;
    description?: string;
    systemPrompt?: string;
    workspace?: Partial<ProjectContext['workspace']>;
    settings?: Partial<ProjectContext['settings']>;
    createdBy?: string;
  }): Promise<string> {
    const contextId = `proj_ctx_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const context: ProjectContext = {
      id: contextId,
      projectId: options.projectId,
      name: options.name,
      description: options.description,
      systemPrompt:
        options.systemPrompt || this.getDefaultProjectSystemPrompt(),
      settings: {
        maxHistoryMessages: 100,
        autoSave: true,
        persistentMemory: true,
        contextSharing: false,
        ...options.settings,
      },
      workspace: options.workspace
        ? {
            rootPath: '',
            includePatterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
            excludePatterns: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
            activeFiles: [],
            recentFiles: [],
            ...options.workspace,
          }
        : undefined,
      metadata: {
        version: '1.0.0',
        contextType: 'project',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options.createdBy,
      sharedWith: [],
    };

    this.projectContexts.set(contextId, context);

    // Zapisz w bazie danych
    try {
      await this.persistProjectContext(context);
    } catch (error) {
      console.error('Failed to persist project context:', error);
    }

    return contextId;
  }

  /**
   * Pobiera kontekst projektu
   */
  async getProjectContext(contextId: string): Promise<ProjectContext | null> {
    // Sprawdź cache
    let context = this.projectContexts.get(contextId);

    if (!context) {
      // Załaduj z bazy danych
      const loadedContext = await this.loadProjectContext(contextId);
      if (loadedContext) {
        context = loadedContext;
        this.projectContexts.set(contextId, context);
      }
    }

    return context || null;
  }

  /**
   * Aktualizuje kontekst projektu
   */
  async updateProjectContext(
    contextId: string,
    updates: Partial<ProjectContext>
  ): Promise<boolean> {
    const context = await this.getProjectContext(contextId);
    if (!context) {
      return false;
    }

    Object.assign(context, updates, { updatedAt: new Date() });

    try {
      await this.persistProjectContext(context);
      return true;
    } catch (error) {
      console.error('Failed to update project context:', error);
      return false;
    }
  }

  /**
   * Usuwa kontekst projektu
   */
  async deleteProjectContext(contextId: string): Promise<boolean> {
    this.projectContexts.delete(contextId);

    try {
      // Usuń powiązane konteksty agentów
      const agentContexts = Array.from(this.agentContexts.values()).filter(
        ctx => ctx.parentProjectContextId === contextId
      );

      for (const agentCtx of agentContexts) {
        await this.deleteAgentContext(agentCtx.id);
      }

      // Remove from database (using Project model for now as there's no dedicated context model)
      try {
        // For now, we'll store context in the project's metadata field
        await this.prisma.project.updateMany({
          where: { id: contextId.replace('ctx_', '') }, // Remove context prefix if exists
          data: {
            metadata: {}, // Clear context metadata
          },
        });
        console.log(`🗑️ Cleared project context ${contextId} from database`);
      } catch (dbError) {
        console.error('Failed to delete from database:', dbError);
        // Don't fail if database deletion fails, in-memory deletion already succeeded
      }

      return true;
    } catch (error) {
      console.error('Failed to delete project context:', error);
      return false;
    }
  }

  // === Agent Context Management ===

  /**
   * Tworzy nowy kontekst agenta
   */
  async createAgentContext(options: {
    agentId: string;
    parentProjectContextId?: string;
    name: string;
    description?: string;
    systemPrompt?: string;
    settings?: Partial<AgentContext['settings']>;
  }): Promise<string> {
    const contextId = `agent_ctx_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const context: AgentContext = {
      id: contextId,
      agentId: options.agentId,
      parentProjectContextId: options.parentProjectContextId,
      name: options.name,
      description: options.description,
      systemPrompt:
        options.systemPrompt ||
        (await this.getAgentSystemPrompt(
          options.agentId,
          options.parentProjectContextId
        )),
      conversationHistory: [],
      state: {},
      settings: {
        maxHistoryMessages: 50,
        inheritFromProject: true,
        autoCleanup: true,
        memoryRetention: 30,
        ...options.settings,
      },
      metadata: {
        version: '1.0.0',
        contextType: 'agent',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    };

    this.agentContexts.set(contextId, context);

    // Zapisz w bazie danych
    try {
      await this.persistAgentContext(context);
    } catch (error) {
      console.error('Failed to persist agent context:', error);
    }

    return contextId;
  }

  /**
   * Pobiera kontekst agenta
   */
  async getAgentContext(contextId: string): Promise<AgentContext | null> {
    // Sprawdź cache
    let context = this.agentContexts.get(contextId);

    if (!context) {
      // Załaduj z bazy danych
      const loadedContext = await this.loadAgentContext(contextId);
      if (loadedContext) {
        context = loadedContext;
        this.agentContexts.set(contextId, context);
      }
    }

    if (context) {
      context.lastAccessedAt = new Date();
    }

    return context || null;
  }

  /**
   * Aktualizuje kontekst agenta
   */
  async updateAgentContext(
    contextId: string,
    updates: Partial<AgentContext>
  ): Promise<boolean> {
    const context = await this.getAgentContext(contextId);
    if (!context) {
      return false;
    }

    Object.assign(context, updates, {
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
    });

    try {
      await this.persistAgentContext(context);
      return true;
    } catch (error) {
      console.error('Failed to update agent context:', error);
      return false;
    }
  }

  /**
   * Usuwa kontekst agenta
   */
  async deleteAgentContext(contextId: string): Promise<boolean> {
    this.agentContexts.delete(contextId);

    // Remove from database (using Agent model for context storage)
    try {
      await this.prisma.agent.updateMany({
        where: { id: contextId.replace('agent_ctx_', '') }, // Remove agent context prefix if exists
        data: {
          metadata: {}, // Clear agent context metadata
        },
      });
      console.log(`🗑️ Cleared agent context ${contextId} from database`);
    } catch (dbError) {
      console.error('Failed to delete agent context from database:', dbError);
    }
    return true;
  }

  // === Message Management ===

  /**
   * Dodaje wiadomość do kontekstu agenta
   */
  async addMessage(
    contextId: string,
    message: Omit<ContextMessage, 'id' | 'timestamp'>
  ): Promise<string> {
    const context = await this.getAgentContext(contextId);
    if (!context) {
      throw new Error(`Agent context ${contextId} not found`);
    }

    const messageId = `msg_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const fullMessage: ContextMessage = {
      id: messageId,
      timestamp: new Date(),
      ...message,
    };

    context.conversationHistory.push(fullMessage);

    // Ogranicz historię do maksymalnej liczby wiadomości
    if (
      context.conversationHistory.length > context.settings.maxHistoryMessages
    ) {
      const excess =
        context.conversationHistory.length -
        context.settings.maxHistoryMessages;
      context.conversationHistory.splice(0, excess);
    }

    context.updatedAt = new Date();
    context.lastAccessedAt = new Date();

    await this.persistAgentContext(context);

    return messageId;
  }

  /**
   * Pobiera historię konwersacji
   */
  async getConversationHistory(
    contextId: string,
    options?: {
      limit?: number;
      fromMessageId?: string;
      includeSystem?: boolean;
    }
  ): Promise<ContextMessage[]> {
    const context = await this.getAgentContext(contextId);
    if (!context) {
      return [];
    }

    let messages = [...context.conversationHistory];

    // Filtruj wiadomości systemowe jeśli nie wymagane
    if (options?.includeSystem === false) {
      messages = messages.filter(m => m.role !== 'system');
    }

    // Znajdź punkt początkowy jeśli podano fromMessageId
    if (options?.fromMessageId) {
      const index = messages.findIndex(m => m.id === options.fromMessageId);
      if (index > -1) {
        messages = messages.slice(index);
      }
    }

    // Ogranicz liczbę wiadomości
    if (options?.limit) {
      messages = messages.slice(-options.limit);
    }

    return messages;
  }

  // === Session Management ===

  /**
   * Tworzy nową sesję kontekstu
   */
  async createSession(
    contextId: string,
    contextType: 'project' | 'agent',
    options?: {
      sessionData?: Record<string, any>;
      activeProviders?: string[];
      expirationMinutes?: number;
    }
  ): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const session: ContextSession = {
      id: sessionId,
      contextId,
      contextType,
      sessionData: options?.sessionData || {},
      activeProviders: options?.activeProviders || [],
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: options?.expirationMinutes
        ? new Date(Date.now() + options.expirationMinutes * 60 * 1000)
        : undefined,
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Pobiera sesję
   */
  async getSession(sessionId: string): Promise<ContextSession | null> {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Sprawdź wygaśnięcie
    if (session.expiresAt && session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return null;
    }

    session.lastActivityAt = new Date();
    return session;
  }

  /**
   * Aktualizuje sesję
   */
  async updateSession(
    sessionId: string,
    updates: Partial<ContextSession>
  ): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return false;
    }

    Object.assign(session, updates, { lastActivityAt: new Date() });
    return true;
  }

  // === Context Integration Methods ===

  /**
   * Pobiera pełny kontekst dla agenta (projekt + agent)
   */
  async getFullAgentContext(agentContextId: string): Promise<{
    projectContext?: ProjectContext;
    agentContext: AgentContext;
    combinedSystemPrompt: string;
  } | null> {
    const agentContext = await this.getAgentContext(agentContextId);
    if (!agentContext) {
      return null;
    }

    let projectContext: ProjectContext | undefined;
    if (agentContext.parentProjectContextId) {
      const loadedProjectContext = await this.getProjectContext(
        agentContext.parentProjectContextId
      );
      projectContext = loadedProjectContext || undefined;
    }

    const combinedSystemPrompt = this.combineSystemPrompts(
      projectContext,
      agentContext
    );

    return {
      projectContext,
      agentContext,
      combinedSystemPrompt,
    };
  }

  /**
   * Czyści stare konteksty
   */
  async cleanupExpiredContexts(): Promise<void> {
    const now = new Date();

    // Usuń wygasłe sesje
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        this.sessions.delete(sessionId);
      }
    }

    // Usuń stare konteksty agentów z auto-cleanup
    for (const [contextId, context] of this.agentContexts.entries()) {
      if (context.settings.autoCleanup) {
        const retentionDays = context.settings.memoryRetention;
        const cutoffDate = new Date(
          now.getTime() - retentionDays * 24 * 60 * 60 * 1000
        );

        if (context.lastAccessedAt < cutoffDate) {
          await this.deleteAgentContext(contextId);
        }
      }
    }
  }

  // === Private Methods ===

  private async persistProjectContext(context: ProjectContext): Promise<void> {
    try {
      // Store context in project's metadata field
      const contextData = JSON.parse(
        JSON.stringify({
          contextId: context.id,
          name: context.name,
          description: context.description,
          systemPrompt: context.systemPrompt,
          settings: context.settings,
          workspace: context.workspace,
          metadata: context.metadata,
          sharedWith: context.sharedWith,
          updatedAt: context.updatedAt,
        })
      );

      await this.prisma.project.updateMany({
        where: { id: context.projectId },
        data: {
          metadata: contextData,
        },
      });

      console.log(`💾 Persisted project context ${context.id} to database`);
    } catch (error) {
      console.error('Failed to persist project context:', error);
      throw error;
    }
  }

  private async persistAgentContext(context: AgentContext): Promise<void> {
    try {
      // Store context in agent's metadata field
      const contextData = JSON.parse(
        JSON.stringify({
          contextId: context.id,
          parentProjectContextId: context.parentProjectContextId,
          name: context.name,
          description: context.description,
          systemPrompt: context.systemPrompt,
          conversationHistory: context.conversationHistory.slice(-50), // Keep only last 50 messages
          state: context.state,
          settings: context.settings,
          metadata: context.metadata,
          lastAccessedAt: context.lastAccessedAt,
          updatedAt: context.updatedAt,
        })
      );

      await this.prisma.agent.updateMany({
        where: { id: context.agentId },
        data: {
          metadata: contextData,
        },
      });

      console.log(`💾 Persisted agent context ${context.id} to database`);
    } catch (error) {
      console.error('Failed to persist agent context:', error);
      throw error;
    }
  }

  private async loadProjectContext(
    contextId: string
  ): Promise<ProjectContext | null> {
    try {
      // Try to load context from project metadata
      // For SQLite, we'll search by extracting the projectId from contextId
      const projectId = contextId.replace('project_ctx_', '');
      const project = await this.prisma.project.findFirst({
        where: { id: projectId },
      });

      if (!project || !project.metadata) {
        console.log(`📂 No project context found for ${contextId}`);
        return null;
      }

      const contextData = project.metadata as any;
      const projectContext: ProjectContext = {
        id: contextData.contextId || contextId,
        projectId: project.id,
        name: contextData.name || project.name,
        description: contextData.description || project.description,
        systemPrompt: contextData.systemPrompt,
        settings: contextData.settings || {
          maxHistoryMessages: 100,
          autoSave: true,
          persistentMemory: true,
          contextSharing: false,
        },
        workspace: contextData.workspace,
        metadata: contextData.metadata || {},
        createdAt: project.createdAt,
        updatedAt: contextData.updatedAt || project.updatedAt,
        sharedWith: contextData.sharedWith || [],
      };

      console.log(`📂 Loaded project context ${contextId} from database`);
      return projectContext;
    } catch (error) {
      console.error('Failed to load project context:', error);
      return null;
    }
  }

  private async loadAgentContext(
    contextId: string
  ): Promise<AgentContext | null> {
    try {
      // Try to load context from agent metadata
      // For SQLite, we'll search by extracting the agentId from contextId
      const agentId = contextId.replace('agent_ctx_', '');
      const agent = await this.prisma.agent.findFirst({
        where: { id: agentId },
      });

      if (!agent || !agent.metadata) {
        console.log(`🤖 No agent context found for ${contextId}`);
        return null;
      }

      const contextData = agent.metadata as any;
      const agentContext: AgentContext = {
        id: contextData.contextId || contextId,
        agentId: agent.id,
        parentProjectContextId: contextData.parentProjectContextId,
        name: contextData.name || agent.name,
        description: contextData.description,
        systemPrompt: contextData.systemPrompt,
        conversationHistory: contextData.conversationHistory || [],
        state: contextData.state || {},
        settings: contextData.settings || {
          maxHistoryMessages: 50,
          inheritFromProject: true,
          autoCleanup: true,
          memoryRetention: 7,
        },
        metadata: contextData.metadata || {},
        createdAt: agent.createdAt,
        updatedAt: contextData.updatedAt || agent.updatedAt,
        lastAccessedAt: contextData.lastAccessedAt || new Date(),
      };

      console.log(`🤖 Loaded agent context ${contextId} from database`);
      return agentContext;
    } catch (error) {
      console.error('Failed to load agent context:', error);
      return null;
    }
  }

  private async getAgentSystemPrompt(
    agentId: string,
    parentProjectContextId?: string
  ): Promise<string> {
    let prompt = this.getDefaultAgentSystemPrompt();

    // Jeśli agent ma rodzica, dziedzicz prompt z projektu
    if (parentProjectContextId) {
      const projectContext = await this.getProjectContext(
        parentProjectContextId
      );
      if (projectContext?.systemPrompt) {
        prompt = `${projectContext.systemPrompt}\n\n${prompt}`;
      }
    }

    // Load agent-specific prompt from database
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (agent?.metadata) {
        const agentData = agent.metadata as any;
        if (agentData.systemPrompt) {
          prompt = `${prompt}\n\n**AGENT SPECIFIC:**\n${agentData.systemPrompt}`;
        }
      }
    } catch (error) {
      console.error('Failed to load agent prompt from database:', error);
    }

    return prompt;
  }

  private combineSystemPrompts(
    projectContext?: ProjectContext,
    agentContext?: AgentContext
  ): string {
    const prompts: string[] = [];

    if (projectContext?.systemPrompt) {
      prompts.push(`**PROJECT CONTEXT:**\n${projectContext.systemPrompt}`);
    }

    if (agentContext?.systemPrompt) {
      prompts.push(`**AGENT CONTEXT:**\n${agentContext.systemPrompt}`);
    }

    if (prompts.length === 0) {
      return this.getDefaultAgentSystemPrompt();
    }

    return prompts.join('\n\n---\n\n');
  }

  private getDefaultProjectSystemPrompt(): string {
    return `Jesteś częścią ThinkCode AI Platform - zaawansowanego systemu zarządzania projektami z AI.

**KONTEKST PROJEKTU:**
- Działasz w ramach centralnie sterowanego workflow
- Masz dostęp do pełnej historii projektu i kontekstu
- Współpracujesz z wieloma providerami AI (głównie GitHub Copilot)
- Twoje działania są skoordynowane przez centralny orkiestrator

**MOŻLIWOŚCI:**
- Analiza i rozwój kodu projektu
- Zarządzanie dokumentacją
- Współpraca z agentami specjalistycznymi
- Integracja z systemami zewnętrznymi

**ZASADY:**
- Zawsze uwzględniaj kontekst projektu
- Współpracuj z innymi agentami w workflow
- Zachowuj spójność w całym projekcie
- Dokumentuj wszystkie istotne decyzje`;
  }

  private getDefaultAgentSystemPrompt(): string {
    return `Jesteś agentem AI w ramach ThinkCode AI Platform.

**TWOJA ROLA:**
- Wykonujesz specjalistyczne zadania w ramach workflow
- Masz dostęp do kontekstu projektu i historii konwersacji
- Współpracujesz z innymi agentami i providerami
- Działasz pod nadzorem centralnego orkiestratora

**MOŻLIWOŚCI:**
- Specjalistyczna analiza i przetwarzanie
- Integracja z różnymi providerami AI
- Dostęp do kontekstu projektu i workspace
- Komunikacja z innymi agentami

**ZASADY:**
- Działaj w ramach przypisanego workflow
- Wykorzystuj kontekst projektu i historię
- Współpracuj z innymi komponentami systemu
- Raportuj postęp i wyniki działań`;
  }
}

export default ContextManager;
