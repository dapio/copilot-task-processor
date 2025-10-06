/**
 * Microsoft Reviewer Agent - James Wilson
 * Specialized in Microsoft code reviews, best practices, Azure solutions, and .NET standards
 */

import { PrismaClient } from '@prisma/client';
import {
  IMLProvider,
  Result,
  MLError,
} from '../providers/ml-provider.interface';

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
  securityAnalysis: SecurityAnalysis;
  performanceAnalysis: PerformanceAnalysis;
  architectureAnalysis: ArchitectureAnalysis;

  // Microsoft-specific analysis
  microsoftStandards: StandardsCompliance;
  azureRecommendations: AzureRecommendation[];
  dotnetBestPractices: DotNetBestPractice[];

  // Review feedback
  comments: ReviewComment[];
  overallScore: number;
  recommendations: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface CodeChange {
  file: string;
  type: 'added' | 'modified' | 'deleted';
  linesChanged: number;

  // Change analysis
  complexity: ComplexityMetrics;
  quality: QualityMetrics;
  testCoverage: CoverageMetrics;

  // Microsoft standards
  codingStandards: StandardsCheck[];
  securityChecks: SecurityCheck[];
  performanceChecks: PerformanceCheck[];
}

export interface ComplexityMetrics {
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maintainabilityIndex: number;
  linesOfCode: number;
}

export interface QualityMetrics {
  codeSmells: CodeSmell[];
  duplications: CodeDuplication[];
  bugs: PotentialBug[];
  vulnerabilities: SecurityVulnerability[];
}

export interface CoverageMetrics {
  statementCoverage: number;
  branchCoverage: number;
  functionCoverage: number;
  newCodeCoverage: number;
}

export interface StandardsCheck {
  rule: string;
  category: 'naming' | 'formatting' | 'structure' | 'documentation';
  severity: 'info' | 'warning' | 'error';
  message: string;
  file: string;
  line: number;
}

export interface SecurityCheck {
  type: 'vulnerability' | 'best_practice' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  cwe?: string;
}

