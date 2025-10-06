/**
 * Workflow Admin Panel - Standalone Application
 * Separate Next.js app for workflow administration
 * Port: 4000
 */

import { useEffect, useState } from 'react';
import WorkflowAdminPanel from '../components/WorkflowAdminPanel';
import styles from '../styles/loading.module.css';

interface AdminConfig {
  apiBaseUrl: string;
  agentsApiUrl: string;
  version: string;
  environment: string;
}

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Alternative approach with window check
    if (typeof window !== 'undefined') {
      try {
        const adminConfig: AdminConfig = {
          apiBaseUrl: 'http://localhost:3002',
          agentsApiUrl: 'http://localhost:3006',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
        };

        // Set admin configuration on window for global access
        (globalThis as any).__ADMIN_CONFIG__ = adminConfig;
      } catch (error) {
        console.error('Failed to set admin configuration:', error);
      }
    }
  }, []);

  if (!mounted) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <div className={styles.loadingIcon}>🔧</div>
          <h2 className={styles.loadingTitle}>Workflow Admin Panel</h2>
          <p className={styles.loadingText}>
            Loading administrative interface...
          </p>
        </div>
      </div>
    );
  }

  return <WorkflowAdminPanel />;
}
