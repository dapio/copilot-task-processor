/**
 * Azure OpenAI Provider
 * Enterprise-grade OpenAI models with Azure infrastructure
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

export class AzureOpenAIProvider implements AIProvider {
  readonly id = 'azure-openai';
  readonly name = 'Azure OpenAI';
  readonly type: ProviderType = 'azure-openai';

  private apiKey?: string;
  private endpoint?: string;
  private apiVersion = '2024-02-15-preview';
  private initialized = false;

  readonly supportedModels: ModelInfo[] = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o (Azure)',
      provider: 'azure-openai',
      capabilities: ['chat', 'reasoning', 'analysis', 'code-completion'],
      contextWindow: 128000,
      maxTokens: 4096,
      costPer1kTokens: {
        input: 5.0,
        output: 15.0,
      },
      specializations: [
        'general-purpose',
        'system-architecture',
        'business-analysis',
        'frontend-development',
        'backend-development',
      ],
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo (Azure)',
      provider: 'azure-openai',
      capabilities: ['chat', 'reasoning', 'analysis', 'code-completion'],
      contextWindow: 128000,
      maxTokens: 4096,
      costPer1kTokens: {
        input: 10.0,
        output: 30.0,
      },
      specializations: [
        'general-purpose',
        'system-architecture',
        'business-analysis',
        'code-review',
      ],
    },
    {
      id: 'gpt-35-turbo',
      name: 'GPT-3.5 Turbo (Azure)',
      provider: 'azure-openai',
      capabilities: ['chat', 'reasoning', 'code-completion'],
      contextWindow: 16384,
      maxTokens: 4096,
      costPer1kTokens: {
        input: 0.5,
        output: 1.5,
      },
      specializations: [
        'general-purpose',
        'frontend-development',
        'backend-development',
      ],
    },
  ];

  async initialize(config: ProviderConfig): Promise<Result<boolean>> {
    try {
      this.apiKey = config.apiKey || process.env.AZURE_OPENAI_API_KEY;
      this.endpoint = config.endpoint || process.env.AZURE_OPENAI_ENDPOINT;

      if (!this.apiKey || !this.endpoint) {
        return {
          success: false,
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Azure OpenAI API key and endpoint are required',
            provider: this.id,
          },
        };
      }

      // Validate credentials
      const healthCheck = await this.checkHealth();
      if (!healthCheck.success) {
        return {
          success: false,
          error: {
            code: 'INITIALIZATION_FAILED',
            message: 'Failed to validate Azure OpenAI credentials',
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
          message: 'Error initializing Azure OpenAI provider',
          provider: this.id,
          details: error,
        },
      };
    }
  }

  async chat(request: ChatRequest): Promise<Result<ChatResponse>> {
    try {
      if (!this.initialized || !this.apiKey || !this.endpoint) {
        const initResult = await this.initialize({} as any);
        if (!initResult.success) {
          return initResult as any;
        }
      }

      const model = request.model || 'gpt-4o';
      const deploymentId = this.getDeploymentId(model);

      const url = `${this.endpoint}/openai/deployments/${deploymentId}/chat/completions?api-version=${this.apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey!,
        },
        body: JSON.stringify({
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
            message: `Azure OpenAI API request failed: ${response.status}`,
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
          message: 'Error making chat request to Azure OpenAI',
          provider: this.id,
          details: error,
        },
      };
    }
  }

  async checkHealth(): Promise<Result<HealthStatus>> {
    try {
      if (!this.apiKey || !this.endpoint) {
        return {
          success: false,
          error: {
            code: 'NO_CREDENTIALS',
            message: 'Azure OpenAI credentials not configured',
            provider: this.id,
          },
        };
      }

      const startTime = Date.now();

      // Check deployments endpoint
      const url = `${this.endpoint}/openai/deployments?api-version=${this.apiVersion}`;
      const response = await fetch(url, {
        headers: {
          'api-key': this.apiKey,
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

      const data = await response.json();
      const availableDeployments = data.data?.length || 0;

      return {
        success: true,
        data: {
          status: availableDeployments > 0 ? 'healthy' : 'degraded',
          provider: this.id,
          details: {
            latency,
            tokensAvailable: 80000, // Azure typically has good limits
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
      // In real implementation, you might query Azure to get actual deployments
      return { success: true, data: [...this.supportedModels] };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MODELS_RETRIEVAL_ERROR',
          message: 'Error retrieving Azure OpenAI models',
          provider: this.id,
          details: error,
        },
      };
    }
  }

  private getDeploymentId(model: string): string {
    // In real implementation, this would map model names to your actual Azure deployments
    const deploymentMap: Record<string, string> = {
      'gpt-4o': process.env.AZURE_GPT4O_DEPLOYMENT || 'gpt-4o',
      'gpt-4-turbo': process.env.AZURE_GPT4_DEPLOYMENT || 'gpt-4-turbo',
      'gpt-35-turbo': process.env.AZURE_GPT35_DEPLOYMENT || 'gpt-35-turbo',
    };

    return deploymentMap[model] || model;
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

export const azureOpenAIProvider = new AzureOpenAIProvider();
