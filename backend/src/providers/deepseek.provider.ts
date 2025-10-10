/**
 * DeepSeek AI Provider
 * Specialized in code generation, analysis, and optimization
 */

import {
  AIProvider,
  ProviderType,
  ModelInfo,
  ChatRequest,
  ChatResponse,
  HealthStatus,
  ProviderConfig,
  Result,
} from '../types/ai-provider.types';

export class DeepSeekProvider implements AIProvider {
  readonly id = 'deepseek';
  readonly name = 'DeepSeek Coder';
  readonly type: ProviderType = 'deepseek';

  private apiKey?: string;
  private endpoint = 'https://api.deepseek.com';
  private initialized = false;

  readonly supportedModels: ModelInfo[] = [
    {
      id: 'deepseek-coder-v3',
      name: 'DeepSeek Coder V3',
      provider: 'deepseek',
      capabilities: ['chat', 'code-completion', 'code-review', 'analysis'],
      contextWindow: 32768,
      maxTokens: 4096,
      costPer1kTokens: {
        input: 0.14,
        output: 0.28,
      },
      specializations: [
        'backend-development',
        'frontend-development',
        'code-review',
        'performance-optimization',
        'database-design',
      ],
    },
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      provider: 'deepseek',
      capabilities: ['chat', 'reasoning', 'analysis'],
      contextWindow: 32768,
      maxTokens: 4096,
      costPer1kTokens: {
        input: 0.14,
        output: 0.28,
      },
      specializations: [
        'general-purpose',
        'business-analysis',
        'system-architecture',
      ],
    },
  ];

  async initialize(config: ProviderConfig): Promise<Result<boolean>> {
    try {
      this.apiKey = config.apiKey || process.env.DEEPSEEK_API_KEY;

      if (!this.apiKey) {
        return {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'DeepSeek API key is required',
            provider: this.id,
          },
        };
      }

      // Validate API key by making a simple request
      const healthCheck = await this.checkHealth();
      if (!healthCheck.success) {
        return {
          success: false,
          error: {
            code: 'INITIALIZATION_FAILED',
            message: 'Failed to validate DeepSeek API key',
            provider: this.id,
            details: healthCheck.error,
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
          message: 'Error initializing DeepSeek provider',
          provider: this.id,
          details: error,
        },
      };
    }
  }

  async chat(request: ChatRequest): Promise<Result<ChatResponse>> {
    try {
      if (!this.initialized || !this.apiKey) {
        const initResult = await this.initialize({} as any);
        if (!initResult.success) {
          return initResult as any;
        }
      }

      const model = request.model || 'deepseek-coder-v3';

      const response = await fetch(`${this.endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature || 0.1,
          max_tokens: request.maxTokens || 2048,
          stream: request.stream || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: {
            code: 'API_REQUEST_FAILED',
            message: `DeepSeek API request failed: ${response.status}`,
            provider: this.id,
            model,
            details: errorData,
          },
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: {
          content: data.choices[0].message.content,
          model,
          provider: this.id,
          usage: data.usage
            ? {
                promptTokens: data.usage.prompt_tokens,
                completionTokens: data.usage.completion_tokens,
                totalTokens: data.usage.total_tokens,
                cost: this.calculateCost(data.usage, model),
              }
            : undefined,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHAT_REQUEST_ERROR',
          message: 'Error making chat request to DeepSeek',
          provider: this.id,
          details: error,
        },
      };
    }
  }

  async checkHealth(): Promise<Result<HealthStatus>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: {
            code: 'NO_API_KEY',
            message: 'DeepSeek API key not configured',
            provider: this.id,
          },
        };
      }

      const startTime = Date.now();

      const response = await fetch(`${this.endpoint}/v1/models`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        return {
          success: true,
          data: {
            status: 'unhealthy',
            provider: this.id,
            details: {
              latency,
              lastError: `API returned ${response.status}`,
            },
          },
        };
      }

      return {
        success: true,
        data: {
          status: 'healthy',
          provider: this.id,
          details: {
            latency,
            tokensAvailable: 1000000, // DeepSeek typically has high limits
            rateLimitStatus: {
              requestsRemaining: 1000,
              resetTime: Date.now() + 60000,
            },
          },
        },
      };
    } catch (error) {
      return {
        success: true,
        data: {
          status: 'unhealthy',
          provider: this.id,
          details: {
            lastError: error instanceof Error ? error.message : String(error),
          },
        },
      };
    }
  }

  async getAvailableModels(): Promise<Result<ModelInfo[]>> {
    try {
      return { success: true, data: [...this.supportedModels] };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MODELS_RETRIEVAL_ERROR',
          message: 'Error retrieving DeepSeek models',
          provider: this.id,
          details: error,
        },
      };
    }
  }

  private calculateCost(usage: any, model: string): number {
    const modelInfo = this.supportedModels.find(m => m.id === model);
    if (!modelInfo || !usage) return 0;

    const inputCost =
      (usage.prompt_tokens / 1000) * modelInfo.costPer1kTokens.input;
    const outputCost =
      (usage.completion_tokens / 1000) * modelInfo.costPer1kTokens.output;

    return inputCost + outputCost;
  }
}

export const deepSeekProvider = new DeepSeekProvider();
