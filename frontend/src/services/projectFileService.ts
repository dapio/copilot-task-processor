/**
 * Project File Management Service
 * ThinkCode AI Platform - Project Directory Structure & Repository Integration
 */

import { Project, RepositoryConfig } from '../types/project';
import * as fs from 'fs';
import * as path from 'path';

export interface FileOperationResult {
  success: boolean;
  message: string;
  path?: string;
  error?: Error;
}

export interface RepositoryCloneResult {
  success: boolean;
  message: string;
  localPath?: string;
  error?: Error;
}

export class ProjectFileService {
  private readonly basePath: string;

  constructor(basePath: string = 'projects') {
    this.basePath = basePath;
  }

  /**
   * Create complete directory structure for a new project
   */
  async createProjectStructure(project: Project): Promise<FileOperationResult> {
    try {
      const projectPath = path.join(this.basePath, project.id);

      // Create main project directory
      await this.ensureDirectory(projectPath);

      // Create all subdirectories based on file structure
      const structure = project.fileStructure;

      await this.createStructureDirectories(projectPath, {
        [structure.sourceCode.backend || 'backend']: null,
        [structure.sourceCode.frontend || 'frontend']: null,
        [structure.sourceCode.shared || 'shared']: null,
        [structure.sourceCode.database || 'database']: null,
        [structure.sourceCode.config || 'config']: null,

        [structure.analysis.codeAnalysis]: null,
        [structure.analysis.documentAnalysis]: null,
        [structure.analysis.reports]: null,
        [structure.analysis.metrics]: null,

        [structure.tasks.active]: null,
        [structure.tasks.completed]: null,
        [structure.tasks.archived]: null,
        [structure.tasks.templates]: null,

        [structure.workflows.definitions]: null,
        [structure.workflows.executions]: null,
        [structure.workflows.logs]: null,

        [structure.mockups.wireframes]: null,
        [structure.mockups.prototypes]: null,
        [structure.mockups.assets]: null,

        [structure.documentation.api]: null,
        [structure.documentation.userGuides]: null,
        [structure.documentation.technical]: null,
        [structure.documentation.generated]: null,

        [structure.backups.daily]: null,
        [structure.backups.weekly]: null,
        [structure.backups.monthly]: null,
      });

      // Create project configuration file
      await this.createProjectConfig(projectPath, project);

      // Create README files
      await this.createReadmeFiles(projectPath, project);

      // If repository is configured, clone it
      if (project.repository && project.repository.url) {
        const cloneResult = await this.cloneRepository(
          project.repository,
          projectPath
        );
        if (!cloneResult.success) {
          console.warn(`Repository clone failed: ${cloneResult.message}`);
        }
      }

      return {
        success: true,
        message: `Project structure created successfully`,
        path: projectPath,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create project structure: ${
          (error as Error).message
        }`,
        error: error as Error,
      };
    }
  }

  /**
   * Clone repository into project structure
   */
  private async cloneRepository(
    repository: RepositoryConfig,
    projectPath: string
  ): Promise<RepositoryCloneResult> {
    try {
      // For now, just create a placeholder - full Git integration would require git commands
      const repoPath = path.join(projectPath, 'repository');
      await this.ensureDirectory(repoPath);

      const repoInfo = {
        type: repository.type,
        url: repository.url,
        branch: repository.branch || 'main',
        clonedAt: new Date().toISOString(),
        syncEnabled: repository.syncEnabled,
        isPrivate: repository.isPrivate,
      };

      await fs.promises.writeFile(
        path.join(repoPath, '.repository-info.json'),
        JSON.stringify(repoInfo, null, 2)
      );

      // Create placeholder files for repository integration
      await fs.promises.writeFile(
        path.join(repoPath, 'README.md'),
        `# Repository Integration\n\nThis directory will contain the cloned repository:\n- URL: ${
          repository.url
        }\n- Type: ${repository.type}\n- Branch: ${
          repository.branch || 'main'
        }\n\n## Setup\n\nTo clone the actual repository, run:\n\`\`\`bash\ngit clone ${
          repository.url
        } .\n\`\`\``
      );

