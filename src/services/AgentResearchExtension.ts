/**
 * Agent Research Extension - Rozszerzenie agentów o możliwości wyszukiwania internetowego
 * Pozwala agentom na autonomiczne poszukiwanie optymalnych rozwiązań i integracji
 */

import {
  InternetResearchService,
  ResearchQuery,
  ResearchResult,
  ResearchResponse,
} from './InternetResearchService';

// Enhanced agent capabilities with research functions
interface AgentResearchCapabilities {
  // Core research functions
  searchOptimalSolutions: (
    query: string,
    context?: string
  ) => Promise<ResearchResponse>;
  findIntegrations: (
    technology: string,
    context?: string
  ) => Promise<ResearchResponse>;
  discoverBestPractices: (
    domain: string,
    technology?: string
  ) => Promise<ResearchResponse>;
  compareTechnologies: (
    technologies: string[],
    context?: string
  ) => Promise<ResearchResponse>;

  // Specialized research functions
  findCodeExamples: (
    technology: string,
    useCase: string
  ) => Promise<ResearchResponse>;
  researchSecurityPractices: (technology: string) => Promise<ResearchResponse>;
  findPerformanceOptimizations: (
    technology: string,
    context?: string
  ) => Promise<ResearchResponse>;
  discoverTestingStrategies: (
    technology: string,
    testType?: string
  ) => Promise<ResearchResponse>;

  // Analysis and recommendation functions
  analyzeResearchResults: (results: ResearchResult[]) => ResearchAnalysis;
  generateImplementationPlan: (
    solution: ResearchResult,
    context?: string
  ) => ImplementationPlan;
  assessIntegrationComplexity: (
    integration: ResearchResult
  ) => ComplexityAssessment;
}

interface ResearchAnalysis {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;
}

interface ImplementationPlan {
  overview: string;
  prerequisites: string[];
  steps: Array<{
    phase: string;
    tasks: string[];
    estimatedTime: string;
    dependencies: string[];
  }>;
  testing: string[];
  deployment: string[];
  maintenance: string[];
  alternatives: string[];
}

interface ComplexityAssessment {
  overall: 'low' | 'medium' | 'high';
  technical: number; // 1-10
  operational: number; // 1-10
  maintenance: number; // 1-10
  factors: {
    dependencies: string[];
    infrastructure: string[];
    skills: string[];
    timeline: string;
  };
  mitigation: string[];
}

class AgentResearchExtension implements AgentResearchCapabilities {
  private researchService: InternetResearchService;

  constructor(apifyToken?: string) {
    this.researchService = new InternetResearchService(apifyToken);
  }

  /**
   * 🔍 Wyszukiwanie optymalnych rozwiązań dla konkretnego problemu
   */
  async searchOptimalSolutions(
    query: string,
    context?: string
  ): Promise<ResearchResponse> {
    console.log(
      `🤖 Agent recherche: Wyszukuję optymalne rozwiązania dla: ${query}`
    );

    const researchQuery: ResearchQuery = {
      query,
      type: 'solution',
      context: context || `Agent searching for optimal solution to: ${query}`,
      filters: {
        timeframe: 'year',
        sources: [],
        minQuality: 8,
        includeCode: true,
        includeDocumentation: true,
      },
    };

    const results =
      await this.researchService.searchOptimalSolutions(researchQuery);

    if (results.success && results.data) {
      console.log(
        `✅ Znaleziono ${results.data.length} rozwiązań dla: ${query}`
      );

      // Enhanced analysis for agents
      const analysis = this.analyzeResearchResults(results.data);
      (results as any).analysis = analysis;
    }

    return results;
  }

  /**
   * 🔌 Wyszukiwanie integracji dla konkretnej technologii
   */
  async findIntegrations(
    technology: string,
    context?: string
  ): Promise<ResearchResponse> {
    console.log(`🤖 Agent recherche: Szukam integracji dla: ${technology}`);

    const results = await this.researchService.searchIntegrations(
      technology,
      context
    );

    if (results.success && results.data) {
      // Add integration-specific analysis
      for (const result of results.data) {
        if (result.integrationInfo) {
          (result as any).complexityAssessment =
            this.assessIntegrationComplexity(result);
        }
      }
      console.log(
        `✅ Znaleziono ${results.data.length} integracji dla: ${technology}`
      );
    }

    return results;
  }

  /**
   * 📚 Wyszukiwanie najlepszych praktyk w danej dziedzinie
   */
  async discoverBestPractices(
    domain: string,
    technology?: string
  ): Promise<ResearchResponse> {
    console.log(
      `🤖 Agent recherche: Odkrywam najlepsze praktyki dla: ${domain}${technology ? ` (${technology})` : ''}`
    );

    const results = await this.researchService.searchBestPractices(
      domain,
      technology
    );

    if (results.success && results.data) {
      console.log(
        `✅ Odkryto ${results.data.length} najlepszych praktyk dla: ${domain}`
      );
    }

    return results;
  }

