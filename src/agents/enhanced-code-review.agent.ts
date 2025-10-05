/**
 * Enhanced Code Review Agent z Knowledge Base Integration
 * Agent review kodu wzbogacony o wiedzę instytucjonalną
 */

import { AgentConfig, AgentResult } from '../types/agent.types';
import { knowledgeBaseService } from '../services/knowledge-base.service';

// 📊 **Code Review Context Interface**
export interface CodeReviewContext {
  codeSnippet: string;
  fileType: string;
  framework?: string;
  pullRequestDescription?: string;
  author: string;
  reviewScope: 'security' | 'performance' | 'style' | 'architecture' | 'all';
}

// 📝 **Enhanced Review Result Interface**
export interface EnhancedReviewResult extends AgentResult {
  knowledgeBasedSuggestions: Array<{
    issue: string;
    suggestion: string;
    sourceDocument: string;
    confidenceScore: number;
    category: 'best-practice' | 'security' | 'performance' | 'style';
  }>;
  institutionalGuidelines: string[];
  complianceScore: number;
  learningResources: Array<{
    title: string;
    type: string;
    relevance: number;
  }>;
}

/**
 * 🤖 Enhanced Code Review Agent Class
 */
export class EnhancedCodeReviewAgent {
  private agentId: string;
  private config: AgentConfig;

  constructor(config: AgentConfig) {
    this.agentId = 'code-review-agent-001';
    this.config = config;
  }

