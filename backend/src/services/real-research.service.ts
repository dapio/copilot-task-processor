/**
 * 🔍 Real Research Integration Service
 * ThinkCode AI Platform - Prawdziwa integracja z zewnętrznymi źródłami
 */

import { z } from 'zod';

export const ResearchQuerySchema = z.object({
  query: z.string().min(1),
  context: z.string().optional(),
  maxResults: z.number().min(1).max(50).default(10),
  includeCode: z.boolean().default(true),
  includeIntegration: z.boolean().default(true),
});

export type ResearchQuery = z.infer<typeof ResearchQuerySchema>;

export interface ResearchResult {
  title: string;
  url: string;
  content: string;
  summary: string;
  relevanceScore: number;
  source: string;
  tags: string[];
  codeExamples?: Array<{
    language: string;
    code: string;
    description: string;
  }>;
  integrationInfo?: {
    complexity: 'low' | 'medium' | 'high';
    requirements: string[];
    benefits: string[];
    drawbacks: string[];
  };
}

export interface ResearchResponse {
  success: boolean;
  data: ResearchResult[];
  total: number;
  processingTime: number;
  recommendations: {
    bestSolution: {
      title: string;
      quickStart: string;
      implementation: string;
    };
  };
}

export class RealResearchService {
  private githubToken?: string;
  private enableMockFallback: boolean;

  constructor(githubToken?: string, enableMockFallback = true) {
    this.githubToken = githubToken;
    this.enableMockFallback = enableMockFallback;
  }

