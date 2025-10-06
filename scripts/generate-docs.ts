#!/usr/bin/env node

/**
 * ThinkCode AI Platform - Documentation Generator
 * Enterprise-grade documentation generation system
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

interface DocumentationConfig {
  outputDir: string;
  includeAPI: boolean;
  includeDatabase: boolean;
  includeWorkflows: boolean;
  includeArchitecture: boolean;
}

class DocumentationGenerator {
  private prisma: PrismaClient;
  private config: DocumentationConfig;

  constructor(config: Partial<DocumentationConfig> = {}) {
    this.prisma = new PrismaClient();
    this.config = {
      outputDir: path.join(process.cwd(), 'docs', 'generated'),
      includeAPI: true,
      includeDatabase: true,
      includeWorkflows: true,
      includeArchitecture: true,
      ...config,
    };
  }

  async generateDocumentation(): Promise<void> {
    try {
      console.log(
        '📚 Starting ThinkCode AI Platform Documentation Generation...'
      );

      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Generate different documentation sections
      if (this.config.includeAPI) {
        await this.generateAPIDocumentation();
      }

      if (this.config.includeDatabase) {
        await this.generateDatabaseDocumentation();
      }

      if (this.config.includeWorkflows) {
        await this.generateWorkflowDocumentation();
      }

      if (this.config.includeArchitecture) {
        await this.generateArchitectureDocumentation();
      }

      // Generate index file
      await this.generateIndexFile();

      console.log('✅ Documentation generation completed successfully!');
      console.log(`📁 Documentation available in: ${this.config.outputDir}`);
    } catch (error) {
      console.error('❌ Documentation generation failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async ensureOutputDirectory(): Promise<void> {
    await fs.mkdir(this.config.outputDir, { recursive: true });
  }

  private async generateAPIDocumentation(): Promise<void> {
    console.log('🔌 Generating API documentation...');

    const apiDoc = `# ThinkCode AI Platform - API Documentation

## Overview
This document describes the REST API endpoints available in the ThinkCode AI Platform.

## Base URL
- Backend API: \`http://localhost:3002/api\`
- Agents API: \`http://localhost:3003/api\`

## Authentication
All API endpoints use Bearer token authentication.

## Endpoints

### Health Endpoints

#### GET /health
Check API server health status.

**Response:**
\`\`\`json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0"
}
\`\`\`

### Document Management

#### POST /documents
Upload and process a new document.

**Request Body:**
\`\`\`json
{
  "title": "Document Title",
  "content": "Document content...",
  "type": "pdf|docx|txt|md"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "doc_123",
  "title": "Document Title",
  "status": "processed",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
\`\`\`

#### GET /documents
List all documents with pagination.

**Query Parameters:**
- \`page\`: Page number (default: 1)
- \`limit\`: Items per page (default: 20)
- \`search\`: Search term

#### GET /documents/:id
Get specific document details.

### Workflow Management

#### POST /workflows
Create a new workflow execution.

**Request Body:**
\`\`\`json
{
  "name": "Workflow Name",
  "steps": [
    {
      "type": "document-analysis",
      "config": { "documentId": "doc_123" }
    }
  ]
}
\`\`\`

#### GET /workflows/:id/status
Get workflow execution status.

### Knowledge Management

#### GET /knowledge/search
Search knowledge base.

**Query Parameters:**
- \`query\`: Search query
- \`type\`: Content type filter
- \`limit\`: Results limit

### Agent Management

#### POST /agents/execute
Execute agent with specific tools.

**Request Body:**
\`\`\`json
{
  "agentType": "workflow-assistant",
  "message": "User message",
  "context": { "documentId": "doc_123" }
}
\`\`\`

## Error Responses

All endpoints return standardized error responses:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { /* Additional error details */ }
  }
}
\`\`\`

## Rate Limiting

API endpoints are rate limited to:
- 1000 requests per hour per API key
- 100 requests per minute per IP address

## WebSocket Endpoints

### /ws/workflow-status
Real-time workflow status updates.

### /ws/agent-chat
Real-time agent chat communication.

Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(
      path.join(this.config.outputDir, 'api-documentation.md'),
      apiDoc
    );

    console.log('  ✓ API documentation generated');
  }

  private async generateDatabaseDocumentation(): Promise<void> {
    console.log('🗄️ Generating database documentation...');

    const dbDoc = `# ThinkCode AI Platform - Database Schema

