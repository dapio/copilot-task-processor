/**
 * QA Engineer Agent Types
 * Complete type definitions for quality assurance and testing domain
 */

export interface TestSuite {
  id: string;
  name: string;
  type:
    | 'unit'
    | 'integration'
    | 'e2e'
    | 'performance'
    | 'security'
    | 'accessibility';
  description: string;

  // Test configuration
  framework: string;
  testCases: TestCase[];
  coverage: CoverageReport;

  // Execution details
  execution: TestExecution;
  environment: TestEnvironment;

  // Quality metrics
  metrics: QualityMetrics;

  createdAt: Date;
  updatedAt: Date;
}

export interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'positive' | 'negative' | 'boundary' | 'edge_case';
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Test structure
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  actualResult?: string;

  // Test data
  testData: TestData[];

  // Automation
  automated: boolean;
  automationCode?: string;

  // Execution tracking
  status: 'pending' | 'passed' | 'failed' | 'skipped' | 'blocked';
  executionTime?: number;
  lastExecuted?: Date;

  // Defect tracking
  defects: DefectReference[];
}

export interface TestStep {
  stepNumber: number;
  action: string;
  expectedBehavior: string;
  testData?: string;
}

export interface TestData {
  name: string;
  value: string;
  type: 'input' | 'expected' | 'mock';
  description: string;
}

export interface DefectReference {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  description: string;
}

export interface CoverageReport {
  overall: number;
  unit: number;
  integration: number;
  e2e: number;

  // Code coverage details
  statements: number;
  branches: number;
  functions: number;
  lines: number;

  // Feature coverage
  features: FeatureCoverage[];
  requirements: RequirementCoverage[];
}

export interface FeatureCoverage {
  feature: string;
  coverage: number;
  testCases: string[];
  gaps: string[];
}

export interface RequirementCoverage {
  requirement: string;
  covered: boolean;
  testCases: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export interface TestExecution {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;

  // Execution metrics
  duration: number;
  startTime: Date;
  endTime: Date;

  // Stability metrics
  flakiness: number;
  reliability: number;
}

export interface TestEnvironment {
  name: string;
  type: 'local' | 'staging' | 'production' | 'ci';
  configuration: Record<string, any>;

  // Environment setup
  setup: SetupStep[];
  teardown: TeardownStep[];

  // Data management
  dataSeeding: DataSeedStrategy;
  dataCleanup: DataCleanupStrategy;
}

export interface SetupStep {
  name: string;
  action: string;
  required: boolean;
  timeout?: number;
}

export interface TeardownStep {
  name: string;
  action: string;
  required: boolean;
}

export interface DataSeedStrategy {
  method: 'fixtures' | 'factories' | 'api_calls' | 'database_scripts';
  source: string;
  automation: boolean;
}

export interface DataCleanupStrategy {
  method: 'truncate' | 'delete' | 'restore_backup' | 'custom';
  scope: 'test_specific' | 'suite_level' | 'global';
}

export interface QualityMetrics {
  defectDensity: number;
  testEffectiveness: number;
  automationRate: number;

  // Performance metrics
  executionSpeed: PerformanceMetric[];
  resourceUsage: ResourceMetric[];

  // Quality gates
  qualityGates: QualityGate[];

  // Trends
  trends: QualityTrend[];
}

export interface PerformanceMetric {
  metric: string;
  value: number;
  unit: string;
  threshold: number;
}

export interface ResourceMetric {
  resource: string;
  usage: number;
  limit: number;
  unit: string;
}

export interface QualityGate {
  name: string;
  type: 'coverage' | 'performance' | 'security' | 'accessibility';
  threshold: number;
  current: number;
  passed: boolean;
}

export interface QualityTrend {
  metric: string;
  period: string;
  values: number[];
  trend: 'improving' | 'declining' | 'stable';
}

export interface TestPlan {
  id: string;
  name: string;
  objectives: string[];
  scope: TestScope;
  strategy: TestStrategy;
  schedule: TestSchedule;
  resources: TestResource[];
  risks: TestRisk[];
}

export interface TestScope {
  included: string[];
  excluded: string[];
  assumptions: string[];
  dependencies: string[];
}

export interface TestStrategy {
  approach: string;
  levels: TestLevel[];
  types: TestType[];
  techniques: TestTechnique[];
  automation: AutomationStrategy;
}

export interface TestLevel {
  level: 'unit' | 'integration' | 'system' | 'acceptance';
  coverage: number;
  priority: 'low' | 'medium' | 'high';
  tools: string[];
}

export interface TestType {
  type: 'functional' | 'non_functional' | 'maintenance';
  subtypes: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface TestTechnique {
  technique: string;
  applicability: string[];
  effectiveness: number;
}

export interface AutomationStrategy {
  scope: number; // percentage of tests to automate
  tools: string[];
  frameworks: string[];
  timeline: string;
  maintainability: string;
}

export interface TestSchedule {
  phases: TestPhase[];
  milestones: TestMilestone[];
  dependencies: string[];
}

export interface TestPhase {
  name: string;
  startDate: Date;
  endDate: Date;
  activities: string[];
  deliverables: string[];
}

export interface TestMilestone {
  name: string;
  date: Date;
  criteria: string[];
  dependencies: string[];
}

export interface TestResource {
  type: 'human' | 'tool' | 'environment' | 'data';
  name: string;
  availability: string;
  allocation: number;
  cost?: number;
}

export interface TestRisk {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  contingency: string;
}

// Agent configuration types
export interface QAAgentConfig {
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  workingStyle: string;
  communicationStyle: string;
  qualityStandards: string[];
}

// Result types
export interface TestPlanResult {
  plan: TestPlan;
  estimatedEffort: number;
  timeline: string;
  riskAssessment: string;
}

export interface TestSuiteResult {
  suite: TestSuite;
  generatedTests: number;
  coverage: number;
  automationCode?: string;
}

export interface QualityAssessmentResult {
  overallScore: number;
  areas: QualityArea[];
  recommendations: QualityRecommendation[];
  actionPlan: string[];
}

export interface QualityArea {
  area: string;
  score: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  details: string[];
}

export interface QualityRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  area: string;
  recommendation: string;
  impact: string;
  effort: string;
}
