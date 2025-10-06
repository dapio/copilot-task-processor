/**
 * Mockups Dashboard - Zarządzanie mockupami
 * @description Panel do zarządzania mockupami i ich akceptacją
 */

import React, { memo } from 'react';
import { FileImage } from 'lucide-react';
import type { ProjectData } from '../../types/dashboard.types';
import styles from '../../styles/dashboard-mockups.module.css';

interface MockupsDashboardProps {
  projects: ProjectData[];
}

export const MockupsDashboard = memo<MockupsDashboardProps>(({ projects }) => {
  return (
    <div className={styles.mockupsDashboard}>
      <div className={styles.header}>
        <h2>Zarządzanie Mockupami</h2>
        <div className={styles.stats}>
          <span>{projects.length} projektów</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.emptyState}>
          <FileImage size={64} />
          <h3>Mockupy w przygotowaniu</h3>
          <p>System mockupów zostanie wkrótce uruchomiony</p>
        </div>
      </div>
    </div>
  );
});

MockupsDashboard.displayName = 'MockupsDashboard';
