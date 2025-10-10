/**
 * Project Progress Component
 * ThinkCode AI Platform - Project Workflow Progress Tracker with AI Chat
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  Bot,
  ArrowRight,
} from 'lucide-react';
import styles from '../styles/project-progress.module.css';
import { ProjectWorkflow, WorkflowStep, ChatMessage } from '../types/workflow';
import { agentApiService } from '../services/agentApiService';

interface ProjectProgressProps {
  projectId: string;
}

export default function ProjectProgress({ projectId }: ProjectProgressProps) {
  const [workflow, setWorkflow] = useState<ProjectWorkflow | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjectWorkflow();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const loadProjectWorkflow = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await agentApiService.getProjectWorkflow(projectId);
      if (response.success) {
        setWorkflow(response.data);
      } else {
        setError(response.error || 'Błąd pobierania workflow');
      }
    } catch {
      setError('Błąd połączenia z API workflow');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = newMessage;
    setNewMessage('');
    setChatLoading(true);

    try {
      const response = await agentApiService.sendMessage(
        projectId,
        messageToSend
      );

      if (response.success && response.data) {
        const assistantMessage: ChatMessage = {
          ...response.data,
          timestamp: new Date(response.data.timestamp),
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            'Przepraszam, wystąpił błąd podczas przetwarzania wiadomości.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className={styles.statusCompleted} size={20} />;
      case 'in_progress':
        return <Clock className={styles.statusInProgress} size={20} />;
      case 'failed':
        return <AlertCircle className={styles.statusFailed} size={20} />;
      case 'requires_approval':
        return <AlertCircle className={styles.statusApproval} size={20} />;
      default:
        return <Circle className={styles.statusPending} size={20} />;
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTime = (date?: Date | string) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !workflow) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>Ładowanie workflow...</div>
      </div>
    );
  }

  return (
    <>
      {/* Workflow Panel - Left side of sidebar */}
      <div className={styles.workflowSection}>
        <div className={styles.header}>
          <h2 className={styles.workflowTitle}>{workflow.name}</h2>
          <p className={styles.workflowDescription}>{workflow.description}</p>

          <div className={styles.workflowStats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Postęp:</span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  data-progress={workflow.progress}
                />
              </div>
              <span className={styles.statValue}>{workflow.progress}%</span>
            </div>

            <div className={styles.stat}>
              <span className={styles.statLabel}>Aktualny krok:</span>
              <span className={styles.statValue}>
                {workflow.currentStep}/{workflow.totalSteps}
              </span>
            </div>

            <div className={styles.stat}>
              <span className={styles.statLabel}>Czas zakończenia:</span>
              <span className={styles.statValue}>
                {formatTime(workflow.estimatedCompletion)}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.workflowPanel}>
          <h3 className={styles.sectionTitle}>Kroki Workflow</h3>

          <div className={styles.stepsContainer}>
            {workflow.steps.map((step, index) => (
              <div
                key={step.id}
                className={`${styles.stepCard} ${
                  index === workflow.currentStep - 1 ? styles.currentStep : ''
                }`}
              >
                <div className={styles.stepHeader}>
                  <div className={styles.stepIcon}>
                    {getStatusIcon(step.status)}
                  </div>

                  <div className={styles.stepInfo}>
                    <span className={styles.stepName}>
                      #{step.order} {step.name}
                    </span>
                    {step.status === 'in_progress' && (
                      <ArrowRight
                        className={styles.activeIndicator}
                        size={16}
                      />
                    )}
                  </div>

                  <div className={styles.stepMeta}>
                    <span className={styles.stepStatus}>{step.status}</span>
                  </div>
                </div>

                <div className={styles.stepDetails}>
                  <div className={styles.stepDetailItem}>
                    <span className={styles.detailLabel}>Agent:</span>
                    <span className={styles.detailValue}>
                      {step.agentResponsible}
                    </span>
                  </div>

                  <div className={styles.stepDetailItem}>
                    <span className={styles.detailLabel}>Czas:</span>
                    <span className={styles.detailValue}>
                      {step.actualDuration
                        ? formatDuration(step.actualDuration)
                        : formatDuration(step.estimatedDuration)}
                    </span>
                  </div>

                  {step.approvalRequired && (
                    <div className={styles.approvalBadge}>
                      Wymaga zatwierdzenia
                    </div>
                  )}
                </div>

                {index < workflow.steps.length - 1 && (
                  <ArrowRight className={styles.stepArrow} size={16} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Panel - Right side of sidebar */}
      <div className={styles.chatSection}>
        <h3 className={styles.sectionTitle}>
          <MessageSquare size={20} />
          Chat AI Assistant
        </h3>

        <div className={styles.chatContainer}>
          <div className={styles.chatMessages}>
            {chatMessages.map(message => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.role]}`}
              >
                <div className={styles.messageIcon}>
                  {message.role === 'user' ? (
                    <User size={16} />
                  ) : (
                    <Bot size={16} />
                  )}
                </div>

                <div className={styles.messageContent}>
                  <div className={styles.messageText}>{message.content}</div>
                  <div className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                    {message.stepContext && (
                      <span className={styles.stepContext}>
                        • Krok:{' '}
                        {
                          workflow.steps.find(s => s.id === message.stepContext)
                            ?.name
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className={`${styles.message} ${styles.assistant}`}>
                <div className={styles.messageIcon}>
                  <Bot size={16} />
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          <div className={styles.chatInput}>
            <textarea
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Zadaj pytanie dotyczące workflow lub aktualnego kroku..."
              className={styles.messageInput}
              rows={2}
              disabled={chatLoading}
            />

            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || chatLoading}
              className={styles.sendButton}
              aria-label="Wyślij wiadomość"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