  /**
   * Przeprowadza prawdziwe wyszukiwanie z integracji GitHub, Stack Overflow, itd.
   */
  async searchSolutions(params: ResearchQuery): Promise<ResearchResponse> {
    const startTime = Date.now();
    
    try {
      const results: ResearchResult[] = [];

      // 1. GitHub Code Search (jeśli mamy token)
      if (this.githubToken && params.includeCode) {
        const githubResults = await this.searchGitHub(params.query);
        results.push(...githubResults);
      }

      // 2. Public Documentation Search
      const docResults = await this.searchDocumentation(params.query);
      results.push(...docResults);

      // 3. Best Practices Knowledge Base
      const bestPracticesResults = await this.searchBestPractices(params.query, params.context);
      results.push(...bestPracticesResults);

      // Sortuj według relevance score
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: results.slice(0, params.maxResults),
        total: results.length,
        processingTime,
        recommendations: {
          bestSolution: results[0] ? {
            title: results[0].title,
            quickStart: `Quick implementation guide for ${params.query}`,
            implementation: `Step-by-step implementation for ${params.query}`,
          } : {
            title: 'No results found',
            quickStart: 'Try refining your search query',
            implementation: 'Consider alternative approaches',
          },
        },
      };

    } catch (error) {
      console.error('Real research failed, falling back to mock:', error);
      
      if (this.enableMockFallback) {
        return this.getMockResults(params);
      }
      
      throw error;
    }
  }

  /**
   * GitHub Code Search - szuka prawdziwych repozytoriów i kodu
   */
  private async searchGitHub(query: string): Promise<ResearchResult[]> {
    try {
      const searchQuery = encodeURIComponent(`${query} language:typescript language:javascript`);
      const response = await fetch(`https://api.github.com/search/repositories?q=${searchQuery}&sort=stars&order=desc&per_page=5`, {
        headers: this.githubToken ? {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        } : {
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.items.map((repo: any) => ({
        title: repo.full_name,
        url: repo.html_url,
        content: repo.description || 'No description available',
        summary: `GitHub repository: ${repo.description || repo.full_name}`,
        relevanceScore: Math.min(0.9, repo.stargazers_count / 10000),
        source: 'github.com',
        tags: [query.toLowerCase(), 'github', 'repository'],
        codeExamples: [{
          language: repo.language?.toLowerCase() || 'text',
          code: `// See repository: ${repo.html_url}\n// Stars: ${repo.stargazers_count}\n// Language: ${repo.language}`,
          description: `Repository example for ${query}`,
        }],
        integrationInfo: {
          complexity: repo.stargazers_count > 1000 ? 'low' : 'medium',
          requirements: ['Git', repo.language || 'Unknown language'],
          benefits: [`${repo.stargazers_count} stars`, 'Community support'],
          drawbacks: ['External dependency'],
        },
      }));

    } catch (error) {
      console.error('GitHub search failed:', error);
      return [];
    }
  }

  /**
   * Wyszukiwanie w publicznie dostępnej dokumentacji
   */
  private async searchDocumentation(query: string): Promise<ResearchResult[]> {
    const docSources = [
      {
        name: 'MDN Web Docs',
        searchUrl: `https://developer.mozilla.org/api/v1/search?q=${encodeURIComponent(query)}`,
        baseUrl: 'https://developer.mozilla.org',
      },
    ];

    const results: ResearchResult[] = [];

    for (const source of docSources) {
      try {
        const response = await fetch(source.searchUrl);
        if (response.ok) {
          const data = await response.json();
          
          if (data.documents) {
            data.documents.slice(0, 2).forEach((doc: any) => {
              results.push({
                title: doc.title,
                url: `${source.baseUrl}${doc.mdn_url}`,
                content: doc.summary || doc.title,
                summary: `Documentation: ${doc.title}`,
                relevanceScore: 0.8,
                source: source.name.toLowerCase().replace(/\s/g, '.'),
                tags: [query.toLowerCase(), 'documentation'],
              });
            });
          }
        }
      } catch (error) {
        console.error(`Failed to search ${source.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Wbudowana baza wiedzy best practices
   */
  private async searchBestPractices(query: string, context?: string): Promise<ResearchResult[]> {
    const bestPractices = [
      {
        keywords: ['typescript', 'ts', 'type'],
        title: 'TypeScript Best Practices',
        content: 'Use strict TypeScript configuration, prefer interfaces over types for object shapes, use enums for constants.',
        implementation: 'Configure tsconfig.json with strict mode, use proper typing throughout the application.',
      },
      {
        keywords: ['react', 'component', 'jsx'],
        title: 'React Component Best Practices',
        content: 'Use functional components with hooks, implement proper error boundaries, optimize with React.memo.',
        implementation: 'Create reusable components, use proper prop types, implement accessibility standards.',
      },
      {
        keywords: ['api', 'rest', 'endpoint'],
        title: 'API Design Best Practices',
        content: 'Use proper HTTP methods, implement consistent error handling, use appropriate status codes.',
        implementation: 'Design RESTful endpoints, implement proper validation, add rate limiting.',
      },
    ];

    return bestPractices
      .filter(bp => bp.keywords.some(keyword => 
        query.toLowerCase().includes(keyword) || (context && context.toLowerCase().includes(keyword))
      ))
      .map(bp => ({
        title: bp.title,
        url: '#best-practices',
        content: bp.content,
        summary: `Best practices for ${query}`,
        relevanceScore: 0.9,
        source: 'thinkcode.ai',
        tags: [query.toLowerCase(), 'best-practices', ...bp.keywords],
        codeExamples: [{
          language: 'typescript',
          code: `// ${bp.title} example\n// ${bp.implementation}`,
          description: `Implementation example for ${bp.title}`,
        }],
        integrationInfo: {
          complexity: 'low',
          requirements: ['Basic knowledge', 'Development environment'],
          benefits: ['Better code quality', 'Improved maintainability'],
          drawbacks: ['Initial learning curve'],
        },
      }));
  }

  /**
   * Fallback - zwraca mockowe dane gdy prawdziwa integracja nie działa
   */
  private getMockResults(params: ResearchQuery): ResearchResponse {
    return {
      success: true,
      data: [{
        title: `Mock: Best Practices for ${params.query}`,
        url: `https://docs.example.com/best-practices-${params.query.toLowerCase().replace(/\s+/g, '-')}`,
        content: `Mock comprehensive guide covering best practices for ${params.query}. This includes industry standards, performance optimizations, and security considerations.`,
        summary: `Mock best practices guide for ${params.query} with practical implementation steps.`,
        relevanceScore: 0.95,
        source: 'mock.example.com',
        tags: params.query.toLowerCase().split(' '),
        codeExamples: [{
          language: 'typescript',
          code: `// Mock implementation for ${params.query}\nconst solution = {\n  // Mock implementation details\n};`,
          description: 'Mock implementation example',
        }],
        integrationInfo: {
          complexity: 'medium',
          requirements: ['Node.js 18+', 'TypeScript support'],
          benefits: ['Mock improved performance', 'Better maintainability'],
          drawbacks: ['Mock initial setup complexity'],
        },
      }],
      total: 1,
      processingTime: 500,
      recommendations: {
        bestSolution: {
          title: `Mock Best Practices for ${params.query}`,
          quickStart: `Mock quick start guide for ${params.query}`,
          implementation: `Mock implementation steps for ${params.query}`,
        },
      },
    };
  }
}