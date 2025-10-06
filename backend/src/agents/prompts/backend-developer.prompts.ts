/**
 * Backend Developer Agent Prompts
 * Specialized prompts for backend development tasks
 */

export class BackendDeveloperPrompts {
  /**
   * Generate code structure prompt
   */
  static buildCodeGenerationPrompt(
    requirements: any,
    technology: string,
    constraints: any = {}
  ): string {
    return `
# Backend Service Code Generation

## Requirements
${JSON.stringify(requirements, null, 2)}

## Technology Stack
Primary: ${technology}
Framework: ${constraints.framework || 'Express.js/Fastify'}
Database: ${constraints.database || 'PostgreSQL'}
ORM/Query Builder: ${constraints.orm || 'Prisma'}

## Code Generation Guidelines

### 1. Service Architecture
- Follow clean architecture principles
- Implement dependency injection
- Use proper error handling with Result<T, E> pattern
- Include comprehensive logging and monitoring

### 2. API Design
- RESTful endpoints with proper HTTP methods
- Input validation using Zod or similar
- Proper error responses with structured format
- OpenAPI/Swagger documentation

### 3. Database Design
- Normalized schema design
- Proper indexing strategy
- Migration scripts for schema changes
- Connection pooling configuration

### 4. Security Implementation
- Authentication middleware
- Authorization with RBAC/ABAC
- Input sanitization and validation
- Rate limiting and DDoS protection

### 5. Performance Considerations
- Caching strategy (Redis/in-memory)
- Database query optimization
- Async/await patterns for I/O operations
- Connection pooling and resource management

### 6. Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Database testing with test containers
- Load testing for performance validation

### 7. DevOps and Deployment
- Docker containerization
- Health check endpoints
- Environment configuration management
- CI/CD pipeline configuration

## Output Requirements
Please generate:
1. Complete service implementation with all layers
2. Database schema and migrations
3. API documentation (OpenAPI spec)
4. Comprehensive test suite
5. Docker configuration
6. Environment setup instructions
7. Performance optimization recommendations

Focus on production-ready, maintainable, and scalable code.
`;
  }

  /**
   * Database design prompt
   */
  static buildDatabaseDesignPrompt(
    requirements: any,
    dataModels: any[],
    constraints: any = {}
  ): string {
    return `
# Database Design and Schema Generation

## Business Requirements
${JSON.stringify(requirements, null, 2)}

## Data Models
${JSON.stringify(dataModels, null, 2)}

## Database Constraints
Engine: ${constraints.engine || 'PostgreSQL'}
Version: ${constraints.version || 'Latest'}
Performance Tier: ${constraints.performance || 'Production'}

## Design Guidelines

### 1. Schema Design
- Third Normal Form (3NF) normalization
- Appropriate data types for efficiency
- Proper constraints (NOT NULL, CHECK, UNIQUE)
- Meaningful naming conventions

### 2. Relationships
- Foreign key constraints with proper cascading
- Junction tables for many-to-many relationships
- Referential integrity maintenance
- Proper cardinality definitions

### 3. Indexing Strategy
- Primary key indexes (clustered)
- Foreign key indexes for joins
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- Full-text search indexes where needed

### 4. Performance Optimization
- Partitioning for large tables
- Query optimization considerations
- Connection pooling configuration
- Read replicas strategy

### 5. Data Integrity
- Check constraints for business rules
- Triggers for complex validations
- Audit trails for sensitive data
- Soft deletes where appropriate

### 6. Migration Strategy
- Incremental schema changes
- Data migration scripts
- Rollback procedures
- Version control for schema changes

## Output Requirements
Generate:
1. Complete DDL schema creation scripts
2. Migration files with up/down procedures
3. Indexing strategy with performance justifications
4. Sample data insertion scripts
5. Query optimization recommendations
6. Backup and recovery strategy
7. Performance monitoring queries

Ensure the design is scalable, maintainable, and follows best practices.
`;
  }

  /**
   * API design prompt
   */
  static buildAPIDesignPrompt(
    functionality: any,
    requirements: any,
    constraints: any = {}
  ): string {
    return `
# RESTful API Design and Implementation

## Functionality Requirements
${JSON.stringify(functionality, null, 2)}

## Technical Requirements
${JSON.stringify(requirements, null, 2)}

## API Design Constraints
Authentication: ${constraints.auth || 'JWT'}
Rate Limiting: ${constraints.rateLimit || 'Required'}
Documentation: ${constraints.docs || 'OpenAPI 3.0'}
Versioning: ${constraints.versioning || 'URL-based'}

## API Design Principles

### 1. RESTful Design
- Resource-based URLs (/users, /posts, /comments)
- Proper HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Stateless requests with proper headers
- Hypermedia controls (HATEOAS) where applicable

### 2. Request/Response Format
- JSON content type as default
- Consistent error response structure
- Proper HTTP status codes
- Pagination for list endpoints

### 3. Authentication & Authorization
- JWT token-based authentication
- Role-based access control (RBAC)
- API key authentication for service-to-service
- OAuth2 integration where needed

### 4. Validation & Error Handling
- Input validation with detailed error messages
- Structured error responses with error codes
- Request timeout handling
- Graceful degradation strategies

### 5. Performance & Security
- Request/response compression
- CORS configuration
- Rate limiting per endpoint/user
- Input sanitization and SQL injection prevention

### 6. Documentation & Testing
- OpenAPI 3.0 specification
- Interactive API documentation
- Example requests/responses
- Automated API testing suite

## Output Requirements
Create:
1. Complete OpenAPI 3.0 specification
2. API endpoint implementations with middleware
3. Authentication and authorization middleware
4. Input validation schemas
5. Error handling and logging system
6. Rate limiting configuration
7. API testing suite (unit and integration)
8. Performance monitoring setup

Focus on developer experience, security, and maintainability.
`;
  }

