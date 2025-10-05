/**
 * Internet Research Service - Wyszukiwanie optymalnych rozwiązań i integracji
 * Używa Apify do przeszukiwania internetu w poszukiwaniu najlepszych praktyk i rozwiązań
 */

import { z } from 'zod';

// Types for research queries and results
const ResearchQuerySchema = z.object({
  query: z.string(),
  type: z.enum([
    'solution',
    'integration',
    'best-practice',
    'tutorial',
    'comparison',
    'technology',
  ]),
  context: z.string().optional(),
  filters: z
    .object({
      timeframe: z
        .enum(['week', 'month', 'quarter', 'year', 'all'])
        .default('year'),
      sources: z.array(z.string()).default([]),
      minQuality: z.number().min(1).max(10).default(7),
      includeCode: z.boolean().default(true),
      includeDocumentation: z.boolean().default(true),
    })
    .optional(),
});

const ResearchResultSchema = z.object({
  title: z.string(),
  url: z.string(),
  content: z.string(),
  summary: z.string(),
  relevanceScore: z.number().min(0).max(1),
  source: z.string(),
  publishedDate: z.string().optional(),
  tags: z.array(z.string()),
  codeExamples: z
    .array(
      z.object({
        language: z.string(),
        code: z.string(),
        description: z.string(),
      })
    )
    .optional(),
  integrationInfo: z
    .object({
      complexity: z.enum(['low', 'medium', 'high']),
      requirements: z.array(z.string()),
      benefits: z.array(z.string()),
      drawbacks: z.array(z.string()),
    })
    .optional(),
});

type ResearchQuery = z.infer<typeof ResearchQuerySchema>;
type ResearchResult = z.infer<typeof ResearchResultSchema>;

interface ResearchResponse {
  success: boolean;
  data?: ResearchResult[];
  total?: number;
  processingTime?: number;
  recommendations?: {
    bestSolution: ResearchResult;
    alternatives: ResearchResult[];
    quickStart: string;
    implementation: string;
  };
  error?: string;
}

class InternetResearchService {
  private readonly APIFY_API_URL = 'https://api.apify.com/v2';
  private readonly SEARCH_ENGINES = {
    google: 'apify/google-search-scraper',
    bing: 'apify/bing-scraper',
    github: 'apify/github-search',
    stackoverflow: 'apify/stackoverflow-scraper',
    medium: 'apify/medium-scraper',
  };

  private readonly QUALITY_SOURCES = [
    'github.com',
    'stackoverflow.com',
    'medium.com',
    'dev.to',
    'hashnode.com',
    'docs.microsoft.com',
    'developer.mozilla.org',
    'nodejs.org',
    'reactjs.org',
    'vuejs.org',
    'angular.io',
    'nextjs.org',
  ];

  constructor(private apifyToken?: string) {}

