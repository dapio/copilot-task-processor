/**
 * Workflow Routes Handler
 * Obsługa endpointów związanych z workflow
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import {
  ApiResponse,
  EnhancedApiDependencies,
  WorkflowExecutionRequest,
} from '../types/api.types';
import {
  workflowExecutionSchema,
  workflowTemplateSchema,
} from '../schemas/validation.schemas';

export class WorkflowRoutesHandler {
  private deps: EnhancedApiDependencies;

  constructor(dependencies: EnhancedApiDependencies) {
    this.deps = dependencies;
  }

  /**
   * GET /api/enhanced/workflows/templates
   * Pobiera listę dostępnych template'ów workflow
   */
  async getWorkflowTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { category, complexity } = req.query;

      let templates = this.deps.workflowController.getWorkflowTemplates();

      // Filtruj po kategorii
      if (category) {
        templates = templates.filter((t: any) => t.category === category);
      }

      // Filtruj po złożoności
      if (complexity) {
        templates = templates.filter((t: any) => t.complexity === complexity);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          templates,
          total: templates.length,
          categories: [...new Set(templates.map((t: any) => t.category))],
          complexities: [...new Set(templates.map((t: any) => t.complexity))],
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania templates workflow',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/enhanced/workflows/templates
   * Tworzy nowy template workflow
   */
  async createWorkflowTemplate(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = workflowTemplateSchema.parse(req.body);

      const templateId =
        await this.deps.workflowController.createWorkflowTemplate(
          validatedData
        );

      const response: ApiResponse = {
        success: true,
        data: {
          templateId,
          name: validatedData.name,
          category: validatedData.category,
          complexity: validatedData.complexity,
          stepsCount: validatedData.steps.length,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Błąd walidacji',
          details: error.issues,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: false,
        error: 'Błąd tworzenia template workflow',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/workflows/templates/:templateId
   * Pobiera szczegóły template workflow
   */
  async getWorkflowTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const template =
        this.deps.workflowController.getWorkflowTemplate(templateId);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template workflow nie został znaleziony',
          message: `Template o ID ${templateId} nie istnieje`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: template,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania template workflow',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/enhanced/workflows/execute
   * Wykonuje workflow
   */
  async executeWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = workflowExecutionSchema.parse(
        req.body
      ) as WorkflowExecutionRequest;

      let result;

      if (validatedData.templateId) {
        // Wykonanie z template
        result = await this.deps.workflowController.executeWorkflow(
          validatedData.templateId,
          {
            contextId: validatedData.contextId,
            contextType: validatedData.contextType,
            priority: validatedData.priority,
            metadata: {
              projectId: validatedData.projectId,
            },
          }
        );
      } else if (validatedData.customSteps) {
        // Custom workflow implementation
        try {
          console.log(
            `🔧 Creating custom workflow with ${validatedData.customSteps.length} steps`
          );

          // Create custom workflow template
          const customTemplate = {
            id: `custom-${Date.now()}`,
            name: `Custom Workflow - ${new Date().toISOString().substr(0, 19)}`,
            description: `User-defined custom workflow with ${validatedData.customSteps.length} steps`,
            category: 'custom',
            complexity: 'medium' as const,
            steps: validatedData.customSteps.map(
              (step: any, index: number) => ({
                id: `step-${index + 1}`,
                name: step.name || `Custom Step ${index + 1}`,
                type: step.type || 'generic',
                config: step.config || {},
                dependencies: step.dependencies || [],
              })
            ),
            approvals: [],
            estimatedDuration: validatedData.customSteps.length * 300, // 5min per step
            metadata: {
              projectId: validatedData.projectId,
              isCustom: true,
              createdBy: 'user',
            },
          };

          // Execute custom workflow
          result = await this.deps.workflowController.executeWorkflow(
            customTemplate.id,
            {
              template: customTemplate,
              contextType: validatedData.contextType,
              priority: validatedData.priority,
              metadata: {
                projectId: validatedData.projectId,
              },
            }
          );

          console.log(
            `✅ Custom workflow execution result:`,
            result.success ? 'SUCCESS' : 'FAILED'
          );
        } catch (error) {
          console.error('❌ Custom workflow execution failed:', error);
          result = {
            success: false,
            error: `Custom workflow execution failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          };
        }
      } else {
        result = {
          success: false,
          error: 'Brak templateId lub customSteps - wymagane jest jedno z nich',
        };
      }

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          executionId: result.executionId,
          message: 'Workflow został uruchomiony pomyślnie',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Błąd walidacji',
          details: error.issues,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: false,
        error: 'Błąd wykonania workflow',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/workflows/executions/:executionId
   * Pobiera status wykonania workflow
   */
  async getWorkflowExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const execution = this.deps.workflowController.getExecution(executionId);

      if (!execution) {
        res.status(404).json({
          success: false,
          error: 'Wykonanie workflow nie zostało znalezione',
          message: `Execution o ID ${executionId} nie istnieje`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: execution,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania wykonania workflow',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * POST /api/enhanced/workflows/executions/:executionId/pause
   * Pauzuje wykonanie workflow
   */
  async pauseWorkflowExecution(req: Request, res: Response): Promise<void> {
    try {
      const { executionId } = req.params;

      const success = await this.deps.workflowController.pauseExecution(
        executionId
      );

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Nie można wstrzymać wykonania workflow',
          message: `Execution o ID ${executionId} nie istnieje lub nie może być wstrzymane`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: {
          executionId,
          message: 'Wykonanie workflow zostało wstrzymane',
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd wstrzymywania wykonania workflow',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }

  /**
   * GET /api/enhanced/workflows/stats
   * Pobiera statystyki workflow
   */
  async getWorkflowStats(req: Request, res: Response): Promise<void> {
    try {
      const executionStats = this.deps.workflowController.getExecutionStats();
      const templates = this.deps.workflowController.getWorkflowTemplates();

      const response: ApiResponse = {
        success: true,
        data: {
          executions: executionStats,
          templates: {
            total: templates.length,
            byCategory: templates.reduce((acc: any, template: any) => {
              acc[template.category] = (acc[template.category] || 0) + 1;
              return acc;
            }, {}),
            byComplexity: templates.reduce((acc: any, template: any) => {
              acc[template.complexity] = (acc[template.complexity] || 0) + 1;
              return acc;
            }, {}),
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Błąd pobierania statystyk workflow',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  }
}
