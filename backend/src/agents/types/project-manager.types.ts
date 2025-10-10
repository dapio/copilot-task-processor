/**
 * Project Manager Agent Types
 * @description Type definitions for Project Manager Agent that coordinates the entire IT team
 */

export interface ProjectManagerCapabilities {
  teamCoordination: TeamCoordinationCapabilities;
  strategicPlanning: StrategicPlanningCapabilities;
  conflictResolution: ConflictResolutionCapabilities;
  qualityAssurance: QualityAssuranceCapabilities;
  stakeholderManagement: StakeholderManagementCapabilities;
  riskManagement: RiskManagementCapabilities;
}

export interface TeamCoordinationCapabilities {
  agentAssignment: boolean;
  workloadBalancing: boolean;
  performanceMonitoring: boolean;
  teamCommunication: boolean;
  skillMatching: boolean;
}

export interface StrategicPlanningCapabilities {
  projectPlanning: boolean;
  milestoneDefinition: boolean;
  resourceAllocation: boolean;
  timelineManagement: boolean;
  scopeManagement: boolean;
}

export interface ConflictResolutionCapabilities {
  agentConflicts: boolean;
  requirementConflicts: boolean;
  technicalDisputes: boolean;
  priorityConflicts: boolean;
  escalationManagement: boolean;
}

export interface QualityAssuranceCapabilities {
  codeReview: boolean;
  processCompliance: boolean;
  standardsEnforcement: boolean;
  qualityMetrics: boolean;
  continuousImprovement: boolean;
}

export interface StakeholderManagementCapabilities {
  clientCommunication: boolean;
  requirementsGathering: boolean;
  progressReporting: boolean;
  expectationManagement: boolean;
  feedbackIntegration: boolean;
}

export interface RiskManagementCapabilities {
  riskIdentification: boolean;
  mitigation: boolean;
  contingencyPlanning: boolean;
  issueTracking: boolean;
  preventiveMeasures: boolean;
}

export interface ProjectDecision {
  id: string;
  projectId: string;
  type: DecisionType;
  description: string;
  rationale: string;
  impact: DecisionImpact;
  stakeholders: string[];
  deadline?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  createdAt: Date;
  createdBy: string;
  approvedBy?: string;
  implementedAt?: Date;
}

export type DecisionType =
  | 'technical_architecture'
  | 'team_assignment'
  | 'priority_change'
  | 'scope_change'
  | 'timeline_adjustment'
  | 'resource_allocation'
  | 'quality_standard'
  | 'risk_mitigation'
  | 'process_change'
  | 'tool_selection';

export interface DecisionImpact {
  scope: 'low' | 'medium' | 'high' | 'critical';
  timeline: number; // days
  budget?: number;
  quality: 'positive' | 'neutral' | 'negative';
  team: string[]; // affected agents
}

export interface TeamConflict {
  id: string;
  projectId: string;
  type: ConflictType;
  description: string;
  involvedAgents: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'escalated';
  resolutionStrategy?: string;
  resolution?: string;
  createdAt: Date;
  resolvedAt?: Date;
  escalatedTo?: string;
}

export type ConflictType =
  | 'resource_conflict'
  | 'technical_disagreement'
  | 'priority_dispute'
  | 'communication_breakdown'
  | 'performance_issue'
  | 'requirement_ambiguity'
  | 'timeline_pressure'
  | 'quality_standard_dispute';

export interface ProjectMilestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetDate: Date;
  actualDate?: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  dependencies: string[];
  deliverables: string[];
  successCriteria: string[];
  assignedAgents: string[];
  progress: number;
  risks: ProjectRisk[];
}

export interface ProjectRisk {
  id: string;
  projectId: string;
  type: RiskType;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: RiskCategory;
  mitigation: string;
  contingency: string;
  owner: string;
  status: 'identified' | 'analyzing' | 'mitigating' | 'monitoring' | 'closed';
  identifiedAt: Date;
  lastReviewed: Date;
}

export type RiskType =
  | 'technical_risk'
  | 'resource_risk'
  | 'timeline_risk'
  | 'quality_risk'
  | 'external_dependency'
  | 'regulatory_risk'
  | 'security_risk'
  | 'performance_risk';

