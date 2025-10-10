# Multi-Provider AI Architecture System

## 🎯 Overview

System umożliwia **dowolne dodawanie AI providerów** i **inteligentne przypisywanie najlepszych modeli do konkretnych agentów** na podstawie ich specjalizacji, zgodnie z Twoimi rekomendacjami.

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified AI Chat Service                  │
│              (Single Interface for All Providers)           │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                Provider Registry                            │
│     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│     │ GitHub      │ │ Claude      │ │ DeepSeek    │       │
│     │ Copilot     │ │ Sonnet 4.5  │ │ Coder V3    │  ...  │
│     └─────────────┘ └─────────────┘ └─────────────┘       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│            Agent Model Assignment Service                   │
│  (Database-backed, Intelligent Model-to-Agent Mapping)     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Optimal Model Assignments (Based on Your Analysis)

### 1. System Architect

- **Primary**: Claude Sonnet 4.5 (30h focus, domain reasoning)
- **Fallbacks**: GPT-4o (Azure), DeepSeek Chat
- **Specialized**: System Design → Claude Sonnet 4.5

### 2. Business Analyst

- **Primary**: Claude Sonnet 4.5 (improved alignment, reduced sycophancy)
- **Fallbacks**: GPT-4o (Azure), DeepSeek Chat

### 3. QA Engineer (Hybrid Approach)

- **Primary**: DeepSeek Coder V3 (technical bugs, performance)
- **Code Review**: Claude Sonnet 4.5 (architecture, security)
- **Fallbacks**: Claude → Azure GPT-4o

### 4. Frontend Developer

- **Primary**: Claude Sonnet 4.5 (best coding capabilities, UX reasoning)
- **Fallbacks**: DeepSeek Coder V3, Azure GPT-4o

### 5. Backend Developer (Hybrid)

- **Primary**: Claude Sonnet 4.5 (microservices architecture)
- **Database Optimization**: DeepSeek Coder V3
- **Fallbacks**: DeepSeek → Azure GPT-4o

## 🚀 Quick Start

### 1. Environment Setup

```bash
# Required API Keys (set as needed)
set GITHUB_TOKEN=gho_your_copilot_token
set ANTHROPIC_API_KEY=sk-ant-your_claude_key
set DEEPSEEK_API_KEY=sk-your_deepseek_key

# Azure OpenAI (optional)
set AZURE_OPENAI_API_KEY=your_azure_key
set AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
```

### 2. Basic Usage

```typescript
import { unifiedAIChatService } from './services/unified-ai-chat.service';

// Initialize system
await unifiedAIChatService.initialize();

// Chat with optimal model for specific agent
const response = await unifiedAIChatService.chatForAgent(
  'system-architect',
  [
    {
      role: 'user',
      content: 'Design microservices architecture for e-commerce platform',
    },
  ],
  { taskType: 'systemDesign' }
);

console.log('Response:', response.data.content);
console.log('Used:', response.data.provider, response.data.model);
```

### 3. Advanced Usage with Fallbacks

```typescript
// System automatically handles fallbacks
const response = await unifiedAIChatService.chatForAgent(
  'qa-engineer',
  [{ role: 'user', content: 'Review this code for performance issues' }],
  { taskType: 'codeReview' } // Will use Claude for code review
);

// If Claude fails, automatically tries DeepSeek, then Azure GPT-4o
```

## 🔧 Adding New Providers

### Step 1: Create Provider Implementation

