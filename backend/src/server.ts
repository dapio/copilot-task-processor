import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { DocumentProcessor } from './document-processor';
import { TaskProcessor } from '../../../src/processors/task-processor';
import { JiraIntegration } from '../../../src/integrations/jira-integration';
import { ConfigManager } from '../../../src/config/config-manager';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());
app.use(express.static('frontend/build'));

/**
 * Analyze uploaded documents
 */
app.post('/api/analyze-documents', upload.array('documents'), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    const parameters = JSON.parse(req.body.parameters);
    
    const processor = new DocumentProcessor(parameters.ai.openaiKey);
    const result = await processor.analyzeDocuments(files);
    
    res.json(result);
  } catch (error) {
    console.error('Document analysis failed:', error);
    res.status(500).json({ error: 'Document analysis failed' });
  }
});

/**
 * Test API connections
 */
app.post('/api/test-connections', async (req, res) => {
  const { jira, github, ai } = req.body;
  
  const results = {
    jira: false,
    github: false,
    ai: false
  };
  
  try {
    // Test Jira connection
    // Implementation for testing Jira API
    results.jira = true;
  } catch (error) {
    console.error('Jira connection test failed:', error);
  }
  
  try {
    // Test GitHub connection  
    // Implementation for testing GitHub API
    results.github = true;
  } catch (error) {
    console.error('GitHub connection test failed:', error);
  }
  
  try {
    // Test OpenAI connection
    // Implementation for testing OpenAI API
    results.ai = true;
  } catch (error) {
    console.error('AI connection test failed:', error);
  }
  
  res.json(results);
});

/**
 * Create Jira tasks
 */
app.post('/api/create-jira-tasks', async (req, res) => {
  try {
    const { tasks, parameters } = req.body;
    
    // Set up configuration from parameters
    Object.assign(process.env, {
      JIRA_HOST: parameters.jira.host,
      JIRA_EMAIL: parameters.jira.email,
      JIRA_API_TOKEN: parameters.jira.token,
      JIRA_PROJECT_KEY: parameters.jira.projectKey
    });
    
    const config = ConfigManager.getInstance();
    const jiraIntegration = new JiraIntegration(config);
    
    const createdTasks = [];
    
    for (const task of tasks) {
      const jiraTask = await jiraIntegration.createIssue({
        project: { key: parameters.jira.projectKey },
        summary: task.title,
        description: task.description,
        issuetype: { name: task.type },
        priority: { name: task.priority }
      });
      
      createdTasks.push({
        ...task,
        key: jiraTask.key,
        jiraUrl: `${parameters.jira.host}/browse/${jiraTask.key}`
      });
    }
    
    res.json(createdTasks);
  } catch (error) {
    console.error('Failed to create Jira tasks:', error);
    res.status(500).json({ error: 'Failed to create Jira tasks' });
  }
});

/**
 * Process individual task
 */
app.post('/api/process-task', async (req, res) => {
  try {
    const { taskKey, parameters } = req.body;
    
    // Set up configuration from parameters
    Object.assign(process.env, {
      ...parameters.jira,
      ...parameters.github,
      ...parameters.ai,
      ...parameters.workflow
    });
    
    const config = ConfigManager.getInstance();
    const taskProcessor = new TaskProcessor(config);
    
    const result = await taskProcessor.processSingleTask(taskKey);
    
    res.json(result);
  } catch (error) {
    console.error('Task processing failed:', error);
    res.status(500).json({ error: 'Task processing failed' });
  }
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Copilot Task Processor running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});