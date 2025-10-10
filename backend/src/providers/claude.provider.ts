/**
 * Anthropic Claude Provider
 * Specialized in reasoning, analysis, and system architecture
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

export class ClaudeProvider implements AIProvider {
  readonly id = 'anthropic-claude';
  readonly name = 'Anthropic Claude';
  readonly type: ProviderType = 'anthropic-claude';

  private apiKey?: string;
  private endpoint = 'https://api.anthropic.com';
  private initialized = false;

  readonly supportedModels: ModelInfo[] = [
    {
      id: 'claude-3-5-sonnet-20241022',
      name: 'Claude 3.5 Sonnet (Latest)',
      provider: 'anthropic-claude',
      capabilities: [
        'chat',
        'reasoning',
        'analysis',
        'code-review',
        'system-design',
      ],
      contextWindow: 200000,
      maxTokens: 8192,
      costPer1kTokens: {
        input: 3.0,
        output: 15.0,
      },
      specializations: [
        'system-architecture',
        'business-analysis',
        'frontend-development',
        'code-review',
        'security-analysis',
        'general-purpose',
      ],
    },
    {
      id: 'claude-3-opus-20240229',
      name: 'Claude 3 Opus',
      provider: 'anthropic-claude',
      capabilities: ['chat', 'reasoning', 'analysis', 'system-design'],
      contextWindow: 200000,
      maxTokens: 4096,
      costPer1kTokens: {
        input: 15.0,
        output: 75.0,
      },
      specializations: [
        'system-architecture',
        'business-analysis',
        'security-analysis',
        'general-purpose',
      ],
    },
    {
      id: 'claude-3-haiku-20240307',
      name: 'Claude 3 Haiku',
      provider: 'anthropic-claude',
      capabilities: ['chat', 'reasoning', 'analysis'],
      contextWindow: 200000,
      maxTokens: 4096,
      costPer1kTokens: {
        input: 0.25,
        output: 1.25,
      },
      specializations: ['general-purpose', 'business-analysis'],
    },
  ];

  async initialize(config: ProviderConfig): Promise<Result<boolean>> {
    try {
      this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY;

      if (!this.apiKey) {
        return {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message: 'Anthropic API key is required',
            provider: this.id,
          },
        };
      }

      // Validate API key
      const healthCheck = await this.checkHealth();
      if (!healthCheck.success) {
        return {
          success: false,
          error: {
            code: 'INITIALIZATION_FAILED',
            message: 'Failed to validate Anthropic API key',
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
          message: 'Error initializing Claude provider',
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

      const model = request.model || 'claude-3-5-sonnet-20241022';

      // Convert messages format for Claude API
      const messages = request.messages.filter(m => m.role !== 'system');
      const systemMessage = request.messages.find(
        m => m.role === 'system'
      )?.content;

      const response = await fetch(`${this.endpoint}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages,
          system: systemMessage || request.systemPrompt,
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature || 0.1,
          stream: request.stream || false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        return {
          success: false,
          error: {
            code: 'API_REQUEST_FAILED',
            message: `Claude API request failed: ${response.status}`,
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
          content: data.content[0].text,
          model,
          provider: this.id,
          usage: data.usage
            ? {
                promptTokens: data.usage.input_tokens,
                completionTokens: data.usage.output_tokens,
                totalTokens: data.usage.input_tokens + data.usage.output_tokens,
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
          message: 'Error making chat request to Claude',
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
            message: 'Anthropic API key not configured',
            provider: this.id,
          },
        };
      }

      const startTime = Date.now();

      // Make a simple test request
      const response = await fetch(`${this.endpoint}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        }),
      });

      const latency = Date.now() - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: true,
          data: {
            status: 'unhealthy',
            provider: this.id,
            details: {
              latency,
              lastError: `API returned ${response.status}: ${errorText}`,
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
            tokensAvailable: 100000, // Anthropic has generous limits
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
          message: 'Error retrieving Claude models',
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
      (usage.input_tokens / 1000) * modelInfo.costPer1kTokens.input;
    const outputCost =
      (usage.output_tokens / 1000) * modelInfo.costPer1kTokens.output;

    return inputCost + outputCost;
  }
}

export const claudeProvider = new ClaudeProvider();
