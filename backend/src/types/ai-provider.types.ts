/**
 * Multi-Provider Architecture System
 * Unified interface for all AI providers with flexible model assignment
 */

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: ProviderType;
  readonly supportedModels: ModelInfo[];

  // Core methods
  initialize(config: ProviderConfig): Promise<Result<boolean, ServiceError>>;
  chat(request: ChatRequest): Promise<Result<ChatResponse, ServiceError>>;
  checkHealth(): Promise<Result<HealthStatus, ServiceError>>;
  getAvailableModels(): Promise<Result<ModelInfo[], ServiceError>>;
}

export type ProviderType =
  | 'github-copilot'
  | 'azure-openai'
  | 'anthropic-claude'
  | 'deepseek'
  | 'openai'
  | 'custom';

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  maxTokens: number;
  costPer1kTokens: {
    input: number;
    output: number;
  };
  specializations: ModelSpecialization[];
}

export type ModelCapability =
  | 'chat'
  | 'code-completion'
  | 'code-review'
  | 'system-design'
  | 'text-generation'
  | 'analysis'
  | 'reasoning';

export type ModelSpecialization =
  | 'frontend-development'
  | 'backend-development'
  | 'system-architecture'
  | 'business-analysis'
  | 'qa-testing'
  | 'code-review'
  | 'security-analysis'
  | 'performance-optimization'
  | 'database-design'
  | 'ui-ux'
  | 'devops'
  | 'general-purpose';

export interface ProviderConfig {
  id: string;
  name: string;
  type: ProviderType;
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
  rateLimits?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
  customSettings?: Record<string, any>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  context?: ChatContext;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  agentType: string;
  taskType: string;
  projectId?: string;
  conversationId?: string;
  previousMessages?: ChatMessage[];
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
  metadata?: Record<string, any>;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  provider: string;
  model?: string;
  details: {
    latency?: number;
    tokensAvailable?: number;
    rateLimitStatus?: {
      requestsRemaining: number;
      resetTime: number;
    };
    lastError?: string;
  };
}

export interface ServiceError {
  code: string;
  message: string;
  provider?: string;
  model?: string;
  details?: any;
}

export type Result<T, E = ServiceError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Agent-to-Provider assignment with intelligent fallback
 */
export interface AgentModelAssignment {
  agentType: string;
  primaryProvider: string;
  primaryModel: string;
  fallbackProviders: Array<{
    provider: string;
    model: string;
    priority: number;
  }>;
  specializedConfigs?: {
    codeReview?: {
      provider: string;
      model: string;
    };
    systemDesign?: {
      provider: string;
      model: string;
    };
    // Add more specialized configs as needed
  };
}

/**
 * Database schema for agent assignments
 */
export interface AgentModelAssignmentEntity {
  id: string;
  agentType: string;
  primaryProvider: string;
  primaryModel: string;
  fallbackProviders: string; // JSON serialized array
  specializedConfigs: string; // JSON serialized object
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Provider registry for managing all providers
 */
export interface ProviderRegistry {
  registerProvider(provider: AIProvider): Promise<Result<boolean>>;
  unregisterProvider(providerId: string): Promise<Result<boolean>>;
  getProvider(providerId: string): Promise<Result<AIProvider>>;
  getAllProviders(): Promise<Result<AIProvider[]>>;
  getProvidersByType(type: ProviderType): Promise<Result<AIProvider[]>>;

  // Model management
  getAvailableModels(): Promise<Result<ModelInfo[]>>;
  getModelsBySpecialization(
    spec: ModelSpecialization
  ): Promise<Result<ModelInfo[]>>;

  // Health monitoring
  checkAllProvidersHealth(): Promise<Result<Record<string, HealthStatus>>>;
}
