/**
 * Microsoft Reviewer Agent Types
 * Comprehensive type definitions for Microsoft code review and analysis tasks
 */

export interface CodeReview {
  id: string;
  title: string;
  description: string;

  // Review metadata
  author: string;
  reviewerId: string;
  status:
    | 'pending'
    | 'in_progress'
    | 'approved'
    | 'rejected'
    | 'changes_requested';
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Code analysis
  codeChanges: CodeChange[];
  metrics: {
    complexity: ComplexityMetrics;
    quality: QualityMetrics;
    coverage: CoverageMetrics;
  };

  // Review findings
  standardsCheck: StandardsCheck[];
  securityCheck: SecurityCheck[];
  performanceCheck: PerformanceCheck[];
  codeSmells: CodeSmell[];
  duplications: CodeDuplication[];
  potentialBugs: PotentialBug[];

  // Microsoft-specific
  microsoftBestPractices: MicrosoftBestPractice[];
  azureOptimizations: AzureOptimization[];
  dotNetStandards: DotNetStandard[];

  createdAt: Date;
  updatedAt: Date;
}

export interface CodeChange {
  id: string;
  filePath: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  language:
    | 'typescript'
    | 'javascript'
    | 'csharp'
    | 'python'
    | 'java'
    | 'other';
  linesAdded: number;
  linesDeleted: number;
  linesModified: number;
  complexity: number;
  purpose: string;
  impact: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  linesOfCode: number;
  technicalDebt: number;
}

