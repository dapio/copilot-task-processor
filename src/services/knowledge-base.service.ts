/**
 * Knowledge Base Management Service
 * Zarządza feedami wiedzy dla agentów AI
 */

import { z } from 'zod';

// 📋 **Schema Definitions**
export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  type: z.enum(['manual', 'specification', 'guide', 'policy', 'code-example']),
  content: z.string().min(10),
  format: z.enum(['markdown', 'pdf', 'html', 'docx', 'txt']),
  extractedText: z.string().optional(),
  tags: z.array(z.string()).default([]),
  relevanceScore: z.number().min(0).max(1).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  author: z.string(),
  department: z.string().optional(),
});

export const KnowledgeFeedSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['global', 'agent-specific', 'departmental']),
  agentIds: z.array(z.string()).optional(),
  department: z.string().optional(),

  content: z.object({
    documents: z.array(DocumentSchema).default([]),
    codeSnippets: z.array(z.any()).default([]), // TODO: Define CodeSnippetSchema
    processes: z.array(z.any()).default([]), // TODO: Define ProcessSchema
    tools: z.array(z.any()).default([]), // TODO: Define ToolSchema
  }),

  metadata: z.object({
    lastUpdated: z.date().default(() => new Date()),
    version: z.string().default('1.0.0'),
    tags: z.array(z.string()).default([]),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    isActive: z.boolean().default(true),
  }),

  accessControl: z
    .object({
      readRoles: z.array(z.string()).default(['user']),
      writeRoles: z.array(z.string()).default(['admin']),
      adminRoles: z.array(z.string()).default(['admin']),
    })
    .optional(),
});

export type Document = z.infer<typeof DocumentSchema>;
export type KnowledgeFeed = z.infer<typeof KnowledgeFeedSchema>;

// 🧠 **Knowledge Base Service**
export class KnowledgeBaseService {
  private feeds: Map<string, KnowledgeFeed> = new Map();
  private documentIndex: Map<string, Document> = new Map();

  constructor() {
    this.initializeGlobalFeed();
  }

