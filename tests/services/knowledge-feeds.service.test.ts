/**
 * Knowledge Feeds Service Tests
 * Comprehensive unit tests for knowledge feed management
 */

import { PrismaClient } from '@prisma/client';
import {
  KnowledgeFeedsService,
  type KnowledgeFeedData,
  type FeedEntry,
  type AgentLearningData,
} from '../../backend/src/services/knowledge-feeds.service';

// Mock Prisma client
const mockPrismaClient = {
  knowledgeFeed: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  knowledgeEntry: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  agentFeed: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
  projectFeed: {
    upsert: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('KnowledgeFeedsService', () => {
  let service: KnowledgeFeedsService;

  beforeEach(() => {
    service = new KnowledgeFeedsService(mockPrismaClient);
    jest.clearAllMocks();
  });

  describe('createFeed', () => {
    it('should create a new knowledge feed successfully', async () => {
      // Arrange
      const mockFeedId = 'feed-123';
      const feedData: KnowledgeFeedData = {
        name: 'Test Feed',
        description: 'Test description',
        type: 'global',
        source: 'manual',
        content: {
          entries: [
            {
              title: 'Test Entry',
              content: 'Test content',
              priority: 'high',
            },
          ],
        },
        autoUpdate: false,
      };

      (mockPrismaClient.knowledgeFeed.create as jest.Mock).mockResolvedValue({
        id: mockFeedId,
        name: feedData.name,
      });

      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaClient.knowledgeEntry.create as jest.Mock).mockResolvedValue({
        id: 'entry-123',
      });

      // Act
      const result = await service.createFeed(feedData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockFeedId);
      expect(mockPrismaClient.knowledgeFeed.create).toHaveBeenCalledWith({
        data: {
          name: feedData.name,
          type: feedData.source,
          url: null,
          config: expect.any(Object),
          metadata: undefined,
          status: 'active',
        },
      });
    });

    it('should handle feed creation errors', async () => {
      // Arrange
      const feedData: KnowledgeFeedData = {
        name: 'Test Feed',
        type: 'global',
        source: 'manual',
        content: {},
        autoUpdate: false,
      };

      const error = new Error('Database connection failed');
      (mockPrismaClient.knowledgeFeed.create as jest.Mock).mockRejectedValue(
        error
      );

      // Act
      const result = await service.createFeed(feedData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FEED_CREATE_ERROR');
      expect(result.error?.message).toBe('Failed to create knowledge feed');
    });
  });

  describe('addEntriesToFeed', () => {
    it('should add new entries to feed without duplicates', async () => {
      // Arrange
      const feedId = 'feed-123';
      const entries: FeedEntry[] = [
        {
          title: 'Entry 1',
          content: 'Content 1',
          priority: 'high',
        },
        {
          title: 'Entry 2',
          content: 'Content 2',
          priority: 'medium',
        },
      ];

      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaClient.knowledgeEntry.create as jest.Mock).mockResolvedValue(
        {}
      );

      // Act
      const result = await service.addEntriesToFeed(feedId, entries);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(2);
      expect(mockPrismaClient.knowledgeEntry.create).toHaveBeenCalledTimes(2);
    });

    it('should skip duplicate entries', async () => {
      // Arrange
      const feedId = 'feed-123';
      const entries: FeedEntry[] = [
        {
          title: 'Duplicate Entry',
          content: 'Existing content',
          priority: 'high',
        },
      ];

      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue({
        id: 'existing-entry',
      });

      // Act
      const result = await service.addEntriesToFeed(feedId, entries);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBe(0);
      expect(mockPrismaClient.knowledgeEntry.create).not.toHaveBeenCalled();
    });
  });

  describe('assignFeedToAgent', () => {
    it('should assign feed to agent successfully', async () => {
      // Arrange
      const feedId = 'feed-123';
      const agentId = 'agent-456';

      (mockPrismaClient.agentFeed.upsert as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.assignFeedToAgent(feedId, agentId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrismaClient.agentFeed.upsert).toHaveBeenCalledWith({
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
    });
  });

  describe('getAgentFeeds', () => {
    it('should return agent feeds with global feeds included', async () => {
      // Arrange
      const agentId = 'agent-123';
      const mockAgentFeeds = [
        {
          feed: {
            id: 'feed-1',
            name: 'Agent Feed 1',
            config: { description: 'Agent specific feed' },
            entries: [],
          },
        },
      ];
      const mockGlobalFeeds = [
        {
          id: 'feed-2',
          name: 'Global Feed',
          config: { description: 'Global feed' },
          entries: [],
        },
      ];

      (mockPrismaClient.agentFeed.findMany as jest.Mock).mockResolvedValue(
        mockAgentFeeds
      );
      (mockPrismaClient.knowledgeFeed.findMany as jest.Mock).mockResolvedValue(
        mockGlobalFeeds
      );

      // Act
      const result = await service.getAgentFeeds(agentId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].name).toBe('Agent Feed 1');
      expect(result.data![1].name).toBe('Global Feed');
    });
  });

  describe('uploadAgentLearningData', () => {
    it('should create agent learning feed with provided data', async () => {
      // Arrange
      const agentType = 'CodeAgent';
      const learningData: AgentLearningData = {
        agentType,
        companyPatterns: ['Pattern 1', 'Pattern 2'],
        bestPractices: ['Practice 1', 'Practice 2'],
        integrations: ['Integration 1'],
        commonSolutions: ['Solution 1'],
      };

      (mockPrismaClient.knowledgeFeed.create as jest.Mock).mockResolvedValue({
        id: 'learning-feed-123',
      });

      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaClient.knowledgeEntry.create as jest.Mock).mockResolvedValue(
        {}
      );

      // Act
      const result = await service.uploadAgentLearningData(
        agentType,
        learningData
      );

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrismaClient.knowledgeFeed.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: `${agentType}_company_knowledge`,
        }),
      });
    });
  });

  describe('initializeDefaultFeeds', () => {
    it('should initialize default knowledge feeds', async () => {
      // Arrange
      (mockPrismaClient.knowledgeFeed.create as jest.Mock).mockResolvedValue({
        id: 'default-feed',
      });
      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaClient.knowledgeEntry.create as jest.Mock).mockResolvedValue(
        {}
      );

      // Act
      const result = await service.initializeDefaultFeeds();

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrismaClient.knowledgeFeed.create).toHaveBeenCalledTimes(2); // Global and Microsoft feeds
    });
  });

  describe('updateFeedContent', () => {
    it('should archive old entries and add new ones', async () => {
      // Arrange
      const feedId = 'feed-123';
      const entries: FeedEntry[] = [
        {
          title: 'New Entry',
          content: 'New content',
          priority: 'high',
        },
      ];

      (
        mockPrismaClient.knowledgeEntry.updateMany as jest.Mock
      ).mockResolvedValue({});
      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaClient.knowledgeEntry.create as jest.Mock).mockResolvedValue(
        {}
      );
      (mockPrismaClient.knowledgeFeed.update as jest.Mock).mockResolvedValue(
        {}
      );

      // Act
      const result = await service.updateFeedContent(feedId, entries);

      // Assert
      expect(result.success).toBe(true);
      expect(mockPrismaClient.knowledgeEntry.updateMany).toHaveBeenCalledWith({
        where: { feedId },
        data: { status: 'archived' },
      });
      expect(mockPrismaClient.knowledgeFeed.update).toHaveBeenCalledWith({
        where: { id: feedId },
        data: { lastSync: expect.any(Date) },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection lost');
      (mockPrismaClient.agentFeed.findMany as jest.Mock).mockRejectedValue(
        error
      );

      // Act
      const result = await service.getAgentFeeds('agent-123');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('AGENT_FEEDS_ERROR');
    });

    it('should handle validation errors', async () => {
      // Arrange
      const invalidFeedData = {
        name: '', // Invalid empty name
        type: 'invalid_type',
        source: 'unknown_source',
        content: null,
        autoUpdate: false,
      } as unknown as KnowledgeFeedData;

      (mockPrismaClient.knowledgeFeed.create as jest.Mock).mockRejectedValue(
        new Error('Validation failed')
      );

      // Act
      const result = await service.createFeed(invalidFeedData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('FEED_CREATE_ERROR');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of feed entries efficiently', async () => {
      // Arrange
      const feedId = 'performance-feed';
      const largeEntrySet: FeedEntry[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          title: `Entry ${i}`,
          content: `Content for entry ${i}`,
          priority: 'medium' as const,
        })
      );

      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaClient.knowledgeEntry.create as jest.Mock).mockResolvedValue(
        {}
      );

      const startTime = Date.now();

      // Act
      const result = await service.addEntriesToFeed(feedId, largeEntrySet);

      // Assert
      const executionTime = Date.now() - startTime;
      expect(result.success).toBe(true);
      expect(result.data).toBe(1000);
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete feed lifecycle', async () => {
      // Arrange - Create feed
      const feedData: KnowledgeFeedData = {
        name: 'Integration Test Feed',
        description: 'Complete lifecycle test',
        type: 'global',
        source: 'manual',
        content: {
          entries: [
            {
              title: 'Initial Entry',
              content: 'Initial content',
              priority: 'high',
            },
          ],
        },
        autoUpdate: false,
      };

      (mockPrismaClient.knowledgeFeed.create as jest.Mock).mockResolvedValue({
        id: 'integration-feed',
      });
      (
        mockPrismaClient.knowledgeEntry.findUnique as jest.Mock
      ).mockResolvedValue(null);
      (mockPrismaClient.knowledgeEntry.create as jest.Mock).mockResolvedValue(
        {}
      );
      (
        mockPrismaClient.knowledgeEntry.updateMany as jest.Mock
      ).mockResolvedValue({});
      (mockPrismaClient.knowledgeFeed.update as jest.Mock).mockResolvedValue(
        {}
      );
      (mockPrismaClient.agentFeed.upsert as jest.Mock).mockResolvedValue({});

      // Act - Create, assign, and update
      const createResult = await service.createFeed(feedData);
      const assignResult = await service.assignFeedToAgent(
        'integration-feed',
        'agent-123'
      );
      const updateResult = await service.updateFeedContent('integration-feed', [
        {
          title: 'Updated Entry',
          content: 'Updated content',
          priority: 'medium',
        },
      ]);

      // Assert
      expect(createResult.success).toBe(true);
      expect(assignResult.success).toBe(true);
      expect(updateResult.success).toBe(true);
    });
  });
});
