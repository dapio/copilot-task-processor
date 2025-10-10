/**
 * Project File Management Service
 * Handles file uploads, organization, and analysis for projects
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import JSZip from 'jszip';

const prisma = new PrismaClient();

// Validation schemas
const UploadFileSchema = z.object({
  projectId: z.string().cuid(),
  filename: z.string().min(1),
  originalName: z.string().min(1),
  size: z.number().min(0),
  mimeType: z.string(),
  category: z.enum(['input', 'output', 'mockup', 'document', 'analysis']),
  subcategory: z.string().optional(),
  uploadedBy: z.string().optional(),
  buffer: z.instanceof(Buffer),
});

const UpdateFileSchema = z.object({
  status: z
    .enum(['uploaded', 'processing', 'processed', 'analyzed', 'archived'])
    .optional(),
  analysis: z.record(z.string(), z.any()).optional(),
  extractedText: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  processedBy: z.string().optional(),
});

export type UploadFileInput = z.infer<typeof UploadFileSchema>;
export type UpdateFileInput = z.infer<typeof UpdateFileSchema>;

// Supported file types
export const SUPPORTED_MIME_TYPES = {
  // Documents
  'application/pdf': { category: 'document', extensions: ['.pdf'] },
  'application/msword': { category: 'document', extensions: ['.doc'] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    category: 'document',
    extensions: ['.docx'],
  },
  'text/plain': { category: 'document', extensions: ['.txt'] },
  'text/markdown': { category: 'document', extensions: ['.md'] },

  // Images/Mockups
  'image/jpeg': { category: 'mockup', extensions: ['.jpg', '.jpeg'] },
  'image/png': { category: 'mockup', extensions: ['.png'] },
  'image/gif': { category: 'mockup', extensions: ['.gif'] },
  'image/svg+xml': { category: 'mockup', extensions: ['.svg'] },

  // Archives
  'application/zip': { category: 'input', extensions: ['.zip'] },
  'application/x-zip-compressed': { category: 'input', extensions: ['.zip'] },

  // Other
  'application/json': { category: 'document', extensions: ['.json'] },
  'text/csv': { category: 'document', extensions: ['.csv'] },
};

export class ProjectFileService {
  private getProjectPath(projectId: string): string {
    return path.join(process.cwd(), 'projects', projectId);
  }

  private getCategoryPath(projectId: string, category: string): string {
    const basePath = this.getProjectPath(projectId);
    switch (category) {
      case 'input':
        return path.join(basePath, 'docs', 'input');
      case 'output':
        return path.join(basePath, 'docs', 'output');
      case 'mockup':
        return path.join(basePath, 'docs', 'output', 'mockups');
      case 'analysis':
        return path.join(basePath, 'docs', 'analysis');
      default:
        return path.join(basePath, 'docs', category);
    }
  }

  /**
   * Initialize project directory structure
   */
  async initializeProjectDirectories(projectId: string) {
    try {
      const directories = [
        this.getCategoryPath(projectId, 'input'),
        this.getCategoryPath(projectId, 'output'),
        this.getCategoryPath(projectId, 'mockup'),
        this.getCategoryPath(projectId, 'analysis'),
      ];

      for (const dir of directories) {
        await fs.mkdir(dir, { recursive: true });
      }

      return { success: true, data: { projectId, directories } };
    } catch (error) {
      console.error('Error initializing project directories:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize project directories',
      };
    }
  }

  /**
   * Calculate file hash for deduplication
   */
  private calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Extract text content from various file types
   */
  private async extractTextContent(
    buffer: Buffer,
    mimeType: string
  ): Promise<string | null> {
    try {
      switch (mimeType) {
        case 'text/plain':
        case 'text/markdown':
          return buffer.toString('utf-8');

        case 'application/json':
          try {
            const json = JSON.parse(buffer.toString('utf-8'));
            return JSON.stringify(json, null, 2);
          } catch {
            return buffer.toString('utf-8');
          }

        // TODO: Add PDF, DOC, DOCX text extraction
        // For now, return null for binary formats
        default:
          return null;
      }
    } catch (error) {
      console.error('Error extracting text content:', error);
      return null;
    }
  }

  /**
   * Process ZIP file and extract contents
   */
  private async processZipFile(
    buffer: Buffer,
    projectId: string,
    uploadedBy?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(buffer);
      const extractedFiles = [];

      for (const [relativePath, file] of Object.entries(zipContents.files)) {
        if (file.dir) continue; // Skip directories

        const fileBuffer = await file.async('nodebuffer');
        const filename = path.basename(relativePath);
        const ext = path.extname(filename).toLowerCase();

        // Determine file category based on extension and path
        let category: 'input' | 'output' | 'mockup' | 'document' | 'analysis' =
          'input';
        if (
          relativePath.includes('mockup') ||
          ['.jpg', '.jpeg', '.png', '.gif', '.svg'].includes(ext)
        ) {
          category = 'mockup';
        } else if (['.pdf', '.doc', '.docx', '.txt', '.md'].includes(ext)) {
          category = 'document';
        }

        // Determine mime type
        const mimeType = this.getMimeTypeFromExtension(ext);

        const uploadResult: { success: boolean; data?: any; error?: string } =
          await this.uploadFile({
            projectId,
            filename: `${Date.now()}_${filename}`,
            originalName: filename,
            size: fileBuffer.length,
            mimeType,
            category,
            subcategory: 'extracted_from_zip',
            uploadedBy,
            buffer: fileBuffer,
          });

        if (uploadResult.success) {
          extractedFiles.push(uploadResult.data);
        }
      }

      return { success: true, data: extractedFiles };
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to process ZIP file',
      };
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(ext: string): string {
    const extensionMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.zip': 'application/zip',
    };

    return extensionMap[ext.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Upload and process a file
   */
  async uploadFile(
    input: UploadFileInput
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const validatedInput = UploadFileSchema.parse(input);

      // Initialize project directories if they don't exist
      await this.initializeProjectDirectories(validatedInput.projectId);

      // Check for duplicate files
      const hash = this.calculateFileHash(validatedInput.buffer);
      const existingFile = await prisma.projectFile?.findFirst({
        where: {
          projectId: validatedInput.projectId,
          hash,
        },
      });

      if (existingFile) {
        return {
          success: false,
          error: 'File already exists in project',
          data: { existingFile },
        };
      }

      // Handle ZIP files specially
      if (validatedInput.mimeType.includes('zip')) {
        const zipResult: { success: boolean; data?: any; error?: string } =
          await this.processZipFile(
            validatedInput.buffer,
            validatedInput.projectId,
            validatedInput.uploadedBy
          );

        if (zipResult.success) {
          return {
            success: true,
            data: {
              type: 'zip_extraction',
              extractedFiles: zipResult.data,
              totalFiles: zipResult.data?.length || 0,
            },
          };
        }
      }

      // Determine file path
      const categoryPath = this.getCategoryPath(
        validatedInput.projectId,
        validatedInput.category
      );
      const fullPath = path.join(categoryPath, validatedInput.filename);
      const relativePath = path.relative(
        this.getProjectPath(validatedInput.projectId),
        fullPath
      );

      // Save file to disk
      await fs.writeFile(fullPath, validatedInput.buffer);

      // Extract text content if applicable
      const extractedText = await this.extractTextContent(
        validatedInput.buffer,
        validatedInput.mimeType
      );

      // Save file record to database
      const file = await prisma.projectFile?.create({
        data: {
          projectId: validatedInput.projectId,
          filename: validatedInput.filename,
          originalName: validatedInput.originalName,
          path: relativePath,
          fullPath,
          size: validatedInput.size,
          mimeType: validatedInput.mimeType,
          category: validatedInput.category,
          subcategory: validatedInput.subcategory,
          hash,
          uploadedBy: validatedInput.uploadedBy,
          extractedText,
          status: 'uploaded',
          tags: [],
          metadata: {
            uploadedAt: new Date().toISOString(),
            hasTextContent: !!extractedText,
          },
        },
      });

      return { success: true, data: file };
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file',
      };
    }
  }

  /**
   * Get files for a project with filtering
   */
  async getProjectFiles(
    projectId: string,
    filters?: {
      category?: string;
      status?: string;
      mimeType?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    try {
      const where: any = { projectId };
      if (filters?.category) where.category = filters.category;
      if (filters?.status) where.status = filters.status;
      if (filters?.mimeType) where.mimeType = { contains: filters.mimeType };

      const files = await prisma.projectFile?.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: filters?.offset || 0,
        take: filters?.limit || 50,
      });

      const total = await prisma.projectFile?.count({ where });

      return {
        success: true,
        data: {
          files: files || [],
          total: total || 0,
          hasMore:
            (filters?.offset || 0) + (filters?.limit || 50) < (total || 0),
        },
      };
    } catch (error) {
      console.error('Error fetching project files:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch project files',
      };
    }
  }

  /**
   * Update file information
   */
  async updateFile(fileId: string, input: UpdateFileInput) {
    try {
      const validatedInput = UpdateFileSchema.parse(input);

      const file = await prisma.projectFile?.update({
        where: { id: fileId },
        data: validatedInput,
      });

      return { success: true, data: file };
    } catch (error) {
      console.error('Error updating file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update file',
      };
    }
  }

  /**
   * Delete file from project
   */
  async deleteFile(fileId: string) {
    try {
      const file = await prisma.projectFile?.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return { success: false, error: 'File not found' };
      }

      // Delete physical file
      try {
        await fs.unlink(file.fullPath);
      } catch (error) {
        console.warn('Could not delete physical file:', error);
      }

      // Delete database record
      await prisma.projectFile?.delete({
        where: { id: fileId },
      });

      return { success: true, data: { deletedFile: file } };
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  }

  /**
   * Get file content as buffer
   */
  async getFileContent(fileId: string) {
    try {
      const file = await prisma.projectFile?.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        return { success: false, error: 'File not found' };
      }

      const buffer = await fs.readFile(file.fullPath);

      return {
        success: true,
        data: {
          file,
          buffer,
          content: file.extractedText,
        },
      };
    } catch (error) {
      console.error('Error reading file content:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to read file content',
      };
    }
  }

  /**
   * Get project file summary statistics
   */
  async getProjectFileSummary(projectId: string) {
    try {
      const summary = await prisma.projectFile?.groupBy({
        by: ['category', 'status'],
        where: { projectId },
        _count: true,
        _sum: { size: true },
      });

      const totalFiles = await prisma.projectFile?.count({
        where: { projectId },
      });

      const totalSize = await prisma.projectFile?.aggregate({
        where: { projectId },
        _sum: { size: true },
      });

      return {
        success: true,
        data: {
          summary: summary || [],
          totalFiles: totalFiles || 0,
          totalSize: totalSize?._sum.size || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching project file summary:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch project file summary',
      };
    }
  }

  /**
   * Check if project has files (for determining if to show upload screen)
   */
  async hasProjectFiles(projectId: string) {
    try {
      const count = await prisma.projectFile?.count({
        where: {
          projectId,
          category: 'input',
        },
      });

      return {
        success: true,
        data: {
          hasFiles: (count || 0) > 0,
          inputFileCount: count || 0,
        },
      };
    } catch (error) {
      console.error('Error checking project files:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check project files',
      };
    }
  }
}
