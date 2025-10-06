/**
 * Backend Developer Agent - Alex Thompson
 * Specialized in Node.js, TypeScript, APIs, databases, and server-side architecture
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

export interface BackendService {
  id: string;
  name: string;
  type: 'api' | 'service' | 'worker' | 'processor' | 'gateway' | 'middleware';
  description: string;

  // Technical details
  framework: string;
  runtime: string;
  database: DatabaseConnection[];

  // API specification
  endpoints: APIEndpoint[];
  authentication: AuthenticationStrategy;
  authorization: AuthorizationStrategy;

  // Performance and scaling
  caching: CachingStrategy;
  rateLimit: RateLimitStrategy;
  monitoring: MonitoringStrategy;

  // Data and business logic
  models: DataModel[];
  businessLogic: BusinessLogicModule[];

  // Deployment
  deployment: DeploymentStrategy;
  dependencies: ServiceDependency[];

  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseConnection {
  name: string;
  type: 'postgresql' | 'mysql' | 'mongodb' | 'redis' | 'sqlite';
  purpose: string;
  connectionString: string;
  poolSize: number;
  ssl: boolean;
}

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  parameters: Parameter[];
  requestBody?: RequestBodySchema;
  responses: ResponseSchema[];
  authentication: boolean;
  rateLimit?: number;
  caching?: any;
}

export interface Parameter {
  name: string;
  type: 'path' | 'query' | 'header';
  dataType: string;
  required: boolean;
  description: string;
  validation?: ValidationRule[];
}

export interface RequestBodySchema {
  contentType: string;
  schema: any;
  validation: ValidationRule[];
}

export interface ResponseSchema {
  statusCode: number;
  description: string;
  schema: any;
  headers?: Record<string, string>;
}

export interface ValidationRule {
  rule: string;
  message: string;
  parameters?: any;
}

export interface AuthenticationStrategy {
  type: 'jwt' | 'oauth2' | 'api_key' | 'session' | 'basic';
  provider?: string;
  configuration: any;
  tokenExpiry?: string;
}

export interface AuthorizationStrategy {
  type: 'rbac' | 'abac' | 'permission_based' | 'resource_based';
  roles: Role[];
  permissions: Permission[];
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
  hierarchical?: string;
}

export interface Permission {
  name: string;
  resource: string;
  action: string;
  conditions?: any;
}

export interface CachingStrategy {
  enabled: boolean;
  provider: 'redis' | 'memory' | 'cdn' | 'database';
  ttl: number;
  layers: CacheLayer[];
}

export interface CacheLayer {
  name: string;
  type: 'application' | 'database' | 'external';
  strategy: 'write_through' | 'write_behind' | 'cache_aside';
  invalidation: string[];
}

export interface RateLimitStrategy {
  enabled: boolean;
  algorithm: 'token_bucket' | 'sliding_window' | 'fixed_window';
  limits: RateLimit[];
}

export interface RateLimit {
  endpoint: string;
  requests: number;
  window: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface MonitoringStrategy {
  metrics: MetricConfig[];
  logging: LoggingConfig;
  alerting: AlertConfig[];
  tracing: TracingConfig;
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'external';
  rotation?: string;
}

export interface AlertConfig {
  name: string;
  condition: string;
  severity: 'info' | 'warning' | 'critical';
  channels: string[];
  cooldown?: string;
}

export interface TracingConfig {
  enabled: boolean;
  provider: 'jaeger' | 'zipkin' | 'datadog' | 'custom';
  samplingRate: number;
}

export interface DataModel {
  name: string;
  description: string;
  fields: ModelField[];
  relationships: Relationship[];
  indexes: Index[];
  constraints: Constraint[];
}

export interface ModelField {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
}

export interface Relationship {
  name: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  target: string;
  foreignKey?: string;
  onDelete?: 'cascade' | 'set_null' | 'restrict';
}

export interface Index {
  name: string;
  fields: string[];
  unique: boolean;
  type?: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface Constraint {
  name: string;
  type: 'check' | 'unique' | 'foreign_key' | 'primary_key';
  definition: string;
}

export interface BusinessLogicModule {
  name: string;
  purpose: string;
  functions: BusinessFunction[];
  dependencies: string[];
}

export interface BusinessFunction {
  name: string;
  description: string;
  parameters: FunctionParameter[];
  returnType: string;
  sideEffects: string[];
  errorCases: ErrorCase[];
}

export interface FunctionParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ErrorCase {
  condition: string;
  errorType: string;
  message: string;
  statusCode?: number;
}

export interface DeploymentStrategy {
  type: 'docker' | 'serverless' | 'traditional' | 'kubernetes';
  configuration: any;
  environment: EnvironmentConfig[];
  scaling: ScalingConfig;
}

export interface EnvironmentConfig {
  name: string;
  variables: Record<string, string>;
  secrets: string[];
  resources: ResourceConfig;
}

export interface ResourceConfig {
  cpu: string;
  memory: string;
  storage?: string;
  network?: string;
}

export interface ScalingConfig {
  type: 'manual' | 'automatic' | 'scheduled';
  minInstances: number;
  maxInstances: number;
  triggers: ScalingTrigger[];
}

export interface ScalingTrigger {
  metric: string;
  threshold: number;
  action: 'scale_up' | 'scale_down';
}

export interface ServiceDependency {
  name: string;
  type: 'database' | 'api' | 'queue' | 'cache' | 'external';
  version?: string;
  required: boolean;
  fallback?: string;
}

export class BackendDeveloperAgent {
  private prisma: PrismaClient;
  private provider: IMLProvider;
  private agentId = 'backend-developer-alex-thompson';

  // Agent personality and expertise
  private agentConfig = {
    name: 'Alex Thompson',
    role: 'Backend Developer',
    personality:
      'methodical, security-conscious, performance-focused, systematic',
    expertise: [
      'node_js_development',
      'typescript',
      'api_design',
      'database_design',
      'microservices',
      'authentication_authorization',
      'performance_optimization',
      'security',
      'testing',
      'devops_integration',
      'monitoring_logging',
      'caching_strategies',
    ],
    workingStyle: 'test-driven, security-first, scalable-architecture',
    communicationStyle: 'technical, precise, documentation-focused',
  };

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Design and generate REST API service
   */
  async generateAPIService(
    serviceName: string,
    requirements: any,
    constraints: any = {}
  ): Promise<Result<{ code: string; tests: string; docs: string }, MLError>> {
    const prompt = this.buildAPIGenerationPrompt(
      serviceName,
      requirements,
      constraints
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 4000,
    });

    if (!response.success) {
      return {
        success: false,
        error: {
          code: 'API_GENERATION_FAILED',
          message: `API service generation failed: ${response.error.message}`,
          details: response.error.details,
        },
      };
    }

    try {
      const serviceResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          code: serviceResult.service.code,
          tests: serviceResult.tests.code,
          docs: serviceResult.documentation,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'API_PROCESSING_ERROR',
          message: 'Failed to process API service generation',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Design database schema and models
   */
  async designDatabaseSchema(
    projectId: string,
    dataRequirements: any[],
    constraints: any = {}
  ): Promise<Result<DataModel[], MLError>> {
    const prompt = this.buildDatabaseDesignPrompt(
      dataRequirements,
      constraints
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 3500,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const schemaResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: schemaResult.models,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_DESIGN_ERROR',
          message: 'Failed to design database schema',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Implement authentication and authorization
   */
  async implementAuthentication(
    authRequirements: any,
    securityLevel: 'basic' | 'standard' | 'high' | 'enterprise'
  ): Promise<
    Result<{ authCode: string; middleware: string; config: string }, MLError>
  > {
    const prompt = this.buildAuthenticationPrompt(
      authRequirements,
      securityLevel
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 3000,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const authResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          authCode: authResult.authentication.code,
          middleware: authResult.middleware.code,
          config: authResult.configuration,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_IMPLEMENTATION_ERROR',
          message: 'Failed to implement authentication',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Optimize API performance
   */
  async optimizePerformance(
    serviceCode: string,
    performanceRequirements: any
  ): Promise<Result<{ optimizedCode: string; strategies: string[] }, MLError>> {
    const prompt = this.buildPerformanceOptimizationPrompt(
      serviceCode,
      performanceRequirements
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.3,
      maxTokens: 3500,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const optimizationResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          optimizedCode: optimizationResult.optimizedCode,
          strategies: optimizationResult.optimizationStrategies,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PERFORMANCE_OPTIMIZATION_ERROR',
          message: 'Failed to optimize performance',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Private methods for prompt building

  private buildAPIGenerationPrompt(
    serviceName: string,
    requirements: any,
    constraints: any
  ): string {
    return `Jestem Alex Thompson, doświadczonym backend developer specjalizującym się w Node.js i TypeScript.

ZADANIE: Wygeneruj kompletny REST API service z testami i dokumentacją.

NAZWA SERWISU: ${serviceName}

WYMAGANIA:
${JSON.stringify(requirements, null, 2)}

OGRANICZENIA:
${JSON.stringify(constraints, null, 2)}

WYGENERUJ API SERVICE:

1. ARCHITEKTURA SERWISU:
   - Express.js z TypeScript
   - Layered architecture (Controller -> Service -> Repository)
   - Dependency injection
   - Error handling middleware

2. API ENDPOINTS:
   - RESTful design principles
   - Proper HTTP status codes
   - Request/response validation with Zod
   - OpenAPI/Swagger documentation

3. SECURITY:
   - Input validation and sanitization
   - Rate limiting
   - CORS configuration
   - Authentication middleware
   - SQL injection prevention

4. PERFORMANCE:
   - Response caching
   - Database query optimization
   - Connection pooling
   - Compression middleware

5. MONITORING:
   - Structured logging
   - Health check endpoints
   - Metrics collection
   - Error tracking

ODPOWIEDŹ W FORMACIE JSON - tylko część kodu bez błędów składni.`;
  }

  private buildDatabaseDesignPrompt(
    dataRequirements: any[],
    constraints: any
  ): string {
    return `Jestem Alex Thompson, backend developer projektujący schemat bazy danych.

ZADANIE: Zaprojektuj optymalny schemat bazy danych.

WYMAGANIA DANYCH:
${JSON.stringify(dataRequirements, null, 2)}

OGRANICZENIA:
${JSON.stringify(constraints, null, 2)}

ZAPROJEKTUJ SCHEMAT:

1. ANALIZA WYMAGAŃ:
   - Identyfikacja encji i atrybutów
   - Określenie relacji między encjami
   - Analiza wzorców dostępu do danych

2. NORMALIZACJA:
   - Zastosowanie odpowiedniej formy normalnej
   - Eliminacja redundancji
   - Zachowanie wydajności zapytań

3. OPTYMALIZACJA:
   - Strategia indeksowania
   - Partycjonowanie tabel
   - Optymalizacja typów danych

4. BEZPIECZEŃSTWO:
   - Constraints i validation
   - Row-level security
   - Audit trails

ODPOWIEDŹ W FORMACIE JSON - tylko struktura danych.`;
  }

  private buildAuthenticationPrompt(
    authRequirements: any,
    securityLevel: string
  ): string {
    return `Jestem Alex Thompson, implementujący system uwierzytelniania i autoryzacji.

ZADANIE: Implementuj bezpieczny system auth.

WYMAGANIA AUTH:
${JSON.stringify(authRequirements, null, 2)}

POZIOM BEZPIECZEŃSTWA: ${securityLevel}

IMPLEMENTUJ AUTHENTICATION:

1. STRATEGIA UWIERZYTELNIANIA:
   - JWT tokens z refresh mechanism
   - Password hashing z bcrypt/argon2
   - Multi-factor authentication
   - Session management

2. AUTORYZACJA:
   - Role-based access control (RBAC)
   - Permission-based authorization
   - Resource-level access control
   - API rate limiting per user

3. SECURITY BEST PRACTICES:
   - Token expiration handling
   - Secure cookie settings
   - CSRF protection
   - Brute force protection

ODPOWIEDŹ W FORMACIE JSON - tylko kod implementacji.`;
  }

  private buildPerformanceOptimizationPrompt(
    serviceCode: string,
    performanceRequirements: any
  ): string {
    return `Jestem Alex Thompson, optymalizujący performance backend services.

ZADANIE: Optymalizuj wydajność serwisu.

KOD SERWISU:
${serviceCode}

WYMAGANIA WYDAJNOŚCIOWE:
${JSON.stringify(performanceRequirements, null, 2)}

PRZEPROWADŹ OPTYMALIZACJĘ:

1. DATABASE OPTIMIZATION:
   - Query optimization
   - Index strategy
   - Connection pooling
   - Query result caching

2. API OPTIMIZATION:
   - Response compression
   - Pagination implementation
   - Async/await optimization
   - Memory usage optimization

3. CACHING STRATEGY:
   - Redis integration
   - Application-level caching
   - HTTP caching headers
   - Cache invalidation strategy

ODPOWIEDŹ W FORMACIE JSON - tylko zoptymalizowany kod.`;
  }

  /**
   * Get agent information
   */
  getAgentInfo() {
    return {
      id: this.agentId,
      ...this.agentConfig,
      status: 'active',
      capabilities: [
        'api_service_generation',
        'database_schema_design',
        'authentication_implementation',
        'performance_optimization',
        'security_implementation',
        'microservices_architecture',
        'testing_implementation',
        'monitoring_setup',
      ],
    };
  }
}

export default BackendDeveloperAgent;
