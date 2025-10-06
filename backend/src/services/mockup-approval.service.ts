/**
 * Mockup Approval System
 * Manages UI mockup generation, review cycles, and approval workflow
 * Handles iterative feedback and approval process for UI designs
 */

import { PrismaClient, MockupApproval } from '@prisma/client';
import { Result, MLError } from '../providers/ml-provider.interface';
import { EventEmitter } from 'events';

// Helper type for Prisma JSON fields
type PrismaJson = any;

export interface MockupGenerationRequest {
  projectId: string;
  name: string;
  description?: string;
  requirements: string[];
  wireframeType: 'low-fidelity' | 'high-fidelity' | 'interactive';
  targetPlatform: 'web' | 'mobile' | 'desktop';
  components?: string[];
  style?: MockupStyleGuide;
  context?: any;
}

export interface MockupStyleGuide {
  colorScheme: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  fontFamily?: string;
  layout: 'sidebar' | 'topnav' | 'dashboard' | 'landing' | 'form';
  responsive: boolean;
}

export interface MockupData {
  type: string;
  content: string;
  assets?: MockupAsset[];
  metadata: MockupMetadata;
}

export interface MockupAsset {
  type: 'image' | 'icon' | 'font' | 'css' | 'js';
  name: string;
  path: string;
  size: number;
}

export interface MockupMetadata {
  generatedAt: Date;
  generator: string;
  version: string;
  tags?: string[];
  dimensions?: { width: number; height: number };
  compatibility?: string[];
}

export interface MockupIteration {
  iterationNumber: number;
  mockupData: MockupData;
  changes: MockupChange[];
  generatedAt: Date;
}

export interface MockupChange {
  type: 'added' | 'modified' | 'removed' | 'styled';
  component: string;
  description: string;
  reason: string;
}

export interface ApprovalFeedback {
  approved: boolean;
  rating: number; // 1-5
  comments: string;
  specificChanges?: string[];
  nextIterationNeeded: boolean;
  submittedBy: string;
  submittedAt: Date;
}

/**
 * MockupApprovalService - Comprehensive UI mockup generation and approval workflow system
 */
export class MockupApprovalService extends EventEmitter {
  constructor(private prisma: PrismaClient) {
    super();
  }

