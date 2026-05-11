import { createBrowserRouter, Navigate } from 'react-router-dom'

import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { AppLayout } from './components/layout/AppLayout'
import { ApartmentDetailPage } from './pages/ApartmentDetailPage'
import { ApartmentsPage } from './pages/ApartmentsPage'
import { ComparePage } from './pages/ComparePage'
import { ExportPage } from './pages/ExportPage'
import { InspectionPage } from './pages/InspectionPage'
import { NewApartmentPage } from './pages/NewApartmentPage'
import { QuestionsPage } from './pages/QuestionsPage'

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <Navigate to="/apartments" replace /> },
      { path: 'apartments', element: <ApartmentsPage /> },
      { path: 'apartments/new', element: <NewApartmentPage /> },
      { path: 'apartments/:id', element: <ApartmentDetailPage /> },
      { path: 'apartments/:id/inspect', element: <InspectionPage /> },
      { path: 'questions', element: <QuestionsPage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'export', element: <ExportPage /> }
    ]
  }
])
