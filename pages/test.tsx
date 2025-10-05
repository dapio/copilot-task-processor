import React, { useState, useEffect } from 'react';
import { BackendIntegrationPanel } from '../src/components/BackendIntegrationPanel';

export default function TestPage() {
  const [healthStatus, setHealthStatus] = useState<string>('Checking...');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testHealthCheck = async () => {
    setHealthStatus('Testing...');
    setError(null);

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (response.ok) {
        setHealthStatus('✅ Backend Connected!');
        setApiResponse(data);
      } else {
        setHealthStatus('❌ Backend Error');
        setError(`HTTP ${response.status}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      setHealthStatus('❌ Connection Failed');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    testHealthCheck();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔧 ThinkCode AI Platform - Connection Test</h1>

      {/* New Backend Integration Panel */}
      <BackendIntegrationPanel />

      {/* Original Simple Test Below */}
      <hr style={{ margin: '30px 0', borderColor: '#ddd' }} />

      <div style={{ marginBottom: '20px' }}>
        <h2>Backend Connection Status:</h2>
        <p
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: healthStatus.includes('✅')
              ? 'green'
              : healthStatus.includes('❌')
                ? 'red'
                : 'orange',
          }}
        >
          {healthStatus}
        </p>
      </div>

      {apiResponse && (
        <div style={{ marginBottom: '20px' }}>
          <h3>API Response:</h3>
          <pre
            style={{
              background: '#f5f5f5',
              padding: '10px',
              borderRadius: '5px',
              overflow: 'auto',
            }}
          >
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Error Details:</h3>
          <pre
            style={{
              background: '#ffeeee',
              padding: '10px',
              borderRadius: '5px',
              color: 'red',
              overflow: 'auto',
            }}
          >
            {error}
          </pre>
        </div>
      )}

      <div>
        <button
          onClick={testHealthCheck}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          🔄 Test Connection Again
        </button>
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>
          <strong>Frontend:</strong> http://localhost:3001 (Next.js)
        </p>
        <p>
          <strong>Backend:</strong> http://localhost:3002 (Express.js)
        </p>
        <p>
          <strong>Proxy:</strong> /api/* → http://localhost:3002/api/*
        </p>
      </div>
    </div>
  );
}
