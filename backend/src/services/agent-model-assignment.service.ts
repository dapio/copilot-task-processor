/**
 * Agent Model Assignment Service
 * Database-backed service for managing AI model assignments to agents
 */

import {
  AgentModelAssignment,
  AgentModelAssignmentEntity,
  ModelSpecialization,
  Result,
} from '../types/ai-provider.types';
import { providerRegistry } from './provider-registry.service';

export class AgentModelAssignmentService {
  private assignments: Map<string, AgentModelAssignment> = new Map();
  private initialized = false;

  /**
   * Initialize service with optimal assignments based on your recommendations
   */
  async initialize(): Promise<Result<boolean>> {
    try {
      // Load optimal assignments as per your analysis
      const optimalAssignments: AgentModelAssignment[] = [
        {
          agentType: 'system-architect',
          primaryProvider: 'anthropic-claude',
          primaryModel: 'claude-3-5-sonnet-20241022',
          fallbackProviders: [
            { provider: 'azure-openai', model: 'gpt-4o', priority: 1 },
            { provider: 'deepseek', model: 'deepseek-chat', priority: 2 },
          ],
          specializedConfigs: {
            systemDesign: {
              provider: 'anthropic-claude',
              model: 'claude-3-5-sonnet-20241022',
            },
          },
        },
        {
          agentType: 'business-analyst',
          primaryProvider: 'anthropic-claude',
          primaryModel: 'claude-3-5-sonnet-20241022',
          fallbackProviders: [
            { provider: 'azure-openai', model: 'gpt-4o', priority: 1 },
            { provider: 'deepseek', model: 'deepseek-chat', priority: 2 },
            { provider: 'groq', model: 'llama-3.1-70b-versatile', priority: 3 },
          ],
        },
        {
          agentType: 'qa-engineer',
          primaryProvider: 'deepseek',
          primaryModel: 'deepseek-coder-v3',
          fallbackProviders: [
            {
              provider: 'anthropic-claude',
              model: 'claude-3-5-sonnet-20241022',
              priority: 1,
            },
            { provider: 'azure-openai', model: 'gpt-4o', priority: 2 },
            { provider: 'groq', model: 'mixtral-8x7b-32768', priority: 3 },
          ],
          specializedConfigs: {
            codeReview: {
              provider: 'anthropic-claude',
              model: 'claude-3-5-sonnet-20241022',
            },
          },
        },
        {
          agentType: 'frontend-developer',
          primaryProvider: 'anthropic-claude',
          primaryModel: 'claude-3-5-sonnet-20241022',
          fallbackProviders: [
            { provider: 'deepseek', model: 'deepseek-coder-v3', priority: 1 },
            { provider: 'azure-openai', model: 'gpt-4o', priority: 2 },
            { provider: 'groq', model: 'llama-3.1-70b-versatile', priority: 3 },
          ],
        },
        {
          agentType: 'backend-developer',
          primaryProvider: 'anthropic-claude',
          primaryModel: 'claude-3-5-sonnet-20241022',
          fallbackProviders: [
            { provider: 'deepseek', model: 'deepseek-coder-v3', priority: 1 },
            { provider: 'azure-openai', model: 'gpt-4o', priority: 2 },
            { provider: 'groq', model: 'llama-3.1-70b-versatile', priority: 3 },
          ],
          specializedConfigs: {
            codeReview: {
              provider: 'deepseek',
              model: 'deepseek-coder-v3',
            },
          },
        },
        {
          agentType: 'project-manager',
          primaryProvider: 'anthropic-claude',
          primaryModel: 'claude-3-5-sonnet-20241022',
          fallbackProviders: [
            { provider: 'azure-openai', model: 'gpt-4o', priority: 1 },
            { provider: 'deepseek', model: 'deepseek-chat', priority: 2 },
            { provider: 'groq', model: 'llama-3.1-70b-versatile', priority: 3 },
          ],
        },
        {
          agentType: 'workflow-assistant',
          primaryProvider: 'azure-openai',
          primaryModel: 'gpt-4o',
          fallbackProviders: [
            {
              provider: 'anthropic-claude',
              model: 'claude-3-5-sonnet-20241022',
              priority: 1,
            },
            { provider: 'deepseek', model: 'deepseek-chat', priority: 2 },
            { provider: 'groq', model: 'llama-3.1-70b-versatile', priority: 3 },
          ],
        },
      ];

      // Load assignments into memory
      for (const assignment of optimalAssignments) {
        this.assignments.set(assignment.agentType, assignment);
      }

      // TODO: In production, load from database
      // await this.loadFromDatabase();

      this.initialized = true;
      console.log(
        `✅ Initialized Agent Model Assignments for ${this.assignments.size} agents`
      );

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ASSIGNMENT_INIT_ERROR',
          message: 'Failed to initialize agent model assignments',
          details: error,
        },
      };
    }
  }

  /**
   * Get model assignment for specific agent
   */
  async getAssignmentForAgent(
    agentType: string
  ): Promise<Result<AgentModelAssignment>> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const assignment = this.assignments.get(agentType);

      if (!assignment) {
        // Return default assignment
        return {
          success: true,
          data: {
            agentType,
            primaryProvider: 'azure-openai',
            primaryModel: 'gpt-4o',
            fallbackProviders: [
              {
                provider: 'anthropic-claude',
                model: 'claude-3-5-sonnet-20241022',
                priority: 1,
              },
            ],
          },
        };
      }

      return { success: true, data: assignment };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ASSIGNMENT_RETRIEVAL_ERROR',
          message: `Failed to get assignment for agent ${agentType}`,
          details: error,
        },
      };
    }
  }

  /**
   * Update assignment for agent
   */
  async updateAssignment(
    agentType: string,
    assignment: AgentModelAssignment
  ): Promise<Result<boolean>> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Validate that providers and models exist
      const providerResult = await providerRegistry.getProvider(
        assignment.primaryProvider
      );
      if (!providerResult.success) {
        return {
          success: false,
          error: {
            code: 'INVALID_PROVIDER',
            message: `Primary provider ${assignment.primaryProvider} not found`,
            details: providerResult.error,
          },
        };
      }

      // Update in memory
      this.assignments.set(agentType, assignment);

      // TODO: Save to database
      // await this.saveToDatabase(assignment);

      console.log(
        `✅ Updated assignment for ${agentType}: ${assignment.primaryProvider}/${assignment.primaryModel}`
      );

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ASSIGNMENT_UPDATE_ERROR',
          message: `Failed to update assignment for agent ${agentType}`,
          details: error,
        },
      };
    }
  }

  /**
   * Get all assignments
   */
  async getAllAssignments(): Promise<Result<AgentModelAssignment[]>> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const assignments = Array.from(this.assignments.values());
      return { success: true, data: assignments };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ALL_ASSIGNMENTS_ERROR',
          message: 'Failed to retrieve all assignments',
          details: error,
        },
      };
    }
  }

  /**
   * Get optimal provider for specific task type
   */
  async getOptimalProviderForTask(
    agentType: string,
    taskType: 'general' | 'codeReview' | 'systemDesign' = 'general'
  ): Promise<Result<{ provider: string; model: string }>> {
    try {
      const assignmentResult = await this.getAssignmentForAgent(agentType);

      if (!assignmentResult.success) {
        return assignmentResult as any;
      }

      const assignment = assignmentResult.data;

      // Check for specialized config
      if (taskType !== 'general' && assignment.specializedConfigs) {
        const specializedConfig = assignment.specializedConfigs[taskType];
        if (specializedConfig) {
          return {
            success: true,
            data: {
              provider: specializedConfig.provider,
              model: specializedConfig.model,
            },
          };
        }
      }

      // Return primary assignment
      return {
        success: true,
        data: {
          provider: assignment.primaryProvider,
          model: assignment.primaryModel,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPTIMAL_PROVIDER_ERROR',
          message: `Failed to get optimal provider for ${agentType}/${taskType}`,
          details: error,
        },
      };
    }
  }

  /**
   * Get fallback providers in priority order
   */
  async getFallbackProvidersForAgent(
    agentType: string
  ): Promise<Result<Array<{ provider: string; model: string }>>> {
    try {
      const assignmentResult = await this.getAssignmentForAgent(agentType);

      if (!assignmentResult.success) {
        return assignmentResult as any;
      }

      const fallbacks = assignmentResult.data.fallbackProviders
        .sort((a, b) => a.priority - b.priority)
        .map(f => ({ provider: f.provider, model: f.model }));

      return { success: true, data: fallbacks };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FALLBACK_PROVIDERS_ERROR',
          message: `Failed to get fallback providers for ${agentType}`,
          details: error,
        },
      };
    }
  }

  /**
   * Generate assignment recommendations based on agent specialization
   */
  async generateRecommendations(
    agentType: string,
    specialization: ModelSpecialization
  ): Promise<Result<AgentModelAssignment>> {
    try {
      const modelsResult = await providerRegistry.getModelsBySpecialization(
        specialization
      );

      if (!modelsResult.success || modelsResult.data.length === 0) {
        return {
          success: false,
          error: {
            code: 'NO_SUITABLE_MODELS',
            message: `No models found for specialization ${specialization}`,
          },
        };
      }

      const models = modelsResult.data;
      const primary = models[0]; // Best model
      const fallbacks = models.slice(1, 4); // Next 3 best

      const recommendation: AgentModelAssignment = {
        agentType,
        primaryProvider: primary.provider,
        primaryModel: primary.id,
        fallbackProviders: fallbacks.map((model, index) => ({
          provider: model.provider,
          model: model.id,
          priority: index + 1,
        })),
      };

      return { success: true, data: recommendation };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: `Failed to generate recommendations for ${agentType}`,
          details: error,
        },
      };
    }
  }

  /**
   * TODO: Database persistence methods
   */
  private async loadFromDatabase(): Promise<void> {
    // Implementation for loading from database
    // This would use Prisma or your chosen ORM
  }

  private async saveToDatabase(
    assignment: AgentModelAssignment
  ): Promise<void> {
    // Implementation for saving to database
    // This would use Prisma or your chosen ORM
  }
}

export const agentModelAssignmentService = new AgentModelAssignmentService();
