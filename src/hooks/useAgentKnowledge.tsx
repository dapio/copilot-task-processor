/**
 * Agent Knowledge Integration Hook
 * Hook do integracji wiedzy z agentami AI
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  knowledgeBaseService,
  Document,
} from '../services/knowledge-base.service';

// 📊 **Knowledge Context Interface**
interface KnowledgeContext {
  agentId: string;
  conversationContext: string;
  lastQuery: string;
  relevantDocuments: Document[];
  confidenceScore: number;
}

// 🔍 **Search Options Interface**
interface KnowledgeSearchOptions {
  maxResults?: number;
  minRelevance?: number;
  tags?: string[];
  documentTypes?: string[];
  priority?: 'low' | 'medium' | 'high';
}

// 📝 **Knowledge Injection Result**
interface KnowledgeInjectionResult {
  success: boolean;
  contextualKnowledge: string;
  sourceDocuments: Document[];
  confidence: number;
  suggestions: string[];
}

// 🧠 **useAgentKnowledge Hook**
export const useAgentKnowledge = (agentId: string) => {
  // 📊 State Management
  const [knowledgeContext, setKnowledgeContext] =
    useState<KnowledgeContext | null>(null);
  const [availableFeeds, setAvailableFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [injectionHistory, setInjectionHistory] = useState<
    KnowledgeInjectionResult[]
  >([]);

  // 🔄 **Load Agent's Available Feeds**
  const loadAgentFeeds = useCallback(async () => {
    if (!agentId) return;

    try {
      setLoading(true);
      setError(null);

      const feeds = await knowledgeBaseService.getFeedsForAgent(agentId);
      setAvailableFeeds(feeds);
    } catch (err) {
      setError(
        `Failed to load feeds: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    loadAgentFeeds();
  }, [loadAgentFeeds]);

  // 🔍 **Search Agent's Knowledge Base**
  const searchKnowledge = useCallback(
    async (
      query: string,
      options: KnowledgeSearchOptions = {}
    ): Promise<{
      documents: Document[];
      totalFound: number;
      searchContext: string;
    } | null> => {
      if (!query.trim() || !agentId) return null;

      try {
        setLoading(true);
        setError(null);

        const searchResult = await knowledgeBaseService.searchRelevantKnowledge(
          query,
          agentId,
          {
            maxResults: options.maxResults || 10,
            minRelevance: options.minRelevance || 0.3,
            tags: options.tags,
          }
        );

        // Update knowledge context
        setKnowledgeContext({
          agentId,
          conversationContext: query,
          lastQuery: query,
          relevantDocuments: searchResult.documents,
          confidenceScore:
            searchResult.documents.length > 0
              ? searchResult.documents.reduce(
                  (acc, doc) => acc + (doc.relevanceScore || 0),
                  0
                ) / searchResult.documents.length
              : 0,
        });

        return searchResult;
      } catch (err) {
        setError(
          `Search failed: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
        return null;
      } finally {
        setLoading(false);
      }
    },
    [agentId]
  );

  // 💉 **Inject Contextual Knowledge**
  const injectKnowledge = useCallback(
    async (
      conversationContext: string,
      userQuery: string,
      options: KnowledgeSearchOptions = {}
    ): Promise<KnowledgeInjectionResult> => {
      try {
        setLoading(true);
        setError(null);

        // Build comprehensive search query
        const searchQuery = `${conversationContext} ${userQuery}`.trim();

        // Search for relevant knowledge
        const searchResult = await knowledgeBaseService.searchRelevantKnowledge(
          searchQuery,
          agentId,
          {
            maxResults: options.maxResults || 5,
            minRelevance: options.minRelevance || 0.4,
            tags: options.tags,
          }
        );

        if (searchResult.documents.length === 0) {
          const result: KnowledgeInjectionResult = {
            success: false,
            contextualKnowledge: '',
            sourceDocuments: [],
            confidence: 0,
            suggestions: [
              'Consider adding more specific terms to your query',
              'Check if relevant documentation exists in the knowledge base',
              'Try using different keywords or synonyms',
            ],
          };

          setInjectionHistory(prev => [result, ...prev.slice(0, 9)]);
          return result;
        }

        // Generate contextual knowledge summary
        const contextualKnowledge = generateKnowledgeSummary(
          searchResult.documents,
          conversationContext,
          userQuery
        );

        // Calculate confidence score
        const confidence =
          searchResult.documents.reduce(
            (acc, doc) => acc + (doc.relevanceScore || 0),
            0
          ) / searchResult.documents.length;

        // Generate suggestions based on found knowledge
        const suggestions = generateActionableSuggestions(
          searchResult.documents,
          conversationContext
        );

        const result: KnowledgeInjectionResult = {
          success: true,
          contextualKnowledge,
          sourceDocuments: searchResult.documents,
          confidence,
          suggestions,
        };

        // Update injection history
        setInjectionHistory(prev => [result, ...prev.slice(0, 9)]);

        return result;
      } catch (err) {
        const errorResult: KnowledgeInjectionResult = {
          success: false,
          contextualKnowledge: '',
          sourceDocuments: [],
          confidence: 0,
          suggestions: [
            `Error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          ],
        };

        setError(errorResult.suggestions[0]);
        setInjectionHistory(prev => [errorResult, ...prev.slice(0, 9)]);
        return errorResult;
      } finally {
        setLoading(false);
      }
    },
    [agentId]
  );

  // 📊 **Get Knowledge Statistics**
  const getKnowledgeStats = useCallback(async () => {
    try {
      const stats = await knowledgeBaseService.getKnowledgeStats();
      const agentFeeds = availableFeeds.length;
      const agentDocuments = availableFeeds.reduce(
        (acc, feed) => acc + feed.content.documents.length,
        0
      );

      return {
        ...stats,
        agentFeeds,
        agentDocuments,
        injectionHistory: injectionHistory.length,
        averageConfidence:
          injectionHistory.length > 0
            ? injectionHistory.reduce((acc, inj) => acc + inj.confidence, 0) /
              injectionHistory.length
            : 0,
      };
    } catch (err) {
      setError(
        `Failed to get stats: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
      return null;
    }
  }, [availableFeeds, injectionHistory]);

  // 🎯 **Get Context-Aware Suggestions**
  const getContextualSuggestions = useCallback(
    (userInput: string): string[] => {
      if (
        !knowledgeContext ||
        knowledgeContext.relevantDocuments.length === 0
      ) {
        return [
          'Try asking about company standards or best practices',
          'Search for specific technical documentation',
          'Ask about available tools and frameworks',
        ];
      }

      const suggestions: string[] = [];
      const docs = knowledgeContext.relevantDocuments;

      // Extract tags for suggestions
      const allTags = docs.flatMap(doc => doc.tags);
      const uniqueTags = [...new Set(allTags)];

      uniqueTags.slice(0, 3).forEach(tag => {
        suggestions.push(`Ask about "${tag}" related topics`);
      });

      // Document type based suggestions
      const docTypes = [...new Set(docs.map(doc => doc.type))];
      docTypes.forEach(type => {
        if (type === 'guide') {
          suggestions.push('Request step-by-step implementation guidance');
        } else if (type === 'specification') {
          suggestions.push('Ask for technical specifications and requirements');
        } else if (type === 'code-example') {
          suggestions.push('Request code examples and implementation patterns');
        }
      });

      return suggestions.slice(0, 5);
    },
    [knowledgeContext]
  );

  // 📖 **Memoized Knowledge Summary**
  const knowledgeSummary = useMemo(() => {
    if (!knowledgeContext) return null;

    const { relevantDocuments, confidenceScore } = knowledgeContext;

    return {
      documentCount: relevantDocuments.length,
      confidence: Math.round(confidenceScore * 100),
      topTags: getTopTags(relevantDocuments, 5),
      documentTypes: getDocumentTypeDistribution(relevantDocuments),
      suggestions: getContextualSuggestions(''),
    };
  }, [knowledgeContext, getContextualSuggestions]);

  return {
    // State
    knowledgeContext,
    availableFeeds,
    loading,
    error,
    injectionHistory,
    knowledgeSummary,

    // Actions
    searchKnowledge,
    injectKnowledge,
    getKnowledgeStats,
    getContextualSuggestions,

    // Utilities
    refreshFeeds: loadAgentFeeds,
    clearError: () => setError(null),
    clearHistory: () => setInjectionHistory([]),
  };
};

// 🛠️ **Helper Functions**

/**
 * Generates a contextual knowledge summary from documents
 */
