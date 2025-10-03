import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface ProcessorConfig {
  jiraHost: string;
  jiraEmail: string;
  jiraToken: string;
  jiraProject: string;
  githubToken: string;
  githubOwner: string;
  githubRepo: string;
  openaiKey: string;
}

interface DocumentFile {
  name: string;
  content: string;
  type: string;
}

export default function DocumentProcessor() {
  const [config, setConfig] = useState<ProcessorConfig>({
    jiraHost: '',
    jiraEmail: '',
    jiraToken: '',
    jiraProject: '',
    githubToken: '',
    githubOwner: 'dapio',
    githubRepo: '',
    openaiKey: ''
  });

  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const filePromises = acceptedFiles.map(async (file) => {
      const content = await file.text();
      return {
        name: file.name,
        content,
        type: file.type
      };
    });

    const newDocuments = await Promise.all(filePromises);
    setDocuments(prev => [...prev, ...newDocuments]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleProcessDocuments = async () => {
    setProcessing(true);
    try {
      const response = await axios.post('/api/process-documents', {
        config,
        documents
      });
      setResults(response.data);
    } catch (error) {
      console.error('Processing failed:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🚀 Document to Jira Processor
          </h1>
          
          {/* Configuration Form */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">⚙️ Configuration</h2>
            <div className="grid grid-cols-1 md: