/**
 * Function Calling Integration for GitHub Copilot Provider
 * Extends GitHubCopilotProvider with tool execution capabilities
 */

import GitHubCopilotProvider from './github-copilot.provider';
import MCPServer, {
  CopilotTool,
  ToolExecutionContext,
} from '../mcp/mcp-server';
import {
  GenerationOptions,
  GenerationResult,
  Result,
  MLError,
} from './ml-provider.interface';
import { PrismaClient } from '@prisma/client';

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface FunctionCallResult {
  name: string;
  result: any;
  success: boolean;
  error?: string;
}

export interface CopilotFunctionCallingOptions extends GenerationOptions {
  tools?: CopilotTool[];
  toolChoice?: 'auto' | 'none' | string;
  maxToolCalls?: number;
  enableFunctionCalling?: boolean;
  contextId?: string;
  agentId?: string;
  projectId?: string;
  workspaceId?: string;
}

/**
 * Enhanced GitHub Copilot Provider with Function Calling
 */
export class CopilotFunctionCallingProvider extends GitHubCopilotProvider {
  private mcpServer: MCPServer;
  private functionCallHistory: Map<string, FunctionCallResult[]> = new Map();

  constructor(
    prisma: PrismaClient,
    apiKey: string = process.env.GITHUB_COPILOT_API_KEY || '',
    endpoint: string = process.env.GITHUB_COPILOT_ENDPOINT ||
      'https://api.github.com/copilot/v1/chat/completions'
  ) {
    super({ apiKey, endpoint });
    this.mcpServer = new MCPServer(prisma);
    this.initializeMCPServer();
  }

  /**
   * Initialize MCP Server for tool execution
   */
  private async initializeMCPServer(): Promise<void> {
    try {
      await this.mcpServer.start();
      console.log('✅ MCP Server initialized for function calling');
    } catch (error) {
      console.error('❌ Failed to initialize MCP Server:', error);
    }
  }

