/**
 * System Architect Types
 * Type definitions for System Architecture Agent
 */

export interface SystemArchitecture {
  id: string;
  name: string;
  type: 'microservices' | 'monolith' | 'serverless' | 'hybrid' | 'event_driven';
  description: string;

  // Technical components
  layers: ArchitectureLayer[];
  components: SystemComponent[];
  integrations: Integration[];

  // Quality attributes
  scalability: QualityAttribute;
  performance: QualityAttribute;
  security: QualityAttribute;
  maintainability: QualityAttribute;
  availability: QualityAttribute;

  // Technical decisions
  technologyStack: TechnologyStack;
  dataStrategy: DataStrategy;
  deploymentStrategy: DeploymentStrategy;

  // Documentation
  diagrams: ArchitectureDiagram[];
  decisions: ArchitecturalDecision[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ArchitectureLayer {
  name: string;
  type: 'presentation' | 'business' | 'data' | 'integration' | 'infrastructure';
  description: string;
  technologies: string[];
  responsibilities: string[];
  components: string[];
}

export interface SystemComponent {
  id: string;
  name: string;
  type: 'service' | 'database' | 'api' | 'ui' | 'gateway' | 'cache' | 'queue';
  description: string;
  layer: string;
  responsibilities: string[];
  interfaces: ComponentInterface[];
  dependencies: string[];
  technologies: string[];
}

export interface Integration {
  id: string;
  name: string;
  type: 'api' | 'event' | 'database' | 'file' | 'messaging';
  description: string;
  sourceComponent: string;
  targetComponent: string;
  protocol: string;
  dataFormat: string;
  securityRequirements: string[];
}

export interface QualityAttribute {
  level: 'low' | 'medium' | 'high' | 'critical';
  requirements: string[];
  strategies: string[];
  metrics: QualityMetric[];
}

export interface QualityMetric {
  name: string;
  target: string;
  measurement: string;
}

export interface TechnologyStack {
  frontend: Technology[];
  backend: Technology[];
  database: Technology[];
  infrastructure: Technology[];
  monitoring: Technology[];
}

export interface Technology {
  name: string;
  version?: string;
  purpose: string;
  alternatives?: string[];
  justification: string;
}

export interface DataStrategy {
  approach: 'centralized' | 'decentralized' | 'hybrid';
  databases: DatabaseDesign[];
  dataFlow: DataFlow[];
  consistency: 'strong' | 'eventual' | 'mixed';
}

export interface DatabaseDesign {
  name: string;
  type: 'sql' | 'nosql' | 'cache' | 'search';
  technology: string;
  purpose: string;
  entities: string[];
}

export interface DataFlow {
  source: string;
  target: string;
  type: 'sync' | 'async' | 'batch';
  volume: string;
  frequency: string;
}

export interface DeploymentStrategy {
  approach: 'containerized' | 'serverless' | 'vm' | 'hybrid';
  environment: EnvironmentConfig[];
  cicd: CICDConfig;
  scaling: ScalingStrategy;
}

export interface EnvironmentConfig {
  name: string;
  type: 'development' | 'staging' | 'production';
  infrastructure: string;
  resources: ResourceRequirements;
}

export interface ResourceRequirements {
  cpu: string;
  memory: string;
  storage: string;
  network: string;
}

export interface CICDConfig {
  pipeline: string;
  stages: string[];
  tools: string[];
  automation: string[];
}

export interface ScalingStrategy {
  horizontal: boolean;
  vertical: boolean;
  autoScaling: boolean;
  triggers: string[];
}

export interface ArchitectureDiagram {
  id: string;
  type: 'context' | 'container' | 'component' | 'deployment' | 'sequence';
  name: string;
  description: string;
  content: string;
  format: 'plantuml' | 'mermaid' | 'draw.io';
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'deprecated';
  context: string;
  decision: string;
  consequences: string[];
  alternatives: string[];
  date: Date;
}

export interface ComponentInterface {
  name: string;
  type: 'rest' | 'graphql' | 'grpc' | 'event' | 'database';
  operations: InterfaceOperation[];
}

export interface InterfaceOperation {
  name: string;
  method?: string;
  input: string;
  output: string;
  description: string;
}

export interface ArchitectureAnalysisRequest {
  projectId: string;
  requirements: ProjectRequirement[];
  constraints: ArchitectureConstraint[];
  existingSystem?: SystemArchitecture;
}

export interface ProjectRequirement {
  id: string;
  type: 'functional' | 'non_functional' | 'business' | 'technical';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source: string;
}

export interface ArchitectureConstraint {
  type: 'technology' | 'budget' | 'timeline' | 'regulatory' | 'integration';
  description: string;
  impact: 'low' | 'medium' | 'high';
}

export interface TechnologySelectionRequest {
  category: keyof TechnologyStack;
  requirements: string[];
  constraints: ArchitectureConstraint[];
  existingTechnologies?: Technology[];
}

export interface ScalabilityAnalysisRequest {
  architecture: SystemArchitecture;
  loadProjections: LoadProjection[];
  timeframe: string;
}

export interface LoadProjection {
  metric: string;
  current: number;
  projected: number;
  timeframe: string;
}

export interface ArchitectureReview {
  architecture: SystemArchitecture;
  strengths: string[];
  weaknesses: string[];
  risks: ArchitectureRisk[];
  recommendations: Recommendation[];
  score: number;
}

export interface ArchitectureRisk {
  type: 'technical' | 'security' | 'performance' | 'maintainability';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  mitigation: string[];
}

export interface Recommendation {
  type: 'improvement' | 'optimization' | 'refactoring' | 'migration';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  effort: string;
  benefits: string[];
}
