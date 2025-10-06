/**
 * Narzędzia wspomagające szablony workflow
 * ThinkCode AI Platform - Walidacja, wyszukiwanie i zarządzanie szablonami
 */

import {
  WorkflowTemplateEnhanced,
  TemplateValidationResult,
  TemplateSearchCriteria,
} from '../types/workflow-template.types';

export class TemplateValidationUtils {
  /**
   * Waliduje szablon workflow pod kątem kompletności i poprawności
   */
  static validateTemplate(
    template: WorkflowTemplateEnhanced
  ): TemplateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Walidacja podstawowych pól
    if (!template.id?.trim()) {
      errors.push('Brak identyfikatora szablonu');
    }

    if (!template.name?.trim()) {
      errors.push('Brak nazwy szablonu');
    }

    if (!template.steps?.length) {
      errors.push('Szablon musi zawierać co najmniej jeden krok');
    }

    // Walidacja kroków workflow
    this.validateSteps(template, errors, warnings);

    // Walidacja zatwierdzeń
    this.validateApprovals(template, errors, warnings);

    // Walidacja zależności
    this.validateDependencies(template, errors);

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  }

  private static validateSteps(
    template: WorkflowTemplateEnhanced,
    errors: string[],
    warnings: string[]
  ): void {
    template.steps.forEach((step, index) => {
      if (!step.name?.trim()) {
        errors.push(`Krok ${index + 1}: Brak nazwy kroku`);
      }

      if (!step.type) {
        errors.push(`Krok ${step.name}: Brak typu kroku`);
      }

      if (step.maxRetries < 0) {
        warnings.push(`Krok ${step.name}: Negatywna liczba ponowień`);
      }

      if (
        step.configuration?.maxTokens &&
        step.configuration.maxTokens > 8000
      ) {
        warnings.push(
          `Krok ${step.name}: Wysoka liczba tokenów może zwiększyć koszty`
        );
      }
    });
  }

  private static validateApprovals(
    template: WorkflowTemplateEnhanced,
    errors: string[],
    warnings: string[]
  ): void {
    template.approvals.forEach(approval => {
      if (!approval.stepName) {
        errors.push(`Zatwierdzenie ${approval.id}: Brak nazwy kroku`);
      }

      const stepExists = template.steps.some(
        step => step.name === approval.stepName
      );
      if (!stepExists) {
        errors.push(
          `Zatwierdzenie ${approval.id}: Krok '${approval.stepName}' nie istnieje`
        );
      }

      if (approval.timeoutMinutes && approval.timeoutMinutes > 2880) {
        // 48 godzin
        warnings.push(
          `Zatwierdzenie ${approval.id}: Długi timeout może spowalniać workflow`
        );
      }
    });
  }

  private static validateDependencies(
    template: WorkflowTemplateEnhanced,
    errors: string[]
  ): void {
    const stepNames = template.steps.map(step => step.name);

    template.steps.forEach(step => {
      step.dependencies.forEach(dep => {
        if (!stepNames.includes(dep)) {
          errors.push(`Krok ${step.name}: Zależność '${dep}' nie istnieje`);
        }
      });

      // Sprawdzanie cyklicznych zależności (uproszczone)
      if (this.hasCircularDependency(step.name, step.dependencies)) {
        errors.push(`Krok ${step.name}: Wykryto cykliczną zależność`);
      }
    });
  }

  private static hasCircularDependency(
    stepName: string,
    dependencies: string[]
  ): boolean {
    // Uproszczona kontrola - sprawdza czy krok zależy od siebie bezpośrednio
    return dependencies.includes(stepName);
  }
}

export class TemplateSearchUtils {
  /**
   * Wyszukuje szablony według kryteriów
   */
  static searchTemplates(
    templates: WorkflowTemplateEnhanced[],
    criteria: TemplateSearchCriteria
  ): WorkflowTemplateEnhanced[] {
    return templates.filter(template => {
      // Filtrowanie według kategorii
      if (criteria.category && template.category !== criteria.category) {
        return false;
      }

      // Filtrowanie według typu projektu
      if (
        criteria.projectType &&
        template.projectType !== criteria.projectType
      ) {
        return false;
      }

      // Filtrowanie według złożoności
      if (criteria.complexity && template.complexity !== criteria.complexity) {
        return false;
      }

      // Filtrowanie według wymagania zatwierdzeń
      if (criteria.requiresApproval !== undefined) {
        const hasApprovals = template.approvals.length > 0;
        if (criteria.requiresApproval !== hasApprovals) {
          return false;
        }
      }

      // Filtrowanie według maksymalnego czasu trwania
      if (
        criteria.maxDuration &&
        template.estimatedDuration > criteria.maxDuration
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sortuje szablony według różnych kryteriów
   */
  static sortTemplates(
    templates: WorkflowTemplateEnhanced[],
    sortBy: 'duration' | 'complexity' | 'name' = 'name',
    ascending = true
  ): WorkflowTemplateEnhanced[] {
    const sorted = [...templates].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'duration':
          comparison = a.estimatedDuration - b.estimatedDuration;
          break;
        case 'complexity': {
          const complexityOrder = {
            simple: 1,
            medium: 2,
            complex: 3,
            enterprise: 4,
          };
          comparison =
            complexityOrder[a.complexity] - complexityOrder[b.complexity];
          break;
        }
        case 'name':
        default:
          comparison = a.name.localeCompare(b.name, 'pl');
          break;
      }

      return ascending ? comparison : -comparison;
    });

    return sorted;
  }
}

export class TemplateMetricsUtils {
  /**
   * Oblicza metryki dla szablonu workflow
   */
  static calculateMetrics(template: WorkflowTemplateEnhanced) {
    return {
      totalSteps: template.steps.length,
      approvalSteps: template.approvals.length,
      estimatedDuration: template.estimatedDuration,
      complexityScore: this.calculateComplexityScore(template),
      riskLevel: this.assessRiskLevel(template),
    };
  }

  private static calculateComplexityScore(
    template: WorkflowTemplateEnhanced
  ): number {
    let score = 0;

    // Punkty za liczbę kroków
    score += template.steps.length * 2;

    // Punkty za zatwierdzenia
    score += template.approvals.length * 5;

    // Punkty za iteracje
    score += template.iterations.maxIterations * 3;

    // Punkty za złożoność
    const complexityMultiplier = {
      simple: 1,
      medium: 2,
      complex: 3,
      enterprise: 4,
    };
    score *= complexityMultiplier[template.complexity];

    return Math.min(100, score); // Maksymalnie 100 punktów
  }

  private static assessRiskLevel(
    template: WorkflowTemplateEnhanced
  ): 'low' | 'medium' | 'high' {
    const riskFactors = [];

    // Wysokie ryzyko przy długim czasie trwania
    if (template.estimatedDuration > 7200) {
      // > 2 godziny
      riskFactors.push('long_duration');
    }

    // Wysokie ryzyko przy wielu iteracjach
    if (template.iterations.maxIterations > 3) {
      riskFactors.push('many_iterations');
    }

    // Wysokie ryzyko przy enterprise complexity
    if (template.complexity === 'enterprise') {
      riskFactors.push('high_complexity');
    }

    // Wysokie ryzyko przy braku zatwierdzeń dla złożonych workflow
    if (template.complexity === 'complex' && template.approvals.length === 0) {
      riskFactors.push('no_approvals');
    }

    if (riskFactors.length >= 3) return 'high';
    if (riskFactors.length >= 1) return 'medium';
    return 'low';
  }
}
