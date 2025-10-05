# Enhanced Multi-Provider System - Deployment Guide

## 🚀 System Overview

Enhanced Multi-Provider System to zaawansowany system AI z GitHub Copilot jako głównym providerem, zintegrowany z ThinkCode AI Platform. System oferuje:

- **GitHub Copilot jako Primary Provider** - główny dostawca AI z pełnym wsparciem kontekstu
- **Multi-Provider Architecture** - możliwość dodawania kolejnych providerów AI
- **Context Management** - zarządzanie kontekstami projektu i agentów (jak w VS Code)
- **Chat Integration** - zintegrowany chat z dostępem do pełnego kontekstu
- **Centralized Workflow Control** - centralnie sterowane przepływy pracy

## 📋 Prerequisites

1. **Node.js 18+** - System wymaga Node.js w wersji 18 lub wyższej
2. **TypeScript** - Kompilacja kodu TypeScript
3. **GitHub Copilot Access** - Dostęp do GitHub Copilot API (opcjonalne - system ma mock responses)
4. **Database** - PostgreSQL lub SQLite (skonfigurowane w Prisma)

## 🛠️ Quick Start

### 1. Installation

```bash
# Clone repository i przejdź do folderu
cd c:\Work\WeSub\copilot-task-processor

# Zainstaluj dependencies
npm install

# Zainstaluj dependencies dla backend
cd backend && npm install && cd ..
```

### 2. Environment Setup

Stwórz plik `.env` w głównym katalogu:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/thinkcode_ai"
# lub dla SQLite:
# DATABASE_URL="file:./dev.db"

# GitHub Copilot API (opcjonalne - system działa z mockami)
GITHUB_COPILOT_API_URL="https://api.githubcopilot.com"
GITHUB_COPILOT_API_KEY="your_api_key_here"

# Server Configuration
AGENTS_PORT=3003
NODE_ENV=development

# Logging
LOG_LEVEL=info
```

### 3. Database Setup

```bash
# Jeśli używasz Prisma (zalecane)
npx prisma generate
npx prisma db push
```

### 4. Build System

```bash
# Build całego systemu
npm run setup:full
```

### 5. Start Server

```bash
# Development mode
npm run agents:dev

# Production mode
npm run agents:build
npm run agents:start
```

Server będzie dostępny na: `http://localhost:3003`

## 🧪 Testing System

### Uruchom kompletny test systemu:

```bash
npm run test:enhanced-system
```

Test sprawdzi wszystkie komponenty:

- ✅ System Health Check
- ✅ Provider Management (GitHub Copilot)
- ✅ Context Management (Project & Agent)
- ✅ Chat Integration
- ✅ Workflow Execution

### Manual API Testing

```bash
# System Health
curl http://localhost:3003/api/enhanced/health

# Available Providers
curl http://localhost:3003/api/enhanced/providers

# Test GitHub Copilot
curl -X POST http://localhost:3003/api/enhanced/providers/github-copilot/test \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a simple function"}'
```

## 📚 API Documentation

### Core Endpoints

#### System Health

```
GET /api/enhanced/health
```

#### Providers Management

```
GET /api/enhanced/providers
POST /api/enhanced/providers/{providerId}/test
GET /api/enhanced/providers/{providerId}/health
```

#### Context Management

```
POST /api/enhanced/contexts/project
POST /api/enhanced/contexts/agent
GET /api/enhanced/contexts/{contextId}
GET /api/enhanced/contexts/{contextId}/full
```

#### Chat Integration

```
POST /api/enhanced/chat/sessions
POST /api/enhanced/chat/sessions/{sessionId}/message
GET /api/enhanced/chat/sessions/{sessionId}/history
GET /api/enhanced/chat/sessions/{sessionId}/stats
```

#### Workflow Control

```
GET /api/enhanced/workflows/templates
POST /api/enhanced/workflows/execute
GET /api/enhanced/workflows/executions/{executionId}/status
```

## 🔧 Configuration

### Provider Configuration

GitHub Copilot Provider może być skonfigurowany w `backend/src/providers/github-copilot.provider.ts`:

```typescript
const config = {
  apiUrl: process.env.GITHUB_COPILOT_API_URL || 'https://api.githubcopilot.com',
  apiKey: process.env.GITHUB_COPILOT_API_KEY,
  defaultModel: 'gpt-4',
  maxTokens: 4096,
  temperature: 0.7,
  enableMockResponses: !process.env.GITHUB_COPILOT_API_KEY, // Auto-enable mocks if no API key
};
```

### Context Configuration

Context Manager można skonfigurować w `backend/src/services/context-manager.ts`:

```typescript
const config = {
  maxContextSize: 100000, // Max characters in context
  maxMessages: 1000, // Max messages per context
  sessionTimeout: 3600000, // 1 hour timeout
  autoCleanup: true, // Auto cleanup old contexts
};
```

## 🏗️ Architecture