export interface PerformanceCheck {
  type: 'memory' | 'cpu' | 'io' | 'network' | 'database';
  impact: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface CodeSmell {
  type: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  file: string;
  line: number;
  effort: string;
}

export interface CodeDuplication {
  lines: number;
  files: string[];
  duplicatedBlocks: number;
  percentage: number;
}

export interface PotentialBug {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  file: string;
  line: number;
  likelihood: number;
}

export interface SecurityVulnerability {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  file: string;
  line: number;
  cwe: string;
}

export interface SecurityAnalysis {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: SecurityVulnerability[];
  dataProtection: DataProtectionCheck[];
  authentication: AuthenticationCheck[];
  authorization: AuthorizationCheck[];
  inputValidation: InputValidationCheck[];
}

export interface DataProtectionCheck {
  category: 'encryption' | 'pii' | 'gdpr' | 'storage';
  compliant: boolean;
  findings: string[];
  recommendations: string[];
}

export interface AuthenticationCheck {
  method: string;
  secure: boolean;
  findings: string[];
  recommendations: string[];
}

export interface AuthorizationCheck {
  type: string;
  adequate: boolean;
  findings: string[];
  recommendations: string[];
}

export interface InputValidationCheck {
  endpoint: string;
  validated: boolean;
  findings: string[];
  recommendations: string[];
}

export interface PerformanceAnalysis {
  overallScore: number;
  bottlenecks: PerformanceBottleneck[];
  optimizations: OptimizationSuggestion[];
  resourceUsage: ResourceUsageAnalysis;
  scalability: ScalabilityAnalysis;
}

export interface PerformanceBottleneck {
  type: 'cpu' | 'memory' | 'io' | 'network' | 'database';
  location: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
}

export interface OptimizationSuggestion {
  category: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  expectedImprovement: string;
  implementation: string;
}

export interface ResourceUsageAnalysis {
  memory: MemoryUsage;
  cpu: CpuUsage;
  storage: StorageUsage;
  network: NetworkUsage;
}

export interface MemoryUsage {
  allocated: number;
  leaked: number;
  efficiency: number;
  recommendations: string[];
}

export interface CpuUsage {
  utilization: number;
  efficiency: number;
  hotspots: string[];
  recommendations: string[];
}

export interface StorageUsage {
  reads: number;
  writes: number;
  efficiency: number;
  recommendations: string[];
}

export interface NetworkUsage {
  requests: number;
  bandwidth: number;
  efficiency: number;
  recommendations: string[];
}

export interface ScalabilityAnalysis {
  horizontal: ScalabilityAssessment;
  vertical: ScalabilityAssessment;
  recommendations: string[];
}

export interface ScalabilityAssessment {
  feasible: boolean;
  limitations: string[];
  requirements: string[];
}

export interface ArchitectureAnalysis {
  overallScore: number;
  patterns: ArchitecturePattern[];
  violations: ArchitectureViolation[];
  improvements: ArchitectureImprovement[];
  dependencies: DependencyAnalysis;
}

export interface ArchitecturePattern {
  name: string;
  implemented: boolean;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  recommendations: string[];
}

export interface ArchitectureViolation {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: string;
  fix: string;
}

export interface ArchitectureImprovement {
  area: string;
  priority: 'low' | 'medium' | 'high';
  description: string;
  benefits: string[];
  implementation: string;
}

export interface DependencyAnalysis {
  external: ExternalDependency[];
  internal: InternalDependency[];
  vulnerabilities: DependencyVulnerability[];
  updates: DependencyUpdate[];
}

export interface ExternalDependency {
  name: string;
  version: string;
  license: string;
  secure: boolean;
  upToDate: boolean;
}

export interface InternalDependency {
  module: string;
  coupling: 'loose' | 'tight';
  cohesion: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface DependencyVulnerability {
  dependency: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  fix: string;
}

export interface DependencyUpdate {
  dependency: string;
  currentVersion: string;
  latestVersion: string;
  breaking: boolean;
  benefits: string[];
}

export interface StandardsCompliance {
  overallScore: number;
  categories: ComplianceCategory[];
  violations: ComplianceViolation[];
  certifications: CertificationCheck[];
}

export interface ComplianceCategory {
  name: string;
  score: number;
  checks: ComplianceCheck[];
}

export interface ComplianceCheck {
  rule: string;
  passed: boolean;
  description: string;
  importance: 'low' | 'medium' | 'high';
}

export interface ComplianceViolation {
  category: string;
  rule: string;
  severity: 'minor' | 'major' | 'critical';
  description: string;
  file: string;
  line: number;
  fix: string;
}

export interface CertificationCheck {
  standard: string;
  compliant: boolean;
  gaps: string[];
  recommendations: string[];
}

export interface AzureRecommendation {
  service: string;
  category:
    | 'cost'
    | 'performance'
    | 'security'
    | 'reliability'
    | 'architecture';
  priority: 'low' | 'medium' | 'high';
  description: string;
  implementation: string;
  benefits: string[];
}

export interface DotNetBestPractice {
  area: string;
  rule: string;
  compliance: boolean;
  description: string;
  recommendation: string;
  example?: string;
}

export interface ReviewComment {
  id: string;
  type: 'suggestion' | 'issue' | 'question' | 'praise';
  severity: 'info' | 'warning' | 'error';
  file: string;
  line?: number;
  message: string;
  suggestion?: string;
  resolved: boolean;
}

export class MicrosoftReviewerAgent {
  private prisma: PrismaClient;
  private provider: IMLProvider;
  private agentId = 'microsoft-reviewer-james-wilson';

  // Agent personality and expertise
  private agentConfig = {
    name: 'James Wilson',
    role: 'Microsoft Technology Reviewer',
    personality:
      'detail-oriented, standards-focused, solution-oriented, mentoring',
    expertise: [
      'microsoft_ecosystem',
      'azure_architecture',
      'dotnet_development',
      'code_quality_standards',
      'security_best_practices',
      'performance_optimization',
      'enterprise_patterns',
      'cloud_native_design',
      'devops_practices',
      'compliance_standards',
    ],
    workingStyle: 'thorough, constructive, knowledge-sharing',
    communicationStyle: 'professional, educational, solution-focused',
  };

  constructor(prisma: PrismaClient, provider: IMLProvider) {
    this.prisma = prisma;
    this.provider = provider;
  }