  /**
   * 🔍 Performs enhanced code review with knowledge injection
   */
  async performEnhancedReview(
    context: CodeReviewContext
  ): Promise<EnhancedReviewResult> {
    try {
      // 1. 💉 Inject relevant knowledge
      const knowledgeInjection = await this.injectRelevantKnowledge(context);

      // 2. 🔍 Perform standard code review
      const standardReview = await this.performStandardReview(context);

      // 3. 📊 Enhance with institutional knowledge
      const enhancedSuggestions = await this.enhanceWithInstitutionalKnowledge(
        standardReview,
        knowledgeInjection,
        context
      );

      // 4. 📈 Calculate compliance score
      const complianceScore = await this.calculateComplianceScore(
        context,
        enhancedSuggestions
      );

      // 5. 📚 Provide learning resources
      const learningResources = await this.provideLearningResources(
        context,
        enhancedSuggestions
      );

      return {
        success: true,
        data: {
          review: standardReview,
          enhancedSuggestions,
          institutionalGuidelines: knowledgeInjection.suggestions,
          complianceScore,
          learningResources,
        },
        knowledgeBasedSuggestions: enhancedSuggestions,
        institutionalGuidelines: knowledgeInjection.suggestions,
        complianceScore,
        learningResources,
        metadata: {
          agentId: this.agentId,
          processingTime: Date.now(),
          knowledgeConfidence: knowledgeInjection.confidence,
          sourceDocuments: knowledgeInjection.sourceDocuments.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Enhanced review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        knowledgeBasedSuggestions: [],
        institutionalGuidelines: [],
        complianceScore: 0,
        learningResources: [],
      };
    }
  }

  /**
   * 💉 Injects relevant knowledge for code review
   */
  private async injectRelevantKnowledge(context: CodeReviewContext) {
    const searchQuery = this.buildKnowledgeSearchQuery(context);

    const knowledgeInjection =
      await knowledgeBaseService.searchRelevantKnowledge(
        searchQuery,
        this.agentId,
        {
          maxResults: 10,
          minRelevance: 0.3,
          tags: this.extractRelevantTags(context),
        }
      );

    return {
      contextualKnowledge: this.formatKnowledgeForAgent(
        knowledgeInjection.documents
      ),
      sourceDocuments: knowledgeInjection.documents,
      confidence:
        knowledgeInjection.documents.length > 0
          ? knowledgeInjection.documents.reduce(
              (acc, doc) => acc + (doc.relevanceScore || 0),
              0
            ) / knowledgeInjection.documents.length
          : 0,
      suggestions: this.generateKnowledgeBasedSuggestions(
        knowledgeInjection.documents,
        context
      ),
    };
  }

  /**
   * 🔍 Performs standard code review analysis
   */
  private async performStandardReview(
    context: CodeReviewContext
  ): Promise<any> {
    // Standard code analysis logic
    const issues = [];

    // Basic checks
    if (context.codeSnippet.includes('any')) {
      issues.push({
        type: 'type-safety',
        severity: 'warning',
        message: 'Avoid using "any" type - use specific types instead',
        line: this.findLineWithPattern(context.codeSnippet, 'any'),
      });
    }

    if (context.codeSnippet.includes('console.log')) {
      issues.push({
        type: 'debugging',
        severity: 'info',
        message: 'Remove console.log statements before production',
        line: this.findLineWithPattern(context.codeSnippet, 'console.log'),
      });
    }

    // Security checks
    if (
      context.codeSnippet.includes('eval(') ||
      context.codeSnippet.includes('innerHTML')
    ) {
      issues.push({
        type: 'security',
        severity: 'error',
        message: 'Potential security risk - avoid eval() and innerHTML',
        line: this.findLineWithPattern(
          context.codeSnippet,
          'eval\\(|innerHTML'
        ),
      });
    }

    return {
      issues,
      summary: `Found ${issues.length} issues in code review`,
      recommendations: this.generateStandardRecommendations(issues),
    };
  }

  /**
   * 📊 Enhances review with institutional knowledge
   */
  private async enhanceWithInstitutionalKnowledge(
    standardReview: any,
    knowledgeInjection: any,
    context: CodeReviewContext
  ) {
    const enhancedSuggestions = [];

    // Process each standard issue with institutional knowledge
    for (const issue of standardReview.issues) {
      const relevantDocs = knowledgeInjection.sourceDocuments.filter(
        (doc: any) =>
          doc.tags.some(
            (tag: string) =>
              tag.toLowerCase().includes(issue.type.toLowerCase()) ||
              issue.type.toLowerCase().includes(tag.toLowerCase())
          )
      );

      if (relevantDocs.length > 0) {
        const bestDoc = relevantDocs[0];

        enhancedSuggestions.push({
          issue: issue.message,
          suggestion: this.generateEnhancedSuggestion(issue, bestDoc),
          sourceDocument: bestDoc.title,
          confidenceScore: bestDoc.relevanceScore || 0.5,
          category: this.categorizeIssue(issue.type),
        });
      } else {
        // Standard suggestion without knowledge enhancement
        enhancedSuggestions.push({
          issue: issue.message,
          suggestion: `Follow general best practices for ${issue.type}`,
          sourceDocument: 'General Guidelines',
          confidenceScore: 0.3,
          category: this.categorizeIssue(issue.type),
        });
      }
    }

    // Add proactive suggestions from knowledge base
    const proactiveSuggestions = await this.generateProactiveSuggestions(
      context,
      knowledgeInjection.sourceDocuments
    );

    enhancedSuggestions.push(...proactiveSuggestions);

    return enhancedSuggestions;
  }

  /**
   * 📈 Calculates compliance score based on institutional guidelines
   */
  private async calculateComplianceScore(
    context: CodeReviewContext,
    suggestions: any[]
  ): Promise<number> {
    const criticalIssues = suggestions.filter(
      s => s.category === 'security'
    ).length;
    const performanceIssues = suggestions.filter(
      s => s.category === 'performance'
    ).length;
    const styleIssues = suggestions.filter(s => s.category === 'style').length;
    const bestPracticeIssues = suggestions.filter(
      s => s.category === 'best-practice'
    ).length;

    // Weighted scoring
    const maxScore = 100;
    const deductions =
      criticalIssues * 20 + // Security issues are critical
      performanceIssues * 10 + // Performance issues are important
      bestPracticeIssues * 5 + // Best practices are good to have
      styleIssues * 2; // Style issues are minor

    return Math.max(0, maxScore - deductions);
  }

  /**
   * 📚 Provides learning resources based on identified issues
   */
  private async provideLearningResources(
    context: CodeReviewContext,
    suggestions: any[]
  ) {
    const learningResources = [];

    // Extract unique categories from suggestions
    const categories = [...new Set(suggestions.map(s => s.category))];

    for (const category of categories) {
      const categoryDocs = await knowledgeBaseService.searchRelevantKnowledge(
        `${category} learning guide tutorial`,
        this.agentId,
        {
          maxResults: 3,
          minRelevance: 0.2,
          tags: [category, 'guide', 'tutorial'],
        }
      );

      categoryDocs.documents.forEach(doc => {
        learningResources.push({
          title: doc.title,
          type: doc.type,
          relevance: doc.relevanceScore || 0.5,
          category: category,
          description: doc.content.substring(0, 150) + '...',
        });
      });
    }

    return learningResources
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8);
  }

