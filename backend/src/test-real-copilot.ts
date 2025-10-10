/**
 * Test Real GitHub Copilot Provider
 * Quick test to validate the integration
 */

import {
  createRealGitHubCopilotService,
  RealGitHubCopilotService,
} from './services/real-github-copilot.service';

// Type definitions for test
interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
}

interface ModelInfo {
  id: string;
  name: string;
  capabilities: string[];
}

/**
 * Get available GitHub tokens from environment
 */
function getGitHubTokens(): string[] {
  return [
    process.env.GITHUB_TOKEN,
    process.env.GITHUB_COPILOT_API_KEY,
    process.env.GH_TOKEN,
  ].filter(Boolean) as string[];
}

/**
 * Test service initialization
 */
async function testServiceInitialization(
  service: RealGitHubCopilotService
): Promise<boolean> {
  console.log('📋 Test 1: Initializing service...');
  const initResult = await service.initialize();

  if (!initResult.success) {
    console.log(
      '❌ Initialization failed:',
      'error' in initResult ? initResult.error.message : 'Unknown error'
    );
    return false;
  }
  console.log('✅ Service initialized successfully');
  return true;
}

/**
 * Test service health check
 */
async function testHealthCheck(
  service: RealGitHubCopilotService
): Promise<boolean> {
  console.log('📋 Test 2: Checking service health...');
  const healthResult = await service.checkHealth();

  if (!healthResult.success) {
    console.log(
      '❌ Health check failed:',
      'error' in healthResult ? healthResult.error.message : 'Unknown error'
    );
    return false;
  }

  console.log('✅ Health check passed:');
  console.log(`   Status: ${healthResult.data.status}`);
  console.log(`   Has Access: ${healthResult.data.details.hasAccess}`);
  console.log(`   Plan: ${healthResult.data.details.plan}`);
  console.log(`   Chat Enabled: ${healthResult.data.details.chatEnabled}`);
  console.log(`   Username: ${healthResult.data.details.username}`);
  return true;
}

/**
 * Test getting available providers
 */
async function testProviders(
  service: RealGitHubCopilotService
): Promise<boolean> {
  console.log('📋 Test 3: Getting available providers...');
  const providersResult = await service.getAvailableProviders();

  if (!providersResult.success) {
    console.log(
      '❌ Failed to get providers:',
      'error' in providersResult
        ? providersResult.error.message
        : 'Unknown error'
    );
    return false;
  }

  console.log('✅ Providers fetched:');
  providersResult.data.forEach((provider: ProviderConfig) => {
    console.log(
      `   - ${provider.name} (${provider.id}): ${
        provider.enabled ? 'Enabled' : 'Disabled'
      }`
    );
  });
  return true;
}

/**
 * Test getting available models
 */
async function testModels(service: RealGitHubCopilotService): Promise<boolean> {
  console.log('📋 Test 4: Getting available models...');
  const modelsResult = await service.getModels();

  if (!modelsResult.success) {
    console.log(
      '❌ Failed to get models:',
      'error' in modelsResult ? modelsResult.error.message : 'Unknown error'
    );
    return false;
  }

  console.log('✅ Models fetched:');
  modelsResult.data.forEach((model: ModelInfo) => {
    console.log(
      `   - ${model.name} (${model.id}): [${model.capabilities.join(', ')}]`
    );
  });
  return true;
}

/**
 * Test chat functionality
 */
async function testChat(service: RealGitHubCopilotService): Promise<boolean> {
  console.log('📋 Test 5: Testing chat functionality...');
  const chatResult = await service.chat({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful coding assistant. Respond concisely.',
      },
      {
        role: 'user',
        content:
          'Hello! Can you help me write a simple TypeScript function that adds two numbers?',
      },
    ],
    temperature: 0.1,
    maxTokens: 150,
  });

  if (!chatResult.success) {
    console.log(
      '❌ Chat request failed:',
      'error' in chatResult ? chatResult.error.message : 'Unknown error'
    );
    return false;
  }

  console.log('✅ Chat response received:');
  console.log(
    `   Content: ${chatResult.data.content.substring(0, 200)}${
      chatResult.data.content.length > 200 ? '...' : ''
    }`
  );
  if (chatResult.data.usage) {
    console.log(
      `   Usage: ${chatResult.data.usage.promptTokens} + ${chatResult.data.usage.completionTokens} = ${chatResult.data.usage.totalTokens} tokens`
    );
  }
  return true;
}

/**
 * Run all tests for a service instance
 */
async function runTestsForService(
  service: RealGitHubCopilotService
): Promise<boolean> {
  const tests = [
    testServiceInitialization,
    testHealthCheck,
    testProviders,
    testModels,
    testChat,
  ];

  for (const test of tests) {
    const success = await test(service);
    if (!success) {
      return false;
    }
  }

  return true;
}

/**
 * Main test function
 */
async function testRealGitHubCopilotProvider(): Promise<void> {
  console.log('🚀 Testing Real GitHub Copilot Provider...\n');

  const tokenSources = getGitHubTokens();

  if (tokenSources.length === 0) {
    console.log('❌ No GitHub token found in environment variables');
    console.log(
      'Please set one of: GITHUB_TOKEN, GITHUB_COPILOT_API_KEY, or GH_TOKEN'
    );
    return;
  }

  for (const token of tokenSources) {
    console.log(`🔑 Testing with token: ${token.substring(0, 8)}...`);

    try {
      const service = createRealGitHubCopilotService(token);
      const success = await runTestsForService(service);

      if (success) {
        console.log(
          '\n🎉 All tests passed! Real GitHub Copilot Provider is working correctly!'
        );
        return; // Success, no need to try other tokens
      }
    } catch (error) {
      console.log(
        '❌ Unexpected error:',
        error instanceof Error ? error.message : String(error)
      );
      continue;
    }
  }

  console.log(
    '\n💥 All token sources failed. Please check your GitHub token and Copilot subscription.'
  );
}

// Run the test
if (require.main === module) {
  testRealGitHubCopilotProvider()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('💥 Test failed with unexpected error:', error);
      process.exit(1);
    });
}

export { testRealGitHubCopilotProvider };
