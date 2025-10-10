/*---------------------------------------------------------------------------------------------
 * Real GitHub Copilot Provider Integration
 * Adapter for ThinkCode AI Platform
 *--------------------------------------------------------------------------------------------*/

import {
  RealGitHubCopilotProvider,
  RealGitHubCopilotProviderConfig,
} from '../providers/real-github-copilot.provider';

/**
 * Service Error types
 */
interface ServiceError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Result pattern
 */
type Result<T, E = ServiceError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Provider configuration interface
 */
interface ProviderConfig {
  id: string;
  name: string;
  type: 'copilot' | 'openai' | 'anthropic' | 'azure-openai';
  enabled: boolean;
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

/**
 * Agent assignment interface (compatible with existing system)
 */
interface AgentProviderAssignment {
  agentType: string;
  providerId: string;
  fallbackProviders: string[];
}

/**
 * Chat request/response interfaces
 */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

interface ChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Real GitHub Copilot Service Adapter
 * Integrates RealGitHubCopilotProvider with existing service patterns
 */
export class RealGitHubCopilotService {
  private provider: RealGitHubCopilotProvider | null = null;
  private initialized = false;

  constructor(private githubToken?: string) {}

  /**
   * Initialize the service with GitHub token
   */
  async initialize(githubToken?: string): Promise<Result<boolean>> {
    try {
      const token = githubToken || this.githubToken || process.env.GITHUB_TOKEN;

      if (!token) {
        return {
          success: false,
          error: {
            code: 'MISSING_TOKEN',
            message:
              'GitHub token is required for Real GitHub Copilot provider',
          },
        };
      }

      this.provider = new RealGitHubCopilotProvider(token);

      // Test connection
      const accessCheck = await this.provider.checkAccess();
      if (!accessCheck.hasAccess) {
        return {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message:
              'No access to GitHub Copilot. Please check your subscription and token.',
          },
        };
      }

      this.initialized = true;
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INITIALIZATION_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Unknown initialization error',
        },
      };
    }
  }

  /**
   * Get available providers (for compatibility with existing system)
   */
  async getAvailableProviders(): Promise<Result<ProviderConfig[]>> {
    try {
      if (!this.initialized || !this.provider) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult as any;
        }
      }

      const accessCheck = await this.provider!.checkAccess();

      const provider: ProviderConfig = {
        id: RealGitHubCopilotProviderConfig.id,
        name: RealGitHubCopilotProviderConfig.name,
        type: RealGitHubCopilotProviderConfig.type,
        enabled: accessCheck.hasAccess && accessCheck.chatEnabled,
      };

      return { success: true, data: [provider] };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDERS_FETCH_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to fetch providers',
        },
      };
    }
  }

  /**
   * Get default agent assignments
   */
  getDefaultAgentAssignments(): AgentProviderAssignment[] {
    return [
      {
        agentType: 'project-manager',
        providerId: RealGitHubCopilotProviderConfig.id,
        fallbackProviders: [],
      },
      {
        agentType: 'business-analyst',
        providerId: RealGitHubCopilotProviderConfig.id,
        fallbackProviders: [],
      },
      {
        agentType: 'system-architect',
        providerId: RealGitHubCopilotProviderConfig.id,
        fallbackProviders: [],
      },
      {
        agentType: 'backend-developer',
        providerId: RealGitHubCopilotProviderConfig.id,
        fallbackProviders: [],
      },
      {
        agentType: 'frontend-developer',
        providerId: RealGitHubCopilotProviderConfig.id,
        fallbackProviders: [],
      },
      {
        agentType: 'qa-engineer',
        providerId: RealGitHubCopilotProviderConfig.id,
        fallbackProviders: [],
      },
    ];
  }

  /**
   * Send chat request
   */
  async chat(request: ChatRequest): Promise<Result<ChatResponse>> {
    try {
      if (!this.initialized || !this.provider) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult as any;
        }
      }

      const response = await this.provider!.chat({
        messages: request.messages,
        model: request.model,
        temperature: request.temperature,
        max_tokens: request.maxTokens,
        stream: request.stream ?? false,
      });

      const choice = response.choices?.[0];
      if (!choice?.message?.content) {
        return {
          success: false,
          error: {
            code: 'EMPTY_RESPONSE',
            message: 'No response content from Copilot API',
          },
        };
      }

      return {
        success: true,
        data: {
          content: choice.message.content,
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              }
            : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHAT_ERROR',
          message:
            error instanceof Error ? error.message : 'Chat request failed',
        },
      };
    }
  }

  /**
   * Get available models
   */
  async getModels(): Promise<
    Result<Array<{ id: string; name: string; capabilities: string[] }>>
  > {
    try {
      if (!this.initialized || !this.provider) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult as any;
        }
      }

      const models = await this.provider!.getModels();
      return { success: true, data: models };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MODELS_FETCH_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to fetch models',
        },
      };
    }
  }

  /**
   * Check provider health
   */
  async checkHealth(): Promise<
    Result<{
      status: 'healthy' | 'unhealthy';
      details: {
        hasAccess: boolean;
        plan: string;
        chatEnabled: boolean;
        username: string;
      };
    }>
  > {
    try {
      if (!this.initialized || !this.provider) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult as any;
        }
      }

      const accessCheck = await this.provider!.checkAccess();

      return {
        success: true,
        data: {
          status:
            accessCheck.hasAccess && accessCheck.chatEnabled
              ? 'healthy'
              : 'unhealthy',
          details: accessCheck,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message:
            error instanceof Error ? error.message : 'Health check failed',
        },
      };
    }
  }

  /**
   * Reset provider (clear cached tokens)
   */
  resetProvider(): void {
    if (this.provider) {
      this.provider.resetToken();
    }
  }

  /**
   * Get provider configuration
   */
  getProviderConfig() {
    return RealGitHubCopilotProviderConfig;
  }
}