## Overview
This document describes the database schema and relationships in the ThinkCode AI Platform.

## Database Engine
- **Type:** SQLite (Development) / PostgreSQL (Production)
- **ORM:** Prisma
- **Migrations:** Automatic via Prisma Migrate

## Core Tables

### Documents
Stores uploaded and processed documents.

\`\`\`sql
CREATE TABLE Document (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    content     TEXT,
    metadata    TEXT,
    type        TEXT NOT NULL,
    status      TEXT DEFAULT 'pending',
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

### WorkflowExecution
Tracks workflow execution instances.

\`\`\`sql
CREATE TABLE WorkflowExecution (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    status      TEXT DEFAULT 'pending',
    steps       TEXT NOT NULL, -- JSON
    results     TEXT,          -- JSON
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    completedAt DATETIME
);
\`\`\`

### KnowledgeEntry
Stores extracted knowledge and insights.

\`\`\`sql
CREATE TABLE KnowledgeEntry (
    id          TEXT PRIMARY KEY,
    content     TEXT NOT NULL,
    type        TEXT NOT NULL,
    metadata    TEXT,          -- JSON
    documentId  TEXT,
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documentId) REFERENCES Document(id)
);
\`\`\`

### KnowledgeFeed
Manages knowledge feed configurations.

\`\`\`sql
CREATE TABLE KnowledgeFeed (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    type        TEXT NOT NULL,
    schedule    TEXT,
    isActive    BOOLEAN DEFAULT true,
    lastSync    DATETIME,
    config      TEXT,          -- JSON
    createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP
);
\`\`\`

## Relationships

### Document → KnowledgeEntry
- One-to-Many: A document can have multiple knowledge entries
- Foreign Key: \`KnowledgeEntry.documentId → Document.id\`

### Document → WorkflowExecution
- Many-to-Many: Documents can be processed by multiple workflows
- Stored in workflow step configuration JSON

## Indexes

### Performance Indexes
\`\`\`sql
-- Document search optimization
CREATE INDEX idx_document_title ON Document(title);
CREATE INDEX idx_document_type ON Document(type);
CREATE INDEX idx_document_status ON Document(status);
CREATE INDEX idx_document_created ON Document(createdAt);

-- Knowledge search optimization
CREATE INDEX idx_knowledge_type ON KnowledgeEntry(type);
CREATE INDEX idx_knowledge_document ON KnowledgeEntry(documentId);
CREATE INDEX idx_knowledge_created ON KnowledgeEntry(createdAt);

-- Workflow tracking
CREATE INDEX idx_workflow_status ON WorkflowExecution(status);
CREATE INDEX idx_workflow_created ON WorkflowExecution(createdAt);

-- Feed management
CREATE INDEX idx_feed_active ON KnowledgeFeed(isActive);
CREATE INDEX idx_feed_type ON KnowledgeFeed(type);
\`\`\`

## Data Types

### Document Status
- \`pending\`: Uploaded but not processed
- \`processing\`: Currently being processed
- \`processed\`: Successfully processed
- \`error\`: Processing failed

### Workflow Status
- \`pending\`: Waiting to start
- \`running\`: Currently executing
- \`completed\`: Successfully completed
- \`failed\`: Execution failed
- \`cancelled\`: Manually cancelled

### Knowledge Entry Types
- \`summary\`: Document summary
- \`insight\`: Extracted insight
- \`entity\`: Named entity
- \`keyword\`: Important keyword
- \`relationship\`: Entity relationship

## Backup Strategy

### Development
- SQLite file backup daily
- Migration history preserved

### Production
- PostgreSQL automated backups every 6 hours
- Point-in-time recovery enabled
- Cross-region replication

Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(
      path.join(this.config.outputDir, 'database-schema.md'),
      dbDoc
    );

    console.log('  ✓ Database documentation generated');
  }

  private async generateWorkflowDocumentation(): Promise<void> {
    console.log('⚡ Generating workflow documentation...');

    const workflowDoc = `# ThinkCode AI Platform - Workflow System

