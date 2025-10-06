/**
 * Mock Workflow Template Factory
 *
 * Factory for creating sample workflow templates for testing and development
 */

import { MockWorkflowTemplate, IMockTemplateFactory } from './mock-types';

export class MockTemplateFactory implements IMockTemplateFactory {
  /**
   * Create sample workflow templates
   */
  createSampleTemplates(): MockWorkflowTemplate[] {
    return [
      this.createDataProcessingTemplate(),
      this.createEmailNotificationTemplate(),
    ];
  }

  /**
   * Create data processing template
   */
  createDataProcessingTemplate(): MockWorkflowTemplate {
    return {
      id: 'template_001',
      name: 'Data Processing Pipeline',
      description:
        'Process incoming data through validation and transformation',
      steps: [
        {
          id: 'step_001',
          name: 'Validate Input',
          type: 'validation',
          handlerType: 'input-validator',
          timeout: 30000,
          retries: 3,
        },
        {
          id: 'step_002',
          name: 'Transform Data',
          type: 'transformation',
          handlerType: 'data-transformer',
          dependencies: ['step_001'],
          timeout: 60000,
          retries: 2,
        },
        {
          id: 'step_003',
          name: 'Save to Database',
          type: 'storage',
          handlerType: 'database-query',
          dependencies: ['step_002'],
          timeout: 30000,
          retries: 5,
        },
      ],
      variables: {
        inputSource: 'api',
        outputFormat: 'json',
        batchSize: 100,
      },
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    };
  }

  /**
   * Create email notification template
   */
  createEmailNotificationTemplate(): MockWorkflowTemplate {
    return {
      id: 'template_002',
      name: 'Email Notification Pipeline',
      description: 'Send notifications based on triggers',
      steps: [
        {
          id: 'step_101',
          name: 'Check Conditions',
          type: 'condition',
          handlerType: 'condition-evaluator',
          timeout: 10000,
          retries: 1,
        },
        {
          id: 'step_102',
          name: 'Prepare Email Content',
          type: 'preparation',
          handlerType: 'template-processor',
          dependencies: ['step_101'],
          timeout: 15000,
          retries: 2,
        },
        {
          id: 'step_103',
          name: 'Send Email',
          type: 'notification',
          handlerType: 'email-notification',
          dependencies: ['step_102'],
          timeout: 30000,
          retries: 3,
        },
      ],
      variables: {
        recipients: ['admin@company.com'],
        template: 'default-notification',
        priority: 'normal',
      },
      isActive: true,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
    };
  }
}
