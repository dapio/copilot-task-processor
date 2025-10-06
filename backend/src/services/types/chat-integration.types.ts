/**
 * Chat Integration Types
 * Type definitions for chat integration system
 */

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
  participants: string[];
  activeProviders: string[];
  currentWorkflow?: string;
  settings: ChatSessionSettings;
  stats: ChatSessionStats;
  metadata: Record<string, any>;
  createdAt: Date;
  lastActivityAt: Date;
  lastMessageAt?: Date;
}

export interface ChatSessionSettings {
  autoSave: boolean;
  contextAware: boolean;
  multiProvider: boolean;
  workspaceAccess: boolean;
}

export interface ChatSessionStats {
  messagesCount: number;
  toolsUsed: string[];
  tokensUsed?: number;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  contextId?: string;
  provider?: string;
  agentId?: string;
  attachments?: ChatAttachment[];
  settings?: ChatRequestSettings;
}

export interface ChatRequestSettings {
  includeContext?: boolean;
  includeWorkspace?: boolean;
  maxContextMessages?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  messageId: string;
  sessionId: string;
  content: string;
  provider: string;
  agentId?: string;
  toolsUsed: string[];
  contextUsed?: any;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ChatConfig {
  defaultProvider: string;
  enableContextAwareness: boolean;
  enableWorkspaceAccess: boolean;
  maxSessionHistory: number;
  autoSaveInterval: number;
  supportedProviders: string[];
}

export interface IChatSessionManager {
  createSession(
    contextId: string,
    contextType: 'project' | 'agent'
  ): Promise<ChatSession>;
  getSession(sessionId: string): Promise<ChatSession | null>;
  updateSession(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession>;
  deleteSession(sessionId: string): Promise<boolean>;
  listSessions(contextId?: string): Promise<ChatSession[]>;
}

export interface IChatMessageManager {
  addMessage(
    message: Omit<ChatMessage, 'id' | 'timestamp'>
  ): Promise<ChatMessage>;
  getMessage(messageId: string): Promise<ChatMessage | null>;
  getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
  updateMessage(
    messageId: string,
    updates: Partial<ChatMessage>
  ): Promise<ChatMessage>;
  deleteMessage(messageId: string): Promise<boolean>;
  addReaction(messageId: string, reaction: ChatReaction): Promise<boolean>;
  removeReaction(messageId: string, userId: string): Promise<boolean>;
}

export interface IChatContextManager {
  getContext(contextId: string, contextType: 'project' | 'agent'): Promise<any>;
  buildContextMessage(sessionId: string, maxMessages?: number): Promise<any[]>;
  updateContext(contextId: string, updates: any): Promise<void>;
}

export interface IChatProviderManager {
  getProvider(providerName: string): any;
  processMessage(request: ChatRequest): Promise<ChatResponse>;
  listProviders(): string[];
  isProviderAvailable(providerName: string): boolean;
}