  /**
   * Generate text with function calling support
   */
  async generateTextWithTools(
    prompt: string,
    options: CopilotFunctionCallingOptions = {}
  ): Promise<
    Result<GenerationResult & { functionCalls?: FunctionCallResult[] }, MLError>
  > {
    const contextId = options.contextId || `fc_${Date.now()}`;

    // If function calling is disabled, use regular generation
    if (!options.enableFunctionCalling) {
      return await this.generateText(prompt, options);
    }

    try {
      // Generate initial response
      const response = await this.processInitialGeneration(
        prompt,
        options,
        contextId
      );

      if (!response.success) {
        return response;
      }

      // Parse function calls from response
      const functionCalls = this.parseFunctionCalls(response.data.text);

      if (functionCalls.length === 0) {
        return response;
      }

      // Execute function calls
      const functionResults = await this.executeFunctionCalls(functionCalls, {
        sessionId: contextId,
        agentId: options.agentId,
        projectId: options.projectId,
        workspaceId: options.workspaceId,
      });

      // Store function call history
      this.functionCallHistory.set(contextId, functionResults);

      // Generate final response with function results
      return await this.executeAndGenerateFinal(
        prompt,
        options,
        contextId,
        functionResults
      );
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FUNCTION_CALLING_ERROR',
          message:
            error instanceof Error ? error.message : 'Function calling failed',
          retryable: false,
        },
      };
    }
  }

  /**
   * Register additional tools for this provider
   */
  registerTool(tool: CopilotTool): void {
    this.mcpServer.registerTool(tool);
  }

  /**
   * Get available tools for agent
   */
  getToolsForAgent(agentType: string): CopilotTool[] {
    return this.mcpServer.getToolsForAgent(agentType);
  }

  /**
   * Get function call history for session
   */
  getFunctionCallHistory(sessionId: string): FunctionCallResult[] {
    return this.functionCallHistory.get(sessionId) || [];
  }

  /**
   * Clear function call history
   */
  clearFunctionCallHistory(sessionId?: string): void {
    if (sessionId) {
      this.functionCallHistory.delete(sessionId);
    } else {
      this.functionCallHistory.clear();
    }
  }

  /**
   * Build system prompt for function calling
   */
  private buildFunctionCallingSystemPrompt(tools: CopilotTool[]): string {
    const toolDescriptions = tools
      .map(
        tool => `
**${tool.name}** - ${tool.description}
Category: ${tool.category}
Input Schema: ${JSON.stringify(tool.inputSchema, null, 2)}
Permissions: ${tool.permissions.map(p => `${p.type}:${p.resource}`).join(', ')}
`
      )
      .join('\n');

    return `You are GitHub Copilot with access to powerful tools for workspace operations, code analysis, and task execution.

**AVAILABLE TOOLS:**
${toolDescriptions}

**FUNCTION CALLING INSTRUCTIONS:**
1. When you need to use a tool, format your response as:
   \`\`\`function_call
   {
     "name": "tool_name",
     "arguments": {
       "param1": "value1",
       "param2": "value2"
     }
   }
   \`\`\`

2. You can make multiple function calls in sequence
3. Always explain what you're doing before calling functions
4. Use the most appropriate tool for each task
5. Validate input parameters before making calls

**CAPABILITIES:**
- Read and analyze workspace files
- Search through codebases
- Execute terminal commands
- Generate code and documentation  
- Query project databases
- Execute complex workflows
- Provide contextual analysis and recommendations

Remember: You have full access to the workspace and can perform complex operations to help the user accomplish their goals.`;
  }

  /**
   * Parse function calls from AI response
   */
  private parseFunctionCalls(response: string): FunctionCall[] {
    const functionCalls: FunctionCall[] = [];

    // Look for function_call code blocks
    const functionCallPattern = /```function_call\s*\n([\s\S]*?)\n```/g;
    let match;

    while ((match = functionCallPattern.exec(response)) !== null) {
      try {
        const functionCallData = JSON.parse(match[1]);
        if (functionCallData.name && functionCallData.arguments) {
          functionCalls.push({
            name: functionCallData.name,
            arguments: functionCallData.arguments,
          });
        }
      } catch (error) {
        console.warn('Failed to parse function call:', error);
      }
    }

    // Also look for direct JSON function calls
    const jsonPattern = /"function":\s*"([^"]+)"/g;
    while ((match = jsonPattern.exec(response)) !== null) {
      try {
        // Try to extract the full JSON object around this function
        const startIndex = response.lastIndexOf('{', match.index);
        const endIndex = response.indexOf('}', match.index) + 1;

        if (startIndex !== -1 && endIndex > startIndex) {
          const jsonStr = response.substring(startIndex, endIndex);
          const functionData = JSON.parse(jsonStr);

          if (functionData.function && functionData.arguments) {
            functionCalls.push({
              name: functionData.function,
              arguments: functionData.arguments,
            });
          }
        }
      } catch {
        // Ignore parsing errors for alternate patterns
      }
    }

    return functionCalls;
  }

  /**
   * Execute function calls using MCP server
   */
  private async executeFunctionCalls(
    functionCalls: FunctionCall[],
    context: ToolExecutionContext
  ): Promise<FunctionCallResult[]> {
    const results: FunctionCallResult[] = [];

    for (const call of functionCalls) {
      try {
        // Get the tool
        const tools = this.mcpServer.getRegisteredTools();
        const tool = tools.find(t => t.name === call.name);

        if (!tool) {
          results.push({
            name: call.name,
            result: null,
            success: false,
            error: `Unknown tool: ${call.name}`,
          });
          continue;
        }

        // Add context to arguments
        const argsWithContext = {
          ...call.arguments,
          _sessionId: context.sessionId,
          _agentId: context.agentId,
          _projectId: context.projectId,
          _workspaceId: context.workspaceId,
          _metadata: context.metadata,
        };

        // Execute the tool
        const toolResult = await tool.handler(argsWithContext, context);

        results.push({
          name: call.name,
          result: toolResult.data,
          success: toolResult.success,
          error: toolResult.error,
        });

        // Log tool execution
        console.log(
          `🔧 Executed tool: ${call.name} - ${toolResult.success ? '✅' : '❌'}`
        );
      } catch (error) {
        results.push({
          name: call.name,
          result: null,
          success: false,
          error:
            error instanceof Error ? error.message : 'Tool execution failed',
        });
      }
    }

    return results;
  }

  /**
   * Build final response prompt with function results
   */
  private buildFinalResponsePrompt(
    originalPrompt: string,
    functionResults: FunctionCallResult[]
  ): string {
    const resultsText = functionResults
      .map(
        result => `
**Tool: ${result.name}**
Status: ${result.success ? '✅ Success' : '❌ Failed'}
${
  result.success
    ? `Result: ${JSON.stringify(result.result, null, 2)}`
    : `Error: ${result.error}`
}
`
      )
      .join('\n');

    return `Based on the user's request: "${originalPrompt}"

I executed the following tools:
${resultsText}

Now provide a comprehensive response that incorporates these results and directly answers the user's question. Be specific and actionable in your response.`;
  }

  /**
   * Process initial generation with function calling logic - extracted for readability
   */
  private async processInitialGeneration(
    prompt: string,
    options: CopilotFunctionCallingOptions,
    contextId: string
  ): Promise<Result<GenerationResult, MLError>> {
    // Build system prompt with available tools
    const availableTools = options.tools || this.mcpServer.getRegisteredTools();
    const systemPrompt = this.buildFunctionCallingSystemPrompt(availableTools);

    // Enhanced prompt with tool descriptions
    const enhancedPrompt = `${systemPrompt}\n\nUser Query: ${prompt}`;

    // Generate initial response
    return await this.generateText(enhancedPrompt, {
      ...options,
      contextId,
    });
  }

  /**
   * Execute function calls and generate final response - extracted for readability
   */
  private async executeAndGenerateFinal(
    prompt: string,
    options: CopilotFunctionCallingOptions,
    contextId: string,
    functionResults: FunctionCallResult[]
  ): Promise<
    Result<GenerationResult & { functionCalls?: FunctionCallResult[] }, MLError>
  > {
    // Generate final response with function results
    const finalPrompt = this.buildFinalResponsePrompt(prompt, functionResults);
    const finalResponse = await this.generateText(finalPrompt, {
      ...options,
      contextId,
    });

    if (!finalResponse.success) {
      return finalResponse;
    }

    return {
      success: true,
      data: {
        ...finalResponse.data,
        functionCalls: functionResults,
      },
    };
  }

  /**
   * Shutdown MCP server
   */
  async shutdown(): Promise<void> {
    await this.mcpServer.stop();
    this.functionCallHistory.clear();
  }
}

export default CopilotFunctionCallingProvider;
