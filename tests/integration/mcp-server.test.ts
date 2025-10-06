import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { PrismaClient } from '@prisma/client';
import { spawn, ChildProcess } from 'child_process';

// Import MCP Server from backend
import MCPServer from '../../backend/src/mcp/mcp-server';

describe('MCP Server Integration', () => {
  let mcpServer: MCPServer;
  let client: Client;
  let serverProcess: ChildProcess;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    mcpServer = new MCPServer(prisma);
    await mcpServer.start();

    // Start MCP server as child process
    serverProcess = spawn(
      'node',
      [
        '-e',
        `
      const { MCPServer } = require('./backend/dist/mcp/mcp-server.js');
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const server = new MCPServer(prisma);
      server.start();
    `,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] }
    );

    // Create client connection
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['-e', 'require("./backend/dist/mcp/mcp-server.js")'],
    });

    client = new Client(
      {
        name: 'test-client',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (client) {
      await client.close();
    }
    if (serverProcess) {
      serverProcess.kill();
    }
    if (mcpServer) {
      await mcpServer.stop();
    }
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('should list available tools', async () => {
    // Test direct server access
    const tools = mcpServer.getRegisteredTools();

    expect(tools).toBeDefined();
    expect(tools.length).toBeGreaterThan(0);

    // Check for essential tools
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('read_workspace_file');
    expect(toolNames).toContain('search_workspace_files');
    expect(toolNames).toContain('analyze_code');
    expect(toolNames).toContain('execute_terminal_command');
    expect(toolNames).toContain('generate_code');
    expect(toolNames).toContain('query_database');
    expect(toolNames).toContain('execute_workflow');

    console.log(`✅ Found ${tools.length} registered tools`);
  });

  it('should execute read_workspace_file tool successfully', async () => {
    const tools = mcpServer.getRegisteredTools();
    const readFileTool = tools.find(t => t.name === 'read_workspace_file');

    expect(readFileTool).toBeDefined();

    if (readFileTool) {
      // Test reading package.json
      const result = await readFileTool.handler({
        filePath: 'package.json',
        encoding: 'utf8',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.content).toContain('"name"');

      console.log('✅ Successfully read package.json');
    }
  });

  it('should execute search_workspace_files tool successfully', async () => {
    const tools = mcpServer.getRegisteredTools();
    const searchTool = tools.find(t => t.name === 'search_workspace_files');

    expect(searchTool).toBeDefined();

    if (searchTool) {
      const result = await searchTool.handler({
        pattern: '*.ts',
        maxResults: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.results).toBeDefined();
      expect(Array.isArray(result.data.results)).toBe(true);

      console.log(`✅ Found ${result.data.results.length} TypeScript files`);
    }
  });

  it('should execute analyze_code tool successfully', async () => {
    const tools = mcpServer.getRegisteredTools();
    const analyzeTool = tools.find(t => t.name === 'analyze_code');

    expect(analyzeTool).toBeDefined();

    if (analyzeTool) {
      const result = await analyzeTool.handler({
        code: `
          function testFunction(param: string): string {
            return param.toUpperCase();
          }
        `,
        language: 'typescript',
        analysisType: 'all',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.analysis).toBeDefined();

      console.log('✅ Successfully analyzed TypeScript code');
    }
  });

  it('should validate tool permissions correctly', async () => {
    const tools = mcpServer.getRegisteredTools();

    tools.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.category).toBeDefined();
      expect(tool.permissions).toBeDefined();
      expect(Array.isArray(tool.permissions)).toBe(true);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.handler).toBeDefined();
      expect(typeof tool.handler).toBe('function');
    });

    console.log('✅ All tools have valid structure and permissions');
  });

  it('should handle tool execution errors gracefully', async () => {
    const tools = mcpServer.getRegisteredTools();
    const readFileTool = tools.find(t => t.name === 'read_workspace_file');

    expect(readFileTool).toBeDefined();

    if (readFileTool) {
      // Test reading non-existent file
      const result = await readFileTool.handler({
        filePath: 'non-existent-file.txt',
        encoding: 'utf8',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      console.log('✅ Properly handled file not found error');
    }
  });

  it('should register agent-specific tools', async () => {
    const workflowTools = mcpServer.getToolsForAgent('workflow-assistant');
    const qaTools = mcpServer.getToolsForAgent('qa-engineer');

    expect(workflowTools.length).toBeGreaterThan(0);
    expect(qaTools.length).toBeGreaterThan(0);

    // Workflow assistant should have access to workflow tools
    const workflowToolNames = workflowTools.map(t => t.name);
    expect(workflowToolNames).toContain('read_workspace_file');
    expect(workflowToolNames).toContain('execute_workflow');

    // QA engineer should have access to testing tools
    const qaToolNames = qaTools.map(t => t.name);
    expect(qaToolNames).toContain('execute_terminal_command');
    expect(qaToolNames).toContain('analyze_code');

    console.log(
      `✅ Workflow Agent: ${workflowTools.length} tools, QA Agent: ${qaTools.length} tools`
    );
  });
});
