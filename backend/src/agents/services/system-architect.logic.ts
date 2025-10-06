/**
 * System Architecture Logic Service
 * Core business logic for System Architect Agent
 */

import {
  SystemArchitecture,
  ProjectRequirement,
  ArchitectureConstraint,
  LoadProjection,
  Technology,
} from '../types/system-architect.types';

export class SystemArchitectLogicService {
  /**
   * Analyzes project requirements and generates initial architecture recommendations
   */
  static analyzeRequirements(requirements: ProjectRequirement[]): {
    complexity: 'low' | 'medium' | 'high';
    recommendedPattern: string;
    criticalRequirements: ProjectRequirement[];
  } {
    const functionalCount = requirements.filter(
      r => r.type === 'functional'
    ).length;
    const nonFunctionalCount = requirements.filter(
      r => r.type === 'non_functional'
    ).length;
    const highPriorityCount = requirements.filter(
      r => r.priority === 'high' || r.priority === 'critical'
    ).length;

    const complexity = this.determineComplexity(
      functionalCount,
      nonFunctionalCount,
      highPriorityCount
    );
    const recommendedPattern = this.recommendArchitecturePattern(
      requirements,
      complexity
    );
    const criticalRequirements = requirements.filter(
      r => r.priority === 'critical' || r.priority === 'high'
    );

    return {
      complexity,
      recommendedPattern,
      criticalRequirements,
    };
  }

  /**
   * Validates architecture against requirements and constraints
   */
  static validateArchitecture(
    architecture: SystemArchitecture,
    requirements: ProjectRequirement[],
    constraints: ArchitectureConstraint[]
  ): {
    valid: boolean;
    violations: string[];
    recommendations: string[];
    score: number;
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check if all functional requirements are covered
    const functionalReqs = requirements.filter(r => r.type === 'functional');
    const coveredRequirements = this.checkRequirementCoverage(
      architecture,
      functionalReqs
    );

    if (coveredRequirements.uncovered.length > 0) {
      violations.push(
        `Nieuwzględnione wymagania: ${coveredRequirements.uncovered.join(', ')}`
      );
    }

    // Check constraints compliance
    const constraintViolations = this.checkConstraints(
      architecture,
      constraints
    );
    violations.push(...constraintViolations);

    // Generate recommendations
    const architectureRecommendations =
      this.generateOptimizationRecommendations(architecture);
    recommendations.push(...architectureRecommendations);

    const score = this.calculateArchitectureScore(
      architecture,
      requirements,
      violations.length
    );

    return {
      valid: violations.length === 0,
      violations,
      recommendations,
      score,
    };
  }

  /**
   * Generates technology recommendations based on requirements
   */
  static recommendTechnologies(
    requirements: ProjectRequirement[],
    constraints: ArchitectureConstraint[]
  ): {
    frontend: Technology[];
    backend: Technology[];
    database: Technology[];
    infrastructure: Technology[];
  } {
    const performanceReqs = requirements.filter(
      r =>
        r.description.includes('wydajność') ||
        r.description.includes('performance')
    );
    const scalabilityReqs = requirements.filter(
      r =>
        r.description.includes('skalowalność') ||
        r.description.includes('scalability')
    );
    const securityReqs = requirements.filter(
      r =>
        r.description.includes('bezpieczeństwo') ||
        r.description.includes('security')
    );

    return {
      frontend: this.recommendFrontendTech(requirements),
      backend: this.recommendBackendTech(
        requirements,
        constraints,
        performanceReqs.length > 0
      ),
      database: this.recommendDatabaseTech(
        requirements,
        constraints,
        scalabilityReqs.length > 0
      ),
      infrastructure: this.recommendInfrastructureTech(
        requirements,
        constraints,
        securityReqs.length > 0
      ),
    };
  }

  /**
   * Analyzes bottlenecks in the architecture
   */
  static analyzeBottlenecks(
    architecture: SystemArchitecture,
    loadProjections: LoadProjection[]
  ): {
    bottlenecks: Array<{
      component: string;
      type: 'performance' | 'capacity' | 'throughput';
      severity: 'low' | 'medium' | 'high';
      description: string;
      impact: string;
    }>;
    recommendations: Array<{
      priority: 'low' | 'medium' | 'high';
      action: string;
      effort: string;
      expectedImpact: string;
    }>;
  } {
    const bottlenecks = this.identifyArchitectureBottlenecks(
      architecture,
      loadProjections
    );
    const recommendations = this.generateBottleneckRecommendations(bottlenecks);

    return { bottlenecks, recommendations };
  }

  // Private helper methods

