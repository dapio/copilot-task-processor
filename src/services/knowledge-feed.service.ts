/**
 * 🧠 Enterprise Knowledge Feed Service
 * System zarządzania feedami wiedzy dla agentów AI
 *
 * Umożliwia:
 * - Tworzenie feedów globalnych, specjalistycznych i departamentalnych
 * - Zarządzanie dokumentami, kodami, procesami i narzędziami
 * - Śledzenie uczenia się agentów
 * - Rekomendacje na podstawie historii użycia
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// ==============================================
// TYPES & SCHEMAS
// ==============================================

export const CreateKnowledgeFeedSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['global', 'agent-specific', 'departmental']),
  department: z.string().optional(),
  agentIds: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).default([]),
});

export const CreateKnowledgeDocumentSchema = z.object({
  feedId: z.string(),
  title: z.string().min(1).max(200),
  type: z.enum(['manual', 'specification', 'guide', 'policy', 'code-example']),
  content: z.string().min(10),
  format: z.enum(['markdown', 'pdf', 'html', 'docx', 'txt']),
  extractedText: z.string().optional(),
  tags: z.array(z.string()).default([]),
  author: z.string(),
  department: z.string().optional(),
});

export const CreateCodeSnippetSchema = z.object({
  feedId: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  language: z.string(),
  framework: z.string().optional(),
  code: z.string().min(1),
  usage: z.string().min(1),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  author: z.string(),
});

export const CreateBestPracticeSchema = z.object({
  feedId: z.string(),
  title: z.string().min(1).max(100),
  description: z.string().min(1),
  category: z.string(),
  domain: z.enum([
    'frontend',
    'backend',
    'database',
    'security',
    'performance',
    'general',
  ]),
  technology: z.string().optional(),
  content: z.string().min(1),
  examples: z.array(z.string()).default([]),
  antiPatterns: z.array(z.string()).default([]),
  complexity: z.enum(['basic', 'medium', 'advanced']).default('medium'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  source: z.string().optional(),
});

export type CreateKnowledgeFeed = z.infer<typeof CreateKnowledgeFeedSchema>;
export type CreateKnowledgeDocument = z.infer<
  typeof CreateKnowledgeDocumentSchema
>;
export type CreateCodeSnippet = z.infer<typeof CreateCodeSnippetSchema>;
export type CreateBestPractice = z.infer<typeof CreateBestPracticeSchema>;

// ==============================================
// KNOWLEDGE FEED SERVICE
// ==============================================

export class KnowledgeFeedService {
  constructor(private prisma: PrismaClient) {}

  // ==============================================
  // FEED MANAGEMENT
  // ==============================================

  /**
   * 🆕 Tworzy nowy feed wiedzy
   */
  async createFeed(data: CreateKnowledgeFeed, createdBy?: string) {
    try {
      const validation = CreateKnowledgeFeedSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false as const,
          error: `Validation failed: ${validation.error.message}`,
        };
      }

      const feed = await this.prisma.knowledgeFeed.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          department: data.department,
          priority: data.priority,
          tags: JSON.stringify(data.tags),
          metadata: JSON.stringify({ createdBy }),
        },
      });

      // Jeśli to feed specyficzny dla agentów, dodaj uprawnienia dostępu
      if (data.type === 'agent-specific' && data.agentIds?.length) {
        await Promise.all(
          data.agentIds.map(agentId =>
            this.prisma.agentFeedAccess.create({
              data: {
                agentId,
                feedId: feed.id,
                accessType: 'read',
                grantedBy: createdBy,
              },
            })
          )
        );
      }

      // Globalny feed - dostęp dla wszystkich aktywnych agentów
      if (data.type === 'global') {
        const agents = await this.prisma.agent.findMany({
          where: { isActive: true },
          select: { id: true },
        });

        await Promise.all(
          agents.map(agent =>
            this.prisma.agentFeedAccess.create({
              data: {
                agentId: agent.id,
                feedId: feed.id,
                accessType: 'read',
                grantedBy: createdBy || 'system',
              },
            })
          )
        );
      }

      return {
        success: true as const,
        data: feed,
      };
    } catch (error) {
      console.error('Error creating knowledge feed:', error);
      return {
        success: false as const,
        error: `Failed to create feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 📋 Pobiera wszystkie feedy z możliwością filtrowania
   */
  async getFeeds(filters?: {
    type?: string;
    department?: string;
    agentId?: string;
    isActive?: boolean;
  }) {
    try {
      const where: any = {};

      if (filters?.type) where.type = filters.type;
      if (filters?.department) where.department = filters.department;
      if (filters?.isActive !== undefined) where.isActive = filters.isActive;

      let feedQuery = this.prisma.knowledgeFeed.findMany({
        where,
        include: {
          _count: {
            select: {
              documents: true,
              codeSnippets: true,
              processDefinitions: true,
              toolDefinitions: true,
              knowledgePractices: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      });

      // Jeśli filtrujemy po agentId, uwzględnij tylko feedy do których agent ma dostęp
      if (filters?.agentId) {
        const agentAccess = await this.prisma.agentFeedAccess.findMany({
          where: {
            agentId: filters.agentId,
            isActive: true,
          },
          select: { feedId: true },
        });

        const accessibleFeedIds = agentAccess.map(a => a.feedId);
        where.id = { in: accessibleFeedIds };

        feedQuery = this.prisma.knowledgeFeed.findMany({
          where,
          include: {
            _count: {
              select: {
                documents: true,
                codeSnippets: true,
                processDefinitions: true,
                toolDefinitions: true,
                knowledgePractices: true,
              },
            },
          },
          orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        });
      }

      const feeds = await feedQuery;

      return {
        success: true as const,
        data: feeds.map(feed => ({
          ...feed,
          tags: feed.tags ? JSON.parse(feed.tags) : [],
          metadata: feed.metadata ? JSON.parse(feed.metadata) : {},
        })),
      };
    } catch (error) {
      console.error('Error fetching feeds:', error);
      return {
        success: false as const,
        error: `Failed to fetch feeds: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 📖 Pobiera szczegóły feeda z całą zawartością
   */
  async getFeedDetails(feedId: string, agentId?: string) {
    try {
      // Sprawdź uprawnienia jeśli podano agentId
      if (agentId) {
        const access = await this.prisma.agentFeedAccess.findFirst({
          where: {
            agentId,
            feedId,
            isActive: true,
          },
        });

        if (!access) {
          return {
            success: false as const,
            error: 'Access denied to this feed',
          };
        }
      }

      const feed = await this.prisma.knowledgeFeed.findUnique({
        where: { id: feedId },
        include: {
          documents: {
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
          },
          codeSnippets: {
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
          },
          processDefinitions: {
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
          },
          toolDefinitions: {
            where: { isActive: true },
            orderBy: { updatedAt: 'desc' },
          },
          knowledgePractices: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      });

      if (!feed) {
        return {
          success: false as const,
          error: 'Feed not found',
        };
      }

      return {
        success: true as const,
        data: {
          ...feed,
          tags: feed.tags ? JSON.parse(feed.tags) : [],
          metadata: feed.metadata ? JSON.parse(feed.metadata) : {},
        },
      };
    } catch (error) {
      console.error('Error fetching feed details:', error);
      return {
        success: false as const,
        error: `Failed to fetch feed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ==============================================
  // CONTENT MANAGEMENT
  // ==============================================

  /**
   * 📄 Dodaje dokument do feeda
   */
  async addDocument(data: CreateKnowledgeDocument) {
    try {
      const validation = CreateKnowledgeDocumentSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false as const,
          error: `Validation failed: ${validation.error.message}`,
        };
      }

      const document = await this.prisma.knowledgeDocument.create({
        data: {
          ...data,
          tags: JSON.stringify(data.tags),
        },
      });

      // Aktualizuj ostatnią modyfikację feeda
      await this.prisma.knowledgeFeed.update({
        where: { id: data.feedId },
        data: { updatedAt: new Date() },
      });

      return {
        success: true as const,
        data: {
          ...document,
          tags: document.tags ? JSON.parse(document.tags) : [],
        },
      };
    } catch (error) {
      console.error('Error adding document:', error);
      return {
        success: false as const,
        error: `Failed to add document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 💻 Dodaje fragment kodu do feeda
   */
  async addCodeSnippet(data: CreateCodeSnippet) {
    try {
      const validation = CreateCodeSnippetSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false as const,
          error: `Validation failed: ${validation.error.message}`,
        };
      }

      const snippet = await this.prisma.codeSnippet.create({
        data: {
          ...data,
          tags: JSON.stringify(data.tags),
        },
      });

      // Aktualizuj ostatnią modyfikację feeda
      await this.prisma.knowledgeFeed.update({
        where: { id: data.feedId },
        data: { updatedAt: new Date() },
      });

      return {
        success: true as const,
        data: {
          ...snippet,
          tags: snippet.tags ? JSON.parse(snippet.tags) : [],
        },
      };
    } catch (error) {
      console.error('Error adding code snippet:', error);
      return {
        success: false as const,
        error: `Failed to add code snippet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * ✨ Dodaje best practice do feeda
   */
  async addBestPractice(data: CreateBestPractice) {
    try {
      const validation = CreateBestPracticeSchema.safeParse(data);
      if (!validation.success) {
        return {
          success: false as const,
          error: `Validation failed: ${validation.error.message}`,
        };
      }

      const practice = await this.prisma.knowledgeBestPractice.create({
        data: {
          ...data,
          examples: JSON.stringify(data.examples),
          antiPatterns: JSON.stringify(data.antiPatterns),
        },
      });

      // Aktualizuj ostatnią modyfikację feeda
      await this.prisma.knowledgeFeed.update({
        where: { id: data.feedId },
        data: { updatedAt: new Date() },
      });

      return {
        success: true as const,
        data: {
          ...practice,
          examples: practice.examples ? JSON.parse(practice.examples) : [],
          antiPatterns: practice.antiPatterns
            ? JSON.parse(practice.antiPatterns)
            : [],
        },
      };
    } catch (error) {
      console.error('Error adding best practice:', error);
      return {
        success: false as const,
        error: `Failed to add best practice: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ==============================================
  // SEARCH & RECOMMENDATIONS
  // ==============================================

  /**
   * 🔍 Wyszukuje w feedach wiedzy
   */
  async searchKnowledge(
    query: string,
    agentId?: string,
    filters?: {
      feedIds?: string[];
      types?: string[];
      domains?: string[];
      limit?: number;
    }
  ) {
    try {
      const limit = filters?.limit || 20;
      const searchResults: any[] = [];

      // Pobierz feedy do przeszukania
      let feedIds: string[] = [];

      if (filters?.feedIds) {
        feedIds = filters.feedIds;
      } else if (agentId) {
        const agentAccess = await this.prisma.agentFeedAccess.findMany({
          where: {
            agentId,
            isActive: true,
          },
          select: { feedId: true },
        });
        feedIds = agentAccess.map(a => a.feedId);
      } else {
        const allFeeds = await this.prisma.knowledgeFeed.findMany({
          where: { isActive: true, type: 'global' },
          select: { id: true },
        });
        feedIds = allFeeds.map(f => f.id);
      }

      if (feedIds.length === 0) {
        return {
          success: true as const,
          data: { results: [], totalCount: 0 },
        };
      }

      // Wyszukaj dokumenty
      const documents = await this.prisma.knowledgeDocument.findMany({
        where: {
          feedId: { in: feedIds },
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
            { tags: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { feed: true },
        take: Math.ceil(limit / 4),
      });

      // Wyszukaj fragmenty kodu
      const snippets = await this.prisma.codeSnippet.findMany({
        where: {
          feedId: { in: feedIds },
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { tags: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { feed: true },
        take: Math.ceil(limit / 4),
      });

      // Wyszukaj best practices
      const practices = await this.prisma.knowledgeBestPractice.findMany({
        where: {
          feedId: { in: feedIds },
          isActive: true,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { feed: true },
        take: Math.ceil(limit / 4),
      });

      // Wyszukaj narzędzia
      const tools = await this.prisma.toolDefinition.findMany({
        where: {
          feedId: { in: feedIds },
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { documentation: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: { feed: true },
        take: Math.ceil(limit / 4),
      });

      // Połącz i posortuj wyniki
      const allResults = [
        ...documents.map(doc => ({
          type: 'document' as const,
          id: doc.id,
          title: doc.title,
          content: doc.content.substring(0, 300) + '...',
          feedName: doc.feed.name,
          feedId: doc.feedId,
          relevanceScore: this.calculateRelevanceScore(
            query,
            doc.title,
            doc.content
          ),
        })),
        ...snippets.map(snippet => ({
          type: 'code' as const,
          id: snippet.id,
          title: snippet.title,
          content: snippet.description,
          code: snippet.code.substring(0, 200) + '...',
          language: snippet.language,
          feedName: snippet.feed.name,
          feedId: snippet.feedId,
          relevanceScore: this.calculateRelevanceScore(
            query,
            snippet.title,
            snippet.description
          ),
        })),
        ...practices.map(practice => ({
          type: 'practice' as const,
          id: practice.id,
          title: practice.title,
          content: practice.description,
          domain: practice.domain,
          complexity: practice.complexity,
          feedName: practice.feed.name,
          feedId: practice.feedId,
          relevanceScore: this.calculateRelevanceScore(
            query,
            practice.title,
            practice.description
          ),
        })),
        ...tools.map(tool => ({
          type: 'tool' as const,
          id: tool.id,
          title: tool.name,
          content: tool.description,
          toolType: tool.type,
          category: tool.category,
          feedName: tool.feed.name,
          feedId: tool.feedId,
          relevanceScore: this.calculateRelevanceScore(
            query,
            tool.name,
            tool.description
          ),
        })),
      ];

      // Posortuj według relevance score
      const sortedResults = allResults
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      // Zapisz historię wyszukiwania jeśli podano agentId
      if (agentId && sortedResults.length > 0) {
        await this.logLearningHistory({
          agentId,
          feedId: sortedResults[0].feedId,
          actionType: 'viewed',
          context: `Search query: ${query}`,
          effectiveness: sortedResults.length > 0 ? 0.8 : 0.3,
        });
      }

      return {
        success: true as const,
        data: {
          results: sortedResults,
          totalCount: allResults.length,
          query,
          searchedFeeds: feedIds.length,
        },
      };
    } catch (error) {
      console.error('Error searching knowledge:', error);
      return {
        success: false as const,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 💡 Generuje rekomendacje dla agenta na podstawie historii
   */
  async getRecommendations(agentId: string, context?: string) {
    try {
      // Pobierz historię uczenia się agenta
      const learningHistory = await this.prisma.feedLearningHistory.findMany({
        where: {
          agentId,
          effectiveness: { gte: 0.7 }, // Tylko skuteczne użycia
        },
        include: {
          feed: true,
          document: true,
          snippet: true,
          process: true,
          tool: true,
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      // Analizuj wzorce użycia
      const feedUsage = new Map<string, number>();
      const categoryUsage = new Map<string, number>();
      const domainUsage = new Map<string, number>();

      learningHistory.forEach(entry => {
        // Zlicz feedy
        feedUsage.set(entry.feedId, (feedUsage.get(entry.feedId) || 0) + 1);

        // Zlicz kategorie i domeny
        if (entry.snippet) {
          categoryUsage.set(
            entry.snippet.category,
            (categoryUsage.get(entry.snippet.category) || 0) + 1
          );
        }
        // Dodaj więcej logiki analizy...
      });

      // Generuj rekomendacje na podstawie wzorców
      const recommendations = [];

      // Rekomendacje feedów
      const topFeeds = Array.from(feedUsage.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      for (const [feedId] of topFeeds) {
        const feed = await this.prisma.knowledgeFeed.findUnique({
          where: { id: feedId },
          include: {
            _count: {
              select: {
                documents: true,
                codeSnippets: true,
                knowledgePractices: true,
              },
            },
          },
        });

        if (feed) {
          recommendations.push({
            type: 'feed',
            title: `Explore more from "${feed.name}"`,
            description: `Based on your usage patterns, this feed has valuable content for you.`,
            feedId: feed.id,
            feedName: feed.name,
            priority: 'high',
            contentCount:
              feed._count.documents +
              feed._count.codeSnippets +
              feed._count.knowledgePractices,
          });
        }
      }

      return {
        success: true as const,
        data: {
          recommendations,
          analysisData: {
            totalHistory: learningHistory.length,
            topFeeds: topFeeds.map(([feedId, count]) => ({
              feedId,
              usageCount: count,
            })),
            topCategories: Array.from(categoryUsage.entries())
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5),
          },
        },
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return {
        success: false as const,
        error: `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ==============================================
  // LEARNING ANALYTICS
  // ==============================================

  /**
   * 📊 Zapisuje historię uczenia się agenta
   */
  async logLearningHistory(data: {
    agentId: string;
    feedId: string;
    documentId?: string;
    snippetId?: string;
    processId?: string;
    toolId?: string;
    actionType: 'viewed' | 'applied' | 'referenced' | 'improved';
    context?: string;
    effectiveness?: number;
    feedback?: string;
  }) {
    try {
      const entry = await this.prisma.feedLearningHistory.create({
        data: {
          agentId: data.agentId,
          feedId: data.feedId,
          documentId: data.documentId,
          snippetId: data.snippetId,
          processId: data.processId,
          toolId: data.toolId,
          actionType: data.actionType,
          context: data.context,
          effectiveness: data.effectiveness,
          feedback: data.feedback,
        },
      });

      return {
        success: true as const,
        data: entry,
      };
    } catch (error) {
      console.error('Error logging learning history:', error);
      return {
        success: false as const,
        error: `Failed to log learning: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * 📈 Pobiera statystyki uczenia się agenta
   */
  async getAgentLearningStats(
    agentId: string,
    timeframe?: 'day' | 'week' | 'month'
  ) {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const stats = await this.prisma.feedLearningHistory.aggregate({
        where: {
          agentId,
          timestamp: { gte: startDate },
        },
        _count: true,
        _avg: { effectiveness: true },
      });

      const actionTypeStats = await this.prisma.feedLearningHistory.groupBy({
        by: ['actionType'],
        where: {
          agentId,
          timestamp: { gte: startDate },
        },
        _count: true,
      });

      return {
        success: true as const,
        data: {
          totalActions: stats._count,
          averageEffectiveness: stats._avg.effectiveness || 0,
          actionBreakdown: actionTypeStats.reduce(
            (acc, stat) => {
              acc[stat.actionType] = stat._count;
              return acc;
            },
            {} as Record<string, number>
          ),
          timeframe,
          period: { start: startDate, end: now },
        },
      };
    } catch (error) {
      console.error('Error fetching learning stats:', error);
      return {
        success: false as const,
        error: `Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  // ==============================================
  // UTILITY METHODS
  // ==============================================

  /**
   * 🎯 Oblicza score relevance dla wyszukiwania
   */
  private calculateRelevanceScore(
    query: string,
    title: string,
    content: string
  ): number {
    const lowerQuery = query.toLowerCase();
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();

    let score = 0;

    // Exact match w tytule = wysoki score
    if (lowerTitle.includes(lowerQuery)) score += 10;

    // Match w treści = średni score
    if (lowerContent.includes(lowerQuery)) score += 5;

    // Word matches
    const queryWords = lowerQuery.split(' ');
    queryWords.forEach(word => {
      if (word.length > 2) {
        if (lowerTitle.includes(word)) score += 3;
        if (lowerContent.includes(word)) score += 1;
      }
    });

    // Bonus za krótszy tytuł (bardziej precyzyjne wyniki)
    if (title.length < 50) score += 2;

    return Math.min(score, 100); // Max 100 points
  }

  /**
   * 🚀 Inicjalizuje domyślne feedy wiedzy
   */
  async initializeDefaultFeeds() {
    try {
      console.log('🧠 Inicjalizacja domyślnych feedów wiedzy...');

      // 1. Globalny feed standardów
      const globalFeed = await this.createFeed(
        {
          name: 'Company Standards & Guidelines',
          description:
            'Globalne standardy kodowania, architektura i best practices organizacji',
          type: 'global',
          priority: 'high',
          tags: ['standards', 'guidelines', 'architecture', 'best-practices'],
        },
        'system'
      );

      if (globalFeed.success) {
        // Dodaj przykładowe dokumenty
        await this.addDocument({
          feedId: globalFeed.data.id,
          title: 'TypeScript Coding Standards',
          type: 'guide',
          content: `# TypeScript Coding Standards

## Podstawowe zasady
- Używaj strict mode
- Preferuj const nad let
- Zawsze definiuj typy dla funkcji publicznych
- Używaj descriptive names dla zmiennych i funkcji

## Przykłady

\`\`\`typescript
// ✅ Dobrze
const calculateTotalPrice = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// ❌ Źle
let calc = (arr: any) => {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i].price * arr[i].qty;
  }
  return total;
};
\`\`\``,
          format: 'markdown',
          tags: ['typescript', 'coding-standards', 'javascript'],
          author: 'Architecture Team',
          department: 'Engineering',
        });

        await this.addBestPractice({
          feedId: globalFeed.data.id,
          title: 'React Component Architecture',
          description:
            'Best practices for building maintainable React components',
          category: 'Frontend',
          domain: 'frontend',
          technology: 'React',
          content: `## Component Structure

1. **Single Responsibility**: Each component should have one clear purpose
2. **Composition over Inheritance**: Use composition patterns
3. **Props Interface**: Always define clear prop interfaces
4. **Error Boundaries**: Wrap components with error boundaries
5. **Performance**: Use memo, useMemo, useCallback appropriately`,
          examples: [
            'const Button = memo(({ onClick, children, variant = "primary" }) => ...)',
            'const useData = () => { const data = useMemo(() => processData(rawData), [rawData]); ... }',
          ],
          antiPatterns: [
            'Mixing business logic with presentation',
            'Directly mutating props',
            'Using inline functions in JSX without useCallback',
          ],
          complexity: 'medium',
          priority: 'high',
        });

        await this.addCodeSnippet({
          feedId: globalFeed.data.id,
          title: 'Error Boundary Component',
          description: 'Reusable error boundary for React applications',
          language: 'typescript',
          framework: 'React',
          code: `import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}`,
          usage:
            'Wrap your components to catch and handle runtime errors gracefully',
          category: 'Error Handling',
          tags: ['react', 'error-handling', 'typescript', 'component'],
          author: 'Frontend Team',
        });
      }

      console.log('✅ Domyślne feedy wiedzy zostały zainicjalizowane');

      return {
        success: true as const,
        message: 'Default feeds initialized successfully',
      };
    } catch (error) {
      console.error('Error initializing default feeds:', error);
      return {
        success: false as const,
        error: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export default KnowledgeFeedService;
