/**
 * Provider Configuration Management Component
 * Zarządzanie konfiguracją AI providerów
 */

import React, { useState, useEffect } from 'react';
import styles from './ProviderConfig.module.css';

interface ProviderConfig {
  id: string;
  providerId: string;
  name: string;
  apiKey?: string;
  apiKeyDecrypted?: string;
  apiUrl?: string;
  modelName?: string;
  isEnabled: boolean;
  priority: number;
  maxTokens?: number;
  temperature?: number;
  config?: any;
  createdAt: string;
  updatedAt: string;
}

export const ProviderConfigManager: React.FC = () => {
  const [configs, setConfigs] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<ProviderConfig | null>(
    null
  );
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadConfigs();
    initializeDefaults();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/provider-config');
      const data = await response.json();
      if (data.success) {
        setConfigs(data.data);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaults = async () => {
    try {
      await fetch('/api/provider-config/init-defaults', { method: 'POST' });
      setTimeout(loadConfigs, 500); // Reload after init
    } catch (error) {
      console.error('Error initializing defaults:', error);
    }
  };

  const updateConfig = async (config: ProviderConfig) => {
    try {
      const response = await fetch(`/api/provider-config/${config.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        loadConfigs();
        setEditingConfig(null);
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const toggleEnabled = async (config: ProviderConfig) => {
    await updateConfig({ ...config, isEnabled: !config.isEnabled });
  };

  const toggleApiKeyVisibility = (providerId: string) => {
    setShowApiKey(prev => ({
      ...prev,
      [providerId]: !prev[providerId],
    }));
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        ⏳ Ładowanie konfiguracji providerów...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>🤖 Konfiguracja AI Providerów</h2>
        <p>Zarządzanie tokenami i ustawieniami dla providerów AI</p>
      </div>

      <div className={styles.configs}>
        {configs
          .sort((a, b) => a.priority - b.priority)
          .map(config => (
            <div
              key={config.id}
              className={`${styles.configCard} ${
                config.isEnabled ? styles.enabled : styles.disabled
              }`}
            >
              <div className={styles.configHeader}>
                <div className={styles.configInfo}>
                  <h3>{config.name}</h3>
                  <span className={styles.providerId}>{config.providerId}</span>
                  <span className={styles.priority}>
                    Priority: {config.priority}
                  </span>
                </div>
                <div className={styles.configActions}>
                  <button
                    className={`${styles.toggleBtn} ${
                      config.isEnabled ? styles.enabled : styles.disabled
                    }`}
                    onClick={() => toggleEnabled(config)}
                  >
                    {config.isEnabled ? '✅ Aktywny' : '❌ Nieaktywny'}
                  </button>
                  <button
                    className={styles.editBtn}
                    onClick={() => setEditingConfig(config)}
                  >
                    ⚙️ Edytuj
                  </button>
                </div>
              </div>

              <div className={styles.configDetails}>
                {config.apiKeyDecrypted && (
                  <div className={styles.apiKeyRow}>
                    <label>API Key:</label>
                    <div className={styles.apiKeyField}>
                      <input
                        type={
                          showApiKey[config.providerId] ? 'text' : 'password'
                        }
                        value={config.apiKeyDecrypted}
                        readOnly
                        className={styles.apiKeyInput}
                      />
                      <button
                        className={styles.showBtn}
                        onClick={() =>
                          toggleApiKeyVisibility(config.providerId)
                        }
                      >
                        {showApiKey[config.providerId] ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                )}

                {config.modelName && (
                  <div className={styles.detail}>
                    <label>Model:</label>
                    <span>{config.modelName}</span>
                  </div>
                )}

                {config.maxTokens && (
                  <div className={styles.detail}>
                    <label>Max Tokens:</label>
                    <span>{config.maxTokens}</span>
                  </div>
                )}

                {config.temperature !== undefined && (
                  <div className={styles.detail}>
                    <label>Temperature:</label>
                    <span>{config.temperature}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {editingConfig && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>✏️ Edytuj {editingConfig.name}</h3>
              <button
                className={styles.closeBtn}
                onClick={() => setEditingConfig(null)}
              >
                ❌
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                updateConfig(editingConfig);
              }}
            >
              <div className={styles.formGroup}>
                <label>API Key:</label>
                <input
                  type="password"
                  value={editingConfig.apiKeyDecrypted || ''}
                  onChange={e =>
                    setEditingConfig({
                      ...editingConfig,
                      apiKeyDecrypted: e.target.value,
                      apiKey: e.target.value,
                    })
                  }
                  placeholder="Wprowadź API key..."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Model:</label>
                <input
                  type="text"
                  value={editingConfig.modelName || ''}
                  onChange={e =>
                    setEditingConfig({
                      ...editingConfig,
                      modelName: e.target.value,
                    })
                  }
                  placeholder="np. gpt-4o-mini"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Priority:</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editingConfig.priority}
                  onChange={e =>
                    setEditingConfig({
                      ...editingConfig,
                      priority: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Max Tokens:</label>
                <input
                  type="number"
                  value={editingConfig.maxTokens || ''}
                  onChange={e =>
                    setEditingConfig({
                      ...editingConfig,
                      maxTokens: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className={styles.formGroup}>
                <label>Temperature:</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={editingConfig.temperature || ''}
                  onChange={e =>
                    setEditingConfig({
                      ...editingConfig,
                      temperature: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <div className={styles.formActions}>
                <button type="submit" className={styles.saveBtn}>
                  💾 Zapisz
                </button>
                <button
                  type="button"
                  onClick={() => setEditingConfig(null)}
                  className={styles.cancelBtn}
                >
                  ❌ Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
