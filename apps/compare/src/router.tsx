import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ListingsDetailPage } from './pages/ListingsDetailPage.tsx'
import { ListingsPage } from './pages/ListingsPage.tsx'
import { EditListingsPage } from './pages/EditListingsPage.tsx'
import { ComparePage } from './pages/ComparePage'
import { ExportPage } from './pages/ExportPage'
import { InspectionPage } from './pages/InspectionPage'
import { LoginPage } from './pages/LoginPage'
import { NewListingsPage } from './pages/NewListingsPage.tsx'
import { QuestionsPage } from './pages/QuestionsPage'
import { RegisterPage } from './pages/RegisterPage'
import { SettingsPage } from './pages/SettingsPage'

export const AppRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/register',
    element: <RegisterPage />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/listings" replace /> },
      { path: 'listings', element: <ListingsPage /> },
      { path: 'listings/new', element: <NewListingsPage /> },
      { path: 'listings/:id/edit', element: <EditListingsPage /> },
      { path: 'listings/:id', element: <ListingsDetailPage /> },
      { path: 'listings/:id/inspect', element: <InspectionPage /> },
      { path: 'questions', element: <QuestionsPage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'export', element: <ExportPage /> },
      { path: 'settings', element: <SettingsPage /> }
    ]
  }
])
