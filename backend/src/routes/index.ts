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
import projectsRoutes from './projects.routes';
import tasksRoutes from './tasks';
import dashboardRoutes from './dashboard.routes';

// Export all routes with their prefixes
export const apiRoutes = [
  { path: '/api/agents', router: agentsRoutes },
  { path: '/api/jira', router: jiraRoutes },
  { path: '/api/cleanup', router: cleanupRoutes },
  { path: '/api/chat', router: chatRoutes },
  { path: '/api/projects', router: projectsRoutes },
  { path: '/api/tasks', router: tasksRoutes },
  { path: '/api/dashboard', router: dashboardRoutes },
];

// Individual exports for flexibility
export {
  agentsRoutes,
  jiraRoutes,
  cleanupRoutes,
  chatRoutes,
  projectsRoutes,
  tasksRoutes,
};

export default apiRoutes;
