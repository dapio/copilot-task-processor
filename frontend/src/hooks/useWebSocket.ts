/**
 * WebSocket Hook for Real-time Communication
 * @description Connects to backend WebSocket server for live updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

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

export interface UseWebSocketOptions {
  serverUrl?: string;
  projectId?: string;
  autoConnect?: boolean;
}

export interface UseWebSocketResult {
  socket: Socket | null;
  isConnected: boolean;
  workflowUpdates: WorkflowUpdate[];
  agentMessages: AgentMessage[];
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
  clearMessages: () => void;
  lastWorkflowUpdate: WorkflowUpdate | null;
  lastAgentMessage: AgentMessage | null;
}

export const useWebSocket = (
  options: UseWebSocketOptions = {}
): UseWebSocketResult => {
  const {
    serverUrl = 'http://localhost:3006',
    projectId,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [workflowUpdates, setWorkflowUpdates] = useState<WorkflowUpdate[]>([]);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [lastWorkflowUpdate, setLastWorkflowUpdate] =
    useState<WorkflowUpdate | null>(null);
  const [lastAgentMessage, setLastAgentMessage] = useState<AgentMessage | null>(
    null
  );

  // Initialize socket connection
  useEffect(() => {
    if (!autoConnect) return;

    console.log(`🔌 Connecting to WebSocket server: ${serverUrl}`);

    const socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setIsConnected(true);

      // Auto-join project if provided
      if (projectId) {
        socket.emit('join-project', projectId);
        console.log(`🚪 Joined project room: ${projectId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
      setIsConnected(false);
    });

    socket.on('connect_error', error => {
      console.error('🚨 WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Workflow updates
    socket.on('workflow-update', (update: WorkflowUpdate) => {
      console.log('📊 Received workflow update:', update);
      setWorkflowUpdates(prev => [...prev, update]);
      setLastWorkflowUpdate(update);
    });

    // Agent messages
    socket.on('agent-message', (message: AgentMessage) => {
      console.log('🤖 Received agent message:', message);
      setAgentMessages(prev => [...prev, message]);
      setLastAgentMessage(message);
    });

    // Project status updates
    socket.on('project-status', status => {
      console.log('📈 Received project status:', status);
    });

    // System messages
    socket.on('system-message', message => {
      console.log('🔔 System message:', message);
    });

    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      socket.disconnect();
    };
  }, [serverUrl, autoConnect, projectId]);

  // Join project room
  const joinProject = useCallback(
    (projectId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('join-project', projectId);
        console.log(`🚪 Joined project room: ${projectId}`);
      }
    },
    [isConnected]
  );

  // Leave project room
  const leaveProject = useCallback(
    (projectId: string) => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('leave-project', projectId);
        console.log(`🚪 Left project room: ${projectId}`);
      }
    },
    [isConnected]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setWorkflowUpdates([]);
    setAgentMessages([]);
    setLastWorkflowUpdate(null);
    setLastAgentMessage(null);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    workflowUpdates,
    agentMessages,
    joinProject,
    leaveProject,
    clearMessages,
    lastWorkflowUpdate,
    lastAgentMessage,
  };
};
