import { createBrowserRouter } from 'react-router'
import { AppLayout } from './components/layout/AppLayout'

export const AppRouter = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />
  }
])
