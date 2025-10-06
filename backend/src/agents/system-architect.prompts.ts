/**
 * System Architecture Prompt Builder
 * Separated prompt building logic for System Architect Agent
 */

import {
  SystemArchitecture,
  ProjectRequirement,
  ArchitectureConstraint,
  LoadProjection,
} from './types/system-architect.types';
import {
  ARCHITECTURE_DESIGN_TEMPLATE,
  TECHNOLOGY_SELECTION_TEMPLATE,
  SCALABILITY_ANALYSIS_TEMPLATE,
} from './templates/architecture-templates';

export class SystemArchitectPrompts {
  static buildArchitectureDesignPrompt(
    requirements: ProjectRequirement[],
    constraints: ArchitectureConstraint[]
  ): string {
    const requirementsList = requirements
      .map(
        req =>
          `- ${req.type.toUpperCase()}: ${req.description} (Priorytet: ${
            req.priority
          })`
      )
      .join('\n');

    const constraintsList = constraints
      .map(
        constraint =>
          `- ${constraint.type.toUpperCase()}: ${
            constraint.description
          } (Wpływ: ${constraint.impact})`
      )
      .join('\n');

    return ARCHITECTURE_DESIGN_TEMPLATE.replace(
      '{requirements}',
      requirementsList
    ).replace('{constraints}', constraintsList);
  }

  static buildTechnologySelectionPrompt(
    requirements: ProjectRequirement[],
    constraints: ArchitectureConstraint[]
  ): string {
    const requirementsList = requirements
      .map(req => `- ${req.description} (Priorytet: ${req.priority})`)
      .join('\n');

    const constraintsList = constraints
      .map(constraint => `- ${constraint.type}: ${constraint.description}`)
      .join('\n');

    return TECHNOLOGY_SELECTION_TEMPLATE.replace(
      '{requirements}',
      requirementsList
    ).replace('{constraints}', constraintsList);
  }

  static buildScalabilityAnalysisPrompt(
    architecture: SystemArchitecture,
    loadProjections: LoadProjection[]
  ): string {
    const projectionsList = loadProjections
      .map(
        proj =>
          `- ${proj.metric}: ${proj.current} → ${proj.projected} (${proj.timeframe})`
      )
      .join('\n');

    const architectureInfo = `Typ: ${architecture.type}, Komponenty: ${
      architecture.components?.length || 0
    }, Warstwy: ${architecture.layers?.length || 0}`;

    return SCALABILITY_ANALYSIS_TEMPLATE.replace(
      '{architectureInfo}',
      architectureInfo
    ).replace('{projections}', projectionsList);
  }
}
