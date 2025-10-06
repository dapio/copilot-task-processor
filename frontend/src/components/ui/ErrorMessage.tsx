/**
 * Error Message - Komponent błędu
 * @description Wyświetla komunikat błędu z możliwością ponowienia akcji
 */

import React, { memo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import styles from '../../styles/error-message.module.css';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  actionLabel?: string;
}

export const ErrorMessage = memo<ErrorMessageProps>(
  ({ message, onRetry, actionLabel = 'Spróbuj ponownie' }) => {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          {React.createElement(AlertCircle, { className: styles.icon })}
          <div className={styles.text}>
            <h3>Wystąpił błąd</h3>
            <p>{message}</p>
          </div>
          {onRetry && (
            <button className={styles.retryButton} onClick={onRetry}>
              {React.createElement(RefreshCw, { size: 16 })}
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    );
  }
);

ErrorMessage.displayName = 'ErrorMessage';