  private static determineComplexity(
    functionalCount: number,
    nonFunctionalCount: number,
    highPriorityCount: number
  ): 'low' | 'medium' | 'high' {
    const totalScore =
      functionalCount + nonFunctionalCount * 1.5 + highPriorityCount * 2;

    if (totalScore < 10) return 'low';
    if (totalScore < 25) return 'medium';
    return 'high';
  }

  private static recommendArchitecturePattern(
    requirements: ProjectRequirement[],
    complexity: 'low' | 'medium' | 'high'
  ): string {
    const hasScalabilityReqs = requirements.some(
      r =>
        r.description.includes('skalowalność') ||
        r.description.includes('scalability')
    );
    const hasPerformanceReqs = requirements.some(
      r =>
        r.description.includes('wydajność') ||
        r.description.includes('performance')
    );

    if (complexity === 'low') return 'monolith';
    if (complexity === 'medium' && hasScalabilityReqs)
      return 'modular-monolith';
    if (complexity === 'high' && (hasScalabilityReqs || hasPerformanceReqs))
      return 'microservices';

    return 'layered-architecture';
  }

  private static checkRequirementCoverage(
    architecture: SystemArchitecture,
    requirements: ProjectRequirement[]
  ): { covered: string[]; uncovered: string[] } {
    const covered: string[] = [];
    const uncovered: string[] = [];

    requirements.forEach(req => {
      const isCovered = architecture.components?.some(comp =>
        comp.responsibilities?.some(resp =>
          resp
            .toLowerCase()
            .includes(req.description.toLowerCase().split(' ')[0])
        )
      );

      if (isCovered) {
        covered.push(req.description);
      } else {
        uncovered.push(req.description);
      }
    });

    return { covered, uncovered };
  }

  private static checkConstraints(
    architecture: SystemArchitecture,
    constraints: ArchitectureConstraint[]
  ): string[] {
    const violations: string[] = [];

    constraints.forEach(constraint => {
      switch (constraint.type) {
        case 'technology':
          // Check technology constraints
          break;
        case 'budget':
          // Check budget constraints
          break;
        case 'regulatory':
          // Check regulatory constraints
          break;
        case 'timeline':
          // Check timeline constraints
          break;
        case 'integration':
          // Check integration constraints
          break;
      }
    });

    return violations;
  }

  private static generateOptimizationRecommendations(
    architecture: SystemArchitecture
  ): string[] {
    const recommendations: string[] = [];

    // Check for missing monitoring
    if (
      !architecture.components?.some(
        c => c.name.includes('Monitor') || c.name.includes('Log')
      )
    ) {
      recommendations.push('Dodaj komponenty monitoringu i logowania');
    }

    // Check for missing caching
    if (!architecture.components?.some(c => c.type === 'cache')) {
      recommendations.push(
        'Rozważ dodanie warstwy cache dla lepszej wydajności'
      );
    }

    // Check for security components
    if (
      !architecture.components?.some(
        c => c.name.includes('Security') || c.name.includes('Auth')
      )
    ) {
      recommendations.push('Dodaj komponenty bezpieczeństwa i autentykacji');
    }

    return recommendations;
  }

