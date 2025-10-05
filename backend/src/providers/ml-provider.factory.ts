/**
 * ML Provider Factory
 * ThinkCode AI Platform - Centralized Provider Management
 */

import { 
  IMLProvider, 
  IMLProviderFactory, 
  MLProviderConfig, 
  MLError, 
  Result 
} from './ml-provider.interface';
import { OpenAIProvider } from './openai.provider';

/**
 * Mock Provider for testing and fallback scenarios
 */
class MockProvider implements IMLProvider {
  public readonly name = 'mock';
  public readonly version = '1.0.0';

  constructor(_config: MLProviderConfig) {
    // Config parameter marked as unused with underscore prefix
  }

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generateText(prompt: string): Promise<Result<any, MLError>> {
    return {
      success: true,
      data: {
        text: `Mock response for: "${prompt.substring(0, 50)}..."`,
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        metadata: { model: 'mock-gpt', provider: 'mock' }
      }
    };
  }

  async generateEmbedding(): Promise<Result<any, MLError>> {
    return {
      success: true,
      data: {
        embedding: Array(1536).fill(0).map(() => Math.random() - 0.5),
        usage: { tokens: 5 },
        metadata: { model: 'mock-embedding' }
      }
    };
  }

  async analyzeDocument(): Promise<Result<any, MLError>> {
    return {
      success: true,
      data: {
        summary: 'Mock document analysis',
        complexity: 5,
        suggestions: ['Mock suggestion 1', 'Mock suggestion 2'],
        confidence: 0.8,
        metadata: { provider: 'mock' }
      }
    };
  }

  async healthCheck(): Promise<Result<any, MLError>> {
    return {
      success: true,
      data: { status: 'healthy', details: 'Mock provider always healthy' }
    };
  }

  async getSupportedModels(): Promise<Result<string[], MLError>> {
    return {
      success: true,
      data: ['mock-gpt-4', 'mock-gpt-3.5-turbo', 'mock-text-embedding']
    };
  }
}

/**
 * Main ML Provider Factory Implementation
 */
export class MLProviderFactory implements IMLProviderFactory {
  private static instance: MLProviderFactory;
  private providerCache = new Map<string, IMLProvider>();

  private constructor() {}

  static getInstance(): MLProviderFactory {
    if (!MLProviderFactory.instance) {
      MLProviderFactory.instance = new MLProviderFactory();
    }
    return MLProviderFactory.instance;
  }

  /**
   * Create ML Provider instance
   */
  async createProvider(config: MLProviderConfig): Promise<Result<IMLProvider, MLError>> {
    try {
      // Check cache first
      const cacheKey = `${config.type}-${config.name}`;
      if (this.providerCache.has(cacheKey)) {
        const cachedProvider = this.providerCache.get(cacheKey)!;
        const isAvailable = await cachedProvider.isAvailable();
        if (isAvailable) {
          return { success: true, data: cachedProvider };
        }
        // Remove from cache if not available
        this.providerCache.delete(cacheKey);
      }

      let provider: IMLProvider;

      switch (config.type) {
        case 'openai':
          provider = new OpenAIProvider(config);
          break;
        
        case 'mock':
          provider = new MockProvider(config);
          break;

        // Future providers can be added here
        case 'anthropic':
          throw new Error('Anthropic provider not implemented yet');
        
        case 'local':
          throw new Error('Local provider not implemented yet');
        
        case 'azure':
          throw new Error('Azure OpenAI provider not implemented yet');
        
        case 'google':
          throw new Error('Google provider not implemented yet');

        default:
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_PROVIDER',
              message: `Unsupported provider type: ${config.type}`,
              retryable: false
            }
          };
      }

      // Validate provider availability
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: {
            code: 'PROVIDER_UNAVAILABLE',
            message: `Provider ${config.type} is not available`,
            retryable: true
          }
        };
      }

      // Cache the provider
      this.providerCache.set(cacheKey, provider);

      return { success: true, data: provider };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_CREATION_ERROR',
          message: `Failed to create provider: ${error.message}`,
          details: error,
          retryable: false
        }
      };
    }
  }

  /**
   * Get supported provider types
   */
  getSupportedTypes(): string[] {
    return ['openai', 'mock', 'anthropic', 'local', 'azure', 'google'];
  }

  /**
   * Clear provider cache
   */
  clearCache(): void {
    this.providerCache.clear();
  }

  /**
   * Get cached providers count
   */
  getCachedProvidersCount(): number {
    return this.providerCache.size;
  }

  /**
   * Create provider with fallback to mock
   */
  async createProviderWithFallback(config: MLProviderConfig): Promise<Result<IMLProvider, MLError>> {
    const primaryResult = await this.createProvider(config);
    
    if (primaryResult.success) {
      return primaryResult;
    }

    // Fallback to mock provider
    console.warn(`Primary provider ${config.type} failed, falling back to mock provider`);
    
    const mockConfig: MLProviderConfig = {
      ...config,
      type: 'mock',
      name: `mock-fallback-${config.name}`,
      enabled: true,
    };

    return this.createProvider(mockConfig);
  }
}

/**
 * Convenient factory functions
 */
export const createMLProvider = (config: MLProviderConfig): Promise<Result<IMLProvider, MLError>> => {
  return MLProviderFactory.getInstance().createProvider(config);
};

export const createMLProviderWithFallback = (config: MLProviderConfig): Promise<Result<IMLProvider, MLError>> => {
  return MLProviderFactory.getInstance().createProviderWithFallback(config);
};

export const getSupportedProviderTypes = (): string[] => {
  return MLProviderFactory.getInstance().getSupportedTypes();
};

/**
 * Default provider configurations
 */
export const getDefaultProviderConfigs = (): MLProviderConfig[] => {
  return [
    {
      name: 'openai-primary',
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4',
      enabled: !!process.env.OPENAI_API_KEY,
      priority: 1,
      retryAttempts: 3,
      timeoutMs: 30000,
    },
    {
      name: 'openai-fallback',
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',
      enabled: !!process.env.OPENAI_API_KEY,
      priority: 2,
      retryAttempts: 2,
      timeoutMs: 20000,
    },
    {
      name: 'mock-ultimate-fallback',
      type: 'mock',
      enabled: true,
      priority: 99,
      retryAttempts: 1,
      timeoutMs: 1000,
    },
  ];
};