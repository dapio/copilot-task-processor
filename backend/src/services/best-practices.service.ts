/**
 * Best Practices Management Service
 * Manages agent best practices, standards, and compliance rules
 */

import { PrismaClient, AgentBestPractice } from '@prisma/client';
import { Result, MLError } from '../providers/ml-provider.interface';

export type BestPractice = AgentBestPractice;

export interface ComplianceCheck {
  rule: string;
  compliant: boolean;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface AgentStandards {
  agentType: string;
  practices: BestPractice[];
  complianceRules: Record<string, any>;
}

export class BestPracticesService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Initialize default best practices for all agent types
   */
  async initializeDefaultPractices(): Promise<Result<void, MLError>> {
    try {
      const defaultPractices = this.getDefaultBestPractices();

      for (const practice of defaultPractices) {
        await this.prisma.agentBestPractice.upsert({
          where: {
            id: `${practice.agentType}_${practice.category}_${practice.title}`
              .toLowerCase()
              .replace(/\s+/g, '_'),
          },
          update: practice,
          create: {
            id: `${practice.agentType}_${practice.category}_${practice.title}`
              .toLowerCase()
              .replace(/\s+/g, '_'),
            ...practice,
          },
        });
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BEST_PRACTICES_INIT_ERROR',
          message: 'Failed to initialize best practices',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get best practices for specific agent type
   */
  async getAgentStandards(
    agentType: string
  ): Promise<Result<AgentStandards, MLError>> {
    try {
      const practices = await this.prisma.agentBestPractice.findMany({
        where: {
          agentType,
          active: true,
        },
        orderBy: [{ priority: 'desc' }, { category: 'asc' }],
      });

      const complianceRules = this.extractComplianceRules(practices);

      return {
        success: true,
        data: {
          agentType,
          practices: practices as BestPractice[],
          complianceRules,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'GET_STANDARDS_ERROR',
          message: 'Failed to get agent standards',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Validate code against agent standards
   */
  async validateCompliance(
    agentType: string,
    code: string,
    fileType: string = 'typescript'
  ): Promise<Result<ComplianceCheck[], MLError>> {
    try {
      const standardsResult = await this.getAgentStandards(agentType);
      if (!standardsResult.success) {
        return standardsResult;
      }

      const { complianceRules } = standardsResult.data;
      const checks: ComplianceCheck[] = [];

      // Check file length
      const lines = code.split('\n').length;
      if (
        complianceRules.maxFileLines &&
        lines > complianceRules.maxFileLines
      ) {
        checks.push({
          rule: 'max_file_lines',
          compliant: false,
          severity: 'warning',
          message: `File has ${lines} lines, maximum allowed is ${complianceRules.maxFileLines}`,
          suggestion: 'Consider splitting into multiple files or refactoring',
        });
      }

      // Check for inline styles (frontend specific)
      if (agentType === 'frontend_developer' && code.includes('style=')) {
        checks.push({
          rule: 'no_inline_styles',
          compliant: false,
          severity: 'error',
          message: 'Inline styles detected',
          suggestion: 'Use CSS classes or styled components instead',
        });
      }

      // Check for proper error handling
      if (
        fileType === 'typescript' &&
        code.includes('try {') &&
        !code.includes('Result<')
      ) {
        checks.push({
          rule: 'proper_error_handling',
          compliant: false,
          severity: 'warning',
          message: 'Consider using Result<T, E> pattern for error handling',
          suggestion: 'Return Result types instead of throwing exceptions',
        });
      }

      // Check for TypeScript any usage
      if (fileType === 'typescript' && code.includes(': any')) {
        checks.push({
          rule: 'avoid_any_type',
          compliant: false,
          severity: 'warning',
          message: 'Usage of "any" type detected',
          suggestion: 'Use specific types or interfaces instead of "any"',
        });
      }

      return { success: true, data: checks };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMPLIANCE_CHECK_ERROR',
          message: 'Failed to validate compliance',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Add custom best practice
   */
  async addBestPractice(
    practice: Omit<BestPractice, 'id'>
  ): Promise<Result<BestPractice, MLError>> {
    try {
      const created = await this.prisma.agentBestPractice.create({
        data: {
          agentType: practice.agentType,
          category: practice.category,
          title: practice.title,
          rule: practice.rule,
          description: practice.description,
          priority: practice.priority,
          examples: practice.examples as any,
          antipatterns: practice.antipatterns as any,
          tools: practice.tools as any,
          tags: practice.tags as any,
          active: practice.active,
          version: practice.version,
          createdBy: practice.createdBy,
        },
      });

      return { success: true, data: created };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ADD_PRACTICE_ERROR',
          message: 'Failed to add best practice',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Extract compliance rules from best practices
   */
  private extractComplianceRules(practices: any[]): Record<string, any> {
    const rules: Record<string, any> = {};

    practices.forEach(practice => {
      if (practice.rules) {
        Object.assign(rules, practice.rules);
      }
    });

    return rules;
  }

  /**
   * Get default best practices for all agent types
   */
  private getDefaultBestPractices(): any[] {
    return [
      ...this.getBusinessAnalystPractices(),
      ...this.getSystemArchitectPractices(),
      ...this.getBackendDeveloperPractices(),
      ...this.getFrontendDeveloperPractices(),
      ...this.getQAEngineerPractices(),
      ...this.getMicrosoftReviewerPractices(),
    ];
  }

  private getBusinessAnalystPractices(): any[] {
    return [
      {
        agentType: 'business_analyst',
        category: 'requirements',
        title: 'Clear Requirements Documentation',
        rule: 'requireAcceptanceCriteria',
        description:
          'All requirements must be clearly documented with acceptance criteria',
        priority: 'critical',
        examples: [
          'As a user, I want to login so that I can access my account',
          'Given valid credentials, when user logs in, then redirect to dashboard',
        ],
        active: true,
        version: '1.0',
      },
      {
        agentType: 'business_analyst',
        category: 'stakeholders',
        title: 'Stakeholder Communication',
        rule: 'minStakeholderUpdates',
        description: 'Regular communication with stakeholders is essential',
        priority: 'high',
        active: true,
        version: '1.0',
      },
    ];
  }

  private getSystemArchitectPractices(): any[] {
    return [
      {
        agentType: 'system_architect',
        category: 'architecture',
        title: 'SOLID Principles Compliance',
        description: 'All designs must follow SOLID principles',
        priority: 'critical',
        rules: { enforceSolid: true },
        antipatterns: [
          'God objects',
          'Tight coupling',
          'Circular dependencies',
        ],
        isActive: true,
        version: '1.0',
      },
      {
        agentType: 'system_architect',
        category: 'scalability',
        title: 'Scalability Planning',
        description: 'Consider horizontal and vertical scaling from the start',
        priority: 'high',
        rules: { requireScalabilityPlan: true },
        isActive: true,
        version: '1.0',
      },
    ];
  }

  private getBackendDeveloperPractices(): any[] {
    return [
      {
        agentType: 'backend_developer',
        category: 'coding',
        title: 'File Size Limit',
        description: 'Files should not exceed 500 lines for maintainability',
        priority: 'medium',
        rules: { maxFileLines: 500 },
        isActive: true,
        version: '1.0',
      },
      {
        agentType: 'backend_developer',
        category: 'security',
        title: 'Input Validation',
        description: 'All inputs must be validated and sanitized',
        priority: 'critical',
        rules: { requireInputValidation: true },
        examples: ['Zod schema validation', 'SQL injection prevention'],
        isActive: true,
        version: '1.0',
      },
      {
        agentType: 'backend_developer',
        category: 'error_handling',
        title: 'Result Pattern Usage',
        description: 'Use Result<T, E> pattern for error handling',
        priority: 'high',
        rules: { useResultPattern: true },
        examples: [
          'Return { success: true, data: result }',
          'Return { success: false, error: err }',
        ],
        isActive: true,
        version: '1.0',
      },
    ];
  }

  private getFrontendDeveloperPractices(): any[] {
    return [
      {
        agentType: 'frontend_developer',
        category: 'styling',
        title: 'No Inline Styles',
        description:
          'Never use inline styles, always use CSS classes or styled components',
        priority: 'high',
        rules: { noInlineStyles: true },
        antipatterns: ['<div style="color: red">'],
        examples: ['CSS modules', 'Styled components', 'CSS classes'],
        isActive: true,
        version: '1.0',
      },
      {
        agentType: 'frontend_developer',
        category: 'accessibility',
        title: 'WCAG 2.1 AA Compliance',
        description:
          'All components must meet WCAG 2.1 AA accessibility standards',
        priority: 'critical',
        rules: { wcagCompliance: 'AA' },
        examples: ['aria-labels', 'semantic HTML', 'keyboard navigation'],
        isActive: true,
        version: '1.0',
      },
    ];
  }

  private getQAEngineerPractices(): any[] {
    return [
      {
        agentType: 'qa_engineer',
        category: 'coverage',
        title: 'Test Coverage Requirements',
        description: 'Maintain minimum test coverage thresholds',
        priority: 'critical',
        rules: {
          minUnitCoverage: 90,
          minIntegrationCoverage: 80,
          minE2ECoverage: 70,
        },
        isActive: true,
        version: '1.0',
      },
    ];
  }

  private getMicrosoftReviewerPractices(): any[] {
    return [
      {
        agentType: 'microsoft_reviewer',
        category: 'standards',
        title: 'Microsoft Coding Standards',
        description: 'Follow Microsoft C# and .NET coding conventions',
        priority: 'critical',
        rules: { microsoftStandards: true },
        examples: ['PascalCase for methods', 'camelCase for variables'],
        isActive: true,
        version: '1.0',
      },
    ];
  }
}

export default BestPracticesService;
