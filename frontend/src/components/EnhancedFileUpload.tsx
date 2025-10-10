/**
 * Enhanced File Upload Component using Limitless Dropzone
 * Supports images, documents, and multiple file types with beautiful UI
 */

import React, { useEffect, useRef, useState } from 'react';
import { Upload, X, FileText, Image, AlertCircle } from 'lucide-react';
import styles from '../styles/enhanced-file-upload.module.css';

// Import Dropzone library (would need to be added to project)
declare global {
  interface Window {
    Dropzone: any;
  }
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  category: 'document' | 'mockup' | 'input' | 'analysis';
}

interface EnhancedFileUploadProps {
  projectId: string;
  stepId?: string;
  acceptedFiles?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  multiple?: boolean;
  uploadUrl: string;
  onFilesUploaded: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  className?: string;
  title?: string;
  description?: string;
  showPreview?: boolean;
}

export default function EnhancedFileUpload({
  projectId,
  stepId,
  acceptedFiles = 'image/*,.pdf,.doc,.docx,.txt,.md,.zip',
  maxFiles = 10,
  maxFileSize = 10, // 10MB default
  multiple = true,
  uploadUrl,
  onFilesUploaded,
  onError,
  className = '',
  title = 'Prześlij pliki',
  description = 'Przeciągnij pliki tutaj lub kliknij aby wybrać',
  showPreview = true,
}: EnhancedFileUploadProps) {
  const dropzoneRef = useRef<HTMLFormElement>(null);
  const [dropzoneInstance, setDropzoneInstance] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Load Dropzone CSS and JS if not already loaded
    loadDropzoneAssets();
  }, []);

  const loadDropzoneAssets = async () => {
    // Load Dropzone CSS
    if (!document.querySelector('link[href*="dropzone"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/limitless/assets/css/dropzone.min.css';
      document.head.appendChild(link);
    }

    // Load Dropzone JS
    if (!window.Dropzone) {
      return new Promise(resolve => {
        const script = document.createElement('script');
        script.src = '/limitless/assets/js/vendor/uploaders/dropzone.min.js';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
  };

  useEffect(() => {
    const initializeDropzone = () => {
      if (!dropzoneRef.current || dropzoneInstance) return;

      const dzInstance = new window.Dropzone(dropzoneRef.current, {
        url: uploadUrl,
        paramName: 'files',
        maxFilesize: maxFileSize,
        maxFiles: multiple ? maxFiles : 1,
        acceptedFiles: acceptedFiles,
        dictDefaultMessage: `
        <div class="${styles.dropzoneMessage}">
          <div class="${styles.dropzoneIcon}">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10,9 9,9 8,9"/>
            </svg>
          </div>
          <div class="${styles.dropzoneText}">
            <div class="${styles.dropzoneTitle}">${title}</div>
            <div class="${styles.dropzoneDesc}">${description}</div>
            <div class="${styles.dropzoneFormats}">
              Obsługiwane formaty: ${acceptedFiles
                .replace(/\*/g, '')
                .toUpperCase()}
            </div>
          </div>
        </div>
      `,
        dictFallbackMessage:
          'Twoja przeglądarka nie obsługuje przeciągania plików.',
        dictFileTooBig:
          'Plik jest za duży ({{filesize}}MB). Maksymalny rozmiar: {{maxFilesize}}MB.',
        dictInvalidFileType: 'Nieprawidłowy typ pliku.',
        dictResponseError: 'Błąd serwera ({{statusCode}}).',
        dictCancelUpload: 'Anuluj',
        dictCancelUploadConfirmation: 'Czy na pewno chcesz anulować upload?',
        dictRemoveFile: 'Usuń',
        dictMaxFilesExceeded: 'Nie możesz przesłać więcej plików.',
        addRemoveLinks: true,
        previewTemplate: getPreviewTemplate(),

        // Events
        init: function () {
          const dz = this;

          // Set project and step context
          dz.on('sending', (file: any, xhr: any, formData: any) => {
            setIsUploading(true);
            formData.append('projectId', projectId);
            if (stepId) {
              formData.append('stepId', stepId);
            }
          });

          dz.on('success', (file: any, response: any) => {
            console.log('File uploaded successfully:', response);
            if (response.success && response.data) {
              const uploadedFile: UploadedFile = {
                id: response.data.id,
                name: file.name,
                size: file.size,
                type: file.type,
                url: response.data.url,
                category: response.data.category || 'input',
              };

              setUploadedFiles(prev => [...prev, uploadedFile]);
              onFilesUploaded([uploadedFile]);
            }
          });

          dz.on('error', (file: any, errorMessage: any) => {
            console.error('Upload error:', errorMessage);
            const error =
              typeof errorMessage === 'string'
                ? errorMessage
                : errorMessage.message || 'Upload failed';
            onError?.(error);
          });

          dz.on('queuecomplete', () => {
            setIsUploading(false);
          });

          dz.on('removedfile', (file: any) => {
            if (file.uploadedFileId) {
              setUploadedFiles(prev =>
                prev.filter(f => f.id !== file.uploadedFileId)
              );
            }
          });
        },
      });

      setDropzoneInstance(dzInstance);
    };

    if (dropzoneRef.current && window.Dropzone && !dropzoneInstance) {
      initializeDropzone();
    }

    return () => {
      if (dropzoneInstance) {
        dropzoneInstance.destroy();
      }
    };
  }, [dropzoneInstance]);

  const getPreviewTemplate = () => {
    return `
      <div class="dz-preview dz-file-preview">
        <div class="dz-image">
          <img data-dz-thumbnail />
        </div>
        <div class="dz-details">
          <div class="dz-size"><span data-dz-size></span></div>
          <div class="dz-filename"><span data-dz-name></span></div>
        </div>
        <div class="dz-progress">
          <span class="dz-upload" data-dz-uploadprogress></span>
        </div>
        <div class="dz-error-message"><span data-dz-errormessage></span></div>
        <div class="dz-success-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m9 12 2 2 4-4"/>
          </svg>
        </div>
        <div class="dz-error-mark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <div class="dz-remove" data-dz-remove>Usuń</div>
      </div>
    `;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image size={20} className={styles.fileIcon} />;
    }
    return <FileText size={20} className={styles.fileIcon} />;
  };

  return (
    <div className={`${styles.uploadContainer} ${className}`}>
      {/* Dropzone */}
      <form
        ref={dropzoneRef}
        className={`${styles.dropzone} ${isUploading ? styles.uploading : ''}`}
        action={uploadUrl}
        method="post"
        encType="multipart/form-data"
      >
        {/* Dropzone content will be replaced by Dropzone.js */}
        <div className={styles.fallbackMessage}>
          <Upload size={48} />
          <p>{title}</p>
          <p>{description}</p>
          <input type="file" multiple={multiple} accept={acceptedFiles} />
        </div>
      </form>

      {/* Upload Status */}
      {isUploading && (
        <div className={styles.uploadStatus}>
          <div className={styles.uploadProgress}>
            <div className={styles.spinner}></div>
            <span>Przesyłanie plików...</span>
          </div>
        </div>
      )}

      {/* File Preview List (if enabled) */}
      {showPreview && uploadedFiles.length > 0 && (
        <div className={styles.filesList}>
          <h4 className={styles.filesTitle}>
            Przesłane pliki ({uploadedFiles.length})
          </h4>
          <div className={styles.filesGrid}>
            {uploadedFiles.map(file => (
              <div key={file.id} className={styles.fileCard}>
                <div className={styles.filePreview}>
                  {getFileIcon(file.type)}
                </div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  <div className={styles.fileCategory}>{file.category}</div>
                </div>
                <button
                  className={styles.removeFileBtn}
                  onClick={() => {
                    setUploadedFiles(prev =>
                      prev.filter(f => f.id !== file.id)
                    );
                  }}
                  title="Usuń plik"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className={styles.helpText}>
        <AlertCircle size={16} />
        <span>
          Maksymalny rozmiar pliku: {maxFileSize}MB. Maksymalna liczba plików:{' '}
          {maxFiles}. Obsługiwane formaty: {acceptedFiles.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
