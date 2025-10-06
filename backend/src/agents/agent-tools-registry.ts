/**
 * Agent Tools Registry - Defines tools available to each agent type
 * Maps agent capabilities to specific MCP tools
 */

import { CopilotTool } from '../mcp/mcp-server';
import { Result } from '../providers/ml-provider.interface';

export interface AgentToolConfig {
  agentType: string;
  availableTools: string[];
  toolPermissions: Record<string, string[]>; // tool -> permissions
  maxConcurrentTools: number;
  toolTimeout: number; // ms
}

/**
 * Tool registry for different agent types
 */
export class AgentToolsRegistry {
  private static toolConfigs: Map<string, AgentToolConfig> = new Map([
    // Workflow Assistant Agent
    [
      'workflow-assistant',
      {
        agentType: 'workflow-assistant',
        availableTools: [
          'read_workspace_file',
          'search_workspace_files',
          'analyze_code',
          'execute_workflow',
          'query_database',
        ],
        toolPermissions: {
          read_workspace_file: ['read'],
          search_workspace_files: ['read'],
          analyze_code: ['read'],
          execute_workflow: ['execute'],
          query_database: ['read'],
        },
        maxConcurrentTools: 3,
        toolTimeout: 30000,
      },
    ],

    // Business Analyst Agent
    [
      'business-analyst',
      {
        agentType: 'business-analyst',
        availableTools: [
          'read_workspace_file',
          'search_workspace_files',
          'analyze_code',
          'query_database',
          'generate_code',
        ],
        toolPermissions: {
          read_workspace_file: ['read'],
          search_workspace_files: ['read'],
          analyze_code: ['read'],
          query_database: ['read'],
          generate_code: ['write'],
        } as Record<string, string[]>,
        maxConcurrentTools: 2,
        toolTimeout: 45000,
      },
    ],

    // QA Engineer Agent
    [
      'qa-engineer',
      {
        agentType: 'qa-engineer',
        availableTools: [
          'read_workspace_file',
          'search_workspace_files',
          'analyze_code',
          'execute_terminal_command',
          'generate_code',
          'query_database',
        ],
        toolPermissions: {
          read_workspace_file: ['read'],
          search_workspace_files: ['read'],
          analyze_code: ['read'],
          execute_terminal_command: ['execute'],
          generate_code: ['write'],
          query_database: ['read'],
        },
        maxConcurrentTools: 4,
        toolTimeout: 60000,
      },
    ],

    // Microsoft Reviewer Agent
    [
      'microsoft-reviewer',
      {
        agentType: 'microsoft-reviewer',
        availableTools: [
          'read_workspace_file',
          'search_workspace_files',
          'analyze_code',
          'generate_code',
          'query_database',
        ],
        toolPermissions: {
          read_workspace_file: ['read'],
          search_workspace_files: ['read'],
          analyze_code: ['read'],
          generate_code: ['write'],
          query_database: ['read'],
        },
        maxConcurrentTools: 3,
        toolTimeout: 45000,
      },
    ],

    // DevOps Engineer Agent
    [
      'devops-engineer',
      {
        agentType: 'devops-engineer',
        availableTools: [
          'read_workspace_file',
          'search_workspace_files',
          'execute_terminal_command',
          'generate_code',
          'execute_workflow',
          'query_database',
        ],
        toolPermissions: {
          read_workspace_file: ['read'],
          search_workspace_files: ['read'],
          execute_terminal_command: ['execute'],
          generate_code: ['write'],
          execute_workflow: ['execute'],
          query_database: ['read'],
        },
        maxConcurrentTools: 5,
        toolTimeout: 90000,
      },
    ],

    // Senior Developer Agent
    [
      'senior-developer',
      {
        agentType: 'senior-developer',
        availableTools: [
          'read_workspace_file',
          'search_workspace_files',
          'analyze_code',
          'generate_code',
          'execute_terminal_command',
          'query_database',
          'execute_workflow',
        ],
        toolPermissions: {
          read_workspace_file: ['read'],
          search_workspace_files: ['read'],
          analyze_code: ['read'],
          generate_code: ['write'],
          execute_terminal_command: ['execute'],
          query_database: ['read'],
          execute_workflow: ['execute'],
        },
        maxConcurrentTools: 5,
        toolTimeout: 120000,
      },
    ],

    // UX Designer Agent
    [
      'ux-designer',
      {
        agentType: 'ux-designer',
        availableTools: [
          'read_workspace_file',
          'search_workspace_files',
          'analyze_code',
          'generate_code',
          'query_database',
        ],
        toolPermissions: {
          read_workspace_file: ['read'],
          search_workspace_files: ['read'],
          analyze_code: ['read'],
          generate_code: ['write'],
          query_database: ['read'],
        },
        maxConcurrentTools: 3,
        toolTimeout: 45000,
      },
    ],
  ]);