  /**
   * 🌐 Inicjalizuje globalny feed wiedzy
   */
  private initializeGlobalFeed(): void {
    const globalFeed: KnowledgeFeed = {
      id: 'global-knowledge-feed',
      name: 'Global Company Knowledge',
      description: 'Shared knowledge base accessible to all agents',
      type: 'global',

      content: {
        documents: [
          {
            id: 'coding-standards-001',
            title: 'Company Coding Standards',
            type: 'guide',
            content: this.getDefaultCodingStandards(),
            format: 'markdown',
            tags: ['coding', 'standards', 'typescript', 'react'],
            author: 'Architecture Team',
            department: 'Engineering',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'api-guidelines-001',
            title: 'REST API Design Guidelines',
            type: 'specification',
            content: this.getDefaultApiGuidelines(),
            format: 'markdown',
            tags: ['api', 'rest', 'design', 'guidelines'],
            author: 'API Team',
            department: 'Engineering',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        codeSnippets: [],
        processes: [],
        tools: [],
      },

      metadata: {
        lastUpdated: new Date(),
        version: '1.0.0',
        tags: ['global', 'standards', 'guidelines'],
        priority: 'high',
        isActive: true,
      },
    };

    this.feeds.set(globalFeed.id, globalFeed);

    // Index documents for search
    globalFeed.content.documents.forEach(doc => {
      this.documentIndex.set(doc.id, doc);
    });
  }

  /**
   * 📝 Tworzy nowy feed wiedzy
   */
  async createFeed(
    feedData: Omit<KnowledgeFeed, 'id'>
  ): Promise<
    { success: true; feed: KnowledgeFeed } | { success: false; error: string }
  > {
    try {
      const validation = KnowledgeFeedSchema.omit({ id: true }).safeParse(
        feedData
      );
      if (!validation.success) {
        return {
          success: false,
          error: `Validation failed: ${validation.error.message}`,
        };
      }

      const feed: KnowledgeFeed = {
        id: `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...feedData,
      };

      this.feeds.set(feed.id, feed);

      // Index documents
      feed.content.documents.forEach(doc => {
        this.documentIndex.set(doc.id, doc);
      });

      return { success: true, feed };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 📖 Pobiera feedy dla konkretnego agenta
   */
  async getFeedsForAgent(agentId: string): Promise<KnowledgeFeed[]> {
    const feeds: KnowledgeFeed[] = [];

    for (const feed of this.feeds.values()) {
      if (!feed.metadata.isActive) continue;

      // Global feeds are accessible to all
      if (feed.type === 'global') {
        feeds.push(feed);
        continue;
      }

      // Agent-specific feeds
      if (feed.type === 'agent-specific' && feed.agentIds?.includes(agentId)) {
        feeds.push(feed);
        continue;
      }

      // TODO: Add departmental feed logic when user/agent department info is available
    }

    return feeds.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (
        priorityOrder[b.metadata.priority] - priorityOrder[a.metadata.priority]
      );
    });
  }

  /**
   * 🔍 Wyszukuje relevantną wiedzę na podstawie kontekstu
   */
  async searchRelevantKnowledge(
    query: string,
    agentId?: string,
    options: {
      maxResults?: number;
      minRelevance?: number;
      tags?: string[];
    } = {}
  ): Promise<{
    documents: Document[];
    totalFound: number;
    searchContext: string;
  }> {
    const { maxResults = 10, minRelevance = 0.3, tags } = options;

    const availableFeeds = agentId
      ? await this.getFeedsForAgent(agentId)
      : Array.from(this.feeds.values()).filter(f => f.type === 'global');

    const allDocuments: Document[] = [];
    availableFeeds.forEach(feed => {
      allDocuments.push(...feed.content.documents);
    });

    // Simple text-based search (in production would use vector embeddings)
    const searchTerms = query
      .toLowerCase()
      .split(' ')
      .filter(term => term.length > 2);

    const scoredDocuments = allDocuments
      .map(doc => {
        let score = 0;
        const searchableText =
          `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();

        // Calculate relevance score
        searchTerms.forEach(term => {
          const titleMatches = (
            doc.title.toLowerCase().match(new RegExp(term, 'g')) || []
          ).length;
          const contentMatches = (
            doc.content.toLowerCase().match(new RegExp(term, 'g')) || []
          ).length;
          const tagMatches = doc.tags.some(tag =>
            tag.toLowerCase().includes(term)
          )
            ? 1
            : 0;

          score += titleMatches * 3 + contentMatches * 1 + tagMatches * 2;
        });

        // Tag filtering bonus
        if (tags && tags.length > 0) {
          const tagOverlap = doc.tags.filter(tag =>
            tags.some(searchTag =>
              tag.toLowerCase().includes(searchTag.toLowerCase())
            )
          ).length;
          score += tagOverlap * 2;
        }

        // Normalize score
        const normalizedScore = Math.min(score / (searchTerms.length * 5), 1);

        return {
          document: { ...doc, relevanceScore: normalizedScore },
          score: normalizedScore,
        };
      })
      .filter(item => item.score >= minRelevance)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults);

    return {
      documents: scoredDocuments.map(item => item.document),
      totalFound: scoredDocuments.length,
      searchContext: `Found ${scoredDocuments.length} relevant documents for query: "${query}"`,
    };
  }

  /**
   * 📄 Dodaje dokument do feedu
   */
  async addDocumentToFeed(
    feedId: string,
    document: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<
    { success: true; document: Document } | { success: false; error: string }
  > {
    try {
      const feed = this.feeds.get(feedId);
      if (!feed) {
        return { success: false, error: `Feed with id ${feedId} not found` };
      }

      const newDocument: Document = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...document,
      };

      const validation = DocumentSchema.safeParse(newDocument);
      if (!validation.success) {
        return {
          success: false,
          error: `Document validation failed: ${validation.error.message}`,
        };
      }

      feed.content.documents.push(newDocument);
      feed.metadata.lastUpdated = new Date();

      // Update index
      this.documentIndex.set(newDocument.id, newDocument);

      return { success: true, document: newDocument };
    } catch (error) {
      return {
        success: false,
        error: `Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 📊 Pobiera statystyki użycia wiedzy
   */
  async getKnowledgeStats(): Promise<{
    totalFeeds: number;
    totalDocuments: number;
    activeFeeds: number;
    feedsByType: Record<string, number>;
    documentsByType: Record<string, number>;
    recentActivity: Array<{
      action: string;
      feedId: string;
      feedName: string;
      timestamp: Date;
    }>;
  }> {
    const feeds = Array.from(this.feeds.values());
    const allDocuments = Array.from(this.documentIndex.values());

    const feedsByType = feeds.reduce(
      (acc, feed) => {
        acc[feed.type] = (acc[feed.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const documentsByType = allDocuments.reduce(
      (acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalFeeds: feeds.length,
      totalDocuments: allDocuments.length,
      activeFeeds: feeds.filter(f => f.metadata.isActive).length,
      feedsByType,
      documentsByType,
      recentActivity: [], // TODO: Implement activity tracking
    };
  }

  /**
   * 📝 Default content generators
   */
  private getDefaultCodingStandards(): string {
    return `# Company Coding Standards

## TypeScript Best Practices
- Use strict type checking
- Prefer interfaces over types for object shapes
- Use meaningful variable names
- Apply SOLID principles

## React Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Optimize with memo, useMemo, useCallback
- Follow accessibility guidelines (WCAG 2.1 AA)

## Code Organization
- Service-Hook-Component architecture
- Result<T, E> pattern for error handling
- Comprehensive JSDoc documentation
- 90%+ test coverage requirement

## Security Standards
- Validate all inputs with Zod
- Sanitize user content
- Use environment variables for secrets
- Implement proper CORS policies`;
  }

  private getDefaultApiGuidelines(): string {
    return `# REST API Design Guidelines

## URL Structure
- Use nouns, not verbs in endpoints
- Use plural nouns for collections
- Use kebab-case for multi-word resources

## HTTP Methods
- GET for retrieval
- POST for creation
- PUT for full updates
- PATCH for partial updates
- DELETE for removal

## Response Format
\`\`\`json
{
  "success": true,
  "data": {...},
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
\`\`\`

## Error Handling
- Use appropriate HTTP status codes
- Provide meaningful error messages
- Include error codes for programmatic handling
- Log errors with context`;
  }

  /**
   * 🧹 Cleanup methods
   */
  async deleteFeed(
    feedId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const feed = this.feeds.get(feedId);
      if (!feed) {
        return { success: false, error: 'Feed not found' };
      }

      // Remove documents from index
      feed.content.documents.forEach(doc => {
        this.documentIndex.delete(doc.id);
      });

      this.feeds.delete(feedId);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async listAllFeeds(): Promise<KnowledgeFeed[]> {
    return Array.from(this.feeds.values());
  }

  async getFeedById(feedId: string): Promise<KnowledgeFeed | null> {
    return this.feeds.get(feedId) || null;
  }
}

// 🏭 **Singleton instance**
export const knowledgeBaseService = new KnowledgeBaseService();
