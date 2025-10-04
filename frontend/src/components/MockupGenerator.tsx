import React, { useState, useEffect } from 'react';
import { UploadedDocument, ProcessorParameters, GeneratedDocumentation, GeneratedMockups } from '../types/app.types';

interface MockupGeneratorProps {
  documents: UploadedDocument[];
  documentation: GeneratedDocumentation | null;
  parameters: ProcessorParameters;
  onMockupsGenerated: (mockups: GeneratedMockups) => void;
}

export const MockupGenerator: React.FC<MockupGeneratorProps> = ({
  documents,
  documentation,
  parameters,
  onMockupsGenerated
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [generatedMockups, setGeneratedMockups] = useState<GeneratedMockups | null>(null);

  useEffect(() => {
    generateMockups();
  }, [documentation]);

  const generateMockups = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Step 1: Analyze UI requirements
      setCurrentTask('Analyzing UI requirements from documentation...');
      setProgress(20);

      const uiAnalysis = await analyzeUIRequirements();

      // Step 2: Generate wireframes
      setCurrentTask('Generating wireframes and layouts...');
      setProgress(40);

      const wireframes = await generateWireframes(uiAnalysis);

      // Step 3: Generate user flows
      setCurrentTask('Creating user flow diagrams...');
      setProgress(60);

      const userFlows = await generateUserFlows(uiAnalysis);

      // Step 4: Generate component library
      setCurrentTask('Designing component library...');
      setProgress(80);

      const components = await generateComponentLibrary(uiAnalysis);

      const mockups: GeneratedMockups = {
        wireframes,
        userFlows,
        components,
        designSystem: {
          colors: ['#2c3e50', '#3498db', '#e74c3c', '#2ecc71', '#f39c12'],
          typography: {
            primary: 'Inter, system-ui, sans-serif',
            secondary: 'Monaco, Consolas, monospace'
          },
          spacing: [4, 8, 16, 24, 32, 48, 64],
          breakpoints: ['480px', '768px', '1024px', '1200px']
        }
      };

      setGeneratedMockups(mockups);
      setProgress(100);
      setCurrentTask('Mockup generation complete!');
      
      setTimeout(() => {
        onMockupsGenerated(mockups);
      }, 2000);

    } catch (error) {
      console.error('Mockup generation failed:', error);
      setCurrentTask('Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeUIRequirements = async () => {
    const response = await fetch('/api/analyze-ui-requirements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentation })
    });
    
    return response.json();
  };

  const generateWireframes = async (analysis: any) => {
    const response = await fetch('/api/generate-wireframes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    });
    
    const result = await response.json();
    return result.wireframes;
  };

  const generateUserFlows = async (analysis: any) => {
    const response = await fetch('/api/generate-user-flows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    });
    
    const result = await response.json();
    return result.userFlows;
  };

  const generateComponentLibrary = async (analysis: any) => {
    const response = await fetch('/api/generate-components', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis })
    });
    
    const result = await response.json();
    return result.components;
  };

  if (isGenerating) {
    return (
      <div className="mockup-generator generating">
        <div className="generation-header">
          <h1>🎨 AI Mockup & Design Generation</h1>
          <p>Creating comprehensive UI/UX designs based on your requirements</p>
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

        <div className="generation-preview">
          <div className="preview-grid">
            <div className="preview-item">
              <div className="skeleton-wireframe">
                <div className="skeleton-header"></div>
                <div className="skeleton-content">
                  <div className="skeleton-sidebar"></div>
                  <div className="skeleton-main"></div>
                </div>
              </div>
              <p>Wireframes</p>
            </div>
            <div className="preview-item">
              <div className="skeleton-flow">
                <div className="flow-node"></div>
                <div className="flow-arrow"></div>
                <div className="flow-node"></div>
                <div className="flow-arrow"></div>
                <div className="flow-node"></div>
              </div>
              <p>User Flows</p>
            </div>
            <div className="preview-item">
              <div className="skeleton-components">
                <div className="component-button"></div>
                <div className="component-input"></div>
                <div className="component-card"></div>
              </div>
              <p>Components</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (generatedMockups) {
    return (
      <div className="mockup-generator completed">
        <div className="completion-header">
          <h1>✅ Mockups Generated Successfully</h1>
          <p>Complete UI/UX design system created. Review the designs below.</p>
        </div>

        <div className="mockup-showcase">
          <div className="showcase-section">
            <h2>🖼️ Wireframes ({generatedMockups.wireframes.length})</h2>
            <div className="wireframe-grid">
              {generatedMockups.wireframes.map((wireframe, index) => (
                <div key={index} className="wireframe-item">
                  <div className="wireframe-preview">
                    {wireframe.svgContent ? (
                      <div 
                        dangerouslySetInnerHTML={{ __html: wireframe.svgContent }}
                        className="svg-container"
                      />
                    ) : (
                      <div className="wireframe-placeholder">
                        <h4>{wireframe.name}</h4>
                        <p>{wireframe.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="wireframe-info">
                    <h4>{wireframe.name}</h4>
                    <p>{wireframe.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-section">
            <h2>🔄 User Flows ({generatedMockups.userFlows.length})</h2>
            <div className="flow-grid">
              {generatedMockups.userFlows.map((flow, index) => (
                <div key={index} className="flow-item">
                  <h4>{flow.name}</h4>
                  <div className="flow-steps">
                    {flow.steps.map((step, stepIndex) => (
                      <React.Fragment key={stepIndex}>
                        <div className="flow-step">{step}</div>
                        {stepIndex < flow.steps.length - 1 && (
                          <div className="flow-arrow">→</div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                  <p>{flow.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-section">
            <h2>🧩 Component Library</h2>
            <div className="component-grid">
              {generatedMockups.components.map((component, index) => (
                <div key={index} className="component-item">
                  <div className="component-preview">
                    <div className={`component-demo ${component.type}`}>
                      {component.name}
                    </div>
                  </div>
                  <div className="component-info">
                    <h4>{component.name}</h4>
                    <span className="component-type">{component.type}</span>
                    <p>{component.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="showcase-section">
            <h2>🎨 Design System</h2>
            <div className="design-system">
              <div className="design-section">
                <h4>Colors</h4>
                <div className="color-palette">
                  {generatedMockups.designSystem.colors.map((color, index) => (
                    <div 
                      key={index}
                      className="color-swatch"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
              <div className="design-section">
                <h4>Typography</h4>
                <div className="typography-sample">
                  <div 
                    className="font-primary"
                    style={{ fontFamily: generatedMockups.designSystem.typography.primary }}
                  >
                    Primary Font - {generatedMockups.designSystem.typography.primary}
                  </div>
                  <div 
                    className="font-secondary"
                    style={{ fontFamily: generatedMockups.designSystem.typography.secondary }}
                  >
                    Secondary Font - {generatedMockups.designSystem.typography.secondary}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="next-steps">
          <p>✅ Proceeding to feedback and approval stage...</p>
        </div>
      </div>
    );
  }

  return null;
};