## Overview
The ThinkCode AI Platform includes a comprehensive workflow system for automating document processing, analysis, and knowledge extraction.

## Workflow Architecture

### Core Components

#### WorkflowEngine
Central orchestrator for workflow execution.

#### WorkflowStep
Individual steps within a workflow.

#### WorkflowContext
Shared context and data between steps.

## Built-in Workflow Types

### Document Processing Workflow
Comprehensive document analysis and processing.

**Steps:**
1. **Document Upload** - Validate and store document
2. **Content Extraction** - Extract text and metadata
3. **Language Detection** - Identify document language
4. **Entity Recognition** - Extract named entities
5. **Summarization** - Generate document summary
6. **Knowledge Extraction** - Extract key insights
7. **Storage** - Store results in knowledge base

**Configuration:**
\`\`\`json
{
  "name": "document-processing",
  "steps": [
    {
      "type": "upload-validation",
      "config": {
        "allowedTypes": ["pdf", "docx", "txt", "md"],
        "maxSize": "50MB"
      }
    },
    {
      "type": "content-extraction",
      "config": {
        "preserveFormatting": true,
        "extractImages": false
      }
    },
    {
      "type": "analysis",
      "config": {
        "enableNER": true,
        "enableSentiment": true,
        "generateSummary": true
      }
    }
  ]
}
\`\`\`

### Knowledge Sync Workflow
Synchronize external knowledge sources.

**Steps:**
1. **Feed Validation** - Validate feed configuration
2. **Content Fetch** - Retrieve content from source
3. **Content Processing** - Process and normalize content
4. **Deduplication** - Remove duplicate entries
5. **Knowledge Storage** - Store in knowledge base

### Report Generation Workflow
Generate comprehensive reports from processed data.

**Steps:**
1. **Data Collection** - Gather relevant data
2. **Analysis** - Perform statistical analysis
3. **Visualization** - Generate charts and graphs
4. **Report Compilation** - Compile final report
5. **Export** - Export in requested format

## Workflow Execution

### Synchronous Execution
For workflows that complete quickly (< 30 seconds).

\`\`\`typescript
const result = await workflowEngine.execute({
  name: 'quick-analysis',
  steps: [...],
  sync: true
});
\`\`\`

### Asynchronous Execution
For long-running workflows.

\`\`\`typescript
const execution = await workflowEngine.start({
  name: 'document-processing',
  steps: [...]
});

// Check status
const status = await workflowEngine.getStatus(execution.id);
\`\`\`

### Real-time Updates
WebSocket connection for real-time status updates.

\`\`\`javascript
const ws = new WebSocket('ws://localhost:3002/ws/workflow-status');
ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  console.log('Workflow update:', update);
};
\`\`\`

## Custom Workflows

### Creating Custom Steps
\`\`\`typescript
class CustomAnalysisStep implements WorkflowStep {
  async execute(context: WorkflowContext): Promise<StepResult> {
    // Custom logic here
    return {
      success: true,
      data: { /* results */ }
    };
  }
}
\`\`\`

### Registering Custom Workflows
\`\`\`typescript
workflowEngine.registerWorkflow({
  name: 'custom-workflow',
  steps: [
    new CustomAnalysisStep(),
    new StandardProcessingStep()
  ]
});
\`\`\`

## Error Handling

### Retry Logic
Failed steps are automatically retried with exponential backoff.

### Fallback Strategies
Configure fallback steps for critical failures.

### Error Notifications
Real-time error notifications via WebSocket.

## Monitoring

### Workflow Metrics
- Execution time
- Success/failure rates
- Resource usage
- Step performance

### Dashboard Integration
All workflow metrics are available in the enterprise dashboard.

Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(
      path.join(this.config.outputDir, 'workflow-system.md'),
      workflowDoc
    );

    console.log('  ✓ Workflow documentation generated');
  }

  private async generateArchitectureDocumentation(): Promise<void> {
    console.log('🏗️ Generating architecture documentation...');

    const archDoc = `# ThinkCode AI Platform - System Architecture

