/**
 * ML Provider Factory
 * ThinkCode AI Platform - Centralized Provider Management
 */

import {
  IMLProvider,
  IMLProviderFactory,
  MLProviderConfig,
  MLError,
  Result,
} from './ml-provider.interface';
import { OpenAIProvider } from './openai.provider';

// NO MORE MOCK PROVIDERS - REMOVED COMPLETELY!

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
  async createProvider(
    config: MLProviderConfig
  ): Promise<Result<IMLProvider, MLError>> {
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
          throw new Error(
            'MOCK PROVIDERS NOT ALLOWED - USE REAL PROVIDERS ONLY!'
          );

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
              retryable: false,
            },
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
            retryable: true,
          },
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
          retryable: false,
        },
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
  async createProviderWithFallback(
    config: MLProviderConfig
  ): Promise<Result<IMLProvider, MLError>> {
    const primaryResult = await this.createProvider(config);

    if (primaryResult.success) {
      return primaryResult;
    }

    // NO MORE MOCK FALLBACKS - FAIL INSTEAD!
    console.error(
      `Provider ${config.type} failed and MOCK FALLBACKS ARE DISABLED!`
    );

    return {
      success: false,
      error: {
        code: 'NO_MOCK_FALLBACK',
        message: `Provider ${config.type} failed and MOCK FALLBACKS ARE DISABLED!`,
        retryable: false,
      } as any,
    };
  }
}

/**
 * Convenient factory functions
 */
export const createMLProvider = (
  config: MLProviderConfig
): Promise<Result<IMLProvider, MLError>> => {
  return MLProviderFactory.getInstance().createProvider(config);
};

export const createMLProviderWithFallback = (
  config: MLProviderConfig
): Promise<Result<IMLProvider, MLError>> => {
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
    // NO MORE MOCK FALLBACKS - REMOVED!
  ];
};
