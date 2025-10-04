import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { DocumentProcessor } from './document-processor';
import { TaskProcessor } from '../../src/processors/task-processor';
import { JiraIntegration } from '../../src/integrations/jira-integration';
import { BitbucketIntegration } from '../../src/integrations/bitbucket-integration';
import { ConfigManager } from '../../src/config/config-manager';

const app = express();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 50 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.static('frontend/build'));

/**
 * Comprehensive document analysis endpoint
 */
app.post('/api/analyze-documents-comprehensive', upload.array('documents'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const parameters = JSON.parse(req.body.parameters);
    
    const processor = new DocumentProcessor(parameters.ai.openaiKey);
    const analysis = await processor.comprehensiveAnalysis(files);
    
    res.json(analysis);
  } catch (error) {
    console.error('Comprehensive analysis failed:', error);
    res.status(500).json({ error: 'Comprehensive analysis failed' });
  }
});

/**
 * Generate business analysis
 */
app.post('/api/generate-business-analysis', async (req, res) => {
  try {
    const { analysis } = req.body;
    const processor = new DocumentProcessor(process.env.OPENAI_API_KEY || '');
    const businessAnalysis = await processor.generateBusinessAnalysis(analysis);
    
    res.json({ businessAnalysis });
  } catch (error) {
    console.error('Business analysis generation failed:', error);
    res.status(500).json({ error: 'Business analysis generation failed' });
  }
});

/**
 * Generate system analysis
 */
app.post('/api/generate-system-analysis', async (req, res) => {
  try {
    const { analysis } = req.body;
    const processor = new DocumentProcessor(process.env.OPENAI_API_KEY || '');
    const systemAnalysis = await processor.generateSystemAnalysis(analysis);
    
    res.json({ systemAnalysis });
  } catch (error) {
    console.error('System analysis generation failed:', error);
    res.status(500).json({ error: 'System analysis generation failed' });
  }
});

/**
 * Generate architecture documentation
 */
app.post('/api/generate-architecture', async (req, res) => {
  try {
    const { analysis } = req.body;
    const processor = new DocumentProcessor(process.env.OPENAI_API_KEY || '');
    const architecture = await processor.generateArchitecture(analysis);
    
    res.json({ architecture });
  } catch (error) {
    console.error('Architecture generation failed:', error);
    res.status(500).json({ error: 'Architecture generation failed' });
  }
});

/**
 * Analyze UI requirements
 */
app.post('/api/analyze-ui-requirements', async (req, res) => {
  try {
    const { documentation } = req.body;
    const processor = new DocumentProcessor(process.env.OPENAI_API_KEY || '');
    const uiAnalysis = await processor.analyzeUIRequirements(documentation);
    
    res.json(uiAnalysis);
  } catch (error) {
    console.error('UI analysis failed:', error);
    res.status(500).json({ error: 'UI analysis failed' });
  }
});

/**
 * Generate wireframes
 */
app.post('/api/generate-wireframes', async (req, res) => {
  try {
    const { analysis } = req.body;
    const processor = new DocumentProcessor(process.env.OPENAI_API_KEY || '');
    const wireframes = await processor.generateWireframes(analysis);
    
    res.json({ wireframes });
  } catch (error) {
    console.error('Wireframe generation failed:', error);
    res.status(500).json({ error: 'Wireframe generation failed' });
  }
});

/**
 * Generate user flows
 */
app.post('/api/generate-user-flows', async (req, res) => {
  try {
    const { analysis } = req.body;
    const processor = new DocumentProcessor(process.env.OPENAI_API_KEY || '');
    const userFlows = await processor.generateUserFlows(analysis);
    
    res.json({ userFlows });
  } catch (error) {
    console.error('User flow generation failed:', error);
    res.status(500).json({ error: 'User flow generation failed' });
  }
});

/**
 * Generate component library
 */
app.post('/api/generate-components', async (req, res) => {
  try {
    const { analysis } = req.body;
    const processor = new DocumentProcessor(process.env.OPENAI_API_KEY || '');
    const components = await processor.generateComponents(analysis);
    
    res.json({ components });
  } catch (error) {
    console.error('Component generation failed:', error);
    res.status(500).json({ error: 'Component generation failed' });
  }
});