## Overview
The ThinkCode AI Platform is an enterprise-grade system designed for comprehensive document processing, workflow automation, and AI-powered analysis.

## Architecture Principles

### Enterprise Standards
- **Bulletproof Error Handling**: All operations use Result<T, E> pattern
- **Type Safety**: Full TypeScript coverage (98%+)
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Lighthouse scores > 90
- **Security**: Enterprise-grade security controls

### Design Patterns
- **Service-Hook-Component**: Clear separation of concerns
- **Result Pattern**: Consistent error handling
- **Observer Pattern**: Real-time updates
- **Strategy Pattern**: Pluggable workflows

## System Components

### Backend Services

#### Core API Server (\`backend/src/server.ts\`)
- **Port**: 3002
- **Purpose**: Main REST API endpoints
- **Features**: Document management, workflow execution, knowledge base

#### Agents API Server (\`backend/src/agents-server.ts\`)
- **Port**: 3003
- **Purpose**: AI agent communication and tool execution
- **Features**: MCP server integration, function calling, agent orchestration

#### MCP Server (\`backend/src/mcp/mcp-server.ts\`)
- **Purpose**: Model Context Protocol server with 7 enterprise tools
- **Tools**: 
  - Workspace file operations
  - Code analysis and generation
  - Terminal command execution
  - Database querying
  - Workflow orchestration

### Frontend Applications

#### Main Frontend (\`frontend/\`)
- **Framework**: Next.js 15.5.4
- **Port**: 3000 (development)
- **Features**: Complete enterprise dashboard, real-time updates

#### Admin Panel (\`admin-panel/\`)
- **Framework**: Next.js
- **Port**: 3001 (development)
- **Features**: System administration, user management

### Database Layer

#### Prisma ORM
- **Development**: SQLite
- **Production**: PostgreSQL
- **Features**: Type-safe database operations, automatic migrations

#### Core Tables
- **Document**: Document storage and metadata
- **WorkflowExecution**: Workflow tracking
- **KnowledgeEntry**: Extracted knowledge
- **KnowledgeFeed**: External data sources

## Service Architecture

