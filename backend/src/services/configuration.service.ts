/**
 * Configuration Management Service
 * Centralized system for managing all platform configurations in database
 */

import { PrismaClient } from '../generated/prisma';
import { Result, MLError } from '../providers/ml-provider.interface';

export interface ConfigurationItem {
  key: string;
  value: any;
  category: string;
  description?: string;
  isSecret: boolean;
}

export interface AgentConfiguration {
  agentType: string;
  name: string;
  personality: Record<string, any>;
  capabilities: string[];
  mlProvider: string;
  settings: Record<string, any>;
  bestPractices: string[];
}

export interface WorkflowConfiguration {
  name: string;
  type: string;
  description: string;
  steps: WorkflowStepConfig[];
  metadata: Record<string, any>;
}

export interface WorkflowStepConfig {
  name: string;
  type: 'agent_task' | 'approval' | 'parallel' | 'conditional';
  agentType?: string;
  inputs: string[];
  outputs: string[];
  conditions?: Record<string, any>;
  timeout?: number;
}

export interface MLProviderConfiguration {
  name: string;
  type: 'openai' | 'github_copilot' | 'azure_openai' | 'anthropic';
  endpoint: string;
  apiKey: string;
  model: string;
  settings: Record<string, any>;
}

export class ConfigurationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get configuration value by key
   */
  async getConfig<T = any>(key: string): Promise<Result<T | null, MLError>> {
    try {
      const config = await this.prisma.systemConfig.findUnique({
        where: { key },
      });

      return {
        success: true,
        data: config ? (config.value as T) : null,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONFIG_READ_ERROR',
          message: `Failed to read configuration: ${key}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Set configuration value
   */
  async setConfig(
    key: string,
    value: any,
    category: string = 'general',
    description?: string,
    isSecret: boolean = false
  ): Promise<Result<ConfigurationItem, MLError>> {
    try {
      const config = await this.prisma.systemConfig.upsert({
        where: { key },
        update: {
          value,
          category,
          description,
          isSecret,
          updatedAt: new Date(),
        },
        create: {
          key,
          value,
          category,
          description,
          isSecret,
        },
      });

      return {
        success: true,
        data: {
          key: config.key,
          value: config.value,
          category: config.category || 'general',
          description: config.description || undefined,
          isSecret: config.isSecret,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONFIG_WRITE_ERROR',
          message: `Failed to set configuration: ${key}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get all configurations by category
   */
  async getConfigsByCategory(
    category: string
  ): Promise<Result<ConfigurationItem[], MLError>> {
    try {
      const configs = await this.prisma.systemConfig.findMany({
        where: { category },
      });

      const items: ConfigurationItem[] = configs.map(config => ({
        key: config.key,
        value: config.value,
        category: config.category || 'general',
        description: config.description || undefined,
        isSecret: config.isSecret,
      }));

      return {
        success: true,
        data: items,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONFIG_READ_ERROR',
          message: `Failed to read configurations for category: ${category}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Initialize agent configuration in database
   */
  async initializeAgentConfig(
    config: AgentConfiguration
  ): Promise<Result<void, MLError>> {
    try {
      // Store agent personality
      await this.setConfig(
        `agent.${config.agentType}.personality`,
        config.personality,
        'agent',
        `Personality configuration for ${config.name}`
      );

      // Store capabilities
      await this.setConfig(
        `agent.${config.agentType}.capabilities`,
        config.capabilities,
        'agent',
        `Capabilities for ${config.name}`
      );

      // Store ML provider configuration
      await this.setConfig(
        `agent.${config.agentType}.ml_provider`,
        config.mlProvider,
        'agent',
        `ML Provider for ${config.name}`
      );

      // Store agent settings
      await this.setConfig(
        `agent.${config.agentType}.settings`,
        config.settings,
        'agent',
        `Settings for ${config.name}`
      );

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AGENT_CONFIG_INIT_ERROR',
          message: `Failed to initialize agent configuration: ${config.agentType}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Store workflow template in database
   */
  async storeWorkflowTemplate(
    config: WorkflowConfiguration
  ): Promise<Result<string, MLError>> {
    try {
      const workflow = await this.prisma.workflowTemplate.create({
        data: {
          name: config.name,
          description: config.description,
          type: config.type,
          steps: config.steps as any,
          metadata: config.metadata as any,
          active: true,
        },
      });

      return {
        success: true,
        data: workflow.id,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'WORKFLOW_TEMPLATE_ERROR',
          message: `Failed to store workflow template: ${config.name}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get workflow template by type
   */
  async getWorkflowTemplate(
    type: string
  ): Promise<Result<WorkflowConfiguration | null, MLError>> {
    try {
      const template = await this.prisma.workflowTemplate.findFirst({
        where: { type, active: true },
      });

      if (!template) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: {
          name: template.name,
          type: template.type,
          description: template.description || '',
          steps: template.steps as unknown as WorkflowStepConfig[],
          metadata: (template.metadata as Record<string, any>) || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'WORKFLOW_TEMPLATE_READ_ERROR',
          message: `Failed to read workflow template: ${type}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Store ML Provider configuration
   */
  async storeMlProviderConfig(
    config: MLProviderConfiguration
  ): Promise<Result<void, MLError>> {
    try {
      await this.setConfig(
        `ml_provider.${config.name}`,
        {
          type: config.type,
          endpoint: config.endpoint,
          model: config.model,
          settings: config.settings,
        },
        'ml_provider',
        `ML Provider configuration for ${config.name}`
      );

      // Store API key separately as secret
      await this.setConfig(
        `ml_provider.${config.name}.api_key`,
        config.apiKey,
        'ml_provider',
        `API Key for ${config.name}`,
        true // isSecret
      );

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ML_PROVIDER_CONFIG_ERROR',
          message: `Failed to store ML provider configuration: ${config.name}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get ML Provider configuration
   */
  async getMlProviderConfig(
    name: string
  ): Promise<Result<MLProviderConfiguration | null, MLError>> {
    try {
      const [configResult, keyResult] = await Promise.all([
        this.getConfig(`ml_provider.${name}`),
        this.getConfig(`ml_provider.${name}.api_key`),
      ]);

      if (!configResult.success || !configResult.data) {
        return { success: true, data: null };
      }

      const config = configResult.data as any;
      const apiKey = keyResult.success ? (keyResult.data as string) : '';

      return {
        success: true,
        data: {
          name,
          type: config.type,
          endpoint: config.endpoint,
          apiKey,
          model: config.model,
          settings: config.settings || {},
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ML_PROVIDER_READ_ERROR',
          message: `Failed to read ML provider configuration: ${name}`,
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Initialize default platform configuration
   */
  async initializeDefaults(): Promise<Result<void, MLError>> {
    try {
      await this.initializeDefaultWorkflows();
      await this.initializeDefaultProviders();
      await this.initializePlatformSettings();

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DEFAULTS_INIT_ERROR',
          message: 'Failed to initialize default configuration',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Initialize default workflows
   */
  private async initializeDefaultWorkflows(): Promise<void> {
    const workflows = this.getDefaultWorkflowConfigurations();
    for (const workflow of workflows) {
      await this.storeWorkflowTemplate(workflow);
    }
  }

  /**
   * Initialize default ML providers
   */
  private async initializeDefaultProviders(): Promise<void> {
    const providers = this.getDefaultProviderConfigurations();
    for (const provider of providers) {
      await this.storeMlProviderConfig(provider);
    }
  }

  /**
   * Initialize platform settings
   */
  private async initializePlatformSettings(): Promise<void> {
    await this.setConfig('platform.name', 'ThinkCode AI Platform', 'platform');
    await this.setConfig('platform.version', '1.0.0', 'platform');
    await this.setConfig(
      'platform.default_ml_provider',
      'github_copilot',
      'platform'
    );
    await this.setConfig('platform.max_concurrent_agents', 5, 'platform');
    await this.setConfig('platform.task_timeout_minutes', 30, 'platform');
    await this.setConfig('platform.enable_internet_research', true, 'platform');
  }

  /**
   * Get default workflow configurations
   */
  private getDefaultWorkflowConfigurations(): WorkflowConfiguration[] {
    return [
      {
        name: 'New Application Development',
        type: 'new_application',
        description:
          'Complete workflow for developing new applications from scratch',
        steps: [
          {
            name: 'Business Analysis',
            type: 'agent_task',
            agentType: 'business_analyst',
            inputs: ['project_requirements'],
            outputs: ['business_requirements', 'stakeholder_analysis'],
          },
          {
            name: 'System Architecture',
            type: 'agent_task',
            agentType: 'system_architect',
            inputs: ['business_requirements'],
            outputs: ['system_architecture', 'technology_stack'],
          },
          {
            name: 'Frontend Development',
            type: 'agent_task',
            agentType: 'frontend_developer',
            inputs: ['system_architecture'],
            outputs: ['ui_mockups', 'frontend_code'],
          },
          {
            name: 'Quality Assurance',
            type: 'agent_task',
            agentType: 'qa_engineer',
            inputs: ['frontend_code'],
            outputs: ['test_results'],
          },
        ],
        metadata: { estimatedDuration: '2-4 weeks', complexity: 'high' },
      },
    ];
  }

  /**
   * Get default provider configurations
   */
  private getDefaultProviderConfigurations(): MLProviderConfiguration[] {
    return [
      {
        name: 'github_copilot',
        type: 'github_copilot',
        endpoint: 'https://api.githubcopilot.com',
        apiKey: process.env.GITHUB_TOKEN || '',
        model: 'gpt-4',
        settings: { temperature: 0.3, maxTokens: 4000 },
      },
    ];
  }
}

export default ConfigurationService;
