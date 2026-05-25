import { createBrowserRouter } from 'react-router-dom'

import { RouteErrorBoundary } from '@/components/RouteErrorBoundary'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { HomePage } from '@/pages/HomePage'
import { CatalogPage } from '@/pages/CatalogPage'
import { ActionPage } from '@/pages/ActionPage'
import { MyGuidesPage } from '@/pages/MyGuidesPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { ContributorHubPage } from '@/pages/ContributorHubPage'
import { ContributorNewActionPage } from '@/pages/ContributorNewActionPage'
import { ContributorEditActionPage } from '@/pages/ContributorEditActionPage'

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
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'actions', element: <CatalogPage /> },
      { path: 'actions/:slug', element: <ActionPage /> },
      {
        path: 'my',
        element: (
          <ProtectedRoute requiredRole="user">
            <MyGuidesPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'contributor',
        element: (
          <ProtectedRoute requiredRole="contributor">
            <ContributorHubPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'contributor/actions/new',
        element: (
          <ProtectedRoute requiredRole="contributor">
            <ContributorNewActionPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'contributor/actions/:id/edit',
        element: (
          <ProtectedRoute requiredRole="contributor">
            <ContributorEditActionPage />
          </ProtectedRoute>
        )
      }
    ]
  }
])
