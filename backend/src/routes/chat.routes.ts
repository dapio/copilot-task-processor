/**
 * Chat System API Routes
 *
 * API endpoints for project chat and collaboration features
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createChannelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['project', 'agent', 'system', 'direct']),
  description: z.string().optional(),
  projectId: z.string().optional(),
  agentIds: z.string().optional(),
  userIds: z.string().optional(),
  isActive: z.boolean().default(true),
});

const sendMessageSchema = z.object({
  content: z.string().min(1),
  channelId: z.string(),
  senderId: z.string(),
  senderType: z.enum(['user', 'agent', 'system']).default('user'),
  messageType: z
    .enum(['text', 'file', 'image', 'command', 'system'])
    .default('text'),
  metadata: z.object({}).optional(),
  parentId: z.string().optional(),
});

const updateChannelSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  agentIds: z.string().optional(),
  userIds: z.string().optional(),
});

/**
 * GET /api/chat/channels
 * Get all chat channels accessible to user
 */
router.get('/channels', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const channels = await prisma.chatChannel.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json(channels);
  } catch (error: any) {
    console.error('Failed to fetch chat channels:', error);
    res.status(500).json({
      error: 'Failed to fetch chat channels',
      details: error.message,
    });
  }
});

/**
 * POST /api/chat/channels
 * Create a new chat channel
 */
router.post('/channels', async (req: Request, res: Response) => {
  try {
    const validatedData = createChannelSchema.parse(req.body);

    const channel = await prisma.chatChannel.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        description: validatedData.description,
        projectId: validatedData.projectId,
        agentIds: validatedData.agentIds,
        userIds: validatedData.userIds,
        isActive: validatedData.isActive,
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json(channel);
  } catch (error: any) {
    console.error('Failed to create chat channel:', error);
    res.status(500).json({
      error: 'Failed to create chat channel',
      details: error.message,
    });
  }
});

/**
 * GET /api/chat/channels/:id/messages
 * Get messages from a specific channel
 */
router.get('/channels/:id/messages', async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const before = req.query.before as string; // cursor for pagination

    const where: any = { channelId };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        channel: {
          select: { name: true, type: true },
        },
      },
    });

    res.json({
      messages: messages.reverse(), // Return in chronological order
      hasMore: messages.length === limit,
      cursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null,
    });
  } catch (error: any) {
    console.error('Failed to fetch channel messages:', error);
    res.status(500).json({
      error: 'Failed to fetch channel messages',
      details: error.message,
    });
  }
});

/**
 * POST /api/chat/messages
 * Send a new message to a channel
 */
router.post('/messages', async (req: Request, res: Response) => {
  try {
    const validatedData = sendMessageSchema.parse(req.body);

    // Check if channel exists
    const channel = await prisma.chatChannel.findUnique({
      where: { id: validatedData.channelId },
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content: validatedData.content,
        channelId: validatedData.channelId,
        senderId: validatedData.senderId,
        senderType: validatedData.senderType,
        messageType: validatedData.messageType,
        metadata: validatedData.metadata || {},
        parentId: validatedData.parentId,
      },
      include: {
        channel: {
          select: { name: true, type: true },
        },
      },
    });

    // Update channel's last activity
    await prisma.chatChannel.update({
      where: { id: validatedData.channelId },
      data: { updatedAt: new Date() },
    });

    return res.json(message);
  } catch (error: any) {
    console.error('Failed to send message:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      details: error.message,
    });
  }
});

/**
 * GET /api/chat/channels/:id
 * Get channel details
 */
router.get('/channels/:id', async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id;

    const channel = await prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        _count: {
          select: { messages: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!channel) {
      return res.status(404).json({
        error: 'Channel not found',
      });
    }

    return res.json(channel);
  } catch (error: any) {
    console.error('Failed to fetch channel:', error);
    return res.status(500).json({
      error: 'Failed to fetch channel',
      details: error.message,
    });
  }
});

/**
 * PUT /api/chat/channels/:id
 * Update channel details
 */
router.put('/channels/:id', async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id;
    const updateData = updateChannelSchema.parse(req.body);

    const channel = await prisma.chatChannel.update({
      where: { id: channelId },
      data: updateData,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    res.json(channel);
  } catch (error: any) {
    console.error('Failed to update channel:', error);
    res.status(500).json({
      error: 'Failed to update channel',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/chat/channels/:id
 * Delete a chat channel
 */
router.delete('/channels/:id', async (req: Request, res: Response) => {
  try {
    const channelId = req.params.id;

    // Delete all messages first (cascade should handle this, but being explicit)
    await prisma.chatMessage.deleteMany({
      where: { channelId },
    });

    await prisma.chatChannel.delete({
      where: { id: channelId },
    });

    res.json({
      success: true,
      message: 'Channel deleted successfully',
    });
  } catch (error: any) {
    console.error('Failed to delete channel:', error);
    res.status(500).json({
      error: 'Failed to delete channel',
      details: error.message,
    });
  }
});

/**
 * GET /api/chat/search
 * Search messages across channels
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const channelId = req.query.channelId as string;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long',
      });
    }

    const where: any = {
      content: {
        contains: query.trim(),
      },
    };

    if (channelId) {
      where.channelId = channelId;
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        channel: {
          select: { name: true, type: true },
        },
      },
    });

    return res.json({
      query,
      results: messages,
      totalFound: messages.length,
    });
  } catch (error: any) {
    console.error('Failed to search messages:', error);
    return res.status(500).json({
      error: 'Failed to search messages',
      details: error.message,
    });
  }
});

/**
 * GET /api/chat/stats
 * Get chat system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string;

    const where = projectId ? { projectId } : {};

    const [channelsCount, messagesCount, recentChannels] = await Promise.all([
      prisma.chatChannel.count({ where }),
      prisma.chatMessage.count({
        where: projectId
          ? {
              channel: { projectId },
            }
          : {},
      }),
      prisma.chatChannel.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      }),
    ]);

    res.json({
      channels: {
        total: channelsCount,
        active: recentChannels.length,
      },
      messages: {
        total: messagesCount,
      },
      recentActivity: recentChannels,
    });
  } catch (error: any) {
    console.error('Failed to fetch chat stats:', error);
    res.status(500).json({
      error: 'Failed to fetch chat stats',
      details: error.message,
    });
  }
});

export default router;
