/**
 * Loading Spinner - Komponent ładowania
 * @description Uniwersalny komponent wyświetlający loading spinner
 */

import React, { memo } from 'react';
import { Loader2 } from 'lucide-react';
import styles from '../../styles/loading-spinner.module.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner = memo<LoadingSpinnerProps>(
  ({ message = 'Ładowanie...', size = 'medium' }) => {
    return (
      <div className={`${styles.container} ${styles[size]}`}>
        <Loader2 className={styles.spinner} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';
