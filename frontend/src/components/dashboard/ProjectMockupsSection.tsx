import React, { useState } from 'react';
import {
  FileImage,
  Eye,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Download,
  MoreVertical,
  Plus,
} from 'lucide-react';
import styles from '../../styles/project-details-dashboard.module.css';

interface Mockup {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  uploadedBy: string;
  uploadedAt: string;
  comments: Array<{
    id: string;
    content: string;
    author: string;
    timestamp: string;
  }>;
  approvals: Array<{
    userId: string;
    userName: string;
    status: 'approved' | 'rejected';
    timestamp: string;
    comment?: string;
  }>;
}

interface ProjectMockupsSectionProps {
  projectMockups: Mockup[];
  onUploadMockup?: (files: File[]) => void;
  onMockupAction?: (
    mockupId: string,
    action: 'approve' | 'reject' | 'comment' | 'delete'
  ) => void;
  onMockupSelect?: (mockupId: string) => void;
  loading?: boolean;
}

export const ProjectMockupsSection: React.FC<ProjectMockupsSectionProps> = ({
  projectMockups,
  onUploadMockup,
  onMockupAction,
  onMockupSelect,
  // loading = false - TODO: Use for upload states
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'review':
        return 'orange';
      case 'draft':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return React.createElement(ThumbsUp, {
          size: 16,
          className: styles.statusApproved,
        });
      case 'rejected':
        return React.createElement(ThumbsDown, {
          size: 16,
          className: styles.statusRejected,
        });
      case 'review':
        return React.createElement(Eye, {
          size: 16,
          className: styles.statusReview,
        });
      case 'draft':
        return React.createElement(FileImage, {
          size: 16,
          className: styles.statusDraft,
        });
      default:
        return React.createElement(FileImage, { size: 16 });
    }
  };

  const filteredMockups = projectMockups.filter(
    mockup => filterStatus === 'all' || mockup.status === filterStatus
  );

  const getStatusStats = () => {
    const stats = projectMockups.reduce((acc, mockup) => {
      acc[mockup.status] = (acc[mockup.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: projectMockups.length,
      draft: stats.draft || 0,
      review: stats.review || 0,
      approved: stats.approved || 0,
      rejected: stats.rejected || 0,
    };
  };

  const mockupStats = getStatusStats();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onUploadMockup?.(files);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  return (
    <div className={styles.mockupsSection}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <h2>Mockupy i akceptacje</h2>
          <div className={styles.mockupStats}>
            <span className={styles.stat}>
              <span className={styles.statValue}>{mockupStats.total}</span>
              <span className={styles.statLabel}>Wszystkie</span>
            </span>
            <span className={styles.stat}>
              <span className={`${styles.statValue} ${styles.approved}`}>
                {mockupStats.approved}
              </span>
              <span className={styles.statLabel}>Zatwierdzone</span>
            </span>
            <span className={styles.stat}>
              <span className={`${styles.statValue} ${styles.review}`}>
                {mockupStats.review}
              </span>
              <span className={styles.statLabel}>Do przeglądu</span>
            </span>
            <span className={styles.stat}>
              <span className={`${styles.statValue} ${styles.draft}`}>
                {mockupStats.draft}
              </span>
              <span className={styles.statLabel}>Wersje robocze</span>
            </span>
          </div>
        </div>

        <div className={styles.headerActions}>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
            title="Filtruj mockupy"
          >
            <option value="all">Wszystkie</option>
            <option value="draft">Wersje robocze</option>
            <option value="review">Do przeglądu</option>
            <option value="approved">Zatwierdzone</option>
            <option value="rejected">Odrzucone</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewButton} ${
                viewMode === 'grid' ? styles.active : ''
              }`}
              onClick={() => setViewMode('grid')}
              title="Widok siatki"
            >
              <div className={styles.gridIcon} />
            </button>
            <button
              className={`${styles.viewButton} ${
                viewMode === 'list' ? styles.active : ''
              }`}
              onClick={() => setViewMode('list')}
              title="Widok listy"
            >
              <div className={styles.listIcon} />
            </button>
          </div>

          <label className={styles.uploadButton}>
            <input
              type="file"
              multiple
              accept="image/*,.pdf,.sketch,.fig"
              onChange={handleFileUpload}
              className={styles.hiddenFileInput}
            />
            <Plus size={16} />
            Dodaj mockup
          </label>
        </div>
      </div>

      {filteredMockups.length === 0 ? (
        <div className={styles.emptyState}>
          <FileImage size={48} />
          <h3>
            {filterStatus === 'all'
              ? 'Brak mockupów'
              : `Brak mockupów: ${filterStatus}`}
          </h3>
          <p>
            {filterStatus === 'all'
              ? 'Dodaj pierwszy mockup do projektu'
              : 'Zmień filtr aby zobaczyć inne mockupy'}
          </p>
        </div>
      ) : (
        <div className={`${styles.mockupsList} ${styles[viewMode]}`}>
          {filteredMockups.map(mockup => (
            <div
              key={mockup.id}
              className={`${styles.mockupCard} ${styles[mockup.status]}`}
              onClick={() => onMockupSelect?.(mockup.id)}
            >
              <div className={styles.mockupPreview}>
                {/* TODO: Replace with Next.js Image component for optimization */}
                <img
                  src={mockup.imageUrl}
                  alt={mockup.name}
                  className={styles.mockupImage}
                />
                <div className={styles.mockupOverlay}>
                  <button className={styles.viewButton} title="Zobacz mockup">
                    <Eye size={20} />
                  </button>
                </div>
              </div>

              <div className={styles.mockupInfo}>
                <div className={styles.mockupHeader}>
                  <h4>{mockup.name}</h4>
                  <span className={styles.mockupVersion}>
                    v{mockup.version}
                  </span>
                </div>

                <div className={styles.mockupMeta}>
                  <span
                    className={`${styles.mockupStatus} ${
                      styles[getStatusColor(mockup.status)]
                    }`}
                  >
                    {getStatusIcon(mockup.status)}
                    {mockup.status}
                  </span>
                  <span className={styles.mockupDate}>
                    {formatDate(mockup.uploadedAt)}
                  </span>
                </div>

                {mockup.description && (
                  <p className={styles.mockupDescription}>
                    {mockup.description}
                  </p>
                )}

                <div className={styles.mockupStats}>
                  <span className={styles.statItem}>
                    <MessageSquare size={14} />
                    {mockup.comments.length}
                  </span>
                  <span className={styles.statItem}>
                    <ThumbsUp size={14} />
                    {
                      mockup.approvals.filter(a => a.status === 'approved')
                        .length
                    }
                  </span>
                  <span className={styles.statItem}>
                    <ThumbsDown size={14} />
                    {
                      mockup.approvals.filter(a => a.status === 'rejected')
                        .length
                    }
                  </span>
                </div>
              </div>

              <div className={styles.mockupActions}>
                {mockup.status === 'review' && (
                  <>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onMockupAction?.(mockup.id, 'approve');
                      }}
                      className={styles.approveButton}
                      title="Zatwierdź mockup"
                    >
                      <ThumbsUp size={16} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onMockupAction?.(mockup.id, 'reject');
                      }}
                      className={styles.rejectButton}
                      title="Odrzuć mockup"
                    >
                      <ThumbsDown size={16} />
                    </button>
                  </>
                )}

                <button
                  onClick={e => {
                    e.stopPropagation();
                    onMockupAction?.(mockup.id, 'comment');
                  }}
                  className={styles.commentButton}
                  title="Dodaj komentarz"
                >
                  <MessageSquare size={16} />
                </button>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    // TODO: Download mockup
                  }}
                  className={styles.downloadButton}
                  title="Pobierz mockup"
                >
                  <Download size={16} />
                </button>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    // TODO: More options menu
                  }}
                  className={styles.moreButton}
                  title="Więcej opcji"
                >
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