  /**
   * Główna metoda wyszukiwania optymalnych rozwiązań
   */
  async searchOptimalSolutions(
    query: ResearchQuery
  ): Promise<ResearchResponse> {
    try {
      console.log(`🔍 Rozpoczynam wyszukiwanie: ${query.query}`);
      const startTime = Date.now();

      // Validate input
      const validatedQuery = ResearchQuerySchema.parse(query);

      // Build search queries for different sources
      const searchQueries = this.buildSearchQueries(validatedQuery);

      // Execute parallel searches across multiple sources
      const searchPromises = searchQueries.map(sq =>
        this.executeSearch(sq.source, sq.query, sq.parameters)
      );

      const searchResults = await Promise.allSettled(searchPromises);

      // Process and consolidate results
      const consolidatedResults = this.consolidateResults(searchResults);

      // Score and filter results
      const scoredResults = await this.scoreResults(
        consolidatedResults,
        validatedQuery
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        scoredResults,
        validatedQuery
      );

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: scoredResults,
        total: scoredResults.length,
        processingTime,
        recommendations,
      };
    } catch (error) {
      console.error('❌ Error in searchOptimalSolutions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Wyszukiwanie konkretnych integracji
   */
  async searchIntegrations(
    technology: string,
    context?: string
  ): Promise<ResearchResponse> {
    const query: ResearchQuery = {
      query: `${technology} integration ${context || ''}`,
      type: 'integration',
      context: `Looking for integration solutions for ${technology}${context ? ` in ${context}` : ''}`,
      filters: {
        timeframe: 'year',
        sources: ['github.com', 'docs.microsoft.com', 'developer.mozilla.org'],
        minQuality: 8,
        includeCode: true,
        includeDocumentation: true,
      },
    };

    return this.searchOptimalSolutions(query);
  }

  /**
   * Wyszukiwanie najlepszych praktyk
   */
  async searchBestPractices(
    domain: string,
    technology?: string
  ): Promise<ResearchResponse> {
    const query: ResearchQuery = {
      query: `${domain} best practices ${technology || ''}`,
      type: 'best-practice',
      context: `Searching for best practices in ${domain}${technology ? ` using ${technology}` : ''}`,
      filters: {
        timeframe: 'year',
        sources: this.QUALITY_SOURCES,
        minQuality: 9,
        includeCode: true,
        includeDocumentation: true,
      },
    };

    return this.searchOptimalSolutions(query);
  }

  /**
   * Porównanie rozwiązań
   */
  async compareSolutions(
    solutions: string[],
    context?: string
  ): Promise<ResearchResponse> {
    const query: ResearchQuery = {
      query: `${solutions.join(' vs ')} comparison ${context || ''}`,
      type: 'comparison',
      context: `Comparing solutions: ${solutions.join(', ')}${context ? ` for ${context}` : ''}`,
      filters: {
        timeframe: 'year',
        sources: this.QUALITY_SOURCES,
        minQuality: 8,
        includeCode: false,
        includeDocumentation: true,
      },
    };

    return this.searchOptimalSolutions(query);
  }

  private buildSearchQueries(query: ResearchQuery) {
    const baseQuery = query.query;
    const type = query.type;
    const filters = query.filters || {};

    const searchQueries = [];

    // GitHub search for code examples and repositories
    if (filters.includeCode) {
      searchQueries.push({
        source: 'github',
        query: `${baseQuery} ${type} example`,
        parameters: {
          sort: 'updated',
          order: 'desc',
          type: 'repositories',
        },
      });
    }

    // Stack Overflow for solutions and discussions
    searchQueries.push({
      source: 'stackoverflow',
      query: `${baseQuery} ${type}`,
      parameters: {
        sort: 'votes',
        tagged: this.extractTags(baseQuery),
      },
    });

    // Google search for comprehensive results
    searchQueries.push({
      source: 'google',
      query: `${baseQuery} ${type} ${new Date().getFullYear()}`,
      parameters: {
        num: 20,
        site: filters.sources?.join(' OR site:') || '',
      },
    });

    // Documentation sites
    if (filters.includeDocumentation) {
      searchQueries.push({
        source: 'google',
        query: `site:docs.microsoft.com OR site:developer.mozilla.org ${baseQuery}`,
        parameters: {
          num: 10,
        },
      });
    }

    return searchQueries;
  }

  private async executeSearch(
    source: string,
    query: string,
    parameters: any
  ): Promise<any[]> {
    try {
      // If no Apify token, return mock data for development
      if (!this.apifyToken) {
        return this.getMockSearchResults(source, query);
      }

      const actorId =
        this.SEARCH_ENGINES[source as keyof typeof this.SEARCH_ENGINES];
      if (!actorId) {
        throw new Error(`Unknown search source: ${source}`);
      }

      // Use Apify RAG Web Browser for web scraping
      const response = await fetch(
        'https://api.apify.com/v2/acts/apify~rag-web-browser/run-sync',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apifyToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query,
            maxResults: parameters.num || 10,
            outputFormats: ['markdown'],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Apify API error: ${response.statusText}`);
      }

      const result = await response.json();
      return result.items || [];
    } catch (error) {
      console.error(`❌ Error executing search for ${source}:`, error);
      return this.getMockSearchResults(source, query);
    }
  }

  private consolidateResults(
    searchResults: PromiseSettledResult<any[]>[]
  ): any[] {
    const allResults: any[] = [];

    searchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allResults.push(...result.value);
      } else {
        console.warn(`⚠️ Search ${index} failed:`, result.reason);
      }
    });

    // Remove duplicates based on URL
    const seen = new Set();
    return allResults.filter(result => {
      const url = result.url || result.link || '';
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }

  private async scoreResults(
    results: any[],
    query: ResearchQuery
  ): Promise<ResearchResult[]> {
    const scoredResults: ResearchResult[] = [];

    for (const result of results) {
      try {
        const relevanceScore = this.calculateRelevanceScore(result, query);

        if (relevanceScore >= (query.filters?.minQuality || 7) / 10) {
          const processedResult: ResearchResult = {
            title: result.title || result.name || 'Untitled',
            url: result.url || result.link || '',
            content: result.text || result.content || result.description || '',
            summary: this.generateSummary(result.text || result.content || ''),
            relevanceScore,
            source: this.extractDomain(result.url || result.link || ''),
            publishedDate: result.publishedAt || result.createdAt,
            tags: this.extractTags(result.text || result.title || ''),
            codeExamples: this.extractCodeExamples(result.text || ''),
            integrationInfo:
              query.type === 'integration'
                ? this.extractIntegrationInfo(result.text || '')
                : undefined,
          };

          scoredResults.push(processedResult);
        }
      } catch (error) {
        console.warn('⚠️ Error processing result:', error);
      }
    }

    // Sort by relevance score
    return scoredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateRelevanceScore(result: any, query: ResearchQuery): number {
    let score = 0.5; // Base score

    const text = (
      result.text ||
      result.content ||
      result.title ||
      ''
    ).toLowerCase();
    const queryTerms = query.query.toLowerCase().split(' ');

    // Query term matching
    const termMatches = queryTerms.filter(term => text.includes(term)).length;
    score += (termMatches / queryTerms.length) * 0.3;

    // Source quality bonus
    const domain = this.extractDomain(result.url || result.link || '');
    if (this.QUALITY_SOURCES.includes(domain)) {
      score += 0.2;
    }

    // Recency bonus
    const publishedDate = new Date(
      result.publishedAt || result.createdAt || Date.now()
    );
    const daysSincePublished =
      (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished < 365) {
      score += 0.1;
    }

    // Content quality indicators
    if (text.includes('example') || text.includes('tutorial')) score += 0.05;
    if (text.includes('best practice') || text.includes('recommended'))
      score += 0.05;
    if (text.length > 1000) score += 0.05; // Comprehensive content

    return Math.min(score, 1.0);
  }

  private generateRecommendations(
    results: ResearchResult[],
    query: ResearchQuery
  ) {
    if (results.length === 0) return undefined;

    const bestSolution = results[0];
    const alternatives = results.slice(1, 4);

    return {
      bestSolution,
      alternatives,
      quickStart: this.generateQuickStart(bestSolution, query),
      implementation: this.generateImplementationGuide(bestSolution, query),
    };
  }

  private generateQuickStart(
    solution: ResearchResult,
    query: ResearchQuery
  ): string {
    return `
# Quick Start: ${solution.title}

Based on research for "${query.query}", here's the recommended approach:

## Overview
${solution.summary}

## Key Benefits
- High relevance score: ${(solution.relevanceScore * 100).toFixed(1)}%
- Trusted source: ${solution.source}
- ${solution.tags.length} related technologies

## Next Steps
1. Review the full documentation: ${solution.url}
2. Check code examples and implementation details
3. Consider integration requirements and dependencies
4. Test in development environment

${solution.codeExamples?.length ? `## Code Examples Available\n${solution.codeExamples.length} examples found in ${solution.codeExamples.map(ex => ex.language).join(', ')}` : ''}
    `.trim();
  }

  private generateImplementationGuide(
    solution: ResearchResult,
    query: ResearchQuery
  ): string {
    return `
# Implementation Guide: ${solution.title}

## Implementation Strategy
${
  solution.integrationInfo
    ? `
### Complexity Level: ${solution.integrationInfo.complexity.toUpperCase()}

### Requirements
${solution.integrationInfo.requirements.map(req => `- ${req}`).join('\n')}

### Benefits
${solution.integrationInfo.benefits.map(ben => `- ${ben}`).join('\n')}

### Potential Challenges
${solution.integrationInfo.drawbacks.map(draw => `- ${draw}`).join('\n')}
`
    : 'Review the source documentation for detailed implementation steps.'
}

## Related Technologies
${solution.tags.map(tag => `- ${tag}`).join('\n')}

## Source
- URL: ${solution.url}
- Domain: ${solution.source}
- Published: ${solution.publishedDate || 'Unknown date'}
    `.trim();
  }

  // Helper methods
  private generateSummary(content: string): string {
    if (!content) return '';

    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return (
      sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '...' : '')
    );
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private extractTags(text: string): string[] {
    if (!text) return [];

    const commonTech = [
      'react',
      'vue',
      'angular',
      'nodejs',
      'typescript',
      'javascript',
      'python',
      'java',
      'php',
      'css',
      'html',
      'api',
      'rest',
      'graphql',
      'docker',
      'kubernetes',
      'aws',
      'azure',
      'gcp',
      'mongodb',
      'postgresql',
      'mysql',
      'redis',
      'webpack',
      'vite',
      'nextjs',
      'express',
      'fastify',
    ];

    const lowerText = text.toLowerCase();
    return commonTech.filter(tech => lowerText.includes(tech));
  }

  private extractCodeExamples(content: string): any[] {
    if (!content) return [];

    const codeBlocks = content.match(/```(\w+)?\n([\s\S]*?)```/g) || [];

    return codeBlocks
      .map(block => {
        const match = block.match(/```(\w+)?\n([\s\S]*?)```/);
        if (match) {
          return {
            language: match[1] || 'text',
            code: match[2].trim(),
            description: 'Code example from source',
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  private extractIntegrationInfo(content: string): any {
    const lowerContent = content.toLowerCase();

    // Simple heuristics for integration complexity
    let complexity: 'low' | 'medium' | 'high' = 'medium';

    if (
      lowerContent.includes('simple') ||
      lowerContent.includes('easy') ||
      lowerContent.includes('quick')
    ) {
      complexity = 'low';
    } else if (
      lowerContent.includes('complex') ||
      lowerContent.includes('advanced') ||
      lowerContent.includes('enterprise')
    ) {
      complexity = 'high';
    }

    return {
      complexity,
      requirements: this.extractListItems(content, [
        'require',
        'need',
        'depend',
      ]),
      benefits: this.extractListItems(content, ['benefit', 'advantage', 'pro']),
      drawbacks: this.extractListItems(content, [
        'drawback',
        'disadvantage',
        'con',
        'limitation',
      ]),
    };
  }

  private extractListItems(content: string, keywords: string[]): string[] {
    const items: string[] = [];
    const lines = content.split('\n');

    lines.forEach(line => {
      const trimmed = line.trim();
      if (
        trimmed.startsWith('-') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('•')
      ) {
        const text = trimmed.substring(1).trim();
        if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
          items.push(text);
        }
      }
    });

    return items.slice(0, 5); // Limit to 5 items
  }

  private getMockSearchResults(source: string, query: string): any[] {
    // Mock data for development when Apify token is not available
    return [
      {
        title: `${query} - Best Practices Guide`,
        url: `https://docs.example.com/${query.replace(/\s+/g, '-')}`,
        text: `Comprehensive guide for ${query}. This solution provides optimal performance and follows industry best practices. Example implementation includes TypeScript support, error handling, and testing strategies.`,
        publishedAt: new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days ago
      },
      {
        title: `GitHub - ${query} Implementation`,
        url: `https://github.com/example/${query}`,
        text: `Open source implementation of ${query} with extensive documentation and community support. Includes code examples, integration guides, and performance optimizations.`,
        publishedAt: new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days ago
      },
      {
        title: `Stack Overflow - ${query} Solutions`,
        url: `https://stackoverflow.com/questions/example-${query}`,
        text: `Community-driven solutions for ${query} challenges. Multiple approaches discussed with pros and cons. Includes practical examples and troubleshooting tips.`,
        publishedAt: new Date(
          Date.now() - 60 * 24 * 60 * 60 * 1000
        ).toISOString(), // 60 days ago
      },
    ];
  }
}

export {
  InternetResearchService,
  ResearchQuery,
  ResearchResult,
  ResearchResponse,
  ResearchQuerySchema,
  ResearchResultSchema,
};
