/**
 * OpenAI Provider Implementation
 * ThinkCode AI Platform - Enterprise OpenAI Integration
 */

import { OpenAI } from 'openai';
import {
  IMLProvider,
  GenerationOptions,
  EmbeddingOptions,
  MLError,
  GenerationResult,
  EmbeddingResult,
  AnalysisResult,
  Result,
  MLProviderConfig,
} from './ml-provider.interface';

export class OpenAIProvider implements IMLProvider {
  public readonly name = 'openai';
  public readonly version = '1.0.0';

  private client: OpenAI;
  private config: MLProviderConfig;

  constructor(config: MLProviderConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.endpoint,
      timeout: config.timeoutMs || 30000,
    });
  }

  /**
   * Check if OpenAI provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const healthResult = await this.healthCheck();
      return healthResult.success && healthResult.data.status !== 'unhealthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate text using OpenAI models
   */
  async generateText(
    prompt: string,
    options: GenerationOptions = {}
  ): Promise<Result<GenerationResult, MLError>> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.config.model || 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        top_p: options.topP ?? 1,
        frequency_penalty: options.frequencyPenalty ?? 0,
        presence_penalty: options.presencePenalty ?? 0,
      });

      const choice = response.choices[0];
      if (!choice?.message?.content) {
        return {
          success: false,
          error: {
            code: 'EMPTY_RESPONSE',
            message: 'OpenAI returned empty response',
            retryable: true,
          },
        };
      }

      return {
        success: true,
        data: {
          text: choice.message.content,
          usage: response.usage
            ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
              }
            : undefined,
          metadata: {
            model: response.model,
            finishReason: choice.finish_reason,
            logprobs: choice.logprobs,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.handleOpenAIError(error),
      };
    }
  }

  /**
   * Generate embeddings using OpenAI
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {}
  ): Promise<Result<EmbeddingResult, MLError>> {
    try {
      const response = await this.client.embeddings.create({
        model: options.model || 'text-embedding-3-small',
        input: text,
        dimensions: options.dimensions,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        return {
          success: false,
          error: {
            code: 'EMPTY_EMBEDDING',
            message: 'OpenAI returned empty embedding',
            retryable: true,
          },
        };
      }

      return {
        success: true,
        data: {
          embedding,
          usage: response.usage
            ? {
                tokens: response.usage.total_tokens,
              }
            : undefined,
          metadata: {
            model: response.model,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.handleOpenAIError(error),
      };
    }
  }

  /**
   * Analyze document using structured prompt
   */
  async analyzeDocument(
    content: string,
    context: Record<string, any> = {}
  ): Promise<Result<AnalysisResult, MLError>> {
    const analysisPrompt = `
Analyze this document and provide structured analysis:

DOCUMENT CONTENT:
${content}

CONTEXT:
${JSON.stringify(context, null, 2)}

Provide analysis in JSON format with:
- summary: Brief summary of the document
- complexity: Complexity score 1-10
- suggestions: Array of improvement suggestions
- confidence: Confidence in analysis 0-1

Respond with valid JSON only.
`;

    const textResult = await this.generateText(analysisPrompt, {
      temperature: 0.3,
      maxTokens: 1500,
    });

    if (!textResult.success) {
      return textResult;
    }

    try {
      const analysisData = JSON.parse(textResult.data.text);

      return {
        success: true,
        data: {
          summary: analysisData.summary || 'No summary available',
          complexity: analysisData.complexity || 5,
          suggestions: analysisData.suggestions || [],
          confidence: analysisData.confidence || 0.8,
          metadata: {
            usage: textResult.data.usage,
            rawResponse: textResult.data.text,
          },
        },
      };
    } catch (parseError) {
      return {
        success: false,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse analysis response',
          details: { parseError, rawResponse: textResult.data.text },
          retryable: true,
        },
      };
    }
  }

  /**
   * Health check for OpenAI provider
   */
  async healthCheck(): Promise<
    Result<
      { status: 'healthy' | 'degraded' | 'unhealthy'; details?: string },
      MLError
    >
  > {
    try {
      // Simple test request
      const response = await this.client.chat.completions.create({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Health check' }],
        max_tokens: 5,
      });

      if (response.choices && response.choices.length > 0) {
        return {
          success: true,
          data: {
            status: 'healthy',
            details: `Model: ${response.model}, Usage: ${response.usage?.total_tokens} tokens`,
          },
        };
      }

      return {
        success: true,
        data: {
          status: 'degraded',
          details: 'Received response but no choices',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.handleOpenAIError(error),
      };
    }
  }

  /**
   * Get supported OpenAI models
   */
  async getSupportedModels(): Promise<Result<string[], MLError>> {
    try {
      const models = await this.client.models.list();
      const modelIds = models.data
        .filter(
          model =>
            model.id.includes('gpt') || model.id.includes('text-embedding')
        )
        .map(model => model.id)
        .sort();

      return {
        success: true,
        data: modelIds,
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.handleOpenAIError(error),
      };
    }
  }

  /**
   * Handle OpenAI-specific errors
   */
  private handleOpenAIError(error: any): MLError {
    if (error.status) {
      switch (error.status) {
        case 401:
          return {
            code: 'AUTHENTICATION_ERROR',
            message: 'Invalid OpenAI API key',
            retryable: false,
            details: error,
          };
        case 429:
          return {
            code: 'RATE_LIMIT_ERROR',
            message: 'OpenAI rate limit exceeded',
            retryable: true,
            details: error,
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            code: 'SERVER_ERROR',
            message: 'OpenAI server error',
            retryable: true,
            details: error,
          };
        default:
          return {
            code: 'API_ERROR',
            message: `OpenAI API error: ${error.message}`,
            retryable: error.status >= 500,
            details: error,
          };
      }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        code: 'CONNECTION_ERROR',
        message: 'Cannot connect to OpenAI API',
        retryable: true,
        details: error,
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown OpenAI error',
      retryable: false,
      details: error,
    };
  }
}
