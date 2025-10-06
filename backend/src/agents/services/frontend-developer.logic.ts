/**
 * Frontend Developer Agent Business Logic
 * Core business operations for frontend development tasks
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../../providers/ml-provider.interface';
import type {
  FrontendArchitecture,
  ComponentGenerationResult,
  PerformanceOptimizationResult,
  AccessibilityImplementationResult,
  FrontendAgentConfig,
} from '../types/frontend-developer.types';
import { FrontendDeveloperPrompts } from '../prompts/frontend-developer.prompts';

export class FrontendDeveloperLogic {
  private prisma: PrismaClient;
  private provider: IMLProvider;

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Generate React component with full implementation
   */
  async generateComponent(
    componentName: string,
    requirements: any,
    designSystem?: any
  ): Promise<Result<ComponentGenerationResult, MLError>> {
    try {
      const prompt = FrontendDeveloperPrompts.buildComponentGenerationPrompt(
        componentName,
        requirements,
        designSystem
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 3500,
      });

      if (!response.success) {
        return this.createComponentGenerationError(response.error);
      }

      const componentResult = this.parseComponentResponse(response.data.text);
      if (!componentResult.success) {
        return componentResult;
      }

      return {
        success: true,
        data: {
          code: componentResult.data.component.code,
          tests: componentResult.data.tests.code,
          docs: componentResult.data.documentation,
        },
      };
    } catch (error) {
      return this.createComponentGenerationError({
        code: 'COMPONENT_GENERATION_FAILED',
        message: 'Component generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Design comprehensive frontend architecture
   */
  async designFrontendArchitecture(
    projectId: string,
    requirements: any[],
    constraints: any = {}
  ): Promise<Result<FrontendArchitecture, MLError>> {
    try {
      const prompt = FrontendDeveloperPrompts.buildArchitectureDesignPrompt(
        requirements,
        constraints
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      const architectureResult = this.parseArchitectureResponse(
        response.data.text
      );
      if (!architectureResult.success) {
        return architectureResult;
      }

      // Store architecture in database
      await this.storeArchitecture(projectId, architectureResult.data);

      return {
        success: true,
        data: architectureResult.data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ARCHITECTURE_DESIGN_ERROR',
          message: 'Failed to design frontend architecture',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Optimize component performance with detailed analysis
   */
  async optimizePerformance(
    componentCode: string,
    performanceMetrics: any
  ): Promise<Result<PerformanceOptimizationResult, MLError>> {
    try {
      const prompt =
        FrontendDeveloperPrompts.buildPerformanceOptimizationPrompt(
          componentCode,
          performanceMetrics
        );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 3000,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      const optimizationResult = this.parseOptimizationResponse(
        response.data.text
      );
      if (!optimizationResult.success) {
        return optimizationResult;
      }

      return {
        success: true,
        data: {
          optimizedCode: optimizationResult.data.optimizedCode,
          optimizations: optimizationResult.data.optimizations,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PERFORMANCE_OPTIMIZATION_ERROR',
          message: 'Failed to optimize performance',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Implement comprehensive accessibility features
   */
  async implementAccessibility(
    componentCode: string,
    accessibilityRequirements: any
  ): Promise<Result<AccessibilityImplementationResult, MLError>> {
    try {
      const prompt = FrontendDeveloperPrompts.buildAccessibilityPrompt(
        componentCode,
        accessibilityRequirements
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.2,
        maxTokens: 2500,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      const accessibilityResult = this.parseAccessibilityResponse(
        response.data.text
      );
      if (!accessibilityResult.success) {
        return accessibilityResult;
      }

      return {
        success: true,
        data: {
          accessibleCode: accessibilityResult.data.accessibleCode,
          features: accessibilityResult.data.accessibilityFeatures,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ACCESSIBILITY_IMPLEMENTATION_ERROR',
          message: 'Failed to implement accessibility',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Analyze existing component for issues and improvements
   */
  async analyzeComponent(
    componentCode: string,
    requirements?: any
  ): Promise<Result<any, MLError>> {
    try {
      const prompt = FrontendDeveloperPrompts.buildComponentReviewPrompt(
        componentCode,
        requirements || {}
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 2500,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      const analysisResult = this.parseAnalysisResponse(response.data.text);
      return analysisResult;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPONENT_ANALYSIS_ERROR',
          message: 'Failed to analyze component',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Generate responsive design implementation
   */
  async generateResponsiveDesign(
    designSpecs: any,
    breakpoints: any
  ): Promise<Result<any, MLError>> {
    try {
      const prompt = FrontendDeveloperPrompts.buildResponsiveDesignPrompt(
        designSpecs,
        breakpoints
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 3000,
      });

      if (!response.success) {
        return {
          success: false,
          error: response.error,
        };
      }

      const responsiveResult = this.parseResponsiveResponse(response.data.text);
      return responsiveResult;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESPONSIVE_DESIGN_ERROR',
          message: 'Failed to generate responsive design',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Private helper methods

  /**
   * Parse component generation response
   */
  private parseComponentResponse(text: string): Result<any, MLError> {
    try {
      const componentResult = JSON.parse(text);
      return { success: true, data: componentResult };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPONENT_PROCESSING_ERROR',
          message: 'Failed to process component generation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Parse architecture design response
   */
  private parseArchitectureResponse(
    text: string
  ): Result<FrontendArchitecture, MLError> {
    try {
      const architectureResult = JSON.parse(text);
      return { success: true, data: architectureResult.architecture };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ARCHITECTURE_PROCESSING_ERROR',
          message: 'Failed to process architecture design',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Parse performance optimization response
   */
  private parseOptimizationResponse(text: string): Result<any, MLError> {
    try {
      const optimizationResult = JSON.parse(text);
      return { success: true, data: optimizationResult };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OPTIMIZATION_PROCESSING_ERROR',
          message: 'Failed to process optimization results',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Parse accessibility implementation response
   */
  private parseAccessibilityResponse(text: string): Result<any, MLError> {
    try {
      const accessibilityResult = JSON.parse(text);
      return { success: true, data: accessibilityResult };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ACCESSIBILITY_PROCESSING_ERROR',
          message: 'Failed to process accessibility results',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Parse component analysis response
   */
  private parseAnalysisResponse(text: string): Result<any, MLError> {
    try {
      const analysisResult = JSON.parse(text);
      return { success: true, data: analysisResult };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_PROCESSING_ERROR',
          message: 'Failed to process analysis results',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Parse responsive design response
   */
  private parseResponsiveResponse(text: string): Result<any, MLError> {
    try {
      const responsiveResult = JSON.parse(text);
      return { success: true, data: responsiveResult };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'RESPONSIVE_PROCESSING_ERROR',
          message: 'Failed to process responsive design results',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Create component generation error
   */
  private createComponentGenerationError(
    error: any
  ): Result<ComponentGenerationResult, MLError> {
    return {
      success: false,
      error: {
        code: 'COMPONENT_GENERATION_FAILED',
        message: `Component generation failed: ${error.message}`,
        details: error.details,
      },
    };
  }

  /**
   * Store architecture in database
   */
  private async storeArchitecture(
    projectId: string,
    architecture: FrontendArchitecture
  ): Promise<void> {
    // Implementation for storing architecture
    // This would integrate with Prisma to save the architecture data
    // For now, we'll just log it
    console.log(`Storing architecture for project ${projectId}:`, architecture);
  }

  /**
   * Get agent configuration
   */
  static getAgentConfig(): FrontendAgentConfig {
    return {
      name: 'Zoe Park',
      role: 'Frontend Developer',
      personality: 'creative, detail-oriented, user-focused, innovative',
      expertise: [
        'react_development',
        'typescript',
        'next_js',
        'ui_ux_implementation',
        'responsive_design',
        'accessibility',
        'performance_optimization',
        'state_management',
        'testing',
        'build_tools',
        'css_frameworks',
        'component_architecture',
      ],
      workingStyle: 'iterative, component-driven, test-first',
      communicationStyle: 'visual, practical, user-centric',
    };
  }
}
