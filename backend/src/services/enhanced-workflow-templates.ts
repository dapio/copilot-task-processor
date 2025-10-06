/**
 * Enhanced Workflow Templates - Główny eksport (kompatybilność wsteczna)
 * ThinkCode AI Platform - Przekierowanie do nowej modularnej struktury
 */

// Eksport głównej klasy
export { EnhancedWorkflowTemplates } from './workflow-templates/enhanced-workflow-templates';

// Eksport typów
export type {
  WorkflowTemplateEnhanced,
  ApprovalStep,
  IterationConfig,
  EnhancedWorkflowStep,
  TemplateValidationResult,
  TemplateSearchCriteria,
} from './workflow-templates/types/workflow-template.types';

// Eksport domyślny dla kompatybilności
export { EnhancedWorkflowTemplates as default } from './workflow-templates/enhanced-workflow-templates';
