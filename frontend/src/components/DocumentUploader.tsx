import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import './DocumentUploader.css';

interface DocumentUploaderProps {
  onDocumentsUploaded: (documents: File[]) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onDocumentsUploaded
}) => {
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    if (files.length > 0) {
      onDocumentsUploaded(files);
    }
  };

  return (
    <div className="document-uploader">
      <h2>📤 Upload Documentation</h2>
      <p>Upload your project documentation files to analyze and generate tasks</p>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="dropzone-icon">📁</div>
          {isDragActive ? (
            <p>Drop the files here...</p>
          ) : (
            <div>
              <p>Drag & drop documentation files here, or click to select</p>
              <p className="file-types">Supports: PDF, DOC/DOCX, TXT, MD</p>
            </div>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="uploaded-files">
          <h3>📋 Uploaded Files ({files.length})</h3>
          <ul className="file-list">
            {files.map((file, index) => (
              <li key={index} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">
                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="remove-button"
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="uploader-actions">
        <button
          onClick={handleContinue}
          disabled={files.length === 0}
          className="continue-button primary"
        >
          Continue to Configuration →
        </button>
      </div>
    </div>
  );
};