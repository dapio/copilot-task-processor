/**
 * Task Execution Engine
 * ThinkCode AI Platform - Bulletproof Agent Task Processing
 */

import { PrismaClient, Agent, WorkflowStep } from '@prisma/client';
import { IMLProvider } from '../providers/ml-provider.interface';
import { createMLProviderWithFallback, getDefaultProviderConfigs } from '../providers/ml-provider.factory';

export interface ExecutionContext {
  workflowId: string;
  stepId: string;
  agentId: string;
  inputs?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface StepResult {
  success: boolean;
  outputs?: Record<string, any>;
  error?: string;
  duration: number;
  retryCount: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface ExecutionError {
  code: string;
  message: string;
  retryable: boolean;
  workflowId?: string;
  details?: any;
}

export type ExecutionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ExecutionError };

/**
 * Task Execution Engine - Core orchestrator for agent tasks
 */
export class TaskExecutionEngine {
  private prisma: PrismaClient;
  private providerCache = new Map<string, IMLProvider>();
  private executionMetrics = new Map<string, any>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Execute a single workflow step
   */
  async executeWorkflowStep(
    stepId: string,
    context?: Partial<ExecutionContext>
  ): Promise<ExecutionResult<StepResult>> {
    const startTime = Date.now();
    let retryCount = 0;

    try {
      // 1. Load workflow step with agent and dependencies
      const step = await this.prisma.workflowStep.findUnique({
        where: { id: stepId },
        include: {
          assignedAgent: true,
          workflow: true,
        },
      });

      if (!step) {
        return {
          success: false,
          error: {
            code: 'STEP_NOT_FOUND',
            message: `Workflow step ${stepId} not found`,
            retryable: false,
          }
        };
      }

      if (!step.assignedAgent) {
        return {
          success: false,
          error: {
            code: 'NO_AGENT_ASSIGNED',
            message: `No agent assigned to step ${stepId}`,
            retryable: false,
          }
        };
      }

      // 2. Update step status to 'running'
      await this.updateStepStatus(stepId, 'running', { startedAt: new Date() });

      // 3. Create execution context
      const executionContext: ExecutionContext = {
        workflowId: step.workflowId,
        stepId: step.id,
        agentId: step.assignedAgent.id,
        inputs: this.parseInputs(step.inputs),
        metadata: {
          ...context?.metadata,
          stepName: step.name,
          agentName: step.assignedAgent.name,
          workflowType: step.workflow.type,
        }
      };

      // 4. Execute with retry logic
      const maxRetries = 3;
      let lastError: any;

      for (retryCount = 0; retryCount <= maxRetries; retryCount++) {
        try {
          const stepResult = await this.executeStepWithAgent(
            step, 
            step.assignedAgent, 
            executionContext
          );

          if (stepResult.success) {
            // 5. Update step with success
            await this.updateStepStatus(stepId, 'completed', {
              completedAt: new Date(),
              outputs: JSON.stringify(stepResult.data.outputs),
            });

            const duration = Date.now() - startTime;
            const result: StepResult = {
              success: true,
              outputs: stepResult.data.outputs,
              duration,
              retryCount,
              confidence: stepResult.data.confidence,
              metadata: stepResult.data.metadata,
            };

            // Record metrics
            this.recordExecutionMetrics(executionContext, result);

            return { success: true, data: result };
          }

          lastError = stepResult.error;

          // Check if error is retryable
          if (!stepResult.error.retryable || retryCount >= maxRetries) {
            break;
          }

          // Wait before retry (exponential backoff)
          await this.sleep(Math.pow(2, retryCount) * 1000);

        } catch (error) {
          lastError = error;
          if (retryCount >= maxRetries) break;
          await this.sleep(Math.pow(2, retryCount) * 1000);
        }
      }

      // 6. Handle failure
      const errorMessage = lastError?.message || 'Unknown execution error';
      await this.updateStepStatus(stepId, 'failed', {
        errors: JSON.stringify({ 
          message: errorMessage, 
          retryCount, 
          lastError 
        }),
      });

      const duration = Date.now() - startTime;
      return {
        success: false,
        error: {
          code: 'EXECUTION_FAILED',
          message: errorMessage,
          retryable: false,
          details: { retryCount, duration, lastError }
        }
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Update step status to failed
      await this.updateStepStatus(stepId, 'failed', {
        errors: JSON.stringify({ message: error.message, duration }),
      }).catch(console.error);

      return {
        success: false,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
          retryable: false,
          details: { error, duration }
        }
      };
    }
  }