export type RiskCategory =
  | 'project_management'
  | 'technical'
  | 'organizational'
  | 'external'
  | 'regulatory';

export interface TeamPerformanceMetrics {
  projectId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  overallMetrics: {
    productivity: number;
    quality: number;
    efficiency: number;
    collaboration: number;
  };
  agentMetrics: AgentPerformanceMetrics[];
  trends: PerformanceTrend[];
  recommendations: string[];
}

export interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  agentType: string;
  metrics: {
    tasksCompleted: number;
    averageTaskTime: number;
    qualityScore: number;
    collaborationScore: number;
    innovationScore: number;
    reliability: number;
  };
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'stable' | 'declining';
  change: number;
  period: string;
  significance: 'minor' | 'moderate' | 'major';
}

export interface ProjectPlan {
  id: string;
  projectId: string;
  version: string;
  status: 'draft' | 'approved' | 'active' | 'completed' | 'archived';
  overview: ProjectOverview;
  phases: ProjectPhase[];
  resources: ResourcePlan;
  timeline: ProjectTimeline;
  qualityPlan: QualityPlan;
  riskPlan: RiskPlan;
  communicationPlan: CommunicationPlan;
  createdAt: Date;
  approvedAt?: Date;
  lastUpdated: Date;
}

export interface ProjectOverview {
  objectives: string[];
  scope: {
    inclusions: string[];
    exclusions: string[];
  };
  stakeholders: Stakeholder[];
  successCriteria: string[];
  constraints: string[];
  assumptions: string[];
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  influence: 'low' | 'medium' | 'high';
  interest: 'low' | 'medium' | 'high';
  communicationPreference: string;
  expectations: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  deliverables: string[];
  milestones: string[];
  dependencies: string[];
  assignedAgents: string[];
  gates: QualityGate[];
}

export interface QualityGate {
  id: string;
  name: string;
  criteria: QualityCriteria[];
  status: 'pending' | 'passed' | 'failed';
  reviewedBy?: string;
  reviewedAt?: Date;
  comments?: string;
}

export interface QualityCriteria {
  criterion: string;
  requirement: string;
  measurement: string;
  threshold: string;
  status: 'not_evaluated' | 'met' | 'not_met';
}

export interface ResourcePlan {
  humanResources: HumanResource[];
  technicalResources: TechnicalResource[];
  budget: BudgetAllocation;
}

export interface HumanResource {
  agentId: string;
  agentName: string;
  role: string;
  allocation: number; // percentage
  startDate: Date;
  endDate?: Date;
  skills: string[];
  responsibilities: string[];
}

export interface TechnicalResource {
  type: 'infrastructure' | 'software' | 'tools' | 'services';
  name: string;
  description: string;
  cost: number;
  allocation: string;
  availability: Date;
}

export interface BudgetAllocation {
  total: number;
  breakdown: {
    development: number;
    testing: number;
    infrastructure: number;
    tools: number;
    contingency: number;
  };
  currency: string;
}

export interface ProjectTimeline {
  startDate: Date;
  endDate: Date;
  milestones: TimelineMilestone[];
  criticalPath: string[];
  buffer: number; // days
}

export interface TimelineMilestone {
  id: string;
  name: string;
  date: Date;
  type: 'project' | 'phase' | 'delivery' | 'review';
  dependencies: string[];
}

export interface QualityPlan {
  standards: QualityStandard[];
  processes: QualityProcess[];
  metrics: QualityMetric[];
  reviews: ReviewProcess[];
}

export interface QualityStandard {
  name: string;
  description: string;
  applicability: string[];
  requirements: string[];
  measurements: string[];
}

export interface QualityProcess {
  name: string;
  description: string;
  steps: string[];
  roles: string[];
  deliverables: string[];
  frequency: string;
}

export interface QualityMetric {
  name: string;
  description: string;
  formula: string;
  target: number;
  threshold: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'milestone';
}

export interface ReviewProcess {
  type:
    | 'code_review'
    | 'design_review'
    | 'architecture_review'
    | 'quality_review';
  frequency: string;
  participants: string[];
  criteria: string[];
  deliverables: string[];
}

