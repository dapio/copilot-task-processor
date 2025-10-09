/**
 * Smart Help System - Inteligentny system pomocy
 * Kontekstowe podpowiedzi i wskazówki dla użytkowników
 */

import React, { useState, useEffect, useCallback } from 'react';
import styles from '../styles/smart-help.module.css';

interface HelpContext {
  currentPage: string;
  userRole: 'beginner' | 'intermediate' | 'expert';
  projectPhase: 'setup' | 'analysis' | 'development' | 'review' | 'completed';
  lastActivity?: string;
  strugglingWith?: string[];
}

interface SmartTip {
  id: string;
  title: string;
  content: string;
  type: 'onboarding' | 'workflow' | 'troubleshooting' | 'optimization';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  triggers: string[];
  actions?: {
    label: string;
    action: () => void;
  }[];
  dismissible: boolean;
  showOnce?: boolean;
}

interface SmartHelpSystemProps {
  context: HelpContext;
  isVisible: boolean;
  onToggle: () => void;
}

export default function SmartHelpSystem({
  context,
  isVisible,
  onToggle,
}: SmartHelpSystemProps) {
  const [activeTips, setActiveTips] = useState<SmartTip[]>([]);
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  const [userProfile, setUserProfile] = useState(context.userRole);

  // Bank podpowiedzi kontekstowych
  const tipsDatabase = React.useMemo(
    (): SmartTip[] => [
      // Onboarding Tips
      {
        id: 'welcome-beginner',
        title: '👋 Witaj w ThinkCode AI Platform!',
        content:
          'To Twoja pierwsza wizyta? Świetnie! Ta platforma pomaga w zarządzaniu projektami AI. Zacznij od wgrania dokumentów swojego projektu.',
        type: 'onboarding' as const,
        priority: 'high' as const,
        triggers: ['first-visit', 'no-projects'],
        actions: [
          {
            label: '📚 Zobacz przewodnik',
            action: () => console.log('Show guide'),
          },
          {
            label: '🚀 Rozpocznij projekt',
            action: () => console.log('Start project'),
          },
        ],
        dismissible: true,
        showOnce: true,
      },

      // Workflow Tips
      {
        id: 'upload-documents',
        title: '📄 Wgraj dokumenty projektu',
        content:
          'Aby AI agenci mogli pomóc, potrzebują dokumentów projektu: specyfikacje, wymagania, notatki. Obsługujemy PDF, DOC, TXT.',
        type: 'workflow' as const,
        priority: 'high' as const,
        triggers: ['project-setup', 'no-files'],
        actions: [
          {
            label: '📎 Wybierz pliki',
            action: () => {
              const input = document.querySelector(
                'input[type="file"]'
              ) as HTMLInputElement;
              input?.click();
            },
          },
        ],
        dismissible: true,
      },

      {
        id: 'analysis-started',
        title: '⚡ Analiza rozpoczęta',
        content:
          'Świetnie! Agenci analizują Twoje dokumenty. Możesz obserwować postęp na żywo lub dodać więcej materiałów.',
        type: 'workflow' as const,
        priority: 'medium' as const,
        triggers: ['analysis-running'],
        dismissible: true,
      },

      {
        id: 'first-task-created',
        title: '🎉 Pierwsze zadanie utworzone!',
        content:
          'Agenci utworzyli pierwsze zadanie na podstawie analizy. Sprawdź zakładkę "Zadania" i zacznij implementację.',
        type: 'workflow' as const,
        priority: 'high' as const,
        triggers: ['task-created'],
        actions: [
          {
            label: '📋 Zobacz zadania',
            action: () => console.log('Show tasks'),
          },
        ],
        dismissible: true,
      },

      // Troubleshooting Tips
      {
        id: 'connection-issues',
        title: '🔌 Problemy z połączeniem',
        content:
          'Wykryto problemy z połączeniem. Sprawdź internet lub odśwież stronę. Twoja praca jest automatycznie zapisywana.',
        type: 'troubleshooting' as const,
        priority: 'urgent' as const,
        triggers: ['connection-lost'],
        actions: [
          {
            label: '🔄 Odśwież stronę',
            action: () => window.location.reload(),
          },
        ],
        dismissible: false,
      },

      {
        id: 'no-progress-help',
        title: '🤔 Potrzebujesz pomocy?',
        content:
          'Widzę, że nie ma postępu od pewnego czasu. Czy wszystko w porządku? Mogę pomóc z następnymi krokami.',
        type: 'troubleshooting' as const,
        priority: 'medium' as const,
        triggers: ['no-activity-30min'],
        actions: [
          {
            label: '💬 Porozmawiaj z AI',
            action: () => console.log('Open chat'),
          },
          {
            label: '📞 Kontakt z wsparciem',
            action: () => console.log('Contact support'),
          },
        ],
        dismissible: true,
      },

      // Optimization Tips
      {
        id: 'upload-more-docs',
        title: '📈 Dodaj więcej kontekstu',
        content:
          'Im więcej dokumentów projektu wgrasz, tym lepsze będą sugestie agentów. Rozważ dodanie: diagramów, przykładów, specyfikacji API.',
        type: 'optimization' as const,
        priority: 'low' as const,
        triggers: ['few-documents', 'analysis-completed'],
        dismissible: true,
      },

      {
        id: 'workflow-optimization',
        title: '⚡ Optymalizacja workflow',
        content:
          'Często używasz tych samych kroków? Możesz utworzyć szablon workflow dla podobnych projektów.',
        type: 'optimization' as const,
        priority: 'low' as const,
        triggers: ['repeated-actions'],
        dismissible: true,
      },
    ],
    []
  );

  // Analizuj kontekst i generuj odpowiednie podpowiedzi
  const analyzeContextAndGenerateTips = useCallback(() => {
    const relevantTips: SmartTip[] = [];

    tipsDatabase.forEach(tip => {
      // Sprawdź czy tip był już odrzucony
      if (dismissedTips.has(tip.id) && tip.dismissible) {
        return;
      }

      // Sprawdź czy tip ma być pokazany tylko raz
      if (tip.showOnce && dismissedTips.has(tip.id)) {
        return;
      }

      // Sprawdź triggery
      const hasMatchingTrigger = tip.triggers.some(trigger => {
        switch (trigger) {
          case 'first-visit':
            return (
              context.projectPhase === 'setup' && userProfile === 'beginner'
            );
          case 'no-projects':
            return context.projectPhase === 'setup';
          case 'project-setup':
            return context.projectPhase === 'setup';
          case 'no-files':
            return context.projectPhase === 'setup';
          case 'analysis-running':
            return context.projectPhase === 'analysis';
          case 'task-created':
            return context.lastActivity === 'task-created';
          case 'connection-lost':
            return context.strugglingWith?.includes('connection');
          case 'no-activity-30min':
            return context.strugglingWith?.includes('inactivity');
          case 'few-documents':
            return context.strugglingWith?.includes('insufficient-context');
          case 'analysis-completed':
            return context.projectPhase === 'development';
          case 'repeated-actions':
            return context.strugglingWith?.includes('repetitive-tasks');
          default:
            return false;
        }
      });

      if (hasMatchingTrigger) {
        relevantTips.push(tip);
      }
    });

    // Sortuj po priorytecie
    const priorityOrder: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    relevantTips.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
    );

    setActiveTips(relevantTips.slice(0, 3)); // Maksymalnie 3 tipy
  }, [context, dismissedTips, userProfile, tipsDatabase]);

  // Aktualizuj tipy gdy zmieni się kontekst
  useEffect(() => {
    analyzeContextAndGenerateTips();
  }, [analyzeContextAndGenerateTips]);

  // Odrzuć tip
  const dismissTip = (tipId: string) => {
    setDismissedTips(prev => new Set([...prev, tipId]));
    setActiveTips(prev => prev.filter(tip => tip.id !== tipId));
  };

  // Adaptacyjne uczenie się preferencji użytkownika
  const adaptToUserBehavior = (action: string) => {
    if (action === 'dismiss-multiple-onboarding') {
      setUserProfile('intermediate');
    } else if (action === 'use-advanced-features') {
      setUserProfile('expert');
    }
  };

  if (!isVisible || activeTips.length === 0) {
    return (
      <button
        className={styles.helpToggle}
        onClick={onToggle}
        title="Pokaż pomoc kontekstową"
      >
        💡
      </button>
    );
  }

  return (
    <div className={styles.helpContainer}>
      <div className={styles.helpHeader}>
        <div className={styles.helpTitle}>
          <span className={styles.helpIcon}>🧠</span>
          <span>Inteligentna Pomoc</span>
        </div>
        <button
          className={styles.helpToggle}
          onClick={onToggle}
          title="Ukryj pomoc"
        >
          ✕
        </button>
      </div>

      <div className={styles.helpContent}>
        {activeTips.map(tip => (
          <div
            key={tip.id}
            className={`${styles.helpTip} ${styles[tip.type]} ${
              styles[tip.priority]
            }`}
          >
            <div className={styles.tipHeader}>
              <h4 className={styles.tipTitle}>{tip.title}</h4>
              {tip.dismissible && (
                <button
                  className={styles.dismissButton}
                  onClick={() => {
                    dismissTip(tip.id);
                    adaptToUserBehavior('dismiss-tip');
                  }}
                  title="Odrzuć podpowiedź"
                >
                  ✕
                </button>
              )}
            </div>

            <p className={styles.tipContent}>{tip.content}</p>

            {tip.actions && (
              <div className={styles.tipActions}>
                {tip.actions.map((action, index) => (
                  <button
                    key={index}
                    className={styles.tipActionButton}
                    onClick={() => {
                      action.action();
                      adaptToUserBehavior('use-action');
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={styles.helpFooter}>
        <div className={styles.userProfile}>
          <span className={styles.profileLabel}>Poziom:</span>
          <select
            className={styles.profileSelect}
            value={userProfile}
            onChange={e => setUserProfile(e.target.value as any)}
            title="Wybierz swój poziom doświadczenia"
          >
            <option value="beginner">🌱 Początkujący</option>
            <option value="intermediate">🌿 Średniozaawansowany</option>
            <option value="expert">🌳 Ekspert</option>
          </select>
        </div>
      </div>
    </div>
  );
}
