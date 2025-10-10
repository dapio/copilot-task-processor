/**
 * Enhanced Chat Dashboard for Agent Communication
 * @description Real-time chat interface with AI agents
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageSquare, Bot, Clock, Send, FileText, Zap } from 'lucide-react';
import styles from '../styles/enhanced-chat-dashboard.module.css';

interface AgentMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  agentType?: string;
  agentName?: string;
  content: string;
  timestamp: Date;
  metadata?: {
    taskId?: string;
    workflowId?: string;
    documentIds?: string[];
    actionType?: 'analysis' | 'suggestion' | 'question' | 'result';
  };
}

interface ChatContext {
  sessionId: string;
  activeAgents: string[];
  currentTask?: string;
}

interface EnhancedChatDashboardProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedChatDashboard: React.FC<EnhancedChatDashboardProps> = ({
  projectId,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.data.messages || []);
        setChatContext(data.data.context);
      } else {
        console.error('Failed to fetch chat history:', data.error);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const sendMessage = async (
    message: string,
    agentType?: string,
    agentName?: string
  ) => {
    if (!message.trim()) return;

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.trim(),
          agentType,
          agentName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Refresh chat history to get the new message
        await fetchChatHistory();
        setNewMessage('');
      } else {
        console.error('Failed to send message:', data.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendMessage = () => {
    sendMessage(newMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filterMessagesByAgent = (messages: AgentMessage[]) => {
    if (selectedAgent === 'all') return messages;
    return messages.filter(
      msg =>
        msg.agentType === selectedAgent ||
        (selectedAgent === 'system' && msg.role === 'system')
    );
  };

  const getAgentIcon = (role: string, agentType?: string) => {
    if (role === 'system') return '🤖';
    if (role === 'user') return '👤';

    switch (agentType) {
      case 'business-analyst':
        return '📋';
      case 'system-architect':
        return '🏗️';
      case 'frontend-developer':
        return '🎨';
      case 'backend-developer':
        return '⚙️';
      case 'qa-engineer':
        return '🧪';
      default:
        return '🤖';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();

      // Set up polling for real-time updates
      const interval = setInterval(fetchChatHistory, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, fetchChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredMessages = filterMessagesByAgent(messages);
  const uniqueAgents = Array.from(
    new Set(messages.map(m => m.agentType).filter(Boolean))
  );

  if (!isOpen) return null;

  return (
    <div className={styles.chatOverlay}>
      <div className={styles.chatContainer}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <div className={styles.headerLeft}>
            <MessageSquare size={20} />
            <h3>Chat Projektu</h3>
            {chatContext && (
              <span className={styles.sessionInfo}>
                Aktywni agenci: {chatContext.activeAgents.length}
              </span>
            )}
          </div>
          <div className={styles.headerRight}>
            {/* Agent Filter */}
            <select
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              className={styles.agentFilter}
              title="Filtruj wiadomości według agenta"
              aria-label="Wybierz agenta do filtrowania"
            >
              <option value="all">Wszyscy</option>
              <option value="system">System</option>
              {uniqueAgents.map(agent => (
                <option key={agent} value={agent}>
                  {agent?.replace('-', ' ')}
                </option>
              ))}
            </select>

            <button onClick={onClose} className={styles.closeButton}>
              ✕
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className={styles.messagesArea}>
          {loading && (
            <div className={styles.loadingState}>
              <Bot className={styles.loadingIcon} />
              <p>Ładowanie historii czatu...</p>
            </div>
          )}

          {!loading && filteredMessages.length === 0 && (
            <div className={styles.emptyState}>
              <MessageSquare size={48} />
              <h4>Brak wiadomości</h4>
              <p>
                {selectedAgent === 'all'
                  ? 'Chat zostanie automatycznie zainicjowany po przesłaniu dokumentów.'
                  : `Brak wiadomości od: ${selectedAgent.replace('-', ' ')}`}
              </p>
            </div>
          )}

          {filteredMessages.map(message => (
            <div
              key={message.id}
              className={`${styles.message} ${styles[message.role]}`}
            >
              <div className={styles.messageHeader}>
                <span className={styles.messageIcon}>
                  {getAgentIcon(message.role, message.agentType)}
                </span>
                <span className={styles.messageAuthor}>
                  {message.agentName || message.role}
                </span>
                <span className={styles.messageTime}>
                  {formatTimestamp(message.timestamp)}
                </span>
                {message.metadata?.actionType && (
                  <span
                    className={`${styles.actionBadge} ${
                      styles[message.metadata.actionType]
                    }`}
                  >
                    {message.metadata.actionType}
                  </span>
                )}
              </div>
              <div
                className={styles.messageContent}
                dangerouslySetInnerHTML={{
                  __html: message.content
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                }}
              />
              {message.metadata?.documentIds && (
                <div className={styles.messageMetadata}>
                  <FileText size={14} />
                  <span>Dokumenty: {message.metadata.documentIds.length}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className={styles.messageInput}>
          <div className={styles.inputContainer}>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Napisz wiadomość do agentów..."
              className={styles.textInput}
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className={styles.sendButton}
              title="Wyślij wiadomość (Enter)"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        {chatContext && (
          <div className={styles.statusBar}>
            <div className={styles.statusLeft}>
              <Zap size={14} />
              <span>Sesja: {chatContext.sessionId.substring(0, 8)}...</span>
            </div>
            <div className={styles.statusRight}>
              {chatContext.currentTask && (
                <>
                  <Clock size={14} />
                  <span>Zadanie: {chatContext.currentTask}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedChatDashboard;
