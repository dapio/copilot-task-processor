/**
 * Projects API Routes
 * @description API endpoints for project management
 */

import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

// Mock data for development
const mockProjects = [
  {
    id: '1',
    name: 'E-commerce Platform Redesign',
    description: 'Kompletny redesign platformy e-commerce z nowoczesnymi technologiami',
    status: 'active',
    priority: 'high',
    progress: 67,
    startDate: '2024-01-15',
    team: ['agent-1', 'agent-2', 'agent-3'],
    tasks: [],
    client: 'TechCorp Ltd',
    budget: 150000,
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Natywna aplikacja mobilna dla iOS i Android',
    status: 'pending',
    priority: 'medium',
    progress: 23,
    startDate: '2024-02-01',
    team: ['agent-2', 'agent-4'],
    tasks: [],
    client: 'StartupXYZ',
    budget: 80000,
    technologies: ['React Native', 'Firebase', 'Redux'],
  },
];

const mockTasks = [
  {
    id: 'task-1',
    title: 'Analiza wymagań biznesowych',
    description: 'Przeprowadzenie szczegółowej analizy wymagań dla projektu',
    status: 'done',
    priority: 'high',
    assignee: 'agent-1',
    estimatedHours: 16,
    actualHours: 14,
    dueDate: '2024-02-15',
    dependencies: [],
    progress: 100
  },
  {
    id: 'task-2',
    title: 'Projektowanie architektury systemu',
    description: 'Stworzenie diagramów architektury i specyfikacji technicznych',
    status: 'in-progress',
    priority: 'high',
    assignee: 'agent-2',
    estimatedHours: 24,
    actualHours: 18,
    dueDate: '2024-02-20',
    dependencies: ['task-1'],
    progress: 75
  }
];

const mockWorkflow = {
  id: 'workflow-1',
  name: 'Standard Development Workflow',
  type: 'new-project',
  steps: [
    {
      id: 'analysis',
      name: 'Analiza biznesowa',
      description: 'Analiza wymagań biznesowych i użytkowników',
      status: 'completed',
      assignedAgent: 'agent-1'
    },
    {
      id: 'architecture',
      name: 'Projektowanie architektury',
      description: 'Projektowanie architektury systemu i bazy danych',
      status: 'running',
      assignedAgent: 'agent-2'
    }
  ],
  currentStep: 1,
  status: 'running'
};

const mockAgents = [
  {
    id: 'agent-1',
    name: 'Anna Business Analyst',
    role: 'Business Analyst',
    description: 'Specjalista od analizy biznesowej',
    status: 'online',
    specialty: 'Requirements Analysis, User Stories',
    currentTask: 'Finalizacja dokumentacji wymagań',
    completedTasks: 12,
    successRate: 95
  },
  {
    id: 'agent-2',
    name: 'Piotr System Architect',
    role: 'System Architect', 
    description: 'Architekt systemów i rozwiązań',
    status: 'busy',
    specialty: 'System Design, Architecture Patterns',
    currentTask: 'Projektowanie architektury mikroserwisów',
    completedTasks: 8,
    successRate: 92
  }
];

// GET /api/projects - Lista wszystkich projektów
router.get('/', (req: Request, res: Response) => {
  try {
    return res.status(200).json(mockProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id - Szczegóły projektu
router.get('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = mockProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    return res.status(200).json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/tasks - Zadania projektu
router.get('/:id/tasks', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = mockProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Filtruj zadania dla projektu
    const projectTasks = mockTasks.map(task => ({
      ...task,
      id: `${task.id}-${id}`
    }));
    
    return res.status(200).json(projectTasks);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/workflow - Workflow projektu
router.get('/:id/workflow', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = mockProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const projectWorkflow = {
      ...mockWorkflow,
      id: `workflow-${id}`
    };
    
    return res.status(200).json(projectWorkflow);
  } catch (error) {
    console.error('Error fetching project workflow:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/agents - Agenci projektu
router.get('/:id/agents', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = mockProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Filtruj agentów którzy są w zespole projektu
    const projectAgents = mockAgents.filter(agent => 
      project.team.includes(agent.id)
    );
    
    return res.status(200).json(projectAgents);
  } catch (error) {
    console.error('Error fetching project agents:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/mockups - Mockupy projektu
router.get('/:id/mockups', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = mockProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Mock mockups data
    const mockups = [
      {
        id: `mockup-1-${id}`,
        projectId: id,
        name: 'Homepage Design',
        description: 'Główna strona aplikacji',
        imageUrl: '/mockups/homepage.png',
        status: 'approved',
        version: 1,
        createdBy: 'agent-3',
        createdAt: '2024-01-20T10:30:00Z',
        approvals: [],
        comments: []
      }
    ];
    
    return res.status(200).json(mockups);
  } catch (error) {
    console.error('Error fetching project mockups:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:id/history - Historia projektu
router.get('/:id/history', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = mockProjects.find(p => p.id === id);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Mock history data
    const history = [
      {
        id: `history-1-${id}`,
        description: 'Projekt został utworzony',
        timestamp: '2024-01-15T09:00:00Z',
        type: 'created',
        actor: 'user-1'
      },
      {
        id: `history-2-${id}`,
        description: 'Przypisano agenta Business Analyst',
        timestamp: '2024-01-15T09:15:00Z',
        type: 'agent-assigned',
        actor: 'system'
      },
      {
        id: `history-3-${id}`,
        description: 'Rozpoczęto analizę wymagań',
        timestamp: '2024-01-15T10:00:00Z',
        type: 'task-started',
        actor: 'agent-1'
      }
    ];
    
    return res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching project history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects - Tworzenie nowego projektu
router.post('/', (req: Request, res: Response) => {
  try {
    const projectData = req.body;
    
    const newProject = {
      id: `project-${Date.now()}`,
      ...projectData,
      tasks: [],
      progress: 0
    };
    
    mockProjects.push(newProject);
    
    return res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id - Aktualizacja projektu
router.put('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...updates
    };
    
    return res.status(200).json(mockProjects[projectIndex]);
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id - Usunięcie projektu
router.delete('/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const projectIndex = mockProjects.findIndex(p => p.id === id);
    
    if (projectIndex === -1) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    const deletedProject = mockProjects.splice(projectIndex, 1)[0];
    
    return res.status(200).json({ 
      message: 'Project deleted successfully', 
      project: deletedProject 
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