export interface RiskPlan {
  methodology: string;
  riskCategories: string[];
  assessmentFrequency: string;
  escalationCriteria: string[];
  mitigation: RiskMitigation[];
}

export interface RiskMitigation {
  riskType: string;
  strategy: string;
  actions: string[];
  owner: string;
  timeline: string;
  cost: number;
}

export interface CommunicationPlan {
  stakeholderMatrix: StakeholderCommunication[];
  meetings: MeetingPlan[];
  reports: ReportPlan[];
  escalationPaths: EscalationPath[];
}

export interface StakeholderCommunication {
  stakeholder: string;
  frequency: string;
  method: string;
  content: string[];
  responsible: string;
}

export interface MeetingPlan {
  type: string;
  purpose: string;
  frequency: string;
  duration: number;
  participants: string[];
  agenda: string[];
}

export interface ReportPlan {
  type: string;
  purpose: string;
  frequency: string;
  recipients: string[];
  content: string[];
  format: string;
}

export interface EscalationPath {
  level: number;
  trigger: string;
  recipient: string;
  timeframe: string;
  actions: string[];
}

export interface ProjectManagerAnalysisResult {
  overview: {
    projectHealth: 'excellent' | 'good' | 'concerning' | 'critical';
    overallProgress: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    teamMorale: 'high' | 'medium' | 'low';
    qualityIndex: number;
  };
  teamAnalysis: TeamAnalysis;
  projectAnalysis: ProjectAnalysisDetails;
  recommendations: ManagerRecommendation[];
  actionItems: ActionItem[];
  decisions: DecisionItem[];
}

export interface TeamAnalysis {
  composition: {
    totalAgents: number;
    byType: { [key: string]: number };
    utilization: { [key: string]: number };
  };
  performance: {
    productivity: number;
    quality: number;
    collaboration: number;
    bottlenecks: string[];
  };
  skills: {
    coverage: { [key: string]: number };
    gaps: string[];
    strengths: string[];
  };
  communication: {
    effectiveness: number;
    frequency: number;
    issues: string[];
  };
}

export interface ProjectAnalysisDetails {
  scope: {
    clarity: number;
    stability: number;
    creep: number;
  };
  timeline: {
    adherence: number;
    bufferUtilization: number;
    criticalPathRisk: number;
  };
  quality: {
    standards: number;
    metrics: { [key: string]: number };
    issues: string[];
  };
  risks: {
    identified: number;
    mitigated: number;
    open: number;
    emergent: string[];
  };
}

export interface ManagerRecommendation {
  id: string;
  category: 'team' | 'process' | 'technology' | 'quality' | 'risk';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  dependencies: string[];
  assignedTo?: string;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected';
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'blocked';
  dependencies: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DecisionItem {
  id: string;
  title: string;
  description: string;
  options: DecisionOption[];
  criteria: DecisionCriteria[];
  recommendation: string;
  rationale: string;
  deadline: Date;
  status: 'pending' | 'decided' | 'implemented';
  stakeholders: string[];
  impact: DecisionImpact;
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  cost: number;
  timeline: string;
  risk: 'low' | 'medium' | 'high';
  score?: number;
}

export interface DecisionCriteria {
  name: string;
  weight: number;
  description: string;
}

// Input/Output interfaces for Project Manager operations
export interface ProjectManagerInput {
  projectId: string;
  context?: any;
  analysisType?: 'full' | 'team' | 'project' | 'risk' | 'quality';
  timeframe?: {
    startDate: Date;
    endDate: Date;
  };
  focusAreas?: string[];
  stakeholders?: string[];
}

export interface ProjectManagerOutput {
  analysis: ProjectManagerAnalysisResult;
  plan?: ProjectPlan;
  decisions?: ProjectDecision[];
  conflicts?: TeamConflict[];
  metrics?: TeamPerformanceMetrics;
  timestamp: Date;
  version: string;
  confidence: number;
}

// Error types specific to Project Manager
export interface ProjectManagerError {
  code:
    | 'INSUFFICIENT_DATA'
    | 'ANALYSIS_FAILED'
    | 'DECISION_CONFLICT'
    | 'TEAM_UNAVAILABLE'
    | 'PLANNING_ERROR';
  message: string;
  details?: any;
  suggestions?: string[];
}