  /**
   * Generate new UI mockup based on requirements
   */
  async generateMockup(
    request: MockupGenerationRequest
  ): Promise<Result<string, MLError>> {
    try {
      // Generate mockup content based on type and requirements
      const mockupData = await this.createMockupData(request);

      // Create initial iteration
      const initialIteration: MockupIteration = {
        iterationNumber: 1,
        mockupData,
        changes: [
          {
            type: 'added',
            component: 'initial_design',
            description: 'Initial mockup generated from requirements',
            reason: 'First iteration based on project requirements',
          },
        ],
        generatedAt: new Date(),
      };

      // Create mockup approval record
      const mockupApproval = await this.prisma.mockupApproval.create({
        data: {
          projectId: request.projectId,
          name: request.name,
          description: request.description || '',
          status: 'pending_review',
          mockupData: mockupData as PrismaJson,
          iterations: [initialIteration] as PrismaJson,
          approvalComments: {} as PrismaJson,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.emit('mockupGenerated', {
        mockupId: mockupApproval.id,
        projectId: request.projectId,
        iteration: 1,
      });

      return { success: true, data: mockupApproval.id };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MOCKUP_GENERATION_ERROR',
          message: `Failed to generate mockup: ${error}`,
          details: {
            request,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }

  /**
   * Submit approval feedback and potentially create new iteration
   */
  async submitApprovalFeedback(
    mockupId: string,
    feedback: ApprovalFeedback
  ): Promise<Result<void, MLError>> {
    try {
      const result = await this.processApprovalFeedback(mockupId, feedback);
      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'APPROVAL_FEEDBACK_ERROR',
          message: `Failed to process approval feedback: ${error}`,
          details: {
            mockupId,
            feedback,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }

  /**
   * Process approval feedback and handle iteration logic
   */
  private async processApprovalFeedback(
    mockupId: string,
    feedback: ApprovalFeedback
  ): Promise<Result<void, MLError>> {
    const mockup = await this.prisma.mockupApproval.findUnique({
      where: { id: mockupId },
    });

    if (!mockup) {
      return {
        success: false,
        error: {
          code: 'MOCKUP_NOT_FOUND',
          message: 'Mockup not found',
          details: { mockupId },
        },
      };
    }

    // Get current iterations safely
    const currentIterations = Array.isArray(mockup.iterations)
      ? (mockup.iterations as unknown as MockupIteration[])
      : [];

    // Update approval comments
    const currentComments = (mockup.approvalComments as any) || {};
    currentComments[`iteration_${currentIterations.length}`] = feedback;

    // Update status and potentially create new iteration
    const newStatus =
      feedback.approved && !feedback.nextIterationNeeded
        ? 'approved'
        : feedback.nextIterationNeeded
        ? 'revision_needed'
        : 'pending_review';

    const updatedIterations = [...currentIterations];

    // Create new iteration if needed
    if (feedback.nextIterationNeeded && feedback.specificChanges?.length) {
      const newIteration = await this.createNewIteration(
        mockup,
        feedback,
        currentIterations.length + 1
      );
      updatedIterations.push(newIteration);
    }

    // Update mockup approval record
    await this.prisma.mockupApproval.update({
      where: { id: mockupId },
      data: {
        status: newStatus,
        iterations: updatedIterations as PrismaJson,
        approvalComments: currentComments as PrismaJson,
        updatedAt: new Date(),
      },
    });

    this.emit('approvalFeedbackProcessed', {
      mockupId,
      approved: feedback.approved,
      newIteration: feedback.nextIterationNeeded,
      status: newStatus,
    });

    return { success: true, data: undefined };
  }

  /**
   * Create new mockup iteration based on feedback
   */
  private async createNewIteration(
    mockup: MockupApproval,
    feedback: ApprovalFeedback,
    iterationNumber: number
  ): Promise<MockupIteration> {
    const previousIterations = Array.isArray(mockup.iterations)
      ? (mockup.iterations as unknown as MockupIteration[])
      : [];

    const lastIteration = previousIterations[previousIterations.length - 1];

    // Generate updated mockup based on feedback
    const updatedMockupData: MockupData = {
      ...lastIteration.mockupData,
      content: await this.applyFeedbackToMockup(
        lastIteration.mockupData,
        feedback
      ),
    };

    const changes: MockupChange[] =
      feedback.specificChanges?.map(change => ({
        type: 'modified',
        component: 'user_feedback',
        description: change,
        reason: feedback.comments,
      })) || [];

    return {
      iterationNumber,
      mockupData: updatedMockupData,
      changes,
      generatedAt: new Date(),
    };
  }

  /**
   * Apply feedback changes to mockup content
   */
  private async applyFeedbackToMockup(
    originalData: MockupData,
    feedback: ApprovalFeedback
  ): Promise<string> {
    // For now, append feedback comments to the original content
    // In a real implementation, this would use AI to apply specific changes
    return (
      originalData.content +
      `\n<!-- Iteration changes: ${feedback.comments} -->`
    );
  }

  /**
   * Get mockup approval by ID with all iterations
   */
  async getMockupApproval(
    mockupId: string
  ): Promise<Result<MockupApproval, MLError>> {
    try {
      const mockup = await this.prisma.mockupApproval.findUnique({
        where: { id: mockupId },
      });

      if (!mockup) {
        return {
          success: false,
          error: {
            code: 'MOCKUP_NOT_FOUND',
            message: 'Mockup not found',
            details: { mockupId },
          },
        };
      }

      return { success: true, data: mockup };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: `Failed to retrieve mockup: ${error}`,
          details: {
            mockupId,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }

  /**
   * List all mockups for a project
   */
  async listProjectMockups(
    projectId: string
  ): Promise<Result<MockupApproval[], MLError>> {
    try {
      const mockups = await this.prisma.mockupApproval.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      return { success: true, data: mockups };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: `Failed to list project mockups: ${error}`,
          details: {
            projectId,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }

  /**
   * Generate mockup preview URL
   */
  async generatePreviewUrl(
    mockupId: string,
    iterationNumber?: number
  ): Promise<Result<string, MLError>> {
    try {
      const mockup = await this.prisma.mockupApproval.findUnique({
        where: { id: mockupId },
      });

      if (!mockup) {
        return {
          success: false,
          error: {
            code: 'MOCKUP_NOT_FOUND',
            message: 'Mockup not found',
            details: { mockupId },
          },
        };
      }

      // Generate preview URL based on mockup type and content
      const mockupData = mockup.mockupData as unknown as MockupData;
      const previewUrl = await this.createPreviewFile(
        mockupData,
        iterationNumber
      );

      return { success: true, data: previewUrl };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PREVIEW_GENERATION_ERROR',
          message: `Failed to generate preview: ${error}`,
          details: {
            mockupId,
            error: error instanceof Error ? error.message : error,
          },
        },
      };
    }
  }

  /**
   * Create mockup data based on generation request
   */
  private async createMockupData(
    request: MockupGenerationRequest
  ): Promise<MockupData> {
    const content = this.generateMockupContent(request);

    return {
      type: request.wireframeType,
      content,
      assets: [],
      metadata: {
        generatedAt: new Date(),
        generator: 'MockupApprovalService',
        version: '1.0.0',
        tags: request.components || [],
        dimensions: { width: 1200, height: 800 },
        compatibility: ['modern-browsers'],
      },
    };
  }

  /**
   * Generate mockup content based on request type
   */
  private generateMockupContent(request: MockupGenerationRequest): string {
    switch (request.wireframeType) {
      case 'high-fidelity':
        return this.generateHighFidelityHtml(request);
      case 'interactive':
        return this.generateInteractiveHtml(request);
      default:
        return this.generateBasicHtml(request);
    }
  }

  /**
   * Generate basic HTML mockup
   */
  private generateBasicHtml(request: MockupGenerationRequest): string {
    const style = request.style || {
      layout: 'topnav',
      colorScheme: 'light',
      responsive: true,
      primaryColor: '#007bff',
      fontFamily: 'Arial, sans-serif',
    };

    return this.createHtmlStructure(request, style, 'basic');
  }

  /**
   * Generate high-fidelity HTML mockup
   */
  private generateHighFidelityHtml(request: MockupGenerationRequest): string {
    const style = request.style || {
      layout: 'dashboard',
      colorScheme: 'light',
      responsive: true,
      primaryColor: '#6c5ce7',
      fontFamily: 'Inter, sans-serif',
    };

    return this.createHtmlStructure(request, style, 'high-fidelity');
  }

  /**
   * Generate interactive HTML mockup
   */
  private generateInteractiveHtml(request: MockupGenerationRequest): string {
    const style = request.style || {
      layout: 'sidebar',
      colorScheme: 'dark',
      responsive: true,
      primaryColor: '#00d2d3',
      fontFamily: 'Roboto, sans-serif',
    };

    return this.createHtmlStructure(request, style, 'interactive');
  }

  /**
   * Create HTML structure for mockup
   */
  private createHtmlStructure(
    request: MockupGenerationRequest,
    style: MockupStyleGuide,
    fidelity: string
  ): string {
    const cssStyles = this.generateCssStyles(style, fidelity);
    const bodyContent = this.generateBodyContent(request, style, fidelity);
    const jsScripts =
      fidelity === 'interactive' ? this.generateJavaScript(request) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${request.name} - ${fidelity} Mockup</title>
    <style>${cssStyles}</style>
</head>
<body>
    ${bodyContent}
    ${jsScripts ? `<script>${jsScripts}</script>` : ''}
</body>
</html>`;
  }

  /**
   * Generate CSS styles for mockup
   */
  private generateCssStyles(style: MockupStyleGuide, fidelity: string): string {
    const baseStyles = `
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: ${style.fontFamily || 'Arial, sans-serif'};
        background: ${style.colorScheme === 'dark' ? '#1a1a1a' : '#ffffff'};
        color: ${style.colorScheme === 'dark' ? '#ffffff' : '#333333'};
      }
    `;

    const layoutStyles = this.getLayoutStyles(style.layout);
    const responsiveStyles = style.responsive ? this.getResponsiveStyles() : '';
    const fidelityStyles = this.getFidelityStyles(fidelity, style);

    return baseStyles + layoutStyles + responsiveStyles + fidelityStyles;
  }

  /**
   * Generate body content for mockup
   */
  private generateBodyContent(
    request: MockupGenerationRequest,
    style: MockupStyleGuide,
    fidelity: string
  ): string {
    const header = this.generateHeader(request, style);
    const navigation = this.generateNavigation(style);
    const mainContent = this.generateMainContent(request, fidelity);
    const footer = this.generateFooter(style);

    return `
      ${header}
      ${navigation}
      ${mainContent}
      ${footer}
    `;
  }

  /**
   * Additional helper methods for HTML generation
   */
  private getLayoutStyles(layout: string): string {
    switch (layout) {
      case 'sidebar':
        return '.container { display: flex; } .sidebar { width: 250px; } .main { flex: 1; }';
      case 'dashboard':
        return '.dashboard { display: grid; grid-template-columns: 1fr 3fr; gap: 20px; }';
      default:
        return '.container { max-width: 1200px; margin: 0 auto; padding: 20px; }';
    }
  }

  private getResponsiveStyles(): string {
    return `
      @media (max-width: 768px) {
        .container { padding: 10px; }
        .sidebar { width: 100%; }
        .dashboard { grid-template-columns: 1fr; }
      }
    `;
  }

  private getFidelityStyles(fidelity: string, style: MockupStyleGuide): string {
    if (fidelity === 'high-fidelity') {
      return `
        .card { box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; }
        .button { background: ${style.primaryColor}; color: white; padding: 12px 24px; border: none; border-radius: 6px; }
      `;
    }
    return '';
  }

  private generateHeader(
    request: MockupGenerationRequest,
    style: MockupStyleGuide
  ): string {
    return `<header style="background: ${style.primaryColor}; color: white; padding: 20px;">
      <h1>${request.name}</h1>
    </header>`;
  }

  private generateNavigation(_style: MockupStyleGuide): string {
    return `<nav style="background: #f8f9fa; padding: 10px;">
      <a href="#" style="margin-right: 20px;">Home</a>
      <a href="#" style="margin-right: 20px;">Features</a>
      <a href="#" style="margin-right: 20px;">Contact</a>
    </nav>`;
  }

  private generateMainContent(
    request: MockupGenerationRequest,
    fidelity: string
  ): string {
    const requirements = request.requirements
      .map(req => `<li>${req}</li>`)
      .join('');
    return `<main style="padding: 40px 20px;">
      <h2>Project Requirements</h2>
      <ul>${requirements}</ul>
      <p>This is a ${fidelity} mockup for ${request.targetPlatform} platform.</p>
    </main>`;
  }

  private generateFooter(_style: MockupStyleGuide): string {
    return `<footer style="background: #333; color: white; padding: 20px; text-align: center;">
      <p>&copy; 2024 ThinkCode AI Platform</p>
    </footer>`;
  }

  private generateJavaScript(request: MockupGenerationRequest): string {
    return `
      console.log('Interactive mockup loaded for: ${request.name}');
      document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => alert('Button clicked!'));
      });
    `;
  }

  /**
   * Create preview file from mockup data
   */
  private async createPreviewFile(
    _mockupData: MockupData,
    _iterationNumber?: number
  ): Promise<string> {
    const fileName = `mockup-preview-${Date.now()}.html`;

    // In a real implementation, write the file to storage and use mockupData
    // For now, return a mock URL
    return `/api/mockups/preview/${fileName}`;
  }
}
