/**
 * Dashboard Types - Definicje typów dla enterprise dashboard
 * @description Centralne miejsce dla wszystkich typów używanych w dashboard
 */

export interface Agent {
  id: string;
  name: string;
  role: string;
  description?: string;
  status: 'online' | 'offline' | 'busy';
  specialty?: string;
  avatar?: string;
  currentTask?: string;
  completedTasks?: number;
  successRate?: number;
}

export interface ProjectData {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress: number;
  startDate: string;
  endDate?: string;
  team: string[];
  tasks: TaskData[];
  workflow?: WorkflowData;
  client?: string;
  budget?: number;
  technologies?: string[];
}

export interface TaskData {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignee: string;
  dueDate?: string;
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
}

export interface WorkflowData {
  id: string;
  name: string;
  type: 'new-project' | 'existing-project' | 'maintenance';
  steps: WorkflowStep[];
  currentStep: number;
  status: 'running' | 'paused' | 'completed' | 'failed';
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedAgent?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies?: string[];
  outputs?: string[];
}

export interface ConversationData {
  id: string;
  title: string;
  participants: string[];
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  projectId?: string;
  taskId?: string;
  type: 'general' | 'project' | 'support' | 'agent';
}

export interface MessageData {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'agent';
  timestamp: string;
  attachments?: string[];
  sender?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MockupData {
  id: string;
  projectId: string;
  name: string;
  description: string;
  imageUrl: string;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  version: number;
  createdBy: string;
  createdAt: string;
  approvals: MockupApproval[];
  comments: MockupComment[];
}

export interface MockupApproval {
  id: string;
  userId: string;
  status: 'approved' | 'rejected' | 'pending';
  comment?: string;
  timestamp: string;
}

export interface MockupComment {
  id: string;
  userId: string;
  content: string;
  timestamp: string;
  position?: { x: number; y: number };
}

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  activeAgents: number;
  averageProjectCompletion: number;
  monthlyProjectsCompleted: number;
}

export type DashboardView =
  | 'overview'
  | 'projects'
  | 'agents'
  | 'chat'
  | 'tasks'
  | 'workflows'
  | 'mockups'
  | 'documents'
  | 'research'
  | 'settings';

export interface DashboardState {
  activeView: DashboardView;
  selectedProject: ProjectData | null;
  selectedAgent: Agent | null;
  searchTerm: string;
  loading: boolean;
  error: string | null;
  showNewProjectModal: boolean;
  showNewConversationModal: boolean;
  showMockupApprovalModal: boolean;
}