export interface QualityMetrics {
  codeSmellsCount: number;
  duplicationsCount: number;
  bugsCount: number;
  vulnerabilitiesCount: number;
  reliabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  maintainabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  securityRating: 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface CoverageMetrics {
  lineCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  statementCoverage: number;
  uncoveredLines: number[];
}

export interface StandardsCheck {
  rule: string;
  category:
    | 'naming'
    | 'structure'
    | 'documentation'
    | 'performance'
    | 'maintainability';
  severity: 'info' | 'minor' | 'major' | 'critical' | 'blocker';
  message: string;
  filePath: string;
  lineNumber: number;
  suggestion: string;
}

export interface SecurityCheck {
  type: 'vulnerability' | 'hotspot' | 'weakness';
  category:
    | 'injection'
    | 'authentication'
    | 'authorization'
    | 'cryptography'
    | 'input_validation';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  cweId?: string;
  owasp?: string;
  description: string;
  remediation: string;
}

export interface PerformanceCheck {
  type:
    | 'memory_leak'
    | 'inefficient_algorithm'
    | 'database_query'
    | 'resource_usage';
  impact: 'low' | 'medium' | 'high';
  description: string;
  location: string;
  suggestion: string;
}

export interface CodeSmell {
  type:
    | 'long_method'
    | 'large_class'
    | 'duplicate_code'
    | 'dead_code'
    | 'complex_condition';
  severity: 'minor' | 'major' | 'critical';
  description: string;
  filePath: string;
  startLine: number;
  endLine: number;
  refactoringSuggestion: string;
}

export interface CodeDuplication {
  filePath1: string;
  filePath2: string;
  startLine1: number;
  endLine1: number;
  startLine2: number;
  endLine2: number;
  duplicatedLines: number;
  similarity: number;
}

export interface PotentialBug {
  type:
    | 'null_reference'
    | 'resource_leak'
    | 'logic_error'
    | 'type_error'
    | 'concurrency_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  filePath: string;
  lineNumber: number;
  fix: string;
  confidence: number;
}

export interface SecurityVulnerability {
  id: string;
  type:
    | 'injection'
    | 'broken_auth'
    | 'sensitive_exposure'
    | 'xxe'
    | 'broken_access'
    | 'misconfiguration';
  severity: 'low' | 'medium' | 'high' | 'critical';
  cvssScore?: number;
  description: string;
  impact: string;
  remediation: string;
  references: string[];
}

export interface SecurityAnalysis {
  vulnerabilities: SecurityVulnerability[];
  dataProtection: DataProtectionCheck[];
  authentication: AuthenticationCheck[];
  authorization: AuthorizationCheck[];
  inputValidation: InputValidationCheck[];
  cryptography: CryptographyCheck[];
}

export interface DataProtectionCheck {
  type:
    | 'pii_exposure'
    | 'data_encryption'
    | 'data_retention'
    | 'gdpr_compliance';
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation: string;
}

export interface AuthenticationCheck {
  type:
    | 'password_policy'
    | 'mfa_enabled'
    | 'session_management'
    | 'token_security';
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation: string;
}

export interface AuthorizationCheck {
  type:
    | 'rbac_implementation'
    | 'privilege_escalation'
    | 'access_control'
    | 'resource_protection';
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation: string;
}

export interface InputValidationCheck {
  type:
    | 'sql_injection'
    | 'xss_protection'
    | 'csrf_protection'
    | 'input_sanitization';
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation: string;
}

export interface CryptographyCheck {
  type:
    | 'encryption_strength'
    | 'key_management'
    | 'hashing_algorithm'
    | 'random_generation';
  status: 'pass' | 'fail' | 'warning';
  description: string;
  recommendation: string;
}

export interface PerformanceAnalysis {
  bottlenecks: PerformanceBottleneck[];
  optimizations: OptimizationSuggestion[];
  resourceUsage: ResourceUsageAnalysis;
  scalability: ScalabilityAssessment;
}

export interface PerformanceBottleneck {
  type:
    | 'cpu_intensive'
    | 'memory_intensive'
    | 'io_bound'
    | 'network_latency'
    | 'database_query';
  location: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  metrics: PerformanceMetrics;
}

export interface OptimizationSuggestion {
  type: 'algorithm' | 'caching' | 'database' | 'architecture' | 'configuration';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImprovement: string;
  implementation: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ResourceUsageAnalysis {
  memory: MemoryUsage;
  cpu: CpuUsage;
  disk: DiskUsage;
  network: NetworkUsage;
}

export interface MemoryUsage {
  peak: number;
  average: number;
  leaks: MemoryLeak[];
  allocations: AllocationPattern[];
}

export interface CpuUsage {
  average: number;
  peak: number;
  hotspots: CpuHotspot[];
  threads: ThreadAnalysis[];
}

export interface DiskUsage {
  reads: number;
  writes: number;
  throughput: number;
  inefficientAccess: DiskInefficiency[];
}

export interface NetworkUsage {
  bandwidth: number;
  latency: number;
  requests: number;
  inefficientCalls: NetworkInefficiency[];
}

export interface MemoryLeak {
  location: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

export interface AllocationPattern {
  type: string;
  frequency: number;
  size: number;
  efficiency: 'good' | 'poor' | 'bad';
}

export interface CpuHotspot {
  function: string;
  usage: number;
  optimizable: boolean;
  suggestion: string;
}

export interface ThreadAnalysis {
  threadCount: number;
  contention: number;
  deadlocks: Deadlock[];
  suggestions: string[];
}

export interface DiskInefficiency {
  type:
    | 'frequent_small_reads'
    | 'unnecessary_writes'
    | 'sequential_access'
    | 'large_files';
  impact: string;
  optimization: string;
}

export interface NetworkInefficiency {
  type:
    | 'excessive_calls'
    | 'large_payloads'
    | 'synchronous_calls'
    | 'no_caching';
  impact: string;
  optimization: string;
}

export interface Deadlock {
  location: string;
  resources: string[];
  resolution: string;
}

export interface ScalabilityAssessment {
  currentCapacity: number;
  projectedLoad: number;
  bottlenecks: ScalabilityBottleneck[];
  recommendations: ScalabilityRecommendation[];
}

export interface ScalabilityBottleneck {
  component: string;
  type: 'vertical' | 'horizontal';
  limit: string;
  impact: string;
}

export interface ScalabilityRecommendation {
  type: 'architecture' | 'infrastructure' | 'caching' | 'database';
  description: string;
  benefit: string;
  effort: 'low' | 'medium' | 'high';
}

export interface MicrosoftBestPractice {
  category:
    | 'coding_standards'
    | 'architecture'
    | 'security'
    | 'performance'
    | 'testing';
  rule: string;
  description: string;
  compliance: 'compliant' | 'partial' | 'non_compliant';
  recommendation: string;
  documentation: string;
}

export interface AzureOptimization {
  service: string;
  type: 'cost' | 'performance' | 'security' | 'reliability' | 'maintainability';
  current: string;
  recommended: string;
  benefit: string;
  implementation: string;
  cost: number;
  roi: number;
}

export interface DotNetStandard {
  category: 'naming' | 'design' | 'performance' | 'security' | 'globalization';
  rule: string;
  level: 'required' | 'recommended' | 'optional';
  compliance: 'compliant' | 'partial' | 'non_compliant';
  guideline: string;
  example: string;
}

export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  throughput: number;
  latency: number;
}

// Result types for agent operations
export interface CodeReviewResult {
  overall: OverallAssessment;
  quality: QualityAssessment;
  security: SecurityAssessment;
  performance: PerformanceAssessment;
  microsoft: MicrosoftAssessment;
  recommendations: RecommendationSummary;
}

export interface OverallAssessment {
  rating: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  score: number;
  summary: string;
  keyFindings: string[];
  blockers: string[];
}

export interface QualityAssessment {
  maintainability: QualityRating;
  reliability: QualityRating;
  testability: QualityRating;
  complexity: ComplexityAssessment;
  coverage: CoverageAssessment;
}

export interface QualityRating {
  rating: 'A' | 'B' | 'C' | 'D' | 'E';
  score: number;
  issues: QualityIssue[];
  improvements: string[];
}

export interface QualityIssue {
  type: string;
  severity: 'minor' | 'major' | 'critical';
  count: number;
  examples: string[];
}

export interface ComplexityAssessment {
  overall: number;
  highest: ComplexFunction[];
  recommendations: string[];
}

export interface ComplexFunction {
  name: string;
  complexity: number;
  location: string;
  refactoring: string;
}

export interface CoverageAssessment {
  overall: number;
  gaps: CoverageGap[];
  recommendations: string[];
}

export interface CoverageGap {
  type: 'untested_functions' | 'untested_branches' | 'untested_lines';
  count: number;
  critical: string[];
}

export interface SecurityAssessment {
  overall: SecurityRating;
  vulnerabilities: VulnerabilityReport;
  compliance: ComplianceReport;
  recommendations: SecurityRecommendation[];
}

export interface SecurityRating {
  rating: 'A' | 'B' | 'C' | 'D' | 'E';
  score: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface VulnerabilityReport {
  critical: number;
  high: number;
  medium: number;
  low: number;
  details: SecurityVulnerability[];
}

export interface ComplianceReport {
  owasp: OwaspCompliance;
  gdpr: GdprCompliance;
  iso27001: Iso27001Compliance;
  custom: CustomCompliance[];
}

export interface OwaspCompliance {
  score: number;
  top10Coverage: OwaspTop10Item[];
}

export interface OwaspTop10Item {
  rank: number;
  category: string;
  status: 'protected' | 'vulnerable' | 'unknown';
  findings: string[];
}

export interface GdprCompliance {
  dataProtection: boolean;
  consent: boolean;
  rightToErasure: boolean;
  dataPortability: boolean;
  findings: string[];
}

export interface Iso27001Compliance {
  informationSecurity: boolean;
  riskManagement: boolean;
  accessControl: boolean;
  cryptography: boolean;
  findings: string[];
}

export interface CustomCompliance {
  standard: string;
  requirements: ComplianceRequirement[];
  overallCompliance: number;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  compliant: boolean;
  evidence: string;
  gaps: string[];
}

export interface SecurityRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category:
    | 'authentication'
    | 'authorization'
    | 'encryption'
    | 'validation'
    | 'monitoring';
  description: string;
  implementation: string;
  timeline: string;
  cost: 'low' | 'medium' | 'high';
}

export interface PerformanceAssessment {
  overall: PerformanceRating;
  bottlenecks: BottleneckAnalysis;
  optimizations: OptimizationPlan;
  scalability: ScalabilityPlan;
}

export interface PerformanceRating {
  score: number;
  rating: 'excellent' | 'good' | 'acceptable' | 'poor' | 'critical';
  benchmarks: BenchmarkComparison[];
}

export interface BenchmarkComparison {
  metric: string;
  current: number;
  target: number;
  industry: number;
  status: 'above' | 'at' | 'below';
}

export interface BottleneckAnalysis {
  identified: number;
  critical: PerformanceBottleneck[];
  recommendations: BottleneckRecommendation[];
}

export interface BottleneckRecommendation {
  bottleneck: string;
  solution: string;
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
}

export interface OptimizationPlan {
  quickWins: OptimizationItem[];
  mediumTerm: OptimizationItem[];
  longTerm: OptimizationItem[];
  totalBenefit: string;
}

export interface OptimizationItem {
  name: string;
  description: string;
  effort: string;
  benefit: string;
  timeline: string;
  dependencies: string[];
}

export interface ScalabilityPlan {
  currentCapacity: CapacityMetrics;
  projectedNeeds: CapacityMetrics;
  scalingStrategy: ScalingStrategy;
  timeline: ScalingTimeline[];
}

export interface CapacityMetrics {
  users: number;
  requests: number;
  dataVolume: number;
  storage: number;
}

export interface ScalingStrategy {
  horizontal: HorizontalScaling;
  vertical: VerticalScaling;
  hybrid: HybridScaling;
  recommended: 'horizontal' | 'vertical' | 'hybrid';
}

export interface HorizontalScaling {
  approach: string;
  benefits: string[];
  challenges: string[];
  cost: number;
}

export interface VerticalScaling {
  approach: string;
  benefits: string[];
  challenges: string[];
  cost: number;
}

export interface HybridScaling {
  approach: string;
  benefits: string[];
  challenges: string[];
  cost: number;
}

export interface ScalingTimeline {
  phase: string;
  duration: string;
  activities: string[];
  milestones: string[];
}

export interface MicrosoftAssessment {
  bestPractices: BestPracticeCompliance;
  azure: AzureAssessment;
  dotnet: DotNetAssessment;
  recommendations: MicrosoftRecommendation[];
}

export interface BestPracticeCompliance {
  overall: number;
  categories: CategoryCompliance[];
  gaps: ComplianceGap[];
}

export interface CategoryCompliance {
  category: string;
  compliance: number;
  rules: RuleCompliance[];
}

export interface RuleCompliance {
  rule: string;
  compliant: boolean;
  severity: 'info' | 'warning' | 'error';
  recommendation: string;
}

export interface ComplianceGap {
  area: string;
  description: string;
  impact: string;
  resolution: string;
}

export interface AzureAssessment {
  services: AzureServiceAssessment[];
  architecture: AzureArchitectureAssessment;
  costs: AzureCostAnalysis;
  security: AzureSecurityAssessment;
}

export interface AzureServiceAssessment {
  service: string;
  usage: 'optimal' | 'overprovisioned' | 'underprovisioned' | 'misconfigured';
  recommendations: string[];
  costImpact: number;
}

export interface AzureArchitectureAssessment {
  patterns: ArchitecturePattern[];
  antipatterns: ArchitectureAntipattern[];
  improvements: ArchitectureImprovement[];
}

export interface ArchitecturePattern {
  name: string;
  implemented: boolean;
  benefit: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface ArchitectureAntipattern {
  name: string;
  detected: boolean;
  risk: string;
  mitigation: string;
}

export interface ArchitectureImprovement {
  area: string;
  current: string;
  recommended: string;
  benefit: string;
}

export interface AzureCostAnalysis {
  current: number;
  optimized: number;
  savings: number;
  recommendations: CostRecommendation[];
}

export interface CostRecommendation {
  service: string;
  action: string;
  savings: number;
  effort: 'low' | 'medium' | 'high';
}

export interface AzureSecurityAssessment {
  securityCenter: SecurityCenterAssessment;
  compliance: AzureComplianceStatus;
  recommendations: AzureSecurityRecommendation[];
}

export interface SecurityCenterAssessment {
  score: number;
  recommendations: number;
  alerts: SecurityAlert[];
}

export interface SecurityAlert {
  severity: 'low' | 'medium' | 'high';
  category: string;
  description: string;
  remediation: string;
}

export interface AzureComplianceStatus {
  standards: ComplianceStandard[];
  overall: number;
}

export interface ComplianceStandard {
  name: string;
  compliance: number;
  controls: ControlCompliance[];
}

export interface ControlCompliance {
  id: string;
  name: string;
  compliant: boolean;
  findings: string[];
}

export interface AzureSecurityRecommendation {
  type: 'configuration' | 'policy' | 'monitoring' | 'access';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  implementation: string;
}

export interface DotNetAssessment {
  version: DotNetVersionAssessment;
  standards: DotNetStandardsAssessment;
  packages: PackageAssessment;
  performance: DotNetPerformanceAssessment;
}

export interface DotNetVersionAssessment {
  current: string;
  recommended: string;
  eolDate?: Date;
  migrationEffort: 'low' | 'medium' | 'high';
  benefits: string[];
}

export interface DotNetStandardsAssessment {
  compliance: number;
  violations: StandardViolation[];
  recommendations: string[];
}

export interface StandardViolation {
  rule: string;
  severity: 'info' | 'warning' | 'error';
  count: number;
  examples: string[];
}

export interface PackageAssessment {
  total: number;
  outdated: OutdatedPackage[];
  vulnerable: VulnerablePackage[];
  unused: string[];
  recommendations: PackageRecommendation[];
}

export interface OutdatedPackage {
  name: string;
  current: string;
  latest: string;
  breaking: boolean;
  security: boolean;
}

export interface VulnerablePackage {
  name: string;
  version: string;
  vulnerability: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fix: string;
}

export interface PackageRecommendation {
  type: 'update' | 'replace' | 'remove';
  package: string;
  reason: string;
  action: string;
}

export interface DotNetPerformanceAssessment {
  memory: MemoryPerformance;
  gc: GarbageCollectionAnalysis;
  async: AsyncPatternAnalysis;
  recommendations: DotNetPerformanceRecommendation[];
}

export interface MemoryPerformance {
  allocations: number;
  collections: number;
  efficiency: 'excellent' | 'good' | 'acceptable' | 'poor';
  issues: MemoryIssue[];
}

export interface MemoryIssue {
  type: 'leak' | 'excessive_allocation' | 'retention' | 'fragmentation';
  location: string;
  impact: string;
  fix: string;
}

export interface GarbageCollectionAnalysis {
  frequency: number;
  duration: number;
  efficiency: 'excellent' | 'good' | 'acceptable' | 'poor';
  recommendations: string[];
}

export interface AsyncPatternAnalysis {
  usage: number;
  antipatterns: AsyncAntipattern[];
  recommendations: string[];
}

export interface AsyncAntipattern {
  pattern: string;
  location: string;
  issue: string;
  fix: string;
}

export interface DotNetPerformanceRecommendation {
  category: 'memory' | 'cpu' | 'io' | 'async' | 'gc';
  description: string;
  implementation: string;
  benefit: string;
}

export interface MicrosoftRecommendation {
  type:
    | 'architecture'
    | 'security'
    | 'performance'
    | 'maintainability'
    | 'cost';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  implementation: Implementation;
  timeline: string;
  resources: string[];
}

export interface Implementation {
  steps: ImplementationStep[];
  prerequisites: string[];
  risks: ImplementationRisk[];
  verification: string[];
}

export interface ImplementationStep {
  order: number;
  description: string;
  duration: string;
  dependencies: string[];
  deliverables: string[];
}

export interface ImplementationRisk {
  risk: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export interface RecommendationSummary {
  total: number;
  byPriority: PriorityBreakdown;
  byCategory: CategoryBreakdown;
  timeline: RecommendationTimeline;
  effort: EffortEstimate;
}

export interface PriorityBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface CategoryBreakdown {
  security: number;
  performance: number;
  quality: number;
  maintainability: number;
  architecture: number;
}

export interface RecommendationTimeline {
  immediate: number;
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
}

export interface EffortEstimate {
  total: number;
  breakdown: EffortBreakdown;
  resources: ResourceEstimate[];
}

export interface EffortBreakdown {
  development: number;
  testing: number;
  deployment: number;
  training: number;
}

export interface ResourceEstimate {
  role: string;
  hours: number;
  cost: number;
}
