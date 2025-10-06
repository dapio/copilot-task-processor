#!/usr/bin/env node

/**
 * ThinkCode AI Platform - Enhanced System Testing
 * Comprehensive testing suite for enterprise functionality validation
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  duration: number;
}

class EnhancedSystemTester {
  private prisma: PrismaClient;
  private baseUrl: string;
  private agentsUrl: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.baseUrl = 'http://localhost:3002';
    this.agentsUrl = 'http://localhost:3003';
  }

  async runComprehensiveTests(): Promise<TestSuite[]> {
    try {
      console.log('🧪 Starting ThinkCode AI Platform Enhanced System Tests...');

      const testSuites = [
        await this.runHealthCheckTests(),
        await this.runDatabaseTests(),
        await this.runAPITests(),
        await this.runAgentsTests(),
        await this.runWorkflowTests(),
        await this.runPerformanceTests(),
        await this.runSecurityTests(),
      ];

      await this.generateTestReport(testSuites);

      console.log('✅ Enhanced system testing completed!');
      return testSuites;
    } catch (error) {
      console.error('❌ Enhanced system testing failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async runHealthCheckTests(): Promise<TestSuite> {
    console.log('🏥 Running health check tests...');
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Test backend health
    results.push(
      await this.runTest('Backend Health Check', async () => {
        const response = await fetch(`${this.baseUrl}/api/health`);
        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }
        const data = await response.json();
        return data.status === 'ok';
      })
    );

    // Test agents health
    results.push(
      await this.runTest('Agents Health Check', async () => {
        const response = await fetch(`${this.agentsUrl}/api/health`);
        if (!response.ok) {
          throw new Error(`Agents health check failed: ${response.status}`);
        }
        const data = await response.json();
        return data.status === 'ok';
      })
    );

    // Test database connection
    results.push(
      await this.runTest('Database Connection', async () => {
        await this.prisma.$queryRaw`SELECT 1`;
        return true;
      })
    );

    return this.compileSuiteResults('Health Checks', results, startTime);
  }

  private async runDatabaseTests(): Promise<TestSuite> {
    console.log('🗄️ Running database tests...');
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Test document CRUD operations
    results.push(
      await this.runTest('Document CRUD Operations', async () => {
        // Create
        const document = await this.prisma.document.create({
          data: {
            title: 'Test Document',
            content: 'Test content for system testing',
            type: 'txt',
            status: 'processed',
          },
        });

        // Read
        const retrieved = await this.prisma.document.findUnique({
          where: { id: document.id },
        });

        if (!retrieved || retrieved.title !== 'Test Document') {
          throw new Error('Document read operation failed');
        }

        // Update
        const updated = await this.prisma.document.update({
          where: { id: document.id },
          data: { title: 'Updated Test Document' },
        });

        if (updated.title !== 'Updated Test Document') {
          throw new Error('Document update operation failed');
        }

        // Delete
        await this.prisma.document.delete({
          where: { id: document.id },
        });

        return true;
      })
    );

    // Test workflow execution CRUD
    results.push(
      await this.runTest('Workflow Execution CRUD', async () => {
        const workflow = await this.prisma.workflowExecution.create({
          data: {
            name: 'Test Workflow',
            status: 'pending',
            steps: JSON.stringify([
              { type: 'test-step', config: { test: true } },
            ]),
          },
        });

        const retrieved = await this.prisma.workflowExecution.findUnique({
          where: { id: workflow.id },
        });

        if (!retrieved) {
          throw new Error('Workflow retrieval failed');
        }

        await this.prisma.workflowExecution.delete({
          where: { id: workflow.id },
        });

        return true;
      })
    );

    // Test knowledge entry operations
    results.push(
      await this.runTest('Knowledge Entry Operations', async () => {
        const knowledge = await this.prisma.knowledgeEntry.create({
          data: {
            content: 'Test knowledge content',
            type: 'insight',
            metadata: JSON.stringify({ source: 'system-test' }),
          },
        });

        const retrieved = await this.prisma.knowledgeEntry.findUnique({
          where: { id: knowledge.id },
        });

        if (!retrieved) {
          throw new Error('Knowledge entry retrieval failed');
        }

        await this.prisma.knowledgeEntry.delete({
          where: { id: knowledge.id },
        });

        return true;
      })
    );

    return this.compileSuiteResults('Database Tests', results, startTime);
  }

  private async runAPITests(): Promise<TestSuite> {
    console.log('🔌 Running API tests...');
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Test document upload endpoint
    results.push(
      await this.runTest('Document Upload API', async () => {
        const response = await fetch(`${this.baseUrl}/api/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'API Test Document',
            content: 'Test content via API',
            type: 'txt',
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.success && data.data.id;
      })
    );

    // Test document listing endpoint
    results.push(
      await this.runTest('Documents Listing API', async () => {
        const response = await fetch(`${this.baseUrl}/api/documents`);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data.data);
      })
    );

    // Test workflow execution endpoint
    results.push(
      await this.runTest('Workflow Execution API', async () => {
        const response = await fetch(`${this.baseUrl}/api/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'API Test Workflow',
            steps: [{ type: 'test-step', config: { apiTest: true } }],
          }),
        });

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.success && data.data.id;
      })
    );

    return this.compileSuiteResults('API Tests', results, startTime);
  }

  private async runAgentsTests(): Promise<TestSuite> {
    console.log('🤖 Running agents tests...');
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Test MCP server availability
    results.push(
      await this.runTest('MCP Server Availability', async () => {
        const response = await fetch(`${this.agentsUrl}/api/mcp/tools`);

        if (!response.ok) {
          throw new Error(`MCP server request failed: ${response.status}`);
        }

        const data = await response.json();
        return Array.isArray(data.tools) && data.tools.length > 0;
      })
    );

    // Test agent tool execution
    results.push(
      await this.runTest('Agent Tool Execution', async () => {
        const response = await fetch(`${this.agentsUrl}/api/agents/execute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: 'workflow-assistant',
            message: 'Test agent execution',
            context: { test: true },
          }),
        });

        if (!response.ok) {
          throw new Error(`Agent execution failed: ${response.status}`);
        }

        const data = await response.json();
        return data.success;
      })
    );

    // Test function calling capabilities
    results.push(
      await this.runTest('Function Calling System', async () => {
        const response = await fetch(
          `${this.agentsUrl}/api/agents/function-call`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              agentType: 'senior-developer',
              functionName: 'analyze_code',
              parameters: { code: 'console.log("test")' },
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Function calling failed: ${response.status}`);
        }

        const data = await response.json();
        return data.success;
      })
    );

    return this.compileSuiteResults('Agents Tests', results, startTime);
  }

  private async runWorkflowTests(): Promise<TestSuite> {
    console.log('⚡ Running workflow tests...');
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Test workflow creation and execution
    results.push(
      await this.runTest('Workflow Creation and Execution', async () => {
        // Create workflow via API
        const createResponse = await fetch(`${this.baseUrl}/api/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'System Test Workflow',
            steps: [
              {
                type: 'document-analysis',
                config: { enableSummary: true },
              },
            ],
          }),
        });

        if (!createResponse.ok) {
          throw new Error(`Workflow creation failed: ${createResponse.status}`);
        }

        const createData = await createResponse.json();
        const workflowId = createData.data.id;

        // Check workflow status
        const statusResponse = await fetch(
          `${this.baseUrl}/api/workflows/${workflowId}/status`
        );

        if (!statusResponse.ok) {
          throw new Error(
            `Workflow status check failed: ${statusResponse.status}`
          );
        }

        const statusData = await statusResponse.json();
        return statusData.data.status !== undefined;
      })
    );

    // Test workflow step validation
    results.push(
      await this.runTest('Workflow Step Validation', async () => {
        const response = await fetch(`${this.baseUrl}/api/workflows/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            steps: [
              { type: 'document-upload', config: { maxSize: '10MB' } },
              { type: 'content-extraction', config: { format: 'text' } },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`Workflow validation failed: ${response.status}`);
        }

        const data = await response.json();
        return data.valid === true;
      })
    );

    return this.compileSuiteResults('Workflow Tests', results, startTime);
  }

  private async runPerformanceTests(): Promise<TestSuite> {
    console.log('⚡ Running performance tests...');
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Test API response times
    results.push(
      await this.runTest('API Response Time', async () => {
        const start = Date.now();
        const response = await fetch(`${this.baseUrl}/api/health`);
        const duration = Date.now() - start;

        if (!response.ok) {
          throw new Error(`Health check failed: ${response.status}`);
        }

        // Response time should be under 500ms
        return duration < 500;
      })
    );

    // Test database query performance
    results.push(
      await this.runTest('Database Query Performance', async () => {
        const start = Date.now();
        await this.prisma.document.findMany({ take: 10 });
        const duration = Date.now() - start;

        // Query should complete within 100ms
        return duration < 100;
      })
    );

    // Test concurrent requests
    results.push(
      await this.runTest('Concurrent Request Handling', async () => {
        const concurrentRequests = 10;
        const promises = [];

        for (let i = 0; i < concurrentRequests; i++) {
          promises.push(fetch(`${this.baseUrl}/api/health`));
        }

        const results = await Promise.all(promises);
        return results.every(response => response.ok);
      })
    );

    return this.compileSuiteResults('Performance Tests', results, startTime);
  }

  private async runSecurityTests(): Promise<TestSuite> {
    console.log('🔒 Running security tests...');
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Test input validation
    results.push(
      await this.runTest('Input Validation', async () => {
        const maliciousInput = '<script>alert("xss")</script>';

        const response = await fetch(`${this.baseUrl}/api/documents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: maliciousInput,
            content: maliciousInput,
            type: 'txt',
          }),
        });

        // Should either reject malicious input or sanitize it
        const data = await response.json();

        if (response.ok) {
          // If accepted, verify it was sanitized
          return !data.data.title.includes('<script>');
        } else {
          // If rejected, that's also good
          return true;
        }
      })
    );

    // Test SQL injection protection
    results.push(
      await this.runTest('SQL Injection Protection', async () => {
        const sqlInjection = "'; DROP TABLE documents; --";

        const response = await fetch(
          `${this.baseUrl}/api/documents?search=${encodeURIComponent(
            sqlInjection
          )}`
        );

        // Should handle malicious query without error
        return response.status !== 500;
      })
    );

    // Test CORS headers
    results.push(
      await this.runTest('CORS Headers', async () => {
        const response = await fetch(`${this.baseUrl}/api/health`);

        // Should have appropriate CORS headers
        const corsHeader = response.headers.get('Access-Control-Allow-Origin');
        return corsHeader !== null;
      })
    );

    return this.compileSuiteResults('Security Tests', results, startTime);
  }

  private async runTest(
    name: string,
    testFunction: () => Promise<boolean>
  ): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const passed = await testFunction();
      const duration = Date.now() - startTime;

      return {
        name,
        passed,
        duration,
        details: passed ? 'Test passed successfully' : 'Test returned false',
      };
    } catch (error) {
      const duration = Date.now() - startTime;

      return {
        name,
        passed: false,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private compileSuiteResults(
    suiteName: string,
    results: TestResult[],
    startTime: number
  ): TestSuite {
    const passedTests = results.filter(r => r.passed).length;
    const duration = Date.now() - startTime;

    console.log(
      `  ✓ ${suiteName}: ${passedTests}/${results.length} tests passed (${duration}ms)`
    );

    return {
      name: suiteName,
      results,
      totalTests: results.length,
      passedTests,
      duration,
    };
  }

  private async generateTestReport(testSuites: TestSuite[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalSuites: testSuites.length,
        totalTests: testSuites.reduce(
          (sum, suite) => sum + suite.totalTests,
          0
        ),
        totalPassed: testSuites.reduce(
          (sum, suite) => sum + suite.passedTests,
          0
        ),
        totalDuration: testSuites.reduce(
          (sum, suite) => sum + suite.duration,
          0
        ),
      },
      suites: testSuites,
    };

    const reportsDir = path.join(process.cwd(), 'tests', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const reportPath = path.join(
      reportsDir,
      `system-test-report-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Test report generated: ${reportPath}`);
    console.log(
      `📈 Overall Results: ${report.summary.totalPassed}/${report.summary.totalTests} tests passed`
    );
  }
}

// Main execution
if (require.main === module) {
  const tester = new EnhancedSystemTester();

  tester
    .runComprehensiveTests()
    .then(suites => {
      const allTestsPassed = suites.every(
        suite => suite.passedTests === suite.totalTests
      );

      if (allTestsPassed) {
        console.log('🎉 All enhanced system tests passed!');
        process.exit(0);
      } else {
        console.log('❌ Some enhanced system tests failed');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Enhanced system testing encountered an error:', error);
      process.exit(1);
    });
}

export { EnhancedSystemTester };
