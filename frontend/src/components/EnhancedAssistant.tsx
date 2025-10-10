/**
 * Enhanced Assistant - Real-time AI Project Assistant
 * Naprawiony asystent bez mocków, z prawdziwymi danymi od agentów
 * Floating panel po prawej stronie
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  FileText,
  Upload,
  Play,
  Users,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  Lightbulb,
  Target,
  Pause,
  Settings,
  Eye,
  StopCircle,
} from 'lucide-react';
import { AgentMessage } from '../hooks/useWebSocket';
import {
  MICROSOFT_SDL_WORKFLOW,
  AGENT_STATUS_CONFIG,
  WorkflowHelpers,
} from '../constants/microsoftWorkflow';
import styles from '../styles/enhanced-assistant.module.css';

// Mapowanie ID agentów na ładne nazwy
const AGENT_NAMES: Record<string, string> = {
  'business-analyst': 'Business Analyst',
  'system-architect': 'System Architect',
  'backend-developer': 'Backend Developer',
  'frontend-developer': 'Frontend Developer',
  'qa-engineer': 'QA Engineer',
  'devops-engineer': 'DevOps Engineer',
  'ui-ux-designer': 'UI/UX Designer',
  'technical-writer': 'Technical Writer',
  'project-manager': 'Project Manager',
};

// Funkcja do mapowania nazwy agenta
const getAgentDisplayName = (agentId: string): string => {
  const mappedName = AGENT_NAMES[agentId];
  if (mappedName) {
    return mappedName;
  }

  // Fallback - sformatuj ID
  return agentId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface EnhancedAssistantProps {
  workflowStep?: any;
  onAssistRequest?: (message: string) => void;
  isLoading?: boolean;
  conversations?: AgentMessage[];
}

export default function EnhancedAssistant({
  workflowStep,
  onAssistRequest,
  isLoading = false,
  conversations = [],
}: EnhancedAssistantProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'guide' | 'chat'>('guide');
  const [chatInput, setChatInput] = useState('');

  // Prawdziwe dane z workflow
  const currentStepName = workflowStep?.status || 'Oczekuje na projekt...';
  const currentStepDescription =
    workflowStep?.message || 'Asystent jest gotowy do pracy';
  const currentPhase = workflowStep?.agentId
    ? `Agent: ${workflowStep.agentId}`
    : '';
  const estimatedDuration = workflowStep?.progress
    ? `${workflowStep.progress}%`
    : '';

  // Prawdziwe wiadomości od agentów
  const realTimeMessages = conversations
    .filter(
      msg =>
        msg.timestamp && new Date(msg.timestamp).getTime() > Date.now() - 300000 // Last 5 minutes
    )
    .slice(-5); // Last 5 messages

  const handleSendMessage = () => {
    if (chatInput.trim() && onAssistRequest) {
      onAssistRequest(chatInput.trim());
      setChatInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <div
        className={styles.minimizedAssistant}
        onClick={() => setIsMinimized(false)}
        title="Otwórz AI Assistant"
      >
        <Lightbulb size={20} />
        <span>AI Assistant</span>
        {realTimeMessages.length > 0 && (
          <div className={styles.notificationBadge}>
            {realTimeMessages.length}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.assistantContainer}>
      {/* Header */}
      <div className={styles.assistantHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.assistantAvatar}>
            <Lightbulb size={20} />
          </div>
          <div className={styles.assistantInfo}>
            <h3>AI Project Assistant</h3>
            <p>
              {conversations.length > 0 ? ' Aktywny' : ' Oczekuje'}
              {currentPhase}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.tabButtons}>
            <button
              className={`${styles.tabButton} ${
                activeTab === 'guide' ? styles.activeTab : ''
              }`}
              onClick={() => setActiveTab('guide')}
            >
              Status
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === 'chat' ? styles.activeTab : ''
              }`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
          </div>
          <button
            className={styles.minimizeButton}
            onClick={() => setIsMinimized(true)}
            title="Zminimalizuj"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Zawartość */}
      <div className={styles.assistantContent}>
        {activeTab === 'guide' && (
          <div className={styles.statusContainer}>
            {/* Aktualny krok */}
            <div className={styles.currentStepInfo}>
              <h4> Aktualny krok</h4>
              <div className={styles.stepCard}>
                <h5>{currentStepName}</h5>
                <p>{currentStepDescription}</p>
                {estimatedDuration && (
                  <div className={styles.stepMeta}>
                    <Clock size={14} />
                    <span>{estimatedDuration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status agentów */}
            {conversations.length > 0 && (
              <div className={styles.agentsStatus}>
                <h4> Status agentów</h4>
                <div className={styles.agentsList}>
                  {Array.from(new Set(conversations.map(msg => msg.agentId)))
                    .slice(0, 3)
                    .map(agentId => {
                      const lastMessage = conversations
                        .filter(msg => msg.agentId === agentId)
                        .slice(-1)[0];

                      return (
                        <div key={agentId} className={styles.agentItem}>
                          <div className={styles.agentIcon}></div>
                          <div className={styles.agentInfo}>
                            <span className={styles.agentName}>
                              {getAgentDisplayName(agentId)}
                            </span>
                            <span className={styles.agentActivity}>
                              {lastMessage?.message.slice(0, 40)}...
                            </span>
                          </div>
                          <div className={styles.agentStatus}></div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Szybkie akcje */}
            <div className={styles.quickActions}>
              <h4> Szybkie akcje</h4>
              <div className={styles.actionButtons}>
                <button
                  className={styles.actionButton}
                  onClick={() =>
                    onAssistRequest?.('Pokaż szczegóły aktualnego kroku')
                  }
                >
                  Szczegóły kroku
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() =>
                    onAssistRequest?.('Sprawdź postęp wszystkich agentów')
                  }
                >
                  Status agentów
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => onAssistRequest?.('Wygeneruj raport postępu')}
                >
                  Raport postępu
                </button>
                <button
                  className={styles.actionButton}
                  onClick={() => onAssistRequest?.('Pomóż z następnym krokiem')}
                >
                  Następny krok
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={styles.chatContainer}>
            {/* Chat messages */}
            <div className={styles.chatMessages}>
              {conversations.length === 0 ? (
                <div className={styles.emptyChat}>
                  <MessageSquare size={32} />
                  <p>Rozpocznij rozmowę z AI Assistant</p>
                  <small>Zadaj pytanie o projekt lub poproś o pomoc</small>
                </div>
              ) : (
                <div className={styles.messagesList}>
                  {conversations.slice(-10).map((msg, index) => (
                    <div key={index} className={styles.message}>
                      <div className={styles.messageHeader}>
                        <span className={styles.messageSender}>
                          {msg.agentId === 'user'
                            ? ' Ty'
                            : ` ${getAgentDisplayName(msg.agentId)}`}
                        </span>
                        <span className={styles.messageTime}>
                          {new Date(msg.timestamp).toLocaleTimeString('pl-PL', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className={styles.messageContent}>{msg.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat input */}
            <div className={styles.chatInput}>
              <input
                type="text"
                placeholder="Napisz wiadomość do AI Assistant..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className={styles.chatInputField}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isLoading}
                className={styles.chatSendBtn}
              >
                {isLoading ? <Clock size={16} /> : <Send size={16} />}
              </button>
            </div>
          </div>
        )}

        {/* Aktywność na żywo - prawdziwe dane */}
        {realTimeMessages.length > 0 && (
          <div className={styles.liveActivity}>
            <h4> Na żywo ({realTimeMessages.length})</h4>
            <div className={styles.activityList}>
              {realTimeMessages.map((msg, index) => (
                <div key={index} className={styles.activityItem}>
                  <div className={styles.activityIcon}></div>
                  <div className={styles.activityContent}>
                    <span className={styles.activityAgent}>
                      {getAgentDisplayName(msg.agentId)}
                    </span>
                    <span className={styles.activityMessage}>
                      {msg.message.slice(0, 60)}...
                    </span>
                    <span className={styles.activityTime}>
                      {new Date(msg.timestamp).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
