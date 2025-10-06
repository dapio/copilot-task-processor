import React from 'react';
import dynamic from 'next/dynamic';
import styles from './HomePage.module.css';

// Dynamically import EnterpriseDashboard to avoid SSR issues
const EnterpriseDashboard = dynamic(
  () =>
    import('../src/components/EnterpriseDashboard').then(mod => ({
      default: mod.default,
    })),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loadingContainer}>
        Ładowanie ThinkCode AI Platform...
      </div>
    ),
  }
);

export default function HomePage() {
  return <EnterpriseDashboard />;
}