```
Enhanced Multi-Provider System
├── GitHub Copilot Provider (Primary)
│   ├── Context Management Integration
│   ├── Health Monitoring
│   └── Mock Response Fallback
├── Context Management System
│   ├── Project Contexts
│   ├── Agent Contexts
│   └── Session Management
├── Chat Integration Service
│   ├── Multi-Provider Chat Sessions
│   ├── Context-Aware Messaging
│   └── Provider Coordination
├── Enhanced Workflow Controller
│   ├── Provider Selection Strategies
│   ├── Workflow Templates
│   └── Execution Orchestration
└── API Layer
    ├── REST Endpoints
    ├── Validation & Error Handling
    └── Response Formatting
```

## 🔐 Security Considerations

1. **API Keys**: Przechowuj API keys w zmiennych środowiskowych
2. **Input Validation**: Wszystkie inputy są walidowane przez Zod schemas
3. **Error Handling**: Błędy są kategoryzowane i nie ujawniają wrażliwych informacji
4. **Context Isolation**: Konteksty projektów i agentów są izolowane
5. **Rate Limiting**: Implementuj rate limiting dla API endpoints w production

## 📊 Monitoring & Logging

System wykorzystuje strukturalne logowanie:

```typescript
// Enable detailed logging
LOG_LEVEL=debug npm run agents:dev

// Monitor health metrics
curl http://localhost:3003/api/enhanced/health
```

## 🚀 Production Deployment

### 1. Environment Variables

```env
NODE_ENV=production
AGENTS_PORT=3003
DATABASE_URL="postgresql://user:password@prod-db:5432/thinkcode_ai"
GITHUB_COPILOT_API_KEY="prod_api_key"
LOG_LEVEL=info
```

### 2. Process Management

```bash
# Using PM2
npm install -g pm2
npm run agents:build
pm2 start backend/dist/agents-server.js --name "enhanced-ai-system"

# Using Docker
docker build -t enhanced-ai-system .
docker run -d -p 3003:3003 --env-file .env enhanced-ai-system
```

### 3. Nginx Configuration

```nginx
upstream ai_backend {
    server localhost:3003;
}

server {
    listen 80;
    server_name your-domain.com;

    location /api/enhanced/ {
        proxy_pass http://ai_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 Usage Examples

### Creating Project Context

```javascript
const response = await fetch(
  'http://localhost:3003/api/enhanced/contexts/project',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'My Project',
      projectId: 'proj-001',
      systemPrompt: 'You are working on a React TypeScript project.',
      workspace: {
        rootPath: '/path/to/project',
        includePatterns: ['**/*.ts', '**/*.tsx'],
        excludePatterns: ['**/node_modules/**'],
      },
    }),
  }
);

const { contextId } = await response.json();
```

### Chat with GitHub Copilot

```javascript
// Create chat session
const session = await fetch(
  'http://localhost:3003/api/enhanced/chat/sessions',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contextId: 'your-context-id',
      contextType: 'project',
      title: 'Code Review Session',
      activeProviders: ['github-copilot'],
    }),
  }
);

// Send message
const message = await fetch(
  `http://localhost:3003/api/enhanced/chat/sessions/${sessionId}/message`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Please review this React component and suggest improvements',
      provider: 'github-copilot',
      settings: {
        includeContext: true,
        maxTokens: 1000,
        temperature: 0.7,
      },
    }),
  }
);
```

### Execute Workflow

```javascript
const workflow = await fetch(
  'http://localhost:3003/api/enhanced/workflows/execute',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contextId: 'your-context-id',
      contextType: 'agent',
      enableChat: true,
      customSteps: [
        {
          name: 'analyze-code',
          type: 'ai_generation',
          provider: 'github-copilot',
          configuration: {
            prompt:
              'Analyze the code structure and identify potential improvements',
          },
        },
      ],
    }),
  }
);
```

## 📞 Support

Jeśli napotkasz problemy:

1. **Sprawdź logi**: `npm run agents:dev` dla szczegółowych logów
2. **Uruchom testy**: `npm run test:enhanced-system`
3. **Sprawdź health**: `curl http://localhost:3003/api/enhanced/health`
4. **Mock Mode**: System automatycznie przełącza się na mocki jeśli nie ma API key

## 🎯 Features Status

- ✅ **GitHub Copilot jako Primary Provider** - W pełni zaimplementowane
- ✅ **Multi-Provider Architecture** - Gotowe do dodawania nowych providerów
- ✅ **Context Management** - Project i Agent contexts jak w VS Code
- ✅ **Chat Integration** - Pełna integracja z kontekstami
- ✅ **Centralized Workflow Control** - Wszystkie workflow sterowane centralnie
- ✅ **Mock Development Mode** - Praca bez zewnętrznych API
- ✅ **Comprehensive Testing** - Kompletne testy wszystkich komponentów
- ✅ **Enterprise-Grade Error Handling** - Result<T,E> pattern
- ✅ **TypeScript Full Coverage** - 100% TypeScript z typami

**System jest gotowy do production deployment! 🚀**
