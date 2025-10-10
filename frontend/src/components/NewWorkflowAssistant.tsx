/**
 * New Workflow Assistant - Przeprojektowany asystent dopasowany do nowego workflow
 * Minimalistyczny design z focus na funkcjonalność
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Lightbulb,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Upload,
  Download,
  BarChart3,
  Send,
  ChevronDown,
  Bot,
  Activity,
} from 'lucide-react';
import { MICROSOFT_SDL_WORKFLOW } from '../constants/microsoftWorkflow';
import styles from '../styles/new-workflow-assistant.module.css';

interface NewWorkflowAssistantProps {
  workflowStep?: any;
  onAssistRequest?: (message: string) => void;
  isLoading?: boolean;
  conversations?: any[];
}

interface AssistantTip {
  id: string;
  type: 'info' | 'warning' | 'success' | 'tip';
  title: string;
  content: string;
  actionText?: string;
  action?: () => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

export default function NewWorkflowAssistant({
  workflowStep,
  onAssistRequest,
  isLoading = false,
  conversations = [],
}: NewWorkflowAssistantProps) {
  const [activeTab, setActiveTab] = useState<'guide' | 'chat' | 'activity'>(
    'guide'
  );
  const [chatMessage, setChatMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [tips, setTips] = useState<AssistantTip[]>([]);

  // Oblicz aktualny krok workflow
  const currentStepIndex = 0; // This should come from props or context
  const totalSteps = MICROSOFT_SDL_WORKFLOW.length;
  const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  // Generuj tips na podstawie aktualnego kroku
  useEffect(() => {
    if (workflowStep) {
      const stepTips: AssistantTip[] = [
        {
          id: 'current-step',
          type: 'info',
          title: `Krok ${currentStepIndex + 1}: ${workflowStep.name}`,
          content: workflowStep.description,
        },
        {
          id: 'deliverables',
          type: 'tip',
          title: 'Elementy do dostarczenia',
          content: `W tym kroku musisz dostarczyć: ${workflowStep.deliverables
            ?.slice(0, 2)
            .join(', ')}`,
          actionText: 'Zobacz wszystkie',
          action: () => console.log('Show all deliverables'),
        },
        {
          id: 'agents',
          type: 'success',
          title: 'Agenci pracują',
          content: 'business-analyst i system-architect analizują wymagania',
        },
      ];
      setTips(stepTips);
    }
  }, [workflowStep, currentStepIndex]);

  // Quick Actions - szybkie akcje
  const quickActions: QuickAction[] = [
    {
      id: 'upload-docs',
      label: 'Wgraj dokumenty',
      icon: <Upload size={16} />,
      action: () => console.log('Upload documents'),
      color: 'blue',
    },
    {
      id: 'chat-agents',
      label: 'Chat z agentami',
      icon: <MessageSquare size={16} />,
      action: () => setActiveTab('chat'),
      color: 'green',
    },
    {
      id: 'view-progress',
      label: 'Zobacz postęp',
      icon: <BarChart3 size={16} />,
      action: () => setActiveTab('activity'),
      color: 'purple',
    },
    {
      id: 'download-report',
      label: 'Pobierz raport',
      icon: <Download size={16} />,
      action: () => console.log('Download report'),
      color: 'orange',
    },
  ];

  const handleSendMessage = () => {
    if (chatMessage.trim() && onAssistRequest) {
      onAssistRequest(chatMessage);
      setChatMessage('');
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
      <div className={styles.minimizedAssistant}>
        <button
          className={styles.minimizedButton}
          onClick={() => setIsMinimized(false)}
          title="Rozwiń asystenta"
        >
          <Bot size={20} />
          <span className={styles.minimizedLabel}>AI Asystent</span>
        </button>
      </div>
    );
  }

  return (
    <div className={styles.assistantContainer}>
      {/* Header */}
      <div className={styles.assistantHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.assistantIcon}>
            <Bot size={20} />
          </div>
          <div className={styles.headerInfo}>
            <h3 className={styles.assistantTitle}>AI Workflow Assistant</h3>
            <p className={styles.assistantStatus}>
              Krok {currentStepIndex + 1} z {totalSteps} • {progress}% ukończone
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.headerButton}
            onClick={() => setIsMinimized(true)}
            title="Minimalizuj"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tab} ${
            activeTab === 'guide' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('guide')}
        >
          <Lightbulb size={16} />
          Przewodnik
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'chat' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === 'activity' ? styles.tabActive : ''
          }`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={16} />
          Aktywność
        </button>
      </div>

      {/* Content */}
      <div className={styles.contentContainer}>
        {activeTab === 'guide' && (
          <div className={styles.guideContent}>
            {/* Quick Actions */}
            <div className={styles.quickActionsContainer}>
              <h4 className={styles.sectionTitle}>Szybkie akcje</h4>
              <div className={styles.quickActions}>
                {quickActions.map(action => (
                  <button
                    key={action.id}
                    className={`${styles.quickAction} ${
                      styles[
                        `quickAction${
                          action.color.charAt(0).toUpperCase() +
                          action.color.slice(1)
                        }`
                      ]
                    }`}
                    onClick={action.action}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className={styles.tipsContainer}>
              <h4 className={styles.sectionTitle}>Podpowiedzi</h4>
              <div className={styles.tips}>
                {tips.map(tip => (
                  <div
                    key={tip.id}
                    className={`${styles.tip} ${
                      styles[
                        `tip${
                          tip.type.charAt(0).toUpperCase() + tip.type.slice(1)
                        }`
                      ]
                    }`}
                  >
                    <div className={styles.tipHeader}>
                      <div className={styles.tipIcon}>
                        {tip.type === 'info' && <AlertTriangle size={16} />}
                        {tip.type === 'warning' && <AlertTriangle size={16} />}
                        {tip.type === 'success' && <CheckCircle size={16} />}
                        {tip.type === 'tip' && <Lightbulb size={16} />}
                      </div>
                      <h5 className={styles.tipTitle}>{tip.title}</h5>
                    </div>
                    <p className={styles.tipContent}>{tip.content}</p>
                    {tip.actionText && (
                      <button className={styles.tipAction} onClick={tip.action}>
                        {tip.actionText}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className={styles.chatContent}>
            <div className={styles.chatMessages}>
              {conversations.length === 0 ? (
                <div className={styles.emptyChatState}>
                  <MessageSquare size={32} />
                  <h4>Rozpocznij rozmowę</h4>
                  <p>Zadaj pytanie agentom AI lub poproś o pomoc</p>
                </div>
              ) : (
                conversations.map((conv, index) => (
                  <div key={index} className={styles.chatMessage}>
                    {/* Chat messages will be rendered here */}
                  </div>
                ))
              )}
            </div>
            <div className={styles.chatInputContainer}>
              <div className={styles.chatInput}>
                <textarea
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Napisz wiadomość do agentów AI..."
                  className={styles.chatTextarea}
                  rows={2}
                />
                <button
                  className={styles.sendButton}
                  onClick={handleSendMessage}
                  disabled={!chatMessage.trim() || isLoading}
                >
                  {isLoading ? (
                    <Clock size={16} className={styles.spinningIcon} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className={styles.activityContent}>
            <div className={styles.activityHeader}>
              <h4 className={styles.sectionTitle}>Aktywność na żywo</h4>
              <div className={styles.activityStatus}>
                <div className={styles.statusDot} />
                <span>Agenci pracują</span>
              </div>
            </div>
            <div className={styles.activityFeed}>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <Users size={16} />
                </div>
                <div className={styles.activityDetails}>
                  <p className={styles.activityText}>
                    <strong>business-analyst</strong> rozpoczął analizę wymagań
                  </p>
                  <span className={styles.activityTime}>2 minuty temu</span>
                </div>
              </div>
              <div className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  <FileText size={16} />
                </div>
                <div className={styles.activityDetails}>
                  <p className={styles.activityText}>
                    Dokument BRD został przeanalizowany
                  </p>
                  <span className={styles.activityTime}>5 minut temu</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
