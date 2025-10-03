# 🚀 Copilot Task Processor

**Enterprise-grade task automation system with AI integration**

Automates the complete development workflow from Jira ticket analysis to tested pull request creation using GitHub Copilot and MCP (Model Context Protocol).

## ✨ Features

- 🎯 **Automated Workflow**: Jira → Analysis → Mockups → Code → Tests → PR
- 🤖 **AI Integration**: GitHub Copilot + MCP for intelligent code generation  
- 🏗️ **Enterprise Architecture**: Type-safe, tested, monitored, scalable
- 🔄 **Batch Processing**: Handle multiple tickets simultaneously
- 📊 **Comprehensive Metrics**: Coverage, complexity, performance tracking
- 🛡️ **Security First**: Rate limiting, validation, error handling

## 🏁 Quick Start

### 1. Installation

```bash
# Clone and setup
git clone <your-repo>
cd copilot-task-processor
npm install

# Copy environment template
cp .env.example .env
```

### 2. Configuration

Edit `.env` file with your credentials:

```bash
# Jira
JIRA_HOST=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-token

# GitHub  
GITHUB_TOKEN=your-github-token
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
```

### 3. Process Your First Task

```bash
# Single task processing
npm run start process PROJ-123

# Batch processing  
npm run start batch --query "project = PROJ AND status = 'To Do'"

# Health check
npm run start health
```

## 🎯 Workflow Process

### Automated Steps

1. **📋 Jira Analysis** - Fetch and analyze ticket requirements
2. **🎨 Mockup Generation** - Create UI wireframes and user flows  
3. **🌿 Branch Creation** - Generate feature branch: `feat/PROJ-123-feature-name`
4. **💻 Code Generation** - AI-powered implementation with best practices
5. **🧪 Test Creation** - Comprehensive test suite (unit + integration + E2E)
6. **✅ Quality Validation** - Automated code quality and security checks
7. **📤 PR Creation** - Generate pull request to `development` branch
8. **🔄 Jira Update** - Update ticket status and add PR link

### Generated Branch Structure

```
feat/PROJ-123-user-authentication/
├── src/features/user-auth/
│   ├── index.ts                 # Main implementation
│   ├── types.ts                 # Type definitions  
│   ├── service.ts               # Business logic
│   └── utils.ts                 # Helper functions
├── tests/
│   ├── unit/user-auth.test.ts   # Unit tests
│   ├── integration/auth.test.ts # Integration tests  
│   └── e2e/auth-flow.spec.ts    # E2E tests
└── docs/
    ├── mockups.md               # Generated UI mockups
    └── architecture.md          # Implementation notes
```

## 🔧 CLI Commands

### Core Operations

```bash
# Process single task
npm run start process <ISSUE-KEY> [options]
  --dry-run          # Preview without changes
  --verbose          # Detailed logging

# Batch processing
npm run start batch [options]
  --query <JQL>      # Custom JQL query
  --limit <N>        # Max tasks to process

# System management  
npm run start health          # Health checks
npm run start config --show   # Show configuration
```

### Development

```bash
# Development server
npm run dev

# Testing
npm test              # Unit tests
npm run test:e2e      # E2E tests  
npm run test:watch    # Watch mode

# Code quality
npm run lint          # ESLint
npm run format        # Prettier
npm run typecheck     # TypeScript
```

## 🏗️ Architecture

### Enterprise-Grade Structure

```
copilot-task-processor/
├── src/
│   ├── index.ts                    # Main CLI entry
│   ├── processors/
│   │   └── task-processor.ts       # Core workflow engine
│   ├── integrations/
│   │   ├── jira-integration.ts     # Jira API client
│   │   └── github-integration.ts   # GitHub API client
│   ├── mcp/
│   │   └── mcp-server.ts          # MCP server for Copilot
│   ├── generators/
│   │   ├── mockup-generator.ts    # UI mockup generation
│   │   ├── code-generator.ts      # AI code generation
│   │   └── test-generator.ts      # Test suite generation
│   ├── utils/
│   │   ├── logger.ts              # Enterprise logging
│   │   ├── retry-manager.ts       # Retry logic
│   │   └── rate-limiter.ts        # API rate limiting
│   └── config/
│       └── config-manager.ts      # Configuration management
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests  
│   └── e2e/           # End-to-end tests
└── docs/              # Documentation
```

