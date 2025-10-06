/**
 * Business Analyst Agent Services
 * Core business logic for business analysis tasks
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../../providers/ml-provider.interface';
import { BusinessAnalystPrompts } from '../prompts/business-analyst.prompts';
import type {
  BusinessRequirement,
  StakeholderAnalysis,
  UserStory,
  BusinessCase,
  BusinessAnalysisResult,
  RequirementsPrioritizationResult,
  ProcessOptimizationResult,
  GapAnalysis,
} from '../types/business-analyst.types';

export class BusinessAnalystLogic {
  constructor(private prisma: PrismaClient, private provider: IMLProvider) {}

  /**
   * Agent configuration
   */
  static getBusinessAnalystConfig() {
    return {
      name: 'Sarah Chen',
      role: 'Business Analyst',
      personality: 'analytical, empathetic, detail-oriented, strategic',
      expertise: [
        'requirements_engineering',
        'stakeholder_management',
        'business_process_analysis',
        'gap_analysis',
        'user_story_writing',
        'acceptance_criteria_definition',
        'business_case_development',
        'roi_analysis',
        'process_improvement',
        'change_management',
      ],
      workingStyle: 'collaborative, thorough, documentation-focused',
      communicationStyle: 'clear, structured, business-oriented',
    };
  }

  /**
   * Analyze project requirements and generate comprehensive business analysis
   */
  async analyzeRequirements(
    projectId: string,
    requirements: string[],
    context: any = {}
  ): Promise<Result<BusinessAnalysisResult, MLError>> {
    const prompt = BusinessAnalystPrompts.buildRequirementsAnalysisPrompt(
      requirements,
      context
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 3000,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'REQUIREMENTS_ANALYSIS_FAILED',
          message: `Business analysis failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const result = this.parseRequirementsAnalysisResponse(response.data.text);

      // Store analysis result
      await this.storeAnalysisResult(projectId, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REQUIREMENTS_PROCESSING_ERROR',
          message: 'Failed to process requirements analysis',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Perform comprehensive stakeholder analysis
   */
  async analyzeStakeholders(
    projectId: string,
    stakeholderInfo: any[]
  ): Promise<Result<StakeholderAnalysis[], MLError>> {
    const prompt =
      BusinessAnalystPrompts.buildStakeholderAnalysisPrompt(stakeholderInfo);

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 2500,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'STAKEHOLDER_ANALYSIS_FAILED',
          message: `Stakeholder analysis failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const result = this.parseStakeholderAnalysisResponse(response.data.text);

      // Store stakeholder analysis
      await this.storeStakeholderAnalysis(projectId, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STAKEHOLDER_PROCESSING_ERROR',
          message: 'Failed to process stakeholder analysis',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Generate user stories from business requirements
   */
  async generateUserStories(
    requirements: BusinessRequirement[],
    personas: any[]
  ): Promise<Result<UserStory[], MLError>> {
    const prompt = BusinessAnalystPrompts.buildUserStoryPrompt(
      requirements,
      personas
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 3500,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'USER_STORY_GENERATION_FAILED',
          message: `User story generation failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const result = this.parseUserStoriesResponse(response.data.text);

      // Store user stories
      await this.storeUserStories(requirements, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'USER_STORY_PROCESSING_ERROR',
          message: 'Failed to process user stories',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Develop comprehensive business case
   */
  async developBusinessCase(
    projectInfo: any,
    alternatives: any[],
    constraints: any = {}
  ): Promise<Result<BusinessCase, MLError>> {
    const prompt = BusinessAnalystPrompts.buildBusinessCasePrompt(
      projectInfo,
      alternatives,
      constraints
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 4000,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'BUSINESS_CASE_FAILED',
          message: `Business case development failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const result = this.parseBusinessCaseResponse(response.data.text);

      // Store business case
      await this.storeBusinessCase(projectInfo, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BUSINESS_CASE_PROCESSING_ERROR',
          message: 'Failed to process business case',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Optimize business processes
   */
  async optimizeProcesses(
    currentProcess: any,
    painPoints: string[],
    objectives: any[]
  ): Promise<Result<ProcessOptimizationResult, MLError>> {
    const prompt = BusinessAnalystPrompts.buildProcessOptimizationPrompt(
      currentProcess,
      painPoints,
      objectives
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 4000,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'PROCESS_OPTIMIZATION_FAILED',
          message: `Process optimization failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const result = this.parseProcessOptimizationResponse(response.data.text);

      // Store optimization results
      await this.storeProcessOptimization(currentProcess, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROCESS_OPTIMIZATION_PROCESSING_ERROR',
          message: 'Failed to process optimization results',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Conduct gap analysis
   */
  async conductGapAnalysis(
    currentState: any,
    futureVision: any,
    capabilities: any[]
  ): Promise<Result<GapAnalysis, MLError>> {
    const prompt = BusinessAnalystPrompts.buildGapAnalysisPrompt(
      currentState,
      futureVision,
      capabilities
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 3500,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'GAP_ANALYSIS_FAILED',
          message: `Gap analysis failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const result = this.parseGapAnalysisResponse(response.data.text);

      // Store gap analysis
      await this.storeGapAnalysis(currentState, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GAP_ANALYSIS_PROCESSING_ERROR',
          message: 'Failed to process gap analysis',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Prioritize requirements using multiple methodologies
   */
  async prioritizeRequirements(
    requirements: BusinessRequirement[],
    criteria: any,
    stakeholders: StakeholderAnalysis[]
  ): Promise<Result<RequirementsPrioritizationResult, MLError>> {
    const prompt = BusinessAnalystPrompts.buildPrioritizationPrompt(
      requirements,
      criteria,
      stakeholders
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 3000,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'PRIORITIZATION_FAILED',
          message: `Requirements prioritization failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const result = this.parsePrioritizationResponse(response.data.text);

      // Store prioritization results
      await this.storePrioritization(requirements, result);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PRIORITIZATION_PROCESSING_ERROR',
          message: 'Failed to process prioritization results',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Private helper methods for parsing responses
  private parseRequirementsAnalysisResponse(
    text: string
  ): BusinessAnalysisResult {
    // Parse AI response and extract structured data
    return JSON.parse(text);
  }

  private parseStakeholderAnalysisResponse(
    text: string
  ): StakeholderAnalysis[] {
    return JSON.parse(text);
  }

  private parseUserStoriesResponse(text: string): UserStory[] {
    return JSON.parse(text);
  }

  private parseBusinessCaseResponse(text: string): BusinessCase {
    return JSON.parse(text);
  }

  private parseProcessOptimizationResponse(
    text: string
  ): ProcessOptimizationResult {
    return JSON.parse(text);
  }

  private parseGapAnalysisResponse(text: string): GapAnalysis {
    return JSON.parse(text);
  }

  private parsePrioritizationResponse(
    text: string
  ): RequirementsPrioritizationResult {
    return JSON.parse(text);
  }

  // Private helper methods for storing results
  private async storeAnalysisResult(
    _projectId: string,
    _result: BusinessAnalysisResult
  ): Promise<void> {
    // Store in database
    void _projectId;
    void _result;
  }

  private async storeStakeholderAnalysis(
    _projectId: string,
    _result: StakeholderAnalysis[]
  ): Promise<void> {
    void _projectId;
    void _result;
  }

  private async storeUserStories(
    _requirements: BusinessRequirement[],
    _result: UserStory[]
  ): Promise<void> {
    void _requirements;
    void _result;
  }

  private async storeBusinessCase(
    _projectInfo: any,
    _result: BusinessCase
  ): Promise<void> {
    void _projectInfo;
    void _result;
  }

  private async storeProcessOptimization(
    _currentProcess: any,
    _result: ProcessOptimizationResult
  ): Promise<void> {
    void _currentProcess;
    void _result;
  }

  private async storeGapAnalysis(
    _currentState: any,
    _result: GapAnalysis
  ): Promise<void> {
    void _currentState;
    void _result;
  }

  private async storePrioritization(
    _requirements: BusinessRequirement[],
    _result: RequirementsPrioritizationResult
  ): Promise<void> {
    void _requirements;
    void _result;
  }
}

export default BusinessAnalystLogic;
