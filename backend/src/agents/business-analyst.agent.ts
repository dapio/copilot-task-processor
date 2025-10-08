/**
 * Business Analyst Agent - Sarah Chen
 * Specialized in requirements analysis, stakeholder communication, and business process optimization
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';
import { BusinessAnalystLogic } from './services/business-analyst.logic';
import type {
  BusinessRequirement,
  StakeholderAnalysis,
  UserStory,
  BusinessCase,
  BusinessAnalysisResult,
  RequirementsPrioritizationResult,
  ProcessOptimizationResult,
  GapAnalysis,
} from './types/business-analyst.types';

export class BusinessAnalystAgent {
  private logic: BusinessAnalystLogic;
  private agentId = 'business-analyst-sarah-chen';

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.logic = new BusinessAnalystLogic(prisma, provider);
  }

  /**
   * Analyze project requirements and generate comprehensive business analysis
   */
  async analyzeRequirements(
    projectId: string,
    requirements: string[],
    context: any = {}
  ): Promise<Result<BusinessAnalysisResult, MLError>> {
    return await this.logic.analyzeRequirements(
      projectId,
      requirements,
      context
    );
  }

  /**
   * Perform comprehensive stakeholder analysis
   */
  async analyzeStakeholders(
    projectId: string,
    stakeholderInfo: any[]
  ): Promise<Result<StakeholderAnalysis[], MLError>> {
    return await this.logic.analyzeStakeholders(projectId, stakeholderInfo);
  }

  /**
   * Generate user stories from business requirements
   */
  async generateUserStories(
    requirements: BusinessRequirement[],
    personas: any[]
  ): Promise<Result<UserStory[], MLError>> {
    return await this.logic.generateUserStories(requirements, personas);
  }

  /**
   * Develop comprehensive business case
   */
  async developBusinessCase(
    projectInfo: any,
    alternatives: any[],
    constraints: any = {}
  ): Promise<Result<BusinessCase, MLError>> {
    return await this.logic.developBusinessCase(
      projectInfo,
      alternatives,
      constraints
    );
  }

  /**
   * Optimize business processes
   */
  async optimizeProcesses(
    currentProcess: any,
    painPoints: string[],
    objectives: any[]
  ): Promise<Result<ProcessOptimizationResult, MLError>> {
    return await this.logic.optimizeProcesses(
      currentProcess,
      painPoints,
      objectives
    );
  }

  /**
   * Conduct comprehensive gap analysis
   */
  async conductGapAnalysis(
    currentState: any,
    futureVision: any,
    capabilities: any[]
  ): Promise<Result<GapAnalysis, MLError>> {
    return await this.logic.conductGapAnalysis(
      currentState,
      futureVision,
      capabilities
    );
  }

  /**
   * Prioritize requirements using multiple methodologies
   */
  async prioritizeRequirements(
    requirements: BusinessRequirement[],
    criteria: any,
    stakeholders: StakeholderAnalysis[]
  ): Promise<Result<RequirementsPrioritizationResult, MLError>> {
    return await this.logic.prioritizeRequirements(
      requirements,
      criteria,
      stakeholders
    );
  }

  /**
   * Get agent information
   */
  getAgentInfo() {
    const config = BusinessAnalystLogic.getBusinessAnalystConfig();
    return {
      id: this.agentId,
      projectId: 'default-project', // Default project for now
      name: config.name,
      type: 'data-analyst', // Map role to type
      status: 'active' as 'active' | 'inactive' | 'error' | 'training',
      description: `${config.role} - ${config.personality}`,
      configuration: {
        model: 'gpt-4',
        maxTokens: 4096,
        temperature: 0.5,
        systemPrompt: `You are ${config.name}, a ${config.role}. ${config.personality}. Working style: ${config.workingStyle}`,
        tools: [
          'requirements_analysis',
          'stakeholder_analysis',
          'business_case',
        ],
        capabilities: [
          'requirements_analysis',
          'stakeholder_analysis',
          'user_story_generation',
          'business_case_development',
          'process_optimization',
          'gap_analysis',
          'requirements_prioritization',
        ],
        constraints: {
          maxExecutionTime: 300, // 5 minutes
          maxMemoryUsage: 512, // 512MB
          allowedDomains: ['localhost', '*.internal'],
          rateLimits: [],
        },
      },
      metrics: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        lastExecution: null,
        errorRate: 0,
      },
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date(),
      tags: [
        'business',
        'analysis',
        'requirements',
        'stakeholders',
        'strategy',
      ],
    };
  }
}

export default BusinessAnalystAgent;

// Re-export types for external use
export type {
  BusinessRequirement,
  StakeholderAnalysis,
  UserStory,
  BusinessCase,
  BusinessAnalysisResult,
  RequirementsPrioritizationResult,
  ProcessOptimizationResult,
  GapAnalysis,
} from './types/business-analyst.types';