  /**
   * Get tool configuration for agent type
   */
  static getToolConfig(agentType: string): AgentToolConfig | undefined {
    return this.toolConfigs.get(agentType);
  }

  /**
   * Get all available tools for agent
   */
  static getToolsForAgent(agentType: string): string[] {
    const config = this.toolConfigs.get(agentType);
    return config?.availableTools || [];
  }

  /**
   * Check if agent can use specific tool
   */
  static canAgentUseTool(agentType: string, toolName: string): boolean {
    const config = this.toolConfigs.get(agentType);
    return config?.availableTools.includes(toolName) || false;
  }

  /**
   * Get permissions for agent tool
   */
  static getToolPermissions(agentType: string, toolName: string): string[] {
    const config = this.toolConfigs.get(agentType);
    return config?.toolPermissions[toolName] || [];
  }

  /**
   * Register new agent tool configuration
   */
  static registerAgentTools(config: AgentToolConfig): void {
    this.toolConfigs.set(config.agentType, config);
    console.log(`📋 Registered tools for agent: ${config.agentType}`);
  }

  /**
   * Get all registered agent types
   */
  static getRegisteredAgentTypes(): string[] {
    return Array.from(this.toolConfigs.keys());
  }

  /**
   * Validate tool usage request
   */
  static validateToolUsage(
    agentType: string,
    toolName: string,
    requiredPermission: string
  ): Result<boolean, { message: string }> {
    const config = this.toolConfigs.get(agentType);

    if (!config) {
      return {
        success: false,
        error: { message: `Unknown agent type: ${agentType}` },
      };
    }

    if (!config.availableTools.includes(toolName)) {
      return {
        success: false,
        error: {
          message: `Tool ${toolName} not available for agent ${agentType}`,
        },
      };
    }

    const toolPermissions = config.toolPermissions[toolName] || [];
    if (!toolPermissions.includes(requiredPermission)) {
      return {
        success: false,
        error: {
          message: `Insufficient permissions for ${toolName}: requires ${requiredPermission}`,
        },
      };
    }

    return { success: true, data: true };
  }
}

/**
 * Agent-specific tools that extend base MCP tools
 */

// Workflow Assistant specific tools
export const workflowAssistantTools: CopilotTool[] = [
  {
    name: 'suggest_next_step',
    description:
      'Suggest the next optimal step in the workflow based on current context',
    category: 'workspace',
    permissions: [{ type: 'read', resource: 'workflow' }],
    agentTypes: ['workflow-assistant'],
    inputSchema: {
      type: 'object',
      properties: {
        currentStep: { type: 'string', description: 'Current workflow step' },
        workflowContext: {
          type: 'object',
          description: 'Current workflow context',
        },
        blockers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Current blockers',
        },
      },
      required: ['currentStep'],
    },
    handler: async input => {
      // Mock implementation - would integrate with workflow engine
      const suggestion = {
        nextStep: `next_step_after_${input.currentStep}`,
        reason: `Based on current context and best practices`,
        estimatedTime: '15 minutes',
        dependencies: [],
        risks: ['low'],
      };

      return {
        success: true,
        data: suggestion,
        content: [
          {
            type: 'text',
            text: `**Next Step Recommendation:**\nStep: ${suggestion.nextStep}\nReason: ${suggestion.reason}\nEstimated Time: ${suggestion.estimatedTime}`,
          },
        ],
      };
    },
  },

  {
    name: 'analyze_workflow_progress',
    description:
      'Analyze current workflow progress and identify optimization opportunities',
    category: 'analysis',
    permissions: [{ type: 'read', resource: 'workflow' }],
    agentTypes: ['workflow-assistant'],
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'Workflow ID to analyze' },
        includeMetrics: { type: 'boolean', default: true },
        includeRecommendations: { type: 'boolean', default: true },
      },
      required: ['workflowId'],
    },
    handler: async input => {
      const analysis = {
        workflowId: input.workflowId,
        completionPercentage: 65,
        currentStep: 'code-review',
        averageStepTime: '18 minutes',
        bottlenecks: ['code-review', 'testing'],
        recommendations: [
          'Parallelize testing phase',
          'Add automated code quality checks',
          'Consider additional reviewer',
        ],
        metrics: {
          totalTime: '2.5 hours',
          remainingTime: '1 hour estimated',
          efficiency: 'good',
        },
      };

      return {
        success: true,
        data: analysis,
        content: [
          {
            type: 'text',
            text: `**Workflow Analysis:**\nProgress: ${
              analysis.completionPercentage
            }%\nCurrent Step: ${
              analysis.currentStep
            }\nBottlenecks: ${analysis.bottlenecks.join(
              ', '
            )}\nRecommendations:\n${analysis.recommendations
              .map(r => `- ${r}`)
              .join('\n')}`,
          },
        ],
      };
    },
  },
];

