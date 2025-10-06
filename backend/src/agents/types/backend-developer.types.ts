/**
 * Backend Developer Agent Types
 * Comprehensive type definitions for backend development tasks
 */

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
  poolSize?: number;
  timeout?: number;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  parameters: Parameter[];
  requestBody?: RequestBodySchema;
  responses: ResponseSchema[];
  validation: ValidationRule[];
  middleware: string[];
}

export interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  location: 'query' | 'path' | 'header' | 'body';
  required: boolean;
  description: string;
  schema?: any;
}

export interface RequestBodySchema {
  contentType: string;
  schema: any;
  required: boolean;
  examples: any[];
}

export interface ResponseSchema {
  statusCode: number;
  description: string;
  schema: any;
  examples: any[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  value: any;
}

export interface AuthenticationStrategy {
  type: 'jwt' | 'oauth2' | 'basic' | 'apikey' | 'custom';
  configuration: any;
  providers: string[];
  tokenExpiry: number;
}

export interface AuthorizationStrategy {
  type: 'rbac' | 'abac' | 'simple' | 'custom';
  roles: Role[];
  permissions: Permission[];
}

export interface Role {
  name: string;
  description: string;
  permissions: string[];
  hierarchy: number;
}

export interface Permission {
  name: string;
  resource: string;
  action: string;
  conditions?: any[];
}

export interface CachingStrategy {
  enabled: boolean;
  layers: CacheLayer[];
  defaultTTL: number;
}

export interface CacheLayer {
  name: string;
  type: 'memory' | 'redis' | 'database' | 'cdn';
  configuration: any;
}

export interface RateLimitStrategy {
  enabled: boolean;
  limits: RateLimit[];
  strategy: 'token-bucket' | 'sliding-window' | 'fixed-window';
}

export interface RateLimit {
  endpoint?: string;
  method?: string;
  requests: number;
  window: number;
  scope: 'global' | 'user' | 'ip';
}

export interface MonitoringStrategy {
  metrics: MetricConfig[];
  logging: LoggingConfig;
  alerts: AlertConfig[];
  tracing: TracingConfig;
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
}

export interface LoggingConfig {
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'text';
  outputs: string[];
}

export interface AlertConfig {
  name: string;
  condition: string;
  severity: 'critical' | 'warning' | 'info';
  channels: string[];
  throttle: number;
}

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  sampleRate: number;
}

export interface DataModel {
  name: string;
  schema: any;
  relationships: ModelRelationship[];
  indexes: ModelIndex[];
  constraints: ModelConstraint[];
  migrations: Migration[];
}

export interface ModelRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  target: string;
  foreignKey: string;
  cascade: boolean;
}

export interface ModelIndex {
  fields: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface ModelConstraint {
  type: 'unique' | 'check' | 'foreign_key' | 'not_null';
  definition: string;
}

export interface Migration {
  id: string;
  description: string;
  up: string;
  down: string;
  timestamp: Date;
}

export interface BusinessLogicModule {
  name: string;
  type: 'service' | 'repository' | 'controller' | 'middleware' | 'utility';
  dependencies: string[];
  methods: BusinessMethod[];
  events: BusinessEvent[];
}

export interface BusinessMethod {
  name: string;
  parameters: MethodParameter[];
  returnType: string;
  description: string;
  validation: ValidationRule[];
  sideEffects: string[];
}

export interface MethodParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
}

export interface BusinessEvent {
  name: string;
  payload: any;
  subscribers: string[];
}

export interface DeploymentStrategy {
  type: 'docker' | 'serverless' | 'bare-metal' | 'kubernetes';
  configuration: DeploymentConfig;
  environments: Environment[];
  pipeline: PipelineStep[];
}

export interface DeploymentConfig {
  buildCommand: string;
  startCommand: string;
  healthCheck: HealthCheck;
  resources: ResourceRequirements;
}

export interface HealthCheck {
  path: string;
  interval: number;
  timeout: number;
  retries: number;
}

export interface ResourceRequirements {
  cpu: string;
  memory: string;
  storage: string;
}

export interface Environment {
  name: string;
  variables: Record<string, string>;
  secrets: string[];
  replicas: number;
}

export interface PipelineStep {
  name: string;
  type: 'build' | 'test' | 'deploy' | 'validate';
  command: string;
  dependencies: string[];
}

export interface ServiceDependency {
  name: string;
  version: string;
  type: 'npm' | 'system' | 'service' | 'database';
  required: boolean;
}

// Result types for agent operations
export interface CodeGenerationResult {
  files: GeneratedFile[];
  configuration: any;
  documentation: string;
  tests: string[];
  deployment: DeploymentGuide;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'source' | 'config' | 'test' | 'migration' | 'documentation';
  language: string;
}