/**
 * Create tasks with comprehensive context
 */
app.post('/api/create-comprehensive-tasks', async (req, res) => {
  try {
    const { documents, documentation, mockups, feedback, parameters } = req.body;
    
    const processor = new DocumentProcessor(parameters.ai.openaiKey);
    const tasks = await processor.generateComprehensiveTasks({
      documents,
      documentation,
      mockups,
      feedback
    });
    
    res.json({ tasks });
  } catch (error) {
    console.error('Comprehensive task creation failed:', error);
    res.status(500).json({ error: 'Comprehensive task creation failed' });
  }
});

/**
 * Create Jira tasks from generated tasks
 */
app.post('/api/create-jira-tasks', async (req, res) => {
  try {
    const { tasks, parameters } = req.body;
    
    // Set up configuration
    Object.assign(process.env, {
      JIRA_HOST: parameters.jira.host,
      JIRA_EMAIL: parameters.jira.email,
      JIRA_API_TOKEN: parameters.jira.token,
      JIRA_PROJECT_KEY: parameters.jira.projectKey
    });
    
    const config = ConfigManager.getInstance();
    const jiraIntegration = new JiraIntegration(config);
    
    // Create Epic first
    const epic = await jiraIntegration.createEpic({
      summary: `Project Implementation - Generated Tasks`,
      description: `Automated task creation from AI analysis`
    });
    
    const createdTasks = [];
    
    for (const task of tasks) {
      const jiraTask = await jiraIntegration.createIssue({
        fields: {
          project: { key: parameters.jira.projectKey },
          summary: task.title,
          description: task.description,
          issuetype: { name: task.type },
          priority: { name: task.priority },
          parent: { key: epic.key }, // Link to epic
          timetracking: {
            originalEstimate: `${task.estimatedHours}h`
          }
        }
      });
      
      createdTasks.push({
        ...task,
        jiraKey: jiraTask.key,
        jiraUrl: `${parameters.jira.host}/browse/${jiraTask.key}`
      });
    }
    
    res.json({ tasks: createdTasks, epic });
  } catch (error) {
    console.error('Failed to create Jira tasks:', error);
    res.status(500).json({ error: 'Failed to create Jira tasks' });
  }
});

/**
 * Process individual task with comprehensive context
 */
app.post('/api/process-task-comprehensive', async (req, res) => {
  try {
    const { taskKey, parameters, context } = req.body;
    
    // Set up configuration
    Object.assign(process.env, {
      ...parameters.jira,
      ...parameters.bitbucket,
      ...parameters.ai,
      ...parameters.workflow
    });
    
    const config = ConfigManager.getInstance();
    const taskProcessor = new TaskProcessor(config);
    
    const result = await taskProcessor.processSingleTaskWithContext(taskKey, context);
    
    res.json(result);
  } catch (error) {
    console.error('Task processing failed:', error);
    res.status(500).json({ error: 'Task processing failed' });
  }
});

/**
 * Test all integrations
 */
app.post('/api/test-connections', async (req, res) => {
  const { jira, bitbucket, ai } = req.body;
  
  const results = {
    jira: false,
    bitbucket: false,
    ai: false
  };
  
  try {
    // Test Jira
    const jiraConfig = ConfigManager.createFromParams(jira);
    const jiraIntegration = new JiraIntegration(jiraConfig);
    const jiraHealth = await jiraIntegration.healthCheck();
    results.jira = jiraHealth.status === 'healthy';
  } catch (error) {
    console.error('Jira test failed:', error);
  }
  
  try {
    // Test Bitbucket
    const bitbucketConfig = ConfigManager.createFromParams(bitbucket);
    const bitbucketIntegration = new BitbucketIntegration(bitbucketConfig);
    const bitbucketHealth = await bitbucketIntegration.healthCheck();
    results.bitbucket = bitbucketHealth.status === 'healthy';
  } catch (error) {
    console.error('Bitbucket test failed:', error);
  }
  
  try {
    // Test AI
    const processor = new DocumentProcessor(ai.openaiKey);
    const aiHealth = await processor.healthCheck();
    results.ai = aiHealth.status === 'healthy';
  } catch (error) {
    console.error('AI test failed:', error);
  }
  
  res.json(results);
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Copilot Task Processor Backend running on port ${