### Service Layer Pattern
\`\`\`
┌─────────────────┐
│   Components    │
├─────────────────┤
│     Hooks       │
├─────────────────┤
│    Services     │
├─────────────────┤
│    Database     │
└─────────────────┘
\`\`\`

#### Components
- Pure presentation logic
- Accessibility compliant
- Performance optimized
- Error boundary wrapped

#### Hooks
- Business logic abstraction
- State management
- Side effect handling
- Caching strategies

#### Services
- Data operations
- External API integration
- Validation logic
- Error handling

## Agent System

### Agent Types
1. **Workflow Assistant** - Workflow management and execution
2. **Business Analyst** - Business logic and requirements
3. **QA Engineer** - Quality assurance and testing
4. **Microsoft Reviewer** - Microsoft technology expertise
5. **DevOps Engineer** - Infrastructure and deployment
6. **Senior Developer** - Code review and architecture
7. **UX Designer** - User experience and design

### Tool Registry
Each agent type has access to specific tools based on their role and capabilities.

### Function Calling
Enhanced GitHub Copilot provider with enterprise function calling capabilities.

## Security Architecture

### Authentication & Authorization
- Bearer token authentication
- Role-based access control (RBAC)
- API rate limiting
- Request validation

### Data Protection
- Input sanitization (DOMPurify)
- SQL injection prevention (Prisma)
- XSS protection
- CSRF protection

### Infrastructure Security
- HTTPS enforcement
- Security headers
- Environment variable protection
- Secrets management

## Deployment Architecture

### Development Environment
\`\`\`
├── Backend API (3002)
├── Agents API (3003)
├── Frontend (3000)
├── Admin Panel (3001)
└── Database (SQLite)
\`\`\`

### Production Environment
\`\`\`
┌─────────────────┐
│   Load Balancer │
├─────────────────┤
│   Backend API   │
│   (Clustered)   │
├─────────────────┤
│   Agents API    │
│   (Clustered)   │
├─────────────────┤
│   PostgreSQL    │
│   (Primary +    │
│    Replica)     │
└─────────────────┘
\`\`\`

## Performance Optimization

### Frontend Optimization
- Code splitting
- Tree shaking
- Image optimization
- Caching strategies
- Bundle analysis

### Backend Optimization
- Connection pooling
- Query optimization
- Response compression
- Caching layers
- Background processing

## Monitoring & Observability

### Metrics Collection
- Application performance metrics
- Business metrics
- Infrastructure metrics
- User experience metrics

### Logging Strategy
- Structured logging (JSON)
- Log levels (ERROR, WARN, INFO, DEBUG)
- Centralized log aggregation
- Real-time monitoring

### Health Checks
- API endpoint health
- Database connectivity
- External service availability
- System resource usage

## Scalability Considerations

### Horizontal Scaling
- Stateless service design
- Load balancer support
- Session management
- Database clustering

### Vertical Scaling
- Resource optimization
- Memory management
- CPU utilization
- I/O optimization

## Disaster Recovery

### Backup Strategy
- Database backups
- File system backups
- Configuration backups
- Regular restore testing

### Recovery Procedures
- Service restart procedures
- Database recovery
- Data consistency checks
- Communication protocols

Generated on: ${new Date().toISOString()}
`;

    await fs.writeFile(
      path.join(this.config.outputDir, 'system-architecture.md'),
      archDoc
    );

    console.log('  ✓ Architecture documentation generated');
  }

  private async generateIndexFile(): Promise<void> {
    const indexContent = `# ThinkCode AI Platform - Documentation Index

Welcome to the comprehensive documentation for the ThinkCode AI Platform.

## Documentation Sections

### 📖 [API Documentation](./api-documentation.md)
Complete REST API reference with endpoints, request/response formats, and examples.

### 🗄️ [Database Schema](./database-schema.md)
Detailed database schema documentation including tables, relationships, and indexes.

### ⚡ [Workflow System](./workflow-system.md)
Comprehensive guide to the workflow system, built-in workflows, and custom workflow creation.

### 🏗️ [System Architecture](./system-architecture.md)
High-level system architecture, design patterns, and deployment strategies.

## Quick Links

- [Getting Started](../STARTUP-GUIDE.md)
- [Implementation Summary](../../IMPLEMENTATION_SUMMARY.md)
- [Business Requirements](../requirements/01-business-requirements.md)
- [Functional Requirements](../requirements/02-functional-requirements.md)

## Platform Status

**Current Version**: 1.0.0  
**Generated**: ${new Date().toISOString()}  
**Environment**: ${process.env.NODE_ENV || 'development'}  

## Support

For technical support and questions:
- Check the troubleshooting section in each documentation file
- Review the implementation summary for recent changes
- Consult the system architecture for design decisions

---

**© 2024 ThinkCode AI Platform - Enterprise Documentation**
`;

    await fs.writeFile(
      path.join(this.config.outputDir, 'README.md'),
      indexContent
    );

    console.log('  ✓ Documentation index generated');
  }
}

// Main execution
if (require.main === module) {
  const generator = new DocumentationGenerator();

  generator
    .generateDocumentation()
    .then(() => {
      console.log('🎉 Documentation generation completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Documentation generation failed:', error);
      process.exit(1);
    });
}

export { DocumentationGenerator };