  // 🛠️ **Helper Methods**

  private buildKnowledgeSearchQuery(context: CodeReviewContext): string {
    const queryParts = [
      'code review',
      context.fileType,
      context.framework || '',
      context.reviewScope,
      'best practices',
    ].filter(Boolean);

    return queryParts.join(' ');
  }

  private extractRelevantTags(context: CodeReviewContext): string[] {
    const tags = ['code-review'];

    if (context.fileType) tags.push(context.fileType);
    if (context.framework) tags.push(context.framework);
    if (context.reviewScope !== 'all') tags.push(context.reviewScope);

    return tags;
  }

  private formatKnowledgeForAgent(documents: any[]): string {
    if (documents.length === 0)
      return 'No specific institutional guidelines found.';

    const summary = [
      'Relevant institutional guidelines:',
      ...documents
        .slice(0, 3)
        .map(
          (doc, i) =>
            `${i + 1}. ${doc.title}: ${doc.content.substring(0, 100)}...`
        ),
    ];

    return summary.join('\n');
  }

  private generateKnowledgeBasedSuggestions(
    documents: any[],
    context: CodeReviewContext
  ): string[] {
    const suggestions = [];

    documents.forEach(doc => {
      if (doc.type === 'guide' || doc.type === 'specification') {
        suggestions.push(
          `Follow "${doc.title}" guidelines for ${context.reviewScope} best practices`
        );
      }
    });

    return suggestions.slice(0, 5);
  }

  private findLineWithPattern(code: string, pattern: string): number {
    const lines = code.split('\n');
    const regex = new RegExp(pattern, 'i');

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        return i + 1;
      }
    }

    return 0;
  }

  private generateStandardRecommendations(issues: any[]): string[] {
    return issues.map(issue => `Fix ${issue.type}: ${issue.message}`);
  }

  private generateEnhancedSuggestion(issue: any, doc: any): string {
    return `Based on "${doc.title}": ${issue.message}. See our institutional guidelines for detailed implementation.`;
  }

  private categorizeIssue(
    issueType: string
  ): 'best-practice' | 'security' | 'performance' | 'style' {
    const categoryMap: Record<
      string,
      'best-practice' | 'security' | 'performance' | 'style'
    > = {
      'type-safety': 'best-practice',
      debugging: 'style',
      security: 'security',
      performance: 'performance',
    };

    return categoryMap[issueType] || 'best-practice';
  }

  private async generateProactiveSuggestions(
    context: CodeReviewContext,
    documents: any[]
  ) {
    const proactiveSuggestions = [];

    // Framework-specific suggestions
    if (context.framework === 'react') {
      const reactDocs = documents.filter(doc =>
        doc.tags.some((tag: string) => tag.toLowerCase().includes('react'))
      );

      if (reactDocs.length > 0) {
        proactiveSuggestions.push({
          issue: 'React optimization opportunity',
          suggestion:
            'Consider applying React performance optimization patterns from our guidelines',
          sourceDocument: reactDocs[0].title,
          confidenceScore: 0.7,
          category: 'performance' as const,
        });
      }
    }

    return proactiveSuggestions;
  }
}

/**
 * 🎯 Agent Integration Factory
 */
export function createEnhancedCodeReviewAgent(
  config: AgentConfig
): EnhancedCodeReviewAgent {
  return new EnhancedCodeReviewAgent(config);
}

/**
 * 📊 Knowledge Integration Statistics
 */
export async function getAgentKnowledgeStats(agentId: string) {
  const feeds = await knowledgeBaseService.getFeedsForAgent(agentId);
  const totalDocuments = feeds.reduce(
    (acc, feed) => acc + feed.content.documents.length,
    0
  );

  return {
    availableFeeds: feeds.length,
    totalDocuments,
    feedTypes: feeds.map(f => f.type),
    lastUpdate:
      feeds.length > 0
        ? Math.max(...feeds.map(f => f.metadata.lastUpdated.getTime()))
        : 0,
  };
}

export default EnhancedCodeReviewAgent;
