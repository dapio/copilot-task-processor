/**
 * Projects API Routes
 * @description API endpoints for project management with real-time workflows
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { realTimeOrchestrator } from '../services/realtime-orchestrator.service';

const router = Router();

// Mock data for development
const mockProjects = [
  {
    id: '1',
    name: 'E-commerce Platform Redesign',
    description:
      'Kompletny redesign platformy e-commerce z nowoczesnymi technologiami',
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
    progress: 100,
  },
  {
    id: 'task-2',
    title: 'Projektowanie architektury systemu',
    description:
      'Stworzenie diagramów architektury i specyfikacji technicznych',
    status: 'in-progress',
    priority: 'high',
    assignee: 'agent-2',
    estimatedHours: 24,
    actualHours: 18,
    dueDate: '2024-02-20',
    dependencies: ['task-1'],
    progress: 75,
  },
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
      assignedAgent: 'agent-1',
    },
    {
      id: 'architecture',
      name: 'Projektowanie architektury',
      description: 'Projektowanie architektury systemu i bazy danych',
      status: 'running',
      assignedAgent: 'agent-2',
    },
  ],
  currentStep: 1,
  status: 'running',
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
    successRate: 95,
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
    successRate: 92,
  },
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
      id: `${task.id}-${id}`,
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
      id: `workflow-${id}`,
    };

    return res.status(200).json(projectWorkflow);
  } catch (error) {
    console.error('Error fetching project workflow:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/workflow/start - Rozpocznij workflow projektu z PRAWDZIWĄ orkiestracją
router.post('/:id/workflow/start', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { workflowType = 'project_analysis' } = req.body;

    console.log(
      `🚀 Starting REAL workflow for project ${id}, type: ${workflowType}`
    );

    const project = mockProjects.find(p => p.id === id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found',
      });
    }

    // Update project status to active
    project.status = 'active';

    // Start REAL workflow with orchestrator
    const workflow = await realTimeOrchestrator.startProjectAnalysis(id, []);

    console.log(`✅ Real workflow ${workflow.id} started for project ${id}`);

    // Return success response with workflow details
    return res.status(200).json({
      success: true,
      data: {
        projectId: id,
        workflowId: workflow.id,
        workflowType,
        status: 'started',
        message: `Real-time workflow started for project ${project.name}`,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          status: workflow.status,
          steps: workflow.steps.map(step => ({
            id: step.id,
            name: step.name,
            agentType: step.agentType,
            status: step.status,
            progress: step.progress,
          })),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error starting real workflow:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start workflow',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/projects/:id/workflow/status - Status workflow projektu
router.get('/:id/workflow/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    console.log(`📊 Checking workflow status for project ${id}`);

    const workflows = realTimeOrchestrator.getProjectWorkflows(id);

    if (workflows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No workflows found for this project',
        data: { workflows: [] },
      });
    }

    const activeWorkflow =
      workflows.find(w => w.status === 'running') ||
      workflows[workflows.length - 1];

    return res.status(200).json({
      success: true,
      data: {
        projectId: id,
        activeWorkflow: {
          id: activeWorkflow.id,
          name: activeWorkflow.name,
          status: activeWorkflow.status,
          currentStepIndex: activeWorkflow.currentStepIndex,
          totalSteps: activeWorkflow.steps.length,
          progress: Math.round(
            (activeWorkflow.steps.filter(s => s.status === 'completed').length /
              activeWorkflow.steps.length) *
              100
          ),
          steps: activeWorkflow.steps.map(step => ({
            id: step.id,
            name: step.name,
            agentType: step.agentType,
            status: step.status,
            progress: step.progress,
            result: step.result,
          })),
        },
        allWorkflows: workflows.map(w => ({
          id: w.id,
          name: w.name,
          status: w.status,
          createdAt: w.createdAt,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching workflow status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get workflow status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
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
        comments: [],
      },
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
        actor: 'user-1',
      },
      {
        id: `history-2-${id}`,
        description: 'Przypisano agenta Business Analyst',
        timestamp: '2024-01-15T09:15:00Z',
        type: 'agent-assigned',
        actor: 'system',
      },
      {
        id: `history-3-${id}`,
        description: 'Rozpoczęto analizę wymagań',
        timestamp: '2024-01-15T10:00:00Z',
        type: 'task-started',
        actor: 'agent-1',
      },
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
      progress: 0,
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
      ...updates,
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
      project: deletedProject,
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== CHAT API ENDPOINTS =====

// Mock chat messages
const mockChatMessages: any[] = [
  {
    id: 'msg-1',
    role: 'assistant',
    content:
      'Witam! Jestem gotowy do analizy Twojego projektu. Przesłałeś specyfikację?',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
];

// GET /api/projects/:id/chat - Pobierz historię czatu
router.get('/:id/chat', (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Filter messages for this project (in real app would be from DB)
    const projectMessages = mockChatMessages.filter(
      msg => msg.projectId === id || !msg.projectId
    );

    return res.status(200).json({
      success: true,
      data: projectMessages,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch chat history',
    });
  }
});

// POST /api/projects/:id/chat - Wyślij wiadomość w czacie
router.post('/:id/chat', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    console.log(`💬 New chat message for project ${id}:`, message);

    // Add user message to mock storage
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      projectId: id,
    };
    mockChatMessages.push(userMessage);

    // Generate AI response (in real app would call actual AI agents)
    const aiResponse = {
      id: `msg-${Date.now()}-assistant`,
      role: 'assistant',
      content: `Dziękuję za informacje! Rozpoczynam analizę projektu. W pierwszej kolejności przeanalizuję wymagania i zaproponuję strukturę zespołu agentów AI.`,
      timestamp: new Date().toISOString(),
      projectId: id,
    };

    // Add AI response after short delay (simulate processing)
    setTimeout(() => {
      mockChatMessages.push(aiResponse);
    }, 1000);

    return res.status(200).json({
      success: true,
      data: aiResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send message',
    });
  }
});

// ===== FILE UPLOAD CONFIGURATION =====

// Ensure uploads directory exists
const ensureUploadDir = (projectId: string): string => {
  const uploadDir = path.join(process.cwd(), 'uploads', 'projects', projectId);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.id || req.body.projectId || 'default';
    const uploadDir = ensureUploadDir(projectId);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp prefix
    const timestamp = Date.now();
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8'
    );
    cb(null, `${timestamp}_${originalName}`);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.md'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file type: ${fileExt}. Allowed: ${allowedTypes.join(
            ', '
          )}`
        )
      );
    }
  },
});

// POST /api/projects/:id/upload - Upload files to project
router.post(
  '/:id/upload',
  upload.array('files', 10),
  (req: Request, res: Response) => {
    try {
      const projectId = req.params.id;
      const files = req.files as any[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No files provided',
        });
      }

      console.log(
        `📁 Files uploaded for project ${projectId}:`,
        files.map(f => ({
          filename: f.filename,
          originalname: f.originalname,
          size: f.size,
          path: f.path,
        }))
      );

      // Return success response
      res.status(200).json({
        success: true,
        data: {
          projectId,
          uploadedFiles: files.map(file => ({
            id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            path: file.path,
            uploadedAt: new Date().toISOString(),
            type: path.extname(file.originalname).toLowerCase(),
          })),
        },
        message: `Successfully uploaded ${files.length} file(s)`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({
        success: false,
        error: 'File upload failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
