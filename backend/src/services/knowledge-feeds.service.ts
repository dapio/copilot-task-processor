/**
 * Knowledge Feeds Management Service
 * Manages learning feeds for agents and projects
 */

import { PrismaClient } from '../generated/prisma';
import { Result, MLError } from '../providers/ml-provider.interface';

export interface KnowledgeFeedData {
  name: string;
  description?: string;
  type: 'global' | 'agent_specific' | 'project_specific';
  source: 'url' | 'file' | 'manual' | 'api';
  content: any;
  metadata?: Record<string, any>;
  autoUpdate: boolean;
  updateFrequency?: string;
}

export interface FeedEntry {
  title: string;
  content: string;
  url?: string;
  category?: string;
  tags?: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface AgentLearningData {
  agentType: string;
  companyPatterns: string[];
  bestPractices: string[];
  integrations: string[];
  commonSolutions: string[];
}

export class KnowledgeFeedsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new knowledge feed
   */
  async createFeed(
    feedData: KnowledgeFeedData
  ): Promise<Result<string, MLError>> {
    try {
      const feed = await this.prisma.knowledgeFeed.create({
        data: {
          name: feedData.name,
          type: feedData.source, // Using existing schema field
          url: feedData.source === 'url' ? feedData.content.url || null : null,
          config: {
            sourceType: feedData.source,
            feedType: feedData.type,
            description: feedData.description,
            autoUpdate: feedData.autoUpdate,
            updateFrequency: feedData.updateFrequency,
          } as any,
          metadata: feedData.metadata as any,
          status: 'active',
        },
      });

      // Add initial entries if provided
      if (feedData.content.entries && Array.isArray(feedData.content.entries)) {
        await this.addEntriesToFeed(feed.id, feedData.content.entries);
      }

      return {
        success: true,
        data: feed.id,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FEED_CREATE_ERROR',
          message: 'Failed to create knowledge feed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Add entries to a feed
   */
  async addEntriesToFeed(
    feedId: string,
    entries: FeedEntry[]
  ): Promise<Result<number, MLError>> {
    try {
      let addedCount = 0;

      for (const entry of entries) {
        const hash = this.generateEntryHash(entry);

        // Check for duplicates
        const existing = await this.prisma.knowledgeEntry.findUnique({
          where: { hash },
        });

        if (!existing) {
          await this.prisma.knowledgeEntry.create({
            data: {
              feedId,
              title: entry.title,
              content: entry.content,
              url: entry.url,
              hash,
              tags: JSON.stringify(entry.tags || []),
              category: entry.category,
              priority: entry.priority,
              status: 'active',
            },
          });
          addedCount++;
        }
      }

      return {
        success: true,
        data: addedCount,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'ENTRIES_ADD_ERROR',
          message: 'Failed to add entries to feed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Assign feed to agent
   */
  async assignFeedToAgent(
    feedId: string,
    agentId: string
  ): Promise<Result<void, MLError>> {
    try {
      await this.prisma.agentFeed.upsert({
        where: {
          agentId_feedId: {
            agentId,
            feedId,
          },
        },
        update: {},
        create: {
          agentId,
          feedId,
        },
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FEED_ASSIGNMENT_ERROR',
          message: 'Failed to assign feed to agent',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Assign feed to project
   */
  async assignFeedToProject(
    feedId: string,
    projectId: string
  ): Promise<Result<void, MLError>> {
    try {
      await this.prisma.projectFeed.upsert({
        where: {
          projectId_feedId: {
            projectId,
            feedId,
          },
        },
        update: {},
        create: {
          projectId,
          feedId,
        },
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FEED_ASSIGNMENT_ERROR',
          message: 'Failed to assign feed to project',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get feeds for agent
   */
  async getAgentFeeds(
    agentId: string
  ): Promise<Result<KnowledgeFeedData[], MLError>> {
    try {
      const agentFeeds = await this.prisma.agentFeed.findMany({
        where: { agentId },
        include: {
          feed: {
            include: {
              entries: {
                where: { status: 'active' },
                orderBy: { createdAt: 'desc' },
                take: 50,
              },
            },
          },
        },
      });

      // Also get global feeds
      const globalFeeds = await this.prisma.knowledgeFeed.findMany({
        where: {
          status: 'active',
        },
        include: {
          entries: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      const allFeeds = [...agentFeeds.map(af => af.feed), ...globalFeeds];

      const feedData: KnowledgeFeedData[] = allFeeds.map(feed => ({
        name: feed.name,
        description: (feed.config as any)?.description,
        type: (feed.config as any)?.feedType || 'global',
        source: (feed.config as any)?.sourceType || 'manual',
        content: {
          entries:
            (feed as any).entries?.map((entry: any) => ({
              title: entry.title,
              content: entry.content,
              url: entry.url,
              category: entry.category,
              tags: entry.tags ? JSON.parse(entry.tags) : [],
              priority: entry.priority as 'low' | 'medium' | 'high',
            })) || [],
        },
        metadata: (feed.metadata as Record<string, any>) || {},
        autoUpdate: (feed.config as any)?.autoUpdate || false,
        updateFrequency: (feed.config as any)?.updateFrequency,
      }));

      return {
        success: true,
        data: feedData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AGENT_FEEDS_ERROR',
          message: 'Failed to get agent feeds',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Get feeds for project
   */
  async getProjectFeeds(
    projectId: string
  ): Promise<Result<KnowledgeFeedData[], MLError>> {
    try {
      const projectFeeds = await this.prisma.projectFeed.findMany({
        where: { projectId },
        include: {
          feed: {
            include: {
              entries: {
                where: { status: 'active' },
                orderBy: { createdAt: 'desc' },
                take: 50,
              },
            },
          },
        },
      });

      const feedData: KnowledgeFeedData[] = projectFeeds.map(pf => ({
        name: pf.feed.name,
        description: (pf.feed.config as any)?.description,
        type: (pf.feed.config as any)?.feedType || 'project_specific',
        source: (pf.feed.config as any)?.sourceType || 'manual',
        content: {
          entries:
            (pf.feed as any).entries?.map((entry: any) => ({
              title: entry.title,
              content: entry.content,
              url: entry.url,
              category: entry.category,
              tags: entry.tags ? JSON.parse(entry.tags) : [],
              priority: entry.priority as 'low' | 'medium' | 'high',
            })) || [],
        },
        metadata: (pf.feed.metadata as Record<string, any>) || {},
        autoUpdate: (pf.feed.config as any)?.autoUpdate || false,
        updateFrequency: (pf.feed.config as any)?.updateFrequency,
      }));

      return {
        success: true,
        data: feedData,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROJECT_FEEDS_ERROR',
          message: 'Failed to get project feeds',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Upload company-specific learning data for agent
   */
  async uploadAgentLearningData(
    agentType: string,
    learningData: AgentLearningData
  ): Promise<Result<string, MLError>> {
    const feedName = `${agentType}_company_knowledge`;

    const feedData: KnowledgeFeedData = {
      name: feedName,
      description: `Company-specific knowledge and patterns for ${agentType}`,
      type: 'agent_specific',
      source: 'manual',
      content: {
        entries: [
          {
            title: 'Company Patterns',
            content: learningData.companyPatterns.join('\n'),
            category: 'patterns',
            priority: 'high',
          },
          {
            title: 'Best Practices',
            content: learningData.bestPractices.join('\n'),
            category: 'best_practices',
            priority: 'high',
          },
          {
            title: 'Available Integrations',
            content: learningData.integrations.join('\n'),
            category: 'integrations',
            priority: 'medium',
          },
          {
            title: 'Common Solutions',
            content: learningData.commonSolutions.join('\n'),
            category: 'solutions',
            priority: 'medium',
          },
        ],
      },
      autoUpdate: false,
    };

    return this.createFeed(feedData);
  }

  /**
   * Create global knowledge feed
   */
  async createGlobalFeed(
    name: string,
    description: string,
    entries: FeedEntry[]
  ): Promise<Result<string, MLError>> {
    const feedData: KnowledgeFeedData = {
      name,
      description,
      type: 'global',
      source: 'manual',
      content: { entries },
      autoUpdate: false,
    };

    return this.createFeed(feedData);
  }

  /**
   * Update feed content
   */
  async updateFeedContent(
    feedId: string,
    entries: FeedEntry[]
  ): Promise<Result<void, MLError>> {
    try {
      // Archive old entries
      await this.prisma.knowledgeEntry.updateMany({
        where: { feedId },
        data: { status: 'archived' },
      });

      // Add new entries
      await this.addEntriesToFeed(feedId, entries);

      // Update feed timestamp
      await this.prisma.knowledgeFeed.update({
        where: { id: feedId },
        data: { lastSync: new Date() },
      });

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FEED_UPDATE_ERROR',
          message: 'Failed to update feed content',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Generate hash for entry deduplication
   */
  private generateEntryHash(entry: FeedEntry): string {
    const content = `${entry.title}|${entry.content}|${entry.url || ''}`;
    return Buffer.from(content).toString('base64').substring(0, 32);
  }

  /**
   * Initialize default knowledge feeds
   */
  async initializeDefaultFeeds(): Promise<Result<void, MLError>> {
    try {
      // Global best practices feed
      await this.createGlobalFeed(
        'Global Development Best Practices',
        'Enterprise-grade development standards and best practices',
        [
          {
            title: 'Code Quality Standards',
            content:
              'Files should not exceed 500 lines. Use modular architecture. No inline styles. Follow SOLID principles.',
            category: 'standards',
            tags: ['code-quality', 'architecture'],
            priority: 'high',
          },
          {
            title: 'Security Best Practices',
            content:
              'Always validate input. Use parameterized queries. Implement proper authentication. Follow OWASP guidelines.',
            category: 'security',
            tags: ['security', 'owasp'],
            priority: 'high',
          },
          {
            title: 'Performance Guidelines',
            content:
              'Optimize database queries. Use caching strategies. Minimize HTTP requests. Implement lazy loading.',
            category: 'performance',
            tags: ['performance', 'optimization'],
            priority: 'medium',
          },
        ]
      );

      // Microsoft-specific feed
      await this.createGlobalFeed(
        'Microsoft Technologies Best Practices',
        'Best practices for Microsoft technology stack',
        [
          {
            title: 'Azure Architecture Patterns',
            content:
              'Use Well-Architected Framework. Implement proper monitoring. Design for scalability and reliability.',
            category: 'azure',
            tags: ['azure', 'architecture'],
            priority: 'high',
          },
          {
            title: '.NET Development Standards',
            content:
              'Follow C# coding conventions. Use dependency injection. Implement proper exception handling.',
            category: 'dotnet',
            tags: ['dotnet', 'csharp'],
            priority: 'high',
          },
          {
            title: 'TypeScript Guidelines',
            content:
              'Use strict mode. Define proper interfaces. Leverage type safety features.',
            category: 'typescript',
            tags: ['typescript', 'javascript'],
            priority: 'medium',
          },
        ]
      );

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DEFAULT_FEEDS_ERROR',
          message: 'Failed to initialize default feeds',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

export default KnowledgeFeedsService;
