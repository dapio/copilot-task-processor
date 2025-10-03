# 🚀 Copilot Task Processor

> **Enterprise-grade automated development workflow orchestrator**  
> From Jira ticket → Mockups → Implementation → Tests → Pull Request

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🎯 What is This?

A universal, AI-powered task processor that automates your entire development workflow:

- 📋 **Jira Integration**: Automatically fetches and processes Jira tickets
- 🎨 **Smart Mockups**: Generates detailed UI/UX mockups before coding
- 🔄 **Git Automation**: Creates feature branches (`feat/{KEY}-{summary}`)
- 🧪 **TDD Workflow**: Tests-first development with 80%+ coverage
- 🔍 **Code Review**: AI-powered quality checks
- 🚢 **Auto PR**: Creates pull requests to development branch

## 🏗️ Architecture

```
┌─────────────────┐
│  Jira Ticket    │
└────────┬────────┘
         │
    ┌────▼─────┐
    │ Processor │◄──── Your Documentation
    └────┬─────┘
         │
    ┌────▼────────────────────────┐
    │ 1. Analyze Requirements     │
    │ 2. Generate Mockups         │
    │ 3. Create Git Branch        │
    │ 4. Write Tests (TDD)        │
    │ 5. Implement Features       │
    │ 6. Run Quality Checks       │
    │ 7. Create Pull Request      │
    └─────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

```bash
node >= 20.0.0
npm >= 10.0.0
git >= 2.40.0
```

### Installation

```bash
# Clone repository
git clone https://github.com/dapio/copilot-task-processor.git
cd copilot-task-processor

# Install dependencies
npm install

# Configure MCP servers
cp .mcp-config.example.json .mcp-config.json
# Edit with your Atlassian credentials

# Configure processor
cp config/processor.example.yaml config/processor.yaml
# Edit with your project settings
```

### Usage

```bash
# Process a single Jira ticket
npm run process -- --ticket PROJ-123

# Process with custom documentation
npm run process -- --ticket PROJ-123 --docs ./my-docs

# Batch process multiple tickets
npm run process:batch -- --filter "sprint = 'Sprint 42'"

# Interactive mode
npm run process:interactive
```

## 📁 Project Structure

```
copilot-task-processor/
├── src/
│   ├── core/                 # Core processor engine
│   │   ├── orchestrator.ts   # Main workflow orchestrator
│   │   ├── task-analyzer.ts  # Requirement analysis
│   │   └── quality-gate.ts   # Quality checks
│   ├── integrations/         # External integrations
│   │   ├── jira/            # Atlassian Jira MCP
│   │   ├── git/             # Git operations
│   │   └── github/          # GitHub API
│   ├── generators/          # Code generators
│   │   ├── mockup/          # UI mockup generator
│   │   ├── test/            # Test generator
│   │   └── code/            # Implementation generator
│   └── utils/               # Utilities
├── templates/               # Task templates
│   ├── default/            # Default workflow
│   ├── frontend/           # Frontend-specific
│   ├── backend/            # Backend-specific
│   └── fullstack/          # Full-stack workflow
├── config/                 # Configuration
│   ├── processor.yaml      # Main config
│   └── quality-rules.yaml  # Quality gates
├── docs/                   # Documentation
└── tests/                  # Test suites
```

## 🎨 Workflow Steps

### Step 1: Requirement Analysis
```typescript
✓ Fetch Jira ticket details
✓ Parse acceptance criteria
✓ Analyze technical requirements
✓ Load project documentation
✓ Generate task breakdown
```

### Step 2: Mockup Generation
```typescript
✓ Analyze UI/UX requirements
✓ Generate wireframes (Mermaid/SVG)
✓ Create interaction flows
✓ Generate design system specs
✓ Review & approve mockups
```

### Step 3: Git Branch Creation
```typescript
✓ Validate branch naming: feat/{TICKET}-{summary}
✓ Create from development branch
✓ Push to remote
✓ Link to Jira ticket
```

### Step 4: Test Generation (TDD)
```typescript
✓ Generate unit tests
✓ Generate integration tests
✓ Generate E2E tests
✓ Setup test fixtures
✓ Ensure 80%+ coverage target
```

### Step 5: Implementation
```typescript
✓ Generate boilerplate code
✓ Implement business logic
✓ Apply SOLID principles
✓ Add comprehensive error handling
✓ Document with JSDoc/TSDoc
```

### Step 6: Quality Gates
```typescript
✓ TypeScript strict checks
✓ ESLint + Prettier
✓ Run all tests
✓ Check code coverage
✓ Security scan (npm audit)
✓ Performance profiling
```

### Step 7: Pull Request
```typescript
✓ Create PR to development
✓ Auto-fill description with ticket details
✓ Add labels & reviewers
✓ Link to Jira ticket
✓ Trigger CI/CD pipeline
```

## ⚙️ Configuration

### processor.yaml

```yaml
project:
  name: "my-awesome-project"
  repository: "owner/repo"
  baseBranch: "development"
  
jira:
  server: "https://your-domain.atlassian.net"
  project: "PROJ"
  
workflow:
  steps:
    - analyze
    - mockup
    - branch
    - tests
    - implement
    - quality
    - pr
    
  mockup:
    generateWireframes: true
    generateFlows: true
    format: "mermaid"
    
  testing:
    coverageThreshold: 80
    frameworks:
      - jest
      - playwright
      
  quality:
    strictTypeScript: true
    linting: true
    securityScan: true
    
github:
  defaultReviewers:
    - "@senior-dev"
    - "@tech-lead"
  labels:
    - "auto-generated"
    - "needs-review"
```

## 🔌 MCP Integration

### Atlassian Jira Server

```json
{
  "mcpServers": {
    "atlassian": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-atlassian"
      ],
      "env": {
        "ATLASSIAN_INSTANCE_URL": "https://your-domain.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@company.com",
        "ATLASSIAN_API_TOKEN": "your-api-token",
        "ATLASSIAN_CLOUD_ID": "your-cloud-id"
      }
    }
  }
}
```

Get your credentials:
- API Token: https://id.atlassian.com/manage-profile/security/api-tokens
- Cloud ID: Check docs/ATLASSIAN_SETUP.md

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e

# Test specific workflow
npm run test -- --testPathPattern=orchestrator
```

## 📊 Quality Metrics

```typescript
✓ Code Coverage: >= 80%
✓ TypeScript Strict: Enabled
✓ ESLint Errors: 0
✓ Security Vulnerabilities: 0 critical/high
✓ Performance: < 5s per workflow step
✓ Documentation: 100% public APIs
```

## 🎯 Example Workflow

```bash
# Start processing ticket PROJ-123
npm run process -- --ticket PROJ-123

# Output:
# ✓ Fetched Jira ticket: PROJ-123
# ✓ Analyzed requirements (12 acceptance criteria)
# ✓ Generated mockups → ./output/PROJ-123/mockups/
#   - wireframe-main.svg
#   - user-flow.mermaid
#   - component-specs.md
# ✓ Created branch: feat/PROJ-123-user-authentication
# ✓ Generated 24 tests (unit + integration + e2e)
# ✓ Implemented 8 modules
# ✓ Quality checks passed (coverage: 87%)
# ✓ Created PR #42 → development
#
# 🎉 Task completed in 8m 34s
# 📋 PR: https://github.com/owner/repo/pull/42
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 License

MIT © 2025 dapio

## 🙏 Acknowledgments

- GitHub Copilot for AI assistance
- Model Context Protocol for extensibility
- Atlassian for Jira integration

---

**Built with ❤️ by developers, for developers**
