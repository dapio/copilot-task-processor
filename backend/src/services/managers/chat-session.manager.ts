/**
 * Chat Session Manager
 * Manages chat sessions and their lifecycle
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  ChatSession,
  IChatSessionManager,
  ChatSessionSettings,
  ChatSessionStats,
} from '../types/chat-integration.types';
import { createServiceError } from '../../utils/result';

export class ChatSessionManager implements IChatSessionManager {
  private prisma: PrismaClient;
  private sessions = new Map<string, ChatSession>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create new chat session
   */
  async createSession(
    contextId: string,
    contextType: 'project' | 'agent'
  ): Promise<ChatSession> {
    const sessionId = randomUUID();
    const now = new Date();

    const defaultSettings: ChatSessionSettings = {
      autoSave: true,
      contextAware: true,
      multiProvider: false,
      workspaceAccess: true,
    };

    const defaultStats: ChatSessionStats = {
      messagesCount: 0,
      toolsUsed: [],
      tokensUsed: 0,
    };

    const session: ChatSession = {
      id: sessionId,
      contextId,
      contextType,
      title: `${
        contextType === 'project' ? 'Projekt' : 'Agent'
      } Chat - ${new Date().toLocaleString('pl-PL')}`,
      participants: [],
      activeProviders: ['copilot'],
      settings: defaultSettings,
      stats: defaultStats,
      metadata: {},
      createdAt: now,
      lastActivityAt: now,
    };

    // Store in memory cache
    this.sessions.set(sessionId, session);

    // Persist to database (optional - for now keep in memory)
    try {
      await this.persistSession(session);
    } catch (error) {
      console.warn('Failed to persist session to database:', error);
    }

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    // Try memory cache first
    const cachedSession = this.sessions.get(sessionId);
    if (cachedSession) {
      return cachedSession;
    }

    // Try database fallback
    try {
      const session = await this.loadSessionFromDatabase(sessionId);
      if (session) {
        this.sessions.set(sessionId, session);
        return session;
      }
    } catch (error) {
      console.warn('Failed to load session from database:', error);
    }

    return null;
  }

  /**
   * Update existing session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<ChatSession>
  ): Promise<ChatSession> {
    const session = await this.getSession(sessionId);
    if (!session) {
      throw createServiceError(
        'SESSION_NOT_FOUND',
        `Session ${sessionId} nie została znaleziona`,
        { sessionId }
      );
    }

    const updatedSession: ChatSession = {
      ...session,
      ...updates,
      lastActivityAt: new Date(),
    };

    // Update memory cache
    this.sessions.set(sessionId, updatedSession);

    // Persist changes
    try {
      await this.persistSession(updatedSession);
    } catch (error) {
      console.warn('Failed to persist session updates:', error);
    }

    return updatedSession;
  }

  /**
   * Delete session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      // Remove from memory cache
      const deleted = this.sessions.delete(sessionId);

      // Remove from database
      try {
        await this.deleteSessionFromDatabase(sessionId);
      } catch (error) {
        console.warn('Failed to delete session from database:', error);
      }

      return deleted;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  /**
   * List sessions for context
   */
  async listSessions(contextId?: string): Promise<ChatSession[]> {
    const sessions = Array.from(this.sessions.values());

    if (contextId) {
      return sessions.filter(s => s.contextId === contextId);
    }

    return sessions.sort(
      (a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime()
    );
  }

  /**
   * Update session stats
   */
  async updateSessionStats(
    sessionId: string,
    statsUpdate: Partial<ChatSessionStats>
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    const updatedStats: ChatSessionStats = {
      ...session.stats,
      ...statsUpdate,
    };

    await this.updateSession(sessionId, { stats: updatedStats });
  }

  /**
   * Add participant to session
   */
  async addParticipant(
    sessionId: string,
    participantId: string
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    if (!session.participants.includes(participantId)) {
      const updatedParticipants = [...session.participants, participantId];
      await this.updateSession(sessionId, {
        participants: updatedParticipants,
      });
    }
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<ChatSessionStats | null> {
    const session = await this.getSession(sessionId);
    return session ? session.stats : null;
  }

  /**
   * Cleanup old sessions
   */
  async cleanupOldSessions(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [sessionId, session] of this.sessions) {
      if (session.lastActivityAt < cutoffTime) {
        await this.deleteSession(sessionId);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Private helpers
   */
  private async persistSession(session: ChatSession): Promise<void> {
    // Implementation depends on database schema
    // For now, just log the action
    console.log(`Persisting session ${session.id} to database`);
  }

  private async loadSessionFromDatabase(
    sessionId: string
  ): Promise<ChatSession | null> {
    // Implementation depends on database schema
    // For now, return null
    console.log(`Loading session ${sessionId} from database`);
    return null;
  }

  private async deleteSessionFromDatabase(sessionId: string): Promise<void> {
    // Implementation depends on database schema
    // For now, just log the action
    console.log(`Deleting session ${sessionId} from database`);
  }
}
