/**
 * Business Analyst Agent Types
 * Comprehensive type definitions for business analysis tasks
 */

export interface BusinessRequirement {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'functional' | 'non_functional' | 'business_rule' | 'constraint';
  status: 'draft' | 'review' | 'approved' | 'rejected' | 'implemented';

  // Stakeholder info
  stakeholder: string;
  stakeholderRole: string;

  // Analysis
  complexity: 'simple' | 'medium' | 'complex' | 'enterprise';
  estimatedEffort: string;
  dependencies: string[];
  risks: string[];

  // Traceability
  acceptanceCriteria: string[];
  testScenarios: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface StakeholderAnalysis {
  name: string;
  role: string;
  influence: 'low' | 'medium' | 'high';
  interest: 'low' | 'medium' | 'high';
  communicationPreference: 'email' | 'meetings' | 'documentation' | 'demos';
  concerns: string[];
  expectations: string[];
}

export interface BusinessProcessMap {
  processName: string;
  currentState: string;
  futureState: string;
  painPoints: string[];
  improvements: string[];
  kpis: Array<{
    name: string;
    currentValue: string;
    targetValue: string;
    measurementMethod: string;
  }>;
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  asA: string;
  iWant: string;
  soThat: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  storyPoints: number;
  acceptanceCriteria: AcceptanceCriteria[];
  dependencies: string[];
  epic?: string;
  theme?: string;
}

export interface AcceptanceCriteria {
  id: string;
  given: string;
  when: string;
  then: string;
  priority: 'must' | 'should' | 'could' | 'wont';
}

export interface BusinessCase {
  id: string;
  title: string;
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  benefits: BusinessBenefit[];
  costs: BusinessCost[];
  risks: BusinessRisk[];
  timeline: ProjectTimeline;
  roi: ROIAnalysis;
  recommendation: string;
}

export interface BusinessBenefit {
  type:
    | 'cost_savings'
    | 'revenue_increase'
    | 'efficiency_gain'
    | 'risk_reduction'
    | 'strategic';
  description: string;
  quantifiable: boolean;
  value?: number;
  currency?: string;
  timeframe: string;
  assumptions: string[];
}

export interface BusinessCost {
  category:
    | 'development'
    | 'infrastructure'
    | 'training'
    | 'maintenance'
    | 'operational';
  description: string;
  amount: number;
  currency: string;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'yearly';
  confidence: 'low' | 'medium' | 'high';
}

export interface BusinessRisk {
  category:
    | 'technical'
    | 'business'
    | 'operational'
    | 'financial'
    | 'regulatory';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  contingency: string;
}

export interface ProjectTimeline {
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  dependencies: ProjectDependency[];
  criticalPath: string[];
}

export interface ProjectPhase {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  deliverables: string[];
  resources: ResourceRequirement[];
}

export interface ProjectMilestone {
  name: string;
  description: string;
  date: Date;
  criteria: string[];
  dependencies: string[];
}

export interface ProjectDependency {
  from: string;
  to: string;
  type:
    | 'finish_to_start'
    | 'start_to_start'
    | 'finish_to_finish'
    | 'start_to_finish';
  lag?: number;
}

export interface ResourceRequirement {
  role: string;
  skills: string[];
  allocation: number; // percentage
  duration: string;
  cost?: number;
}

export interface ROIAnalysis {
  totalBenefits: number;
  totalCosts: number;
  netBenefit: number;
  roi: number;
  paybackPeriod: number;
  npv: number;
  irr: number;
  breakEvenPoint: Date;
}

export interface GapAnalysis {
  currentState: StateDescription;
  futureState: StateDescription;
  gaps: Gap[];
  priorities: GapPriority[];
  recommendations: string[];
}

export interface StateDescription {
  processes: ProcessDescription[];
  capabilities: CapabilityDescription[];
  systems: SystemDescription[];
  organization: OrganizationDescription;
  performance: PerformanceMetrics;
}

export interface ProcessDescription {
  name: string;
  description: string;
  owner: string;
  inputs: string[];
  outputs: string[];
  steps: ProcessStep[];
  kpis: KPI[];
}

export interface ProcessStep {
  order: number;
  name: string;
  description: string;
  responsible: string;
  duration: string;
  tools: string[];
}

export interface CapabilityDescription {
  name: string;
  description: string;
  maturityLevel:
    | 'initial'
    | 'managed'
    | 'defined'
    | 'quantitatively_managed'
    | 'optimizing';
  capabilities: string[];
  gaps: string[];
}

export interface SystemDescription {
  name: string;
  purpose: string;
  technology: string;
  integrations: string[];
  limitations: string[];
  replacementNeeded: boolean;
}

export interface OrganizationDescription {
  structure: string;
  roles: RoleDescription[];
  skills: SkillDescription[];
  culture: CultureDescription;
}

export interface RoleDescription {
  title: string;
  responsibilities: string[];
  requiredSkills: string[];
  currentCapacity: number;
  futureCapacity: number;
}

export interface SkillDescription {
  name: string;
  currentLevel:
    | 'novice'
    | 'advanced_beginner'
    | 'competent'
    | 'proficient'
    | 'expert';
  requiredLevel:
    | 'novice'
    | 'advanced_beginner'
    | 'competent'
    | 'proficient'
    | 'expert';
  gap: number;
  trainingNeeded: string;
}

export interface CultureDescription {
  changeReadiness: 'resistant' | 'neutral' | 'supportive' | 'enthusiastic';
  communicationStyle: string;
  decisionMaking: string;
  riskTolerance: 'low' | 'medium' | 'high';
}

export interface PerformanceMetrics {
  kpis: KPI[];
  benchmarks: Benchmark[];
  targets: Target[];
}

export interface KPI {
  name: string;
  description: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  frequency: string;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Benchmark {
  name: string;
  industryAverage: number;
  bestInClass: number;
  ourPerformance: number;
  gap: number;
}

export interface Target {
  kpi: string;
  shortTerm: number;
  mediumTerm: number;
  longTerm: number;
  assumptions: string[];
}

export interface Gap {
  category:
    | 'process'
    | 'capability'
    | 'system'
    | 'organization'
    | 'performance';
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  effort: 'low' | 'medium' | 'high' | 'very_high';
  timeline: string;
  dependencies: string[];
}

export interface GapPriority {
  gap: string;
  priority: number;
  rationale: string;
  quickWins: boolean;
  strategicImportance: 'low' | 'medium' | 'high';
}

export interface RequirementsTraceability {
  businessRequirements: BusinessRequirement[];
  userStories: UserStory[];
  acceptanceCriteria: AcceptanceCriteria[];
  testCases: TestCase[];
  designElements: DesignElement[];
}

export interface TestCase {
  id: string;
  requirementId: string;
  userStoryId: string;
  title: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  expectedResult: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface TestStep {
  order: number;
  action: string;
  data: string;
  expectedResult: string;
}

export interface DesignElement {
  id: string;
  type: 'screen' | 'component' | 'workflow' | 'data_structure' | 'integration';
  name: string;
  description: string;
  requirements: string[];
  userStories: string[];
}

// Result types for agent operations
export interface BusinessAnalysisResult {
  requirements: BusinessRequirement[];
  stakeholders: StakeholderAnalysis[];
  processes: BusinessProcessMap[];
  userStories: UserStory[];
  traceability: RequirementsTraceability;
}

export interface RequirementsPrioritizationResult {
  prioritizedRequirements: PrioritizedRequirement[];
  rationale: string;
  dependencies: RequirementDependency[];
  recommendations: string[];
}

export interface PrioritizedRequirement {
  requirement: BusinessRequirement;
  priorityScore: number;
  businessValue: number;
  complexity: number;
  risk: number;
  dependencies: string[];
}

export interface RequirementDependency {
  from: string;
  to: string;
  type: 'blocks' | 'depends_on' | 'related' | 'conflicts';
  description: string;
}

export interface ProcessOptimizationResult {
  currentProcessAnalysis: ProcessAnalysis;
  optimizedProcess: ProcessDesign;
  improvements: ProcessImprovement[];
  implementation: ImplementationPlan;
}

export interface ProcessAnalysis {
  process: ProcessDescription;
  bottlenecks: Bottleneck[];
  inefficiencies: Inefficiency[];
  opportunities: Opportunity[];
  metrics: ProcessMetrics;
}

export interface Bottleneck {
  step: string;
  description: string;
  impact: string;
  rootCause: string;
  solution: string;
}

export interface Inefficiency {
  area: string;
  description: string;
  waste:
    | 'waiting'
    | 'overproduction'
    | 'transportation'
    | 'processing'
    | 'inventory'
    | 'motion'
    | 'defects';
  impact: string;
  solution: string;
}

export interface Opportunity {
  area: string;
  description: string;
  type:
    | 'automation'
    | 'elimination'
    | 'simplification'
    | 'integration'
    | 'standardization';
  benefit: string;
  effort: 'low' | 'medium' | 'high';
}

export interface ProcessMetrics {
  cycleTime: number;
  leadTime: number;
  throughput: number;
  errorRate: number;
  reworkRate: number;
  customerSatisfaction: number;
  cost: number;
}

export interface ProcessDesign {
  name: string;
  description: string;
  steps: OptimizedProcessStep[];
  automation: AutomationOpportunity[];
  roles: ProcessRole[];
  systems: ProcessSystem[];
  metrics: ProcessMetrics;
}

export interface OptimizedProcessStep {
  order: number;
  name: string;
  description: string;
  type: 'manual' | 'automated' | 'decision' | 'wait';
  responsible: string;
  duration: string;
  tools: string[];
  inputs: string[];
  outputs: string[];
}

export interface AutomationOpportunity {
  step: string;
  type: 'rpa' | 'workflow' | 'integration' | 'ai_ml';
  description: string;
  benefit: string;
  complexity: 'low' | 'medium' | 'high';
  roi: number;
}

export interface ProcessRole {
  name: string;
  responsibilities: string[];
  skills: string[];
  training: string[];
}

export interface ProcessSystem {
  name: string;
  purpose: string;
  integration: string[];
  requirements: string[];
}

export interface ProcessImprovement {
  category: 'efficiency' | 'quality' | 'cost' | 'time' | 'compliance';
  description: string;
  currentState: string;
  futureState: string;
  benefit: string;
  implementation: string;
  timeline: string;
  cost: number;
  roi: number;
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  resources: ResourcePlan[];
  risks: ImplementationRisk[];
  success: SuccessCriteria[];
}

export interface ImplementationPhase {
  name: string;
  description: string;
  duration: string;
  activities: Activity[];
  deliverables: string[];
  dependencies: string[];
}

export interface Activity {
  name: string;
  description: string;
  responsible: string;
  duration: string;
  resources: string[];
}

export interface ResourcePlan {
  type: 'human' | 'financial' | 'technical' | 'infrastructure';
  description: string;
  quantity: number;
  duration: string;
  cost: number;
}

export interface ImplementationRisk {
  category: 'technical' | 'organizational' | 'financial' | 'timeline';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
  contingency: string;
}

export interface SuccessCriteria {
  name: string;
  description: string;
  metric: string;
  target: string;
  measurement: string;
}