  /**
   * Performance optimization prompt
   */
  static buildPerformanceOptimizationPrompt(
    currentMetrics: any,
    requirements: any,
    bottlenecks: any[]
  ): string {
    return `
# Backend Performance Optimization Analysis

## Current Performance Metrics
${JSON.stringify(currentMetrics, null, 2)}

## Performance Requirements
${JSON.stringify(requirements, null, 2)}

## Identified Bottlenecks
${JSON.stringify(bottlenecks, null, 2)}

## Optimization Strategy

### 1. Database Optimization
- Query performance analysis and optimization
- Index optimization and missing index identification
- Connection pooling configuration
- Read replica implementation for read-heavy workloads

### 2. Application Performance
- Memory usage optimization and leak detection
- CPU-intensive operation optimization
- Async/await pattern optimization
- Caching strategy implementation (Redis/in-memory)

### 3. Network and I/O Optimization
- Response compression (gzip/brotli)
- CDN integration for static assets
- API response caching with appropriate headers
- Batching for multiple API calls

### 4. Concurrency and Scaling
- Load balancer configuration
- Horizontal scaling strategy
- Message queue implementation for async processing
- Circuit breaker patterns for external services

### 5. Monitoring and Profiling
- Application Performance Monitoring (APM) setup
- Custom metrics and dashboards
- Alert configuration for performance thresholds
- Continuous profiling implementation

### 6. Resource Management
- Memory pool optimization
- Database connection pooling
- File system optimization
- Network connection reuse

## Analysis Requirements
Provide:
1. Detailed performance bottleneck analysis
2. Specific optimization recommendations with expected improvements
3. Implementation roadmap with priorities
4. Performance monitoring setup
5. Load testing strategy and scripts
6. Capacity planning recommendations
7. Cost-benefit analysis of optimizations

Include benchmarks, before/after metrics, and implementation complexity estimates.
`;
  }

  /**
   * Security assessment prompt
   */
  static buildSecurityAssessmentPrompt(
    application: any,
    threats: any[],
    compliance: any = {}
  ): string {
    return `
# Backend Security Assessment and Hardening

## Application Details
${JSON.stringify(application, null, 2)}

## Threat Model
${JSON.stringify(threats, null, 2)}

## Compliance Requirements
${JSON.stringify(compliance, null, 2)}

## Security Assessment Framework

### 1. Authentication Security
- Multi-factor authentication implementation
- Password policy and hashing (bcrypt/argon2)
- Session management and token security
- Account lockout and brute force protection

### 2. Authorization and Access Control
- Role-based access control (RBAC) implementation
- Attribute-based access control (ABAC) where needed
- Principle of least privilege enforcement
- API endpoint authorization verification

### 3. Input Validation and Sanitization
- SQL injection prevention
- XSS attack prevention
- CSRF protection implementation
- File upload security (size, type, content validation)

### 4. Data Protection
- Encryption at rest and in transit
- PII data identification and protection
- Database security and access control
- Secure backup and recovery procedures

### 5. Network Security
- HTTPS/TLS configuration and certificate management
- API rate limiting and DDoS protection
- Firewall and network segmentation
- VPN and secure communication channels

### 6. Security Monitoring
- Security event logging and monitoring
- Intrusion detection system setup
- Vulnerability scanning automation
- Security incident response procedures

## Assessment Output
Generate:
1. Comprehensive security vulnerability assessment
2. Risk prioritization matrix with CVSS scores
3. Detailed remediation recommendations
4. Security hardening checklist
5. Compliance validation report
6. Security testing strategy
7. Incident response playbook
8. Security monitoring dashboard

Focus on practical, implementable security measures with business impact consideration.
`;
  }

