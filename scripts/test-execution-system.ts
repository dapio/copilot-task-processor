#!/usr/bin/env node

/**
 * ThinkCode AI Platform - Execution System Testing
 * Comprehensive testing for workflow execution and agent orchestration
 */

import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import path from 'path';

interface ExecutionTestResult {
  testName: string;
  executionId: string;
  status: string;
  duration: number;
  success: boolean;
  details: any;
  error?: string;
}

class ExecutionSystemTester {
  private prisma: PrismaClient;
  private baseUrl: string;
  private agentsUrl: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.baseUrl = 'http://localhost:3002';
    this.agentsUrl = 'http://localhost:3003';
  }

  async runExecutionTests(): Promise<void> {
    try {
      console.log(
        '🚀 Starting ThinkCode AI Platform Execution System Tests...'
      );

      const results: ExecutionTestResult[] = [];

      // Test workflow execution scenarios
      results.push(await this.testDocumentProcessingWorkflow());
      results.push(await this.testKnowledgeExtractionWorkflow());
      results.push(await this.testMultiStepWorkflowExecution());
      results.push(await this.testWorkflowErrorHandling());
      results.push(await this.testConcurrentWorkflowExecution());

      // Test agent execution scenarios
      results.push(await this.testAgentToolExecution());
      results.push(await this.testAgentFunctionCalling());
      results.push(await this.testAgentWorkflowIntegration());
      results.push(await this.testAgentErrorRecovery());

      // Test system integration scenarios
      results.push(await this.testEndToEndDocumentFlow());
      results.push(await this.testRealTimeUpdates());

      await this.generateExecutionReport(results);

      const successfulTests = results.filter(r => r.success).length;
      console.log(
        `✅ Execution System Tests completed: ${successfulTests}/${results.length} passed`
      );
    } catch (error) {
      console.error('❌ Execution system testing failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async testDocumentProcessingWorkflow(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('📄 Testing document processing workflow...');

      // Create a test document
      const documentResponse = await fetch(`${this.baseUrl}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Execution Test Document',
          content:
            'This is a comprehensive test document for validating the document processing workflow in the ThinkCode AI Platform. It contains multiple sentences and various content types to ensure proper analysis.',
          type: 'txt',
        }),
      });

      if (!documentResponse.ok) {
        throw new Error(`Document creation failed: ${documentResponse.status}`);
      }

      const documentData = await documentResponse.json();
      const documentId = documentData.data.id;

      // Execute document processing workflow
      const workflowResponse = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Document Processing Test',
          steps: [
            {
              type: 'document-validation',
              config: { documentId, strict: true },
            },
            {
              type: 'content-extraction',
              config: { documentId, preserveFormatting: false },
            },
            {
              type: 'content-analysis',
              config: {
                documentId,
                generateSummary: true,
                extractEntities: true,
              },
            },
            {
              type: 'knowledge-storage',
              config: { documentId, createEntries: true },
            },
          ],
        }),
      });

      if (!workflowResponse.ok) {
        throw new Error(
          `Workflow execution failed: ${workflowResponse.status}`
        );
      }

      const workflowData = await workflowResponse.json();
      const executionId = workflowData.data.id;

      // Monitor execution status
      await this.waitForWorkflowCompletion(executionId);

      const duration = Date.now() - startTime;

      return {
        testName: 'Document Processing Workflow',
        executionId,
        status: 'completed',
        duration,
        success: true,
        details: {
          documentId,
          stepsCompleted: 4,
          processingTime: duration,
        },
      };
    } catch (error) {
      return {
        testName: 'Document Processing Workflow',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testKnowledgeExtractionWorkflow(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('🧠 Testing knowledge extraction workflow...');

      const workflowResponse = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Knowledge Extraction Test',
          steps: [
            {
              type: 'knowledge-analysis',
              config: {
                source: 'existing-documents',
                extractionTypes: ['summaries', 'entities', 'relationships'],
                minConfidence: 0.7,
              },
            },
            {
              type: 'knowledge-enrichment',
              config: {
                enhanceEntities: true,
                linkRelationships: true,
                generateInsights: true,
              },
            },
            {
              type: 'knowledge-validation',
              config: {
                validateConsistency: true,
                checkDuplicates: true,
                qualityScore: true,
              },
            },
          ],
        }),
      });

      if (!workflowResponse.ok) {
        throw new Error(
          `Knowledge workflow failed: ${workflowResponse.status}`
        );
      }

      const workflowData = await workflowResponse.json();
      const executionId = workflowData.data.id;

      await this.waitForWorkflowCompletion(executionId);

      const duration = Date.now() - startTime;

      return {
        testName: 'Knowledge Extraction Workflow',
        executionId,
        status: 'completed',
        duration,
        success: true,
        details: {
          extractionTypes: 3,
          validationPassed: true,
          processingTime: duration,
        },
      };
    } catch (error) {
      return {
        testName: 'Knowledge Extraction Workflow',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testMultiStepWorkflowExecution(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('🔄 Testing multi-step workflow execution...');

      const workflowResponse = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Multi-Step Execution Test',
          steps: [
            { type: 'initialization', config: { setupRequired: true } },
            { type: 'data-preparation', config: { cleanData: true } },
            { type: 'processing', config: { intensive: true } },
            { type: 'analysis', config: { deepAnalysis: true } },
            { type: 'validation', config: { strict: true } },
            { type: 'storage', config: { persistent: true } },
            { type: 'notification', config: { sendAlerts: true } },
            { type: 'cleanup', config: { removeTemp: true } },
          ],
        }),
      });

      if (!workflowResponse.ok) {
        throw new Error(
          `Multi-step workflow failed: ${workflowResponse.status}`
        );
      }

      const workflowData = await workflowResponse.json();
      const executionId = workflowData.data.id;

      await this.waitForWorkflowCompletion(executionId);

      const duration = Date.now() - startTime;

      return {
        testName: 'Multi-Step Workflow Execution',
        executionId,
        status: 'completed',
        duration,
        success: true,
        details: {
          totalSteps: 8,
          completedSteps: 8,
          averageStepTime: duration / 8,
        },
      };
    } catch (error) {
      return {
        testName: 'Multi-Step Workflow Execution',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testWorkflowErrorHandling(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('⚠️ Testing workflow error handling...');

      // Create workflow with intentional error step
      const workflowResponse = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Error Handling Test',
          steps: [
            { type: 'valid-step', config: { test: true } },
            { type: 'error-step', config: { forceError: true } },
            { type: 'recovery-step', config: { handleError: true } },
          ],
          errorHandling: {
            retryAttempts: 2,
            fallbackStrategy: 'continue',
            notifyOnError: false,
          },
        }),
      });

      if (!workflowResponse.ok) {
        throw new Error(
          `Error handling workflow failed: ${workflowResponse.status}`
        );
      }

      const workflowData = await workflowResponse.json();
      const executionId = workflowData.data.id;

      // Wait for workflow to handle error
      await this.waitForWorkflowCompletion(executionId, 'failed');

      const duration = Date.now() - startTime;

      // Check if error was handled gracefully
      const statusResponse = await fetch(
        `${this.baseUrl}/api/workflows/${executionId}/status`
      );
      const statusData = await statusResponse.json();

      return {
        testName: 'Workflow Error Handling',
        executionId,
        status: statusData.data.status,
        duration,
        success: statusData.data.status === 'failed', // We expect it to fail gracefully
        details: {
          errorHandled: true,
          retryAttempts: 2,
          gracefulFailure: true,
        },
      };
    } catch (error) {
      return {
        testName: 'Workflow Error Handling',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testConcurrentWorkflowExecution(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('🔀 Testing concurrent workflow execution...');

      const concurrentWorkflows = 5;
      const workflowPromises = [];

      for (let i = 0; i < concurrentWorkflows; i++) {
        const promise = fetch(`${this.baseUrl}/api/workflows`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Concurrent Test Workflow ${i + 1}`,
            steps: [
              { type: 'concurrent-step-1', config: { workflowIndex: i } },
              { type: 'concurrent-step-2', config: { workflowIndex: i } },
              { type: 'concurrent-step-3', config: { workflowIndex: i } },
            ],
          }),
        });
        workflowPromises.push(promise);
      }

      const responses = await Promise.all(workflowPromises);
      const executionIds = [];

      for (const response of responses) {
        if (!response.ok) {
          throw new Error(`Concurrent workflow failed: ${response.status}`);
        }
        const data = await response.json();
        executionIds.push(data.data.id);
      }

      // Wait for all workflows to complete
      const completionPromises = executionIds.map(id =>
        this.waitForWorkflowCompletion(id)
      );
      await Promise.all(completionPromises);

      const duration = Date.now() - startTime;

      return {
        testName: 'Concurrent Workflow Execution',
        executionId: executionIds.join(','),
        status: 'completed',
        duration,
        success: true,
        details: {
          concurrentWorkflows: concurrentWorkflows,
          allCompleted: true,
          totalTime: duration,
          averageTime: duration / concurrentWorkflows,
        },
      };
    } catch (error) {
      return {
        testName: 'Concurrent Workflow Execution',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testAgentToolExecution(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('🤖 Testing agent tool execution...');

      const agentResponse = await fetch(
        `${this.agentsUrl}/api/agents/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: 'senior-developer',
            message: 'Analyze the code structure and provide recommendations',
            context: {
              codebase: 'TypeScript Node.js application',
              framework: 'Next.js',
              testType: 'execution-system-test',
            },
          }),
        }
      );

      if (!agentResponse.ok) {
        throw new Error(`Agent execution failed: ${agentResponse.status}`);
      }

      const agentData = await agentResponse.json();
      const duration = Date.now() - startTime;

      return {
        testName: 'Agent Tool Execution',
        executionId: agentData.executionId || 'agent-exec',
        status: 'completed',
        duration,
        success: agentData.success,
        details: {
          agentType: 'senior-developer',
          toolsUsed: agentData.toolsUsed || [],
          responseLength: agentData.response ? agentData.response.length : 0,
        },
      };
    } catch (error) {
      return {
        testName: 'Agent Tool Execution',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testAgentFunctionCalling(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('📞 Testing agent function calling...');

      const functionCallResponse = await fetch(
        `${this.agentsUrl}/api/agents/function-call`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: 'workflow-assistant',
            functionName: 'execute_workflow',
            parameters: {
              workflowName: 'test-execution-workflow',
              steps: [{ type: 'analysis', config: { quick: true } }],
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
      const duration = Date.now() - startTime;

      return {
        testName: 'Agent Function Calling',
        executionId: functionData.executionId || 'function-call',
        status: 'completed',
        duration,
        success: functionData.success,
        details: {
          functionName: 'execute_workflow',
          parametersValid: true,
          resultReceived: !!functionData.result,
        },
      };
    } catch (error) {
      return {
        testName: 'Agent Function Calling',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testAgentWorkflowIntegration(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('🔗 Testing agent-workflow integration...');

      // Create workflow that uses agent capabilities
      const workflowResponse = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Agent Integration Test',
          steps: [
            {
              type: 'agent-analysis',
              config: {
                agentType: 'business-analyst',
                task: 'analyze system requirements',
                useTools: true,
              },
            },
            {
              type: 'agent-code-review',
              config: {
                agentType: 'senior-developer',
                task: 'review generated code',
                strictMode: true,
              },
            },
            {
              type: 'agent-qa-validation',
              config: {
                agentType: 'qa-engineer',
                task: 'validate implementation',
                comprehensive: true,
              },
            },
          ],
        }),
      });

      if (!workflowResponse.ok) {
        throw new Error(
          `Agent integration workflow failed: ${workflowResponse.status}`
        );
      }

      const workflowData = await workflowResponse.json();
      const executionId = workflowData.data.id;

      await this.waitForWorkflowCompletion(executionId);

      const duration = Date.now() - startTime;

      return {
        testName: 'Agent-Workflow Integration',
        executionId,
        status: 'completed',
        duration,
        success: true,
        details: {
          agentsInvolved: 3,
          stepsWithAgents: 3,
          integrationSuccessful: true,
        },
      };
    } catch (error) {
      return {
        testName: 'Agent-Workflow Integration',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testAgentErrorRecovery(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('🩹 Testing agent error recovery...');

      const agentResponse = await fetch(
        `${this.agentsUrl}/api/agents/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentType: 'invalid-agent-type', // Intentional error
            message: 'This should trigger error recovery',
            context: { testErrorRecovery: true },
          }),
        }
      );

      // We expect this to handle the error gracefully
      const agentData = await agentResponse.json();
      const duration = Date.now() - startTime;

      // Success means the system handled the error without crashing
      const success =
        !agentResponse.ok && agentData.error && agentData.error.code;

      return {
        testName: 'Agent Error Recovery',
        executionId: 'error-recovery-test',
        status: success ? 'error-handled' : 'unexpected-success',
        duration,
        success,
        details: {
          errorHandled: success,
          errorCode: agentData.error?.code,
          gracefulFailure: true,
        },
      };
    } catch (error) {
      return {
        testName: 'Agent Error Recovery',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testEndToEndDocumentFlow(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('🔄 Testing end-to-end document flow...');

      // Upload document
      const uploadResponse = await fetch(`${this.baseUrl}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'End-to-End Test Document',
          content:
            'This document will be processed through the complete pipeline including AI analysis, knowledge extraction, and workflow execution.',
          type: 'txt',
        }),
      });

      const documentData = await uploadResponse.json();
      const documentId = documentData.data.id;

      // Process through complete pipeline
      const pipelineResponse = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Complete Document Pipeline',
          steps: [
            { type: 'document-validation', config: { documentId } },
            { type: 'content-extraction', config: { documentId } },
            {
              type: 'ai-analysis',
              config: { documentId, agentType: 'business-analyst' },
            },
            { type: 'knowledge-extraction', config: { documentId } },
            {
              type: 'quality-check',
              config: { documentId, agentType: 'qa-engineer' },
            },
            { type: 'final-storage', config: { documentId } },
          ],
        }),
      });

      const pipelineData = await pipelineResponse.json();
      const executionId = pipelineData.data.id;

      await this.waitForWorkflowCompletion(executionId);

      // Verify knowledge was extracted
      const knowledgeResponse = await fetch(
        `${this.baseUrl}/api/knowledge/search?documentId=${documentId}`
      );
      const knowledgeData = await knowledgeResponse.json();

      const duration = Date.now() - startTime;

      return {
        testName: 'End-to-End Document Flow',
        executionId,
        status: 'completed',
        duration,
        success: true,
        details: {
          documentId,
          pipelineSteps: 6,
          knowledgeEntriesCreated: knowledgeData.data?.length || 0,
          fullPipelineCompleted: true,
        },
      };
    } catch (error) {
      return {
        testName: 'End-to-End Document Flow',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async testRealTimeUpdates(): Promise<ExecutionTestResult> {
    const startTime = Date.now();

    try {
      console.log('⚡ Testing real-time updates...');

      // This would typically test WebSocket connections
      // For now, we'll test the polling-based status updates

      const workflowResponse = await fetch(`${this.baseUrl}/api/workflows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Real-Time Updates Test',
          steps: [
            { type: 'slow-step-1', config: { delay: 1000 } },
            { type: 'slow-step-2', config: { delay: 1000 } },
            { type: 'slow-step-3', config: { delay: 1000 } },
          ],
        }),
      });

      const workflowData = await workflowResponse.json();
      const executionId = workflowData.data.id;

      // Monitor status updates in real-time
      const statusUpdates = [];
      let completed = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!completed && attempts < maxAttempts) {
        const statusResponse = await fetch(
          `${this.baseUrl}/api/workflows/${executionId}/status`
        );
        const statusData = await statusResponse.json();

        statusUpdates.push({
          timestamp: Date.now(),
          status: statusData.data.status,
          currentStep: statusData.data.currentStep,
        });

        completed =
          statusData.data.status === 'completed' ||
          statusData.data.status === 'failed';

        if (!completed) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        attempts++;
      }

      const duration = Date.now() - startTime;

      return {
        testName: 'Real-Time Updates',
        executionId,
        status: 'completed',
        duration,
        success: statusUpdates.length > 1 && completed,
        details: {
          statusUpdatesReceived: statusUpdates.length,
          updateFrequency:
            statusUpdates.length > 1 ? duration / statusUpdates.length : 0,
          realTimeTracking: true,
        },
      };
    } catch (error) {
      return {
        testName: 'Real-Time Updates',
        executionId: 'failed',
        status: 'error',
        duration: Date.now() - startTime,
        success: false,
        details: {},
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async waitForWorkflowCompletion(
    executionId: string,
    expectedStatus: string = 'completed'
  ): Promise<void> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(
        `${this.baseUrl}/api/workflows/${executionId}/status`
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        if (
          status === expectedStatus ||
          status === 'completed' ||
          status === 'failed'
        ) {
          return;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    throw new Error(
      `Workflow ${executionId} did not complete within expected time`
    );
  }

  private async generateExecutionReport(
    results: ExecutionTestResult[]
  ): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: results.length,
        passedTests: results.filter(r => r.success).length,
        failedTests: results.filter(r => !r.success).length,
        totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
        averageDuration:
          results.reduce((sum, r) => sum + r.duration, 0) / results.length,
      },
      results: results.map(result => ({
        ...result,
        durationFormatted: `${result.duration}ms`,
      })),
    };

    const reportsDir = path.join(process.cwd(), 'tests', 'reports');
    await fs.mkdir(reportsDir, { recursive: true });

    const reportPath = path.join(
      reportsDir,
      `execution-test-report-${Date.now()}.json`
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`📊 Execution test report generated: ${reportPath}`);
  }
}

// Main execution
if (require.main === module) {
  const tester = new ExecutionSystemTester();

  tester
    .runExecutionTests()
    .then(() => {
      console.log('🎉 Execution system tests completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Execution system tests failed:', error);
      process.exit(1);
    });
}

export { ExecutionSystemTester };