  private static calculateArchitectureScore(
    architecture: SystemArchitecture,
    requirements: ProjectRequirement[],
    violationCount: number
  ): number {
    let score = 100;

    // Deduct points for violations
    score -= violationCount * 10;

    // Add points for good practices
    if (architecture.layers && architecture.layers.length >= 3) score += 10;
    if (architecture.components?.length && architecture.components.length > 0)
      score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private static recommendFrontendTech(
    requirements: ProjectRequirement[]
  ): Technology[] {
    const hasComplexUI = requirements.some(
      r =>
        r.description.includes('interfejs') ||
        r.description.includes('UI') ||
        r.description.includes('dashboard')
    );

    const recommendations: Technology[] = [
      {
        name: 'React',
        version: '18.x',
        purpose: 'Frontend Framework',
        justification: 'Najlepsze wsparcie społeczności, bogaty ekosystem',
      },
    ];

    if (hasComplexUI) {
      recommendations.push({
        name: 'TypeScript',
        version: '5.x',
        purpose: 'Type Safety',
        justification: 'Zwiększa jakość kodu w złożonych aplikacjach',
      });
    }

    return recommendations;
  }

  private static recommendBackendTech(
    _requirements: ProjectRequirement[],
    _constraints: ArchitectureConstraint[],
    hasPerformanceReqs: boolean
  ): Technology[] {
    const recommendations: Technology[] = [
      {
        name: 'Node.js',
        version: '20.x',
        purpose: 'Backend Runtime',
        justification: 'Dobra wydajność, bogaty ekosystem NPM',
      },
    ];

    if (hasPerformanceReqs) {
      recommendations.push({
        name: 'Express.js',
        version: '4.x',
        purpose: 'Web Framework',
        justification: 'Lekki i wydajny framework',
      });
    }

    return recommendations;
  }

  private static recommendDatabaseTech(
    _requirements: ProjectRequirement[],
    _constraints: ArchitectureConstraint[],
    hasScalabilityReqs: boolean
  ): Technology[] {
    const recommendations: Technology[] = [];

    if (hasScalabilityReqs) {
      recommendations.push({
        name: 'PostgreSQL',
        version: '16.x',
        purpose: 'Primary Database',
        justification: 'Dobra skalowalność, zaawansowane funkcje',
      });
    } else {
      recommendations.push({
        name: 'SQLite',
        version: '3.x',
        purpose: 'Lightweight Database',
        justification: 'Prosty w użyciu, nie wymaga serwera',
      });
    }

    return recommendations;
  }

  private static recommendInfrastructureTech(
    _requirements: ProjectRequirement[],
    _constraints: ArchitectureConstraint[],
    hasSecurityReqs: boolean
  ): Technology[] {
    const recommendations: Technology[] = [
      {
        name: 'Docker',
        version: 'latest',
        purpose: 'Containerization',
        justification: 'Zapewnia spójność między środowiskami',
      },
    ];

    if (hasSecurityReqs) {
      recommendations.push({
        name: 'NGINX',
        version: 'latest',
        purpose: 'Reverse Proxy & Load Balancer',
        justification: 'Bezpieczeństwo, wydajność, SSL termination',
      });
    }

    return recommendations;
  }

  private static identifyArchitectureBottlenecks(
    architecture: SystemArchitecture,
    loadProjections: LoadProjection[]
  ): Array<{
    component: string;
    type: 'performance' | 'capacity' | 'throughput';
    severity: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
  }> {
    const bottlenecks = [];

    // Analyze database bottlenecks
    const dbComponents =
      architecture.components?.filter(c => c.type === 'database') || [];
    if (dbComponents.length === 1) {
      bottlenecks.push({
        component: dbComponents[0].name,
        type: 'performance' as const,
        severity: 'medium' as const,
        description: 'Pojedyncza baza danych może stać się wąskim gardłem',
        impact: 'Ograniczenie wydajności przy wysokim obciążeniu',
      });
    }

    // Analyze API bottlenecks
    const apiComponents =
      architecture.components?.filter(c => c.type === 'api') || [];
    if (apiComponents.length > 0) {
      const highLoadProjections = loadProjections.filter(
        p => p.metric.includes('requests') && p.projected > p.current * 5
      );

      if (highLoadProjections.length > 0) {
        bottlenecks.push({
          component: apiComponents[0].name,
          type: 'throughput' as const,
          severity: 'high' as const,
          description: 'API może nie obsłużyć prognozowanego wzrostu ruchu',
          impact: 'Degradacja wydajności, potencjalne timeouty',
        });
      }
    }

    return bottlenecks;
  }

  private static generateBottleneckRecommendations(
    bottlenecks: Array<{
      component: string;
      type: 'performance' | 'capacity' | 'throughput';
      severity: 'low' | 'medium' | 'high';
      description: string;
      impact: string;
    }>
  ): Array<{
    priority: 'low' | 'medium' | 'high';
    action: string;
    effort: string;
    expectedImpact: string;
  }> {
    return bottlenecks.map(bottleneck => {
      switch (bottleneck.type) {
        case 'performance':
          return {
            priority: bottleneck.severity,
            action: `Optymalizacja wydajności komponentu ${bottleneck.component}`,
            effort: '2-4 tygodnie',
            expectedImpact: '30-50% poprawa wydajności',
          };
        case 'throughput':
          return {
            priority: bottleneck.severity,
            action: `Implementacja load balancingu dla ${bottleneck.component}`,
            effort: '1-2 tygodnie',
            expectedImpact: '2-5x wzrost przepustowości',
          };
        case 'capacity':
          return {
            priority: bottleneck.severity,
            action: `Skalowanie poziome komponentu ${bottleneck.component}`,
            effort: '3-6 tygodni',
            expectedImpact: 'Elastyczne skalowanie według potrzeb',
          };
        default:
          return {
            priority: 'medium' as const,
            action: 'Analiza i optymalizacja',
            effort: '1-2 tygodnie',
            expectedImpact: 'Poprawa ogólnej wydajności',
          };
      }
    });
  }
}
