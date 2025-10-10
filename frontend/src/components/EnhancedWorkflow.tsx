import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Play,
  ChevronRight,
  MessageSquare,
  FileText,
  Image,
  Download,
  AlertTriangle,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import styles from '../styles/enhanced-workflow.module.css';
import { useEnhancedWorkflow } from '../hooks/useEnhancedWorkflow';
import { useWebSocket } from '../hooks/useWebSocket';
import EnhancedTaskSection from './EnhancedTaskSection';

interface EnhancedWorkflowProps {
  projectId: string;
  workflowRunId: string;
  projectName: string;
  onStepStart?: (stepId: string) => void;
  onStepApprove?: (stepId: string, comments?: string) => void;
  onStepReject?: (stepId: string, reason: string) => void;
  onStepRevisionRequest?: (stepId: string, comments: string) => void;
  onSendMessage?: (stepId: string, message: string) => void;
}

export default function EnhancedWorkflow({
  projectId,
  workflowRunId,
  projectName,
  onStepStart,
  onStepApprove,
  onStepReject,
  onStepRevisionRequest,
  onSendMessage,
}: EnhancedWorkflowProps) {
  // Use the enhanced workflow hook
  const {
    currentStepId,
    steps,
    files,
    conversations,
    loading,
    startStep,
    approveStep,
    rejectStep,
    requestRevision,
    sendMessage,
    setCurrentStep,
  } = useEnhancedWorkflow({ projectId, workflowRunId });

  // Use WebSocket for real-time updates
  const { isConnected, lastWorkflowUpdate } = useWebSocket({
    projectId,
    autoConnect: true,
  });

  const [chatMessage, setChatMessage] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalComments, setApprovalComments] = useState('');
  const [actionType, setActionType] = useState<
    'approve' | 'reject' | 'revision'
  >('approve');
  const [lastUpdateMessage, setLastUpdateMessage] = useState<string>('');
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Handle real-time workflow updates
  useEffect(() => {
    if (lastWorkflowUpdate && lastWorkflowUpdate.workflowId === workflowRunId) {
      console.log('🔔 Processing workflow update:', lastWorkflowUpdate);

      // Show notification for the update
      setLastUpdateMessage(lastWorkflowUpdate.message);
      setShowUpdateNotification(true);

      // Hide notification after 5 seconds
      setTimeout(() => {
        setShowUpdateNotification(false);
      }, 5000);
    }
  }, [lastWorkflowUpdate, workflowRunId]);

  // Data is now handled by useEnhancedWorkflow hook

  const currentStep = steps.find(step => step.id === currentStepId);
  const currentStepFiles = files.filter(
    file =>
      file.category === 'input' || (file.category === 'output' && currentStep)
  );

  const handleStepSelect = (stepId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (step && (step.status === 'approved' || step.isActive)) {
      setCurrentStep(stepId);
    }
  };

  const handleStepAction = async (
    action: 'start' | 'approve' | 'reject' | 'revision'
  ) => {
    if (!currentStep) return;

    if (action === 'start') {
      await startStep(currentStep.id);
      onStepStart?.(currentStep.id);
    } else {
      setActionType(action);
      setShowApprovalDialog(true);
    }
  };

  const handleApprovalSubmit = async () => {
    if (!currentStep) return;

    try {
      switch (actionType) {
        case 'approve':
          await approveStep(currentStep.id, approvalComments);
          onStepApprove?.(currentStep.id, approvalComments);
          break;
        case 'reject':
          await rejectStep(currentStep.id, approvalComments);
          onStepReject?.(currentStep.id, approvalComments);
          break;
        case 'revision':
          await requestRevision(currentStep.id, approvalComments);
          onStepRevisionRequest?.(currentStep.id, approvalComments);
          break;
      }

      setShowApprovalDialog(false);
      setApprovalComments('');
    } catch (error) {
      console.error('Error handling approval:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !currentStep) return;

    try {
      await sendMessage(currentStep.id, chatMessage);
      onSendMessage?.(currentStep.id, chatMessage);
      setChatMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/'))
      // eslint-disable-next-line jsx-a11y/alt-text
      return <Image size={16} aria-hidden="true" />;
    if (mimeType === 'application/pdf')
      return <FileText size={16} aria-hidden="true" />;
    if (mimeType.includes('zip'))
      return <Download size={16} aria-hidden="true" />;
    return <FileText size={16} aria-hidden="true" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className={styles.statusIconApproved} />;
      case 'pending':
        return <Clock className={styles.statusIconPending} />;
      case 'rejected':
        return <AlertCircle className={styles.statusIconRejected} />;
      case 'needs_revision':
        return <AlertTriangle className={styles.statusIconRevision} />;
      default:
        return <Clock className={styles.statusIconPending} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>Ładowanie workflow...</p>
      </div>
    );
  }

  return (
    <div className={styles.workflowContainer}>
      {/* Header */}
      <div className={styles.workflowHeader}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.workflowTitle}>
              Proces Rozwoju Aplikacji - {projectName}
            </h1>
            <p className={styles.workflowSubtitle}>
              Iteracyjny proces współpracy z agentami AI
            </p>
          </div>
          <div className={styles.connectionStatus}>
            <div
              className={`${styles.statusIndicator} ${
                isConnected ? styles.connected : styles.disconnected
              }`}
            >
              <span className={styles.statusDot}></span>
              <span className={styles.statusText}>
                {isConnected ? 'Połączono z serwerem' : 'Brak połączenia'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Update Notification */}
      {showUpdateNotification && (
        <div className={styles.updateNotification}>
          <div className={styles.notificationContent}>
            <CheckCircle size={16} />
            <span>{lastUpdateMessage}</span>
          </div>
        </div>
      )}

      <div className={styles.workflowLayout}>
        {/* Left Panel - Current Step Details */}
        <div className={styles.leftPanel}>
          {currentStep ? (
            <>
              {/* Step Header */}
              <div className={styles.stepHeader}>
                <div className={styles.stepTitleSection}>
                  <h2 className={styles.stepTitle}>
                    {currentStep.stepNumber}. {currentStep.stepName}
                  </h2>
                  <p className={styles.stepDescription}>
                    {currentStep.description}
                  </p>
                </div>
                <div className={styles.stepStatus}>
                  {getStatusIcon(currentStep.status)}
                  <span className={styles.stepStatusText}>
                    {currentStep.status === 'approved' && 'Zatwierdzony'}
                    {currentStep.status === 'pending' && 'Oczekuje'}
                    {currentStep.status === 'rejected' && 'Odrzucony'}
                    {currentStep.status === 'needs_revision' &&
                      'Wymaga poprawek'}
                  </span>
                </div>
              </div>

              {/* Step Agents */}
              <div className={styles.stepAgents}>
                <h3 className={styles.sectionTitle}>
                  <Users size={18} />
                  Agenci ({currentStep.assignedAgents.length})
                </h3>
                <div className={styles.agentsList}>
                  {currentStep.assignedAgents.map(agent => (
                    <div key={agent.id} className={styles.agentCard}>
                      <div
                        className={styles.agentAvatar}
                        style={{ backgroundColor: agent.color }}
                      >
                        {agent.displayName.charAt(0)}
                      </div>
                      <div className={styles.agentInfo}>
                        <div className={styles.agentName}>
                          {agent.displayName}
                        </div>
                        <div className={styles.agentSpecialties}>
                          {agent.specialties.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files Section */}
              <div className={styles.filesSection}>
                <h3 className={styles.sectionTitle}>
                  <FileText size={18} />
                  Pliki ({currentStepFiles.length})
                </h3>
                <div className={styles.filesList}>
                  {currentStepFiles.map(file => (
                    <div key={file.id} className={styles.fileItem}>
                      <div className={styles.fileIcon}>
                        {getFileIcon(file.mimeType)}
                      </div>
                      <div className={styles.fileInfo}>
                        <div className={styles.fileName}>
                          {file.originalName}
                        </div>
                        <div className={styles.fileDetails}>
                          {formatFileSize(file.size)} • {file.category} •{' '}
                          {file.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enhanced Tasks Section */}
              <EnhancedTaskSection
                approvalId={currentStepId}
                stepName={currentStep?.stepName}
                onTaskAction={(taskId, action) => {
                  console.log(`Task action: ${action} on task ${taskId}`);
                  // Handle task actions here - could trigger API calls
                }}
              />

              {/* Step Actions */}
              <div className={styles.stepActions}>
                {currentStep.status === 'pending' &&
                  !currentStep.hasActivity && (
                    <button
                      className={`${styles.actionButton} ${styles.actionStart}`}
                      onClick={() => handleStepAction('start')}
                    >
                      <Play size={18} />
                      Uruchom Krok
                    </button>
                  )}

                {currentStep.hasActivity &&
                  currentStep.status === 'pending' && (
                    <div className={styles.actionGroup}>
                      <button
                        className={`${styles.actionButton} ${styles.actionApprove}`}
                        onClick={() => handleStepAction('approve')}
                      >
                        <Check size={18} />
                        Zatwierdź
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.actionRevision}`}
                        onClick={() => handleStepAction('revision')}
                      >
                        <RotateCcw size={18} />
                        Poprawki
                      </button>
                      <button
                        className={`${styles.actionButton} ${styles.actionReject}`}
                        onClick={() => handleStepAction('reject')}
                      >
                        <X size={18} />
                        Odrzuć
                      </button>
                    </div>
                  )}

                {currentStep.status === 'approved' && (
                  <button
                    className={`${styles.actionButton} ${styles.actionRevision}`}
                    onClick={() => handleStepAction('revision')}
                  >
                    <RotateCcw size={18} />
                    Wycofaj Akceptację
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className={styles.noStepSelected}>
              <p>Wybierz krok z listy po prawej stronie</p>
            </div>
          )}
        </div>

        {/* Right Panel - Steps List */}
        <div className={styles.rightPanel}>
          <h3 className={styles.sectionTitle}>Kroki Workflow</h3>
          <div className={styles.stepsList}>
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`${styles.stepCard} ${
                  step.id === currentStepId ? styles.stepCardActive : ''
                } ${
                  step.status === 'approved' || step.isActive
                    ? styles.stepCardClickable
                    : styles.stepCardDisabled
                }`}
                onClick={() => handleStepSelect(step.id)}
              >
                <div className={styles.stepCardHeader}>
                  <div className={styles.stepCardNumber}>{step.stepNumber}</div>
                  <div className={styles.stepCardTitle}>{step.stepName}</div>
                  {getStatusIcon(step.status)}
                </div>

                <div className={styles.stepCardAgents}>
                  {step.assignedAgents.map(agent => (
                    <div
                      key={agent.id}
                      className={styles.stepAgentChip}
                      style={{
                        backgroundColor: agent.color + '20',
                        color: agent.color,
                      }}
                    >
                      {agent.displayName.split(' - ')[1] || agent.displayName}
                    </div>
                  ))}
                </div>

                {step.hasActivity && (
                  <div className={styles.stepCardActivity}>
                    <span className={styles.activityBadge}>
                      <MessageSquare size={12} />
                      {step.conversationCount}
                    </span>
                    <span className={styles.activityBadge}>
                      <AlertCircle size={12} />
                      {step.taskCount}
                    </span>
                  </div>
                )}

                {index < steps.length - 1 && (
                  <div className={styles.stepConnector}>
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Chat Panel */}
      <div className={styles.chatPanel}>
        <div className={styles.chatHeader}>
          <h3 className={styles.chatTitle}>
            <MessageSquare size={18} />
            Konwersacja - {currentStep?.stepName || 'Wybierz krok'}
          </h3>
        </div>

        <div className={styles.chatMessages}>
          {conversations.map(message => (
            <div
              key={message.id}
              className={`${styles.chatMessage} ${
                message.role === 'user'
                  ? styles.chatMessageUser
                  : styles.chatMessageAgent
              }`}
            >
              {message.agent && (
                <div
                  className={styles.messageAvatar}
                  style={{ backgroundColor: message.agent.color }}
                >
                  {message.agent.displayName.charAt(0)}
                </div>
              )}
              <div className={styles.messageContent}>
                <div className={styles.messageHeader}>
                  <span className={styles.messageSender}>
                    {message.agent?.displayName || 'Użytkownik'}
                  </span>
                  <span className={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  {message.isImportant && (
                    <span className={styles.messageImportant}>Ważne</span>
                  )}
                </div>
                <div className={styles.messageText}>
                  {message.content.split('\n').map((line, idx) => (
                    <p
                      key={idx}
                      className={idx > 0 ? styles.messageListItem : ''}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.chatInput}>
          <textarea
            value={chatMessage}
            onChange={e => setChatMessage(e.target.value)}
            placeholder="Napisz wiadomość do agentów..."
            className={styles.chatTextarea}
            rows={3}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            className={styles.chatSendButton}
            disabled={!chatMessage.trim()}
          >
            Wyślij
          </button>
        </div>
      </div>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogContent}>
            <div className={styles.dialogHeader}>
              <h3 className={styles.dialogTitle}>
                {actionType === 'approve' && 'Zatwierdź Krok'}
                {actionType === 'reject' && 'Odrzuć Krok'}
                {actionType === 'revision' && 'Zażądaj Poprawek'}
              </h3>
              <button
                onClick={() => setShowApprovalDialog(false)}
                className={styles.dialogClose}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.dialogBody}>
              <label className={styles.dialogLabel}>
                {actionType === 'approve' && 'Komentarz (opcjonalny):'}
                {actionType === 'reject' && 'Powód odrzucenia:'}
                {actionType === 'revision' && 'Wymagane poprawki:'}
              </label>
              <textarea
                value={approvalComments}
                onChange={e => setApprovalComments(e.target.value)}
                className={styles.dialogTextarea}
                rows={4}
                placeholder={
                  actionType === 'approve'
                    ? 'Dodaj komentarz...'
                    : actionType === 'reject'
                    ? 'Opisz powody odrzucenia...'
                    : 'Opisz wymagane poprawki...'
                }
              />
            </div>

            <div className={styles.dialogActions}>
              <button
                onClick={() => setShowApprovalDialog(false)}
                className={styles.dialogCancel}
              >
                Anuluj
              </button>
              <button
                onClick={handleApprovalSubmit}
                className={`${styles.dialogConfirm} ${
                  actionType === 'approve'
                    ? styles.confirmApprove
                    : actionType === 'reject'
                    ? styles.confirmReject
                    : styles.confirmRevision
                }`}
              >
                {actionType === 'approve' && 'Zatwierdź'}
                {actionType === 'reject' && 'Odrzuć'}
                {actionType === 'revision' && 'Zażądaj Poprawek'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
