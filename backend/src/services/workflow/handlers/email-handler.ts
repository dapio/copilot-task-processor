/**
 * Email Notification Handler for Workflow Steps
 * Sends email notifications with templates and attachments
 */

import { StepExecutionError } from '../errors';
import { Result } from '../../../providers/ml-provider.interface';

// Step Handler Interface
interface IWorkflowStepHandler<TInput = any, TOutput = any> {
  readonly type: string;
  readonly version: string;
  readonly description: string;
  execute(
    input: TInput,
    context: Record<string, any>
  ): Promise<Result<TOutput, StepExecutionError>>;
  getMetadata(): any;
}

export interface EmailNotificationInput {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  template?: {
    name: string;
    variables: Record<string, any>;
  };
  attachments?: {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }[];
  priority?: 'low' | 'normal' | 'high';
  delay?: number; // delay in milliseconds
}

export interface EmailNotificationOutput {
  messageId: string;
  recipients: string[];
  sentAt: Date;
  deliveryTime: number;
  status: 'sent' | 'queued' | 'failed';
}

/**
 * Email Notification Handler
 * Sends emails with comprehensive template and attachment support
 */
export class EmailNotificationHandler
  implements
    IWorkflowStepHandler<EmailNotificationInput, EmailNotificationOutput>
{
  readonly type = 'email-notification';
  readonly version = '1.0.0';
  readonly description =
    'Send email notifications with templates and attachments';

  private emailProvider: any; // Could be nodemailer, SendGrid, etc.

  constructor(emailProvider?: any) {
    this.emailProvider = emailProvider;
  }

  async execute(
    input: EmailNotificationInput,
    _context: Record<string, any>
  ): Promise<Result<EmailNotificationOutput, StepExecutionError>> {
    const startTime = Date.now();

    try {
      // Validate input
      const validation = this.validateInput(input);
      if (!validation.success) {
        return { success: false, error: validation.error };
      }

      // Apply delay if specified
      if (input.delay && input.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, input.delay));
      }

      // Prepare email content
      const emailContent = await this.prepareEmailContent(input);

      // Send email (mock implementation for now)
      const result = await this.sendEmail(emailContent, input);
      const deliveryTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          messageId: result.messageId,
          recipients: this.normalizeRecipients(input.to),
          sentAt: new Date(),
          deliveryTime,
          status: result.status,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: new StepExecutionError(
          'EMAIL_SEND_ERROR',
          `Email notification error: ${error.message}`,
          {
            to: input.to,
            subject: input.subject,
            error: this.serializeError(error),
          }
        ),
      };
    }
  }

  /**
   * Prepare email content with template processing
   */
  private async prepareEmailContent(input: EmailNotificationInput): Promise<{
    subject: string;
    body: string;
    isHtml: boolean;
  }> {
    let subject = input.subject;
    let body = input.body;

    // Process template if provided
    if (input.template) {
      const processedContent = await this.processTemplate(
        input.template.name,
        input.template.variables
      );

      if (processedContent.subject) {
        subject = processedContent.subject;
      }

      if (processedContent.body) {
        body = processedContent.body;
      }
    }

    // Replace variables in subject and body
    subject = this.replaceVariables(subject, input.template?.variables || {});
    body = this.replaceVariables(body, input.template?.variables || {});

    return {
      subject,
      body,
      isHtml: input.isHtml || false,
    };
  }

  /**
   * Process email template (mock implementation)
   */
  private async processTemplate(
    templateName: string,
    _variables: Record<string, any>
  ): Promise<{
    subject?: string;
    body?: string;
  }> {
    // Mock template processing - in real implementation would load from database or file
    const templates: Record<string, any> = {
      'workflow-completion': {
        subject: 'Workflow {{workflowName}} Completed',
        body: `
          <h2>Workflow Completion Notice</h2>
          <p>The workflow <strong>{{workflowName}}</strong> has completed successfully.</p>
          <ul>
            <li>Started: {{startTime}}</li>
            <li>Completed: {{endTime}}</li>
            <li>Duration: {{duration}}</li>
            <li>Status: {{status}}</li>
          </ul>
        `,
      },
      'workflow-failure': {
        subject: 'Workflow {{workflowName}} Failed',
        body: `
          <h2>Workflow Failure Notice</h2>
          <p>The workflow <strong>{{workflowName}}</strong> has failed.</p>
          <p><strong>Error:</strong> {{errorMessage}}</p>
          <p><strong>Failed Step:</strong> {{failedStep}}</p>
        `,
      },
      'task-assignment': {
        subject: 'New Task Assignment: {{taskTitle}}',
        body: `
          <h2>Task Assignment</h2>
          <p>You have been assigned a new task: <strong>{{taskTitle}}</strong></p>
          <p>{{taskDescription}}</p>
          <p><strong>Due Date:</strong> {{dueDate}}</p>
          <p><strong>Priority:</strong> {{priority}}</p>
        `,
      },
    };

    const template = templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    return {
      subject: template.subject,
      body: template.body,
    };
  }

  /**
   * Replace variables in text content
   */
  private replaceVariables(
    content: string,
    variables: Record<string, any>
  ): string {
    let result = content;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Send email (mock implementation)
   */
  private async sendEmail(
    content: { subject: string; body: string; isHtml: boolean },
    input: EmailNotificationInput
  ): Promise<{ messageId: string; status: 'sent' | 'queued' | 'failed' }> {
    // Mock email sending - in real implementation would use actual email service
    const mockDelay = Math.random() * 1000; // 0-1 second delay
    await new Promise(resolve => setTimeout(resolve, mockDelay));

    // Simulate occasional failures
    if (Math.random() < 0.05) {
      // 5% failure rate
      throw new Error('SMTP server unavailable');
    }

    const messageId = `msg_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log(`[MOCK EMAIL] To: ${input.to}, Subject: ${content.subject}`);

    return {
      messageId,
      status: 'sent',
    };
  }

  /**
   * Normalize recipients to array
   */
  private normalizeRecipients(recipients: string | string[]): string[] {
    return Array.isArray(recipients) ? recipients : [recipients];
  }

  /**
   * Validate input parameters
   */
  private validateInput(
    input: EmailNotificationInput
  ): Result<void, StepExecutionError> {
    if (!input.to) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          'Recipients (to) are required'
        ),
      };
    }

    if (!input.subject) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          'Email subject is required'
        ),
      };
    }

    if (!input.body && !input.template) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          'Email body or template is required'
        ),
      };
    }

    // Validate email addresses
    const recipients = this.normalizeRecipients(input.to);
    for (const email of recipients) {
      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: new StepExecutionError(
            'INVALID_INPUT',
            `Invalid email address: ${email}`
          ),
        };
      }
    }

    // Validate priority
    if (input.priority && !['low', 'normal', 'high'].includes(input.priority)) {
      return {
        success: false,
        error: new StepExecutionError(
          'INVALID_INPUT',
          `Invalid priority: ${input.priority}. Must be 'low', 'normal', or 'high'`
        ),
      };
    }

    return { success: true, data: undefined };
  }

  /**
   * Validate email address format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Serialize error for logging
   */
  private serializeError(error: any): any {
    if (!error) return null;

    return {
      message: error.message,
      code: error.code,
      status: error.status,
      response: error.response?.data,
    };
  }

  /**
   * Get handler metadata
   */
  getMetadata() {
    return {
      type: this.type,
      version: this.version,
      description: this.description,
      inputSchema: {
        type: 'object',
        required: ['to', 'subject'],
        properties: {
          to: {
            oneOf: [
              { type: 'string', format: 'email' },
              { type: 'array', items: { type: 'string', format: 'email' } },
            ],
          },
          cc: {
            oneOf: [
              { type: 'string', format: 'email' },
              { type: 'array', items: { type: 'string', format: 'email' } },
            ],
          },
          bcc: {
            oneOf: [
              { type: 'string', format: 'email' },
              { type: 'array', items: { type: 'string', format: 'email' } },
            ],
          },
          subject: { type: 'string', minLength: 1 },
          body: { type: 'string' },
          isHtml: { type: 'boolean' },
          template: {
            type: 'object',
            required: ['name', 'variables'],
            properties: {
              name: { type: 'string' },
              variables: { type: 'object' },
            },
          },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              required: ['filename', 'content'],
              properties: {
                filename: { type: 'string' },
                content: {},
                contentType: { type: 'string' },
              },
            },
          },
          priority: { type: 'string', enum: ['low', 'normal', 'high'] },
          delay: { type: 'number', minimum: 0 },
        },
      },
      outputSchema: {
        type: 'object',
        required: [
          'messageId',
          'recipients',
          'sentAt',
          'deliveryTime',
          'status',
        ],
        properties: {
          messageId: { type: 'string' },
          recipients: { type: 'array', items: { type: 'string' } },
          sentAt: { type: 'string', format: 'date-time' },
          deliveryTime: { type: 'number' },
          status: { type: 'string', enum: ['sent', 'queued', 'failed'] },
        },
      },
    };
  }
}
