import { createBrowserRouter } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { CataloguePage } from '@/pages/CataloguePage.tsx'

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        path: '',
        element: <CataloguePage />
      }
    ]
  }
])
