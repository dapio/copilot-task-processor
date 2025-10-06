/**
 * System Architect Agent - Refactored
 * AI agent specialized in system architecture design and analysis
 */

import { SystemArchitectPrompts } from './system-architect.prompts';
import { SystemArchitectLogicService } from './services/system-architect.logic';
import {
  SystemArchitecture,
  ProjectRequirement,
  ArchitectureConstraint,
  ArchitectureAnalysisRequest,
  ArchitectureReview,
} from './types/system-architect.types';

export class SystemArchitectAgent {
  private readonly agentId: string;
  private readonly name: string;
  private readonly description: string;

  constructor() {
    this.agentId = 'system-architect';
    this.name = 'System Architect Agent';
    this.description = 'System Architecture Design and Analysis';
  }

  private log(
    level: 'info' | 'debug' | 'warn' | 'error',
    message: string,
    meta?: any
  ) {
    console[level](`[${this.agentId}] ${message}`, meta || '');
  }

  private async sendPrompt(): Promise<string> {
    // Mock implementation - in real scenario, this would call ML provider
    return JSON.stringify({
      architecture: {
        name: 'Sample Architecture',
        type: 'microservices',
        description: 'AI-generated architecture',
        layers: [],
        components: [],
      },
    });
  }

  /**
   * Design system architecture based on requirements and constraints
   */
  async designArchitecture(
    request: ArchitectureAnalysisRequest
  ): Promise<SystemArchitecture> {
    try {
      this.log('info', 'Starting architecture design process', {
        projectId: request.projectId,
      });

      // Analyze requirements
      const requirementAnalysis =
        SystemArchitectLogicService.analyzeRequirements(request.requirements);
      this.log('debug', 'Requirements analysis completed', {
        complexity: requirementAnalysis.complexity,
      });

      // Generate architecture design prompt
      SystemArchitectPrompts.buildArchitectureDesignPrompt(
        request.requirements,
        request.constraints
      );

      // Get AI response
      const response = await this.sendPrompt();
      const architectureData = this.parseArchitectureResponse(response);

      // Validate and enhance architecture
      const validation = SystemArchitectLogicService.validateArchitecture(
        architectureData,
        request.requirements,
        request.constraints
      );

      if (!validation.valid) {
        this.log('warn', 'Architecture validation failed', {
          violations: validation.violations,
        });
        throw new Error(
          `Architecture validation failed: ${validation.violations.join(', ')}`
        );
      }

      this.log('info', 'Architecture design completed successfully', {
        score: validation.score,
        recommendations: validation.recommendations.length,
      });

      return architectureData;
    } catch (error: any) {
      this.log('error', 'Architecture design failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Review and validate existing architecture
   */
  async reviewArchitecture(
    architecture: SystemArchitecture,
    requirements: ProjectRequirement[],
    constraints: ArchitectureConstraint[]
  ): Promise<ArchitectureReview> {
    try {
      this.log('info', 'Starting architecture review');

      // Validate architecture
      const validation = SystemArchitectLogicService.validateArchitecture(
        architecture,
        requirements,
        constraints
      );

      // Create architecture review
      const review: ArchitectureReview = {
        architecture,
        strengths: this.identifyStrengths(architecture),
        weaknesses: validation.violations,
        risks: this.identifyRisks(architecture),
        recommendations: validation.recommendations.map(rec => ({
          type: 'improvement' as const,
          description: rec,
          priority: 'medium' as const,
          effort: 'To be estimated',
          benefits: ['Improved architecture quality'],
        })),
        score: validation.score,
      };

      this.log('info', 'Architecture review completed', {
        score: review.score,
      });
      return review;
    } catch (error: any) {
      this.log('error', 'Architecture review failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate architecture diagrams
   */
  async generateDiagrams(architecture: SystemArchitecture): Promise<string[]> {
    try {
      this.log('info', 'Generating architecture diagrams');

      const diagrams: string[] = [];

      // Generate system context diagram
      const contextDiagram = this.generateContextDiagram(architecture);
      diagrams.push(contextDiagram);

      // Generate component diagram
      const componentDiagram = this.generateComponentDiagram(architecture);
      diagrams.push(componentDiagram);

      // Generate deployment diagram
      const deploymentDiagram = this.generateDeploymentDiagram(architecture);
      diagrams.push(deploymentDiagram);

      this.log('info', 'Architecture diagrams generated successfully', {
        count: diagrams.length,
      });
      return diagrams;
    } catch (error: any) {
      this.log('error', 'Diagram generation failed', { error: error.message });
      throw error;
    }
  }

  // Private helper methods

  private parseArchitectureResponse(response: string): SystemArchitecture {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in architecture response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return this.buildSystemArchitectureFromParsed(parsed);
    } catch (error: any) {
      this.log('error', 'Failed to parse architecture response', {
        error: error.message,
      });
      throw new Error(`Architecture response parsing failed: ${error.message}`);
    }
  }

  private buildSystemArchitectureFromParsed(parsed: any): SystemArchitecture {
    const defaultQualityAttribute = {
      level: 'medium' as const,
      requirements: [],
      strategies: [],
      metrics: [],
    };

    return {
      id: `arch_${Date.now()}`,
      name: parsed.architecture?.name || 'Generated Architecture',
      type: parsed.architecture?.type || 'layered',
      description:
        parsed.architecture?.description || 'AI-generated architecture',
      layers: parsed.architecture?.layers || [],
      components: parsed.architecture?.components || [],
      integrations: parsed.architecture?.integrations || [],
      scalability:
        parsed.qualityAttributes?.scalability || defaultQualityAttribute,
      performance:
        parsed.qualityAttributes?.performance || defaultQualityAttribute,
      security: parsed.qualityAttributes?.security || defaultQualityAttribute,
      maintainability:
        parsed.qualityAttributes?.maintainability || defaultQualityAttribute,
      availability:
        parsed.qualityAttributes?.availability || defaultQualityAttribute,
      technologyStack: this.buildDefaultTechnologyStack(parsed.technologyStack),
      dataStrategy: {
        approach: 'centralized',
        databases: [],
        dataFlow: [],
        consistency: 'strong',
      },
      deploymentStrategy: this.buildDefaultDeploymentStrategy(
        parsed.deploymentStrategy
      ),
      diagrams: [],
      decisions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private buildDefaultTechnologyStack(technologyStack?: any) {
    return (
      technologyStack || {
        frontend: [],
        backend: [],
        database: [],
        infrastructure: [],
        monitoring: [],
      }
    );
  }

  private buildDefaultDeploymentStrategy(deploymentStrategy?: any) {
    return (
      deploymentStrategy || {
        approach: 'containerized' as const,
        environment: [],
        cicd: { pipeline: '', stages: [], tools: [], automation: [] },
        scaling: {
          horizontal: true,
          vertical: false,
          autoScaling: false,
          triggers: [],
        },
      }
    );
  }

  private identifyStrengths(architecture: SystemArchitecture): string[] {
    const strengths: string[] = [];

    if (architecture.layers && architecture.layers.length >= 3) {
      strengths.push('Well-defined layered architecture');
    }

    if (architecture.components && architecture.components.length > 0) {
      strengths.push('Clear component separation');
    }

    if (
      architecture.technologyStack &&
      architecture.technologyStack.monitoring?.length > 0
    ) {
      strengths.push('Monitoring capabilities included');
    }

    return strengths;
  }

  private identifyRisks(architecture: SystemArchitecture): any[] {
    const risks: any[] = [];

    // Single point of failure check
    const dbComponents =
      architecture.components?.filter(c => c.type === 'database') || [];
    if (dbComponents.length === 1) {
      risks.push({
        type: 'technical',
        description: 'Single database may become a bottleneck',
        impact: 'medium',
        probability: 'medium',
        mitigation: ['Implement database clustering', 'Add read replicas'],
      });
    }

    return risks;
  }

  private generateContextDiagram(architecture: SystemArchitecture): string {
    return `
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

title System Context Diagram - ${architecture.name}

Person(user, "User", "System user")
System(system, "${architecture.name}", "${architecture.description}")

Rel(user, system, "Uses")
@enduml
    `.trim();
  }

  private generateComponentDiagram(architecture: SystemArchitecture): string {
    let diagram = `
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml

title Component Diagram - ${architecture.name}

Container_Boundary(system, "${architecture.name}") {
`;

    architecture.components?.forEach(component => {
      diagram += `  Component(${component.name.replace(/\s+/g, '_')}, "${
        component.name
      }", "${component.description}")\n`;
    });

    diagram += '}\n@enduml';
    return diagram.trim();
  }

  private generateDeploymentDiagram(architecture: SystemArchitecture): string {
    return `
@startuml
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Deployment.puml

title Deployment Diagram - ${architecture.name}

Deployment_Node(server, "Server", "Production Environment") {
  Container(app, "${architecture.name}", "${architecture.description}")
}
@enduml
    `.trim();
  }
}