  /**
   * Execute step with assigned agent
   */
  private async executeStepWithAgent(
    step: WorkflowStep,
    agent: Agent,
    context: ExecutionContext
  ): Promise<ExecutionResult<any>> {
    // 1. Get ML Provider for agent
    const providerResult = await this.getMLProviderForAgent(agent);
    if (!providerResult.success) {
      return providerResult;
    }

    const provider = providerResult.data;

    // 2. Build execution prompt based on step type
    const prompt = await this.buildExecutionPrompt(step, agent, context);

    // 3. Execute with ML provider
    const generationResult = await provider.generateText(prompt, {
      temperature: 0.7,
      maxTokens: 2000,
    });

    if (!generationResult.success) {
      return {
        success: false,
        error: {
          code: 'ML_GENERATION_FAILED',
          message: generationResult.error.message,
          retryable: generationResult.error.retryable || false,
          details: generationResult.error
        }
      };
    }

    // 4. Parse and validate results
    try {
      const outputs = this.parseExecutionResult(generationResult.data.text, step);
      const confidence = this.calculateConfidence(generationResult.data, step);

      return {
        success: true,
        data: {
          outputs,
          confidence,
          metadata: {
            provider: provider.name,
            model: generationResult.data.metadata?.model,
            usage: generationResult.data.usage,
            prompt: prompt,
          }
        }
      };

    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'RESULT_PARSING_ERROR',
          message: `Failed to parse execution result: ${error.message}`,
          retryable: true,
          details: { error, rawResult: generationResult.data.text }
        }
      };
    }
  }

  /**
   * Get ML Provider for agent with fallback logic
   */
  private async getMLProviderForAgent(agent: Agent): Promise<ExecutionResult<IMLProvider>> {
    const cacheKey = `agent-${agent.id}`;
    
    // Check cache first
    if (this.providerCache.has(cacheKey)) {
      const cachedProvider = this.providerCache.get(cacheKey)!;
      const isAvailable = await cachedProvider.isAvailable();
      if (isAvailable) {
        return { success: true, data: cachedProvider };
      }
      this.providerCache.delete(cacheKey);
    }

    // Get provider configs (agent-specific or default)
    const configs = getDefaultProviderConfigs()
      .filter(config => config.enabled)
      .sort((a, b) => a.priority - b.priority);

    // Try each provider config
    for (const config of configs) {
      const providerResult = await createMLProviderWithFallback(config);
      if (providerResult.success) {
        this.providerCache.set(cacheKey, providerResult.data);
        return providerResult;
      }
    }

    return {
      success: false,
      error: {
        code: 'NO_PROVIDER_AVAILABLE',
        message: 'No ML provider available for agent',
        retryable: true,
      }
    };
  }

  /**
   * Build execution prompt for step
   */
  private async buildExecutionPrompt(
    step: WorkflowStep,
    agent: Agent,
    context: ExecutionContext
  ): Promise<string> {
    const capabilities = this.parseCapabilities(agent.capabilities);
    const inputs = context.inputs || {};
    const knowledgeContext = 'Knowledge feeds will be loaded in future implementation';

    return `
You are ${agent.name}, an AI agent with the following capabilities: ${capabilities.join(', ')}.

TASK CONTEXT:
- Workflow: ${context.metadata?.workflowType}
- Step: ${step.name}
- Description: ${step.description || 'No description provided'}
- Step Number: ${step.stepNumber}

INPUTS:
${JSON.stringify(inputs, null, 2)}

KNOWLEDGE CONTEXT:
${knowledgeContext}

INSTRUCTIONS:
1. Analyze the task requirements based on your capabilities
2. Process the inputs using your specialized knowledge
3. Generate appropriate outputs for this workflow step
4. Ensure outputs are valid JSON format

Please provide your response in the following JSON structure:
{
  "analysis": "Your analysis of the task and inputs",
  "actions_taken": ["List of actions you performed"],
  "outputs": {
    "key": "value pairs of your results"
  },
  "confidence": 0.95,
  "recommendations": ["Any recommendations for next steps"]
}

Focus on delivering high-quality results that align with your agent capabilities and the workflow requirements.
`;
  }

  /**
   * Parse execution result from ML response
   */
  private parseExecutionResult(response: string, step: WorkflowStep): Record<string, any> {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback: create basic output structure
        return {
          result: response.trim(),
          stepName: step.name,
          timestamp: new Date().toISOString(),
        };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsed.outputs) {
        parsed.outputs = { result: response.trim() };
      }

      return parsed;

    } catch (error) {
      // Fallback for parsing errors
      return {
        result: response.trim(),
        stepName: step.name,
        timestamp: new Date().toISOString(),
        parseError: true,
      };
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(generationData: any, step: WorkflowStep): number {
    let confidence = 0.8; // Base confidence

    // Adjust based on usage tokens (more tokens = more detailed response)
    if (generationData.usage?.completionTokens) {
      const tokens = generationData.usage.completionTokens;
      if (tokens > 500) confidence += 0.1;
      else if (tokens < 100) confidence -= 0.1;
    }

    // Adjust based on step complexity
    if (step.description && step.description.length > 100) {
      confidence += 0.05; // More detailed steps = higher confidence baseline
    }

    return Math.min(Math.max(confidence, 0.1), 1.0);
  }

  /**
   * Update workflow step status
   */
  private async updateStepStatus(
    stepId: string, 
    status: string, 
    updates: Record<string, any> = {}
  ): Promise<void> {
    await this.prisma.workflowStep.update({
      where: { id: stepId },
      data: {
        status,
        ...updates,
      },
    });
  }

  /**
   * Parse agent capabilities
   */
  private parseCapabilities(capabilities: string | null): string[] {
    if (!capabilities) return ['general'];
    try {
      return JSON.parse(capabilities);
    } catch {
      return capabilities.split(',').map(c => c.trim());
    }
  }

  /**
   * Parse step inputs
   */
  private parseInputs(inputs: string | null): Record<string, any> {
    if (!inputs) return {};
    try {
      return JSON.parse(inputs);
    } catch {
      return { raw: inputs };
    }
  }

  /**
   * Record execution metrics
   */
  private recordExecutionMetrics(context: ExecutionContext, result: StepResult): void {
    const key = `${context.workflowId}-${context.stepId}`;
    this.executionMetrics.set(key, {
      executedAt: new Date(),
      duration: result.duration,
      success: result.success,
      retryCount: result.retryCount,
      confidence: result.confidence,
      agentId: context.agentId,
    });
  }

  /**
   * Get execution metrics
   */
  getExecutionMetrics(): Map<string, any> {
    return this.executionMetrics;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}