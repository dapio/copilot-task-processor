/**
 * AI Configuration Service
 * Manages AI provider settings and configuration
 */

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'groq' | 'openai' | 'anthropic' | 'google';
  apiKey?: string;
  enabled: boolean;
  isDefault: boolean;
  models: string[];
  defaultModel?: string;
  settings: {
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
}

export interface AIConfiguration {
  defaultProvider: string;
  fallbackProvider: string;
  enableFallback: boolean;
  providers: AIProviderConfig[];
  globalSettings: {
    maxTokens: number;
    temperature: number;
    enableMemory: boolean;
    sessionTimeout: number;
  };
}

export interface AgentProviderAssignment {
  agentType: string;
  primaryProvider: string;
  fallbackProviders: string[];
}

class AIConfigService {
  private baseUrl = '/api';

  /**
   * Get current AI configuration
   */
  async getConfiguration(): Promise<AIConfiguration> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/configuration`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to load AI configuration, using defaults:', error);
      return this.getDefaultConfiguration();
    }
  }

  /**
   * Update AI configuration
   */
  async updateConfiguration(config: Partial<AIConfiguration>): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ai/configuration`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update AI configuration: ${error}`);
    }
  }

  /**
   * Update provider API key
   */
  async updateProviderApiKey(
    providerId: string,
    apiKey: string
  ): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/ai/providers/${providerId}/api-key`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update API key for ${providerId}: ${error}`);
    }
  }

  /**
   * Test provider connection
   */
  async testProvider(
    providerId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ai/providers/${providerId}/test`,
        {
          method: 'POST',
        }
      );

      const result = await response.json();
      return {
        success: response.ok,
        message:
          result.message ||
          (response.ok ? 'Connection successful' : 'Connection failed'),
      };
    } catch (error) {
      return {
        success: false,
        message: `Test failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      };
    }
  }

  /**
   * Get available models for provider
   */
  async getProviderModels(providerId: string): Promise<string[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/ai/providers/${providerId}/models`
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.warn(`Failed to load models for ${providerId}:`, error);
      return this.getDefaultModelsForProvider(providerId);
    }
  }

  /**
   * Get agent-provider assignments
   */
  async getAgentAssignments(): Promise<AgentProviderAssignment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/agent-assignments`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Failed to load agent assignments, using defaults:', error);
      return this.getDefaultAgentAssignments();
    }
  }

  /**
   * Update agent-provider assignments
   */
  async updateAgentAssignments(
    assignments: AgentProviderAssignment[]
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/ai/agent-assignments`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ assignments }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update agent assignments: ${error}`);
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): AIConfiguration {
    return {
      defaultProvider: 'groq',
      fallbackProvider: 'groq',
      enableFallback: true,
      providers: [
        {
          id: 'groq',
          name: 'Groq (Darmowy)',
          type: 'groq',
          enabled: true,
          isDefault: true,
          models: [
            'llama-3.1-70b-versatile',
            'llama-3.1-8b-instant',
            'mixtral-8x7b-32768',
            'gemma2-9b-it',
          ],
          defaultModel: 'llama-3.1-70b-versatile',
          settings: {
            maxTokens: 8192,
            temperature: 0.7,
            timeout: 30000,
          },
        },
        {
          id: 'openai',
          name: 'OpenAI',
          type: 'openai',
          enabled: false,
          isDefault: false,
          models: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
          defaultModel: 'gpt-4',
          settings: {
            maxTokens: 4096,
            temperature: 0.7,
            timeout: 30000,
          },
        },
        {
          id: 'anthropic',
          name: 'Anthropic Claude',
          type: 'anthropic',
          enabled: false,
          isDefault: false,
          models: [
            'claude-3-5-sonnet-20241022',
            'claude-3-opus-20240229',
            'claude-3-haiku-20240307',
          ],
          defaultModel: 'claude-3-5-sonnet-20241022',
          settings: {
            maxTokens: 4096,
            temperature: 0.7,
            timeout: 30000,
          },
        },
        {
          id: 'google',
          name: 'Google AI',
          type: 'google',
          enabled: false,
          isDefault: false,
          models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
          defaultModel: 'gemini-1.5-pro',
          settings: {
            maxTokens: 4096,
            temperature: 0.7,
            timeout: 30000,
          },
        },
      ],
      globalSettings: {
        maxTokens: 4096,
        temperature: 0.7,
        enableMemory: true,
        sessionTimeout: 3600000, // 1 hour
      },
    };
  }

  /**
   * Get default models for provider
   */
  private getDefaultModelsForProvider(providerId: string): string[] {
    const defaultModels: Record<string, string[]> = {
      groq: [
        'llama-3.1-70b-versatile',
        'llama-3.1-8b-instant',
        'mixtral-8x7b-32768',
        'gemma2-9b-it',
      ],
      openai: ['gpt-4o', 'gpt-4', 'gpt-3.5-turbo'],
      anthropic: [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-haiku-20240307',
      ],
      google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    };
    return defaultModels[providerId] || [];
  }

  /**
   * Get default agent assignments
   */
  private getDefaultAgentAssignments(): AgentProviderAssignment[] {
    return [
      {
        agentType: 'business-analyst',
        primaryProvider: 'groq',
        fallbackProviders: ['openai', 'anthropic'],
      },
      {
        agentType: 'frontend-developer',
        primaryProvider: 'groq',
        fallbackProviders: ['openai', 'anthropic'],
      },
      {
        agentType: 'backend-developer',
        primaryProvider: 'groq',
        fallbackProviders: ['openai', 'anthropic'],
      },
      {
        agentType: 'qa-engineer',
        primaryProvider: 'groq',
        fallbackProviders: ['openai', 'anthropic'],
      },
      {
        agentType: 'project-manager',
        primaryProvider: 'groq',
        fallbackProviders: ['openai', 'anthropic'],
      },
      {
        agentType: 'workflow-assistant',
        primaryProvider: 'groq',
        fallbackProviders: ['openai', 'anthropic'],
      },
    ];
  }
}

export const aiConfigService = new AIConfigService();
export default aiConfigService;
