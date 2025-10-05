import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to complete dashboard
    router.replace('/complete-dashboard');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', margin: '0 0 1rem 0' }}>🤖</h1>
        <h2 style={{ fontSize: '24px', margin: '0 0 0.5rem 0' }}>
          ThinkCode AI Platform
        </h2>
        <p style={{ fontSize: '16px', opacity: 0.8, margin: 0 }}>Loading...</p>
      </div>
    </div>
  );
}
