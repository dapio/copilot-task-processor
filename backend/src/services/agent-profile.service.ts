/**
 * Agent Profile Service
 * Manages agent visual identity, colors, icons, and display information
 */

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const CreateAgentProfileSchema = z.object({
  agentId: z.string().cuid(),
  displayName: z.string().min(1),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/), // Hex color
  icon: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  personality: z.record(z.string(), z.any()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
});

const UpdateAgentProfileSchema = CreateAgentProfileSchema.partial().omit({
  agentId: true,
});

export type CreateAgentProfileInput = z.infer<typeof CreateAgentProfileSchema>;
export type UpdateAgentProfileInput = z.infer<typeof UpdateAgentProfileSchema>;

// Predefined color palette for agents
export const AGENT_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#A855F7', // Purple
];

// Predefined icons for different agent types
export const AGENT_ICONS = {
  'business-analyst': 'chart-line',
  'system-architect': 'sitemap',
  'frontend-developer': 'desktop',
  'backend-developer': 'server',
  'qa-engineer': 'bug',
  'microsoft-reviewer': 'microsoft',
  'workflow-assistant': 'robot',
  'document-processor': 'file-text',
  'task-generator': 'tasks',
  'integration-tester': 'link',
  default: 'user',
};

export class AgentProfileService {
  /**
   * Create agent profile with auto-assigned color if not provided
   */
  async createAgentProfile(input: CreateAgentProfileInput) {
    try {
      const validatedInput = CreateAgentProfileSchema.parse(input);

      // If no color provided, assign one based on agent type or randomly
      if (!validatedInput.color) {
        const existingProfiles = (await prisma.agentProfile?.count()) || 0;
        validatedInput.color =
          AGENT_COLORS[existingProfiles % AGENT_COLORS.length];
      }

      // Auto-assign icon based on agent type
      if (!validatedInput.icon) {
        const agent = await prisma.agent.findUnique({
          where: { id: validatedInput.agentId },
          select: { type: true },
        });

        if (agent) {
          validatedInput.icon =
            AGENT_ICONS[agent.type as keyof typeof AGENT_ICONS] ||
            AGENT_ICONS.default;
        }
      }

      const profile = await prisma.agentProfile?.create({
        data: {
          ...validatedInput,
          specialties: validatedInput.specialties || [],
          personality: validatedInput.personality || {},
          settings: validatedInput.settings || {},
        },
        include: {
          agent: true,
        },
      });

      return { success: true, data: profile };
    } catch (error) {
      console.error('Error creating agent profile:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create agent profile',
      };
    }
  }

  /**
   * Get agent profile by agent ID
   */
  async getAgentProfile(agentId: string) {
    try {
      const profile = await prisma.agentProfile?.findUnique({
        where: { agentId },
        include: {
          agent: true,
        },
      });

      if (!profile) {
        // If no profile exists, create a default one
        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
        });

        if (agent) {
          return this.createAgentProfile({
            agentId,
            displayName: agent.name,
            color: AGENT_COLORS[0],
            icon:
              AGENT_ICONS[agent.type as keyof typeof AGENT_ICONS] ||
              AGENT_ICONS.default,
          });
        }

        return { success: false, error: 'Agent not found' };
      }

      return { success: true, data: profile };
    } catch (error) {
      console.error('Error fetching agent profile:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch agent profile',
      };
    }
  }

  /**
   * Update agent profile
   */
  async updateAgentProfile(agentId: string, input: UpdateAgentProfileInput) {
    try {
      const validatedInput = UpdateAgentProfileSchema.parse(input);

      const profile = await prisma.agentProfile?.update({
        where: { agentId },
        data: validatedInput,
        include: {
          agent: true,
        },
      });

      return { success: true, data: profile };
    } catch (error) {
      console.error('Error updating agent profile:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update agent profile',
      };
    }
  }

  /**
   * Get all agent profiles
   */
  async getAllAgentProfiles() {
    try {
      const profiles = await prisma.agentProfile?.findMany({
        include: {
          agent: true,
        },
        orderBy: {
          displayName: 'asc',
        },
      });

      return { success: true, data: profiles || [] };
    } catch (error) {
      console.error('Error fetching all agent profiles:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch agent profiles',
      };
    }
  }

  /**
   * Initialize profiles for all existing agents
   */
  async initializeAllAgentProfiles() {
    try {
      // Get all agents without profiles
      const agentsWithoutProfiles = await prisma.agent.findMany({
        where: {
          profile: null,
        },
      });

      const createdProfiles = [];

      for (let i = 0; i < agentsWithoutProfiles.length; i++) {
        const agent = agentsWithoutProfiles[i];
        const color = AGENT_COLORS[i % AGENT_COLORS.length];
        const icon =
          AGENT_ICONS[agent.type as keyof typeof AGENT_ICONS] ||
          AGENT_ICONS.default;

        const profileResult = await this.createAgentProfile({
          agentId: agent.id,
          displayName: agent.name,
          color,
          icon,
          bio: `${agent.name} - ${agent.type} specialized AI agent`,
          specialties: agent.capabilities ? JSON.parse(agent.capabilities) : [],
        });

        if (profileResult.success) {
          createdProfiles.push(profileResult.data);
        }
      }

      return {
        success: true,
        data: {
          createdProfiles,
          totalCreated: createdProfiles.length,
          totalProcessed: agentsWithoutProfiles.length,
        },
      };
    } catch (error) {
      console.error('Error initializing agent profiles:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to initialize agent profiles',
      };
    }
  }

  /**
   * Get agents by workflow step with their profiles
   */
  async getStepAgents(stepId: string) {
    try {
      // This would need to be implemented based on workflow step definition
      // For now, return all agents with profiles
      const profiles = await this.getAllAgentProfiles();

      return profiles;
    } catch (error) {
      console.error('Error fetching step agents:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch step agents',
      };
    }
  }

  /**
   * Assign color theme to agent
   */
  async assignColorTheme(
    agentId: string,
    colorTheme: {
      primary: string;
      secondary?: string;
      accent?: string;
    }
  ) {
    try {
      const profile = await this.updateAgentProfile(agentId, {
        color: colorTheme.primary,
        settings: {
          colorTheme,
        },
      });

      return profile;
    } catch (error) {
      console.error('Error assigning color theme:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to assign color theme',
      };
    }
  }

  /**
   * Get available colors not yet assigned
   */
  async getAvailableColors() {
    try {
      const usedColors = await prisma.agentProfile?.findMany({
        select: { color: true },
      });

      const usedColorSet = new Set(usedColors?.map(p => p.color) || []);
      const availableColors = AGENT_COLORS.filter(
        color => !usedColorSet.has(color)
      );

      return {
        success: true,
        data: {
          available: availableColors,
          used: Array.from(usedColorSet),
          all: AGENT_COLORS,
        },
      };
    } catch (error) {
      console.error('Error fetching available colors:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch available colors',
      };
    }
  }

  /**
   * Get agents by project (through task assignments)
   */
  async getAgentsByProject(projectId: string) {
    try {
      // Find agents that have tasks assigned in this project
      const agents = await prisma.agent.findMany({
        where: {
          tasks: {
            some: {
              projectId,
            },
          },
        },
        include: {
          profile: true,
          tasks: {
            where: {
              projectId,
            },
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return { success: true, data: agents || [] };
    } catch (error) {
      console.error('Error fetching agents by project:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch agents by project',
      };
    }
  }
}