### Technology Stack

- **Runtime**: Node.js 18+ with TypeScript 5.0+
- **AI Integration**: GitHub Copilot + MCP SDK
- **APIs**: Jira REST API v3, GitHub REST API v4  
- **Testing**: Jest (unit/integration) + Playwright (E2E)
- **Code Quality**: ESLint + Prettier + Husky
- **Monitoring**: Winston logging + Health checks

## 📊 Metrics & Quality

### Automated Quality Assurance

- ✅ **Test Coverage**: Minimum 80% required
- ✅ **Type Safety**: Strict TypeScript enforcement
- ✅ **Code Quality**: ESLint with enterprise rules
- ✅ **Security**: Automated vulnerability scanning
- ✅ **Performance**: Bundle size and execution time monitoring

### Generated Metrics

Each processed task provides:

```json
{
  "task": "PROJ-123",
  "metrics": {
    "processingTime": "2.3s",
    "linesOfCode": 247,
    "testCoverage": 87,
    "complexity": 6,
    "securityIssues": 0,
    "performanceScore": 95
  }
}
```

## 🛠️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JIRA_HOST` | Atlassian instance URL | ✅ |
| `JIRA_EMAIL` | Jira user email | ✅ |  
| `JIRA_API_TOKEN` | Jira API token | ✅ |
| `GITHUB_TOKEN` | GitHub personal access token | ✅ |
| `GITHUB_OWNER` | Repository owner | ✅ |
| `GITHUB_REPO` | Repository name | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for AI features | ⚪ |

### Advanced Configuration

```typescript
// Custom processor configuration
const config = {
  workflow: {
    autoCreateBranches: true,
    autoCreatePRs: true,  
    requireTests: true,
    minTestCoverage: 80,
    targetBranch: 'development'
  },
  ai: {
    model: 'gpt-4',
    temperature: 0.3,
    maxTokens: 4000
  }
};
```

## 🔐 Security

### Enterprise Security Features

- 🛡️ **API Rate Limiting**: Prevents API abuse
- 🔒 **Token Validation**: Secure credential handling  
- 📝 **Audit Logging**: Complete operation tracking
- ⚠️ **Error Sanitization**: No sensitive data in logs
- 🚫 **Input Validation**: Zod schema validation

## 📈 Monitoring

### Health Checks

```bash
npm run start health
```

Monitors:
- ✅ Jira connectivity and permissions
- ✅ GitHub API access and rate limits  
- ✅ MCP server status
- ✅ Configuration validity
- ✅ System resources

### Logging

Enterprise-grade structured logging:

```typescript
{
  "timestamp": "2024-10-03T20:21:25.000Z",
  "level": "info", 
  "service": "copilot-task-processor",
  "message": "Task PROJ-123 processed successfully",
  "metadata": {
    "issueKey": "PROJ-123",
    "duration": 2300,
    "branch": "feat/PROJ-123-user-auth",
    "pullRequest": "https://github.com/owner/repo/pull/456"
  }
}
```

## 🚀 Deployment

### Docker Support

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["npm", "start"]
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint  
      - run: npm test
      - run: npm run test:e2e
```

## 🤝 Contributing

### Development Workflow

1. **Fork & Clone**: Fork repo and clone locally
2. **Branch**: Create feature branch from `main`
3. **Develop**: Write code following TypeScript/ESLint standards
4. **Test**: Ensure 80%+ coverage with `npm test`  
5. **Commit**: Use conventional commits (`feat:`, `fix:`, etc.)
6. **PR**: Submit pull request to `main` branch

### Code Standards

- **TypeScript**: Strict mode enabled
- **Testing**: Jest + Playwright with 80%+ coverage
- **Linting**: ESLint with enterprise rules
- **Formatting**: Prettier with consistent style
- **Commits**: Conventional commit format

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🆘 Support  

### Documentation
- 📚 [API Documentation](docs/api/)
- 🔧 [Configuration Guide](docs/configuration.md)
- 🚀 [Deployment Guide](docs/deployment.md)

### Issues & Support
- 🐛 [Report Bugs](https://github.com/dapio/copilot-task-processor/issues)  
- 💡 [Request Features](https://github.com/dapio/copilot-task-processor/discussions)
- 📧 Email: support@your-domain.com

---

**Built with ❤️ using GitHub Copilot and enterprise-grade practices**