      return {
        success: true,
        message: 'Repository integration configured',
        localPath: repoPath,
      };
    } catch (error) {
      return {
        success: false,
        message: `Repository setup failed: ${(error as Error).message}`,
        error: error as Error,
      };
    }
  }

  /**
   * Create directory structure recursively
   */
  private async createStructureDirectories(
    basePath: string,
    structure: Record<string, any>
  ): Promise<void> {
    for (const [dirPath, subStructure] of Object.entries(structure)) {
      if (dirPath) {
        const fullPath = path.join(basePath, dirPath);
        await this.ensureDirectory(fullPath);

        if (subStructure && typeof subStructure === 'object') {
          await this.createStructureDirectories(fullPath, subStructure);
        }
      }
    }
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.access(dirPath);
    } catch {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Create project configuration file
   */
  private async createProjectConfig(
    projectPath: string,
    project: Project
  ): Promise<void> {
    const config = {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      fileStructure: project.fileStructure,
      repository: project.repository,
      settings: project.settings,
      version: '1.0.0',
      thinkCodeVersion: '1.0.0',
    };

    await fs.promises.writeFile(
      path.join(projectPath, 'project.json'),
      JSON.stringify(config, null, 2)
    );
  }

  /**
   * Create README files in key directories
   */
  private async createReadmeFiles(
    projectPath: string,
    project: Project
  ): Promise<void> {
    const readmeContent = {
      main: `# ${project.name}\n\n${
        project.description || 'ThinkCode AI Platform Project'
      }\n\n## Project Structure\n\nThis project follows the ThinkCode AI Platform structure:\n\n- **source-code/**: Application source code\n- **analysis/**: AI analysis results and reports\n- **tasks/**: Generated and managed tasks\n- **workflows/**: AI workflow definitions and executions\n- **mockups/**: Design mockups and prototypes\n- **documentation/**: Generated documentation\n- **backups/**: Project backups\n\n## Getting Started\n\n1. Open the project in ThinkCode AI Platform\n2. Configure your AI Development Team\n3. Start creating tasks and workflows\n\n---\nGenerated by ThinkCode AI Platform`,

      sourceCode: `# Source Code\n\nThis directory contains the application source code.\n\n## Structure\n- **backend/**: Server-side code\n- **frontend/**: Client-side code\n- **shared/**: Shared libraries and utilities\n- **database/**: Database schemas and migrations\n- **config/**: Configuration files`,

      analysis: `# Analysis Results\n\nThis directory contains AI-generated analysis results.\n\n## Structure\n- **code/**: Code analysis reports\n- **docs/**: Document analysis results\n- **reports/**: Comprehensive analysis reports\n- **metrics/**: Performance and quality metrics`,

      tasks: `# Tasks\n\nThis directory manages project tasks.\n\n## Structure\n- **active/**: Currently active tasks\n- **completed/**: Completed tasks\n- **archived/**: Archived tasks\n- **templates/**: Task templates`,
    };

    // Create main README
    await fs.promises.writeFile(
      path.join(projectPath, 'README.md'),
      readmeContent.main
    );

    // Create subdirectory READMEs
    const structure = project.fileStructure;

    if (structure.sourceCode.backend) {
      await fs.promises.writeFile(
        path.join(projectPath, structure.sourceCode.backend, 'README.md'),
        readmeContent.sourceCode
      );
    }

    if (structure.analysis.codeAnalysis) {
      await fs.promises.writeFile(
        path.join(projectPath, structure.analysis.codeAnalysis, '../README.md'),
        readmeContent.analysis
      );
    }

    if (structure.tasks.active) {
      await fs.promises.writeFile(
        path.join(projectPath, structure.tasks.active, '../README.md'),
        readmeContent.tasks
      );
    }
  }

  /**
   * Get project path
   */
  getProjectPath(projectId: string): string {
    return path.join(this.basePath, projectId);
  }

  /**
   * Check if project directory exists
   */
  async projectExists(projectId: string): Promise<boolean> {
    try {
      const projectPath = this.getProjectPath(projectId);
      await fs.promises.access(projectPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete project directory and all contents
   */
  async deleteProject(projectId: string): Promise<FileOperationResult> {
    try {
      const projectPath = this.getProjectPath(projectId);
      await fs.promises.rm(projectPath, { recursive: true, force: true });

      return {
        success: true,
        message: 'Project directory deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to delete project directory: ${
          (error as Error).message
        }`,
        error: error as Error,
      };
    }
  }
}

export const projectFileService = new ProjectFileService();
