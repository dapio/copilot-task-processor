/**
 * 🧠 Knowledge Feed API Routes
 * Endpoints for managing knowledge feeds for AI agents
 */

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import KnowledgeFeedService from '../services/knowledge-feed.service';

const router = Router();
const prisma = new PrismaClient();
const knowledgeService = new KnowledgeFeedService(prisma);

// ==============================================
// FEED MANAGEMENT ROUTES
// ==============================================

/**
 * GET /api/knowledge/feeds
 * Pobiera wszystkie feedy z możliwością filtrowania
 */
router.get('/feeds', async (req: Request, res: Response) => {
  try {
    const { type, department, agentId, isActive } = req.query;

    const filters: any = {};
    if (type) filters.type = type as string;
    if (department) filters.department = department as string;
    if (agentId) filters.agentId = agentId as string;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    const result = await knowledgeService.getFeeds(filters);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in GET /feeds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feeds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/knowledge/feeds/:feedId
 * Pobiera szczegóły konkretnego feeda
 */
router.get('/feeds/:feedId', async (req: Request, res: Response) => {
  try {
    const { feedId } = req.params;
    const { agentId } = req.query;

    const result = await knowledgeService.getFeedDetails(
      feedId,
      agentId as string
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      const status = result.error === 'Access denied to this feed' ? 403 : 404;
      res.status(status).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in GET /feeds/:feedId:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/knowledge/feeds
 * Tworzy nowy feed wiedzy
 */
router.post('/feeds', async (req: Request, res: Response) => {
  try {
    const feedData = req.body;
    const { createdBy } = req.headers;

    const result = await knowledgeService.createFeed(
      feedData,
      createdBy as string
    );

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Feed created successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /feeds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create feed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==============================================
// CONTENT MANAGEMENT ROUTES
// ==============================================

/**
 * POST /api/knowledge/documents
 * Dodaje nowy dokument do feeda
 */
router.post('/documents', async (req: Request, res: Response) => {
  try {
    const result = await knowledgeService.addDocument(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Document added successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /documents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add document',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/knowledge/code-snippets
 * Dodaje nowy fragment kodu do feeda
 */
router.post('/code-snippets', async (req: Request, res: Response) => {
  try {
    const result = await knowledgeService.addCodeSnippet(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Code snippet added successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /code-snippets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add code snippet',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/knowledge/best-practices
 * Dodaje nową best practice do feeda
 */
router.post('/best-practices', async (req: Request, res: Response) => {
  try {
    const result = await knowledgeService.addBestPractice(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Best practice added successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /best-practices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add best practice',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==============================================
// SEARCH & RECOMMENDATIONS ROUTES
// ==============================================

/**
 * POST /api/knowledge/search
 * Wyszukuje w feedach wiedzy
 */
router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, agentId, filters } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query must be at least 2 characters long',
      });
    }

    const result = await knowledgeService.searchKnowledge(
      query.trim(),
      agentId,
      filters
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /search:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/knowledge/recommendations/:agentId
 * Pobiera rekomendacje dla agenta
 */
router.get('/recommendations/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { context } = req.query;

    const result = await knowledgeService.getRecommendations(
      agentId,
      context as string
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in GET /recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==============================================
// LEARNING ANALYTICS ROUTES
// ==============================================

/**
 * POST /api/knowledge/learning/log
 * Zapisuje historię uczenia się agenta
 */
router.post('/learning/log', async (req: Request, res: Response) => {
  try {
    const result = await knowledgeService.logLearningHistory(req.body);

    if (result.success) {
      res.status(201).json({
        success: true,
        data: result.data,
        message: 'Learning history logged successfully',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /learning/log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log learning history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/knowledge/learning/stats/:agentId
 * Pobiera statystyki uczenia się agenta
 */
router.get('/learning/stats/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { timeframe } = req.query;

    const result = await knowledgeService.getAgentLearningStats(
      agentId,
      timeframe as 'day' | 'week' | 'month'
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in GET /learning/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get learning stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ==============================================
// ADMIN ROUTES
// ==============================================

/**
 * POST /api/knowledge/admin/initialize
 * Inicjalizuje domyślne feedy wiedzy
 */
router.post('/admin/initialize', async (req: Request, res: Response) => {
  try {
    const result = await knowledgeService.initializeDefaultFeeds();

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error in POST /admin/initialize:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/knowledge/admin/stats
 * Pobiera globalne statystyki systemu feedów
 */
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    // Podstawowe statystyki
    const [
      feedCount,
      documentCount,
      snippetCount,
      practiceCount,
      toolCount,
      activeAgentsWithFeeds,
      recentActivity,
    ] = await Promise.all([
      prisma.knowledgeFeed.count({ where: { isActive: true } }),
      prisma.knowledgeDocument.count({ where: { isActive: true } }),
      prisma.codeSnippet.count({ where: { isActive: true } }),
      prisma.knowledgeBestPractice.count({ where: { isActive: true } }),
      prisma.toolDefinition.count({ where: { isActive: true } }),
      prisma.agentFeedAccess.groupBy({
        by: ['agentId'],
        where: { isActive: true },
        _count: true,
      }),
      prisma.feedLearningHistory.count({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ]);

    // Statystyki użycia feedów
    const feedUsageStats = await prisma.feedLearningHistory.groupBy({
      by: ['feedId'],
      _count: { feedId: true },
      orderBy: { _count: { feedId: 'desc' } },
      take: 10,
    });

    // Najczęściej używane typy akcji
    const actionTypeStats = await prisma.feedLearningHistory.groupBy({
      by: ['actionType'],
      _count: { actionType: true },
      where: {
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalFeeds: feedCount,
          totalDocuments: documentCount,
          totalCodeSnippets: snippetCount,
          totalBestPractices: practiceCount,
          totalTools: toolCount,
          agentsWithAccess: activeAgentsWithFeeds.length,
          recentActivity: recentActivity,
        },
        usage: {
          topFeeds: feedUsageStats,
          actionBreakdown: actionTypeStats.reduce((acc: any, stat: any) => {
            acc[stat.actionType] = stat._count.actionType;
            return acc;
          }, {}),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /admin/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get admin stats',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
