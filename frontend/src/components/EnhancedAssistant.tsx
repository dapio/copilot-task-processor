/**
 * Enhanced Project Assistant with Contextual Guidance
 * Rozszerzony asystent z kontekstowymi podpowiedziami i przewodnikiem
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AgentMessage } from '../hooks/useWebSocket';
import styles from '../styles/enhanced-assistant.module.css';

interface EnhancedAssistantProps {
  projectStarted: boolean;
  workflowStatus: any;
  liveMessages: AgentMessage[];
  isConnected: boolean;
  onStartProject?: (description?: string, files?: FileList) => void;
}

interface GuidanceStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionText?: string;
}

interface AssistantTip {
  id: string;
  type: 'tip' | 'warning' | 'info' | 'success';
  title: string;
  content: string;
  dismissible: boolean;
}

export default function EnhancedAssistant({
  projectStarted,
  workflowStatus,
  liveMessages,
  isConnected,
  onStartProject,
}: EnhancedAssistantProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [assistantTips, setAssistantTips] = useState<AssistantTip[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGuide, setShowGuide] = useState(!projectStarted);

  // Kroki przewodnika
  const guidanceSteps: GuidanceStep[] = [
    {
      id: 'welcome',
      title: 'Witaj w ThinkCode AI Platform!',
      description:
        'Jestem Twoim AI asystentem. Pomogę Ci krok po kroku uruchomić projekt i pracować z agentami.',
      completed: true,
    },
    {
      id: 'upload-docs',
      title: 'Wgraj dokumenty projektu',
      description:
        'Zacznij od wgrania dokumentów projektu: specyfikacje, wymagania, notatki. Agenci będą je analizować.',
      completed: false,
      actionText: 'Wgraj dokumenty',
      action: () => {
        const fileInput = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
          console.log('🤖 Assistant: Opening file dialog');
        } else {
          console.error('🤖 Assistant: File input not found');
        }
      },
    },
    {
      id: 'start-analysis',
      title: 'Rozpocznij analizę',
      description:
        'Uruchom AI agentów, którzy przeanalizują Twoje dokumenty i stworzą plan projektu.',
      completed: projectStarted,
      actionText: 'Rozpocznij analizę',
      action: () => {
        console.log('🤖 Assistant: Starting project analysis');
        if (onStartProject) {
          onStartProject();
        } else {
          console.error('🤖 Assistant: onStartProject function not provided');
        }
      },
    },
    {
      id: 'monitor-progress',
      title: 'Monitoruj postęp',
      description:
        'Obserwuj pracę agentów w czasie rzeczywistym i komunikuj się z nimi.',
      completed: projectStarted && workflowStatus?.status === 'completed',
    },
    {
      id: 'review-results',
      title: 'Sprawdź rezultaty',
      description:
        'Przejrzyj wygenerowane zadania, dokumentację i plan implementacji.',
      completed: false,
    },
  ];

  // Generuj kontekstowe podpowiedzi
  const generateContextualTips = useCallback(() => {
    console.log('🤖 Assistant: Generating tips. State:', {
      projectStarted,
      isConnected,
      workflowStatus: workflowStatus?.status,
      liveMessagesCount: liveMessages.length,
    });

    const tips: AssistantTip[] = [];

    // Sprawdź połączenie
    if (!isConnected) {
      tips.push({
        id: 'connection-lost',
        type: 'warning',
        title: '🔌 Problemy z połączeniem',
        content:
          'Utracono połączenie z serwerem. Sprawdź połączenie internetowe lub odśwież stronę.',
        dismissible: false,
      });
    }

    // Status projektu
    if (!projectStarted) {
      tips.push({
        id: 'getting-started',
        type: 'info',
        title: '🚀 Jak zacząć?',
        content:
          'Wgraj dokumenty projektu (PDFs, DOCs, TXT) i kliknij "Rozpocznij analizę". Agenci automatycznie przeanalizują zawartość.',
        dismissible: true,
      });

      tips.push({
        id: 'file-types',
        type: 'tip',
        title: '📄 Obsługiwane formaty',
        content:
          'Możesz wgrać pliki: PDF, DOC, DOCX, TXT, MD. Im więcej szczegółów, tym lepsza analiza!',
        dismissible: true,
      });
    }

    // Analiza w trakcie
    if (projectStarted && workflowStatus?.status === 'running') {
      tips.push({
        id: 'analysis-running',
        type: 'info',
        title: '⚡ Analiza w trakcie',
        content:
          'Agenci analizują Twoje dokumenty. Możesz dodać więcej plików lub obserwować postęp na żywo.',
        dismissible: true,
      });
    }

    // Analiza zakończona
    if (workflowStatus?.status === 'completed') {
      tips.push({
        id: 'analysis-completed',
        type: 'success',
        title: '✅ Analiza zakończona!',
        content:
          'Świetnie! Agenci zakończyli analizę. Sprawdź wygenerowane zadania i rozpocznij implementację.',
        dismissible: true,
      });
    }

    // Nowe wiadomości od agentów
    if (liveMessages.length > 0) {
      const lastMessage = liveMessages[liveMessages.length - 1];
      if (
        lastMessage.message.includes('zadanie') ||
        lastMessage.message.includes('task')
      ) {
        tips.push({
          id: 'new-task',
          type: 'success',
          title: '📋 Nowe zadanie!',
          content: `Agent ${lastMessage.agentId} utworzył nowe zadanie. Sprawdź zakładkę "Zadania".`,
          dismissible: true,
        });
      }
    }

    return tips;
  }, [isConnected, projectStarted, workflowStatus, liveMessages]);

  // Aktualizuj podpowiedzi
  useEffect(() => {
    const tips = generateContextualTips();
    setAssistantTips(tips);
  }, [generateContextualTips]);

  // Aktualizuj krok przewodnika
  useEffect(() => {
    if (!projectStarted) {
      setCurrentStep(1); // upload-docs
    } else if (workflowStatus?.status === 'running') {
      setCurrentStep(3); // monitor-progress
    } else if (workflowStatus?.status === 'completed') {
      setCurrentStep(4); // review-results
    }
  }, [projectStarted, workflowStatus]);

  const dismissTip = (tipId: string) => {
    setAssistantTips(prev => prev.filter(tip => tip.id !== tipId));
  };

  const nextStep = () => {
    if (currentStep < guidanceSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (isMinimized) {
    return (
      <div
        className={styles.minimizedAssistant}
        onClick={() => setIsMinimized(false)}
      >
        <div className={styles.minimizedIcon}>🤖</div>
        <span className={styles.minimizedText}>AI Assistant</span>
        {assistantTips.length > 0 && (
          <div className={styles.notificationBadge}>{assistantTips.length}</div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.assistantContainer}>
      <div className={styles.assistantHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.assistantAvatar}>🤖</div>
          <div className={styles.assistantInfo}>
            <h3 className={styles.assistantName}>AI Project Assistant</h3>
            <p className={styles.assistantStatus}>
              {isConnected ? '🟢 Online' : '🔴 Offline'} • Krok{' '}
              {currentStep + 1} z {guidanceSteps.length}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.toggleGuideButton}
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? '📖' : '❓'}
          </button>
          <button
            className={styles.minimizeButton}
            onClick={() => setIsMinimized(true)}
          >
            ⏬
          </button>
        </div>
      </div>

      {/* Podpowiedzi kontekstowe */}
      {assistantTips.length > 0 && (
        <div className={styles.tipsContainer}>
          {assistantTips.slice(0, 2).map(tip => (
            <div
              key={tip.id}
              className={`${styles.tipCard} ${styles[tip.type]}`}
            >
              <div className={styles.tipHeader}>
                <span className={styles.tipTitle}>{tip.title}</span>
                {tip.dismissible && (
                  <button
                    className={styles.dismissButton}
                    onClick={() => dismissTip(tip.id)}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className={styles.tipContent}>{tip.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Przewodnik krok po kroku */}
      {showGuide && (
        <div className={styles.guideContainer}>
          <div className={styles.guideHeader}>
            <h4 className={styles.guideTitle}>📋 Przewodnik projektu</h4>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${
                  currentStep === 0
                    ? styles.progressFill20
                    : currentStep === 1
                    ? styles.progressFill40
                    : currentStep === 2
                    ? styles.progressFill60
                    : currentStep === 3
                    ? styles.progressFill80
                    : styles.progressFill100
                }`}
              />
            </div>
          </div>

          <div className={styles.currentStep}>
            <div className={styles.stepHeader}>
              <div className={styles.stepNumber}>{currentStep + 1}</div>
              <div className={styles.stepInfo}>
                <h5 className={styles.stepTitle}>
                  {guidanceSteps[currentStep].title}
                </h5>
                <p className={styles.stepDescription}>
                  {guidanceSteps[currentStep].description}
                </p>
              </div>
            </div>

            {guidanceSteps[currentStep].action && (
              <button
                className={styles.stepActionButton}
                onClick={guidanceSteps[currentStep].action}
              >
                {guidanceSteps[currentStep].actionText}
              </button>
            )}
          </div>

          <div className={styles.guideNavigation}>
            <button
              className={styles.navButton}
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              ← Poprzedni
            </button>

            <div className={styles.stepIndicators}>
              {guidanceSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`${styles.stepIndicator} ${
                    index === currentStep ? styles.active : ''
                  } ${step.completed ? styles.completed : ''}`}
                  onClick={() => setCurrentStep(index)}
                />
              ))}
            </div>

            <button
              className={styles.navButton}
              onClick={nextStep}
              disabled={currentStep === guidanceSteps.length - 1}
            >
              Następny →
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h4 className={styles.quickActionsTitle}>⚡ Szybkie akcje</h4>
        <div className={styles.actionButtons}>
          {!projectStarted && (
            <button
              className={`${styles.actionButton} ${styles.primary}`}
              onClick={() => onStartProject?.()}
            >
              🚀 Rozpocznij projekt
            </button>
          )}

          <button className={styles.actionButton}>📊 Zobacz postęp</button>

          <button className={styles.actionButton}>💬 Czat z agentami</button>

          {workflowStatus?.status === 'completed' && (
            <button className={`${styles.actionButton} ${styles.success}`}>
              📋 Pobierz raport
            </button>
          )}
        </div>
      </div>

      {/* Live Activity Feed */}
      {liveMessages.length > 0 && (
        <div className={styles.activityFeed}>
          <h4 className={styles.activityTitle}>🔴 Na żywo</h4>
          <div className={styles.activityList}>
            {liveMessages.slice(-3).map((message, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityIcon}>👤</div>
                <div className={styles.activityContent}>
                  <span className={styles.agentName}>{message.agentId}</span>
                  <span className={styles.activityMessage}>
                    {message.message}
                  </span>
                  <span className={styles.activityTime}>
                    {new Date(message.timestamp).toLocaleTimeString('pl-PL', {
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
  );
}
