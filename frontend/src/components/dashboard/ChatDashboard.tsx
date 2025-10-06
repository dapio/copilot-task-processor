/**
 * Chat Dashboard - System komunikacji projektu
 * @description Panel do zarządzania konwersacjami i komunikacją z agentami
 */

import React, { memo } from 'react';
import { MessageSquare, Users, Bot, Clock, Send } from 'lucide-react';
import type {
  ConversationData,
  ProjectData,
} from '../../types/dashboard.types';
import styles from '../../styles/dashboard-chat.module.css';

interface ChatDashboardProps {
  conversations: ConversationData[];
  selectedProject: ProjectData | null;
  onSelectConversation: (conversation: ConversationData) => void;
}

export const ChatDashboard = memo<ChatDashboardProps>(
  ({ conversations, selectedProject, onSelectConversation }) => {
    return (
      <div className={styles.chatDashboard}>
        <div className={styles.header}>
          <h2>Komunikacja</h2>
          <div className={styles.stats}>
            <span>{conversations.length} konwersacji</span>
            <span>•</span>
            <span>
              {conversations.filter(c => c.unreadCount > 0).length}{' '}
              nieprzeczytanych
            </span>
          </div>
        </div>

        <div className={styles.content}>
          {/* Conversations List */}
          <div className={styles.conversationsList}>
            <h3>Konwersacje</h3>
            {conversations.length === 0 ? (
              <div className={styles.emptyState}>
                <MessageSquare size={48} />
                <p>Brak konwersacji</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={styles.conversationItem}
                  onClick={() => onSelectConversation(conv)}
                >
                  <div className={styles.convInfo}>
                    <h4>{conv.title}</h4>
                    <p>{conv.lastMessage}</p>
                    <div className={styles.convMeta}>
                      <Users size={14} />
                      <span>{conv.participants.length} uczestników</span>
                      <Clock size={14} />
                      <span>{new Date(conv.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className={styles.unreadBadge}>{conv.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <button className={styles.actionButton}>
              <Bot size={20} />
              Nowa konwersacja z agentem
            </button>
            <button className={styles.actionButton}>
              <MessageSquare size={20} />
              Chat projektowy
            </button>
          </div>
        </div>
      </div>
    );
  }
);

ChatDashboard.displayName = 'ChatDashboard';
