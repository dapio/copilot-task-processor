/**
 * Limitless Enterprise Dashboard - Główny interfejs w stylu Limitless
 * @description Dashboard używający oryginalnej struktury HTML Limitless
 */

import React, { memo } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import type { ProjectData } from '../types/dashboard.types';
import { OverviewDashboard } from './dashboard/OverviewDashboard';
import { ProjectsDashboard } from './dashboard/ProjectsDashboard';
import { AgentsDashboard } from './dashboard/AgentsDashboard';
import { ChatDashboard } from './dashboard/ChatDashboard';
import { MockupsDashboard } from './dashboard/MockupsDashboard';
import { WorkflowsDashboard } from './dashboard/WorkflowsDashboard';
import TaskManagementPanel from './TaskManagementPanel/TaskManagementPanel';

import { NewProjectModal } from './modals/NewProjectModal';
import { ProjectDetailsDashboard } from './dashboard/ProjectDetailsDashboard';

/**
 * Główny komponent Limitless Enterprise Dashboard
 */
export const LimitlessEnterpriseDashboard = memo(() => {
  const {
    state,
    projects,
    agents,
    conversations,
    metrics,
    isConnected,
    setActiveView,
    selectProject,
    createProject,
    updateState,
    refreshData,
  } = useDashboard();

  const menuItems = [
    { id: 'overview', icon: 'ph-house', label: 'Przegląd', count: null },
    {
      id: 'projects',
      icon: 'ph-folder',
      label: 'Projekty',
      count: projects.length,
    },
    {
      id: 'agents',
      icon: 'ph-robot',
      label: 'Zespół Agentów',
      count: agents.filter(a => a.status === 'online').length,
    },
    {
      id: 'chat',
      icon: 'ph-chats',
      label: 'Komunikacja',
      count: conversations.filter(c => c.unreadCount > 0).length,
    },
    { id: 'tasks', icon: 'ph-check-square', label: 'Zadania', count: null },
    { id: 'workflows', icon: 'ph-flow-arrow', label: 'Workflow', count: null },
    { id: 'mockups', icon: 'ph-image', label: 'Mockupy', count: null },
  ];

  const renderContent = () => {
    if (state.loading) {
      return (
        <div className="d-flex justify-content-center align-items-center min-vh-50">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Ładowanie...</span>
          </div>
        </div>
      );
    }

    if (state.error) {
      return (
        <div className="alert alert-danger" role="alert">
          <div className="d-flex align-items-center">
            <i className="ph-warning-circle me-2"></i>
            <div className="flex-grow-1">
              <strong>Błąd:</strong> {state.error}
            </div>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={refreshData}
            >
              <i className="ph-arrow-clockwise me-1"></i>
              Odśwież
            </button>
          </div>
        </div>
      );
    }

    // Jeśli wybrany projekt, pokaż szczegóły projektu
    if (state.selectedProject) {
      return (
        <ProjectDetailsDashboard
          project={state.selectedProject}
          onBack={() => selectProject(null)}
          onProjectUpdate={async updatedProject => {
            try {
              console.log('Updating project:', updatedProject.id);
              const response = await fetch(
                `/api/projects/${updatedProject.id}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(updatedProject),
                }
              );

              if (response.ok) {
                const updated = await response.json();
                selectProject(updated);
                console.log('Project updated successfully');
              } else {
                console.warn('API update failed, updating local state only');
                selectProject(updatedProject);
              }
            } catch (error) {
              console.error('Error updating project:', error);
              selectProject(updatedProject);
            }
          }}
        />
      );
    }

    switch (state.activeView) {
      case 'overview':
        return (
          <OverviewDashboard
            metrics={metrics}
            projects={projects}
            agents={agents}
          />
        );
      case 'projects':
        return (
          <ProjectsDashboard
            projects={projects}
            onSelectProject={selectProject}
            onUpdateProject={updateState}
            searchTerm={state.searchTerm}
          />
        );
      case 'agents':
        return (
          <AgentsDashboard
            agents={agents}
            onSelectAgent={agent => updateState({ selectedAgent: agent })}
            searchTerm={state.searchTerm}
          />
        );
      case 'chat':
        return (
          <ChatDashboard
            conversations={conversations}
            selectedProject={state.selectedProject}
            onSelectConversation={() => updateState({ selectedAgent: null })}
          />
        );
      case 'tasks':
        return state.selectedProject ? (
          <TaskManagementPanel
            projectId={(state.selectedProject as ProjectData).id}
          />
        ) : (
          <div className="alert alert-info">
            <i className="ph-info me-2"></i>
            Wybierz projekt, aby zarządzać zadaniami.
          </div>
        );
      case 'workflows':
        return <WorkflowsDashboard projects={projects} />;
      case 'mockups':
        return <MockupsDashboard projects={projects} />;
      default:
        return (
          <OverviewDashboard
            metrics={metrics}
            projects={projects}
            agents={agents}
          />
        );
    }
  };

  return (
    <>
      {/* Main navbar */}
      <div className="navbar navbar-dark navbar-expand-lg navbar-static border-bottom border-bottom-white border-opacity-10">
        <div className="container-fluid">
          <div className="d-flex d-lg-none me-2">
            <button
              type="button"
              className="navbar-toggler sidebar-mobile-main-toggle rounded-pill"
              title="Toggle menu"
            >
              <i className="ph-list"></i>
            </button>
          </div>

          <div className="navbar-brand flex-1 flex-lg-0">
            <a
              href="#"
              className="d-inline-flex align-items-center text-decoration-none"
            >
              <i className="ph-activity text-primary fs-3 me-2"></i>
              <span className="text-white fw-bold">ThinkCode AI Platform</span>
              <span
                className={`badge ms-2 ${
                  isConnected ? 'bg-success' : 'bg-danger'
                }`}
                title={
                  isConnected
                    ? 'Połączono z backendem'
                    : 'Rozłączono z backendem'
                }
              >
                {isConnected ? 'Online' : 'Offline'}
              </span>
            </a>
          </div>

          <ul className="nav flex-row">
            <li className="nav-item">
              <button
                type="button"
                className="btn btn-primary btn-sm rounded-pill"
                onClick={() => updateState({ showNewProjectModal: true })}
                title="Nowy projekt"
              >
                <i className="ph-plus me-1"></i>
                Nowy projekt
              </button>
            </li>

            <li className="nav-item ms-2">
              <a
                href="#"
                className="navbar-nav-link navbar-nav-link-icon rounded-pill"
                title="Powiadomienia"
              >
                <i className="ph-bell"></i>
              </a>
            </li>

            <li className="nav-item">
              <a
                href="#"
                className="navbar-nav-link navbar-nav-link-icon rounded-pill"
                title="Ustawienia"
              >
                <i className="ph-gear"></i>
              </a>
            </li>
          </ul>

          {/* Search bar */}
          <div className="navbar-collapse justify-content-center flex-lg-1 order-2 order-lg-1">
            <div className="navbar-search flex-fill position-relative mt-2 mt-lg-0 mx-lg-3">
              <div className="form-control-feedback form-control-feedback-start flex-grow-1">
                <input
                  type="text"
                  className="form-control bg-transparent rounded-pill"
                  placeholder="Szukaj projektów, agentów, zadań..."
                  value={state.searchTerm}
                  onChange={e => updateState({ searchTerm: e.target.value })}
                />
                <div className="form-control-feedback-icon">
                  <i className="ph-magnifying-glass"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content">
        {/* Main sidebar */}
        <div className="sidebar sidebar-dark sidebar-main sidebar-expand-lg">
          {/* Sidebar content */}
          <div className="sidebar-content">
            {/* Sidebar header */}
            <div className="sidebar-section">
              <div className="sidebar-section-body d-flex justify-content-center">
                <h5 className="sidebar-resize-hide flex-grow-1 my-auto">
                  Nawigacja
                </h5>
                <div>
                  <button
                    type="button"
                    className="btn btn-flat-white btn-icon btn-sm rounded-pill border-transparent sidebar-control sidebar-main-resize d-none d-lg-inline-flex"
                    title="Toggle sidebar width"
                  >
                    <i className="ph-arrows-left-right"></i>
                  </button>
                  <button
                    type="button"
                    className="btn btn-flat-white btn-icon btn-sm rounded-pill border-transparent sidebar-mobile-main-toggle d-lg-none"
                    title="Close sidebar"
                  >
                    <i className="ph-x"></i>
                  </button>
                </div>
              </div>
            </div>
            {/* /sidebar header */}

            {/* Main navigation */}
            <div className="sidebar-section">
              <ul className="nav nav-sidebar" data-nav-type="accordion">
                {/* Main */}
                <li className="nav-item-header pt-0">
                  <div className="text-uppercase fs-sm lh-sm opacity-50 sidebar-resize-hide">
                    Menu główne
                  </div>
                  <i className="ph-dots-three sidebar-resize-show"></i>
                </li>

                {menuItems.map(item => (
                  <li key={item.id} className="nav-item">
                    <a
                      href="#"
                      className={`nav-link ${
                        state.activeView === item.id ? 'active' : ''
                      }`}
                      onClick={e => {
                        e.preventDefault();
                        setActiveView(item.id as any);
                      }}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                      {item.count !== null && (
                        <span className="badge bg-primary rounded-pill ms-auto">
                          {item.count}
                        </span>
                      )}
                    </a>
                  </li>
                ))}

                {/* Spacer */}
                <li className="nav-item-header">
                  <div className="text-uppercase fs-sm lh-sm opacity-50 sidebar-resize-hide">
                    System
                  </div>
                  <i className="ph-dots-three sidebar-resize-show"></i>
                </li>

                <li className="nav-item">
                  <a
                    href="#"
                    className="nav-link"
                    onClick={() => refreshData()}
                  >
                    <i className="ph-arrow-clockwise"></i>
                    <span>Odśwież dane</span>
                  </a>
                </li>
              </ul>
            </div>
            {/* /main navigation */}
          </div>
          {/* /sidebar content */}
        </div>
        {/* /main sidebar */}

        {/* Main content */}
        <div className="content-wrapper">
          {/* Inner content */}
          <div className="content-inner">
            {/* Page header */}
            <div className="page-header page-header-light shadow-sm">
              <div className="page-header-content d-lg-flex">
                <div className="d-flex">
                  <h4 className="page-title mb-0">
                    {menuItems.find(item => item.id === state.activeView)
                      ?.label || 'Dashboard'}
                    {state.selectedProject && (
                      <span className="text-muted">
                        {' '}
                        - {state.selectedProject.name}
                      </span>
                    )}
                  </h4>
                </div>
              </div>
            </div>
            {/* /page header */}

            {/* Content area */}
            <div className="content">{renderContent()}</div>
            {/* /content area */}
          </div>
          {/* /inner content */}
        </div>
        {/* /main content */}
      </div>

      {/* Modals */}
      {state.showNewProjectModal && (
        <NewProjectModal
          isOpen={state.showNewProjectModal}
          onClose={() => updateState({ showNewProjectModal: false })}
          onSubmit={createProject}
          isLoading={state.loading}
        />
      )}
    </>
  );
});

LimitlessEnterpriseDashboard.displayName = 'LimitlessEnterpriseDashboard';

export default LimitlessEnterpriseDashboard;
