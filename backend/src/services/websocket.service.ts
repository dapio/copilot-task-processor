/**
 * WebSocket Service
 * @description Real-time communication service for agent-to-UI communication
 */

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';

export interface WorkflowUpdate {
  workflowId: string;
  projectId: string;
  stepId: string;
  agentId: string;
  status: 'started' | 'in-progress' | 'completed' | 'error';
  message: string;
  progress?: number;
  timestamp: string;
  data?: any;
}

export interface AgentMessage {
  agentId: string;
  projectId: string;
  type: 'status' | 'progress' | 'question' | 'result' | 'error';
  message: string;
  timestamp: string;
  data?: any;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedClients = new Map<string, Socket>();

  /**
   * Initialize WebSocket server
   */
  initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ['http://localhost:3001', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);
      this.connectedClients.set(socket.id, socket);

      // Handle client joining project room
      socket.on('join-project', (projectId: string) => {
        socket.join(`project-${projectId}`);
        console.log(`Client ${socket.id} joined project ${projectId}`);
      });

      // Handle client leaving project room
      socket.on('leave-project', (projectId: string) => {
        socket.leave(`project-${projectId}`);
        console.log(`Client ${socket.id} left project ${projectId}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.connectedClients.delete(socket.id);
      });
    });

    console.log('WebSocket service initialized');
  }

  /**
   * Send workflow update to all clients watching the project
   */
  sendWorkflowUpdate(update: WorkflowUpdate): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`project-${update.projectId}`).emit('workflow-update', update);
    console.log(
      `Sent workflow update for project ${update.projectId}:`,
      update
    );
  }

  /**
   * Send agent message to all clients watching the project
   */
  sendAgentMessage(message: AgentMessage): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`project-${message.projectId}`).emit('agent-message', message);
    console.log(
      `Sent agent message for project ${message.projectId}:`,
      message
    );
  }

  /**
   * Send project status update
   */
  sendProjectStatus(projectId: string, status: any): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.to(`project-${projectId}`).emit('project-status', status);
    console.log(`Sent project status for ${projectId}:`, status);
  }

  /**
   * Broadcast system message to all clients
   */
  broadcastSystemMessage(
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ): void {
    if (!this.io) {
      console.warn('WebSocket server not initialized');
      return;
    }

    this.io.emit('system-message', {
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Check if WebSocket server is initialized
   */
  isInitialized(): boolean {
    return this.io !== null;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
