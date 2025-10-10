/**
 * Integration Tests for Project State Management
 * Tests intelligent routing based on project file state
 */

// @ts-ignore - Jest globals are available during test runtime
import { PrismaClient } from '@prisma/client';
import { createTestServer } from '../helpers/test-server';
import { Application } from 'express';

describe('Project State Management Integration', () => {
  let app: Application;
  let prisma: PrismaClient;
  let testProjectId: string;

  beforeEach(async () => {
    app = createTestServer();
    prisma = new PrismaClient();

    // Create test project
    const project = await prisma.project.create({
      data: {
        name: 'Test Project State Management',
        description: 'Testing intelligent routing',
        status: 'ACTIVE',
        type: 'NEW_APPLICATION',
      },
    });
    testProjectId = project.id;
  });

  afterEach(async () => {
    // Cleanup
    if (testProjectId) {
      await prisma.projectFile?.deleteMany({
        where: { projectId: testProjectId },
      });
      await prisma.workflow?.deleteMany({
        where: { projectId: testProjectId },
      });
      await prisma.project.delete({
        where: { id: testProjectId },
      });
    }
    await prisma.$disconnect();
  });

  describe('GET /api/projects/:id/context', () => {
    it('should return upload_required state for project without files', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProjectId}/context`)
        .expect(200);

      expect(response.body).toMatchObject({
        projectId: testProjectId,
        hasFiles: false,
        inputFileCount: 0,
        state: 'upload_required',
        routing: {
          canProceedToDashboard: false,
          nextStep: {
            action: 'upload_files',
            message: 'Upload project files to continue',
          },
          recommendedRoute: 'upload',
        },
      });
    });

    it('should return workflow_setup state for project with files but no workflow', async () => {
      // Add test file to project
      await prisma.projectFile?.create({
        data: {
          projectId: testProjectId,
          name: 'test-file.txt',
          originalName: 'test-file.txt',
          path: '/test/path/test-file.txt',
          size: 1024,
          mimeType: 'text/plain',
          category: 'input',
          status: 'uploaded',
        },
      });

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/context`)
        .expect(200);

      expect(response.body).toMatchObject({
        projectId: testProjectId,
        hasFiles: true,
        inputFileCount: 1,
        state: 'workflow_setup',
        routing: {
          canProceedToDashboard: true,
          nextStep: {
            action: 'setup_workflow',
            message: 'Set up workflow to begin processing',
          },
          recommendedRoute: 'dashboard',
        },
      });
    });

    it('should return workflow_ready state for project with workflow in pending status', async () => {
      // Add test file
      await prisma.projectFile?.create({
        data: {
          projectId: testProjectId,
          name: 'test-file.txt',
          originalName: 'test-file.txt',
          path: '/test/path/test-file.txt',
          size: 1024,
          mimeType: 'text/plain',
          category: 'input',
          status: 'uploaded',
        },
      });

      // Add workflow run in pending state
      await prisma.workflowRun?.create({
        data: {
          projectId: testProjectId,
          status: 'pending',
          startedAt: new Date(),
          config: {},
        },
      });

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/context`)
        .expect(200);

      expect(response.body).toMatchObject({
        state: 'workflow_ready',
        routing: {
          canProceedToDashboard: true,
          nextStep: {
            action: 'start_workflow',
            message: 'Start workflow processing',
          },
          recommendedRoute: 'dashboard',
        },
      });
    });

    it('should return workflow_active state for running workflow', async () => {
      // Add test file
      await prisma.projectFile?.create({
        data: {
          projectId: testProjectId,
          name: 'test-file.txt',
          originalName: 'test-file.txt',
          path: '/test/path/test-file.txt',
          size: 1024,
          mimeType: 'text/plain',
          category: 'input',
          status: 'uploaded',
        },
      });

      // Add workflow run in running state
      await prisma.workflowRun?.create({
        data: {
          projectId: testProjectId,
          status: 'running',
          startedAt: new Date(),
          config: {},
        },
      });

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/context`)
        .expect(200);

      expect(response.body).toMatchObject({
        state: 'workflow_active',
        routing: {
          canProceedToDashboard: true,
          nextStep: {
            action: 'continue_workflow',
            message: 'Continue with active workflow',
          },
          recommendedRoute: 'dashboard',
        },
      });
    });

    it('should return 404 for non-existent project', async () => {
      const fakeProjectId = 'non-existent-project-id';

      const response = await request(app)
        .get(`/api/projects/${fakeProjectId}/context`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should include file summary and workflow information', async () => {
      // Add multiple test files
      await prisma.projectFile?.createMany({
        data: [
          {
            projectId: testProjectId,
            name: 'input1.txt',
            originalName: 'input1.txt',
            path: '/test/input1.txt',
            size: 512,
            mimeType: 'text/plain',
            category: 'input',
            status: 'uploaded',
          },
          {
            projectId: testProjectId,
            name: 'input2.js',
            originalName: 'input2.js',
            path: '/test/input2.js',
            size: 1024,
            mimeType: 'application/javascript',
            category: 'input',
            status: 'uploaded',
          },
        ],
      });

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/context`)
        .expect(200);

      expect(response.body).toMatchObject({
        hasFiles: true,
        inputFileCount: 2,
        fileSummary: expect.objectContaining({
          totalFiles: 2,
          totalSize: 1536, // 512 + 1024
        }),
      });

      expect(response.body.project).toMatchObject({
        id: testProjectId,
        name: 'Test Project State Management',
      });
    });
  });

  describe('Integration with Frontend HomePage', () => {
    it('should support the routing decision workflow', async () => {
      // This test validates that the API response format
      // matches what the frontend HomePage expects

      const response = await request(app)
        .get(`/api/projects/${testProjectId}/context`)
        .expect(200);

      // Validate response structure matches ProjectContext interface
      expect(response.body).toHaveProperty('projectId');
      expect(response.body).toHaveProperty('project');
      expect(response.body).toHaveProperty('hasFiles');
      expect(response.body).toHaveProperty('state');
      expect(response.body).toHaveProperty('routing');

      expect(response.body.routing).toHaveProperty('canProceedToDashboard');
      expect(response.body.routing).toHaveProperty('nextStep');
      expect(response.body.routing).toHaveProperty('recommendedRoute');

      expect(response.body.routing.nextStep).toHaveProperty('action');
      expect(response.body.routing.nextStep).toHaveProperty('message');
    });
  });
});
