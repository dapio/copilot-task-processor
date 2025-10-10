import { useState, useEffect } from 'react';
import React from 'react';
import styles from '../styles/configuration.module.css';

interface ConfigurationSection {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: ConfigurationSetting[];
}

interface ConfigurationSetting {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'json' | 'password';
  value: any;
  defaultValue: any;
  options?: string[];
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  category: string;
}

interface ConfigurationProps {
  projectId: string;
}

export default function Configuration({ projectId }: ConfigurationProps) {
  const [sections, setSections] = useState<ConfigurationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('platform');
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, [projectId]);

  const loadConfiguration = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockSections: ConfigurationSection[] = [
        {
          id: 'platform',
          name: 'Ustawienia Platformy',
          description: 'Podstawowa konfiguracja platformy ThinkCode AI',
          icon: '⚙️',
          settings: [
            {
              id: 'platform.name',
              name: 'Nazwa Platformy',
              description:
                'Wyświetlana nazwa platformy w interfejsie użytkownika',
              type: 'text',
              value: 'ThinkCode AI Platform',
              defaultValue: 'ThinkCode AI Platform',
              required: true,
              category: 'general',
            },
            {
              id: 'platform.theme',
              name: 'Motyw',
              description: 'Domyślny motyw interfejsu użytkownika',
              type: 'select',
              value: 'dark',
              defaultValue: 'dark',
              options: ['light', 'dark', 'auto'],
              category: 'appearance',
            },
            {
              id: 'platform.language',
              name: 'Język',
              description: 'Domyślny język interfejsu',
              type: 'select',
              value: 'pl',
              defaultValue: 'pl',
              options: ['pl', 'en', 'de', 'fr'],
              category: 'localization',
            },
            {
              id: 'platform.enableAnalytics',
              name: 'Włącz Analitykę',
              description: 'Zbieranie danych analitycznych dla optymalizacji',
              type: 'boolean',
              value: true,
              defaultValue: true,
              category: 'privacy',
            },
          ],
        },
        {
          id: 'project',
          name: 'Ustawienia Projektu',
          description: 'Konfiguracja specyficzna dla tego projektu',
          icon: '📁',
          settings: [
            {
              id: 'project.name',
              name: 'Nazwa Projektu',
              description: 'Nazwa tego projektu',
              type: 'text',
              value: 'Copilot Task Processor',
              defaultValue: 'Nowy Projekt',
              required: true,
              category: 'general',
            },
            {
              id: 'project.description',
              name: 'Opis Projektu',
              description: 'Szczegółowy opis projektu',
              type: 'text',
              value: 'System przetwarzania zadań z wykorzystaniem AI',
              defaultValue: '',
              category: 'general',
            },
            {
              id: 'project.autoSave',
              name: 'Automatyczne Zapisywanie',
              description:
                'Częstotliwość automatycznego zapisywania (w minutach)',
              type: 'number',
              value: 5,
              defaultValue: 5,
              validation: { min: 1, max: 60 },
              category: 'workflow',
            },
            {
              id: 'project.enableNotifications',
              name: 'Powiadomienia',
              description: 'Włącz powiadomienia o statusie zadań',
              type: 'boolean',
              value: true,
              defaultValue: true,
              category: 'notifications',
            },
          ],
        },
        {
          id: 'ai',
          name: 'Ustawienia AI',
          description: 'Konfiguracja sztucznej inteligencji i agentów',
          icon: '🤖',
          settings: [
            {
              id: 'ai.defaultProvider',
              name: 'Domyślny Provider',
              description: 'Główny dostawca AI dla wszystkich agentów',
              type: 'select',
              value: 'groq',
              defaultValue: 'groq',
              options: ['groq', 'openai', 'anthropic', 'google'],
              category: 'provider',
            },
            {
              id: 'ai.groq.apiKey',
              name: 'Groq API Key',
              description:
                'Klucz API dla Groq (darmowy, zarejestruj się na console.groq.com)',
              type: 'password',
              value: '',
              defaultValue: '',
              required: false,
              category: 'authentication',
            },
            {
              id: 'ai.openai.apiKey',
              name: 'OpenAI API Key',
              description: 'Klucz API dla OpenAI',
              type: 'password',
              value: '',
              defaultValue: '',
              required: false,
              category: 'authentication',
            },
            {
              id: 'ai.anthropic.apiKey',
              name: 'Anthropic API Key',
              description: 'Klucz API dla Anthropic Claude',
              type: 'password',
              value: '',
              defaultValue: '',
              required: false,
              category: 'authentication',
            },
            {
              id: 'ai.google.apiKey',
              name: 'Google AI API Key',
              description: 'Klucz API dla Google AI',
              type: 'password',
              value: '',
              defaultValue: '',
              required: false,
              category: 'authentication',
            },
            {
              id: 'ai.maxTokens',
              name: 'Maksymalne Tokeny',
              description: 'Limit tokenów dla pojedynczego zapytania',
              type: 'number',
              value: 4096,
              defaultValue: 4096,
              validation: { min: 100, max: 32000 },
              category: 'limits',
            },
            {
              id: 'ai.temperature',
              name: 'Temperatura',
              description: 'Kontrola kreatywności odpowiedzi AI (0.0 - 2.0)',
              type: 'number',
              value: 0.7,
              defaultValue: 0.7,
              validation: { min: 0, max: 2 },
              category: 'behavior',
            },
            {
              id: 'ai.fallbackProvider',
              name: 'Provider Fallback',
              description: 'Provider używany gdy główny nie jest dostępny',
              type: 'select',
              value: 'groq',
              defaultValue: 'groq',
              options: ['groq', 'openai', 'anthropic', 'google'],
              category: 'provider',
            },
            {
              id: 'ai.groq.defaultModel',
              name: 'Groq: Domyślny Model',
              description: 'Model używany w Groq',
              type: 'select',
              value: 'llama-3.1-70b-versatile',
              defaultValue: 'llama-3.1-70b-versatile',
              options: [
                'llama-3.1-70b-versatile',
                'llama-3.1-8b-instant',
                'mixtral-8x7b-32768',
                'gemma2-9b-it',
              ],
              category: 'models',
            },
            {
              id: 'ai.enableFallback',
              name: 'Automatyczny Fallback',
              description:
                'Automatycznie przełączaj na fallback gdy główny provider nie działa',
              type: 'boolean',
              value: true,
              defaultValue: true,
              category: 'behavior',
            },
            {
              id: 'ai.enableMemory',
              name: 'Pamięć Kontekstowa',
              description: 'Włącz zapamiętywanie kontekstu między sesjami',
              type: 'boolean',
              value: true,
              defaultValue: true,
              category: 'memory',
            },
          ],
        },
        {
          id: 'security',
          name: 'Bezpieczeństwo',
          description: 'Ustawienia bezpieczeństwa i prywatności',
          icon: '🔒',
          settings: [
            {
              id: 'security.encryptData',
              name: 'Szyfrowanie Danych',
              description: 'Szyfruj dane wrażliwe w bazie danych',
              type: 'boolean',
              value: true,
              defaultValue: true,
              category: 'encryption',
            },
            {
              id: 'security.sessionTimeout',
              name: 'Timeout Sesji',
              description: 'Czas wygaśnięcia sesji w minutach',
              type: 'number',
              value: 60,
              defaultValue: 60,
              validation: { min: 5, max: 480 },
              category: 'session',
            },
            {
              id: 'security.auditLog',
              name: 'Log Audytu',
              description: 'Włącz szczegółowe logowanie działań',
              type: 'boolean',
              value: false,
              defaultValue: false,
              category: 'logging',
            },
            {
              id: 'security.allowedOrigins',
              name: 'Dozwolone Domeny',
              description: 'Lista dozwolonych domen (JSON array)',
              type: 'json',
              value: '["localhost:3000", "localhost:3001"]',
              defaultValue: '["localhost:3000"]',
              category: 'cors',
            },
          ],
        },
        {
          id: 'performance',
          name: 'Wydajność',
          description: 'Optymalizacja wydajności systemu',
          icon: '⚡',
          settings: [
            {
              id: 'performance.cacheSize',
              name: 'Rozmiar Cache',
              description: 'Maksymalny rozmiar cache w MB',
              type: 'number',
              value: 512,
              defaultValue: 256,
              validation: { min: 64, max: 2048 },
              category: 'cache',
            },
            {
              id: 'performance.maxConcurrentTasks',
              name: 'Maksymalne Równoległe Zadania',
              description: 'Liczba zadań wykonywanych równolegle',
              type: 'number',
              value: 5,
              defaultValue: 3,
              validation: { min: 1, max: 20 },
              category: 'concurrency',
            },
            {
              id: 'performance.enableCompression',
              name: 'Kompresja Odpowiedzi',
              description: 'Włącz kompresję odpowiedzi HTTP',
              type: 'boolean',
              value: true,
              defaultValue: true,
              category: 'optimization',
            },
            {
              id: 'performance.logLevel',
              name: 'Poziom Logowania',
              description: 'Szczegółowość logów systemowych',
              type: 'select',
              value: 'info',
              defaultValue: 'info',
              options: ['error', 'warn', 'info', 'debug', 'trace'],
              category: 'logging',
            },
          ],
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      setSections(mockSections);
    } catch (error) {
      console.error('Error loading configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (settingId: string, value: any) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [settingId]: value,
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update sections with new values
      setSections(prev =>
        prev.map(section => ({
          ...section,
          settings: section.settings.map(setting => ({
            ...setting,
            value:
              unsavedChanges[setting.id] !== undefined
                ? unsavedChanges[setting.id]
                : setting.value,
          })),
        }))
      );

      setUnsavedChanges({});

      // Show success message
      alert('Konfiguracja została zapisana pomyślnie!');
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Błąd podczas zapisywania konfiguracji!');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (
      window.confirm(
        'Czy na pewno chcesz przywrócić ustawienia domyślne? Wszystkie niezapisane zmiany zostaną utracone.'
      )
    ) {
      setSections(prev =>
        prev.map(section => ({
          ...section,
          settings: section.settings.map(setting => ({
            ...setting,
            value: setting.defaultValue,
          })),
        }))
      );
      setUnsavedChanges({});
    }
  };

  const handleExportConfig = () => {
    const config: Record<string, any> = {};
    sections.forEach(section => {
      section.settings.forEach(setting => {
        const value =
          unsavedChanges[setting.id] !== undefined
            ? unsavedChanges[setting.id]
            : setting.value;
        config[setting.id] = value;
      });
    });

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `config-${projectId}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const currentSection = sections.find(s => s.id === selectedSection);

  const filteredSettings =
    currentSection?.settings.filter(
      setting =>
        setting.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setting.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>⚙️</div>
        <p className={styles.loadingText}>Ładowanie konfiguracji...</p>
      </div>
    );
  }

  return (
    <div className={styles.configurationContainer}>
      {/* Header */}
      <div className={styles.configHeader}>
        <div className={styles.headerLeft}>
          <h2 className={styles.configTitle}>Konfiguracja Systemu</h2>
          <p className={styles.configDescription}>
            Zarządzaj ustawieniami platformy i projektu
          </p>
        </div>
        <div className={styles.headerRight}>
          <button
            onClick={handleExportConfig}
            className={styles.exportButton}
            title="Eksportuj konfigurację"
          >
            💾 Eksportuj
          </button>
          <button
            onClick={handleResetToDefaults}
            className={styles.resetButton}
            title="Przywróć domyślne"
          >
            🔄 Domyślne
          </button>
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className={styles.saveButton}
              title="Zapisz zmiany"
            >
              {saving ? '💾 Zapisywanie...' : '💾 Zapisz'}
            </button>
          )}
        </div>
      </div>

      <div className={styles.configContent}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Szukaj ustawień..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>

          <div className={styles.sectionsList}>
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`${styles.sectionButton} ${
                  selectedSection === section.id ? styles.active : ''
                }`}
                title={section.description}
              >
                <span className={styles.sectionIcon}>{section.icon}</span>
                <span className={styles.sectionName}>{section.name}</span>
                {section.settings.some(
                  s => unsavedChanges[s.id] !== undefined
                ) && <span className={styles.changedIndicator}>●</span>}
              </button>
            ))}
          </div>

          <div className={styles.sidebarFooter}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={styles.advancedToggle}
              title="Pokaż zaawansowane ustawienia"
            >
              {showAdvanced ? '👁️‍🗨️' : '👁️'} {showAdvanced ? 'Ukryj' : 'Pokaż'}{' '}
              zaawansowane
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {currentSection && (
            <>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionInfo}>
                  <span className={styles.sectionIconLarge}>
                    {currentSection.icon}
                  </span>
                  <div>
                    <h3 className={styles.sectionTitle}>
                      {currentSection.name}
                    </h3>
                    <p className={styles.sectionDesc}>
                      {currentSection.description}
                    </p>
                  </div>
                </div>
                {hasUnsavedChanges && (
                  <div className={styles.unsavedIndicator}>
                    <span className={styles.unsavedIcon}>⚠️</span>
                    <span className={styles.unsavedText}>
                      Niezapisane zmiany
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.settingsGrid}>
                {filteredSettings.map(setting => (
                  <SettingItem
                    key={setting.id}
                    setting={setting}
                    value={
                      unsavedChanges[setting.id] !== undefined
                        ? unsavedChanges[setting.id]
                        : setting.value
                    }
                    onChange={value => handleSettingChange(setting.id, value)}
                    showAdvanced={showAdvanced}
                  />
                ))}
              </div>

              {filteredSettings.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>🔍</div>
                  <h3 className={styles.emptyTitle}>Brak wyników</h3>
                  <p className={styles.emptyDescription}>
                    Nie znaleziono ustawień pasujących do frazy &quot;
                    {searchTerm}&quot;
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Setting Item Component
interface SettingItemProps {
  setting: ConfigurationSetting;
  value: any;
  onChange: (value: any) => void;
  showAdvanced: boolean;
}

function SettingItem({
  setting,
  value,
  onChange,
  showAdvanced,
}: SettingItemProps) {
  const isAdvanced =
    setting.category === 'advanced' ||
    setting.category === 'logging' ||
    setting.category === 'cors';

  if (isAdvanced && !showAdvanced) {
    return null;
  }

  const renderInput = () => {
    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={styles.settingInput}
            placeholder={setting.defaultValue || 'Wprowadź wartość...'}
            required={setting.required}
            title={setting.description}
          />
        );

      case 'password':
        return (
          <input
            type="password"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={styles.settingInput}
            placeholder="Wprowadź hasło..."
            required={setting.required}
            title={setting.description}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            className={styles.settingInput}
            min={setting.validation?.min}
            max={setting.validation?.max}
            step={
              setting.validation?.min !== undefined &&
              setting.validation.min < 1
                ? '0.1'
                : '1'
            }
            required={setting.required}
            title={setting.description}
            placeholder={
              setting.defaultValue?.toString() || 'Wprowadź liczbę...'
            }
          />
        );

      case 'boolean':
        return (
          <label className={styles.switchContainer} title={setting.description}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={e => onChange(e.target.checked)}
              className={styles.switchInput}
              title={setting.description}
              placeholder="Toggle"
            />
            <span className={styles.switchSlider}></span>
          </label>
        );

      case 'select':
        return (
          <select
            value={value || setting.defaultValue}
            onChange={e => onChange(e.target.value)}
            className={styles.settingSelect}
            required={setting.required}
            title={setting.description}
          >
            {setting.options?.map(option => (
              <option key={option} value={option}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </option>
            ))}
          </select>
        );

      case 'json':
        return (
          <textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className={styles.settingTextarea}
            placeholder={setting.defaultValue}
            rows={3}
            required={setting.required}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`${styles.settingItem} ${isAdvanced ? styles.advanced : ''}`}
    >
      <div className={styles.settingInfo}>
        <label className={styles.settingLabel}>
          {setting.name}
          {setting.required && <span className={styles.requiredMark}>*</span>}
          {isAdvanced && (
            <span className={styles.advancedMark}>ZAAWANSOWANE</span>
          )}
        </label>
        <p className={styles.settingDescription}>{setting.description}</p>
      </div>
      <div className={styles.settingControl}>
        {renderInput()}
        <div className={styles.settingMeta}>
          <span className={styles.settingCategory}>{setting.category}</span>
          {setting.defaultValue !== undefined && (
            <span className={styles.defaultValue}>
              Domyślnie:{' '}
              {typeof setting.defaultValue === 'boolean'
                ? setting.defaultValue
                  ? 'Tak'
                  : 'Nie'
                : setting.defaultValue.toString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
