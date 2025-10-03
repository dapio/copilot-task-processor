# System Architecture

## High-Level Overview
```mermaid
graph TB
    Client[Client App]
    API[API Gateway]
    MCP[MCP Server]
    DB[(Database)]
    Cache[(Redis)]
    
    Client --> API
    API --> MCP
    MCP --> DB
    MCP --> Cache
```

## Components

### 1. API Layer
- **Technology**: Express.js / Fastify
- **Responsibility**: HTTP endpoints, authentication
- **Scaling**: Horizontal

### 2. MCP Server
- **Technology**: @modelcontextprotocol/sdk
- **Responsibility**: AI context, tools, prompts
- **Scaling**: Vertical initially

### 3. Data Layer
- **Technology**: PostgreSQL + Prisma
- **Responsibility**: Persistent storage