  /**
   * ⚖️ Porównanie różnych technologii/rozwiązań
   */
  async compareTechnologies(
    technologies: string[],
    context?: string
  ): Promise<ResearchResponse> {
    console.log(
      `🤖 Agent recherche: Porównuję technologie: ${technologies.join(', ')}`
    );

    const results = await this.researchService.compareSolutions(
      technologies,
      context
    );

    if (results.success && results.data) {
      // Add comparative analysis
      const comparison = this.generateTechnologyComparison(
        results.data,
        technologies
      );
      (results as any).comparison = comparison;
      console.log(`✅ Wykonano porównanie ${technologies.length} technologii`);
    }

    return results;
  }

  /**
   * 💻 Wyszukiwanie przykładów kodu dla konkretnego przypadku użycia
   */
  async findCodeExamples(
    technology: string,
    useCase: string
  ): Promise<ResearchResponse> {
    console.log(
      `🤖 Agent recherche: Szukam przykładów kodu: ${technology} dla ${useCase}`
    );

    const query = `${technology} ${useCase} example code tutorial`;
    const researchQuery: ResearchQuery = {
      query,
      type: 'tutorial',
      context: `Finding code examples for ${technology} in ${useCase}`,
      filters: {
        timeframe: 'year',
        sources: ['github.com', 'stackoverflow.com', 'dev.to'],
        minQuality: 7,
        includeCode: true,
        includeDocumentation: false,
      },
    };

    const results =
      await this.researchService.searchOptimalSolutions(researchQuery);

    if (results.success && results.data) {
      // Filter results to prioritize those with code examples
      results.data = results.data.filter(
        r => r.codeExamples && r.codeExamples.length > 0
      );
      console.log(
        `✅ Znaleziono ${results.data.length} przykładów kodu dla: ${technology} ${useCase}`
      );
    }

    return results;
  }

  /**
   * 🛡️ Badanie praktyk bezpieczeństwa dla technologii
   */
  async researchSecurityPractices(
    technology: string
  ): Promise<ResearchResponse> {
    console.log(
      `🤖 Agent recherche: Badam praktyki bezpieczeństwa dla: ${technology}`
    );

    const query = `${technology} security best practices vulnerabilities protection`;
    const researchQuery: ResearchQuery = {
      query,
      type: 'best-practice',
      context: `Researching security practices for ${technology}`,
      filters: {
        timeframe: 'year',
        sources: ['docs.microsoft.com', 'owasp.org', 'github.com'],
        minQuality: 9,
        includeCode: true,
        includeDocumentation: true,
      },
    };

    return this.researchService.searchOptimalSolutions(researchQuery);
  }

  /**
   * ⚡ Wyszukiwanie optymalizacji wydajności
   */
  async findPerformanceOptimizations(
    technology: string,
    context?: string
  ): Promise<ResearchResponse> {
    console.log(
      `🤖 Agent recherche: Szukam optymalizacji wydajności dla: ${technology}`
    );

    const query = `${technology} performance optimization ${context || ''} best practices speed`;
    const researchQuery: ResearchQuery = {
      query,
      type: 'best-practice',
      context: `Finding performance optimizations for ${technology}`,
      filters: {
        timeframe: 'year',
        sources: [],
        minQuality: 8,
        includeCode: true,
        includeDocumentation: true,
      },
    };

    return this.researchService.searchOptimalSolutions(researchQuery);
  }

  /**
   * 🧪 Odkrywanie strategii testowania
   */
  async discoverTestingStrategies(
    technology: string,
    testType?: string
  ): Promise<ResearchResponse> {
    console.log(
      `🤖 Agent recherche: Odkrywam strategie testowania dla: ${technology}${testType ? ` (${testType})` : ''}`
    );

    const query = `${technology} testing ${testType || ''} strategies best practices framework`;
    const researchQuery: ResearchQuery = {
      query,
      type: 'best-practice',
      context: `Discovering testing strategies for ${technology}`,
      filters: {
        timeframe: 'year',
        sources: ['docs.microsoft.com', 'testing-library.com', 'jestjs.io'],
        minQuality: 8,
        includeCode: true,
        includeDocumentation: true,
      },
    };

    return this.researchService.searchOptimalSolutions(researchQuery);
  }

