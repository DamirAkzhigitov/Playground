import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { ApartmentDetailPage } from './pages/ApartmentDetailPage'
import { ApartmentsPage } from './pages/ApartmentsPage'
import { EditApartmentPage } from './pages/EditApartmentPage'
import { ComparePage } from './pages/ComparePage'
import { ExportPage } from './pages/ExportPage'
import { InspectionPage } from './pages/InspectionPage'
import { LoginPage } from './pages/LoginPage'
import { NewApartmentPage } from './pages/NewApartmentPage'
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
      { index: true, element: <Navigate to="/apartments" replace /> },
      { path: 'apartments', element: <ApartmentsPage /> },
      { path: 'apartments/new', element: <NewApartmentPage /> },
      { path: 'apartments/:id/edit', element: <EditApartmentPage /> },
      { path: 'apartments/:id', element: <ApartmentDetailPage /> },
      { path: 'apartments/:id/inspect', element: <InspectionPage /> },
      { path: 'questions', element: <QuestionsPage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'export', element: <ExportPage /> },
      { path: 'settings', element: <SettingsPage /> }
    ]
  }
])