/**
 * Integration helper for existing project initialization service
 */
export class RealGitHubCopilotIntegration {
  private service: RealGitHubCopilotService;

  constructor(githubToken?: string) {
    this.service = new RealGitHubCopilotService(githubToken);
  }

  /**
   * Replace mock providers with real Copilot provider
   */
  async enhanceProviders(
    existingProviders: ProviderConfig[]
  ): Promise<Result<ProviderConfig[]>> {
    const realProvidersResult = await this.service.getAvailableProviders();

    if (!realProvidersResult.success) {
      // If real provider fails, keep existing mock providers
      return { success: true, data: existingProviders };
    }

    // Replace or add real Copilot provider
    const enhancedProviders = existingProviders.filter(
      p => p.id !== RealGitHubCopilotProviderConfig.id
    );
    enhancedProviders.unshift(...realProvidersResult.data);

    return { success: true, data: enhancedProviders };
  }

  /**
   * Enhance agent assignments with real provider
   */
  enhanceAgentAssignments(
    existingAssignments: AgentProviderAssignment[]
  ): AgentProviderAssignment[] {
    const realAssignments = this.service.getDefaultAgentAssignments();

    // Merge assignments, prioritizing real provider
    const enhancedAssignments = [...realAssignments];

    // Add fallbacks from existing assignments
    existingAssignments.forEach(existing => {
      const realAssignment = enhancedAssignments.find(
        r => r.agentType === existing.agentType
      );
      if (realAssignment) {
        realAssignment.fallbackProviders = [
          ...realAssignment.fallbackProviders,
          ...existing.fallbackProviders,
        ];
      } else {
        enhancedAssignments.push(existing);
      }
    });

    return enhancedAssignments;
  }

  /**
   * Get service instance for direct usage
   */
  getService(): RealGitHubCopilotService {
    return this.service;
  }
}

/**
 * Factory function to create a real GitHub Copilot service instance
 */
export function createRealGitHubCopilotService(
  githubToken?: string
): RealGitHubCopilotService {
  return new RealGitHubCopilotService(githubToken);
}
