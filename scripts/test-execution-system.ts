#!/usr/bin/env tsx

/**
 * Test Agent Execution System
 * ThinkCode AI Platform - Complete Test Suite
 */

import { PrismaClient } from '@prisma/client';
import { WorkflowOrchestrator } from '../backend/src/execution/workflow.orchestrator';
import { createMLProvider } from '../backend/src/providers/ml-provider.factory';

const prisma = new PrismaClient();

interface TestResults {
  success: boolean;
  details: string;
  duration: number;
  errors?: any[];
}

async function runExecutionTests(): Promise<void> {
  console.log('🚀 Starting Agent Execution System Tests\n');

  const tests: Array<() => Promise<TestResults>> = [
    testProviderCreation,
    testWorkflowCreation,
    testAgentAssignment,
    testStepExecution,
    testWorkflowExecution,
    testProviderFallback,
  ];

  let passedTests = 0;
  const totalTests = tests.length;

  for (const [index, test] of tests.entries()) {
    console.log(`📋 Test ${index + 1}/${totalTests}: ${test.name}`);

    try {
      const result = await test();

      if (result.success) {
        console.log(`✅ PASSED - ${result.details} (${result.duration}ms)\n`);
        passedTests++;
      } else {
        console.error(`❌ FAILED - ${result.details} (${result.duration}ms)`);
        if (result.errors) {
          console.error('Errors:', result.errors);
        }
        console.log();
      }
    } catch (error: any) {
      console.error(`💥 ERROR - Test crashed: ${error.message}\n`);
    }
  }

  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(
    `📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
  );

  if (passedTests === totalTests) {
    console.log(
      '\n🎉 All tests passed! Agent Execution System is working correctly.'
    );
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

/**
 * Test 1: Provider Creation
 */
async function testProviderCreation(): Promise<TestResults> {
  const startTime = Date.now();

  try {
    // Test OpenAI provider creation
    const openAIResult = await createMLProvider({
      name: 'test-openai',
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'mock-key',
      enabled: true,
      priority: 1,
      retryAttempts: 2,
      timeoutMs: 10000,
    });

    if (!openAIResult.success) {
      return {
        success: false,
        details: `OpenAI provider creation failed: ${openAIResult.error.message}`,
        duration: Date.now() - startTime,
        errors: [openAIResult.error],
      };
    }

    // Test provider health check
    const healthResult = await openAIResult.data.healthCheck();

    // Test mock provider fallback
    const mockResult = await createMLProvider({
      name: 'test-mock',
      type: 'mock',
      enabled: true,
      priority: 99,
      retryAttempts: 1,
      timeoutMs: 1000,
    });

    if (!mockResult.success) {
      return {
        success: false,
        details: `Mock provider creation failed: ${mockResult.error.message}`,
        duration: Date.now() - startTime,
        errors: [mockResult.error],
      };
    }

    return {
      success: true,
      details: `Providers created successfully. OpenAI: ${healthResult.success ? 'healthy' : 'fallback'}, Mock: available`,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      details: `Provider creation test failed: ${error.message}`,
      duration: Date.now() - startTime,
      errors: [error],
    };
  }
}

/**
 * Test 2: Workflow Creation
 */
async function testWorkflowCreation(): Promise<TestResults> {
  const startTime = Date.now();

  try {
    // Clean up existing test data
    await prisma.workflowStep.deleteMany({
      where: { workflow: { name: 'test-execution-workflow' } },
    });
    await prisma.workflow.deleteMany({
      where: { name: 'test-execution-workflow' },
    });

    // Create test workflow
    const workflow = await prisma.workflow.create({
      data: {
        name: 'test-execution-workflow',
        description: 'Test workflow for execution system',
        type: 'test',
        status: 'draft',
        steps: {
          create: [
            {
              stepNumber: 1,
              name: 'Analysis Step',
              description: 'Analyze input document',
              inputs: JSON.stringify({ document: 'test content' }),
              status: 'pending',
            },
            {
              stepNumber: 2,
              name: 'Generation Step',
              description: 'Generate output based on analysis',
              status: 'pending',
            },
          ],
        },
      },
      include: { steps: true },
    });

    return {
      success: true,
      details: `Workflow created with ID: ${workflow.id}, Steps: ${workflow.steps.length}`,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      details: `Workflow creation failed: ${error.message}`,
      duration: Date.now() - startTime,
      errors: [error],
    };
  }
}

/**
 * Test 3: Agent Assignment
 */
async function testAgentAssignment(): Promise<TestResults> {
  const startTime = Date.now();

  try {
    // Find test workflow
    const workflow = await prisma.workflow.findFirst({
      where: { name: 'test-execution-workflow' },
      include: { steps: true },
    });

    if (!workflow) {
      return {
        success: false,
        details: 'Test workflow not found',
        duration: Date.now() - startTime,
      };
    }

    // Create or find test agent
    let agent = await prisma.agent.findFirst({
      where: { name: 'test-execution-agent' },
    });

    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          name: 'test-execution-agent',
          description: 'Agent for testing execution system',
          role: 'test-agent',
          capabilities: JSON.stringify(['analysis', 'generation', 'testing']),
          isActive: true,
          currentWorkload: 0,
        },
      });
    }

    // Assign agent to all steps
    for (const step of workflow.steps) {
      await prisma.workflowStep.update({
        where: { id: step.id },
        data: { assignedAgentId: agent.id },
      });
    }

    return {
      success: true,
      details: `Agent ${agent.name} assigned to ${workflow.steps.length} steps`,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      details: `Agent assignment failed: ${error.message}`,
      duration: Date.now() - startTime,
      errors: [error],
    };
  }
}

/**
 * Test 4: Single Step Execution
 */
async function testStepExecution(): Promise<TestResults> {
  const startTime = Date.now();

  try {
    // Find test workflow step
    const step = await prisma.workflowStep.findFirst({
      where: {
        workflow: { name: 'test-execution-workflow' },
        stepNumber: 1,
      },
    });

    if (!step) {
      return {
        success: false,
        details: 'Test step not found',
        duration: Date.now() - startTime,
      };
    }

    // Create orchestrator and execute step
    const orchestrator = new WorkflowOrchestrator(prisma);
    const taskEngine = (orchestrator as any).taskEngine;

    const executionResult = await taskEngine.executeWorkflowStep(step.id);

    if (executionResult.success) {
      return {
        success: true,
        details: `Step executed successfully. Confidence: ${executionResult.data.confidence}, Duration: ${executionResult.data.duration}ms`,
        duration: Date.now() - startTime,
      };
    } else {
      return {
        success: false,
        details: `Step execution failed: ${executionResult.error.message}`,
        duration: Date.now() - startTime,
        errors: [executionResult.error],
      };
    }
  } catch (error: any) {
    return {
      success: false,
      details: `Step execution test failed: ${error.message}`,
      duration: Date.now() - startTime,
      errors: [error],
    };
  }
}

/**
 * Test 5: Complete Workflow Execution
 */
async function testWorkflowExecution(): Promise<TestResults> {
  const startTime = Date.now();

  try {
    // Find test workflow
    const workflow = await prisma.workflow.findFirst({
      where: { name: 'test-execution-workflow' },
    });

    if (!workflow) {
      return {
        success: false,
        details: 'Test workflow not found',
        duration: Date.now() - startTime,
      };
    }

    // Execute complete workflow
    const orchestrator = new WorkflowOrchestrator(prisma);
    const executionResult = await orchestrator.executeWorkflow(workflow.id, {
      continueOnError: true,
    });

    if (executionResult.success) {
      const result = executionResult.data;
      return {
        success: true,
        details: `Workflow executed: ${result.status}, Steps: ${result.completedSteps}/${result.totalSteps}, Duration: ${result.duration}ms`,
        duration: Date.now() - startTime,
      };
    } else {
      return {
        success: false,
        details: `Workflow execution failed: ${executionResult.error.message}`,
        duration: Date.now() - startTime,
        errors: [executionResult.error],
      };
    }
  } catch (error: any) {
    return {
      success: false,
      details: `Workflow execution test failed: ${error.message}`,
      duration: Date.now() - startTime,
      errors: [error],
    };
  }
}

/**
 * Test 6: Provider Fallback
 */
async function testProviderFallback(): Promise<TestResults> {
  const startTime = Date.now();

  try {
    // Test with invalid config to trigger fallback
    const { createMLProviderWithFallback } = await import(
      '../backend/src/providers/ml-provider.factory'
    );

    const fallbackResult = await createMLProviderWithFallback({
      name: 'invalid-provider',
      type: 'openai',
      apiKey: 'invalid-key',
      enabled: true,
      priority: 1,
      retryAttempts: 1,
      timeoutMs: 5000,
    });

    if (fallbackResult.success) {
      // Should get mock provider
      const provider = fallbackResult.data;
      const testResult = await provider.generateText('Hello test');

      return {
        success: true,
        details: `Fallback to ${provider.name} successful, generated response: ${testResult.success}`,
        duration: Date.now() - startTime,
      };
    } else {
      return {
        success: false,
        details: `Provider fallback failed: ${fallbackResult.error.message}`,
        duration: Date.now() - startTime,
        errors: [fallbackResult.error],
      };
    }
  } catch (error: any) {
    return {
      success: false,
      details: `Provider fallback test failed: ${error.message}`,
      duration: Date.now() - startTime,
      errors: [error],
    };
  }
}

// Run tests
runExecutionTests()
  .catch(error => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
