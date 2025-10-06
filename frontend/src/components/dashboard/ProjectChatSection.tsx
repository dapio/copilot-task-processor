import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageSquare,
  Bot,
  User,
  Paperclip,
  MoreVertical,
} from 'lucide-react';
import styles from '../../styles/project-details-dashboard.module.css';

interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    type: 'user' | 'agent';
  };
  timestamp: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  read?: boolean;
}

interface ProjectChatSectionProps {
  projectChatMessages: ChatMessage[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onMarkAsRead?: (messageId: string) => void;
  loading?: boolean;
}

export const ProjectChatSection: React.FC<ProjectChatSectionProps> = ({
  projectChatMessages,
  onSendMessage,
  onMarkAsRead,
  loading = false,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectChatMessages]);

  const handleSendMessage = () => {
    if (newMessage.trim() || attachments.length > 0) {
      onSendMessage(newMessage, attachments);
      setNewMessage('');
      setAttachments([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else {
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  const getUnreadCount = () => {
    return projectChatMessages.filter(
      msg => !msg.read && msg.sender.type === 'agent'
    ).length;
  };

  return (
    <div className={styles.chatSection}>
      <div className={styles.chatHeader}>
        <div className={styles.chatTitle}>
          <MessageSquare size={20} />
          <h2>Chat projektu</h2>
          {getUnreadCount() > 0 && (
            <span className={styles.unreadBadge}>{getUnreadCount()}</span>
          )}
        </div>
        <button
          className={styles.chatOptionsButton}
          title="Opcje chatu"
          aria-label="Opcje chatu"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      <div className={styles.chatMessages}>
        {projectChatMessages.length === 0 ? (
          <div className={styles.emptyChatState}>
            <MessageSquare size={48} />
            <p>Brak wiadomości</p>
            <span>Rozpocznij konwersację z zespołem projektu</span>
          </div>
        ) : (
          <>
            {projectChatMessages.map(message => (
              <div
                key={message.id}
                className={`${styles.chatMessage} ${
                  styles[message.sender.type]
                } ${!message.read ? styles.unread : ''}`}
                onClick={() => !message.read && onMarkAsRead?.(message.id)}
              >
                <div className={styles.messageAvatar}>
                  {message.sender.type === 'agent' ? (
                    <Bot size={20} />
                  ) : (
                    <User size={20} />
                  )}
                </div>

                <div className={styles.messageContent}>
                  <div className={styles.messageHeader}>
                    <span className={styles.senderName}>
                      {message.sender.name}
                    </span>
                    <span className={styles.messageTime}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>

                  <div className={styles.messageBody}>
                    <p>{message.content}</p>

                    {message.attachments && message.attachments.length > 0 && (
                      <div className={styles.messageAttachments}>
                        {message.attachments.map((attachment, index) => (
                          <div key={index} className={styles.attachment}>
                            <Paperclip size={14} />
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {attachment.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className={styles.chatInput}>
        {attachments.length > 0 && (
          <div className={styles.attachmentPreview}>
            {attachments.map((file, index) => (
              <div key={index} className={styles.attachmentItem}>
                <Paperclip size={14} />
                <span>{file.name}</span>
                <button
                  onClick={() => removeAttachment(index)}
                  className={styles.removeAttachment}
                  title="Usuń załącznik"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.inputContainer}>
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Napisz wiadomość..."
            className={styles.messageInput}
            rows={1}
            disabled={loading}
          />

          <div className={styles.inputActions}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className={styles.hiddenFileInput}
              title="Wybierz pliki do załączenia"
              aria-label="Wybierz pliki do załączenia"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className={styles.attachButton}
              title="Dodaj załącznik"
              disabled={loading}
            >
              <Paperclip size={18} />
            </button>

            <button
              onClick={handleSendMessage}
              disabled={
                (!newMessage.trim() && attachments.length === 0) || loading
              }
              className={styles.sendButton}
              title="Wyślij wiadomość"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
