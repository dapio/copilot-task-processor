#!/usr/bin/env node

/**
 * ThinkCode AI Platform - Agent Instructions Initialization
 * Comprehensive agent instruction setup for enterprise functionality
 */

import { PrismaClient } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

interface AgentInstruction {
  id: string;
  agentType: string;
  category: string;
  instruction: string;
  priority: number;
  isActive: boolean;
}

interface InstructionCategory {
  name: string;
  description: string;
  instructions: Omit<AgentInstruction, 'id' | 'category'>[];
}

class AgentInstructionsInitializer {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initializeInstructions(): Promise<void> {
    try {
      console.log(
        '🤖 Initializing ThinkCode AI Platform Agent Instructions...'
      );

      const instructionCategories = this.getInstructionCategories();

      for (const category of instructionCategories) {
        await this.initializeCategoryInstructions(category);
      }

      console.log('✅ Agent instructions initialization completed!');
    } catch (error) {
      console.error('❌ Agent instructions initialization failed:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private getInstructionCategories(): InstructionCategory[] {
    return [
      {
        name: 'workflow-management',
        description: 'Instructions for workflow assistant agents',
        instructions: [
          {
            agentType: 'workflow-assistant',
            instruction:
              'Always validate workflow steps before execution and provide clear status updates.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'workflow-assistant',
            instruction:
              'Use the Result<T, E> pattern for all workflow operations to ensure bulletproof error handling.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'workflow-assistant',
            instruction:
              'Provide fallback strategies when primary workflow steps fail.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'workflow-assistant',
            instruction:
              'Log all workflow execution details for debugging and monitoring purposes.',
            priority: 4,
            isActive: true,
          },
        ],
      },
      {
        name: 'business-analysis',
        description: 'Instructions for business analyst agents',
        instructions: [
          {
            agentType: 'business-analyst',
            instruction:
              'Focus on business value and ROI when analyzing requirements and solutions.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'business-analyst',
            instruction:
              'Always consider enterprise scalability and compliance requirements.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'business-analyst',
            instruction:
              'Provide clear business justifications for technical decisions and recommendations.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'business-analyst',
            instruction:
              'Identify potential risks and mitigation strategies for business processes.',
            priority: 4,
            isActive: true,
          },
        ],
      },
      {
        name: 'quality-assurance',
        description: 'Instructions for QA engineer agents',
        instructions: [
          {
            agentType: 'qa-engineer',
            instruction:
              'Maintain minimum 85% code coverage for all components and 95% for services.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'qa-engineer',
            instruction:
              'Ensure all components meet WCAG 2.1 AA accessibility standards.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'qa-engineer',
            instruction:
              'Validate that all forms include proper error handling and validation.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'qa-engineer',
            instruction:
              'Test both happy path and edge cases, including error scenarios.',
            priority: 4,
            isActive: true,
          },
          {
            agentType: 'qa-engineer',
            instruction:
              'Verify performance metrics meet enterprise standards (Lighthouse > 90).',
            priority: 5,
            isActive: true,
          },
        ],
      },
      {
        name: 'microsoft-expertise',
        description: 'Instructions for Microsoft technology reviewers',
        instructions: [
          {
            agentType: 'microsoft-reviewer',
            instruction:
              'Apply Microsoft Azure best practices for all cloud-related implementations.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'microsoft-reviewer',
            instruction:
              'Ensure TypeScript implementations follow Microsoft TypeScript guidelines.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'microsoft-reviewer',
            instruction:
              'Recommend Azure services that align with enterprise requirements and budget.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'microsoft-reviewer',
            instruction:
              'Consider Microsoft security and compliance frameworks in all recommendations.',
            priority: 4,
            isActive: true,
          },
        ],
      },
      {
        name: 'devops-operations',
        description: 'Instructions for DevOps engineer agents',
        instructions: [
          {
            agentType: 'devops-engineer',
            instruction:
              'Implement comprehensive monitoring and alerting for all production services.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'devops-engineer',
            instruction:
              'Ensure all deployments include rollback procedures and health checks.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'devops-engineer',
            instruction:
              'Apply infrastructure as code principles using tools like Terraform or ARM templates.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'devops-engineer',
            instruction:
              'Configure automated backup and disaster recovery procedures.',
            priority: 4,
            isActive: true,
          },
          {
            agentType: 'devops-engineer',
            instruction:
              'Implement security scanning and vulnerability assessments in CI/CD pipelines.',
            priority: 5,
            isActive: true,
          },
        ],
      },
      {
        name: 'senior-development',
        description: 'Instructions for senior developer agents',
        instructions: [
          {
            agentType: 'senior-developer',
            instruction:
              'Enforce service-hook-component architecture pattern throughout the application.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'senior-developer',
            instruction:
              'Ensure all async operations use the Result<T, E> pattern for error handling.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'senior-developer',
            instruction:
              'Review code for performance optimizations including memoization and lazy loading.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'senior-developer',
            instruction:
              'Validate that all components have proper TypeScript types and JSDoc documentation.',
            priority: 4,
            isActive: true,
          },
          {
            agentType: 'senior-developer',
            instruction:
              'Ensure security best practices including input validation and sanitization.',
            priority: 5,
            isActive: true,
          },
        ],
      },
      {
        name: 'ux-design',
        description: 'Instructions for UX designer agents',
        instructions: [
          {
            agentType: 'ux-designer',
            instruction:
              'Design for mobile-first responsive layouts with accessible color contrasts.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'ux-designer',
            instruction:
              'Ensure all interactive elements have clear focus states and keyboard navigation.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'ux-designer',
            instruction:
              'Provide loading states, error states, and empty states for all data components.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'ux-designer',
            instruction:
              'Design consistent visual hierarchy and information architecture.',
            priority: 4,
            isActive: true,
          },
          {
            agentType: 'ux-designer',
            instruction:
              'Include contextual help and clear error messages for user guidance.',
            priority: 5,
            isActive: true,
          },
        ],
      },
      {
        name: 'enterprise-standards',
        description: 'Cross-cutting enterprise standard instructions',
        instructions: [
          {
            agentType: 'all',
            instruction:
              'All implementations must follow enterprise-grade standards with no compromises.',
            priority: 1,
            isActive: true,
          },
          {
            agentType: 'all',
            instruction:
              'Maintain comprehensive documentation and inline code comments.',
            priority: 2,
            isActive: true,
          },
          {
            agentType: 'all',
            instruction:
              'Follow the established project structure and naming conventions.',
            priority: 3,
            isActive: true,
          },
          {
            agentType: 'all',
            instruction:
              'Implement proper logging and error tracking for all operations.',
            priority: 4,
            isActive: true,
          },
        ],
      },
    ];
  }

  private async initializeCategoryInstructions(
    category: InstructionCategory
  ): Promise<void> {
    console.log(`📝 Initializing ${category.name} instructions...`);

    for (const instruction of category.instructions) {
      await this.createOrUpdateInstruction({
        ...instruction,
        id: this.generateInstructionId(instruction.agentType, category.name),
        category: category.name,
      });
    }

    console.log(
      `  ✓ ${category.instructions.length} instructions processed for ${category.name}`
    );
  }

  private async createOrUpdateInstruction(
    instruction: AgentInstruction
  ): Promise<void> {
    try {
      // Note: This would typically use a dedicated AgentInstruction table
      // For now, we'll create a JSON file to store these instructions

      const instructionsDir = path.join(
        process.cwd(),
        'backend',
        'src',
        'agents',
        'instructions'
      );
      await fs.mkdir(instructionsDir, { recursive: true });

      const filePath = path.join(
        instructionsDir,
        `${instruction.agentType}-instructions.json`
      );

      let existingInstructions: AgentInstruction[] = [];

      try {
        const existingContent = await fs.readFile(filePath, 'utf-8');
        existingInstructions = JSON.parse(existingContent);
      } catch {
        // File doesn't exist yet, start with empty array
      }

      // Check if instruction already exists
      const existingIndex = existingInstructions.findIndex(
        existing => existing.id === instruction.id
      );

      if (existingIndex >= 0) {
        // Update existing instruction
        existingInstructions[existingIndex] = instruction;
      } else {
        // Add new instruction
        existingInstructions.push(instruction);
      }

      // Sort by priority
      existingInstructions.sort((a, b) => a.priority - b.priority);

      await fs.writeFile(
        filePath,
        JSON.stringify(existingInstructions, null, 2)
      );
    } catch (error) {
      console.error(
        `  ❌ Failed to create/update instruction ${instruction.id}:`,
        error
      );
      throw error;
    }
  }

  private generateInstructionId(agentType: string, category: string): string {
    const timestamp = Date.now();
    return `${agentType}-${category}-${timestamp}`;
  }

  async validateInstructions(): Promise<void> {
    console.log('🔍 Validating agent instructions...');

    const instructionsDir = path.join(
      process.cwd(),
      'backend',
      'src',
      'agents',
      'instructions'
    );

    try {
      const files = await fs.readdir(instructionsDir);

      for (const file of files) {
        if (file.endsWith('-instructions.json')) {
          const filePath = path.join(instructionsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const instructions = JSON.parse(content);

          console.log(
            `  ✓ ${file}: ${instructions.length} instructions loaded`
          );
        }
      }
    } catch (error) {
      console.error('  ❌ Instructions validation failed:', error);
      throw error;
    }
  }
}

// Main execution
if (require.main === module) {
  const initializer = new AgentInstructionsInitializer();

  Promise.resolve()
    .then(() => initializer.initializeInstructions())
    .then(() => initializer.validateInstructions())
    .then(() => {
      console.log(
        '🎉 Agent instructions initialization completed successfully!'
      );
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Agent instructions initialization failed:', error);
      process.exit(1);
    });
}

export { AgentInstructionsInitializer };
