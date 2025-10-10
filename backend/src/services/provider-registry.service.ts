/**
 * Universal AI Provider Registry
 * Central hub for managing all AI providers and model assignments
 */

import {
  AIProvider,
  ProviderRegistry,
  ProviderType,
  ModelInfo,
  ModelSpecialization,
  HealthStatus,
  Result,
  ServiceError,
} from '../types/ai-provider.types';

export class UniversalProviderRegistry implements ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private healthCache: Map<
    string,
    { status: HealthStatus; timestamp: number }
  > = new Map();
  private readonly HEALTH_CACHE_TTL = 30000; // 30 seconds

  /**
   * Register a new AI provider
   */
  async registerProvider(provider: AIProvider): Promise<Result<boolean>> {
    try {
      // Initialize the provider
      const initResult = await provider.initialize({} as any); // Will be configured later

      if (!initResult.success) {
        return {
          success: false,
          error: {
            code: 'PROVIDER_REGISTRATION_FAILED',
            message: `Failed to register provider ${provider.id}`,
            provider: provider.id,
            details: initResult.error,
          },
        };
      }

      this.providers.set(provider.id, provider);

      console.log(
        `✅ Registered AI Provider: ${provider.name} (${provider.type})`
      );

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_REGISTRATION_ERROR',
          message: `Error registering provider ${provider.id}`,
          provider: provider.id,
          details: error,
        },
      };
    }
  }

  /**
   * Unregister a provider
   */
  async unregisterProvider(providerId: string): Promise<Result<boolean>> {
    try {
      if (!this.providers.has(providerId)) {
        return {
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: `Provider ${providerId} not found`,
            provider: providerId,
          },
        };
      }

      this.providers.delete(providerId);
      this.healthCache.delete(providerId);

      console.log(`🗑️ Unregistered AI Provider: ${providerId}`);

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_UNREGISTRATION_ERROR',
          message: `Error unregistering provider ${providerId}`,
          provider: providerId,
          details: error,
        },
      };
    }
  }

  /**
   * Get specific provider
   */
  async getProvider(providerId: string): Promise<Result<AIProvider>> {
    try {
      const provider = this.providers.get(providerId);

      if (!provider) {
        return {
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: `Provider ${providerId} not found`,
            provider: providerId,
          },
        };
      }

      return { success: true, data: provider };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_RETRIEVAL_ERROR',
          message: `Error retrieving provider ${providerId}`,
          provider: providerId,
          details: error,
        },
      };
    }
  }

  /**
   * Get all registered providers
   */
  async getAllProviders(): Promise<Result<AIProvider[]>> {
    try {
      const providers = Array.from(this.providers.values());
      return { success: true, data: providers };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDERS_RETRIEVAL_ERROR',
          message: 'Error retrieving all providers',
          details: error,
        },
      };
    }
  }

  /**
   * Get providers by type
   */
  async getProvidersByType(type: ProviderType): Promise<Result<AIProvider[]>> {
    try {
      const providers = Array.from(this.providers.values()).filter(
        provider => provider.type === type
      );

      return { success: true, data: providers };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDERS_BY_TYPE_ERROR',
          message: `Error retrieving providers of type ${type}`,
          details: error,
        },
      };
    }
  }

  /**
   * Get all available models across all providers
   */
  async getAvailableModels(): Promise<Result<ModelInfo[]>> {
    try {
      const allModels: ModelInfo[] = [];

      for (const provider of this.providers.values()) {
        const modelsResult = await provider.getAvailableModels();
        if (modelsResult.success) {
          allModels.push(...modelsResult.data);
        }
      }

      return { success: true, data: allModels };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MODELS_RETRIEVAL_ERROR',
          message: 'Error retrieving available models',
          details: error,
        },
      };
    }
  }

  /**
   * Get models by specialization
   */
  async getModelsBySpecialization(
    spec: ModelSpecialization
  ): Promise<Result<ModelInfo[]>> {
    try {
      const allModelsResult = await this.getAvailableModels();

      if (!allModelsResult.success) {
        return allModelsResult;
      }

      const specializedModels = allModelsResult.data.filter(model =>
        model.specializations.includes(spec)
      );

      // Sort by suitability (you can implement more sophisticated scoring)
      specializedModels.sort((a, b) => {
        // Prioritize models with more specializations matching the request
        const aScore = a.specializations.filter(s => s === spec).length;
        const bScore = b.specializations.filter(s => s === spec).length;
        return bScore - aScore;
      });

      return { success: true, data: specializedModels };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SPECIALIZED_MODELS_ERROR',
          message: `Error retrieving models for specialization ${spec}`,
          details: error,
        },
      };
    }
  }

  /**
   * Check health of all providers with caching
   */
  async checkAllProvidersHealth(): Promise<
    Result<Record<string, HealthStatus>>
  > {
    try {
      const healthStatuses: Record<string, HealthStatus> = {};
      const now = Date.now();

      for (const [providerId, provider] of this.providers.entries()) {
        // Check if we have cached health status
        const cached = this.healthCache.get(providerId);

        if (cached && now - cached.timestamp < this.HEALTH_CACHE_TTL) {
          healthStatuses[providerId] = cached.status;
          continue;
        }

        // Get fresh health status
        const healthResult = await provider.checkHealth();

        if (healthResult.success) {
          healthStatuses[providerId] = healthResult.data;
          this.healthCache.set(providerId, {
            status: healthResult.data,
            timestamp: now,
          });
        } else {
          healthStatuses[providerId] = {
            status: 'unhealthy',
            provider: providerId,
            details: {
              lastError: healthResult.error.message,
            },
          };
        }
      }

      return { success: true, data: healthStatuses };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HEALTH_CHECK_ERROR',
          message: 'Error checking providers health',
          details: error,
        },
      };
    }
  }

  /**
   * Get provider statistics
   */
  async getProviderStats(): Promise<
    Result<{
      totalProviders: number;
      providersByType: Record<ProviderType, number>;
      totalModels: number;
      healthyProviders: number;
    }>
  > {
    try {
      const providers = Array.from(this.providers.values());
      const modelsResult = await this.getAvailableModels();
      const healthResult = await this.checkAllProvidersHealth();

      const providersByType: Record<ProviderType, number> = {} as any;
      for (const provider of providers) {
        providersByType[provider.type] =
          (providersByType[provider.type] || 0) + 1;
      }

      const healthyCount = healthResult.success
        ? Object.values(healthResult.data).filter(
            status => status.status === 'healthy'
          ).length
        : 0;

      return {
        success: true,
        data: {
          totalProviders: providers.length,
          providersByType,
          totalModels: modelsResult.success ? modelsResult.data.length : 0,
          healthyProviders: healthyCount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STATS_ERROR',
          message: 'Error retrieving provider statistics',
          details: error,
        },
      };
    }
  }

  /**
   * Find best provider for specific task
   */
  async findBestProviderForTask(
    specialization: ModelSpecialization,
    requirements?: {
      contextWindow?: number;
      maxCost?: number;
      preferredProvider?: string;
    }
  ): Promise<Result<{ provider: AIProvider; model: ModelInfo }>> {
    try {
      const modelsResult = await this.getModelsBySpecialization(specialization);

      if (!modelsResult.success || modelsResult.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_SUITABLE_MODEL',
            message: `No suitable model found for specialization ${specialization}`,
          },
        };
      }

      // Filter by requirements
      let candidates = modelsResult.data;

      if (requirements?.contextWindow) {
        candidates = candidates.filter(
          model => model.contextWindow >= requirements.contextWindow!
        );
      }

      if (requirements?.maxCost) {
        candidates = candidates.filter(
          model =>
            model.costPer1kTokens.input <= requirements.maxCost! &&
            model.costPer1kTokens.output <= requirements.maxCost!
        );
      }

      if (requirements?.preferredProvider) {
        const preferred = candidates.filter(
          model => model.provider === requirements.preferredProvider
        );
        if (preferred.length > 0) {
          candidates = preferred;
        }
      }

      if (candidates.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_MODEL_MEETS_REQUIREMENTS',
            message: 'No model meets the specified requirements',
          },
        };
      }

      // Get the best candidate (first one after sorting)
      const bestModel = candidates[0];
      const providerResult = await this.getProvider(bestModel.provider);

      if (!providerResult.success) {
        return providerResult as any;
      }

      return {
        success: true,
        data: {
          provider: providerResult.data,
          model: bestModel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BEST_PROVIDER_SEARCH_ERROR',
          message: 'Error finding best provider for task',
          details: error,
        },
      };
    }
  }
}

// Singleton instance
export const providerRegistry = new UniversalProviderRegistry();
