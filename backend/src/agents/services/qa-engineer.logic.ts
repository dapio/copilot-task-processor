/**
 * QA Engineer Agent Business Logic
 * Core business operations for quality assurance and testing
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../../providers/ml-provider.interface';
import type {
  TestCase,
  QualityAssessmentResult,
  TestPlanResult,
  TestSuiteResult,
  CoverageReport,
  QAAgentConfig,
} from '../types/qa-engineer.types';
import { QAEngineerPrompts } from '../prompts/qa-engineer.prompts';

export class QAEngineerLogic {
  private prisma: PrismaClient;
  private provider: IMLProvider;

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Generate comprehensive test plan
   */
  async generateTestPlan(
    requirements: any,
    constraints: any = {}
  ): Promise<Result<TestPlanResult, MLError>> {
    try {
      const prompt = QAEngineerPrompts.buildTestPlanPrompt(
        requirements,
        constraints
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      if (!response.success) return response;

      const planResult = this.parseTestPlanResponse(response.data.text);
      if (!planResult.success) return planResult;

      return {
        success: true,
        data: planResult.data,
      };
    } catch (error) {
      return this.createError(
        'TEST_PLAN_FAILED',
        'Failed to generate test plan',
        error
      );
    }
  }

  /**
   * Generate test suite for specific feature
   */
  async generateTestSuite(
    feature: string,
    specifications: any
  ): Promise<Result<TestSuiteResult, MLError>> {
    try {
      const prompt = QAEngineerPrompts.buildTestSuitePrompt(
        feature,
        specifications
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 3500,
      });

      if (!response.success) return response;

      const suiteResult = this.parseTestSuiteResponse(response.data.text);
      if (!suiteResult.success) return suiteResult;

      return {
        success: true,
        data: suiteResult.data,
      };
    } catch (error) {
      return this.createError(
        'TEST_SUITE_FAILED',
        'Failed to generate test suite',
        error
      );
    }
  }

  /**
   * Generate automation code for test case
   */
  async generateAutomationCode(
    testCase: TestCase,
    framework: string
  ): Promise<
    Result<{ code: string; setup: string; teardown: string }, MLError>
  > {
    try {
      const prompt = QAEngineerPrompts.buildAutomationPrompt(
        testCase,
        framework
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 3000,
      });

      if (!response.success) return response;

      const automationResult = this.parseAutomationResponse(response.data.text);
      if (!automationResult.success) return automationResult;

      return {
        success: true,
        data: automationResult.data,
      };
    } catch (error) {
      return this.createError(
        'AUTOMATION_FAILED',
        'Failed to generate automation code',
        error
      );
    }
  }

  /**
   * Assess overall quality of project
   */
  async assessQuality(
    metrics: any,
    codebase: any
  ): Promise<Result<QualityAssessmentResult, MLError>> {
    try {
      const prompt = QAEngineerPrompts.buildQualityAssessmentPrompt(
        metrics,
        codebase
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 3500,
      });

      if (!response.success) return response;

      const qualityResult = this.parseQualityAssessmentResponse(
        response.data.text
      );
      if (!qualityResult.success) return qualityResult;

      return {
        success: true,
        data: qualityResult.data,
      };
    } catch (error) {
      return this.createError(
        'QUALITY_ASSESSMENT_FAILED',
        'Failed to assess quality',
        error
      );
    }
  }

  /**
   * Analyze defects and suggest improvements
   */
  async analyzeDefects(
    defects: any[],
    context: any
  ): Promise<Result<any, MLError>> {
    try {
      const prompt = QAEngineerPrompts.buildDefectAnalysisPrompt(
        defects,
        context
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.4,
        maxTokens: 2500,
      });

      if (!response.success) return response;

      const defectAnalysis = this.parseDefectAnalysisResponse(
        response.data.text
      );
      return defectAnalysis;
    } catch (error) {
      return this.createError(
        'DEFECT_ANALYSIS_FAILED',
        'Failed to analyze defects',
        error
      );
    }
  }

  /**
   * Design performance testing strategy
   */
  async designPerformanceTests(
    requirements: any,
    environment: any
  ): Promise<Result<any, MLError>> {
    try {
      const prompt = QAEngineerPrompts.buildPerformanceTestingPrompt(
        requirements,
        environment
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 3000,
      });

      if (!response.success) return response;

      const performanceStrategy = this.parsePerformanceTestingResponse(
        response.data.text
      );
      return performanceStrategy;
    } catch (error) {
      return this.createError(
        'PERFORMANCE_TESTING_FAILED',
        'Failed to design performance tests',
        error
      );
    }
  }

  /**
   * Design security testing approach
   */
  async designSecurityTests(
    application: any,
    threats: any
  ): Promise<Result<any, MLError>> {
    try {
      const prompt = QAEngineerPrompts.buildSecurityTestingPrompt(
        application,
        threats
      );

      const response = await this.provider.generateText(prompt, {
        temperature: 0.3,
        maxTokens: 3000,
      });

      if (!response.success) return response;

      const securityStrategy = this.parseSecurityTestingResponse(
        response.data.text
      );
      return securityStrategy;
    } catch (error) {
      return this.createError(
        'SECURITY_TESTING_FAILED',
        'Failed to design security tests',
        error
      );
    }
  }

  /**
   * Generate coverage report analysis
   */
  async analyzeCoverage(
    coverageData: any,
    requirements: any[]
  ): Promise<Result<CoverageReport, MLError>> {
    try {
      // Analyze coverage data against requirements
      const analysis = this.performCoverageAnalysis(coverageData, requirements);

      return {
        success: true,
        data: analysis,
      };
    } catch (error) {
      return this.createError(
        'COVERAGE_ANALYSIS_FAILED',
        'Failed to analyze coverage',
        error
      );
    }
  }

  /**
   * Validate test execution results
   */
  async validateTestResults(
    executionResults: any,
    expectedOutcomes: any
  ): Promise<Result<any, MLError>> {
    try {
      // Compare results with expected outcomes
      const validation = this.performResultsValidation(
        executionResults,
        expectedOutcomes
      );

      return {
        success: true,
        data: validation,
      };
    } catch (error) {
      return this.createError(
        'RESULTS_VALIDATION_FAILED',
        'Failed to validate test results',
        error
      );
    }
  }

  // Private helper methods

  private parseTestPlanResponse(text: string): Result<TestPlanResult, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'TEST_PLAN_PARSE_ERROR',
        'Failed to parse test plan',
        error
      );
    }
  }

  private parseTestSuiteResponse(
    text: string
  ): Result<TestSuiteResult, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'TEST_SUITE_PARSE_ERROR',
        'Failed to parse test suite',
        error
      );
    }
  }

  private parseAutomationResponse(text: string): Result<any, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'AUTOMATION_PARSE_ERROR',
        'Failed to parse automation code',
        error
      );
    }
  }

  private parseQualityAssessmentResponse(
    text: string
  ): Result<QualityAssessmentResult, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'QUALITY_PARSE_ERROR',
        'Failed to parse quality assessment',
        error
      );
    }
  }

  private parseDefectAnalysisResponse(text: string): Result<any, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'DEFECT_PARSE_ERROR',
        'Failed to parse defect analysis',
        error
      );
    }
  }

  private parsePerformanceTestingResponse(text: string): Result<any, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'PERFORMANCE_PARSE_ERROR',
        'Failed to parse performance testing',
        error
      );
    }
  }

  private parseSecurityTestingResponse(text: string): Result<any, MLError> {
    try {
      const data = JSON.parse(text);
      return { success: true, data };
    } catch (error) {
      return this.createError(
        'SECURITY_PARSE_ERROR',
        'Failed to parse security testing',
        error
      );
    }
  }

  private performCoverageAnalysis(
    coverageData: any,
    requirements: any[]
  ): CoverageReport {
    // Analiza pokrycia kodu na podstawie danych pokrycia i wymagań
    const totalRequirements = requirements.length;
    const coveredRequirements = coverageData?.covered || 0;
    const coveragePercent =
      totalRequirements > 0
        ? (coveredRequirements / totalRequirements) * 100
        : 0;

    return {
      overall: Math.round(coveragePercent),
      unit: coverageData?.unit || 0,
      integration: coverageData?.integration || 0,
      e2e: coverageData?.e2e || 0,
      statements: coverageData?.statements || 0,
      branches: coverageData?.branches || 0,
      functions: coverageData?.functions || 0,
      lines: 0,
      features: [],
      requirements: [],
    };
  }

  private performResultsValidation(
    executionResults: any,
    expectedOutcomes: any
  ): any {
    // Walidacja wyników wykonania względem oczekiwanych rezultatów
    const isValid =
      JSON.stringify(executionResults) === JSON.stringify(expectedOutcomes);
    return {
      valid: isValid,
      discrepancies: isValid
        ? []
        : ['Wyniki nie odpowiadają oczekiwanym wartościom'],
      confidence: isValid ? 95 : 30,
    };
  }

  private createError(
    code: string,
    message: string,
    error?: any
  ): Result<any, MLError> {
    return {
      success: false,
      error: {
        code,
        message,
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }

  /**
   * Get agent configuration
   */
  static getQAAgentConfig(): QAAgentConfig {
    return {
      name: 'Maya Patel',
      role: 'QA Engineer',
      personality: 'methodical, detail-oriented, quality-focused, analytical',
      expertise: [
        'test_planning',
        'test_automation',
        'quality_assurance',
        'defect_management',
        'performance_testing',
        'security_testing',
        'accessibility_testing',
        'test_strategy',
      ],
      workingStyle: 'systematic, thorough, risk-based',
      communicationStyle: 'clear, data-driven, actionable',
      qualityStandards: [
        'comprehensive_coverage',
        'automation_first',
        'risk_based_testing',
        'continuous_quality',
      ],
    };
  }
}
