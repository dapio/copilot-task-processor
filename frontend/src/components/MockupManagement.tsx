import { useState, useEffect } from 'react';
import React from 'react';
import styles from '../styles/management-components.module.css';

interface MockupData {
  id: string;
  name: string;
  type: 'component' | 'page' | 'layout' | 'dataset' | 'api';
  description: string;
  status: 'active' | 'inactive' | 'draft';
  category: string;
  content: Record<string, any>;
  createdAt: Date;
  lastModified: Date;
  usageCount: number;
  tags: string[];
  previewUrl?: string;
  size: number; // in KB
}

interface MockupManagementProps {
  projectId: string;
}

export default function MockupManagement({ projectId }: MockupManagementProps) {
  const [mockups, setMockups] = useState<MockupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMockup, setSelectedMockup] = useState<MockupData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadMockups();
  }, [projectId]);

  const loadMockups = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const mockData: MockupData[] = [
        {
          id: '1',
          name: 'User Dashboard Layout',
          type: 'layout',
          description:
            'Responsywny layout dla panelu użytkownika z nawigacją boczną i obszarem głównym.',
          status: 'active',
          category: 'UI Components',
          content: {
            structure: 'sidebar + main',
            responsive: true,
            theme: 'dark',
            components: ['Header', 'Sidebar', 'MainContent', 'Footer'],
          },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          usageCount: 23,
          tags: ['Layout', 'Dashboard', 'Responsive'],
          previewUrl: '/mockups/dashboard-preview.png',
          size: 45.2,
        },
        {
          id: '2',
          name: 'Product Card Component',
          type: 'component',
          description:
            'Interaktywna karta produktu z obrazem, tytułem, opisem i przyciskami akcji.',
          status: 'active',
          category: 'E-commerce',
          content: {
            props: ['title', 'description', 'price', 'image', 'onAddToCart'],
            variants: ['default', 'compact', 'featured'],
            animations: true,
          },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          lastModified: new Date(Date.now() - 4 * 60 * 60 * 1000),
          usageCount: 67,
          tags: ['Component', 'Product', 'E-commerce'],
          size: 12.8,
        },
        {
          id: '3',
          name: 'User API Dataset',
          type: 'dataset',
          description:
            'Zestaw mockowych danych użytkowników do testowania i prototypowania.',
          status: 'active',
          category: 'Data',
          content: {
            users: 150,
            fields: ['id', 'name', 'email', 'avatar', 'role', 'createdAt'],
            formats: ['JSON', 'CSV'],
            realistic: true,
          },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          usageCount: 34,
          tags: ['Dataset', 'Users', 'Testing'],
          size: 89.1,
        },
        {
          id: '4',
          name: 'Login Page Mockup',
          type: 'page',
          description:
            'Kompletny mockup strony logowania z formularzem i opcjami społecznościowymi.',
          status: 'draft',
          category: 'Authentication',
          content: {
            forms: ['email-password', 'social-login'],
            validation: true,
            responsive: true,
            accessibility: true,
          },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          usageCount: 8,
          tags: ['Page', 'Login', 'Form'],
          previewUrl: '/mockups/login-preview.png',
          size: 28.5,
        },
        {
          id: '5',
          name: 'Weather API Mock',
          type: 'api',
          description:
            'Symulowane API pogodowe z realistycznymi danymi i różnymi endpointami.',
          status: 'inactive',
          category: 'External APIs',
          content: {
            endpoints: ['/current', '/forecast', '/historical'],
            cities: 50,
            dataPoints: ['temperature', 'humidity', 'pressure', 'wind'],
            updateFrequency: '15min',
          },
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          lastModified: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
          usageCount: 12,
          tags: ['API', 'Weather', 'External'],
          size: 156.7,
        },
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setMockups(mockData);
    } catch (error) {
      console.error('Error loading mockups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMockup = async (mockupData: Partial<MockupData>) => {
    // TODO: Replace with actual API call
    const newMockup: MockupData = {
      id: Date.now().toString(),
      name: mockupData.name || 'Nowy mockup',
      type: mockupData.type || 'component',
      description: mockupData.description || '',
      status: 'draft',
      category: mockupData.category || 'General',
      content: mockupData.content || {},
      createdAt: new Date(),
      lastModified: new Date(),
      usageCount: 0,
      tags: mockupData.tags || [],
      size: Math.round(Math.random() * 100 + 10), // Random size for demo
    };

    setMockups(prev => [newMockup, ...prev]);
    setShowCreateModal(false);
  };

  const handleDeleteMockup = async (mockupId: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten mockup?')) {
      setMockups(prev => prev.filter(mockup => mockup.id !== mockupId));
    }
  };

  const handleToggleStatus = async (mockupId: string) => {
    setMockups(prev =>
      prev.map(mockup =>
        mockup.id === mockupId
          ? {
              ...mockup,
              status: mockup.status === 'active' ? 'inactive' : 'active',
              lastModified: new Date(),
            }
          : mockup
      )
    );
  };

  const handleDuplicateMockup = async (mockupId: string) => {
    const original = mockups.find(m => m.id === mockupId);
    if (original) {
      const duplicate: MockupData = {
        ...original,
        id: Date.now().toString(),
        name: `${original.name} (kopia)`,
        createdAt: new Date(),
        lastModified: new Date(),
        usageCount: 0,
        status: 'draft',
      };

      setMockups(prev => [duplicate, ...prev]);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'component':
        return '🧩';
      case 'page':
        return '📄';
      case 'layout':
        return '🗂️';
      case 'dataset':
        return '📊';
      case 'api':
        return '🔌';
      default:
        return '📦';
    }
  };

  const filteredMockups = mockups.filter(mockup => {
    const matchesSearch =
      mockup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mockup.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mockup.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mockup.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesType = filterType === 'all' || mockup.type === filterType;
    const matchesStatus =
      filterStatus === 'all' || mockup.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const mockupTypes = ['component', 'page', 'layout', 'dataset', 'api'];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}>🎨</div>
        <p className={styles.loadingText}>Ładowanie mockupów...</p>
      </div>
    );
  }

  return (
    <div className={styles.managementContainer}>
      {/* Header */}
      <div className={styles.managementHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Szukaj mockupów..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <span className={styles.searchIcon}>🔍</span>
          </div>
          <div className={styles.filtersContainer}>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className={styles.filterSelect}
              title="Filtruj według typu"
            >
              <option value="all">Wszystkie typy</option>
              {mockupTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
              title="Filtruj według statusu"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="active">Aktywne</option>
              <option value="inactive">Nieaktywne</option>
              <option value="draft">Wersje robocze</option>
            </select>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statsContainer}>
            <div className={styles.statBadge} data-status="active">
              <span className={styles.statNumber}>
                {mockups.filter(m => m.status === 'active').length}
              </span>
              <span className={styles.statLabel}>Aktywne</span>
            </div>
            <div className={styles.statBadge} data-status="inactive">
              <span className={styles.statNumber}>
                {mockups.filter(m => m.status === 'draft').length}
              </span>
              <span className={styles.statLabel}>Robocze</span>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
            title="Utwórz nowy mockup"
          >
            <span className={styles.buttonIcon}>➕</span>
            Nowy Mockup
          </button>
        </div>
      </div>

      {/* Mockups Grid */}
      {filteredMockups.length > 0 ? (
        <div className={styles.itemsGrid}>
          {filteredMockups.map(mockup => (
            <div
              key={mockup.id}
              className={styles.itemCard}
              data-status={mockup.status}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <span className={styles.itemIcon}>
                    {getTypeIcon(mockup.type)}
                  </span>
                  <span className={styles.itemName}>{mockup.name}</span>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleDuplicateMockup(mockup.id)}
                    className={styles.duplicateButton}
                    title="Duplikuj mockup"
                  >
                    📋
                  </button>
                  <button
                    onClick={() => handleToggleStatus(mockup.id)}
                    className={styles.statusToggle}
                    data-status={mockup.status}
                    title={
                      mockup.status === 'active'
                        ? 'Dezaktywuj mockup'
                        : 'Aktywuj mockup'
                    }
                  >
                    {mockup.status === 'active' ? '⏸️' : '▶️'}
                  </button>
                  <button
                    onClick={() => setSelectedMockup(mockup)}
                    className={styles.editButton}
                    title="Zobacz szczegóły"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleDeleteMockup(mockup.id)}
                    className={styles.deleteButton}
                    title="Usuń mockup"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.itemMeta}>
                  <span className={styles.itemType}>{mockup.type}</span>
                  <span className={styles.lastUsed}>
                    Ostatnia modyfikacja:{' '}
                    {mockup.lastModified.toLocaleDateString('pl-PL')}
                  </span>
                </div>

                <p className={styles.itemDescription}>{mockup.description}</p>

                {mockup.previewUrl && (
                  <div className={styles.previewContainer}>
                    <div className={styles.previewPlaceholder}>
                      <span className={styles.previewIcon}>🖼️</span>
                      <span className={styles.previewLabel}>
                        Podgląd dostępny
                      </span>
                    </div>
                  </div>
                )}

                <div className={styles.mockupStats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Kategoria:</span>
                    <span className={styles.statValue}>{mockup.category}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Użycia:</span>
                    <span className={styles.statValue}>
                      {mockup.usageCount}
                    </span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Rozmiar:</span>
                    <span className={styles.statValue}>
                      {mockup.size.toFixed(1)} KB
                    </span>
                  </div>
                </div>

                {mockup.tags.length > 0 && (
                  <div className={styles.tagsList}>
                    {mockup.tags.map(tag => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <div className={styles.configInfo}>
                  <span className={styles.configLabel}>Utworzony:</span>
                  <span className={styles.configCount}>
                    {mockup.createdAt.toLocaleDateString('pl-PL')}
                  </span>
                </div>
                <div
                  className={styles.statusIndicator}
                  data-status={mockup.status}
                >
                  {mockup.status === 'active' && '🟢 Aktywny'}
                  {mockup.status === 'inactive' && '⭕ Nieaktywny'}
                  {mockup.status === 'draft' && '📝 Wersja robocza'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎨</div>
          <h3 className={styles.emptyTitle}>Brak mockupów</h3>
          <p className={styles.emptyDescription}>
            {searchTerm || filterType !== 'all' || filterStatus !== 'all'
              ? 'Nie znaleziono mockupów pasujących do wybranych filtrów'
              : 'Nie masz jeszcze żadnych mockupów w tym projekcie. Utwórz swój pierwszy mockup, aby rozpocząć prototypowanie.'}
          </p>
          {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className={styles.emptyAction}
            >
              Utwórz pierwszy mockup
            </button>
          )}
        </div>
      )}

      {/* Create Mockup Modal */}
      {showCreateModal && (
        <CreateMockupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateMockup}
        />
      )}

      {/* Mockup Details Modal */}
      {selectedMockup && (
        <MockupDetailsModal
          mockup={selectedMockup}
          onClose={() => setSelectedMockup(null)}
        />
      )}
    </div>
  );
}

// Create Mockup Modal Component
interface CreateMockupModalProps {
  onClose: () => void;
  onCreate: (data: Partial<MockupData>) => void;
}

function CreateMockupModal({ onClose, onCreate }: CreateMockupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'component' as MockupData['type'],
    description: '',
    category: 'General',
    tags: [] as string[],
    content: {},
  });
  const [currentTag, setCurrentTag] = useState('');

  const mockupTypes: MockupData['type'][] = [
    'component',
    'page',
    'layout',
    'dataset',
    'api',
  ];
  const categories = [
    'General',
    'UI Components',
    'E-commerce',
    'Data',
    'Authentication',
    'Navigation',
    'Forms',
    'External APIs',
  ];

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()],
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onCreate(formData);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Utwórz nowy mockup</h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            title="Zamknij"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="mockup-name" className={styles.formLabel}>
              Nazwa mockupu
            </label>
            <input
              id="mockup-name"
              type="text"
              value={formData.name}
              onChange={e =>
                setFormData(prev => ({ ...prev, name: e.target.value }))
              }
              className={styles.formInput}
              placeholder="Wprowadź nazwę mockupu..."
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="mockup-type" className={styles.formLabel}>
                Typ mockupu
              </label>
              <select
                id="mockup-type"
                value={formData.type}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    type: e.target.value as MockupData['type'],
                  }))
                }
                className={styles.formSelect}
              >
                {mockupTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="mockup-category" className={styles.formLabel}>
                Kategoria
              </label>
              <select
                id="mockup-category"
                value={formData.category}
                onChange={e =>
                  setFormData(prev => ({ ...prev, category: e.target.value }))
                }
                className={styles.formSelect}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="mockup-description" className={styles.formLabel}>
              Opis
            </label>
            <textarea
              id="mockup-description"
              value={formData.description}
              onChange={e =>
                setFormData(prev => ({ ...prev, description: e.target.value }))
              }
              className={styles.formTextarea}
              placeholder="Opisz mockup i jego przeznaczenie..."
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tagi</label>
            <div className={styles.tagInput}>
              <input
                type="text"
                value={currentTag}
                onChange={e => setCurrentTag(e.target.value)}
                className={styles.formInput}
                placeholder="Dodaj tag..."
                onKeyPress={e =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddTag())
                }
              />
              <button
                type="button"
                onClick={handleAddTag}
                className={styles.addTagButton}
                title="Dodaj tag"
              >
                ➕
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className={styles.tagsList}>
                {formData.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={styles.removeTag}
                      title="Usuń tag"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
            >
              Anuluj
            </button>
            <button type="submit" className={styles.submitButton}>
              Utwórz mockup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Mockup Details Modal Component
interface MockupDetailsModalProps {
  mockup: MockupData;
  onClose: () => void;
}

function MockupDetailsModal({ mockup, onClose }: MockupDetailsModalProps) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            Szczegóły mockupu: {mockup.name}
          </h3>
          <button
            onClick={onClose}
            className={styles.closeButton}
            title="Zamknij"
          >
            ✕
          </button>
        </div>

        <div className={styles.taskDetails}>
          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Podstawowe informacje</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Typ:</span>
                <span className={styles.detailValue}>{mockup.type}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status:</span>
                <span className={styles.detailValue}>{mockup.status}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Kategoria:</span>
                <span className={styles.detailValue}>{mockup.category}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Rozmiar:</span>
                <span className={styles.detailValue}>
                  {mockup.size.toFixed(1)} KB
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Opis</h4>
            <p className={styles.taskDescription}>{mockup.description}</p>
          </div>

          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Statystyki użycia</h4>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Liczba użyć:</span>
                <span className={styles.detailValue}>{mockup.usageCount}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Utworzony:</span>
                <span className={styles.detailValue}>
                  {mockup.createdAt.toLocaleDateString('pl-PL')}
                </span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>
                  Ostatnia modyfikacja:
                </span>
                <span className={styles.detailValue}>
                  {mockup.lastModified.toLocaleDateString('pl-PL')}
                </span>
              </div>
            </div>
          </div>

          <div className={styles.detailSection}>
            <h4 className={styles.sectionTitle}>Zawartość</h4>
            <pre className={styles.resultsCode}>
              {JSON.stringify(mockup.content, null, 2)}
            </pre>
          </div>

          {mockup.tags.length > 0 && (
            <div className={styles.detailSection}>
              <h4 className={styles.sectionTitle}>Tagi</h4>
              <div className={styles.tagsList}>
                {mockup.tags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
