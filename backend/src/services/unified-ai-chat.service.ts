/**
 * Unified AI Chat Service
 * Single interface for all AI providers with intelligent routing
 */

import {
  ChatRequest,
  ChatResponse,
  ChatContext,
  Result,
  AIProvider,
} from '../types/ai-provider.types';
import { providerRegistry } from './provider-registry.service';
import { agentModelAssignmentService } from './agent-model-assignment.service';

export class UnifiedAIChatService {
  private initialized = false;

  /**
   * Initialize the unified chat service
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      // Initialize provider registry
      const registryResult = await this.initializeProviders();
      if (!registryResult.success) {
        return registryResult;
      }

      // Initialize agent assignments
      const assignmentResult = await agentModelAssignmentService.initialize();
      if (!assignmentResult.success) {
        return assignmentResult;
      }

      this.initialized = true;
      console.log('✅ Unified AI Chat Service initialized');

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNIFIED_CHAT_INIT_ERROR',
          message: 'Failed to initialize unified chat service',
          details: error,
        },
      };
    }
  }

  /**
   * Send chat request with intelligent provider routing
   */
  async chat(request: ChatRequest): Promise<Result<ChatResponse>> {
    try {
      if (!this.initialized) {
        const initResult = await this.initialize();
        if (!initResult.success) {
          return initResult as any;
        }
      }

      // Determine optimal provider based on context
      const providerInfo = await this.selectOptimalProvider(request);
      if (!providerInfo.success) {
        return providerInfo as any;
      }

      const { provider, model } = providerInfo.data;

      // Execute chat request with fallback handling
      return await this.executeWithFallback(
        provider.id,
        model,
        request,
        request.context?.agentType
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'UNIFIED_CHAT_ERROR',
          message: 'Error in unified chat service',
          details: error,
        },
      };
    }
  }

  /**
   * Chat specifically for an agent with optimal routing
   */
  async chatForAgent(
    agentType: string,
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: {
      temperature?: number;
      maxTokens?: number;
      taskType?: 'general' | 'codeReview' | 'systemDesign';
    }
  ): Promise<Result<ChatResponse>> {
    try {
      // Get optimal provider for this agent and task type
      const optimalResult =
        await agentModelAssignmentService.getOptimalProviderForTask(
          agentType,
          options?.taskType || 'general'
        );

      if (!optimalResult.success) {
        return optimalResult as any;
      }

      const { provider: providerId, model } = optimalResult.data;

      // Build request
      const request: ChatRequest = {
        messages,
        model,
        temperature: options?.temperature || 0.1,
        maxTokens: options?.maxTokens || 2048,
        context: {
          agentType,
          taskType: options?.taskType || 'general',
        },
      };

      // Execute with fallback
      return await this.executeWithFallback(
        providerId,
        model,
        request,
        agentType
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AGENT_CHAT_ERROR',
          message: `Error in chat for agent ${agentType}`,
          details: error,
        },
      };
    }
  }

  /**
   * Get chat capabilities for agent
   */
  async getAgentCapabilities(agentType: string): Promise<
    Result<{
      primaryProvider: string;
      primaryModel: string;
      capabilities: string[];
      fallbackOptions: Array<{ provider: string; model: string }>;
      specializedConfigs?: Record<string, { provider: string; model: string }>;
    }>
  > {
    try {
      const assignmentResult =
        await agentModelAssignmentService.getAssignmentForAgent(agentType);
      if (!assignmentResult.success) {
        return assignmentResult as any;
      }

      const assignment = assignmentResult.data;

      // Get primary provider info
      const providerResult = await providerRegistry.getProvider(
        assignment.primaryProvider
      );
      if (!providerResult.success) {
        return providerResult as any;
      }

      const provider = providerResult.data;
      const primaryModel = provider.supportedModels.find(
        m => m.id === assignment.primaryModel
      );

      // Get fallback options
      const fallbacksResult =
        await agentModelAssignmentService.getFallbackProvidersForAgent(
          agentType
        );
      const fallbacks = fallbacksResult.success ? fallbacksResult.data : [];

      return {
        success: true,
        data: {
          primaryProvider: assignment.primaryProvider,
          primaryModel: assignment.primaryModel,
          capabilities: primaryModel?.capabilities || [],
          fallbackOptions: fallbacks,
          specializedConfigs: assignment.specializedConfigs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AGENT_CAPABILITIES_ERROR',
          message: `Error getting capabilities for agent ${agentType}`,
          details: error,
        },
      };
    }
  }

  /**
   * Execute chat request with intelligent fallback
   */
  private async executeWithFallback(
    providerId: string,
    model: string,
    request: ChatRequest,
    agentType?: string,
    attemptNumber = 1
  ): Promise<Result<ChatResponse>> {
    try {
      // Get provider
      const providerResult = await providerRegistry.getProvider(providerId);
      if (!providerResult.success) {
        return await this.handleFallback(request, agentType, attemptNumber);
      }

      const provider = providerResult.data;

      // Set model in request
      const enhancedRequest = { ...request, model };

      // Execute request
      const chatResult = await provider.chat(enhancedRequest);

      if (chatResult.success) {
        // Add metadata about routing
        chatResult.data.metadata = {
          ...chatResult.data.metadata,
          routedProvider: providerId,
          routedModel: model,
          attemptNumber,
          agentType,
        };

        return chatResult;
      }

      // If failed, try fallback
      console.warn(
        `❌ Provider ${providerId} failed:`,
        chatResult.error.message
      );
      return await this.handleFallback(request, agentType, attemptNumber);
    } catch (error) {
      console.warn(`❌ Unexpected error with provider ${providerId}:`, error);
      return await this.handleFallback(request, agentType, attemptNumber);
    }
  }

  /**
   * Handle fallback to next available provider
   */
  private async handleFallback(
    request: ChatRequest,
    agentType?: string,
    attemptNumber = 1
  ): Promise<Result<ChatResponse>> {
    try {
      if (attemptNumber >= 4) {
        // Max 3 fallback attempts
        return {
          success: false,
          error: {
            code: 'ALL_PROVIDERS_FAILED',
            message: 'All providers failed after maximum attempts',
            details: { attemptNumber, agentType },
          },
        };
      }

      if (!agentType) {
        // Generic fallback - try Azure OpenAI
        return await this.executeWithFallback(
          'azure-openai',
          'gpt-4o',
          request,
          agentType,
          attemptNumber + 1
        );
      }

      // Get fallback providers for agent
      const fallbacksResult =
        await agentModelAssignmentService.getFallbackProvidersForAgent(
          agentType
        );

      if (!fallbacksResult.success || fallbacksResult.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_FALLBACK_PROVIDERS',
            message: `No fallback providers available for agent ${agentType}`,
            details: { attemptNumber },
          },
        };
      }

      // Try next fallback (attempt number - 1 because we start from 1)
      const fallbackIndex = Math.min(
        attemptNumber - 1,
        fallbacksResult.data.length - 1
      );
      const fallback = fallbacksResult.data[fallbackIndex];

      console.log(
        `🔄 Trying fallback provider: ${fallback.provider}/${
          fallback.model
        } (attempt ${attemptNumber + 1})`
      );

      return await this.executeWithFallback(
        fallback.provider,
        fallback.model,
        request,
        agentType,
        attemptNumber + 1
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FALLBACK_ERROR',
          message: 'Error during fallback handling',
          details: { error, attemptNumber, agentType },
        },
      };
    }
  }

  /**
   * Select optimal provider based on request context
   */
  private async selectOptimalProvider(request: ChatRequest): Promise<
    Result<{
      provider: AIProvider;
      model: string;
    }>
  > {
    try {
      // If context specifies agent, use agent assignment
      if (request.context?.agentType) {
        const optimalResult =
          await agentModelAssignmentService.getOptimalProviderForTask(
            request.context.agentType,
            request.context.taskType as
              | 'general'
              | 'codeReview'
              | 'systemDesign'
          );

        if (optimalResult.success) {
          const providerResult = await providerRegistry.getProvider(
            optimalResult.data.provider
          );
          if (providerResult.success) {
            return {
              success: true,
              data: {
                provider: providerResult.data,
                model: optimalResult.data.model,
              },
            };
          }
        }
      }

      // If model is specified in request, find appropriate provider
      if (request.model) {
        const allModelsResult = await providerRegistry.getAvailableModels();
        if (allModelsResult.success) {
          const modelInfo = allModelsResult.data.find(
            m => m.id === request.model
          );
          if (modelInfo) {
            const providerResult = await providerRegistry.getProvider(
              modelInfo.provider
            );
            if (providerResult.success) {
              return {
                success: true,
                data: {
                  provider: providerResult.data,
                  model: request.model,
                },
              };
            }
          }
        }
      }

      // Default fallback - use Azure OpenAI GPT-4o
      const defaultProviderResult = await providerRegistry.getProvider(
        'azure-openai'
      );
      if (defaultProviderResult.success) {
        return {
          success: true,
          data: {
            provider: defaultProviderResult.data,
            model: 'gpt-4o',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NO_PROVIDER_AVAILABLE',
          message: 'No suitable provider available for request',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_SELECTION_ERROR',
          message: 'Error selecting optimal provider',
          details: error,
        },
      };
    }
  }

  /**
   * Initialize all available providers
   */
  private async initializeProviders(): Promise<Result<boolean>> {
    try {
      // Register all providers
      const providers = await this.loadAvailableProviders();

      let successCount = 0;
      let errors: string[] = [];

      for (const provider of providers) {
        const registerResult = await providerRegistry.registerProvider(
          provider
        );
        if (registerResult.success) {
          successCount++;
        } else {
          errors.push(`${provider.id}: ${registerResult.error.message}`);
        }
      }

      console.log(
        `✅ Registered ${successCount}/${providers.length} AI providers`
      );

      if (errors.length > 0) {
        console.warn('⚠️ Provider registration errors:', errors);
      }

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROVIDER_INIT_ERROR',
          message: 'Error initializing providers',
          details: error,
        },
      };
    }
  }

  /**
   * Load all available provider instances
   */
  private async loadAvailableProviders(): Promise<AIProvider[]> {
    const providers: AIProvider[] = [];

    // Import and add providers based on availability
    // GitHub Copilot Simple Provider was removed - only regular providers available

    try {
      const { DeepSeekProvider } = await import(
        '../providers/deepseek.provider'
      );
      providers.push(new DeepSeekProvider());
    } catch (error) {
      console.warn('DeepSeek provider not available:', error);
    }

    try {
      const { ClaudeProvider } = await import('../providers/claude.provider');
      providers.push(new ClaudeProvider());
    } catch (error) {
      console.warn('Claude provider not available:', error);
    }

    try {
      const { AzureOpenAIProvider } = await import(
        '../providers/azure-openai-enhanced.provider'
      );
      providers.push(new AzureOpenAIProvider());
    } catch (error) {
      console.warn('Azure OpenAI provider not available:', error);
    }

    // Groq - Universal Free Fallback (ALWAYS AVAILABLE)
    try {
      const GroqProvider = (await import('../providers/groq.provider')).default;
      providers.push(new GroqProvider());
      console.log('✅ Groq provider loaded as universal fallback');
    } catch (error) {
      console.warn('Groq provider not available:', error);
    }

    return providers;
  }
}

export const unifiedAIChatService = new UnifiedAIChatService();
