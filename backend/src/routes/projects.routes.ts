import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { AgentChatCoordinator } from '../services/agent-chat-coordinator.service';
import { ChatIntegrationService } from '../services/chat-integration.service';
import ContextManager from '../services/context-manager';
import { mockRoutes } from '../services/mock-project-initialization.service';

const router = Router();
const prisma = new PrismaClient();

// Initialize services
const contextManager = new ContextManager(prisma);
const chatService = new ChatIntegrationService(prisma, contextManager);
const agentChatCoordinator = new AgentChatCoordinator(prisma, chatService);

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/projects');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// GET /api/projects - Lista wszystkich projektów
router.get('/', async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        tasks: true,
        workflows: true,
      },
    });
    return res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects - Utworzenie nowego projektu
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, type, settings } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Create project first
    const project = await prisma.project.create({
      data: {
        name,
        description: description || '',
        status: 'ACTIVE',
        type: type || 'NEW_APPLICATION',
      },
    });

    // Initialize chat for the project
    const result = await agentChatCoordinator.initializeProjectChat(project.id);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(201).json({
      projectId: project.id,
      name: project.name,
      description: project.description,
      type: project.type,
      status: project.status,
      chatSessionId: result.data.sessionId,
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/upload - Upload dokumentów z automatycznym powiadomieniem agentów
router.post(
  '/:id/upload',
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const { id: projectId } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Format files for AgentChatCoordinator
      const uploadedFiles = [
        {
          id: `file-${Date.now()}`,
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          type: file.mimetype,
        },
      ];

      // Process document upload through AgentChatCoordinator
      const result = await agentChatCoordinator.processDocumentUpload(
        projectId,
        uploadedFiles
      );

      if (!result.success) {
        return res.status(500).json({ error: result.error });
      }

      return res.status(200).json({
        message: 'Document uploaded and processed successfully',
        file: {
          filename: file.filename,
          originalname: file.originalname,
          size: file.size,
          path: file.path,
        },
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/projects/:id/chat/history - Historia wiadomości chat
router.get('/:id/chat/history', async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;

    const history = await agentChatCoordinator.getChatHistory(projectId);

    if (!history.success) {
      return res.status(500).json({ error: history.error });
    }

    return res.status(200).json(history.data);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects/:id/chat/message - Wysłanie wiadomości do chat
router.post('/:id/chat/message', async (req: Request, res: Response) => {
  try {
    const { id: projectId } = req.params;
    const { message, author } = req.body;

    if (!message || !author) {
      return res.status(400).json({ error: 'Message and author are required' });
    }

    const result = await agentChatCoordinator.sendSystemMessage(
      projectId,
      `[${author}]: ${message}`
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    console.error('Error sending chat message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount mock routes for development/testing
router.get('/mock/project-types', mockRoutes.getProjectTypes);
router.get('/mock/providers', mockRoutes.getProviders);
router.post('/mock/initialize', mockRoutes.initializeProject);

export { router as projectsRouter };
