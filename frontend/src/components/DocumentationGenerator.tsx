import React, { useState, useEffect } from 'react';
import { UploadedDocument, ProcessorParameters, GeneratedDocumentation } from '../types/app.types';

interface DocumentationGeneratorProps {
  documents: UploadedDocument[];
  parameters: ProcessorParameters;
  onDocumentationGenerated: (docs: GeneratedDocumentation) => void;
}

export const DocumentationGenerator: React.FC<DocumentationGeneratorProps> = ({
  documents,
  parameters,
  onDocumentationGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocumentation | null>(null);

  useEffect(() => {
    generateDocumentation();
  }, [documents]);

  const generateDocumentation = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Step 1: Extract and analyze content
      setCurrentTask('Extracting content from documents...');
      setProgress(10);
      
      const formData = new FormData();
      documents.forEach(doc => {
        formData.append('documents', doc.file);
      });
      formData.append('parameters', JSON.stringify(parameters));

      // Step 2: AI Analysis
      setCurrentTask('AI analyzing requirements and specifications...');
      setProgress(30);

      const analysisResponse = await fetch('/api/analyze-documents-comprehensive', {
        method: 'POST',
        body: formData
      });

      const analysis = await analysisResponse.json();

      // Step 3: Generate Business Analysis
      setCurrentTask('Generating business analysis...');
      setProgress(50);

      const businessAnalysis = await generateBusinessAnalysis(analysis);

      // Step 4: Generate System Analysis
      setCurrentTask('Generating system analysis...');
      setProgress(70);

      const systemAnalysis = await generateSystemAnalysis(analysis);

      // Step 5: Generate Architecture
      setCurrentTask('Generating architecture documentation...');
      setProgress(90);

      const architecture = await generateArchitecture(analysis);

      const documentation: GeneratedDocumentation = {
        businessAnalysis,
        systemAnalysis,
        architecture,
        summary: {
          totalFeatures: analysis.featuresCount || 0,
          complexityScore: analysis.complexityScore || 0,
          estimatedDuration: analysis.estimatedWeeks || 0,
          riskLevel: calculateRiskLevel(analysis.complexityScore || 0)
        }
      };

      setGeneratedDocs(documentation);
      setProgress(100);
      setCurrentTask('Documentation generation complete!');
      
      // Auto-continue after 2 seconds
      setTimeout(() => {
        onDocumentationGenerated(documentation);
      }, 2000);

    } catch (error) {
      console.error('Documentation generation failed:', error);
      setCurrentTask('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateBusinessAnalysis = async (analysis: any): Promise<string> => {
    const response = await fetch('/api/generate-business-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    });
    
    const result = await response.json();
    return result.businessAnalysis;
  };

  const generateSystemAnalysis = async (analysis: any): Promise<string> => {
    const response = await fetch('/api/generate-system-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    });
    
    const result = await response.json();
    return result.systemAnalysis;
  };

  const generateArchitecture = async (analysis: any): Promise<string> => {
    const response = await fetch('/api/generate-architecture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    });
    
    const result = await response.json();
    return result.architecture;
  };

  const calculateRiskLevel = (complexity: number): 'low' | 'medium' | 'high' => {
    if (complexity <= 3) return 'low';
    if (complexity <= 7) return 'medium';
    return 'high';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return '#2ecc71';
      case 'medium': return '#f39c12';
      case 'high': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  if (isGenerating) {
    return (
      <div className="documentation-generator generating">
        <div className="generation-header">
          <h1>🤖 AI Documentation Generation</h1>
          <p>Our AI is analyzing your documents and generating comprehensive documentation</p>
        </div>

        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="progress-text">{progress}% - {currentTask}</p>
        </div>

        <div className="generation-steps">
          <div className={`step ${progress >= 10 ? 'completed' : 'active'}`}>
            <span className="step-icon">📄</span>
            <span className="step-text">Document Extraction</span>
          </div>
          <div className={`step ${progress >= 30 ? 'completed' : progress >= 10 ? 'active' : ''}`}>
            <span className="step-icon">🧠</span>
            <span className="step-text">AI Analysis</span>
          </div>
          <div className={`step ${progress >= 50 ? 'completed' : progress >= 30 ? 'active' : ''}`}>
            <span className="step-icon">🏢</span>
            <span className="step-text">Business Analysis</span>
          </div>
          <div className={`step ${progress >= 70 ? 'completed' : progress >= 50 ? 'active' : ''}`}>
            <span className="step-icon">⚙️</span>
            <span className="step-text">System Analysis</span>
          </div>
          <div className={`step ${progress >= 90 ? 'completed' : progress >= 70 ? 'active' : ''}`}>
            <span className="step-icon">🏗️</span>
            <span className="step-text">Architecture</span>
          </div>
        </div>
      </div>
    );
  }

  if (generatedDocs) {
    return (
      <div className="documentation-generator completed">
        <div className="completion-header">
          <h1>✅ Documentation Generated Successfully</h1>
          <p>Comprehensive analysis complete. Review the generated documentation below.</p>
        </div>

        <div className="documentation-summary">
          <h2>📊 Project Summary</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">🎯</div>
              <div className="card-content">
                <div className="card-value">{generatedDocs.summary.totalFeatures}</div>
                <div className="card-label">Features Identified</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">⚡</div>
              <div className="card-content">
                <div className="card-value">{generatedDocs.summary.complexityScore}/10</div>
                <div className="card-label">Complexity Score</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">📅</div>
              <div className="card-content">
                <div className="card-value">{generatedDocs.summary.estimatedDuration} weeks</div>
                <div className="card-label">Estimated Duration</div>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon">⚠️</div>
              <div className="card-content">
                <div 
                  className="card-value risk-level"
                  style={{ color: getRiskColor(generatedDocs.summary.riskLevel) }}
                >
                  {generatedDocs.summary.riskLevel.toUpperCase()}
                </div>
                <div className="card-label">Risk Level</div>
              </div>
            </div>
          </div>
        </div>

        <div className="documentation-preview">
          <h2>📋 Generated Documentation Preview</h2>
          
          <div className="doc-tabs">
            <div className="doc-tab active">
              <h3>🏢 Business Analysis</h3>
              <div className="doc-preview">
                {generatedDocs.businessAnalysis.substring(0, 300)}...
              </div>
            </div>
            <div className="doc-tab">
              <h3>⚙️ System Analysis</h3>
              <div className="doc-preview">
                {generatedDocs.systemAnalysis.substring(0, 300)}...
              </div>
            </div>
            <div className="doc-tab">
              <h3>🏗️ Architecture</h3>
              <div className="doc-preview">
                {generatedDocs.architecture.substring(0, 300)}...
              </div>
            </div>
          </div>
        </div>

        <div className="next-steps">
          <p>✅ Proceeding to mockup generation...</p>
        </div>
      </div>
    );
  }

  return null;
};