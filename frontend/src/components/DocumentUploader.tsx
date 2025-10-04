import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadedDocument } from '../types/app.types';

interface DocumentUploaderProps {
  documents: UploadedDocument[];
  onDocumentsUploaded: (documents: UploadedDocument[]) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents: existingDocs,
  onDocumentsUploaded
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>(existingDocs);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocs: UploadedDocument[] = acceptedFiles.map(file => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'uploaded'
    }));
    
    setDocuments(prev => [...prev, ...newDocs]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeDocuments = async () => {
    setIsAnalyzing(true);
    
    try {
      // Quick analysis to show document types and content preview
      const analyzedDocs = await Promise.all(
        documents.map(async (doc) => {
          // Basic analysis - in real implementation, this would be more sophisticated
          const preview = await getDocumentPreview(doc.file);
          return {
            ...doc,
            preview,
            status: 'analyzed' as const,
            contentType: detectContentType(doc.name, preview)
          };
        })
      );
      
      setDocuments(analyzedDocs);
      onDocumentsUploaded(analyzedDocs);
    } catch (error) {
      console.error('Document analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getDocumentPreview = async (file: File): Promise<string> => {
    if (file.type.startsWith('text/')) {
      const text = await file.text();
      return text.substring(0, 500) + (text.length > 500 ? '...' : '');
    }
    return `${file.type} file - ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  };

  const detectContentType = (fileName: string, preview: string): string => {
    const name = fileName.toLowerCase();
    const content = preview.toLowerCase();
    
    if (name.includes('requirement') || content.includes('requirement')) return 'requirements';
    if (name.includes('spec') || content.includes('specification')) return 'specification';
    if (name.includes('design') || content.includes('design')) return 'design';
    if (name.includes('user') && name.includes('story')) return 'user-stories';
    if (name.includes('api') || content.includes('endpoint')) return 'api-documentation';
    if (name.includes('business') || content.includes('business')) return 'business-rules';
    
    return 'general';
  };

  const getFileTypeIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📑';
    if (type.includes('text') || type.includes('markdown')) return '📃';
    return '📁';
  };

  const getContentTypeColor = (contentType: string) => {
    const colors = {
      'requirements': '#e74c3c',
      'specification': '#3498db',
      'design': '#9b59b6',
      'user-stories': '#2ecc71',
      'api-documentation': '#f39c12',
      'business-rules': '#34495e',
      'general': '#95a5a6'
    };
    return colors[contentType as keyof typeof colors] || colors.general;
  };

  return (
    <div className="document-uploader">
      <div className="uploader-header">
        <h1>📤 Document Upload & Analysis</h1>
        <p>Upload your project documentation for AI-powered analysis and task generation</p>
      </div>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          <div className="dropzone-icon">📁</div>
          {isDragActive ? (
            <div>
              <h3>Drop the files here...</h3>
              <p>Release to upload your documents</p>
            </div>
          ) : (
            <div>
              <h3>Drag & drop documentation files</h3>
              <p>or click to select files</p>
              <div className="supported-formats">
                <strong>Supported formats:</strong> PDF, DOC/DOCX, TXT, MD, XLS/XLSX, PPT/PPTX
              </div>
              <div className="upload-limits">
                Max file size: 50MB | Multiple files supported
              </div>
            </div>
          )}
        </div>
      </div>

      {documents.length > 0 && (
        <div className="uploaded-documents">
          <h2>📋 Uploaded Documents ({documents.length})</h2>
          
          <div className="document-list">
            {documents.map((doc, index) => (
              <div key={index} className="document-item">
                <div className="document-info">
                  <div className="document-header">
                    <span className="file-icon">{getFileTypeIcon(doc.type)}</span>
                    <span className="file-name">{doc.name}</span>
                    <span 
                      className="content-type-badge"
                      style={{ backgroundColor: getContentTypeColor(doc.contentType || 'general') }}
                    >
                      {doc.contentType || 'general'}
                    </span>
                    <button
                      onClick={() => removeDocument(index)}
                      className="remove-button"
                    >
                      ❌
                    </button>
                  </div>
                  
                  <div className="document-meta">
                    <span className="file-size">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span className="upload-time">
                      {doc.uploadedAt.toLocaleTimeString()}
                    </span>
                    <span className={`status ${doc.status}`}>
                      {doc.status === 'uploaded' ? '⏳ Pending' : '✅ Analyzed'}
                    </span>
                  </div>
                  
                  {doc.preview && (
                    <div className="document-preview">
                      <strong>Preview:</strong>
                      <p>{doc.preview}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="document-summary">
            <h3>📊 Document Analysis Summary</h3>
            <div className="summary-stats">
              {Object.entries(
                documents.reduce((acc, doc) => {
                  const type = doc.contentType || 'general';
                  acc[type] = (acc[type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="stat-item">
                  <span 
                    className="stat-color" 
                    style={{ backgroundColor: getContentTypeColor(type) }}
                  />
                  <span className="stat-label">{type}</span>
                  <span className="stat-value">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="uploader-actions">
        <button
          onClick={analyzeDocuments}
          disabled={documents.length === 0 || isAnalyzing}
          className="analyze-button primary"
        >
          {isAnalyzing ? (
            <>
              <span className="spinner" />
              Analyzing Documents...
            </>
          ) : (
            'Start AI Analysis & Continue →'
          )}
        </button>
      </div>
    </div>
  );
};