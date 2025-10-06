/**
 * Enhanced Workflow Templates - Orkiestrator szablonów workflow
 * ThinkCode AI Platform - Zarządzanie szablonami workflow z mechanizmami zatwierdzeń
 */

import {
  WorkflowTemplateEnhanced,
  TemplateSearchCriteria,
} from './types/workflow-template.types';
import { NewProjectTemplate } from './templates/new-project-clean.template';
import { ExistingProjectTemplate } from './templates/existing-project.template';
import {
  TemplateValidationUtils,
  TemplateSearchUtils,
  TemplateMetricsUtils,
} from './utils/template.utils';

/**
 * Główna klasa zarządzająca szablonami workflow
 * Obsługuje różne scenariusze projektowe z zaawansowanymi funkcjami
 */
export class EnhancedWorkflowTemplates {
  private static readonly templates = new Map<
    string,
    () => WorkflowTemplateEnhanced
  >([
    ['new-project-development', NewProjectTemplate.create],
    ['existing-project-enhancement', ExistingProjectTemplate.create],
  ]);

  /**
   * Workflow dla rozwoju NOWEGO PROJEKTU
   */
  static getNewProjectWorkflow(): WorkflowTemplateEnhanced {
    return NewProjectTemplate.create();
  }

  /**
   * Workflow dla modyfikacji ISTNIEJĄCEGO PROJEKTU
   */
  static getExistingProjectWorkflow(): WorkflowTemplateEnhanced {
    return ExistingProjectTemplate.create();
  }

  /**
   * Pobiera wszystkie dostępne szablony workflow
   */
  static getAllTemplates(): WorkflowTemplateEnhanced[] {
    return Array.from(this.templates.values()).map(factory => factory());
  }

  /**
   * Pobiera szablon według identyfikatora
   */
  static getTemplate(templateId: string): WorkflowTemplateEnhanced | null {
    const factory = this.templates.get(templateId);
    return factory ? factory() : null;
  }

  /**
   * Wyszukuje szablony według kryteriów
   */
  static searchTemplates(
    criteria: TemplateSearchCriteria
  ): WorkflowTemplateEnhanced[] {
    const allTemplates = this.getAllTemplates();
    return TemplateSearchUtils.searchTemplates(allTemplates, criteria);
  }

  /**
   * Waliduje szablon workflow
   */
  static validateTemplate(template: WorkflowTemplateEnhanced) {
    return TemplateValidationUtils.validateTemplate(template);
  }

  /**
   * Oblicza metryki dla szablonu
   */
  static calculateTemplateMetrics(template: WorkflowTemplateEnhanced) {
    return TemplateMetricsUtils.calculateMetrics(template);
  }

  /**
   * Sortuje szablony według różnych kryteriów
   */
  static sortTemplates(
    templates: WorkflowTemplateEnhanced[],
    sortBy: 'duration' | 'complexity' | 'name' = 'name',
    ascending = true
  ): WorkflowTemplateEnhanced[] {
    return TemplateSearchUtils.sortTemplates(templates, sortBy, ascending);
  }

  /**
   * Pobiera szablony według kategorii
   */
  static getTemplatesByCategory(
    category: WorkflowTemplateEnhanced['category']
  ): WorkflowTemplateEnhanced[] {
    return this.searchTemplates({ category });
  }

  /**
   * Pobiera szablony według typu projektu
   */
  static getTemplatesByProjectType(
    projectType: WorkflowTemplateEnhanced['projectType']
  ): WorkflowTemplateEnhanced[] {
    return this.searchTemplates({ projectType });
  }

  /**
   * Pobiera szablony według poziomu złożoności
   */
  static getTemplatesByComplexity(
    complexity: WorkflowTemplateEnhanced['complexity']
  ): WorkflowTemplateEnhanced[] {
    return this.searchTemplates({ complexity });
  }

  /**
   * Pobiera rekomendowane szablony na podstawie kontekstu projektu
   */
  static getRecommendedTemplates(context: {
    isNewProject: boolean;
    projectType?: WorkflowTemplateEnhanced['projectType'];
    complexity?: WorkflowTemplateEnhanced['complexity'];
    requiresApproval?: boolean;
  }): WorkflowTemplateEnhanced[] {
    const criteria: TemplateSearchCriteria = {
      category: context.isNewProject ? 'new_project' : 'existing_project',
    };

    if (context.projectType) {
      criteria.projectType = context.projectType;
    }

    if (context.complexity) {
      criteria.complexity = context.complexity;
    }

    if (context.requiresApproval !== undefined) {
      criteria.requiresApproval = context.requiresApproval;
    }

    const results = this.searchTemplates(criteria);

    // Sortuj według złożoności - najprostsze pierwsze dla nowych projektów
    return this.sortTemplates(results, 'complexity', context.isNewProject);
  }

  /**
   * Pobiera statystyki dostępnych szablonów
   */
  static getTemplateStatistics() {
    const allTemplates = this.getAllTemplates();

    const stats = {
      total: allTemplates.length,
      byCategory: {} as Record<string, number>,
      byComplexity: {} as Record<string, number>,
      byProjectType: {} as Record<string, number>,
      averageDuration: 0,
      totalApprovalSteps: 0,
    };

    let totalDuration = 0;

    allTemplates.forEach(template => {
      // Statystyki kategorii
      stats.byCategory[template.category] =
        (stats.byCategory[template.category] || 0) + 1;

      // Statystyki złożoności
      stats.byComplexity[template.complexity] =
        (stats.byComplexity[template.complexity] || 0) + 1;

      // Statystyki typu projektu
      stats.byProjectType[template.projectType] =
        (stats.byProjectType[template.projectType] || 0) + 1;

      // Suma czasów trwania
      totalDuration += template.estimatedDuration;

      // Suma kroków zatwierdzających
      stats.totalApprovalSteps += template.approvals.length;
    });

    stats.averageDuration = totalDuration / allTemplates.length;

    return stats;
  }
}

export default EnhancedWorkflowTemplates;