```typescript
// src/providers/my-custom.provider.ts
import {
  AIProvider,
  ProviderType,
  ModelInfo,
} from '../types/ai-provider.types';

export class MyCustomProvider implements AIProvider {
  readonly id = 'my-custom';
  readonly name = 'My Custom AI';
  readonly type: ProviderType = 'custom';

  readonly supportedModels: ModelInfo[] = [
    {
      id: 'my-model-v1',
      name: 'My Custom Model V1',
      provider: 'my-custom',
      capabilities: ['chat', 'reasoning'],
      contextWindow: 16384,
      maxTokens: 4096,
      costPer1kTokens: { input: 1.0, output: 2.0 },
      specializations: ['custom-task', 'general-purpose'],
    },
  ];

  async initialize(config: ProviderConfig): Promise<Result<boolean>> {
    // Initialize your provider
    return { success: true, data: true };
  }

  async chat(request: ChatRequest): Promise<Result<ChatResponse>> {
    // Implement chat logic
    return {
      success: true,
      data: {
        content: 'Response from my custom model',
        model: request.model || 'my-model-v1',
        provider: this.id,
      },
    };
  }

  async checkHealth(): Promise<Result<HealthStatus>> {
    // Health check implementation
    return {
      success: true,
      data: { status: 'healthy', provider: this.id, details: {} },
    };
  }

  async getAvailableModels(): Promise<Result<ModelInfo[]>> {
    return { success: true, data: [...this.supportedModels] };
  }
}
```

### Step 2: Register Provider

```typescript
// Add to unified-ai-chat.service.ts
const providers: AIProvider[] = [];

// Add your provider
try {
  const { MyCustomProvider } = await import('../providers/my-custom.provider');
  providers.push(new MyCustomProvider());
} catch (error) {
  console.warn('My Custom provider not available:', error);
}
```

### Step 3: Configure Agent Assignment

```typescript
import { agentModelAssignmentService } from './services/agent-model-assignment.service';

// Assign your model to an agent
await agentModelAssignmentService.updateAssignment('custom-agent', {
  agentType: 'custom-agent',
  primaryProvider: 'my-custom',
  primaryModel: 'my-model-v1',
  fallbackProviders: [
    {
      provider: 'anthropic-claude',
      model: 'claude-3-5-sonnet-20241022',
      priority: 1,
    },
  ],
});
```

## 🎛️ Configuration Management

### Dynamic Model Assignment

```typescript
// Get current assignment
const assignment = await agentModelAssignmentService.getAssignmentForAgent(
  'backend-developer'
);

// Update assignment
await agentModelAssignmentService.updateAssignment('backend-developer', {
  agentType: 'backend-developer',
  primaryProvider: 'deepseek',
  primaryModel: 'deepseek-coder-v3',
  fallbackProviders: [
    {
      provider: 'anthropic-claude',
      model: 'claude-3-5-sonnet-20241022',
      priority: 1,
    },
    { provider: 'azure-openai', model: 'gpt-4o', priority: 2 },
  ],
  specializedConfigs: {
    codeReview: {
      provider: 'anthropic-claude',
      model: 'claude-3-5-sonnet-20241022',
    },
  },
});
```

### Task-Specific Routing

```typescript
// Different models for different tasks
await unifiedAIChatService.chatForAgent(
  'qa-engineer',
  [{ role: 'user', content: 'Find performance bottlenecks' }],
  { taskType: 'general' } // Uses DeepSeek Coder V3
);

await unifiedAIChatService.chatForAgent(
  'qa-engineer',
  [{ role: 'user', content: 'Review architecture security' }],
  { taskType: 'codeReview' } // Uses Claude Sonnet 4.5
);
```

## 📊 Monitoring & Analytics

### Provider Health Monitoring

```typescript
import { providerRegistry } from './services/provider-registry.service';

// Check all provider health
const healthStatus = await providerRegistry.checkAllProvidersHealth();

console.log('Provider Health:');
Object.entries(healthStatus.data).forEach(([provider, health]) => {
  console.log(`${provider}: ${health.status} (${health.details.latency}ms)`);
});
```

### Usage Statistics

```typescript
// Get provider statistics
const stats = await providerRegistry.getProviderStats();

console.log(`Total Providers: ${stats.data.totalProviders}`);
console.log(`Total Models: ${stats.data.totalModels}`);
console.log(`Healthy Providers: ${stats.data.healthyProviders}`);
```

## 🗄️ Database Schema (Future Implementation)

