/**
 * Simple Mock Project Initialization Service
 * For testing the enhanced project selector
 */

export class MockProjectInitializationService {
  async getProjectTypes() {
    return {
      success: true,
      data: [
        {
          id: 'web-app',
          name: 'Aplikacja webowa',
          description: 'Nowoczesna aplikacja React/Next.js z backendem Node.js',
          defaultProviders: ['github-copilot', 'openai'],
          requiredConfig: ['api-keys'],
        },
        {
          id: 'mobile-app',
          name: 'Aplikacja mobilna',
          description: 'Natywna lub cross-platform aplikacja mobilna',
          defaultProviders: ['github-copilot'],
          requiredConfig: ['development-platform'],
        },
        {
          id: 'api-service',
          name: 'Serwis API',
          description: 'RESTful API lub GraphQL z mikrousługami',
          defaultProviders: ['openai', 'anthropic'],
          requiredConfig: ['database', 'deployment'],
        },
        {
          id: 'data-analysis',
          name: 'Analiza danych',
          description: 'Projekt ML/AI do analizy i przetwarzania danych',
          defaultProviders: ['openai', 'azure-openai'],
          requiredConfig: ['data-sources', 'ml-framework'],
        },
      ],
    };
  }

  async getAvailableProviders() {
    return {
      success: true,
      data: [
        {
          id: 'github-copilot',
          name: 'GitHub Copilot',
          type: 'copilot',
          enabled: true,
        },
        {
          id: 'openai-gpt4',
          name: 'OpenAI GPT-4',
          type: 'openai',
          enabled: false,
          apiKey: '',
          model: 'gpt-4',
        },
        {
          id: 'anthropic-claude',
          name: 'Anthropic Claude',
          type: 'anthropic',
          enabled: false,
          apiKey: '',
          model: 'claude-3',
        },
        {
          id: 'azure-openai',
          name: 'Azure OpenAI',
          type: 'azure-openai',
          enabled: false,
          apiKey: '',
          endpoint: '',
          model: 'gpt-4',
        },
      ],
    };
  }

  async initializeProject(request: any) {
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      success: true,
      data: {
        projectId: `project-${Date.now()}`,
        chatSessionId: `session-${Date.now()}`,
        workflowId: `workflow-${Date.now()}`,
        status: 'initialized',
        configuredProviders:
          request.providers
            ?.filter((p: any) => p.enabled)
            .map((p: any) => p.id) || [],
        initialTasks: [],
      },
    };
  }
}

// Simple route handlers for testing
export const mockRoutes = {
  getProjectTypes: async (req: any, res: any) => {
    try {
      const service = new MockProjectInitializationService();
      const result = await service.getProjectTypes();
      res.json(result.data);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to load project types' });
    }
  },

  getProviders: async (req: any, res: any) => {
    try {
      const service = new MockProjectInitializationService();
      const result = await service.getAvailableProviders();
      res.json(result.data);
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: 'Failed to load providers' });
    }
  },

  initializeProject: async (req: any, res: any) => {
    try {
      const service = new MockProjectInitializationService();
      const result = await service.initializeProject(req.body);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: 'Project initialized successfully',
        });
      } else {
        res
          .status(400)
          .json({ success: false, error: 'Initialization failed' });
      }
    } catch (error) {
      res
        .status(500)
        .json({ success: false, error: 'Project initialization failed' });
    }
  },
};
