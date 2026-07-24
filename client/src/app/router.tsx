import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './layouts/AppShell'
import { AuthLayout } from './layouts/AuthLayout'
import { RequireAuth } from '@/features/auth'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { CallbackPage } from '@/features/auth/pages/CallbackPage'
import { RegisterPage } from '@/features/access-requests/pages/RegisterPage'
import {
  DashboardPage,
  StatisticsPage,
  ResourceAllocationPage,
  PerformanceRiskPage,
} from '@/features/dashboard'
import { MembersPage, LoginManagementPage, AccessControlMatrixPage } from '@/features/workspace'
import { ProjectsPage, ProjectDetailPage } from '@/features/projects'
import { NotificationsPage } from '@/features/notifications'
import { AuditPage } from '@/features/audit'

export const router = createBrowserRouter([
  // Public routes — no Zitadel session required.
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/auth/callback', element: <CallbackPage /> },
    ],
  },
  // Protected app — everything behind the Zitadel guard + app shell.
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
      { path: 'workspace', element: <MembersPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'resource-allocation', element: <ResourceAllocationPage /> },
      { path: 'performance-risk', element: <PerformanceRiskPage /> },
      { path: 'login-management', element: <LoginManagementPage /> },
      { path: 'access-control-matrix', element: <AccessControlMatrixPage /> },
      { path: 'audit', element: <AuditPage /> },
      // Not a left-nav tab (per UI.md) — reachable via the header bell's "View all".
      { path: 'notifications', element: <NotificationsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
