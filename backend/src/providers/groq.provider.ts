/**
 * Groq Provider - Free, Fast AI Models
 * High-performance inference for Llama 3.1 70B and other models
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
  ServiceError,
} from '../types/ai-provider.types';

export class GroqProvider implements AIProvider {
  readonly id = 'groq';
  readonly name = 'Groq';
  readonly type: ProviderType = 'custom';

  readonly supportedModels: ModelInfo[] = [
    {
      id: 'llama-3.1-70b-versatile',
      name: 'Llama 3.1 70B Versatile',
      provider: 'groq',
      capabilities: ['chat', 'text-generation', 'reasoning'],
      contextWindow: 131072,
      maxTokens: 8192,
      costPer1kTokens: { input: 0, output: 0 }, // Free tier
      specializations: [
        'general-purpose',
        'system-architecture',
        'backend-development',
        'frontend-development',
      ],
    },
    {
      id: 'llama-3.1-8b-instant',
      name: 'Llama 3.1 8B Instant',
      provider: 'groq',
      capabilities: ['chat', 'text-generation'],
      contextWindow: 131072,
      maxTokens: 8192,
      costPer1kTokens: { input: 0, output: 0 }, // Free tier
      specializations: ['general-purpose', 'qa-testing'],
    },
    {
      id: 'mixtral-8x7b-32768',
      name: 'Mixtral 8x7B',
      provider: 'groq',
      capabilities: ['chat', 'text-generation', 'code-review'],
      contextWindow: 32768,
      maxTokens: 32768,
      costPer1kTokens: { input: 0, output: 0 }, // Free tier
      specializations: ['code-review', 'business-analysis', 'general-purpose'],
    },
    {
      id: 'gemma2-9b-it',
      name: 'Gemma 2 9B IT',
      provider: 'groq',
      capabilities: ['chat', 'text-generation'],
      contextWindow: 8192,
      maxTokens: 8192,
      costPer1kTokens: { input: 0, output: 0 }, // Free tier
      specializations: ['frontend-development', 'general-purpose'],
    },
  ];

  private apiKey?: string;
  private baseUrl = 'https://api.groq.com/openai/v1';

  async initialize(config: ProviderConfig): Promise<Result<boolean>> {
    try {
      this.apiKey = config.apiKey || process.env.GROQ_API_KEY;

      if (!this.apiKey) {
        return {
          success: false,
          error: {
            code: 'MISSING_API_KEY',
            message:
              'Groq API key is required. Get free key from https://console.groq.com',
            provider: this.id,
          },
        };
      }

      // Validate API key with health check
      const healthCheck = await this.checkHealth();
      if (!healthCheck.success) {
        return healthCheck;
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'INIT_FAILED',
          message: `Failed to initialize Groq: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          provider: this.id,
        },
      };
    }
  }

  async chat(request: ChatRequest): Promise<Result<ChatResponse>> {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: {
            code: 'NOT_INITIALIZED',
            message: 'Groq provider not initialized',
            provider: this.id,
          },
        };
      }

      const model = request.model || 'llama-3.1-70b-versatile';

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature || 0.7,
          max_tokens: request.maxTokens || 4096,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `Groq API error: ${response.statusText} - ${errorText}`,
            provider: this.id,
          },
        };
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        return {
          success: false,
          error: {
            code: 'EMPTY_RESPONSE',
            message: 'Groq returned empty response',
            provider: this.id,
          },
        };
      }

      const chatResponse: ChatResponse = {
        content: data.choices[0].message.content,
        model: data.model || model,
        provider: this.id,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };

      return { success: true, data: chatResponse };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CHAT_FAILED',
          message: `Groq chat failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          provider: this.id,
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
            message: 'No Groq API key configured',
            provider: this.id,
          },
        };
      }

      // Test with smallest model
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 1,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          data: {
            status: 'healthy',
            provider: this.id,
            details: {
              latency: Date.now(), // Simplified - could measure actual latency
            },
          },
        };
      } else {
        const errorText = await response.text();
        return {
          success: false,
          error: {
            code: `HTTP_${response.status}`,
            message: `Groq health check failed: ${response.statusText} - ${errorText}`,
            provider: this.id,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: `Groq health check failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          provider: this.id,
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
          code: 'GET_MODELS_FAILED',
          message: `Failed to get Groq models: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          provider: this.id,
        },
      };
    }
  }
}

export default GroqProvider;
