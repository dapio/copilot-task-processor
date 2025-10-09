/**
 * AI Project Assistant - Inteligentny przewodnik użytkownika
 * Informuje użytkownika o aktualnym stanie projektu i kolejnych krokach
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AgentMessage } from '../hooks/useWebSocket';
import styles from '../styles/project-assistant.module.css';

interface ProjectAssistantProps {
  projectStarted: boolean;
  workflowStatus: any;
  liveMessages: AgentMessage[];
  isConnected: boolean;
  onStartProject?: (description?: string, files?: FileList) => void;
}

interface AssistantMessage {
  id: string;
  type: 'info' | 'action' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actionText?: string;
  actionHandler?: () => void;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export default function ProjectAssistant({
  projectStarted,
  workflowStatus,
  liveMessages,
  isConnected,
  onStartProject,
}: ProjectAssistantProps) {
  const [assistantMessages, setAssistantMessages] = useState<
    AssistantMessage[]
  >([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const checkPendingUserTasks = useCallback((): string[] => {
    // Mock - w przyszłości będzie czytać z API
    const tasks = [];

    if (!projectStarted) {
      tasks.push('Uruchom projekt');
    }

    // Sprawdź czy są dokumenty wymagające zatwierdzenia
    if (
      liveMessages.some(msg => msg.message.includes('wymagane zatwierdzenie'))
    ) {
      tasks.push('Zatwierdź dokumenty');
    }

    return tasks;
  }, [projectStarted, liveMessages]);

  // Analizuj stan projektu i generuj komunikaty
  const generateAssistantMessages = useCallback((): AssistantMessage[] => {
    const messages: AssistantMessage[] = [];

    // 1. Sprawdź czy projekt został uruchomiony
    if (!projectStarted) {
      messages.push({
        id: 'start-project',
        type: 'action',
        title: '🚀 Rozpocznij pracę nad projektem',
        message:
          'Wygląda na to, że jeszcze nie rozpocząłeś pracy nad tym projektem. Kliknij poniżej, aby uruchomić analizę i rozpocząć workflow.',
        actionText: 'Rozpocznij analizę projektu',
        actionHandler: () => onStartProject?.(),
        timestamp: new Date().toISOString(),
        priority: 'high',
      });

      // Sprawdź czy są pliki do wgrania
      messages.push({
        id: 'upload-files',
        type: 'info',
        title: '📁 Wgraj dokumenty projektu',
        message:
          'Aby AI agenci mogli lepiej zrozumieć Twój projekt, wgraj dokumenty takie jak: specyfikacje, wymagania, schematy, notatki spotkań.',
        timestamp: new Date().toISOString(),
        priority: 'normal',
      });
    }

    // 2. Projekt uruchomiony - analiza workflow
    if (projectStarted && workflowStatus) {
      if (
        workflowStatus.status === 'started' ||
        workflowStatus.status === 'running'
      ) {
        messages.push({
          id: 'workflow-running',
          type: 'info',
          title: '⚡ Agenci pracują nad Twoim projektem',
          message: `Aktualnie ${workflowStatus.message}. Postęp: ${
            workflowStatus.progress || 0
          }%. Możesz obserwować na żywo co się dzieje.`,
          timestamp: new Date().toISOString(),
          priority: 'normal',
        });
      }

      if (workflowStatus.status === 'completed') {
        messages.push({
          id: 'workflow-completed',
          type: 'success',
          title: '✅ Analiza projektu zakończona!',
          message:
            'Agenci zakończyli analizę Twojego projektu. Sprawdź wygenerowane zadania i dokumentację. Możesz teraz przejść do implementacji.',
          actionText: 'Przejdź do zadań',
          timestamp: new Date().toISOString(),
          priority: 'high',
        });
      }
    }

    // 3. Analiza ostatnich komunikatów agentów
    if (liveMessages.length > 0) {
      const lastMessage = liveMessages[liveMessages.length - 1];

      if (
        lastMessage.message.includes('Created task') ||
        lastMessage.message.includes('zadanie')
      ) {
        messages.push({
          id: 'task-created',
          type: 'success',
          title: '📋 Nowe zadanie utworzone!',
          message: lastMessage.message,
          actionText: 'Zobacz zadania',
          timestamp: lastMessage.timestamp,
          priority: 'normal',
        });
      }

      if (lastMessage.type === 'error') {
        messages.push({
          id: 'agent-error',
          type: 'error',
          title: '❌ Problem z agentem',
          message: `Agent ${lastMessage.agentId}: ${lastMessage.message}`,
          actionText: 'Sprawdź szczegóły',
          timestamp: lastMessage.timestamp,
          priority: 'urgent',
        });
      }
    }

    // 4. Sprawdź połączenie
    if (!isConnected) {
      messages.push({
        id: 'connection-issue',
        type: 'warning',
        title: '🔌 Problem z połączeniem',
        message:
          'Utracono połączenie z serwerem. Próbuję się ponownie połączyć...',
        timestamp: new Date().toISOString(),
        priority: 'high',
      });
    }

    // 5. Sprawdź czy są zadania do wykonania
    const pendingTasks = checkPendingUserTasks();
    if (pendingTasks.length > 0) {
      messages.push({
        id: 'pending-tasks',
        type: 'action',
        title: '⏳ Zadania czekają na Twoją akcję',
        message: `Masz ${
          pendingTasks.length
        } zadań wymagających Twojej uwagi: ${pendingTasks.join(', ')}`,
        actionText: 'Przejdź do zadań',
        timestamp: new Date().toISOString(),
        priority: 'high',
      });
    }

    // 6. Sugestie następnych kroków
    if (projectStarted && !workflowStatus) {
      messages.push({
        id: 'next-steps',
        type: 'info',
        title: '💡 Sugerowane następne kroki',
        message:
          'Możesz dodać więcej dokumentów, skonfigurować parametry projektu lub rozpocząć komunikację z agentami.',
        timestamp: new Date().toISOString(),
        priority: 'low',
      });
    }

    // Sortuj po priorytecie i czasie
    return messages.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [
    projectStarted,
    workflowStatus,
    liveMessages,
    isConnected,
    onStartProject,
    checkPendingUserTasks,
  ]);

  useEffect(() => {
    const messages = generateAssistantMessages();
    setAssistantMessages(messages);
  }, [generateAssistantMessages]);

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'action':
        return '🎯';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '💬';
    }
  };

  return (
    <div className={styles.assistantContainer}>
      <div
        className={styles.assistantHeader}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.assistantTitle}>
          <span className={styles.assistantIcon}>🤖</span>
          <h3>AI Assistant</h3>
          <span className={styles.messageCount}>
            {assistantMessages.length}
          </span>
        </div>
        <button className={styles.toggleButton}>
          {isExpanded ? '▼' : '▲'}
        </button>
      </div>

      {isExpanded && (
        <div className={styles.assistantContent}>
          {assistantMessages.length === 0 ? (
            <div className={styles.noMessages}>
              <span className={styles.robotIcon}>🤖</span>
              <p>Wszystko w porządku! Nie ma żadnych pilnych zadań.</p>
            </div>
          ) : (
            <div className={styles.messagesList}>
              {assistantMessages.slice(0, 5).map(message => (
                <div
                  key={message.id}
                  className={`${styles.messageCard} ${styles[message.type]} ${
                    styles[`priority-${message.priority}`]
                  }`}
                >
                  <div className={styles.messageHeader}>
                    <span className={styles.messageIcon}>
                      {getTypeIcon(message.type)}
                    </span>
                    <span className={styles.messageTitle}>{message.title}</span>
                    <span className={styles.messageTime}>
                      {new Date(message.timestamp).toLocaleTimeString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className={styles.messageText}>{message.message}</p>

                  {message.actionHandler && message.actionText && (
                    <button
                      className={styles.actionButton}
                      onClick={message.actionHandler}
                    >
                      {message.actionText}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {assistantMessages.length > 5 && (
            <div className={styles.moreMessages}>
              <button className={styles.showMoreButton}>
                Zobacz więcej ({assistantMessages.length - 5})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
