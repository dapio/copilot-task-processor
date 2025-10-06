/**
 * Workflow Admin Panel Component - Simplified Version
 * ThinkCode AI Platform - Administrative Interface
 */

import { useState } from 'react';
import { useAdmin, useWorkflowSessions } from '../hooks/useAdmin';
import styles from '../styles/admin.module.css';

export default function WorkflowAdminPanel() {
  const {
    isConnected,
    isLoading,
    error: adminError,
    statistics,
    checkConnection,
    refreshStatistics,
  } = useAdmin();

  const {
    sessions,
    currentSession,
    isLoadingSessions,
    isCreatingSession,
    isSendingMessage,
    isGenerating,
    isFinalizing,
    error: sessionError,
    createSession,
    loadSession,
    sendMessage,
    generateWorkflow,
    finalizeWorkflow,
    clearCurrentSession,
    clearError,
  } = useWorkflowSessions();

  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [message, setMessage] = useState('');

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return;

    const sessionId = await createSession({
      title: newSessionTitle,
      createdBy: 'Admin User',
    });

    if (sessionId) {
      setNewSessionTitle('');
      await loadSession(sessionId);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !currentSession) return;

    const success = await sendMessage(currentSession.id, message);
    if (success) {
      setMessage('');
    }
  };

  if (isLoading) {
    return (
      <div className={styles['admin-loading']}>
        <div className={styles['admin-loading-icon']}>⏳</div>
        <p>Łączenie z systemem administracyjnym...</p>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={styles['admin-error']}>
        <div className={styles['admin-error-icon']}>⚠️</div>
        <h3>Błąd połączenia</h3>
        <p>
          {adminError || 'Nie można nawiązać połączenia z API administracyjnym'}
        </p>
        <button
          onClick={checkConnection}
          className={styles['admin-retry-button']}
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className={styles['admin-container']}>
      {/* Header */}
      <div className={styles['admin-header']}>
        <h1 className={styles['admin-title']}>🔧 Workflow Admin Panel</h1>
        <p className={styles['admin-subtitle']}>
          Panel administracyjny do zarządzania workflow i zadaniami
        </p>
      </div>

      {/* Statistics Dashboard */}
      {statistics && (
        <div className={styles['admin-stats-grid']}>
          <div className={styles['admin-stat-card']}>
            <h4 className={styles['admin-stat-title']}>Agenci</h4>
            <div className={`${styles['admin-stat-value']} ${styles.agents}`}>
              {statistics.activeAgents}/{statistics.totalAgents}
            </div>
            <small className={styles['admin-stat-label']}>
              Aktywni/Wszystkich
            </small>
          </div>

          <div className={styles['admin-stat-card']}>
            <h4 className={styles['admin-stat-title']}>Projekty</h4>
            <div className={`${styles['admin-stat-value']} ${styles.projects}`}>
              {statistics.activeProjects}/{statistics.totalProjects}
            </div>
            <small className={styles['admin-stat-label']}>
              Aktywne/Wszystkie
            </small>
          </div>

          <div className={styles['admin-stat-card']}>
            <h4 className={styles['admin-stat-title']}>Sesje</h4>
            <div className={`${styles['admin-stat-value']} ${styles.sessions}`}>
              {statistics.activeSessions}/{statistics.totalSessions}
            </div>
            <small className={styles['admin-stat-label']}>
              Aktywne/Wszystkie
            </small>
          </div>

          <div
            className={`${styles['admin-stat-card']} ${styles['admin-refresh-container']}`}
          >
            <button
              onClick={refreshStatistics}
              className={styles['admin-refresh-button']}
            >
              🔄 Odśwież
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(adminError || sessionError) && (
        <div className={styles['admin-error-alert']}>
          <span>⚠️ {adminError || sessionError}</span>
          <button onClick={clearError} className={styles['admin-error-close']}>
            ×
          </button>
        </div>
      )}

      <div className={styles['admin-main-grid']}>
        {/* Sessions List */}
        <div>
          <h3>📋 Sesje Workflow</h3>

          {/* Create New Session */}
          <div className={styles['admin-create-session']}>
            <input
              type="text"
              value={newSessionTitle}
              onChange={e => setNewSessionTitle(e.target.value)}
              placeholder="Tytuł nowej sesji..."
              className={styles['admin-session-input']}
              onKeyPress={e => e.key === 'Enter' && handleCreateSession()}
            />
            <button
              onClick={handleCreateSession}
              disabled={isCreatingSession || !newSessionTitle.trim()}
              className={`${styles['admin-create-button']} ${
                isCreatingSession ? styles.creating : styles.ready
              }`}
            >
              {isCreatingSession ? '⏳ Tworzenie...' : '➕ Utwórz sesję'}
            </button>
          </div>

          {/* Sessions List */}
          <div className={styles['admin-sessions-list']}>
            {isLoadingSessions ? (
              <div className={styles['admin-sessions-loading']}>
                ⏳ Ładowanie sesji...
              </div>
            ) : sessions.length === 0 ? (
              <div className={styles['admin-sessions-empty']}>
                Brak sesji. Utwórz pierwszą sesję powyżej.
              </div>
            ) : (
              sessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => loadSession(session.id)}
                  className={`${styles['admin-session-item']} ${
                    currentSession?.id === session.id ? styles.active : ''
                  }`}
                >
                  <div className={styles['admin-session-title']}>
                    {session.title}
                  </div>
                  <div className={styles['admin-session-meta']}>
                    Status: {session.status} | {session.messages?.length || 0}{' '}
                    wiadomości
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Session Chat */}
        <div>
          {currentSession ? (
            <div>
              {/* Chat Header */}
              <div className={styles['admin-chat-header']}>
                <div className={styles['admin-chat-info']}>
                  <h3>💬 {currentSession.title}</h3>
                  <small className={styles['admin-chat-meta']}>
                    Utworzona:{' '}
                    {new Date(currentSession.createdAt).toLocaleString()}
                  </small>
                </div>
                <div className={styles['admin-chat-actions']}>
                  <button
                    onClick={() => generateWorkflow(currentSession.id)}
                    disabled={isGenerating}
                    className={`${styles['admin-action-button']} ${styles.generate} ${
                      isGenerating ? styles.loading : ''
                    }`}
                  >
                    {isGenerating ? '⏳' : '🔧'} Generuj
                  </button>
                  <button
                    onClick={() =>
                      finalizeWorkflow(currentSession.id, {
                        approvedBy: 'Admin User',
                        notes: 'Workflow approved and finalized',
                      })
                    }
                    disabled={isFinalizing}
                    className={`${styles['admin-action-button']} ${styles.finalize} ${
                      isFinalizing ? styles.loading : ''
                    }`}
                  >
                    {isFinalizing ? '⏳' : '✅'} Finalizuj
                  </button>
                  <button
                    onClick={clearCurrentSession}
                    className={`${styles['admin-action-button']} ${styles.close}`}
                  >
                    ❌ Zamknij
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className={styles['admin-messages-container']}>
                {!currentSession.messages ||
                currentSession.messages.length === 0 ? (
                  <div className={styles['admin-messages-empty']}>
                    Brak wiadomości w tej sesji. Rozpocznij rozmowę poniżej.
                  </div>
                ) : (
                  currentSession.messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`${styles['admin-message']} ${styles[msg.type]}`}
                    >
                      <div className={styles['admin-message-header']}>
                        <span>
                          {msg.type === 'user'
                            ? '👤 Użytkownik'
                            : '🤖 Asystent'}
                        </span>
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div>{msg.message}</div>
                      {msg.response && (
                        <div className={styles['admin-message-response']}>
                          {msg.response}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className={styles['admin-input-container']}>
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Napisz wiadomość..."
                  className={styles['admin-message-input']}
                  onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !message.trim()}
                  className={`${styles['admin-send-button']} ${
                    isSendingMessage ? styles.sending : styles.ready
                  }`}
                >
                  {isSendingMessage ? '⏳' : '📤'} Wyślij
                </button>
              </div>
            </div>
          ) : (
            <div className={styles['admin-placeholder']}>
              <div className={styles['admin-placeholder-icon']}>💼</div>
              <h3>Wybierz sesję</h3>
              <p>
                Kliknij na sesję z listy po lewej stronie, aby rozpocząć pracę.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