export interface DeploymentGuide {
  steps: DeploymentStep[];
  prerequisites: string[];
  validation: ValidationCheck[];
}

export interface DeploymentStep {
  order: number;
  title: string;
  description: string;
  commands: string[];
  verification: string;
}

export interface ValidationCheck {
  name: string;
  command: string;
  expectedOutput: string;
}

export interface DatabaseDesignResult {
  schema: DatabaseSchema;
  migrations: Migration[];
  indexing: IndexStrategy;
  optimization: OptimizationRecommendation[];
}

export interface DatabaseSchema {
  tables: TableDefinition[];
  relationships: SchemaRelationship[];
  constraints: SchemaConstraint[];
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKey: string[];
  foreignKeys: ForeignKeyDefinition[];
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  constraints: string[];
}

export interface ForeignKeyDefinition {
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface SchemaRelationship {
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  joinTable?: string;
}

export interface SchemaConstraint {
  name: string;
  type: 'unique' | 'check' | 'exclusion';
  definition: string;
  tables: string[];
}

export interface IndexStrategy {
  indexes: DatabaseIndex[];
  partitioning: PartitionStrategy[];
}

export interface DatabaseIndex {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  unique: boolean;
  where?: string;
}

export interface PartitionStrategy {
  table: string;
  type: 'range' | 'hash' | 'list';
  column: string;
  partitions: PartitionDefinition[];
}

export interface PartitionDefinition {
  name: string;
  condition: string;
}

export interface OptimizationRecommendation {
  type: 'index' | 'query' | 'schema' | 'configuration';
  description: string;
  impact: 'low' | 'medium' | 'high';
  implementation: string;
}

export interface APIDesignResult {
  specification: OpenAPISpecification;
  endpoints: APIEndpoint[];
  authentication: AuthenticationStrategy;
  documentation: APIDocumentation;
}

export interface OpenAPISpecification {
  openapi: string;
  info: APIInfo;
  servers: APIServer[];
  paths: Record<string, any>;
  components: APIComponents;
}

export interface APIInfo {
  title: string;
  description: string;
  version: string;
  contact: ContactInfo;
}

export interface ContactInfo {
  name: string;
  email: string;
  url: string;
}

export interface APIServer {
  url: string;
  description: string;
  variables: Record<string, any>;
}

export interface APIComponents {
  schemas: Record<string, any>;
  responses: Record<string, any>;
  parameters: Record<string, any>;
  securitySchemes: Record<string, any>;
}

export interface APIDocumentation {
  overview: string;
  quickStart: string;
  examples: APIExample[];
  sdks: SDKInfo[];
}

export interface APIExample {
  title: string;
  description: string;
  request: any;
  response: any;
  code: Record<string, string>;
}

export interface SDKInfo {
  language: string;
  repository: string;
  documentation: string;
  examples: string[];
}

export interface PerformanceOptimizationResult {
  bottlenecks: PerformanceBottleneck[];
  optimizations: OptimizationStrategy[];
  monitoring: PerformanceMonitoring;
  benchmarks: BenchmarkResult[];
}

export interface PerformanceBottleneck {
  component: string;
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database';
  severity: 'critical' | 'major' | 'minor';
  description: string;
  impact: string;
}

export interface OptimizationStrategy {
  component: string;
  technique: string;
  description: string;
  implementation: string;
  expectedImprovement: string;
  risks: string[];
}

export interface PerformanceMonitoring {
  metrics: PerformanceMetric[];
  dashboards: Dashboard[];
  alerts: PerformanceAlert[];
}

export interface PerformanceMetric {
  name: string;
  type: 'latency' | 'throughput' | 'errors' | 'saturation';
  threshold: number;
  unit: string;
}

export interface Dashboard {
  name: string;
  panels: DashboardPanel[];
  filters: DashboardFilter[];
}

export interface DashboardPanel {
  title: string;
  type: 'graph' | 'table' | 'single-stat' | 'heatmap';
  query: string;
  visualization: any;
}

export interface DashboardFilter {
  name: string;
  type: 'dropdown' | 'text' | 'date-range';
  options: string[];
}

export interface PerformanceAlert {
  name: string;
  condition: string;
  severity: 'warning' | 'critical';
  notification: string;
}

export interface BenchmarkResult {
  name: string;
  scenario: string;
  metrics: BenchmarkMetric[];
  baseline: BenchmarkBaseline;
}

export interface BenchmarkMetric {
  name: string;
  value: number;
  unit: string;
  percentile?: number;
}

export interface BenchmarkBaseline {
  version: string;
  timestamp: Date;
  metrics: BenchmarkMetric[];
}