function generateKnowledgeSummary(
  documents: Document[],
  conversationContext: string,
  userQuery: string
): string {
  if (documents.length === 0) return '';

  const summary = [
    `Based on your query about "${userQuery}", here's relevant information from our knowledge base:`,
    '',
  ];

  documents.slice(0, 3).forEach((doc, index) => {
    summary.push(`${index + 1}. **${doc.title}** (${doc.type})`);

    // Extract relevant excerpt (first 200 chars)
    const excerpt = doc.content.substring(0, 200).trim();
    summary.push(`   ${excerpt}${doc.content.length > 200 ? '...' : ''}`);

    if (doc.tags.length > 0) {
      summary.push(`   Tags: ${doc.tags.slice(0, 3).join(', ')}`);
    }
    summary.push('');
  });

  if (documents.length > 3) {
    summary.push(`And ${documents.length - 3} more relevant documents...`);
  }

  return summary.join('\n');
}

/**
 * Generates actionable suggestions based on found documents
 */
function generateActionableSuggestions(
  documents: Document[],
  conversationContext: string
): string[] {
  const suggestions: string[] = [];

  // Extract common patterns from documents
  const codeExamples = documents.filter(doc => doc.type === 'code-example');
  const guides = documents.filter(doc => doc.type === 'guide');
  const specs = documents.filter(doc => doc.type === 'specification');

  if (codeExamples.length > 0) {
    suggestions.push('Review the code examples for implementation patterns');
  }

  if (guides.length > 0) {
    suggestions.push('Follow the step-by-step guides for best practices');
  }

  if (specs.length > 0) {
    suggestions.push('Check technical specifications for requirements');
  }

  // Add tag-based suggestions
  const allTags = documents.flatMap(doc => doc.tags);
  const topTags = getTopTags(documents, 3);

  topTags.forEach(tag => {
    suggestions.push(`Explore more "${tag}" related resources`);
  });

  return suggestions.slice(0, 5);
}

/**
 * Gets top tags from documents
 */
function getTopTags(documents: Document[], limit: number): string[] {
  const tagCounts = new Map<string, number>();

  documents.forEach(doc => {
    doc.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag]) => tag);
}

/**
 * Gets document type distribution
 */
function getDocumentTypeDistribution(
  documents: Document[]
): Record<string, number> {
  const distribution: Record<string, number> = {};

  documents.forEach(doc => {
    distribution[doc.type] = (distribution[doc.type] || 0) + 1;
  });

  return distribution;
}

export default useAgentKnowledge;
