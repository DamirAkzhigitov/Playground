import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { buildAuthLoginUrl, buildAuthRegisterUrl } from '@playground/auth-react'
import { AuthRedirect } from './components/AuthRedirect'
import { BrowsePage } from './pages/BrowsePage'
import { GroupComparePage } from './pages/GroupComparePage'
import { ItemsPage } from './pages/ItemsPage'
import { ItemDetailPage } from './pages/ItemDetailPage'
import { EditItemPage } from './pages/EditItemPage'
import { AddItemPage } from './pages/AddItemPage'
import { MyComparesPage } from './pages/MyComparesPage'
import { CompareGroupEditPage } from './pages/CompareGroupEditPage'
import { SpecEditorPage } from './pages/SpecEditorPage'
import { SettingsPage } from './pages/SettingsPage'

export const AppRouter = createBrowserRouter([
  {
    path: '/login',
    element: <AuthRedirect buildUrl={buildAuthLoginUrl} />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/register',
    element: <AuthRedirect buildUrl={buildAuthRegisterUrl} />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/compare/:groupId',
    element: <GroupComparePage />,
    errorElement: <RouteErrorBoundary />
  },
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <BrowsePage /> },
      {
        path: 'items',
        element: (
          <ProtectedRoute>
            <ItemsPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'items/:id',
        element: (
          <ProtectedRoute>
            <ItemDetailPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'items/:id/edit',
        element: (
          <ProtectedRoute>
            <EditItemPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'add-item',
        element: (
          <ProtectedRoute>
            <AddItemPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'my-compares',
        element: (
          <ProtectedRoute>
            <MyComparesPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'my-compares/new',
        element: (
          <ProtectedRoute>
            <CompareGroupEditPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'my-compares/:id',
        element: (
          <ProtectedRoute>
            <CompareGroupEditPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'item-types/:typeId/specs',
        element: (
          <ProtectedRoute>
            <SpecEditorPage />
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        )
      },
      { path: 'listings', element: <Navigate to="/items" replace /> },
      { path: 'questions', element: <Navigate to="/my-compares" replace /> },
      { path: 'compare', element: <Navigate to="/" replace /> }
    ]
  }
])