// Business Analyst specific tools
export const businessAnalystTools: CopilotTool[] = [
  {
    name: 'analyze_requirements',
    description:
      'Analyze business requirements and identify gaps or inconsistencies',
    category: 'analysis',
    permissions: [{ type: 'read', resource: 'documents' }],
    agentTypes: ['business-analyst'],
    inputSchema: {
      type: 'object',
      properties: {
        requirements: { type: 'array', items: { type: 'string' } },
        stakeholders: { type: 'array', items: { type: 'string' } },
        businessContext: {
          type: 'object',
          description: 'Business context information',
        },
      },
      required: ['requirements'],
    },
    handler: async input => {
      const analysis = {
        requirementsCount: input.requirements.length,
        gaps: [
          'Missing user acceptance criteria',
          'Unclear performance requirements',
        ],
        inconsistencies: ['Conflicting priority levels'],
        recommendations: [
          'Add detailed acceptance criteria',
          'Clarify performance benchmarks',
        ],
        completeness: 78,
        priority: 'high',
      };

      return {
        success: true,
        data: analysis,
        content: [
          {
            type: 'text',
            text: `**Requirements Analysis:**\nCompleteness: ${
              analysis.completeness
            }%\nGaps Found: ${
              analysis.gaps.length
            }\nRecommendations:\n${analysis.recommendations
              .map(r => `- ${r}`)
              .join('\n')}`,
          },
        ],
      };
    },
  },
];

// QA Engineer specific tools
export const qaEngineerTools: CopilotTool[] = [
  {
    name: 'run_test_suite',
    description: 'Execute test suite and analyze results',
    category: 'system',
    permissions: [{ type: 'execute', resource: 'tests' }],
    agentTypes: ['qa-engineer'],
    inputSchema: {
      type: 'object',
      properties: {
        testType: {
          type: 'string',
          enum: ['unit', 'integration', 'e2e', 'all'],
        },
        testPath: {
          type: 'string',
          description: 'Path to specific test or test directory',
        },
        coverage: {
          type: 'boolean',
          default: true,
          description: 'Generate coverage report',
        },
      },
    },
    handler: async input => {
      // Mock test results
      const testResults = {
        testType: input.testType,
        totalTests: 156,
        passed: 142,
        failed: 14,
        skipped: 0,
        coverage: input.coverage
          ? {
              lines: 87.5,
              branches: 82.3,
              functions: 91.2,
              statements: 86.8,
            }
          : undefined,
        failedTests: [
          'auth.test.ts: User login with invalid credentials',
          'workflow.test.ts: Workflow execution timeout',
        ],
        duration: '2m 34s',
      };

      return {
        success: true,
        data: testResults,
        content: [
          {
            type: 'text',
            text: `**Test Results:**\nPassed: ${testResults.passed}/${
              testResults.totalTests
            }\nFailed: ${testResults.failed}\nCoverage: ${
              testResults.coverage?.lines || 'N/A'
            }%\nDuration: ${testResults.duration}`,
          },
        ],
      };
    },
  },
];

export default AgentToolsRegistry;
