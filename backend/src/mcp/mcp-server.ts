/**
 * Model Context Protocol (MCP) Server Implementation
 * Enterprise-grade MCP server for Copilot agent tools integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  CallToolResult,
  ListToolsRequestSchema,
  Tool,
  TextContent,
  ImageContent,
  EmbeddedResource,
} from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';

/**
 * Copilot Tool Definition
 */
export interface CopilotTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (input: any, context?: ToolExecutionContext) => Promise<ToolResult>;
  category: 'workspace' | 'analysis' | 'generation' | 'integration' | 'system';
  agentTypes?: string[]; // Which agent types can use this tool
  permissions: ToolPermission[];
}

export interface ToolExecutionContext {
  agentId?: string;
  projectId?: string;
  workspaceId?: string;
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
  content?: (TextContent | ImageContent | EmbeddedResource)[];
}

export interface ToolPermission {
  type: 'read' | 'write' | 'execute' | 'admin';
  resource: string; // file, database, api, system
  scope?: string[]; // specific scopes within resource
}

/**
 * MCP Server for Copilot Tool Integration
 */
export class MCPServer {
  private server: Server;
  private prisma: PrismaClient;
  private tools: Map<string, CopilotTool> = new Map();
  private transport: StdioServerTransport;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.server = new Server(
      {
        name: 'thinkcode-ai-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.transport = new StdioServerTransport();
    this.setupToolHandlers();
    this.registerBuiltinTools();
  }

  /**
   * Setup MCP tool request handlers
   */
  private setupToolHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools: Tool[] = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      }));

      return { tools };
    });

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      return this.handleToolExecution(request);
    });
  }

  /**
   * Create execution context from args - extracted to reduce complexity
   */
  private createExecutionContext(args: any): ToolExecutionContext {
    return {
      sessionId: args ? String(args._sessionId || '') : undefined,
      agentId: args ? String(args._agentId || '') : undefined,
      projectId: args ? String(args._projectId || '') : undefined,
      workspaceId: args ? String(args._workspaceId || '') : undefined,
      metadata: args ? (args._metadata as Record<string, any>) : undefined,
    };
  }

  /**
   * Format successful tool result - extracted to reduce complexity
   */
  private formatSuccessResult(result: any): CallToolResult {
    return {
      content: result.content || [
        {
          type: 'text',
          text: JSON.stringify(result.data, null, 2),
        },
      ],
      isError: false,
    } as CallToolResult;
  }

  /**
   * Format error result - extracted to reduce complexity
   */
  private formatErrorResult(error: any): CallToolResult {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Tool execution failed: ${errorMessage}`,
        },
      ],
      isError: true,
    } as CallToolResult;
  }

  /**
   * Handle tool execution request - extracted to reduce complexity
   */
  private async handleToolExecution(request: any): Promise<CallToolResult> {
    const { name, arguments: args } = request.params;

    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    try {
      // Validate input schema
      this.validateToolInput(args, tool.inputSchema);

      // Execute tool with context
      const context = this.createExecutionContext(args);
      const result = await tool.handler(args, context);

      if (!result.success) {
        throw new Error(result.error || 'Tool execution failed');
      }

      return this.formatSuccessResult(result);
    } catch (error) {
      return this.formatErrorResult(error);
    }
  }

  /**
   * Register built-in Copilot tools
   */
  private registerBuiltinTools(): void {
    this.registerWorkspaceTools();
    this.registerAnalysisTools();
    this.registerGenerationTools();
    this.registerSystemTools();
    this.registerIntegrationTools();
    console.log(`✅ Registered ${this.tools.size} built-in Copilot tools`);
  }

  /**
   * Register workspace-related tools
   */
  private registerWorkspaceTools(): void {
    this.registerTool({
      name: 'read_workspace_file',
      description: 'Read a file from the current workspace',
      category: 'workspace',
      permissions: [{ type: 'read', resource: 'file' }],
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Path to the file relative to workspace root',
          },
          encoding: {
            type: 'string',
            enum: ['utf8', 'base64'],
            default: 'utf8',
          },
          startLine: {
            type: 'number',
            description: 'Start reading from this line (1-based)',
          },
          endLine: {
            type: 'number',
            description: 'End reading at this line (1-based)',
          },
        },
        required: ['filePath'],
      },
      handler: async input => {
        return await this.handleReadWorkspaceFile(input);
      },
    });

    this.registerTool({
      name: 'search_workspace_files',
      description: 'Search for files in the workspace by pattern or content',
      category: 'workspace',
      permissions: [{ type: 'read', resource: 'file' }],
      inputSchema: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'Glob pattern to match files',
          },
          content: {
            type: 'string',
            description: 'Search for this content in files',
          },
          fileType: {
            type: 'string',
            description: 'Filter by file extension (e.g., .ts, .js)',
          },
          maxResults: { type: 'number', default: 50 },
        },
      },
      handler: async input => {
        return await this.handleSearchWorkspaceFiles(input);
      },
    });
  }

  /**
   * Register analysis tools
   */
  private registerAnalysisTools(): void {
    this.registerTool({
      name: 'analyze_code',
      description: 'Analyze code for quality, patterns, and potential issues',
      category: 'analysis',
      permissions: [{ type: 'read', resource: 'file' }],
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Path to code file to analyze',
          },
          code: {
            type: 'string',
            description: 'Code content to analyze (alternative to filePath)',
          },
          language: { type: 'string', description: 'Programming language' },
          analysisType: {
            type: 'string',
            enum: [
              'quality',
              'security',
              'performance',
              'maintainability',
              'all',
            ],
            default: 'all',
          },
        },
      },
      handler: async (input, context) => {
        return await this.handleAnalyzeCode(input, context);
      },
    });
  }

  /**
   * Register generation tools
   */
  private registerGenerationTools(): void {
    this.registerTool({
      name: 'generate_code',
      description: 'Generate code based on specifications and context',
      category: 'generation',
      permissions: [{ type: 'write', resource: 'file' }],
      inputSchema: {
        type: 'object',
        properties: {
          specification: {
            type: 'string',
            description: 'Detailed specification of what to generate',
          },
          language: {
            type: 'string',
            description: 'Target programming language',
          },
          framework: {
            type: 'string',
            description: 'Framework or library context',
          },
          outputPath: {
            type: 'string',
            description: 'Where to save the generated code',
          },
          includeTests: { type: 'boolean', default: false },
          includeDocumentation: { type: 'boolean', default: true },
        },
        required: ['specification', 'language'],
      },
      handler: async input => {
        return await this.handleGenerateCode(input);
      },
    });
  }

  /**
   * Register system tools
   */
  private registerSystemTools(): void {
    this.registerTool({
      name: 'execute_terminal_command',
      description: 'Execute a terminal command in the workspace context',
      category: 'system',
      permissions: [{ type: 'execute', resource: 'system' }],
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Command to execute' },
          workingDirectory: {
            type: 'string',
            description: 'Working directory (relative to workspace)',
          },
          timeout: {
            type: 'number',
            default: 30000,
            description: 'Timeout in milliseconds',
          },
          captureOutput: { type: 'boolean', default: true },
        },
        required: ['command'],
      },
      handler: async input => {
        return await this.handleExecuteTerminalCommand(input);
      },
    });
  }

  /**
   * Register integration tools
   */
  private registerIntegrationTools(): void {
    this.registerTool({
      name: 'query_database',
      description: 'Execute database queries for project data',
      category: 'integration',
      permissions: [{ type: 'read', resource: 'database' }],
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'SQL query to execute' },
          params: { type: 'array', description: 'Query parameters' },
          maxRows: { type: 'number', default: 100 },
        },
        required: ['query'],
      },
      handler: async input => {
        return await this.handleQueryDatabase(input);
      },
    });

    this.registerTool({
      name: 'execute_workflow',
      description: 'Execute a predefined workflow or create a new one',
      category: 'integration',
      permissions: [{ type: 'execute', resource: 'workflow' }],
      inputSchema: {
        type: 'object',
        properties: {
          workflowId: {
            type: 'string',
            description: 'ID of existing workflow to execute',
          },
          workflowDefinition: {
            type: 'object',
            description: 'New workflow definition',
          },
          inputs: { type: 'object', description: 'Workflow input parameters' },
          async: {
            type: 'boolean',
            default: false,
            description: 'Execute asynchronously',
          },
        },
      },
      handler: async (input, context) => {
        return await this.handleExecuteWorkflow(input, context);
      },
    });
  }

  /**
   * Register a new tool
   */
  registerTool(tool: CopilotTool): void {
    this.tools.set(tool.name, tool);
    console.log(`📋 Registered tool: ${tool.name} [${tool.category}]`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): boolean {
    const removed = this.tools.delete(name);
    if (removed) {
      console.log(`🗑️ Unregistered tool: ${name}`);
    }
    return removed;
  }

  /**
   * Get all registered tools
   */
  getRegisteredTools(): CopilotTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools for specific agent type
   */
  getToolsForAgent(agentType: string): CopilotTool[] {
    return Array.from(this.tools.values()).filter(
      tool => !tool.agentTypes || tool.agentTypes.includes(agentType)
    );
  }

  /**
   * Start MCP server
   */
  async start(): Promise<void> {
    await this.server.connect(this.transport);
    console.log('🚀 MCP Server started successfully');
  }

  /**
   * Stop MCP server
   */
  async stop(): Promise<void> {
    await this.transport.close();
    console.log('🛑 MCP Server stopped');
  }

  // === Tool Handlers ===

  private async handleReadWorkspaceFile(input: any): Promise<ToolResult> {
    try {
      const fs = require('fs/promises');
      const path = require('path');

      const workspaceRoot = process.cwd();
      const fullPath = path.resolve(workspaceRoot, input.filePath);

      // Security check: ensure file is within workspace
      if (!fullPath.startsWith(workspaceRoot)) {
        throw new Error('Access denied: File is outside workspace');
      }

      const rawContent = await fs.readFile(fullPath, input.encoding || 'utf8');
      let content = rawContent.toString();

      // Handle line range if specified
      if (input.startLine || input.endLine) {
        const lines = content.split('\n');
        const start = (input.startLine || 1) - 1;
        const end = input.endLine || lines.length;
        content = lines.slice(start, end).join('\n');
      }

      return {
        success: true,
        data: {
          content,
          filePath: input.filePath,
          encoding: input.encoding || 'utf8',
        },
        content: [
          {
            type: 'text',
            text: `File: ${input.filePath}\n\`\`\`\n${content}\n\`\`\``,
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  }

  private async handleSearchWorkspaceFiles(input: any): Promise<ToolResult> {
    try {
      const { glob } = require('glob');
      const fs = require('fs/promises');

      const workspaceRoot = process.cwd();
      const results: any[] = [];

      if (input.pattern) {
        const files = await glob(input.pattern, { cwd: workspaceRoot });
        results.push(
          ...files.map((file: string) => ({ type: 'file', path: file }))
        );
      }

      if (input.content) {
        // Simple content search implementation
        const searchFiles = await glob('**/*', {
          cwd: workspaceRoot,
          ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
        });

        for (const file of searchFiles.slice(0, input.maxResults || 50)) {
          try {
            const content = await fs.readFile(
              `${workspaceRoot}/${file}`,
              'utf8'
            );
            if (content.includes(input.content)) {
              results.push({
                type: 'content_match',
                path: file,
                matches: [input.content],
              });
            }
          } catch {
            // Skip files that can't be read as text
          }
        }
      }

      return {
        success: true,
        data: { results: results.slice(0, input.maxResults || 50) },
        content: [
          {
            type: 'text',
            text: `Found ${results.length} results:\n${results
              .map(r => `- ${r.path}`)
              .join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  }

  private async handleAnalyzeCode(
    input: any,
    context?: ToolExecutionContext
  ): Promise<ToolResult> {
    // Mock implementation - in real version would use static analysis tools
    console.log(
      `🔍 Analyzing code for agent: ${context?.agentId || 'unknown'}`
    );

    const analysis = {
      quality: {
        score: 8.5,
        issues: [
          'Consider adding more comments',
          'Some functions are too long',
        ],
      },
      security: { score: 9.0, issues: ['No security issues found'] },
      performance: {
        score: 7.5,
        issues: ['Consider caching for repeated calculations'],
      },
      maintainability: {
        score: 8.0,
        issues: ['Consider breaking down large functions'],
      },
    };

    return {
      success: true,
      data: { analysis, language: input.language, context: context?.projectId },
      content: [
        {
          type: 'text',
          text: `Code Analysis Results:\n${JSON.stringify(analysis, null, 2)}`,
        },
      ],
    };
  }

  private async handleGenerateCode(
    input: any
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ): Promise<ToolResult> {
    // Mock implementation - in real version would use ML providers
    const generatedCode = `// Generated code for: ${input.specification}
// Language: ${input.language}
// Framework: ${input.framework || 'none'}

function generatedFunction() {
  // Implementation based on specification
  return "Generated code placeholder";
}

export default generatedFunction;
`;

    return {
      success: true,
      data: {
        code: generatedCode,
        language: input.language,
        outputPath: input.outputPath,
      },
      content: [
        {
          type: 'text',
          text: `Generated ${input.language} code:\n\`\`\`${input.language}\n${generatedCode}\n\`\`\``,
        },
      ],
    };
  }

  private async handleExecuteTerminalCommand(
    input: any
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ): Promise<ToolResult> {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const result = await execAsync(input.command, {
        cwd: input.workingDirectory || process.cwd(),
        timeout: input.timeout || 30000,
      });

      return {
        success: true,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          command: input.command,
        },
        content: [
          {
            type: 'text',
            text: `Command: ${input.command}\nOutput:\n${result.stdout}${
              result.stderr ? '\nErrors:\n' + result.stderr : ''
            }`,
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Command execution failed',
      };
    }
  }

  private async handleQueryDatabase(
    input: any
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ): Promise<ToolResult> {
    try {
      const result = await this.prisma.$queryRawUnsafe(
        input.query,
        ...(input.params || [])
      );

      return {
        success: true,
        data: { result, query: input.query },
        content: [
          {
            type: 'text',
            text: `Query Results:\n${JSON.stringify(result, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database query failed',
      };
    }
  }

  private async handleExecuteWorkflow(
    input: any,
    context?: ToolExecutionContext
  ): Promise<ToolResult> {
    // Mock implementation - would integrate with WorkflowEngineService
    console.log(
      `🔄 Executing workflow: ${input.workflowId || 'new'} for agent: ${
        context?.agentId || 'system'
      }`
    );

    const workflowResult = {
      executionId: `exec_${Date.now()}`,
      workflowId: input.workflowId,
      status: 'completed',
      context: context?.projectId,
      steps: [
        { name: 'Analysis', status: 'completed', duration: '2.5s' },
        { name: 'Processing', status: 'completed', duration: '5.1s' },
        { name: 'Output', status: 'completed', duration: '1.2s' },
      ],
      totalDuration: '8.8s',
    };

    return {
      success: true,
      data: workflowResult,
      content: [
        {
          type: 'text',
          text: `Workflow Execution Results:\n${JSON.stringify(
            workflowResult,
            null,
            2
          )}`,
        },
      ],
    };
  }

  /**
   * Validate tool input against schema
   */
  private validateToolInput(input: any, schema: any): void {
    // Basic validation - in production would use proper JSON schema validator
    if (schema.required) {
      for (const requiredField of schema.required) {
        if (!(requiredField in input)) {
          throw new Error(`Missing required field: ${requiredField}`);
        }
      }
    }
  }
}

export default MCPServer;
