/**
 * API Routes Index
 *
 * Central export for all API route modules
 */

// Import all route modules
import agentsRoutes from './agents.routes';
import jiraRoutes from './jira.routes';
import cleanupRoutes from './cleanup.routes';
import chatRoutes from './chat.routes';
import { projectsRouter as projectsRoutes } from './projects.routes';
import tasksRoutes from './tasks';
import dashboardRoutes from './dashboard.routes';
import workflowRoutes from './workflow.routes';
import workflowStepRoutes from './workflow-step.routes';
import workflowStepControlRoutes from './workflow-step-control.routes';
import advancedTaskManagementRoutes from './advanced-task-management';
import aiConfigRoutes from './ai-config.routes';
import providerConfigRoutes from './provider-config.routes';

// Export all routes with their prefixes
export const apiRoutes = [
  { path: '/api/agents', router: agentsRoutes },
  { path: '/api/jira', router: jiraRoutes },
  { path: '/api/cleanup', router: cleanupRoutes },
  { path: '/api/chat', router: chatRoutes },
  { path: '/api/projects', router: projectsRoutes },
  { path: '/api/tasks', router: tasksRoutes },
  { path: '/api/dashboard', router: dashboardRoutes },
  { path: '/api/workflow', router: workflowRoutes },
  { path: '/api/workflow-steps', router: workflowStepRoutes },
  { path: '/api/workflow-control', router: workflowStepControlRoutes },
  { path: '/api/task-management', router: advancedTaskManagementRoutes },
  { path: '/api/ai', router: aiConfigRoutes },
  { path: '/api/provider-config', router: providerConfigRoutes },
];

// Individual exports for flexibility
export {
  agentsRoutes,
  jiraRoutes,
  cleanupRoutes,
  chatRoutes,
  projectsRoutes,
  tasksRoutes,
  workflowStepRoutes,
};

export default apiRoutes;