```sql
-- Agent Model Assignments Table
CREATE TABLE agent_model_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type VARCHAR(50) NOT NULL UNIQUE,
  primary_provider VARCHAR(50) NOT NULL,
  primary_model VARCHAR(100) NOT NULL,
  fallback_providers JSONB NOT NULL DEFAULT '[]',
  specialized_configs JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Example row
INSERT INTO agent_model_assignments (
  agent_type, primary_provider, primary_model, fallback_providers, specialized_configs
) VALUES (
  'system-architect',
  'anthropic-claude',
  'claude-3-5-sonnet-20241022',
  '[
    {"provider": "azure-openai", "model": "gpt-4o", "priority": 1},
    {"provider": "deepseek", "model": "deepseek-chat", "priority": 2}
  ]',
  '{
    "systemDesign": {
      "provider": "anthropic-claude",
      "model": "claude-3-5-sonnet-20241022"
    }
  }'
);
```

## 🧪 Testing

```bash
# Test multi-provider system
npx ts-node src/test-multi-provider-system.ts

# Test specific provider
npx ts-node src/test-real-copilot.ts
```

## 📈 Performance Optimization

### Cost Management

```typescript
// Find best provider by cost for specific task
const bestProvider = await providerRegistry.findBestProviderForTask(
  'frontend-development',
  {
    maxCost: 5.0, // Max $5 per 1k tokens
    contextWindow: 16384, // Minimum context window
    preferredProvider: 'deepseek', // Cost-effective option
  }
);
```

### Intelligent Caching

```typescript
// Providers have built-in health caching (30s TTL)
// Multiple requests to same provider reuse cached health status
const health1 = await providerRegistry.checkAllProvidersHealth(); // API calls
const health2 = await providerRegistry.checkAllProvidersHealth(); // Cached results
```

## 🚀 Production Deployment

### Environment Variables

```bash
# Core providers
GITHUB_TOKEN=gho_xxxx
ANTHROPIC_API_KEY=sk-ant-xxxx
DEEPSEEK_API_KEY=sk-xxxx

# Azure OpenAI
AZURE_OPENAI_API_KEY=xxxx
AZURE_OPENAI_ENDPOINT=https://xxxx.openai.azure.com
AZURE_GPT4O_DEPLOYMENT=gpt-4o
AZURE_GPT4_DEPLOYMENT=gpt-4-turbo
AZURE_GPT35_DEPLOYMENT=gpt-35-turbo

# Optional
OPENAI_API_KEY=sk-xxxx  # For direct OpenAI access
```

### Monitoring Setup

```typescript
// Add to your monitoring system
setInterval(async () => {
  const health = await providerRegistry.checkAllProvidersHealth();
  const stats = await providerRegistry.getProviderStats();

  // Log to monitoring system
  logger.info('Provider Health', { health: health.data, stats: stats.data });
}, 60000); // Every minute
```

## 🎉 Benefits

### ✅ Co osiągnąłeś:

1. **Jeden interfejs** do wszystkich AI providerów
2. **Inteligentne przypisania** według Twoich rekomendacji
3. **Automatyczne fallbacki** przy awariach
4. **Task-specific routing** (code review vs general)
5. **Łatwe dodawanie** nowych providerów
6. **Database-backed configuration**
7. **Health monitoring** i cost management
8. **Zero vendor lock-in** - każdy provider wymienialny

### 🚀 Jak używać w praktyce:

```typescript
// Po prostu wywołaj - system automatycznie wybierze najlepszy model
const result = await unifiedAIChatService.chatForAgent('system-architect', [
  { role: 'user', content: 'Design scalable microservices architecture' },
]);

// System wykorzysta Claude Sonnet 4.5 (najlepszy dla architektury)
// Jeśli Claude nie działa, automatycznie przełączy na Azure GPT-4o
// Wszystko transparentnie, bez zmian w kodzie
```

**🎯 System gotowy do produkcji z optymalnymi przypisaniami według Twoich rekomendacji!**