  /**
   * Deployment strategy prompt
   */
  static buildDeploymentStrategyPrompt(
    application: any,
    environment: any,
    requirements: any
  ): string {
    return `
# Production Deployment Strategy and DevOps Pipeline

## Application Configuration
${JSON.stringify(application, null, 2)}

## Target Environment
${JSON.stringify(environment, null, 2)}

## Deployment Requirements
${JSON.stringify(requirements, null, 2)}

## Deployment Strategy Design

### 1. Containerization Strategy
- Multi-stage Docker build optimization
- Base image security and minimal footprint
- Container orchestration (Kubernetes/Docker Compose)
- Service mesh integration where applicable

### 2. CI/CD Pipeline Design
- Source code management and branching strategy
- Automated testing integration (unit, integration, e2e)
- Build artifact management and versioning
- Deployment automation with rollback capabilities

### 3. Environment Management
- Infrastructure as Code (Terraform/CloudFormation)
- Environment-specific configuration management
- Secret management and secure credential handling
- Database migration automation

### 4. Monitoring and Observability
- Application and infrastructure monitoring
- Centralized logging with structured logs
- Distributed tracing for microservices
- Health check and readiness probe configuration

### 5. Scaling and High Availability
- Auto-scaling configuration based on metrics
- Load balancing strategy and configuration
- Database replication and failover
- Disaster recovery and backup procedures

### 6. Security and Compliance
- Security scanning in CI/CD pipeline
- Compliance validation automation
- Network security and isolation
- Access control and audit logging

## Deployment Deliverables
Create:
1. Complete CI/CD pipeline configuration
2. Infrastructure as Code templates
3. Docker and container orchestration configs
4. Environment-specific deployment guides
5. Monitoring and alerting setup
6. Disaster recovery procedures
7. Security hardening checklist
8. Performance optimization guidelines

Include step-by-step deployment procedures, rollback strategies, and troubleshooting guides.
`;
  }

  /**
   * Microservices architecture prompt
   */
  static buildMicroservicesPrompt(
    requirements: any,
    services: any[],
    constraints: any = {}
  ): string {
    return `
# Microservices Architecture Design and Implementation

## System Requirements
${JSON.stringify(requirements, null, 2)}

## Service Definitions
${JSON.stringify(services, null, 2)}

## Architecture Constraints
Communication: ${constraints.communication || 'HTTP/gRPC + Message Queues'}
Data Management: ${constraints.dataPattern || 'Database per Service'}
Service Discovery: ${constraints.discovery || 'DNS/Service Mesh'}
Configuration: ${constraints.config || 'Environment Variables + Config Service'}

## Microservices Design Principles

### 1. Service Decomposition
- Domain-driven design (DDD) boundaries
- Single responsibility principle per service
- Loose coupling and high cohesion
- Independent deployability

### 2. Communication Patterns
- Synchronous communication (HTTP/REST, gRPC)
- Asynchronous messaging (Event-driven, Message queues)
- Service-to-service authentication
- API versioning and backward compatibility

### 3. Data Management
- Database per service pattern
- Event sourcing where appropriate
- CQRS for read/write separation
- Distributed transaction handling (Saga pattern)

### 4. Service Discovery and Routing
- Service registry and discovery mechanism
- Load balancing strategies
- Circuit breaker pattern for resilience
- API Gateway for external communication

### 5. Monitoring and Observability
- Distributed tracing across services
- Centralized logging with correlation IDs
- Service health monitoring and metrics
- Performance monitoring and alerting

### 6. DevOps and Deployment
- Independent CI/CD pipelines per service
- Container orchestration (Kubernetes)
- Infrastructure as Code for consistent environments
- Blue-green or canary deployment strategies

## Architecture Output
Generate:
1. Service architecture diagram and boundaries
2. Inter-service communication design
3. Data flow and event choreography
4. API contracts and service interfaces
5. Infrastructure and deployment architecture
6. Monitoring and observability strategy
7. Security and authentication framework
8. Development and deployment guidelines

Focus on scalability, maintainability, and operational excellence.
`;
  }

  /**
   * Code review prompt
   */
  static buildCodeReviewPrompt(
    codebase: any,
    standards: any,
    focus: string[]
  ): string {
    return `
# Backend Code Review and Quality Assessment

## Codebase Information
${JSON.stringify(codebase, null, 2)}

## Coding Standards
${JSON.stringify(standards, null, 2)}

## Review Focus Areas
${focus.join(', ')}

## Code Review Criteria

### 1. Code Quality and Standards
- Adherence to coding conventions and style guides
- Code readability and maintainability
- Proper naming conventions and documentation
- SOLID principles application

### 2. Architecture and Design
- Separation of concerns and modularity
- Design pattern usage and appropriateness
- Dependency management and injection
- Layer separation and clean architecture

### 3. Performance and Optimization
- Algorithm efficiency and Big O analysis
- Database query optimization
- Memory usage and potential leaks
- Caching strategy implementation

### 4. Security Review
- Input validation and sanitization
- Authentication and authorization implementation
- Secure coding practices
- Vulnerability identification (OWASP Top 10)

### 5. Error Handling and Logging
- Comprehensive error handling strategies
- Proper logging levels and structured logging
- Graceful degradation and fallback mechanisms
- Exception propagation and recovery

### 6. Testing Coverage
- Unit test coverage and quality
- Integration test completeness
- Test organization and maintainability
- Edge case coverage and negative testing

## Review Output
Provide:
1. Overall code quality assessment with scores
2. Detailed findings categorized by severity
3. Specific improvement recommendations
4. Refactoring suggestions with priorities
5. Security vulnerability report
6. Performance optimization opportunities
7. Best practice recommendations
8. Code metrics and complexity analysis

Include specific code examples and actionable improvement steps.
`;
  }
}

export default BackendDeveloperPrompts;
