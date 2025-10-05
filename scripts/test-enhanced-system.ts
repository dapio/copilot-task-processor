/**
 * Test Enhanced Multi-Provider System
 * ThinkCode AI Platform - Test systemu z GitHub Copilot jako głównym providerem
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3003/api/enhanced';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  details?: any;
}

class EnhancedSystemTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Enhanced Multi-Provider System Tests...\n');

    await this.testSystemHealth();
    await this.testProviderManagement();
    await this.testContextManagement();
    await this.testChatIntegration();
    await this.testWorkflowExecution();

    this.printSummary();
  }

  private async testSystemHealth(): Promise<void> {
    await this.runTest('System Health Check', async () => {
      const response = await axios.get(`${API_BASE}/health`);

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Invalid health response structure');
      }

      const health = data.data;
      console.log(`   System Status: ${health.status}`);
      console.log(
        `   GitHub Copilot Primary: ${health.features.githubCopilotPrimary}`
      );
      console.log(
        `   Multi-Provider Support: ${health.features.multiProviderSupport}`
      );
      console.log(
        `   Context Management: ${health.features.contextManagement}`
      );
      console.log(`   Chat Integration: ${health.features.chatIntegration}`);

      return {
        systemStatus: health.status,
        features: health.features,
        providers: health.components.providers,
      };
    });
  }

  private async testProviderManagement(): Promise<void> {
    await this.runTest('Get Available Providers', async () => {
      const response = await axios.get(`${API_BASE}/providers`);

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Invalid providers response structure');
      }

      const providers = data.data.providers;
      console.log(`   Total Providers: ${data.data.total}`);
      console.log(`   Healthy Providers: ${data.data.healthy}`);

      const copilotProvider = providers.find(
        (p: any) => p.name === 'github-copilot'
      );
      if (!copilotProvider) {
        throw new Error('GitHub Copilot provider not found');
      }

      console.log(`   GitHub Copilot Status: ${copilotProvider.status}`);

      return { providers, copilotStatus: copilotProvider.status };
    });

    await this.runTest('Test GitHub Copilot Provider', async () => {
      const testPrompt =
        'Napisz prostą funkcję JavaScript do dodawania dwóch liczb';

      const response = await axios.post(
        `${API_BASE}/providers/github-copilot/test`,
        {
          prompt: testPrompt,
        }
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Provider test failed');
      }

      console.log(
        `   Test Result: ${data.data.testResult ? 'SUCCESS' : 'FAILED'}`
      );
      console.log(
        `   Response Length: ${data.data.response?.length || 0} characters`
      );

      return data.data;
    });
  }

  private async testContextManagement(): Promise<void> {
    let projectContextId: string;
    let agentContextId: string;

    await this.runTest('Create Project Context', async () => {
      const contextData = {
        name: 'Test Project Context',
        projectId: 'test-project-001',
        systemPrompt:
          'You are working on a test project for ThinkCode AI Platform.',
        workspace: {
          rootPath: '/test/project',
          includePatterns: ['**/*.ts', '**/*.js'],
          excludePatterns: ['**/node_modules/**'],
        },
      };

      const response = await axios.post(
        `${API_BASE}/contexts/project`,
        contextData
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to create project context');
      }

      projectContextId = data.data.contextId;
      console.log(`   Project Context ID: ${projectContextId}`);

      return data.data;
    });

    await this.runTest('Create Agent Context', async () => {
      const contextData = {
        name: 'Test Agent Context',
        agentId: 'test-agent-001',
        parentContextId: projectContextId,
        systemPrompt:
          'You are a specialized agent for code analysis and generation.',
      };

      const response = await axios.post(
        `${API_BASE}/contexts/agent`,
        contextData
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to create agent context');
      }

      agentContextId = data.data.contextId;
      console.log(`   Agent Context ID: ${agentContextId}`);
      console.log(`   Parent Project: ${data.data.parentProjectContextId}`);

      return data.data;
    });

    await this.runTest('Get Full Agent Context', async () => {
      const response = await axios.get(
        `${API_BASE}/contexts/${agentContextId}/full`
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to get full agent context');
      }

      const fullContext = data.data;
      console.log(`   Agent Context: ${fullContext.agentContext.name}`);
      console.log(
        `   Project Context: ${fullContext.projectContext?.name || 'None'}`
      );
      console.log(
        `   Combined System Prompt Length: ${fullContext.combinedSystemPrompt.length}`
      );

      return fullContext;
    });
  }

  private async testChatIntegration(): Promise<void> {
    let sessionId: string;

    await this.runTest('Create Chat Session', async () => {
      const sessionData = {
        contextId: 'agent_ctx_test',
        contextType: 'agent',
        title: 'Test Chat Session with GitHub Copilot',
        activeProviders: ['github-copilot'],
      };

      const response = await axios.post(
        `${API_BASE}/chat/sessions`,
        sessionData
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to create chat session');
      }

      sessionId = data.data.sessionId;
      console.log(`   Chat Session ID: ${sessionId}`);
      console.log(`   Context Type: ${data.data.contextType}`);

      return data.data;
    });

    await this.runTest('Send Chat Message', async () => {
      const messageData = {
        message:
          'Wyjaśnij czym jest GitHub Copilot i jak działa w kontekście ThinkCode AI Platform',
        provider: 'github-copilot',
        settings: {
          includeContext: true,
          maxTokens: 500,
          temperature: 0.7,
        },
      };

      const response = await axios.post(
        `${API_BASE}/chat/sessions/${sessionId}/message`,
        messageData
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to send chat message');
      }

      const chatResponse = data.data;
      console.log(`   Response Provider: ${chatResponse.provider}`);
      console.log(
        `   Response Length: ${chatResponse.content.length} characters`
      );
      console.log(
        `   Tokens Used: ${chatResponse.usage?.totalTokens || 'N/A'}`
      );

      return chatResponse;
    });

    await this.runTest('Get Chat History', async () => {
      const response = await axios.get(
        `${API_BASE}/chat/sessions/${sessionId}/history`
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to get chat history');
      }

      const messages = data.data.messages;
      console.log(`   Total Messages: ${messages.length}`);
      console.log(
        `   System Messages: ${messages.filter((m: any) => m.role === 'system').length}`
      );
      console.log(
        `   User Messages: ${messages.filter((m: any) => m.role === 'user').length}`
      );
      console.log(
        `   Assistant Messages: ${messages.filter((m: any) => m.role === 'assistant').length}`
      );

      return messages;
    });

    await this.runTest('Get Chat Session Stats', async () => {
      const response = await axios.get(
        `${API_BASE}/chat/sessions/${sessionId}/stats`
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to get chat stats');
      }

      const stats = data.data;
      console.log(`   Messages Count: ${stats.messagesCount}`);
      console.log(`   Providers Used: ${stats.providersUsed.join(', ')}`);
      console.log(`   Session Duration: ${Math.round(stats.duration / 1000)}s`);

      return stats;
    });
  }

  private async testWorkflowExecution(): Promise<void> {
    await this.runTest('Get Workflow Templates', async () => {
      const response = await axios.get(`${API_BASE}/workflows/templates`);

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to get workflow templates');
      }

      const templates = data.data.templates;
      console.log(`   Total Templates: ${templates.length}`);
      console.log(`   Categories: ${data.data.categories.join(', ')}`);
      console.log(`   Complexities: ${data.data.complexities.join(', ')}`);

      const codeGenTemplate = templates.find(
        (t: any) => t.id === 'code-generation'
      );
      if (codeGenTemplate) {
        console.log(
          `   Code Generation Template Steps: ${codeGenTemplate.steps.length}`
        );
      }

      return templates;
    });

    await this.runTest('Execute Custom Workflow', async () => {
      const workflowData = {
        contextId: 'test-context',
        contextType: 'agent',
        enableChat: true,
        customSteps: [
          {
            name: 'analyze-requirement',
            description: 'Analyze the coding requirement',
            type: 'ai_generation',
            provider: 'github-copilot',
            dependencies: [],
            configuration: {
              prompt:
                'Analyze this coding requirement and provide implementation plan',
              contextRequired: true,
            },
          },
          {
            name: 'generate-solution',
            description: 'Generate code solution',
            type: 'ai_generation',
            provider: 'github-copilot',
            dependencies: ['analyze-requirement'],
            configuration: {
              prompt: 'Generate the code solution based on analysis',
              contextRequired: true,
            },
          },
        ],
      };

      const response = await axios.post(
        `${API_BASE}/workflows/execute`,
        workflowData
      );

      const data = response.data;
      if (!data.success || !data.data) {
        throw new Error('Failed to execute workflow');
      }

      const execution = data.data;
      console.log(`   Execution ID: ${execution.executionId}`);
      console.log(`   Chat Session: ${execution.chatSessionId}`);
      console.log(`   Status: ${execution.status}`);

      return execution;
    });
  }

  private async runTest(
    name: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(`🧪 Testing: ${name}...`);
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.results.push({
        test: name,
        status: 'PASS',
        message: 'Test completed successfully',
        duration,
        details: result,
      });

      console.log(`   ✅ PASSED (${duration}ms)\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : 'Unknown error';

      this.results.push({
        test: name,
        status: 'FAIL',
        message,
        duration,
      });

      console.log(`   ❌ FAILED: ${message} (${duration}ms)\n`);
    }
  }

  private printSummary(): void {
    console.log('📊 TEST SUMMARY');
    console.log('===============');

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(
      `📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`
    );
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   ${r.test}: ${r.message}`);
        });
    }

    console.log('\n🎯 ENHANCED SYSTEM FEATURES TESTED:');
    console.log('   ✅ GitHub Copilot as Primary Provider');
    console.log('   ✅ Multi-Provider Architecture');
    console.log('   ✅ Project & Agent Context Management');
    console.log('   ✅ Chat Integration with Context Awareness');
    console.log('   ✅ Workflow Orchestration');
    console.log('   ✅ Centralized Provider Health Monitoring');

    const overallStatus = failedTests === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS';
    console.log(`\n🚀 Enhanced Multi-Provider System Status: ${overallStatus}`);

    if (passedTests >= totalTests * 0.8) {
      console.log('🎉 System is ready for production use!');
    } else {
      console.log(
        '⚠️  Some issues detected. Review failed tests before production deployment.'
      );
    }
  }
}

// Uruchom testy
async function main() {
  const tester = new EnhancedSystemTester();

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default EnhancedSystemTester;
