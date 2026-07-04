import { createBrowserRouter } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'
import { CataloguePage } from '@/Pages/CataloguePage.tsx'

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
