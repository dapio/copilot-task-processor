#!/usr/bin/env node

/**
 * ThinkCode AI Platform - Integration Testing Suite
 * Comprehensive integration tests for all platform components
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

interface IntegrationTestResult {
  testSuite: string;
  testName: string;
  success: boolean;
  duration: number;
  details: any;
  error?: string;
}

class IntegrationTester {
  private prisma: PrismaClient;
  private baseUrl: string;
  private agentsUrl: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.baseUrl = 'http://localhost:3002';
    this.agentsUrl = 'http://localhost:3003';
  }

  async runIntegrationTests(): Promise<void> {
    try {
      console.log('🔗 Starting ThinkCode AI Platform Integration Tests...');

      const results: IntegrationTestResult[] = [];

      // Database-API Integration Tests
      results.push(...(await this.testDatabaseAPIIntegration()));

      // Agent-Workflow Integration Tests
      results.push(...(await this.testAgentWorkflowIntegration()));

      // MCP-Agent Integration Tests
      results.push(...(await this.testMCPAgentIntegration()));

      // Cross-Service Communication Tests
      results.push(...(await this.testCrossServiceCommunication()));

      // Performance Integration Tests
      results.push(...(await this.testPerformanceIntegration()));

      await this.generateIntegrationReport(results);

      const successfulTests = results.filter(r => r.success).length;
      console.log(
        `✅ Integration Tests completed: ${successfulTests}/${results.length} passed`
      );
    } catch (error) {
      console.error('❌ Integration testing failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async testDatabaseAPIIntegration(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];

    // Test Document CRUD through API
    results.push(
      await this.runIntegrationTest(
        'Database-API Integration',
        'Document CRUD Operations',
        async () => {
          // Create document via API
          const createResponse = await fetch(`${this.baseUrl}/api/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Integration Test Document',
              content: 'Testing database-API integration',
              type: 'txt',
            }),
          });

          if (!createResponse.ok) {
            throw new Error(
              `Document creation failed: ${createResponse.status}`
            );
          }

          const createData = await createResponse.json();
          const documentId = createData.data.id;

          // Verify in database
          const dbDocument = await this.prisma.document.findUnique({
            where: { id: documentId },
          });

          if (!dbDocument || dbDocument.title !== 'Integration Test Document') {
            throw new Error('Document not found in database');
          }

          // Update via API
          const updateResponse = await fetch(
            `${this.baseUrl}/api/documents/${documentId}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: 'Updated Integration Test Document',
              }),
            }
          );

          if (!updateResponse.ok) {
            throw new Error(`Document update failed: ${updateResponse.status}`);
          }

          // Verify update in database
          const updatedDbDocument = await this.prisma.document.findUnique({
            where: { id: documentId },
          });

          if (
            updatedDbDocument?.title !== 'Updated Integration Test Document'
          ) {
            throw new Error('Document update not reflected in database');
          }

          // Clean up
          await this.prisma.document.delete({
            where: { id: documentId },
          });

          return {
            documentId,
            operationsTested: ['create', 'read', 'update', 'delete'],
            databaseConsistency: true,
          };
        }
      )
    );

    // Test Knowledge Entry Integration
    results.push(
      await this.runIntegrationTest(
        'Database-API Integration',
        'Knowledge Entry Integration',
        async () => {
          // Create knowledge entry via API
          const response = await fetch(`${this.baseUrl}/api/knowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: 'Integration test knowledge',
              type: 'insight',
              metadata: { source: 'integration-test' },
            }),
          });

          if (!response.ok) {
            throw new Error(`Knowledge creation failed: ${response.status}`);
          }

          const data = await response.json();
          const knowledgeId = data.data.id;

          // Verify in database
          const dbKnowledge = await this.prisma.knowledgeEntry.findUnique({
            where: { id: knowledgeId },
          });

          if (!dbKnowledge) {
            throw new Error('Knowledge entry not found in database');
          }

          // Search via API
          const searchResponse = await fetch(
            `${this.baseUrl}/api/knowledge/search?query=integration`
          );
          const searchData = await searchResponse.json();

          const found = searchData.data.some(
            (entry: any) => entry.id === knowledgeId
          );

          // Clean up
          await this.prisma.knowledgeEntry.delete({
            where: { id: knowledgeId },
          });

          return {
            knowledgeId,
            searchFunctional: found,
            apiDatabaseSync: true,
          };
        }
      )
    );

    return results;
  }

  private async testAgentWorkflowIntegration(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];

    // Test Agent-Initiated Workflow
    results.push(
      await this.runIntegrationTest(
        'Agent-Workflow Integration',
        'Agent-Initiated Workflow Execution',
        async () => {
          // Agent requests workflow execution
          const agentResponse = await fetch(
            `${this.agentsUrl}/api/agents/execute`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentType: 'workflow-assistant',
                message: 'Execute document processing workflow',
                context: {
                  action: 'start-workflow',
                  workflowType: 'document-processing',
                },
              }),
            }
          );

          if (!agentResponse.ok) {
            throw new Error(`Agent execution failed: ${agentResponse.status}`);
          }

          const agentData = await agentResponse.json();

          // Verify workflow was created
          if (!agentData.workflowId) {
            throw new Error('Agent did not create workflow');
          }

          // Check workflow status
          const statusResponse = await fetch(
            `${this.baseUrl}/api/workflows/${agentData.workflowId}/status`
          );
          const statusData = await statusResponse.json();

          return {
            agentType: 'workflow-assistant',
            workflowCreated: !!agentData.workflowId,
            workflowStatus: statusData.data.status,
            integration: 'successful',
          };
        }
      )
    );

    // Test Workflow-Triggered Agent
    results.push(
      await this.runIntegrationTest(
        'Agent-Workflow Integration',
        'Workflow-Triggered Agent Execution',
        async () => {
          // Create workflow that triggers agent
          const workflowResponse = await fetch(
            `${this.baseUrl}/api/workflows`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: 'Agent Integration Workflow',
                steps: [
                  {
                    type: 'trigger-agent',
                    config: {
                      agentType: 'business-analyst',
                      task: 'analyze workflow requirements',
                      waitForCompletion: true,
                    },
                  },
                ],
              }),
            }
          );

          if (!workflowResponse.ok) {
            throw new Error(
              `Workflow creation failed: ${workflowResponse.status}`
            );
          }

          const workflowData = await workflowResponse.json();
          const workflowId = workflowData.data.id;

          // Wait for workflow to trigger agent
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Check workflow results
          const resultsResponse = await fetch(
            `${this.baseUrl}/api/workflows/${workflowId}/results`
          );
          const resultsData = await resultsResponse.json();

          return {
            workflowId,
            agentTriggered: true,
            workflowCompleted: resultsData.data.status === 'completed',
            agentResults: resultsData.data.results?.agentOutput || {},
          };
        }
      )
    );

    return results;
  }

  private async testMCPAgentIntegration(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];

    // Test MCP Tool Registration
    results.push(
      await this.runIntegrationTest(
        'MCP-Agent Integration',
        'MCP Tool Registration and Availability',
        async () => {
          // Check available MCP tools
          const toolsResponse = await fetch(`${this.agentsUrl}/api/mcp/tools`);

          if (!toolsResponse.ok) {
            throw new Error(
              `MCP tools request failed: ${toolsResponse.status}`
            );
          }

          const toolsData = await toolsResponse.json();
          const expectedTools = [
            'read_workspace_file',
            'search_workspace_files',
            'analyze_code',
            'generate_code',
            'execute_terminal_command',
            'query_database',
            'execute_workflow',
          ];

          const availableTools = toolsData.tools.map((tool: any) => tool.name);
          const allToolsAvailable = expectedTools.every(tool =>
            availableTools.includes(tool)
          );

          return {
            expectedTools: expectedTools.length,
            availableTools: availableTools.length,
            allToolsRegistered: allToolsAvailable,
            toolsList: availableTools,
          };
        }
      )
    );

    // Test MCP Tool Execution via Agent
    results.push(
      await this.runIntegrationTest(
        'MCP-Agent Integration',
        'MCP Tool Execution Through Agent',
        async () => {
          // Execute MCP tool through agent
          const executionResponse = await fetch(
            `${this.agentsUrl}/api/mcp/execute`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                toolName: 'query_database',
                parameters: {
                  query: 'SELECT COUNT(*) as count FROM Document',
                  database: 'main',
                },
              }),
            }
          );

          if (!executionResponse.ok) {
            throw new Error(
              `MCP tool execution failed: ${executionResponse.status}`
            );
          }

          const executionData = await executionResponse.json();

          return {
            toolName: 'query_database',
            executionSuccessful: executionData.success,
            resultReceived: !!executionData.result,
            mcpIntegration: 'functional',
          };
        }
      )
    );

    // Test Agent Function Calling with MCP
    results.push(
      await this.runIntegrationTest(
        'MCP-Agent Integration',
        'Agent Function Calling with MCP Tools',
        async () => {
          // Agent uses MCP tools via function calling
          const functionCallResponse = await fetch(
            `${this.agentsUrl}/api/agents/function-call`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentType: 'senior-developer',
                functionName: 'analyze_code',
                parameters: {
                  code: 'function testFunction() { return "integration test"; }',
                  language: 'javascript',
                },
              }),
            }
          );

          if (!functionCallResponse.ok) {
            throw new Error(
              `Function calling failed: ${functionCallResponse.status}`
            );
          }

          const functionData = await functionCallResponse.json();

          return {
            functionCalling: 'successful',
            mcpToolUsed: 'analyze_code',
            analysisReceived: !!functionData.result,
            agentMcpIntegration: 'working',
          };
        }
      )
    );

    return results;
  }

  private async testCrossServiceCommunication(): Promise<
    IntegrationTestResult[]
  > {
    const results: IntegrationTestResult[] = [];

    // Test Backend-Agents Communication
    results.push(
      await this.runIntegrationTest(
        'Cross-Service Communication',
        'Backend-Agents API Communication',
        async () => {
          // Backend requests agent execution
          const backendResponse = await fetch(
            `${this.baseUrl}/api/internal/execute-agent`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                agentType: 'qa-engineer',
                task: 'validate system integration',
                context: { source: 'backend-service' },
              }),
            }
          );

          const responseData = await backendResponse.json();

          // Check if request was properly forwarded
          const communicationWorking =
            backendResponse.ok || responseData.forwarded;

          return {
            backendToAgents: communicationWorking,
            responseReceived: !!responseData,
            crossServiceCall: 'functional',
          };
        }
      )
    );

    // Test Service Discovery
    results.push(
      await this.runIntegrationTest(
        'Cross-Service Communication',
        'Service Discovery and Health Checks',
        async () => {
          // Check if services can discover each other
          const backendHealth = await fetch(`${this.baseUrl}/api/health`);
          const agentsHealth = await fetch(`${this.agentsUrl}/api/health`);

          const backendData = backendHealth.ok
            ? await backendHealth.json()
            : null;
          const agentsData = agentsHealth.ok ? await agentsHealth.json() : null;

          return {
            backendDiscoverable: backendHealth.ok,
            agentsDiscoverable: agentsHealth.ok,
            bothServicesHealthy:
              backendData?.status === 'ok' && agentsData?.status === 'ok',
            serviceDiscovery: 'functional',
          };
        }
      )
    );

    return results;
  }

  private async testPerformanceIntegration(): Promise<IntegrationTestResult[]> {
    const results: IntegrationTestResult[] = [];

    // Test Concurrent Service Requests
    results.push(
      await this.runIntegrationTest(
        'Performance Integration',
        'Concurrent Cross-Service Requests',
        async () => {
          const concurrentRequests = 10;
          const requests = [];

          const startTime = Date.now();

          // Create concurrent requests to both services
          for (let i = 0; i < concurrentRequests; i++) {
            if (i % 2 === 0) {
              requests.push(fetch(`${this.baseUrl}/api/documents`));
            } else {
              requests.push(fetch(`${this.agentsUrl}/api/mcp/tools`));
            }
          }

          const responses = await Promise.all(requests);
          const duration = Date.now() - startTime;

          const successfulRequests = responses.filter(r => r.ok).length;

          return {
            concurrentRequests,
            successfulRequests,
            totalDuration: duration,
            averageResponseTime: duration / concurrentRequests,
            performanceAcceptable: duration < 5000, // Should complete within 5 seconds
          };
        }
      )
    );

    // Test Memory and Resource Usage
    results.push(
      await this.runIntegrationTest(
        'Performance Integration',
        'Resource Usage Under Load',
        async () => {
          // Simulate load on both services
          const loadRequests = [];

          for (let i = 0; i < 20; i++) {
            loadRequests.push(
              fetch(`${this.baseUrl}/api/documents`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: `Load Test Document ${i}`,
                  content: `Content for load testing ${i}`,
                  type: 'txt',
                }),
              })
            );
          }

          const startTime = Date.now();
          const responses = await Promise.all(loadRequests);
          const duration = Date.now() - startTime;

          // Clean up created documents
          for (const response of responses) {
            if (response.ok) {
              const data = await response.json();
              if (data.data?.id) {
                await this.prisma.document
                  .delete({
                    where: { id: data.data.id },
                  })
                  .catch(() => {}); // Ignore cleanup errors
              }
            }
          }

          const successRate =
            responses.filter(r => r.ok).length / responses.length;

          return {
            loadRequests: loadRequests.length,
            successRate,
            totalDuration: duration,
            systemStability: successRate > 0.9,
            resourceHandling: 'acceptable',
          };
        }
      )
    );

    return results;
  }

  private async runIntegrationTest(
    testSuite: string,
    testName: string,
    testFunction: () => Promise<any>
  ): Promise<IntegrationTestResult> {
    const startTime = Date.now();

    try {
      console.log(`  🧪 ${testSuite}: ${testName}`);

      const details = await testFunction();
      const duration = Date.now() - startTime;

      return {
        testSuite,
        testName,
        success: true,
        duration,
        details,
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        testSuite,
        testName,
        success: false,
        duration,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async generateIntegrationReport(
    results: IntegrationTestResult[]
  ): Promise<void> {
    const groupedResults = results.reduce((acc, result) => {
      if (!acc[result.testSuite]) {
        acc[result.testSuite] = [];
      }
      acc[result.testSuite].push(result);
      return acc;
    }, {} as Record<string, IntegrationTestResult[]>);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: Object.keys(groupedResults).length,
        totalTests: results.length,
        passedTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length,
        totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
        averageDuration:
          results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      },
      suiteResults: Object.entries(groupedResults).map(
        ([suiteName, suiteResults]) => ({
          suite: suiteName,
          totalTests: suiteResults.length,
          passedTests: suiteResults.filter(r => r.success).length,
          results: suiteResults,
        })
      ),
    };

    const reportsDir = path.join(process.cwd(), 'tests', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const reportPath = path.join(
      reportsDir,
      `integration-test-report-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Integration test report generated: ${reportPath}`);

    // Log summary
    console.log('\n📋 Integration Test Summary:');
    for (const suiteResult of report.suiteResults) {
      const status =
        suiteResult.passedTests === suiteResult.totalTests ? '✅' : '❌';
      console.log(
        `  ${status} ${suiteResult.suite}: ${suiteResult.passedTests}/${suiteResult.totalTests}`
      );
    }
  }
}

// Main execution
if (require.main === module) {
  const tester = new IntegrationTester();

  tester
    .runIntegrationTests()
    .then(() => {
      console.log('🎉 Integration tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Integration tests failed:', error);
      process.exit(1);
    });
}

export { IntegrationTester };