  /**
   * 📊 Analiza wyników badań
   */
  analyzeResearchResults(results: ResearchResult[]): ResearchAnalysis {
    if (results.length === 0) {
      return {
        summary: 'No results to analyze',
        strengths: [],
        weaknesses: [],
        recommendations: [],
        riskLevel: 'high',
        confidenceScore: 0,
      };
    }

    const avgScore =
      results.reduce((sum, r) => sum + r.relevanceScore, 0) / results.length;
    const qualitySources = results.filter(r =>
      [
        'github.com',
        'stackoverflow.com',
        'docs.microsoft.com',
        'developer.mozilla.org',
      ].includes(r.source)
    ).length;

    const hasCodeExamples = results.filter(
      r => r.codeExamples && r.codeExamples.length > 0
    ).length;
    const recentResults = results.filter(r => {
      if (!r.publishedDate) return false;
      const published = new Date(r.publishedDate);
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      return published > yearAgo;
    }).length;

    const allTags = results.flatMap(r => r.tags);
    const commonTechnologies = this.getMostCommonTags(allTags);

    return {
      summary: `Analyzed ${results.length} research results with average relevance score of ${(avgScore * 100).toFixed(1)}%. Found ${qualitySources} results from trusted sources and ${hasCodeExamples} results with code examples.`,
      strengths: [
        `${qualitySources} results from trusted sources`,
        `${hasCodeExamples} results include practical code examples`,
        `${recentResults} recent results (within last year)`,
        `Common technologies identified: ${commonTechnologies.slice(0, 3).join(', ')}`,
      ],
      weaknesses: [
        results.length < 5 ? 'Limited number of results' : null,
        avgScore < 0.7 ? 'Lower than ideal average relevance score' : null,
        hasCodeExamples < results.length * 0.5
          ? 'Limited code examples available'
          : null,
        recentResults < results.length * 0.3
          ? 'Many results may be outdated'
          : null,
      ].filter((w): w is string => w !== null),
      recommendations: [
        'Review the top-ranked results first',
        'Focus on results from trusted sources',
        hasCodeExamples > 0
          ? 'Study the provided code examples'
          : 'Search for additional code examples',
        'Consider combining multiple approaches for optimal solution',
        'Validate findings with official documentation',
      ],
      riskLevel: avgScore > 0.8 ? 'low' : avgScore > 0.6 ? 'medium' : 'high',
      confidenceScore: Math.min(
        avgScore + (qualitySources / results.length) * 0.2,
        1.0
      ),
    };
  }

  /**
   * 📋 Generowanie planu implementacji na podstawie wybranego rozwiązania
   */
  generateImplementationPlan(
    solution: ResearchResult,
    context?: string
  ): ImplementationPlan {
    const complexity = solution.integrationInfo?.complexity || 'medium';
    const hasCodeExamples =
      solution.codeExamples && solution.codeExamples.length > 0;

    const baseSteps = {
      low: ['Setup', 'Implementation', 'Testing'],
      medium: [
        'Planning',
        'Environment Setup',
        'Core Implementation',
        'Integration',
        'Testing',
        'Documentation',
      ],
      high: [
        'Analysis',
        'Architecture Design',
        'Environment Setup',
        'Core Development',
        'Integration',
        'Comprehensive Testing',
        'Documentation',
        'Deployment Planning',
      ],
    };

    const steps = baseSteps[complexity].map((phase, index) => ({
      phase,
      tasks: this.generatePhaseTasksDispatchers(
        phase,
        solution,
        hasCodeExamples || false
      ),
      estimatedTime: this.estimatePhaseTime(phase, complexity),
      dependencies: index > 0 ? [baseSteps[complexity][index - 1]] : [],
    }));

    return {
      overview: `Implementation plan for ${solution.title} based on ${solution.source}. ${context ? `Context: ${context}` : ''}`,
      prerequisites: [
        'Review source documentation',
        'Ensure development environment is ready',
        ...(solution.integrationInfo?.requirements || []),
        hasCodeExamples
          ? 'Study provided code examples'
          : 'Research additional implementation examples',
      ],
      steps,
      testing: [
        'Unit tests for core functionality',
        'Integration tests for external dependencies',
        hasCodeExamples
          ? 'Validate against provided examples'
          : 'Create comprehensive test scenarios',
        'Performance testing if applicable',
        'Security testing for sensitive operations',
      ],
      deployment: [
        'Prepare deployment environment',
        'Configure necessary infrastructure',
        'Set up monitoring and logging',
        'Plan rollback strategy',
        'Document deployment process',
      ],
      maintenance: [
        'Monitor performance metrics',
        'Keep dependencies updated',
        'Regular security audits',
        'Documentation maintenance',
        'Community engagement for updates',
      ],
      alternatives: solution.integrationInfo
        ? [
            'Consider simpler alternatives for MVP',
            'Evaluate if existing solutions can be extended',
            'Research emerging alternatives in this space',
          ]
        : [],
    };
  }