  /**
   * Perform comprehensive code review
   */
  async performCodeReview(
    codeChanges: string,
    projectContext: any,
    reviewType: 'standard' | 'security' | 'performance' | 'architecture'
  ): Promise<Result<CodeReview, MLError>> {
    const prompt = this.buildCodeReviewPrompt(
      codeChanges,
      projectContext,
      reviewType
    );

    const response = await this.provider.generateText(prompt, {
      temperature: 0.2,
      maxTokens: 4000,
    });

    if (!response.success) {
      return {
        success: false,
        error: response.error,
      };
    }

    try {
      const reviewResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: reviewResult.codeReview,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CODE_REVIEW_ERROR',
          message: 'Failed to perform code review',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Analyze Azure architecture and provide recommendations
   */
  async analyzeAzureArchitecture(
    architectureDescription: string,
    requirements: any
  ): Promise<
    Result<{ analysis: any; recommendations: AzureRecommendation[] }, MLError>
  > {
    const prompt = this.buildAzureAnalysisPrompt(
      architectureDescription,
      requirements
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
      const analysisResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          analysis: analysisResult.architectureAnalysis,
          recommendations: analysisResult.azureRecommendations,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AZURE_ANALYSIS_ERROR',
          message: 'Failed to analyze Azure architecture',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Review .NET code for best practices
   */
  async reviewDotNetCode(
    codeSnippet: string,
    framework: 'net6' | 'net7' | 'net8' | 'netcore'
  ): Promise<
    Result<{ compliance: any; suggestions: DotNetBestPractice[] }, MLError>
  > {
    const prompt = this.buildDotNetReviewPrompt(codeSnippet, framework);

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
      const reviewResult = JSON.parse(response.data.text);
      return {
        success: true,
        data: {
          compliance: reviewResult.compliance,
          suggestions: reviewResult.bestPractices,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DOTNET_REVIEW_ERROR',
          message: 'Failed to review .NET code',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  // Private methods for prompt building

  private buildCodeReviewPrompt(
    codeChanges: string,
    projectContext: any,
    reviewType: string
  ): string {
    return `Jestem James Wilson, senior Microsoft technology reviewer.

ZADANIE: Przeprowadź ${reviewType} code review zgodnie z Microsoft standards.

KONTEKST PROJEKTU:
${JSON.stringify(projectContext, null, 2)}

ZMIANY W KODZIE:
${codeChanges.substring(0, 2000)}

WYKONAJ REVIEW KONCENTRUJĄC SIĘ NA:

1. MICROSOFT CODING STANDARDS:
   - Naming conventions
   - Code structure
   - Documentation standards
   - Error handling patterns

2. SECURITY ANALYSIS:
   - OWASP compliance
   - Data protection
   - Authentication/Authorization
   - Input validation

3. PERFORMANCE REVIEW:
   - Resource usage
   - Scalability concerns
   - Optimization opportunities
   - Memory management

4. ARCHITECTURE COMPLIANCE:
   - Design patterns
   - SOLID principles
   - Dependency injection
   - Separation of concerns

ODPOWIEDŹ W FORMACIE JSON z krótką analizą.`;
  }

  private buildAzureAnalysisPrompt(
    architectureDescription: string,
    requirements: any
  ): string {
    return `Jestem James Wilson, ekspert Azure architecture.

ZADANIE: Przeanalizuj architekturę Azure i podaj rekomendacje.

OPIS ARCHITEKTURY:
${architectureDescription}

WYMAGANIA:
${JSON.stringify(requirements, null, 2)}

PRZEANALIZUJ ARCHITEKTURĘ POD KĄTEM:

1. AZURE BEST PRACTICES:
   - Well-Architected Framework
   - Service selection
   - Cost optimization
   - Security posture

2. SCALABILITY & RELIABILITY:
   - Auto-scaling configuration
   - Availability zones
   - Disaster recovery
   - Performance monitoring

3. SECURITY & COMPLIANCE:
   - Identity management
   - Network security
   - Data protection
   - Compliance standards

PODAJ KONKRETNE REKOMENDACJE z uzasadnieniem.`;
  }

  private buildDotNetReviewPrompt(
    codeSnippet: string,
    framework: string
  ): string {
    return `Jestem James Wilson, .NET expert reviewer.

ZADANIE: Przejrzyj kod .NET pod kątem best practices.

FRAMEWORK: ${framework}

KOD DO REVIEW:
${codeSnippet}

SPRAWDŹ ZGODNOŚĆ Z .NET BEST PRACTICES:

1. CODING STANDARDS:
   - Naming conventions (PascalCase, camelCase)
   - Code organization
   - XML documentation
   - Async/await patterns

2. PERFORMANCE:
   - Memory allocation
   - Collection usage
   - String operations
   - LINQ optimization

3. SECURITY:
   - Input validation
   - SQL injection protection
   - XSS protection
   - Authentication patterns

ODPOWIEDŹ KRÓTKO - tylko najważniejsze uwagi i sugestie.`;
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
        'code_review',
        'azure_architecture_analysis',
        'dotnet_best_practices',
        'security_assessment',
        'performance_analysis',
        'compliance_checking',
        'standards_enforcement',
      ],
    };
  }
}

export default MicrosoftReviewerAgent;