  /**
   * 🔍 Ocena złożoności integracji
   */
  assessIntegrationComplexity(
    integration: ResearchResult
  ): ComplexityAssessment {
    const info = integration.integrationInfo;
    if (!info) {
      return {
        overall: 'medium',
        technical: 5,
        operational: 5,
        maintenance: 5,
        factors: {
          dependencies: ['Unknown dependencies'],
          infrastructure: ['Standard infrastructure'],
          skills: ['General development skills'],
          timeline: '2-4 weeks',
        },
        mitigation: ['Conduct thorough analysis before implementation'],
      };
    }

    const complexityScores = {
      low: { technical: 3, operational: 2, maintenance: 3 },
      medium: { technical: 6, operational: 5, maintenance: 6 },
      high: { technical: 9, operational: 8, maintenance: 8 },
    };

    const scores = complexityScores[info.complexity];
    const avgScore =
      (scores.technical + scores.operational + scores.maintenance) / 3;

    return {
      overall: info.complexity,
      technical: scores.technical,
      operational: scores.operational,
      maintenance: scores.maintenance,
      factors: {
        dependencies: info.requirements.filter(
          req => req.includes('require') || req.includes('depend')
        ),
        infrastructure: info.requirements.filter(
          req => req.includes('server') || req.includes('infrastructure')
        ),
        skills: info.requirements.filter(
          req => req.includes('skill') || req.includes('knowledge')
        ),
        timeline: this.estimateImplementationTime(info.complexity, avgScore),
      },
      mitigation: [
        'Start with proof of concept',
        'Implement in phases',
        'Have rollback plan ready',
        'Consider team training needs',
        ...info.drawbacks.map(d => `Mitigate: ${d}`),
      ],
    };
  }

  // Helper methods
  private generateTechnologyComparison(
    results: ResearchResult[],
    technologies: string[]
  ) {
    return {
      summary: `Comparison of ${technologies.join(' vs ')} based on ${results.length} sources`,
      technologies: technologies.map(tech => ({
        name: tech,
        mentions: results.filter(r =>
          r.content.toLowerCase().includes(tech.toLowerCase())
        ).length,
        avgScore: results
          .filter(r => r.content.toLowerCase().includes(tech.toLowerCase()))
          .reduce((sum, r, _, arr) => sum + r.relevanceScore / arr.length, 0),
      })),
      recommendation: results[0]?.title || 'No clear winner found',
    };
  }

  private getMostCommonTags(tags: string[]): string[] {
    const counts = tags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag)
      .slice(0, 10);
  }

  private generatePhaseTasksDispatchers(
    phase: string,
    _solution: ResearchResult,
    hasCodeExamples: boolean
  ): string[] {
    const taskMap: Record<string, string[]> = {
      Analysis: [
        'Review solution requirements',
        'Analyze existing codebase compatibility',
        'Identify potential integration points',
      ],
      Planning: [
        'Define implementation scope',
        'Create detailed timeline',
        'Identify required resources',
      ],
      'Environment Setup': [
        'Install required dependencies',
        'Configure development environment',
        'Set up testing framework',
      ],
      Implementation: [
        hasCodeExamples
          ? 'Adapt provided code examples'
          : 'Implement core functionality',
        'Handle edge cases and errors',
        'Add necessary configuration',
      ],
      Integration: [
        'Connect with existing systems',
        'Test integration points',
        'Handle data flow and transformations',
      ],
      Testing: [
        'Write and run unit tests',
        'Perform integration testing',
        'Validate against requirements',
      ],
    };

    return taskMap[phase] || [`Complete ${phase.toLowerCase()} activities`];
  }

  private estimatePhaseTime(phase: string, complexity: string): string {
    const timeMap: Record<string, Record<string, string>> = {
      Analysis: { low: '1-2 days', medium: '2-3 days', high: '3-5 days' },
      Planning: { low: '1 day', medium: '2-3 days', high: '3-5 days' },
      Setup: { low: '0.5 day', medium: '1-2 days', high: '2-3 days' },
      Implementation: {
        low: '2-3 days',
        medium: '1-2 weeks',
        high: '2-4 weeks',
      },
      Testing: { low: '1-2 days', medium: '3-5 days', high: '1-2 weeks' },
    };

    return timeMap[phase]?.[complexity] || '2-3 days';
  }

  private estimateImplementationTime(
    complexity: string,
    _avgScore: number
  ): string {
    const baseTime = {
      low: '1-2 weeks',
      medium: '2-4 weeks',
      high: '4-8 weeks',
    };

    return baseTime[complexity as keyof typeof baseTime] || '2-4 weeks';
  }
}

export { AgentResearchExtension };

export type {
  AgentResearchCapabilities,
  ResearchAnalysis,
  ImplementationPlan,
  ComplexityAssessment,
};
